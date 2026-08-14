/** Generate 304_Cycle_Time from FactoryTalk 402_Cycletime.xml (scaled 800/1024). */
const fs = require('fs');
const path = require('path');

const SCALE = 800 / 1024;
const scale = (n) => Math.round(Number(n) * SCALE);

const xmlCandidates = [
  path.join(__dirname, '../../Export import/402_Cycletime.xml'),
  path.join(__dirname, '../../Export import/105_Cycle_Time.xml'),
  path.join(__dirname, '../../web-hmi-bridge/ftio/reimport/105_Cycle_Time.xml')
];
const xmlPath = xmlCandidates.find((p) => fs.existsSync(p));
if (!xmlPath) {
  console.error('Cycle Time FT XML not found');
  process.exit(1);
}
const xml = fs.readFileSync(xmlPath, 'utf8');
console.log('Source XML:', xmlPath);

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : '';
}

function decodeCaption(raw) {
  return raw
    .replace(/&#xA;/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function numericFromXml(block, rowIndex) {
  const tagMatch = block.match(/expression="\{([^}]+)\}"/);
  const evenRow = rowIndex % 2 === 0;
  return {
    type: 'NumericDisplay',
    name: attr(block, 'name'),
    tag: tagMatch ? `{${tagMatch[1]}}` : '',
    left: scale(attr(block, 'left')),
    top: scale(attr(block, 'top')),
    width: scale(attr(block, 'width')),
    height: scale(attr(block, 'height')),
    visible: attr(block, 'visible') !== 'false',
    borderStyle: attr(block, 'borderStyle') || 'line',
    borderWidth: Number(attr(block, 'borderWidth')) || 2,
    borderUsesBackColor: attr(block, 'borderUsesBackColor') === 'true',
    backStyle: attr(block, 'backStyle') || 'gradient',
    backColor: evenRow ? '#E8E8E8' : '#C6C6C6',
    endColor: evenRow ? '#F5F5F5' : '#E8E8E8',
    gradientStop: Number(attr(block, 'gradientStop')) || 95,
    gradientShadingStyle: attr(block, 'gradientShadingStyle') || 'gradientHorizontalFromRight',
    useBackColor: true,
    useBorderColor: true,
    borderColor: attr(block, 'borderColor') || '#C6C6C6',
    useForeColor: true,
    foreColor: attr(block, 'foreColor') || '#000000',
    patternStyle: 'none',
    fontFamily: attr(block, 'fontFamily') || 'Arial',
    fontSize: Number(attr(block, 'fontSize')) || 11,
    bold: attr(block, 'bold') === 'true',
    italic: attr(block, 'italic') === 'true',
    underline: attr(block, 'underline') === 'true',
    alignment: attr(block, 'alignment') || 'middleCenter',
    numberOfDigits: Number(attr(block, 'numberOfDigits')) || 5,
    decimalPlaces: Number(attr(block, 'decimalPlaces')) || 2,
    fillLeftWith: attr(block, 'fillLeftWith') || 'none',
    blink: attr(block, 'blink') === 'true'
  };
}

function textFromXml(block) {
  const capMatch = block.match(/caption="([^"]*)"/);
  return {
    type: 'Text',
    name: attr(block, 'name'),
    caption: capMatch ? decodeCaption(capMatch[1]) : '',
    left: scale(attr(block, 'left')),
    top: scale(attr(block, 'top')),
    width: scale(attr(block, 'width')),
    height: scale(attr(block, 'height')),
    visible: attr(block, 'visible') !== 'false',
    fontFamily: attr(block, 'fontFamily') || 'Arial',
    fontSize: Number(attr(block, 'fontSize')) || 13,
    bold: attr(block, 'bold') === 'true',
    italic: attr(block, 'italic') === 'true',
    underline: attr(block, 'underline') === 'true',
    foreColor: attr(block, 'foreColor') || '#000000',
    useForeColor: true,
    backStyle: attr(block, 'backStyle') || 'transparent',
    wordWrap: attr(block, 'wordWrap') !== 'false',
    sizeToFit: attr(block, 'sizeToFit') === 'true',
    alignment: attr(block, 'alignment') || 'middleCenter'
  };
}

function rectFromXml(block) {
  return {
    type: 'Rectangle',
    name: attr(block, 'name'),
    left: scale(attr(block, 'left')),
    top: scale(attr(block, 'top')),
    width: scale(attr(block, 'width')),
    height: scale(attr(block, 'height')),
    visible: attr(block, 'visible') !== 'false',
    backStyle: attr(block, 'backStyle') || 'gradient',
    backColor: attr(block, 'backColor') || '#C6C6C6',
    endColor: attr(block, 'endColor') || '#E8E8E8',
    gradientStop: Number(attr(block, 'gradientStop')) || 95,
    gradientShadingStyle: attr(block, 'gradientShadingStyle') || 'gradientHorizontalFromRight',
    foreColor: attr(block, 'foreColor') || '#C6C6C6',
    lineWidth: Number(attr(block, 'lineWidth')) || 2,
    patternStyle: 'none'
  };
}

const components = [];

for (const block of xml.match(/<rectangle name="Polygon(?:25|5[5-9]|6[01])"[^/]*\/>/g) || []) {
  if (attr(block, 'isReferenceObject') === 'true') continue;
  components.push(rectFromXml(block));
}

for (const block of xml.match(/<text name="Text(?:1|2[1-7]|3)"[^/]*\/>/g) || []) {
  if (attr(block, 'isReferenceObject') === 'true') continue;
  components.push(textFromXml(block));
}

const numericBlocks = (xml.match(/<numericDisplay name="[^"]+"[^>]*>[\s\S]*?<\/numericDisplay>/g) || [])
  .filter((block) => attr(block, 'isReferenceObject') !== 'true');

const topsByLeft = {};
for (const block of numericBlocks) {
  const left = attr(block, 'left');
  const top = Number(attr(block, 'top'));
  (topsByLeft[left] = topsByLeft[left] || new Set()).add(top);
}
const rowOrder = [...(topsByLeft[Object.keys(topsByLeft).sort((a, b) => Number(a) - Number(b))[0]] || [])]
  .sort((a, b) => a - b);
const rowIndexByTop = new Map(rowOrder.map((t, i) => [t, i]));

for (const block of numericBlocks) {
  const top = Number(attr(block, 'top'));
  const rowIndex = rowIndexByTop.get(top) ?? 0;
  components.push(numericFromXml(block, rowIndex));
}

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
  id: '304_Cycle_Time',
  title: 'Cycle Time',
  subtitle: 'Cycle Time',
  navGroup: 'manual',
  securityLevel: 1,
  components,
  displaySettings: {
    backgroundColor: '#EFEFEF',
    useProjectSize: true
  },
  template: manualTemplateReplace()
};

const outPaths = [
  path.join(__dirname, '../screens/304_Cycle_Time.json'),
  path.join(__dirname, '../projects/_template/Gfx/304_Cycle_Time.json'),
  path.join(__dirname, '../projects/a/Gfx/304_Cycle_Time.json')
];

for (const p of outPaths) {
  fs.writeFileSync(p, JSON.stringify(screen, null, 2) + '\n');
  console.log('Wrote', p, '-', components.length, 'components,', numericBlocks.length, 'numeric cells');
}
