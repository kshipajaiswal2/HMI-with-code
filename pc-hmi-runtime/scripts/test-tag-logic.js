const { TagService } = require('../server/services/tag-service');
const { TagLogicService } = require('../server/services/tag-logic-service');

const ts = new TagService();
ts.loadDefinitions([
  {
    name: 'System.All_E_Stop_Healthy',
    type: 'bool',
    computed: true,
    logic: "all(tags.get(n, False) for n in ['Safety.S_All_E_Stop_Healthy','Safety.RIO01_SDI_01','Safety.RIO01_SDI_02'])"
  },
  {
    name: 'System.Healthy',
    type: 'bool',
    computed: true,
    logic: "tags.get('System.All_E_Stop_Healthy', False)"
  },
  { name: 'Safety.S_All_E_Stop_Healthy', type: 'bool' },
  { name: 'Safety.RIO01_SDI_01', type: 'bool' },
  { name: 'Safety.RIO01_SDI_02', type: 'bool' }
]);

ts.set('Safety.S_All_E_Stop_Healthy', false);
ts.set('Safety.RIO01_SDI_01', false);
ts.set('Safety.RIO01_SDI_02', true);

const tls = new TagLogicService(ts);
tls.loadRules([
  {
    name: 'System.All_E_Stop_Healthy',
    type: 'bool',
    computed: true,
    logic: "all(tags.get(n, False) for n in ['Safety.S_All_E_Stop_Healthy','Safety.RIO01_SDI_01','Safety.RIO01_SDI_02'])"
  },
  {
    name: 'System.Healthy',
    type: 'bool',
    computed: true,
    logic: "tags.get('System.All_E_Stop_Healthy', False)"
  }
]);

const result = tls.evaluate();
console.log(JSON.stringify({
  engine: result.engine,
  updated: result.updated,
  allEStop: ts.get('System.All_E_Stop_Healthy').value,
  healthy: ts.get('System.Healthy').value
}, null, 2));

if (ts.get('System.All_E_Stop_Healthy').value !== false || ts.get('System.Healthy').value !== false) {
  process.exit(1);
}

ts.set('Safety.S_All_E_Stop_Healthy', true);
ts.set('Safety.RIO01_SDI_01', true);
ts.set('Safety.RIO01_SDI_02', true);
tls.evaluate();
console.log(JSON.stringify({
  allEStop: ts.get('System.All_E_Stop_Healthy').value,
  healthy: ts.get('System.Healthy').value
}, null, 2));

if (ts.get('System.All_E_Stop_Healthy').value !== true || ts.get('System.Healthy').value !== true) {
  process.exit(2);
}

console.log('OK');
