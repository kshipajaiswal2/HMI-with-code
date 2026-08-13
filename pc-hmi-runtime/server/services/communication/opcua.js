const { probePlc, isValidIpv4 } = require('./ethernet-ip');

const DEFAULT_OPCUA_PORT = 4840;

class OpcUaDriver {
  constructor(config, tagService, alarmService, tagLogicService) {
    this.config = config || {};
    this.tagService = tagService;
    this.alarmService = alarmService;
    this.tagLogicService = tagLogicService;
    this.connected = false;
    this.lastError = '';
    this.reconnectTimer = null;
  }

  get ipAddress() {
    return String(this.config.plcIpAddress || '').trim();
  }

  get endpoint() {
    const ip = this.ipAddress;
    if (!ip) return '';
    const port = this.config.opcua?.port || DEFAULT_OPCUA_PORT;
    return `opc.tcp://${ip}:${port}`;
  }

  async connect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const ip = this.ipAddress;
    if (!ip) {
      this.connected = false;
      this.lastError = 'PLC IP address is not configured';
      this.syncCommTags(false);
      this.scheduleReconnect();
      return { connected: false, driver: 'opcua', error: this.lastError };
    }

    if (!isValidIpv4(ip)) {
      this.connected = false;
      this.lastError = 'Invalid IP address';
      this.syncCommTags(false);
      this.scheduleReconnect();
      return { connected: false, driver: 'opcua', error: this.lastError };
    }

    const port = this.config.opcua?.port || DEFAULT_OPCUA_PORT;
    const probe = await probePlc(ip, port);
    this.connected = probe.ok;
    this.lastError = probe.ok ? '' : (probe.error || 'OPC UA server unreachable');
    this.syncCommTags(probe.ok);

    if (!probe.ok) this.scheduleReconnect();
    return {
      connected: this.connected,
      driver: 'opcua',
      plcIpAddress: ip,
      endpoint: this.endpoint,
      error: this.lastError || undefined
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connected = false;
    this.syncCommTags(false);
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

  getStatus() {
    return {
      connected: this.connected,
      driver: 'opcua',
      plcIpAddress: this.ipAddress || null,
      endpoint: this.endpoint || null,
      quality: this.connected ? 'good' : 'bad',
      error: this.lastError || undefined
    };
  }
}

module.exports = { OpcUaDriver };
