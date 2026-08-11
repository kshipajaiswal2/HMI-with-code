const path = require('path');
const fs = require('fs');
const { TagService } = require('../server/services/tag-service');
const { TagLogicService } = require('../server/services/tag-logic-service');

const projectPath = path.join(__dirname, '../projects/a/project.json');
const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));

const ts = new TagService();
ts.loadDefinitions(project.tags || []);
const tls = new TagLogicService(ts);

// Seed like simulator
const seeds = {
  'Safety.S_All_E_Stop_Healthy': false,
  'Safety.RIO01_SDI_01': false,
  'Safety.RIO01_SDI_02': true,
  'Safety.RIO01_SDI_03': true,
  'Safety.RIO01_SDI_04': true,
  'Safety.RIO01_SDI_07': true,
  'Safety.RIO01_SDI_08': false,
  'Safety.RIO01_SDI_11': false,
  'Safety.RIO01_SDI_12': true,
  'Safety.RIO01_SDI_15': true,
  'Safety.RIO01_SDI_16': true,
  'Safety.RIO01_SDI_17': true,
  'Safety.RIO01_SDI_18': false,
  'Safety.RIO01_SDI_19': false,
  'Safety.RIO01_SDI_20': true
};
for (const [name, value] of Object.entries(seeds)) {
  ts.set(name, value);
}

tls.loadRules(project.tags || []);
const result = tls.evaluate();

console.log(JSON.stringify({
  engine: result.engine,
  updated: result.updated,
  allEStop: ts.get('System.All_E_Stop_Healthy')?.value,
  healthy: ts.get('System.Healthy')?.value,
  rules: tls.getRules().length
}, null, 2));
