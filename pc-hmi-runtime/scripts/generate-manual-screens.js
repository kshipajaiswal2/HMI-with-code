/** Generate 300_Manual_Operation shell + 304_Network ladder screen */
const fs = require('fs');
const path = require('path');
const { buildLegend, wireRect } = require('./equipment-status-legend');

const MS_STATES = [
  {
    id: 'State0', value: 0, useBackColor: true, backColor: '#F83D3D',
    useBorderColor: true, borderColor: '#F83D3D', caption: '',
    useCaptionColor: false, wordWrap: true, alignment: 'middleCenter'
  },
  {
    id: 'State1', value: 1, useBackColor: true, backColor: '#10EB10',
    useBorderColor: true, borderColor: '#10EB10', caption: '',
    useCaptionColor: false, wordWrap: true, alignment: 'middleCenter'
  },
  {
    id: 'Error', caption: 'Error', useBackColor: true, backColor: '#001C38',
    useBorderColor: true, borderColor: '#001C38', useCaptionColor: true,
    captionColor: '#ffffff', wordWrap: true, alignment: 'middleCenter'
  }
];

function buildContact(prefix, row, col, label, tag, defaultValue, layout) {
  const { labelTop, indTop, startLeft, colWidth } = layout;
  const left = startLeft + col * colWidth;
  const barL = left + 31;
  const barR = left + 63;
  const indL = left + 33;
  return [
    {
      type: 'Text', name: `${prefix}Label`, caption: label,
      left, top: labelTop, width: 96, height: 34, visible: true,
      fontFamily: 'Arial', fontSize: 12, backStyle: 'transparent',
      alignment: 'middleCenter', wordWrap: true
    },
    wireRect(`${prefix}BarL`, barL, indTop, 2, 33),
    wireRect(`${prefix}BarR`, barR, indTop, 2, 33),
    {
      type: 'MultistateIndicator', name: `${prefix}Ind`, tag,
      left: indL, top: indTop, width: 30, height: 33, visible: true,
      borderStyle: 'none', borderWidth: 0, borderUsesBackColor: false,
      backStyle: 'solid', shape: 'rectangle', numberOfStates: 2,
      triggerType: 'value', fontFamily: 'Arial', fontSize: 12, bold: false,
      wordWrap: true, defaultValue, states: MS_STATES
    }
  ];
}

function buildNetworkLadder() {
  const railL = 92;
  const railW = 2;
  const railH = 212;
  const rungY = [170, 250, 330];
  const rungW = 700;
  const busX = 790;
  const comps = [
    wireRect('NetworkRail', railL, 119, railW, railH),
    wireRect('NetworkRung1', railL, rungY[0], rungW, 2),
    wireRect('NetworkRung2', railL, rungY[1], rungW, 2),
    wireRect('NetworkRung3', railL, rungY[2], rungW, 2),
    wireRect('NetworkBusDrop1', busX, rungY[0] + 2, 2, 33),
    wireRect('NetworkBusLine1', railL, 194, rungW, 2),
    wireRect('NetworkBusRise1', railL, 196, 2, 56),
    wireRect('NetworkBusDrop2', busX, rungY[1] + 2, 2, 33),
    wireRect('NetworkBusLine2', railL, 274, rungW, 2),
    wireRect('NetworkBusRise2', railL, 276, 2, 56)
  ];

  const row0 = [
    ['RIO Network\nHealthy', 'Network.RIO_Healthy', 1],
    ['BIC01', 'Network.BIC01', 1],
    ['BIC02', 'Network.BIC02', 0],
    ['CRC01', 'Network.CRC01', 1],
    ['CRC02', 'Network.CRC02', 1],
    ['SSL01', 'Network.SSL01', 0]
  ];
  const row1 = [
    ['MFS01', 'Network.MFS01', 1],
    ['MFS02', 'Network.MFS02', 1],
    ['ROBOT01', 'Network.ROBOT01', 0],
    ['ROBOT02', 'Network.ROBOT02', 1],
    ['ROBOT03', 'Network.ROBOT03', 0],
    ['Vision Camera\nNetwork Healthy', 'Network.Vision_Camera_Healthy', 1]
  ];
  const row2 = [['BRM01', 'Network.BRM01', 0]];

  const layouts = [
    { labelTop: 118, indTop: 155, startLeft: 113, colWidth: 101 },
    { labelTop: 198, indTop: 235, startLeft: 113, colWidth: 101 },
    { labelTop: 278, indTop: 315, startLeft: 113, colWidth: 101 }
  ];

  row0.forEach(([label, tag, dv], col) => {
    comps.push(...buildContact(`NetworkContact_0_${col}`, 0, col, label, tag, dv, layouts[0]));
  });
  row1.forEach(([label, tag, dv], col) => {
    comps.push(...buildContact(`NetworkContact_1_${col}`, 1, col, label, tag, dv, layouts[1]));
  });
  row2.forEach(([label, tag, dv], col) => {
    comps.push(...buildContact(`NetworkContact_2_${col}`, 2, col, label, tag, dv, layouts[2]));
  });

  comps.push(
    {
      type: 'Text', name: 'NetworkCoilLabel', caption: 'All Network\nHealthy',
      left: 706, top: 278, width: 96, height: 34, visible: true,
      fontFamily: 'Arial', fontSize: 12, backStyle: 'transparent',
      alignment: 'middleCenter', wordWrap: true
    },
    {
      type: 'Text', name: 'NetworkCoilParenL', caption: '(',
      left: 730, top: 315, width: 12, height: 33, visible: true,
      fontFamily: 'Arial Unicode MS', fontSize: 26, bold: true,
      backStyle: 'transparent', alignment: 'middleCenter'
    },
    {
      type: 'MultistateIndicator', name: 'NetworkCoilInd', tag: 'Network.All_Network_Healthy',
      left: 742, top: 315, width: 30, height: 33, visible: true,
      borderStyle: 'none', borderWidth: 0, borderUsesBackColor: false,
      backStyle: 'solid', shape: 'rectangle', numberOfStates: 2,
      triggerType: 'value', defaultValue: 0, states: MS_STATES
    },
    {
      type: 'Text', name: 'NetworkCoilParenR', caption: ')',
      left: 766, top: 315, width: 12, height: 33, visible: true,
      fontFamily: 'Arial Unicode MS', fontSize: 26, bold: true,
      backStyle: 'transparent', alignment: 'middleCenter'
    }
  );
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

const screens = {
  '300_Manual_Operation.json': {
    id: '300_Manual_Operation',
    title: 'Manual Operation',
    subtitle: 'Manual Operation',
    navGroup: 'manual',
    securityLevel: 1,
    components: buildLegend('ManualLegend'),
    displaySettings: { backgroundColor: '#EBEBEB', useProjectSize: true },
    template: manualTemplateReplace(),
    manualShell: MANUAL_SHELL
  },
  '304_Network.json': {
    id: '304_Network',
    title: 'Network',
    subtitle: 'Network',
    navGroup: 'manual',
    securityLevel: 1,
    components: buildNetworkLadder(),
    displaySettings: { backgroundColor: '#EBEBEB', useProjectSize: true },
    template: manualTemplateReplace()
  }
};

const outDirs = [
  path.join(__dirname, '../projects/a/Gfx'),
  path.join(__dirname, '../projects/_template/Gfx'),
  path.join(__dirname, '../screens')
];

for (const [file, screen] of Object.entries(screens)) {
  for (const dir of outDirs) {
    const p = path.join(dir, file);
    fs.writeFileSync(p, JSON.stringify(screen, null, 2) + '\n');
    console.log('Wrote', p, '-', screen.components.length, 'components');
  }
}
