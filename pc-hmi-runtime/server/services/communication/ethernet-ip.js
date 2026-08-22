const net = require('net');
const { Controller, TagGroup } = require('st-ethernet-ip');
const {
  isSystemTag,
  collectPollTagNames,
  createPlcTag,
  coercePlcValue,
  coerceWriteValue
} = require('./plc-tag-utils');

const DEFAULT_PORT = 44818;
const CONNECT_TIMEOUT_MS = 4000;

function isValidIpv4(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function probePlc(ip, port = DEFAULT_PORT, timeoutMs = CONNECT_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (!isValidIpv4(ip)) {
      resolve({ ok: false, error: 'Invalid IP address' });
      return;
    }
    const socket = new net.Socket();
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish({ ok: true }));
    socket.once('timeout', () => finish({ ok: false, error: 'Connection timed out' }));
    socket.once('error', (err) => finish({ ok: false, error: err.message || 'Connection failed' }));
    socket.connect(port, ip.trim());
  });
}

class EthernetIpDriver {
  constructor(config, tagService, alarmService, tagLogicService) {
    this.config = config || {};
    this.tagService = tagService;
    this.alarmService = alarmService;
    this.tagLogicService = tagLogicService;
    this.connected = false;
    this.lastError = '';
    this.interval = null;
    this.reconnectTimer = null;
    this.plc = null;
    this.tagGroup = new TagGroup();
    this.plcTagMap = new Map();
    this.pollInFlight = false;
    this.pollDirty = true;
    this.sessionId = 0;
    this.disposed = false;
  }

  get ipAddress() {
    return String(this.config.plcIpAddress || '').trim();
  }

  get slot() {
    const path = String(this.config.path ?? '0').trim();
    const n = Number(path);
    return Number.isFinite(n) ? n : 0;
  }

  isActiveSession(sessionId) {
    return !this.disposed && sessionId === this.sessionId;
  }

  async connect() {
    this.disposed = false;
    this.sessionId += 1;
    const sessionId = this.sessionId;
    this.stopTimers();
    const ip = this.ipAddress;
    if (!ip) {
      this.connected = false;
      this.lastError = 'PLC IP address is not configured';
      this.syncCommTags(false);
      this.scheduleReconnect(sessionId);
      return { connected: false, driver: 'ethernet-ip', error: this.lastError };
    }

    try {
      if (this.plc) {
        try { this.plc.destroy?.(); } catch { /* ignore */ }
        this.plc = null;
      }
      this.plc = new Controller();
      await this.plc.connect(ip, this.slot);
      if (!this.isActiveSession(sessionId)) {
        try { this.plc.destroy?.(); } catch { /* ignore */ }
        return { connected: false, driver: 'ethernet-ip', error: 'Connection superseded' };
      }
      this.connected = true;
      this.lastError = '';
      this.pollDirty = true;
      this.syncCommTags(true);
      await this.refreshPollTags();
      const pollMs = this.config.pollIntervalMs || 200;
      this.interval = setInterval(() => {
        this.poll(sessionId).catch(() => {});
      }, pollMs);
      await this.poll(sessionId);
      return {
        connected: true,
        driver: 'ethernet-ip',
        plcIpAddress: ip,
        path: String(this.slot),
        quality: 'good'
      };
    } catch (err) {
      if (!this.isActiveSession(sessionId)) {
        return { connected: false, driver: 'ethernet-ip', error: 'Connection superseded' };
      }
      this.connected = false;
      this.lastError = err.message || 'PLC connection failed';
      this.syncCommTags(false);
      this.scheduleReconnect(sessionId);
      return {
        connected: false,
        driver: 'ethernet-ip',
        plcIpAddress: ip,
        path: String(this.slot),
        error: this.lastError
      };
    }
  }

  disconnect() {
    this.disposed = true;
    this.sessionId += 1;
    this.stopTimers();
    this.connected = false;
    this.plcTagMap.clear();
    this.tagGroup = new TagGroup();
    if (this.plc) {
      try { this.plc.destroy?.(); } catch { /* ignore */ }
      this.plc = null;
    }
    this.syncCommTags(false);
  }

  stopTimers() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  scheduleReconnect(sessionId) {
    if (this.disposed) return;
    const delay = this.config.reconnectIntervalMs || 5000;
    this.reconnectTimer = setTimeout(() => {
      if (!this.isActiveSession(sessionId)) return;
      this.connect().catch(() => {});
    }, delay);
  }

  syncCommTags(connected) {
    this.tagService.set('Comm.PLCConnected', connected);
    this.tagService.set('Comm.ScanRate', this.config.pollIntervalMs || 200);
    if (this.tagLogicService) this.tagLogicService.evaluate();
    if (this.alarmService) this.alarmService.evaluate();
  }

