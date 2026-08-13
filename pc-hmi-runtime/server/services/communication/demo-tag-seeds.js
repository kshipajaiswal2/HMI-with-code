/** Demo / offline tag values for HMI screens until live PLC polling is active. */
function seedDemoTagValues(tagService) {
  const seeds = {
    'System.AutoMode': true,
    'System.Running': true,
    'System.Healthy': true,
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
    'Safety.S_All_E_Stop_Healthy': true,
    'Safety.RIO01_SDI_01': true,
    'Safety.RIO01_SDI_02': true,
    'Safety.RIO01_SDI_03': true,
    'Safety.RIO01_SDI_04': true,
    'Prestart.PowerOK': false,
    'Prestart.AirOK': false,
    'Prestart.SafetyOK': false,
    'Prestart.Ready': false,
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
    if (tagService.get(name)) tagService.set(name, value);
  }
}

module.exports = { seedDemoTagValues };
