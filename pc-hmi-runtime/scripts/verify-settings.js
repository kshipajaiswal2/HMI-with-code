/** Verify 200_Settings compose + settings shell + Equipment Status legend */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const screen = JSON.parse(fs.readFileSync(path.join(__dirname, '../screens/200_Settings.json'), 'utf8'));
const templateComposeSrc = fs.readFileSync(path.join(__dirname, '../public/template-compose.js'), 'utf8');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(`${templateComposeSrc}\nwindow.TemplateCompose = TemplateCompose;`, sandbox);

const { composeScreen, buildSettingsShell } = sandbox.window.TemplateCompose;

const settingsShell = buildSettingsShell(screen);
const subtitle = settingsShell.find((c) => c.name === 'ScreenSubtitle');
const legendBox = screen.components.find((c) => c.name === 'SettingsLegendBox');
const legendLabels = screen.components.filter((c) => c.name?.startsWith('SettingsLegendLabel'));
const navReplace = screen.template?.replace?.NavSettings;

const composed = composeScreen(screen, { components: [{ name: 'FooterBar', top: 500 }] }, {});
const hasSubtitle = composed.components.some((c) => c.name === 'ScreenSubtitle' && c.caption === 'Setting');
const hasLegend = composed.components.some((c) => c.name === 'SettingsLegendBox');
const hasFlowContent = composed.components.some((c) => c.type === 'ContentArea');
const noWrapLabels = legendLabels.every((c) => c.wordWrap === false);

const checks = [
  ['navGroup settings', screen.navGroup === 'settings', screen.navGroup],
  ['subtitle Setting', subtitle?.caption === 'Setting', subtitle?.caption],
  ['NavSettings active image', navReplace?.image === 'select_settings.jpg', navReplace?.image],
  ['legend box present', Boolean(legendBox), legendBox?.name],
  ['5 legend labels', legendLabels.length === 5, legendLabels.length],
  ['legend labels wordWrap false', noWrapLabels, noWrapLabels],
  ['background #EBEBEB', screen.displaySettings.backgroundColor === '#EBEBEB', screen.displaySettings.backgroundColor],
  ['no flow content area', !hasFlowContent, hasFlowContent],
  ['compose adds subtitle shell', hasSubtitle, hasSubtitle],
  ['compose keeps legend', hasLegend, hasLegend]
];

let failed = 0;
for (const [label, ok, detail] of checks) {
  const mark = ok ? 'OK' : 'FAIL';
  if (!ok) failed += 1;
  console.log(`${mark}  ${label}: ${detail}`);
}

process.exit(failed ? 1 : 0);
