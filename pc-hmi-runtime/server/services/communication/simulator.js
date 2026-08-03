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
    const seeds = {
      'System.AutoMode': true,
      'System.Healthy': true,
      'System.Running': true,
      'Production.Count': 1247,
      'Production.Rate': 342.5,
      'Production.Efficiency': 87.3,
      'Production.Target': 2000,
      'Production.Rejects': 12,
      'Recipe.Active': 'Standard Batch A',
      'Recipe.Number': 1,
      'Recipe.DownloadReady': true,
      'Settings.SpeedSetpoint': 100.0,
      'Settings.TempSetpoint': 65.0,
      'Settings.AutoStart': true,
      'Manual.ConveyorRun': false,
      'Manual.PumpRun': false,
      'Manual.VFD_Speed': 0,
      'Safety.EStopOK': true,
      'Safety.DoorClosed': true,
      'Safety.LightCurtainOK': true,
      'Prestart.PowerOK': true,
      'Prestart.AirOK': true,
      'Prestart.SafetyOK': true,
      'Prestart.Ready': true,
      'Comm.PLCConnected': true,
      'Comm.ScanRate': 10.2,
      'CycleTime.Last': 4.2,
      'CycleTime.Average': 4.5,
      'CycleTime.Best': 3.8,
      'IO.DI_001': false,
      'IO.DI_002': false,
      'IO.DI_003': false,
      'IO.DO_001': true,
      'IO.DO_002': false,
      'IO.AI_001': 72.5,
      'Alarm.EStop': false,
      'Alarm.DoorOpen': false,
      'Alarm.LowAir': false,
      'Alarm.MotorFault': false,
      'Alarm.HighTemp': false
    };
    for (const [name, value] of Object.entries(seeds)) {
      this.tagService.set(name, value);
    }
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