  onSubscriptionsChanged() {
    this.pollDirty = true;
    if (this.connected && !this.disposed) {
      this.poll(this.sessionId).catch(() => {});
    }
  }

  async refreshPollTags() {
    const names = collectPollTagNames(this.tagService, this.alarmService, this.tagLogicService);
    this.tagGroup = new TagGroup();
    this.plcTagMap.clear();
    for (const name of names) {
      try {
        const plcTag = createPlcTag(this.tagService, name);
        this.plcTagMap.set(name, plcTag);
        this.tagGroup.add(plcTag);
      } catch {
        /* skip invalid tag names */
      }
    }
    this.pollDirty = false;
  }

  async poll(sessionId = this.sessionId) {
    if (!this.isActiveSession(sessionId)) return;
    if (!this.connected || !this.plc || this.pollInFlight) return;
    if (this.pollDirty || this.plcTagMap.size === 0) {
      await this.refreshPollTags();
    }
    if (!this.isActiveSession(sessionId) || this.plcTagMap.size === 0) return;

    this.pollInFlight = true;
    try {
      await this.plc.readTagGroup(this.tagGroup);
      if (!this.isActiveSession(sessionId)) return;
      for (const [name, plcTag] of this.plcTagMap) {
        const hmiTag = this.tagService.get(name);
        if (!hmiTag) continue;
        const value = coercePlcValue(plcTag.value, hmiTag.type);
        this.tagService.set(name, value, 'good');
      }
      this.tagService.set('Comm.PLCConnected', true, 'good');
      this.tagService.set('Comm.ScanRate', this.config.pollIntervalMs || 200, 'good');
      if (this.tagLogicService) this.tagLogicService.evaluate();
      if (this.alarmService) this.alarmService.evaluate();
    } catch (err) {
      if (this.isActiveSession(sessionId)) this.handlePollError(err, sessionId);
    } finally {
      this.pollInFlight = false;
    }
  }

  handlePollError(err, sessionId) {
    if (!this.isActiveSession(sessionId)) return;
    this.lastError = err.message || 'PLC poll failed';
    this.connected = false;
    for (const name of this.plcTagMap.keys()) {
      const tag = this.tagService.get(name);
      if (tag) {
        tag.quality = 'bad';
        tag.timestamp = Date.now();
        this.tagService.emit('change', {
          name,
          value: tag.value,
          quality: 'bad',
          timestamp: tag.timestamp
        });
      }
    }
    this.tagService.set('Comm.PLCConnected', false, 'bad');
    if (this.tagLogicService) this.tagLogicService.evaluate();
    if (this.alarmService) this.alarmService.evaluate();
    this.scheduleReconnect(sessionId);
  }

  async writeTag(name, value) {
    if (isSystemTag(name)) throw new Error(`${name} is read-only`);
    if (this.tagLogicService?.isComputed?.(name)) {
      throw new Error(`${name} is computed and cannot be written`);
    }
    const hmiTag = this.tagService.get(name);
    if (!hmiTag) throw new Error(`Unknown tag: ${name}`);
    if (!this.connected || !this.plc || this.disposed) throw new Error('PLC not connected');

    let plcTag = this.plcTagMap.get(name);
    if (!plcTag) {
      plcTag = createPlcTag(this.tagService, name);
      this.plcTagMap.set(name, plcTag);
      this.tagGroup.add(plcTag);
    }

    try {
      await this.plc.readTag(plcTag);
    } catch {
      /* write may still succeed for atomic types */
    }

    const writeValue = coerceWriteValue(value, hmiTag.type);
    plcTag.value = writeValue;
    await this.plc.writeTag(plcTag);
    this.tagService.set(name, writeValue, 'good');
    if (this.tagLogicService) this.tagLogicService.evaluate();
    if (this.alarmService) this.alarmService.evaluate();
    return true;
  }

  getStatus() {
    return {
      connected: this.connected,
      driver: 'ethernet-ip',
      plcIpAddress: this.ipAddress || null,
      path: String(this.slot),
      quality: this.connected ? 'good' : 'bad',
      error: this.lastError || undefined,
      pollTags: this.plcTagMap.size
    };
  }

  static async testConnection(ip, port = DEFAULT_PORT, slot = 0) {
    if (!isValidIpv4(ip)) return { ok: false, error: 'Invalid IP address' };
    const probe = await probePlc(ip, port);
    if (!probe.ok) return probe;
    const plc = new Controller();
    try {
      await plc.connect(ip, slot);
      const props = plc.properties || {};
      plc.destroy?.();
      return {
        ok: true,
        controller: props.name || 'Connected',
        version: props.version || undefined
      };
    } catch (err) {
      try { plc.destroy?.(); } catch { /* ignore */ }
      return { ok: false, error: err.message || 'EtherNet/IP session failed' };
    }
  }
}

module.exports = { EthernetIpDriver, probePlc, isValidIpv4 };
