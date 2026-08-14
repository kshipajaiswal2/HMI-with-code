/** Generate 303_Run_Count from FactoryTalk 112_Run Count layout (scaled 800/1024). */

const fs = require('fs');

const path = require('path');



const SCALE = 800 / 1024;

const s = (n) => Math.round(Number(n) * SCALE);



function gradRect(name, left, top, width, height, backColor = '#C6C6C6', endColor = '#E8E8E8') {

  return {

    type: 'Rectangle', name, left, top, width, height, visible: true,

    backStyle: 'gradient', backColor, endColor,

    gradientStop: 95, gradientShadingStyle: 'gradientHorizontalFromRight',

    foreColor: backColor, lineWidth: 2, patternStyle: 'none'

  };

}



function wireLine(name, left, top, width, height, color = '#008080') {

  return {

    type: 'Rectangle', name, left, top, width, height, visible: true,

    backStyle: 'solid', backColor: color, useBackColor: true,

    foreColor: color, lineWidth: 0

  };

}



function resetBtn(name, left, top, active) {
  const green = '#00FF00';
  const grey = '#C6C6C6';
  const greenBorder = '#008000';
  const greyBorder = '#808080';
  const restBack = active ? green : grey;
  const restBorder = active ? greenBorder : greyBorder;

  return {
    type: 'MomentaryButton',
    name,
    caption: 'Reset',
    left,
    top,
    width: s(80),
    height: s(30),
    visible: true,
    borderStyle: 'raised',
    borderWidth: 2,
    borderUsesBackColor: false,
    useBorderColor: true,
    borderColor: restBorder,
    backStyle: 'solid',
    shape: 'rectangle',
    useBackColor: true,
    backColor: restBack,
    useHighlightColor: true,
    highlightColor: '#00FF00',
    buttonMode: 'normallyOpen',
    holdTime: 50,
    buttonType: 'momentary',
    value: 1,
    releaseValue: 0,
    audio: true,
    touch: true,
    horizontalMargin: 0,
    verticalMargin: 0,
    fontFamily: 'Arial',
    fontSize: 11,
    bold: true,
    alignment: 'middleCenter',
    wordWrap: false,
    states: [
      {
        id: 'State0', value: 0, useBackColor: true, backColor: restBack,
        useBorderColor: true, borderColor: restBorder, caption: 'Reset',
        captionColor: '#000000', useCaptionColor: true,
        wordWrap: false, alignment: 'middleCenter', blink: false
      },
      {
        id: 'State1', value: 1, useBackColor: true, backColor: restBack,
        useBorderColor: true, borderColor: restBorder, caption: 'Reset',
        captionColor: '#000000', useCaptionColor: true,
        wordWrap: false, alignment: 'middleCenter', blink: false
      }
    ]
  };
}



const ROWS = [

  { label: 'CES01 Stopper', resetActive: true },

  { label: 'Robot 01 Tool Changer Cap 01', resetActive: false },

  { label: 'Robot 01 Tool Changer Cap 02', resetActive: true },

  { label: 'Robot 01 Gripper Cylinder', resetActive: true },

  { label: 'Robot 02 Gripper Flap Cylinder', resetActive: false },

  { label: 'ROB01 Gripper Up Down Cylinder', resetActive: false },

  { label: 'Robot 01 Grip Ungrip Cylinder 01', resetActive: false },

  { label: 'SCARA Robot Up Down Cylinder', resetActive: false }

];



