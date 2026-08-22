/** Generate 100_Overview — FT layout with Equipment Status legend on the right. */
const fs = require('fs');
const path = require('path');
const { buildLegend } = require('./equipment-status-legend');

const SCALE = 800 / 1024;
const scaleCoord = (n) => Math.round(Number(n) * SCALE);

const OVERVIEW_SHELL = {
  OverviewNav_101_Production_Data: { left: 8, top: scaleCoord(96), width: 66, height: 35 },
  OverviewNav_102_Prestart: { left: 8, top: scaleCoord(168), width: 66, height: 35 },
  OverviewNav_103_Safety: { left: 8, top: scaleCoord(240), width: 66, height: 35 },
  OverviewNav_104_Mimic_Screen: { left: 8, top: scaleCoord(312), width: 66, height: 35 }
};

function overviewTemplateReplace() {
  return {
    enabled: true,
    globalObjectId: 'Template',
    hide: ['NavSequence'],
    replace: {
      NavOverview: {
        caption: 'Overview',
        image: 'select_home.jpg',
        imageScaled: false,
        italic: false,
        underline: false,
        foreColor: '#000000',
        useForeColor: true,
        captionBackStyle: 'transparent',
        useCaptionBackColor: false,
        captionBackColor: '#002952',
        captionBlink: false,
        audio: true,
        shape: 'rectangle',
        patternStyle: 'none',
        useVariableDisplay: false,
        parameterType: 'file',
        parameterFile: '',
        parameterList: '',
        displayPosition: false,
        displayTop: 0,
        displayLeft: 0,
        useVariableDisplayPosition: false,
        horizontalMargin: 0,
        verticalMargin: 0
      }
    }
  };
}

const screen = {
  id: '100_Overview',
  title: 'Overview',
  subtitle: 'Overview',
  navGroup: 'overview',
  layout: 'standard',
  securityLevel: 0,
  components: buildLegend('OverviewLegend'),
  displaySettings: {
    backgroundColor: '#EBEBEB',
    useProjectSize: true
  },
  template: overviewTemplateReplace(),
  overviewShell: OVERVIEW_SHELL
};

const outDirs = [
  path.join(__dirname, '../projects/a/Gfx'),
  path.join(__dirname, '../projects/_template/Gfx'),
  path.join(__dirname, '../screens')
];

const projectsDir = path.join(__dirname, '../projects');
for (const entry of fs.readdirSync(projectsDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
  outDirs.push(path.join(projectsDir, entry.name, 'Gfx'));
}

for (const dir of outDirs) {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, '100_Overview.json');
  fs.writeFileSync(p, `${JSON.stringify(screen, null, 2)}\n`, 'utf8');
  console.log('Wrote', p, '-', screen.components.length, 'legend components');
}
