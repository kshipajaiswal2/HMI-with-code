const net = require('net');
const { EtherIP } = require('st-ethernet-ip');

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
    this.readTags = [];
    this.writePending = {};
    this.lastWriteTime = {};
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

    try {
      // Initialize EtherNet/IP controller
      this.plc = new EtherIP.Controller();
      this.plc.setEngineMode(0, true); // Slot 0, Backplane
      
      // Attempt connection
      await this.plc.connect(ip, this.config.plcPort || DEFAULT_PORT);
      this.connected = true;
      this.lastError = '';
      this.syncCommTags(true);
      
      // Build read tag list from tag service definitions
      this.readTags = this.buildReadTagList();
      
      // Start polling
      this.interval = setInterval(() => this.poll(), this.config.pollIntervalMs || 200);
      
      return {
        connected: true,
        driver: 'ethernet-ip',
        plcIpAddress: ip,
        path: this.config.path || '0',
        tagCount: this.readTags.length
      };
    } catch (err) {
      this.connected = false;
      this.lastError = err.message || 'Failed to connect to PLC';
      this.syncCommTags(false);
      this.scheduleReconnect();
      
      return {
        connected: false,
        driver: 'ethernet-ip',
        plcIpAddress: ip,
        error: this.lastError
      };
    }
  }

  buildReadTagList() {
    // Extract all PLC-bound tags that should be read from the controller
    const tags = [];
    for (const [tagName, tagDef] of this.tagService.tags.entries()) {
      // Skip system and computed tags
      if (!tagName.startsWith('Comm.') && !tagName.startsWith('System.') && 
          !this.tagLogicService?.isComputed?.(tagName)) {
        // Use tag name as EtherNet/IP tag reference
        tags.push(tagName);
      }
    }
    return tags;
  }

  async poll() {
    if (!this.connected || !this.plc) return;

    try {
      // Read tags from PLC
      if (this.readTags.length > 0) {
        const values = await this.plc.readTag(this.readTags);
        if (values && Array.isArray(values.values)) {
          values.values.forEach((val, idx) => {
            const tagName = this.readTags[idx];
            if (val !== undefined && val !== null) {
              this.tagService.set(tagName, val);
            }
          });
        }
      }

      // Process any pending writes
      this.processPendingWrites();

      // Update scan rate
      this.tagService.set('Comm.ScanRate', this.config.pollIntervalMs || 200);

      if (this.tagLogicService) {
        this.tagLogicService.evaluate();
      }
      this.alarmService?.evaluate?.();
    } catch (err) {
      console.error('EtherNet/IP poll error:', err.message);
      this.connected = false;
      this.lastError = err.message;
      this.syncCommTags(false);
      this.scheduleReconnect();
    }
  }

  async processPendingWrites() {
    const now = Date.now();
    const tagsToWrite = Object.entries(this.writePending)
      .filter(([tag, info]) => now - info.time > 50) // Batch writes every 50ms
      .map(([tag]) => tag);

    if (tagsToWrite.length === 0) return;

    try {
      const writeOps = tagsToWrite.map(tag => ({
        tag,
        value: this.writePending[tag].value
      }));

      await this.plc.writeTag(writeOps);

      // Clear written tags
      tagsToWrite.forEach(tag => delete this.writePending[tag]);
    } catch (err) {
      console.error('EtherNet/IP write error:', err.message);
    }
  }

  writeTagToPLC(tag, value) {
    if (!this.connected || !this.plc) {
      throw new Error('PLC not connected');
    }
    // Queue write operation
    this.writePending[tag] = { value, time: Date.now() };
  }

  disconnect() {
    this.stopTimers();
    if (this.plc) {
      this.plc.destroy?.();
      this.plc = null;
    }
    this.connected = false;
    this.writePending = {};
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

  getStatus() {
    return {
      connected: this.connected,
      driver: 'ethernet-ip',
      plcIpAddress: this.ipAddress || null,
      path: this.config.path || '0',
      quality: this.connected ? 'good' : 'bad',
      error: this.lastError || undefined,
      tagCount: this.readTags.length,
      pendingWrites: Object.keys(this.writePending).length
    };
  }

  static async testConnection(ip, port = DEFAULT_PORT) {
    return probePlc(ip, port);
  }
}

module.exports = { EthernetIpDriver, probePlc, isValidIpv4 };
