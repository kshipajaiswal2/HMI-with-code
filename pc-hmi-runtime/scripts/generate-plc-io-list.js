/** Generate 301_PLC_IO_List from FactoryTalk 402_IO_List layout (scaled 800/1024). */
const fs = require('fs');
const path = require('path');

const SCALE = 800 / 1024;
const s = (n) => Math.round(Number(n) * SCALE);

function gradRect(name, left, top, width, height) {
  return {
    type: 'Rectangle', name, left, top, width, height, visible: true,
    backStyle: 'gradient', backColor: '#C6C6C6', endColor: '#E8E8E8',
    gradientStop: 95, gradientShadingStyle: 'gradientHorizontalFromRight',
    foreColor: '#C6C6C6', lineWidth: 2, patternStyle: 'none'
  };
}

function wireLine(name, left, top, width, height, color = '#008080') {
  return {
    type: 'Rectangle', name, left, top, width, height, visible: true,
    backStyle: 'solid', backColor: color, useBackColor: true,
    foreColor: color, lineWidth: 0
  };
}

const PARAM_FILES = [
  'PLC DO List 01',
  'PLC DO List 02',
  'PLC DO List 03',
  'PLC DO List 04',
  'PLC DO List 05',
  'PLC DO List 06',
  'PLC DI List 07'
];

function secondaryNav(label, index, active) {
  const tops = [101, 173, 245, 317, 389, 461, 533];
  return {
    type: 'GotoButton',
    name: `PlcIoSubNav_${String(index).padStart(2, '0')}`,
    label,
    target: '301_PLC_IO_List',
    parameterType: 'file',
    parameterFile: PARAM_FILES[index - 1],
    parameterList: '',
    left: s(128),
    top: s(tops[index - 1]),
    width: s(85),
    height: s(45),
    useBackColor: true,
    backColor: '#E0E0E0',
    backStyle: 'solid',
    borderStyle: 'raised',
    borderWidth: 3,
    borderUsesBackColor: false,
    useBorderColor: true,
    borderColor: active ? '#F99746' : 'silver',
    foreColor: '#000000',
    useForeColor: true,
    fontSize: 10,
    bold: true,
    alignment: 'middleCenter',
    wordWrap: true,
    visible: true,
    audio: true
  };
}

function toggleBtn(name, label, left, active) {
  return {
    type: 'GotoButton',
    name,
    label,
    target: '301_PLC_IO_List',
    left: s(left),
    top: s(122),
    width: s(85),
    height: s(45),
    useBackColor: true,
    backColor: '#E0E0E0',
    backStyle: 'solid',
    borderStyle: 'raised',
    borderWidth: active ? 4 : 3,
    borderUsesBackColor: false,
    useBorderColor: true,
    borderColor: 'silver',
    fontSize: 10,
    bold: true,
    alignment: 'middleCenter',
    wordWrap: true,
    visible: true,
    audio: true
  };
}

