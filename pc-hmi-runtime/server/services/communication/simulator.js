const { seedDemoTagValues } = require('./demo-tag-seeds');

class SimulatorDriver {
  constructor(config, tagService, alarmService, tagLogicService) {
    this.config = config || {};
    this.tagService = tagService;
    this.alarmService = alarmService;
    this.tagLogicService = tagLogicService;
    this.connected = false;
    this.interval = null;
    this.tick = 0;
  }

  connect() {
    this.connected = true;
    this.seedValues();
    this.interval = setInterval(() => this.update(), 1000);
    return {
      connected: true,
      driver: 'simulator',
      plcIpAddress: this.config.plcIpAddress || null
    };
  }

  disconnect() {
    this.connected = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  seedValues() {
    seedDemoTagValues(this.tagService);
  }

  update() {
    if (!this.connected) return;
    this.tick++;

    const count = this.tagService.get('Production.Count');
    if (count?.value && this.tagService.get('System.Running')?.value) {
      this.tagService.set('Production.Count', count.value + Math.floor(Math.random() * 3));
    }

    const rate = 320 + Math.sin(this.tick * 0.1) * 30 + Math.random() * 10;
    this.tagService.set('Production.Rate', Math.round(rate * 10) / 10);

    const eff = 85 + Math.sin(this.tick * 0.05) * 5;
    this.tagService.set('Production.Efficiency', Math.round(eff * 10) / 10);

    const cycle = 4.2 + Math.sin(this.tick * 0.08) * 0.3;
    this.tagService.set('CycleTime.Last', Math.round(cycle * 10) / 10);

    const level = 70 + Math.sin(this.tick * 0.06) * 8;
    this.tagService.set('IO.AI_001', Math.round(level * 10) / 10);

    if (this.tick % 30 === 0) {
      this.tagService.set('Alarm.LowAir', Math.random() > 0.7);
    }
    if (this.tick % 45 === 0) {
      this.tagService.set('Alarm.HighTemp', Math.random() > 0.8);
      setTimeout(() => this.tagService.set('Alarm.HighTemp', false), 8000);
    }
    if (this.tick % 60 === 0) {
      this.tagService.set('Alarm.MotorFault', Math.random() > 0.85);
      setTimeout(() => this.tagService.set('Alarm.MotorFault', false), 12000);
    }

    if (this.tagLogicService) {
      this.tagLogicService.evaluate();
    }

    this.tagService.syncConnections();
    this.alarmService.evaluate();
  }

  writeTag(name, value) {
    const { isSystemTag } = require('./plc-tag-utils');
    if (isSystemTag(name)) throw new Error(`${name} is read-only`);
    if (this.tagLogicService?.isComputed?.(name)) {
      throw new Error(`${name} is computed and cannot be written`);
    }
    const ok = this.tagService.set(name, value);
    if (!ok) throw new Error(`Unknown tag: ${name}`);
    if (this.tagLogicService) this.tagLogicService.evaluate();
    if (this.alarmService) this.alarmService.evaluate();
    return true;
  }

  getStatus() {
    return {
      connected: this.connected,
      driver: 'simulator',
      plcIpAddress: this.config.plcIpAddress || null,
      quality: 'good',
      mode: 'simulator'
    };
  }
}

module.exports = { SimulatorDriver };
