/** Generate 200_Settings shell (FT 201_Settings — grey workspace + Equipment Status legend). */
const fs = require('fs');
const path = require('path');
const { buildLegend } = require('./equipment-status-legend');

function settingsTemplateReplace() {
  return {
    enabled: true,
    globalObjectId: 'Template',
    replace: {
      NavSettings: {
        caption: 'Settings',
        image: 'select_settings.jpg',
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
  id: '200_Settings',
  title: 'Settings',
  subtitle: 'Setting',
  navGroup: 'settings',
  securityLevel: 1,
  components: buildLegend('SettingsLegend'),
  displaySettings: { backgroundColor: '#EBEBEB', useProjectSize: true },
  template: settingsTemplateReplace()
};

const outDirs = [
  path.join(__dirname, '../projects/a/Gfx'),
  path.join(__dirname, '../projects/_template/Gfx'),
  path.join(__dirname, '../screens')
];

const file = '200_Settings.json';
for (const dir of outDirs) {
  const p = path.join(dir, file);
  fs.writeFileSync(p, JSON.stringify(screen, null, 2) + '\n');
  console.log('Wrote', p, '-', screen.components.length, 'components');
}