function buildPlcIoList() {
  const comps = [];

  // Secondary column nav — Output List 01–06 + Input List 07 (FT 402_IO_List Group16 default)
  const subLabels = [
    'PLC Output\nList 01',
    'PLC Output\nList 02',
    'PLC Output\nList 03',
    'PLC Output\nList 04',
    'PLC Output\nList 05',
    'PLC Output\nList 06',
    'PLC Input\nList 07'
  ];
  subLabels.forEach((label, i) => comps.push(secondaryNav(label, i + 1, i === 0)));

  // Top toggle tabs
  comps.push(toggleBtn('PlcIoTabInput', 'PLC Input\nList', 385, false));
  comps.push(toggleBtn('PlcIoTabOutput', 'PLC Output\nList', 537, true));

  // Main table frame (FT Polygon4 @ 237,185 647×417)
  const tableL = s(237);
  const tableT = s(185);
  const tableW = s(647);
  const tableH = s(417);
  comps.push({
    type: 'Rectangle', name: 'PlcIoTableFrame', left: tableL, top: tableT,
    width: tableW, height: tableH, visible: true,
    backStyle: 'transparent', backColor: '#ffffff', foreColor: '#000000',
    lineWidth: 2, patternStyle: 'none'
  });

  // Header row gradient
  const headerT = s(194);
  const headerH = s(36);
  comps.push(gradRect('PlcIoHeaderRow', tableL + 2, headerT, tableW - 4, headerH));

  // Column divider (FT Line11 @ left=752 — white, not teal)
  const divL = s(752);
  comps.push(wireLine('PlcIoColDivider', divL, s(231), 2, s(371), '#FFFFFF'));

  // Horizontal row dividers (FT Line3–Line9)
  for (const ftTop of [230, 273, 316, 362, 406, 452, 497, 551]) {
    comps.push(wireLine(`PlcIoRowLine_${ftTop}`, tableL + 1, s(ftTop), tableW - 2, 1));
  }

  // Header labels
  comps.push({
    type: 'Text', name: 'PlcIoHeaderDesc', caption: 'Description',
    left: s(289), top: s(194), width: s(543), height: s(30),
    fontFamily: 'Arial', fontSize: 16, bold: true, backStyle: 'transparent',
    alignment: 'middleCenter', wordWrap: false
  });
  comps.push({
    type: 'Text', name: 'PlcIoHeaderVal', caption: 'Value',
    left: s(766), top: s(194), width: s(105), height: s(30),
    fontFamily: 'Arial', fontSize: 16, bold: true, backStyle: 'transparent',
    alignment: 'middleCenter', wordWrap: false
  });

  const rowTops = [238, 280, 325, 370, 414, 460, 509, 559];

  rowTops.forEach((ftTop, i) => {
    const row = i + 1;
    const descParam = `#${100 + row}`;
    const valParam = `#${300 + row}`;
    comps.push({
      type: 'StringDisplay', name: `PlcIoDesc_${row}`,
      tag: descParam,
      left: s(243), top: s(ftTop), width: s(504), height: s(29),
      visible: true, borderStyle: 'none', borderWidth: 0, borderUsesBackColor: false,
      backStyle: 'transparent', useBackColor: false,
      fontFamily: 'Arial', fontSize: 16, bold: false,
      foreColor: '#000000', useForeColor: true,
      alignment: 'middleLeft', wordWrap: false
    });
    comps.push({
      type: 'NumericDisplay', name: `PlcIoVal_${row}`,
      tag: valParam,
      left: s(767), top: s(ftTop), width: s(105), height: s(35),
      visible: true, backStyle: 'gradient', backColor: '#C6C6C6', endColor: '#E8E8E8',
      gradientStop: 95, gradientShadingStyle: 'gradientHorizontalFromRight',
      useBackColor: true, borderStyle: 'raisedInset', borderWidth: 1,
      borderUsesBackColor: true, borderColor: '#E0E0E0',
      foreColor: '#000000', useForeColor: true, fontFamily: 'Arial',
      fontSize: 10, bold: true, alignment: 'middleCenter',
      numberOfDigits: 5, decimalPlaces: 0, fillLeftWith: 'none'
    });
  });

  return comps;
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

const MANUAL_SHELL = {
  ManualNav_301_PLC_IO_List: { left: 8, top: 75, width: 66, height: 35 },
  ManualNav_302_PLC_Architecture: { left: 8, top: 131, width: 66, height: 35 },
  ManualNav_303_Run_Count: { left: 8, top: 188, width: 66, height: 35 },
  ManualNav_304_Network: { left: 8, top: 244, width: 66, height: 35 },
  ManualNav_305_Cycle_Time: { left: 8, top: 300, width: 66, height: 35 }
};

const screen = {
  id: '301_PLC_IO_List',
  title: 'PLC IO List',
  subtitle: 'PLC IO List',
  navGroup: 'manual',
  securityLevel: 1,
  defaultParameterFile: 'PLC DO List 01',
  components: buildPlcIoList(),
  displaySettings: { backgroundColor: '#EFEFEF', useProjectSize: true },
  template: manualTemplateReplace(),
  manualShell: MANUAL_SHELL
};

const outDirs = [
  path.join(__dirname, '../projects/a/Gfx'),
  path.join(__dirname, '../projects/_template/Gfx'),
  path.join(__dirname, '../screens')
];

for (const dir of outDirs) {
  const p = path.join(dir, '301_PLC_IO_List.json');
  fs.writeFileSync(p, JSON.stringify(screen, null, 2) + '\n');
  console.log('Wrote', p, '-', screen.components.length, 'components');
}
