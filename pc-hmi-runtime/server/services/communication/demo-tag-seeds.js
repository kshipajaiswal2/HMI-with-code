function seedDemoTagValues(tagService) {
  const seeds = {
    'System.AutoMode': true,
    'System.Running': true,
    'System.Healthy': true,
    'Maintenance_Mode_On': false,
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
    'Safety.RIO01_SDI_07': true,
    'Safety.RIO01_SDI_08': true,
    'Safety.RIO01_SDI_11': true,
    'Safety.RIO01_SDI_12': true,
    'Safety.RIO01_SDI_15': true,
    'Safety.RIO01_SDI_16': true,
    'Safety.RIO01_SDI_17': true,
    'Safety.RIO01_SDI_18': true,
    'Safety.RIO01_SDI_19': true,
    'Safety.RIO01_SDI_20': true,
    'System.All_E_Stop_Healthy': true,
    'Prestart.PowerOK': false,
    'Prestart.AirOK': false,
    'Prestart.SafetyOK': false,
    'Prestart.Ready': false,
    'Network.RIO_Healthy': true,
    'Network.BIC01': true,
    'Network.BIC02': false,
    'Network.CRC01': true,
    'Network.CRC02': true,
    'Network.SSL01': false,
    'Network.MFS01': true,
    'Network.MFS02': true,
    'Network.ROBOT01': false,
    'Network.ROBOT02': true,
    'Network.ROBOT03': false,
    'Network.Vision_Camera_Healthy': true,
    'Network.BRM01': false,
    'Network.All_Network_Healthy': false,
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
    'Temp.IO_LIST': 2,
    'Alarm.EStop': false,
    'Alarm.DoorOpen': false,
    'Alarm.LowAir': false,
    'Alarm.MotorFault': false,
    'Alarm.HighTemp': false,
    'System.HMI_BuzzerSilence': 0,
    'Alarmtext': 'ABCDE FGHIJK LMNOPQ RSTUV WXYZ ABCDE FGHIJK LMNOPQ RSTUV WXYZ'
  };

  for (const [name, value] of Object.entries(seeds)) {
    if (!tagService.get(name)) {
      const type = typeof value === 'boolean'
        ? 'bool'
        : typeof value === 'number'
          ? (Number.isInteger(value) ? 'int' : 'float')
          : 'string';
      tagService.loadDefinitions([{ name, type, description: name }]);
    }
    tagService.set(name, value);
  }

  const IoListTags = require('../../../shared/io-list-tags');
  const defaultList = IoListTags.buildListRuntimeValues('do', 1);
  for (const [name, value] of Object.entries(defaultList)) {
    if (tagService.get(name)) tagService.set(name, value);
  }
}

module.exports = { seedDemoTagValues };
