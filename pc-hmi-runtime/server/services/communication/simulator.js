class SimulatorDriver {
  constructor(tagService, alarmService) {
    this.tagService = tagService;
    this.alarmService = alarmService;
    this.connected = false;
    this.interval = null;
    this.tick = 0;
  }

  connect() {
    this.connected = true;
    this.seedValues();
    this.interval = setInterval(() => this.update(), 1000);
    return { connected: true, driver: 'simulator' };
  }

  disconnect() {
    this.connected = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  seedValues() {
    this.tagService.set('System.AutoMode', true);
    this.tagService.set('System.Healthy', true);
    this.tagService.set('System.Running', true);
    this.tagService.set('Production.Count', 1247);
    this.tagService.set('Production.Rate', 342.5);
    this.tagService.set('Production.Efficiency', 87.3);
    this.tagService.set('Recipe.Active', 'Standard Batch A');
    this.tagService.set('Recipe.Number', 1);
    this.tagService.set('Alarm.EStop', false);
    this.tagService.set('Alarm.DoorOpen', false);
    this.tagService.set('Alarm.LowAir', false);
    this.tagService.set('Alarm.MotorFault', false);
    this.tagService.set('Alarm.HighTemp', false);
  }

  update() {
    if (!this.connected) return;
    this.tick++;

    const count = this.tagService.get('Production.Count');
    if (count && this.tagService.get('System.Running')?.value) {
      this.tagService.set('Production.Count', count.value + Math.floor(Math.random() * 3));
    }

    const rate = 320 + Math.sin(this.tick * 0.1) * 30 + Math.random() * 10;
    this.tagService.set('Production.Rate', Math.round(rate * 10) / 10);

    const eff = 85 + Math.sin(this.tick * 0.05) * 5;
    this.tagService.set('Production.Efficiency', Math.round(eff * 10) / 10);

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

    this.alarmService.evaluate();
  }

  getStatus() {
    return {
      connected: this.connected,
      driver: 'simulator',
      quality: 'good'
    };
  }
}

module.exports = { SimulatorDriver };
