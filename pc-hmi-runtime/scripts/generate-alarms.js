/** Generate 400_Active_Alarms + 401_Alarm_History (FT 500/501 scaled 800/1024). */
const fs = require('fs');
const path = require('path');

const SCALE = 800 / 1024;
const s = (n) => Math.round(Number(n) * SCALE);

const DEMO_MESSAGE = 'ABCDE FGHIJK LMNOPQ RSTUV WXYZ ABCDE FGHIJK LMNOPQ RSTUV WXYZ';

function buildAlarmList(name, mode) {
  const inactiveUnacked = mode === 'history';
  return {
    type: 'AlarmList',
    name,
    left: s(102),
    top: s(87),
    width: s(868),
    height: s(547),
    visible: true,
    backColor: '#dcdcdc',
    backStyle: 'solid',
    borderStyle: 'raisedInset',
    borderWidth: 2,
    borderUsesBackColor: false,
    selectionForeColor: '#ffffff',
    selectionBackColor: '#000080',
    displayHeader: true,
    fontFamily: 'Arial',
    fontSize: 12,
    bold: false,
    headerForeColor: '#000000',
    headerBackColor: '#808080',
    displayAlarmTime: true,
    headerTextAlarmTime: 'Alarm time',
    headerTextMessage: 'Message',
    formatAlarmTime: 'shortDateTime',
    displayActiveAckedAlarms: true,
    displayActiveUnackedAlarms: true,
    displayInactiveAckedAlarms: true,
    displayInactiveUnackedAlarms: inactiveUnacked,
    selectedAlarmIndicator: 'highlightBar',
    linesPerAlarm: 1,
    wordWrap: true,
    useAlarmIdentifier: true,
    alarmIdentifierTag: 'Alarmtext',
    listMode: mode,
    demoMessage: DEMO_MESSAGE
  };
}

function buildListNavButtons(listName) {
  const left = s(974);
  const btnW = s(46);
  const specs = [
    { type: 'MoveUpKey', name: 'MoveUpButton1', top: s(88), height: s(47), image: 'Arrow Up.bmp' },
    { type: 'PageUpKey', name: 'PageUpButton1', top: s(151), height: s(48), image: 'Page Up.bmp' },
    { type: 'PageDownKey', name: 'PageDownButton1', top: s(522), height: s(48), image: 'Page Down.bmp' },
    { type: 'MoveDownKey', name: 'MoveDownButton1', top: s(586), height: s(48), image: 'Arrow Down.bmp' }
  ];
  return specs.map(({ type, name, top, height, image }) => ({
    type,
    name,
    left,
    top,
    width: btnW,
    height,
    visible: true,
    linkedObject: listName,
    borderStyle: 'raised',
    borderWidth: 3,
    borderUsesBackColor: true,
    backStyle: 'solid',
    backColor: '#A0A0A4',
    useBackColor: true,
    image,
    audio: true,
    touch: true
  }));
}

function buildFooterNote(caption) {
  return {
    type: 'Text',
    name: 'AlarmFooterNote',
    caption,
    left: s(102),
    top: s(638),
    width: s(764),
    height: s(22),
    fontFamily: 'Arial',
    fontSize: 14,
    bold: false,
    foreColor: '#000000',
    backStyle: 'transparent',
    alignment: 'middleCenter',
    wordWrap: true,
    visible: true
  };
}

function buildMuteButton() {
  return {
    type: 'MaintainedButton',
    name: 'BuzzerSilenceButton',
    left: s(10),
    top: s(312),
    width: s(85),
    height: s(45),
    visible: true,
    tag: 'System.HMI_BuzzerSilence',
    indicatorTag: 'System.HMI_BuzzerSilence',
    borderStyle: 'raised',
    borderWidth: 3,
    borderUsesBackColor: true,
    backStyle: 'solid',
    backColor: '#dcdcdc',
    useBackColor: true,
    audio: true,
    touch: true,
    states: [
      {
        id: 'State0', value: 0, useBackColor: true, backColor: '#dcdcdc',
        image: 'mute1-Photoroom.bmp', caption: ''
      },
      {
        id: 'State1', value: 1, useBackColor: true, backColor: '#dcdcdc',
        image: 'mute1-Photoroom.bmp', caption: ''
      }
    ]
  };
}

function buildClearHistoryButton() {
  return {
    type: 'ClearAlarmHistoryButton',
    name: 'ClearAlarmHistoryButton1',
    left: s(10),
    top: s(312),
    width: s(85),
    height: s(45),
    visible: true,
    image: 'clear-history6-Photoroom.bmp',
    borderStyle: 'raised',
    borderWidth: 3,
    borderUsesBackColor: true,
    backStyle: 'solid',
    backColor: '#dcdcdc',
    useBackColor: true,
    resetAlarmStatus: true,
    audio: true,
    touch: true
  };
}

function alarmsTemplateReplace() {
  return {
    enabled: true,
    globalObjectId: 'Template',
    replace: {
      NavAlarms: {
        caption: 'Alarms',
        image: 'select_alarm.jpg',
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

const screens = {
  '400_Active_Alarms.json': {
    id: '400_Active_Alarms',
    title: 'Active Alarms',
    subtitle: 'Active Alarms',
    navGroup: 'alarms',
    securityLevel: 0,
    components: [
      buildAlarmList('AlarmList3', 'active'),
      ...buildListNavButtons('AlarmList3'),
      buildMuteButton(),
      buildFooterNote('Note : Select a alarm, then press alarm remedy button to see the remedy of particular alarm')
    ],
    displaySettings: { backgroundColor: '#EBEBEB', useProjectSize: true },
    template: alarmsTemplateReplace()
  },
  '401_Alarm_History.json': {
    id: '401_Alarm_History',
    title: 'Alarm History',
    subtitle: 'Alarm History',
    navGroup: 'alarms',
    securityLevel: 0,
    components: [
      buildAlarmList('AlarmList3', 'history'),
      ...buildListNavButtons('AlarmList3'),
      buildClearHistoryButton(),
      buildFooterNote('Note : To Delete Alarms Manager Login will be required')
    ],
    displaySettings: { backgroundColor: '#EBEBEB', useProjectSize: true },
    template: alarmsTemplateReplace()
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