function buildRunCount() {
  const comps = [];

  const tableL = s(220);
  const tableT = s(185);
  const tableW = s(580);
  const tableBottom = s(542);
  const tableH = tableBottom - tableT;
  const headerT = s(194);
  const headerH = s(40);
  const rowH = s(38);
  const gridLineW = tableW - 2;
  const gridLineL = tableL + 1;
  const colDivH = tableT + tableH - headerT;

  const colParamL = s(228);
  const colParamW = s(272);
  const colSetL = s(510);
  const colSetW = s(88);
  const colOutL = s(610);
  const colOutW = s(88);
  const colResetL = s(710);
  const colResetW = s(80);

  comps.push({
    type: 'Rectangle', name: 'RunCountTableFrame', left: tableL, top: tableT,
    width: tableW, height: tableH, visible: true,
    backStyle: 'transparent', backColor: '#ffffff', foreColor: '#000000',
    lineWidth: 2, patternStyle: 'none'
  });

  comps.push(gradRect('RunCountHeaderRow', tableL + 2, headerT, tableW - 4, headerH));

  const rowTops = [238, 276, 314, 352, 390, 428, 466, 504];

  rowTops.forEach((ftTop, i) => {
    const row = i + 1;
    const rowTop = s(ftTop);
    const alt = i % 2 === 1;

    if (alt) {
      comps.push({
        type: 'Rectangle', name: `RunCountRowBg_${row}`,
        left: tableL + 2, top: rowTop - 2, width: tableW - 4, height: rowH,
        visible: true, backStyle: 'solid', backColor: '#E8E8E8', useBackColor: true,
        foreColor: '#E8E8E8', lineWidth: 0
      });
    }

    const { label, resetActive } = ROWS[i];
    comps.push({
      type: 'Text', name: `RunCountParam_${row}`, caption: label,
      left: colParamL + 4, top: rowTop, width: colParamW - 8, height: s(30),
      fontFamily: 'Arial', fontSize: 11, bold: false, backStyle: 'transparent',
      foreColor: '#000000', alignment: 'middleLeft', wordWrap: false
    });

    comps.push({
      type: 'Text', name: `RunCountSet_${row}`, caption: 'NNNN',
      left: colSetL, top: rowTop, width: colSetW, height: s(30),
      fontFamily: 'Arial', fontSize: 11, bold: true, backStyle: 'solid',
      backColor: '#FFFFFF', useBackColor: true, foreColor: '#000000',
      alignment: 'middleCenter', wordWrap: false
    });

    comps.push({
      type: 'Text', name: `RunCountOut_${row}`, caption: 'NNNNN',
      left: colOutL, top: rowTop, width: colOutW, height: s(30),
      fontFamily: 'Arial', fontSize: 11, bold: true, backStyle: 'gradient',
      backColor: '#C6C6C6', endColor: '#E8E8E8',
      gradientStop: 95, gradientShadingStyle: 'gradientHorizontalFromRight',
      useBackColor: true, foreColor: '#000000', alignment: 'middleCenter', wordWrap: false
    });

    comps.push(resetBtn(`RunCountReset_${row}`, colResetL, rowTop, resetActive));
  });

  for (const ftTop of [230, 268, 306, 344, 382, 420, 458, 496]) {
    comps.push(wireLine(`RunCountRowLine_${ftTop}`, gridLineL, s(ftTop), gridLineW, 1));
  }
  comps.push(wireLine('RunCountRowLineBottom', gridLineL, tableBottom - 1, gridLineW, 1));

  const colDividers = [
    { name: 'RunCountColDivSet', left: colSetL - 2 },
    { name: 'RunCountColDivOut', left: colOutL - 2 },
    { name: 'RunCountColDivReset', left: colResetL - 2 }
  ];
  colDividers.forEach(({ name, left }) => {
    comps.push(wireLine(name, left, headerT, 1, colDivH, '#FFFFFF'));
  });

  const headerLabels = [
    { name: 'RunCountHdrParams', caption: 'Parameters', left: colParamL, width: colParamW, fontSize: 12, wordWrap: false },
    { name: 'RunCountHdrSet', caption: 'Run Set\nCount', left: colSetL, width: colSetW, fontSize: 11, wordWrap: true },
    { name: 'RunCountHdrOut', caption: 'Run Out\nCount', left: colOutL, width: colOutW, fontSize: 11, wordWrap: true },
    { name: 'RunCountHdrReset', caption: 'Reset', left: colResetL, width: colResetW, fontSize: 12, wordWrap: false }
  ];
  headerLabels.forEach(({ name, caption, left, width, fontSize, wordWrap }) => {
    comps.push({
      type: 'Text', name, caption,
      left, top: headerT, width, height: headerH,
      fontFamily: 'Arial', fontSize, bold: true, backStyle: 'transparent',
      foreColor: '#000000', alignment: 'middleCenter', wordWrap
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



const screen = {

  id: '303_Run_Count',

  title: 'Run Count',

  subtitle: 'Run Count',

  navGroup: 'manual',

  securityLevel: 1,

  components: buildRunCount(),

  displaySettings: { backgroundColor: '#EBEBEB', useProjectSize: true },

  template: manualTemplateReplace()

};



const outDirs = [

  path.join(__dirname, '../projects/a/Gfx'),

  path.join(__dirname, '../projects/_template/Gfx'),

  path.join(__dirname, '../screens')

];



for (const dir of outDirs) {

  const p = path.join(dir, '303_Run_Count.json');

  fs.writeFileSync(p, JSON.stringify(screen, null, 2) + '\n');

  console.log('Wrote', p, '-', screen.components.length, 'components');

}


