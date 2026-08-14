/** Verify 303_Run_Count compose + manual shell */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const screen = JSON.parse(fs.readFileSync(path.join(__dirname, '../screens/303_Run_Count.json'), 'utf8'));
const templateComposeSrc = fs.readFileSync(path.join(__dirname, '../public/template-compose.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${templateComposeSrc}\nwindow.TemplateCompose = TemplateCompose;`, sandbox);

const { composeScreen, buildManualShell } = sandbox.window.TemplateCompose;

const manualShell = buildManualShell(screen);
const navLabels = manualShell.filter((c) => c.type === 'GotoButton').map((c) => c.label.replace(/\n/g, ' '));
const activeNav = manualShell.find((c) => c.type === 'GotoButton' && c.borderColor === '#F99746');
const subtitle = manualShell.find((c) => c.name === 'ScreenSubtitle');

const headers = screen.components
  .filter((c) => c.type === 'Text' && c.name?.startsWith('RunCountHdr'))
  .map((c) => c.caption.replace(/\n/g, ' '));

const params = screen.components.filter((c) => c.type === 'Text' && c.name?.startsWith('RunCountParam_'));
const resets = screen.components.filter((c) => c.type === 'MomentaryButton' && c.name?.startsWith('RunCountReset_'));
const frame = screen.components.find((c) => c.name === 'RunCountTableFrame');

const composed = composeScreen(screen, { components: [{ name: 'FooterBar', top: 500 }] }, {});
const hasManualNav = composed.components.some((c) => c.name === 'ManualNav_303_Run_Count');
const hasTable = composed.components.some((c) => c.name === 'RunCountTableFrame');

const checks = [
  ['nav item count', navLabels.length === 5, navLabels.join(', ')],
  ['active nav Run Time', activeNav?.target === '303_Run_Count', activeNav?.target],
  ['subtitle Run Count', subtitle?.caption === 'Run Count', subtitle?.caption],
  ['table frame present', Boolean(frame), frame?.name],
  ['8 parameter rows', params.length === 8, params.length],
  ['8 reset buttons', resets.length === 8, resets.length],
  ['4 table headers', headers.length === 4, headers.join(', ')],
  ['background #EBEBEB', screen.displaySettings.backgroundColor === '#EBEBEB', screen.displaySettings.backgroundColor],
  ['compose adds manual shell', hasManualNav, hasManualNav],
  ['compose keeps table content', hasTable, hasTable]
];

let failed = 0;
for (const [label, ok, detail] of checks) {
  const mark = ok ? 'OK' : 'FAIL';
  if (!ok) failed += 1;
  console.log(`${mark}  ${label}: ${detail}`);
}

process.exit(failed ? 1 : 0);
