const { SimulatorDriver } = require('./simulator');
const { EthernetIpDriver } = require('./ethernet-ip');
const { OpcUaDriver } = require('./opcua');

function createCommunicationDriver(config, tagService, alarmService, tagLogicService) {
  const driverName = config?.driver || 'simulator';
  if (driverName === 'ethernet-ip') {
    return new EthernetIpDriver(config, tagService, alarmService, tagLogicService);
  }
  if (driverName === 'opcua') {
    return new OpcUaDriver(config, tagService, alarmService, tagLogicService);
  }
  return new SimulatorDriver(config, tagService, alarmService, tagLogicService);
}

module.exports = { createCommunicationDriver };
