const net = require('net');

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
  }

  get ipAddress() {
    return String(this.config.plcIpAddress || '').trim();
  }

  async connect() {
    this.stopTimers();
    const ip = this.ipAddress;
    if (!ip) {
      this.connected = false;
      this.lastError = 'PLC IP address is not configured';
      this.syncCommTags(false);
      this.scheduleReconnect();
      return { connected: false, driver: 'ethernet-ip', error: this.lastError };
    }

    const probe = await probePlc(ip, this.config.plcPort || DEFAULT_PORT);
    this.connected = probe.ok;
    this.lastError = probe.ok ? '' : (probe.error || 'PLC unreachable');
    this.syncCommTags(probe.ok);

    if (probe.ok) {
      this.interval = setInterval(() => this.pulse(), this.config.pollIntervalMs || 200);
    } else {
      this.scheduleReconnect();
    }

    return {
      connected: this.connected,
      driver: 'ethernet-ip',
      plcIpAddress: ip,
      path: this.config.path || '0',
      error: this.lastError || undefined
    };
  }

  disconnect() {
    this.stopTimers();
    this.connected = false;
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

  scheduleReconnect() {
    const delay = this.config.reconnectIntervalMs || 5000;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  syncCommTags(connected) {
    this.tagService.set('Comm.PLCConnected', connected);
    this.tagService.set('Comm.ScanRate', this.config.pollIntervalMs || 200);
    if (this.tagLogicService) this.tagLogicService.evaluate();
    if (this.alarmService) this.alarmService.evaluate();
  }

  pulse() {
    if (!this.connected) return;
    this.tagService.set('Comm.ScanRate', this.config.pollIntervalMs || 200);
  }

  getStatus() {
    return {
      connected: this.connected,
      driver: 'ethernet-ip',
      plcIpAddress: this.ipAddress || null,
      path: this.config.path || '0',
      quality: this.connected ? 'good' : 'bad',
      error: this.lastError || undefined
    };
  }

  static async testConnection(ip, port = DEFAULT_PORT) {
    return probePlc(ip, port);
  }
}

module.exports = { EthernetIpDriver, probePlc, isValidIpv4 };
