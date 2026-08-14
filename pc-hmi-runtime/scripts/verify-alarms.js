/** Verify 400_Active_Alarms + 401_Alarm_History compose + alarms shell */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const templateComposeSrc = fs.readFileSync(path.join(__dirname, '../public/template-compose.js'), 'utf8');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${templateComposeSrc}\nwindow.TemplateCompose = TemplateCompose;`, sandbox);
const { composeScreen, buildAlarmsShell } = sandbox.window.TemplateCompose;

function verifyScreen(file, expectations) {
  const screen = JSON.parse(fs.readFileSync(path.join(__dirname, '../screens', file), 'utf8'));
  const shell = buildAlarmsShell(screen);
  const navLabels = shell.filter((c) => c.type === 'GotoButton').map((c) => c.label.replace(/\n/g, ' '));
  const navHasLabels = shell.filter((c) => c.type === 'GotoButton').every((c) => Boolean(c.label));
  const activeNav = shell.find((c) => c.type === 'GotoButton' && c.borderColor === '#F99746');
  const subtitle = shell.find((c) => c.name === 'ScreenSubtitle');
  const list = screen.components.find((c) => c.name === 'AlarmList3');
  const note = screen.components.find((c) => c.name === 'AlarmFooterNote');
  const navBtns = screen.components.filter((c) => /Key$/.test(c.type));
  const composed = composeScreen(screen, { components: [{ name: 'FooterBar', top: 500 }] }, {});
  const hasAlarmNav = composed.components.some((c) => c.name === `AlarmNav_${expectations.activeTarget}`);
  const hasList = composed.components.some((c) => c.name === 'AlarmList3');

  const checks = [
    ['nav item count', navLabels.length === 3, navLabels.join(', ')],
    ['nav labels present', navHasLabels, navLabels.join(', ')],
    ['active nav', activeNav?.target === expectations.activeTarget, activeNav?.target],
    ['subtitle', subtitle?.caption === expectations.subtitle, subtitle?.caption],
    ['alarm list present', Boolean(list), list?.name],
    ['list mode', list?.listMode === expectations.listMode, list?.listMode],
    ['4 scroll buttons', navBtns.length === 4, navBtns.length],
    ['footer note', note?.caption === expectations.note, note?.caption],
    ['action button', screen.components.some((c) => c.name === expectations.actionName), expectations.actionName],
    ['background #EBEBEB', screen.displaySettings.backgroundColor === '#EBEBEB', screen.displaySettings.backgroundColor],
    ['compose adds alarm shell', hasAlarmNav, hasAlarmNav],
    ['compose keeps alarm list', hasList, hasList]
  ];

  console.log(`\n=== ${file} ===`);
  let failed = 0;
  for (const [label, ok, detail] of checks) {
    const mark = ok ? 'OK' : 'FAIL';
    if (!ok) failed += 1;
    console.log(`${mark}  ${label}: ${detail}`);
  }
  return failed;
}

let totalFailed = 0;
totalFailed += verifyScreen('400_Active_Alarms.json', {
  activeTarget: '400_Active_Alarms',
  subtitle: 'Active Alarms',
  listMode: 'active',
  note: 'Note : Select a alarm, then press alarm remedy button to see the remedy of particular alarm',
  actionName: 'BuzzerSilenceButton'
});
totalFailed += verifyScreen('401_Alarm_History.json', {
  activeTarget: '401_Alarm_History',
  subtitle: 'Alarm History',
  listMode: 'history',
  note: 'Note : To Delete Alarms Manager Login will be required',
  actionName: 'ClearAlarmHistoryButton1'
});

process.exit(totalFailed ? 1 : 0);
