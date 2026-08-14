/** Generate 302_PLC_Architecture manual shell (empty workspace placeholder) */
const fs = require('fs');
const path = require('path');

function manualTemplateReplace() {
  return {
    enabled: true,
    globalObjectId: 'Template',
    replace: {
      NavManual: {
        caption: 'Manual',
        image: 'manual2.jpg',
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
  id: '302_PLC_Architecture',
  title: 'PLC Architecture',
  subtitle: 'PLC Architecture',
  navGroup: 'manual',
  securityLevel: 1,
  components: [],
  displaySettings: { backgroundColor: '#EBEBEB', useProjectSize: true },
  template: manualTemplateReplace()
};

const outDirs = [
  path.join(__dirname, '../projects/a/Gfx'),
  path.join(__dirname, '../projects/_template/Gfx'),
  path.join(__dirname, '../screens')
];

const file = '302_PLC_Architecture.json';
for (const dir of outDirs) {
  const p = path.join(dir, file);
  fs.writeFileSync(p, JSON.stringify(screen, null, 2) + '\n');
  console.log('Wrote', p);
}
