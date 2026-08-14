/** Verify 304_Cycle_Time compose + placeholder formatting */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const screen = JSON.parse(fs.readFileSync(path.join(__dirname, '../screens/304_Cycle_Time.json'), 'utf8'));
const templateComposeSrc = fs.readFileSync(path.join(__dirname, '../public/template-compose.js'), 'utf8');
const registrySrc = fs.readFileSync(path.join(__dirname, '../public/components/registry.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${templateComposeSrc}\nwindow.TemplateCompose = TemplateCompose;`, sandbox);
vm.runInContext(`${registrySrc}\nwindow.ComponentRegistry = ComponentRegistry;`, sandbox);

const { composeScreen, buildManualShell } = sandbox.window.TemplateCompose;
const { numericDisplayPlaceholder } = sandbox.window.ComponentRegistry;

const manualShell = buildManualShell(screen);
const navLabels = manualShell.filter((c) => c.type === 'GotoButton').map((c) => c.label.replace(/\n/g, ' '));
const activeNav = manualShell.find((c) => c.type === 'GotoButton' && c.borderColor === '#F99746');
const subtitle = manualShell.find((c) => c.name === 'ScreenSubtitle');

const headers = screen.components
  .filter((c) => c.type === 'Text' && c.top < 100 && c.caption !== 'All Parameters In sec')
  .map((c) => c.caption.replace(/\n/g, ' '));

const nums = screen.components.filter((c) => c.type === 'NumericDisplay');
const rowTops = [...new Set(nums.map((n) => n.top))].sort((a, b) => a - b);
const colLefts = [...new Set(nums.map((n) => n.left))].sort((a, b) => a - b);
const stripeStyles = [...new Set(nums.map((n) => `${n.backColor}|${n.endColor}`))];
const footer = screen.components.find((c) => c.caption === 'All Parameters In sec');
const samplePlaceholder = numericDisplayPlaceholder(nums[0]);

const composed = composeScreen(screen, { components: [{ name: 'FooterBar', top: 500 }] }, {});
const hasManualNav = composed.components.some((c) => c.name === 'ManualNav_304_Cycle_Time');

const checks = [
  ['nav item count', navLabels.length === 5, navLabels.join(', ')],
  ['active nav Cycle Time', activeNav?.target === '304_Cycle_Time', activeNav?.target],
  ['subtitle Cycle Time', subtitle?.caption === 'Cycle Time', subtitle?.caption],
  ['8 column headers', headers.length === 8, headers.length],
  ['152 numeric cells', nums.length === 152, nums.length],
  ['19 row tops', rowTops.length === 19, rowTops.length],
  ['8 columns', colLefts.length === 8, colLefts.length],
  ['alternating stripe styles', stripeStyles.length >= 2, stripeStyles.join(' ; ')],
  ['footer label', Boolean(footer), footer?.caption],
  ['NN.NN placeholder', samplePlaceholder === 'NN.NN', samplePlaceholder],
  ['background #EFEFEF', screen.displaySettings.backgroundColor === '#EFEFEF', screen.displaySettings.backgroundColor],
  ['compose adds manual shell', hasManualNav, hasManualNav]
];

let failed = 0;
for (const [label, ok, detail] of checks) {
  const mark = ok ? 'OK' : 'FAIL';
  if (!ok) failed += 1;
  console.log(`${mark}  ${label}: ${detail}`);
}

console.log('\nHeaders:', headers);
process.exit(failed ? 1 : 0);
