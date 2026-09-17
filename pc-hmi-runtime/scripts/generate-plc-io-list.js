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
  const horizontal = width >= height;
  const stroke = Math.max(1, Math.min(width, height, 2));
  if (horizontal) {
    const y = Math.max(0.5, stroke / 2);
    return {
      type: 'Line', name, left, top, width, height: Math.max(2, stroke),
      x1: 0, y1: y, x2: width, y2: y,
      visible: true, lineStyle: 'solid', lineWidth: stroke,
      backStyle: 'transparent', useBackColor: false,
      useForeColor: true, foreColor: color
    };
  }
  const x = Math.max(0.5, stroke / 2);
  return {
    type: 'Line', name, left, top, width: Math.max(2, stroke), height,
    x1: x, y1: 0, x2: x, y2: height,
    visible: true, lineStyle: 'solid', lineWidth: stroke,
    backStyle: 'transparent', useBackColor: false,
    useForeColor: true, foreColor: color
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

function secondaryNav(label, index, kind, active) {
  const tops = [101, 173, 245, 317, 389, 461, 533];
  const files = kind === 'in'
    ? ['PLC DI List 01', 'PLC DI List 02', 'PLC DI List 03', 'PLC DI List 04', 'PLC DI List 05', 'PLC DI List 06', 'PLC DI List 07']
    : PARAM_FILES;
  const prefix = kind === 'in' ? 'PlcIoSubNavIn' : 'PlcIoSubNav';
  return {
    type: 'GotoButton',
    name: `${prefix}_${String(index).padStart(2, '0')}`,
    label,
    target: '301_PLC_IO_List',
    parameterType: 'file',
    parameterFile: files[index - 1],
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
    audio: true,
    visibleWhen: { tag: 'Temp_Tags.IO_LIST', equals: kind === 'in' ? 1 : 2 }
  };
}

function interlockedTab(name, label, left, buttonValue) {
  const caption = label;
  const state = (id, extras = {}) => ({
    id,
    backColor: '#E0E0E0',
    borderColor: 'silver',
    useBackColor: true,
    useBorderColor: true,
    blink: false,
    patternStyle: 'none',
    caption,
    captionColor: '#000000',
    useCaptionColor: true,
    captionBackStyle: 'transparent',
    wordWrap: true,
    alignment: 'middleCenter',
    ...extras
  });
  return {
    type: 'InterlockedButton',
    name,
    tag: 'Temp_Tags.IO_LIST',
    buttonValue,
    target: '301_PLC_IO_List',
    parameterType: 'file',
    parameterFile: buttonValue === 1 ? 'PLC DI List 01' : 'PLC DO List 01',
    caption,
    label: caption,
    left: s(left),
    top: s(122),
    width: s(85),
    height: s(45),
    visible: true,
    useBackColor: true,
    backColor: '#E0E0E0',
    backStyle: 'solid',
    borderStyle: 'raised',
    borderWidth: 4,
    borderUsesBackColor: false,
    useBorderColor: true,
    borderColor: 'silver',
    fontSize: 10,
    bold: true,
    alignment: 'middleCenter',
    wordWrap: true,
    audio: true,
    touch: true,
    states: [state('State0'), state('State1')]
  };
}

function buildPlcIoList() {
  const comps = [];

  // Input list buttons sit under Output list buttons at the same coordinates
  // (FactoryTalk Group19 / Group16). Runtime visibility swaps them; Studio
  // shows both so you can layer / arrange.
  const inLabels = [
    'PLC Input\nList 01',
    'PLC Input\nList 02',
    'PLC Input\nList 03',
    'PLC Input\nList 04',
    'PLC Input\nList 05',
    'PLC Input\nList 06',
    'PLC Input\nList 07'
  ];
  inLabels.forEach((label, i) => comps.push(secondaryNav(label, i + 1, 'in', i === 0)));

  const outLabels = [
    'PLC Output\nList 01',
    'PLC Output\nList 02',
    'PLC Output\nList 03',
    'PLC Output\nList 04',
    'PLC Output\nList 05',
    'PLC Output\nList 06',
    'PLC Input\nList 07'
  ];
  outLabels.forEach((label, i) => comps.push(secondaryNav(label, i + 1, 'out', i === 0)));

  // Top toggle tabs
  comps.push(interlockedTab('PlcIoTabInput', 'PLC Input\nList', 385, 1));
  comps.push(interlockedTab('PlcIoTabOutput', 'PLC Output\nList', 537, 2));

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
  comps.push(wireLine('PlcIoColDivider', divL, s(231), 2, s(371), '#008080'));

  // Horizontal row dividers (FT Line3–Line9)
  for (const ftTop of [230, 273, 316, 362, 406, 452, 497, 551]) {
    comps.push(wireLine(`PlcIoRowLine_${ftTop}`, tableL + 1, s(ftTop), tableW - 2, 1));
  }

  // Header labels
  comps.push({
    type: 'StringDisplay', name: 'PlcIoHeaderDesc', tag: '#100',
    left: s(289), top: s(194), width: s(543), height: s(30),
    visible: true, borderStyle: 'none', borderWidth: 0, borderUsesBackColor: false,
    backStyle: 'transparent', useBackColor: false,
    fontFamily: 'Arial', fontSize: 16, bold: true,
    foreColor: '#000000', useForeColor: true,
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
