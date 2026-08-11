/** FactoryTalk Template.xml decomposed into editable canvas objects (800×600) */
function sx(n) { return Math.round(n * 800 / 1024); }
function sy(n) { return Math.round(n * 600 / 768); }

const modeIndicator = {
  type: 'MultistateIndicator',
  name: 'ModeIndicator',
  tag: 'System.AutoMode',
  left: sx(856),
  top: sy(42),
  width: sx(71),
  height: sy(33),
  visible: true,
  states: [
    { id: 'Error', caption: 'Error', backColor: 'navy', borderColor: 'navy', captionColor: '#fff' },
    { id: '0', value: 0, caption: 'Manual', backColor: 'blue', borderColor: '#ff8000', captionColor: '#fff' },
    { id: '1', value: 1, caption: 'Auto', backColor: '#00c000', borderColor: '#40ff10', captionColor: '#fff' }
  ]
};

const healthIndicator = {
  type: 'MultistateIndicator',
  name: 'HealthIndicator',
  tag: 'System.Healthy',
  left: sx(940),
  top: sy(42),
  width: sx(71),
  height: sy(33),
  visible: true,
  states: [
    { id: 'Error', caption: 'Error', backColor: '#001C38', borderColor: '#001C38', captionColor: '#fff' },
    { id: '0', value: 0, caption: 'Fault', backColor: 'red', borderColor: '#ff8000', captionColor: '#fff' },
    { id: '1', value: 1, caption: 'Healthy', backColor: '#00c000', borderColor: '#40ff10', captionColor: '#fff' }
  ]
};

function gotoButton(name, label, target, image, left, top, wordWrap = false) {
  return {
    type: 'GotoButton',
    name,
    label,
    target,
    image,
    left: sx(left),
    top: sy(top),
    width: sx(70),
    height: sy(70),
    visible: true,
    backColor: '#dcdcdc',
    backStyle: 'solid',
    borderStyle: 'raised',
    borderWidth: 3,
    borderUsesBackColor: true,
    fontFamily: 'Arial',
    fontSize: 10,
    bold: true,
    wordWrap,
    alignment: 'bottomCenter'
  };
}

function defaultTemplateComponents() {
  return [
    {
      type: 'Rectangle',
      name: 'HeaderBar',
      left: 0,
      top: 0,
      width: 800,
      height: sy(80),
      visible: true,
      backColor: '#ffffff',
      borderColor: '#c6c6c6'
    },
    {
      type: 'Image',
      name: 'Logo',
      image: 'Cybernetik-Logo_1-removebg-preview.bmp',
      left: sx(10),
      top: sy(18),
      width: sx(226),
      height: sy(42),
      visible: true,
      backStyle: 'transparent'
    },
    {
      type: 'Text',
      name: 'Title',
      caption: 'Processing System',
      left: sx(414),
      top: sy(6),
      width: sx(196),
      height: sy(24),
      visible: true,
      fontFamily: 'Arial',
      fontSize: 13,
      bold: true,
      italic: false,
      underline: false,
      foreColor: '#000000',
      useForeColor: true,
      backStyle: 'transparent',
      wordWrap: false,
      sizeToFit: true,
      alignment: 'middleCenter'
    },
    {
      type: 'TimeDateDisplay',
      name: 'Clock',
      left: sx(845),
      top: sy(11),
      width: sx(177),
      height: sy(20),
      visible: true,
      fontFamily: 'Arial',
      fontSize: 10,
      bold: true,
      foreColor: '#000000',
      alignment: 'middleCenter'
    },
    modeIndicator,
    healthIndicator,
    {
      type: 'Rectangle',
      name: 'FooterBar',
      left: 0,
      top: sy(668),
      width: 800,
      height: sy(80),
      visible: true,
      backColor: '#ffffff',
      borderColor: '#c6c6c6'
    },
    gotoButton('NavOverview', 'Overview', '100_Overview', 'button2_home.jpg', 10, 672),
    gotoButton('NavSettings', 'Settings', '200_Settings', 'button2_settings.bmp', 123, 672),
    gotoButton('NavManual', 'Manual', '300_Manual_Operation', 'manual1.jpg', 236, 672),
    gotoButton('NavAlarms', 'Alarms', '400_Active_Alarms', 'button2_alarm.bmp', 349, 672),
    gotoButton('NavRecipe', 'Recipe', '500_Recipe', 'recipe1 1.bmp', 462, 672),
    gotoButton('NavLegends', 'Legends', '600_Legends', 'legend1.jpg', 575, 672),
    {
      type: 'StringDisplay',
      name: 'CurrentUser',
      left: sx(808),
      top: sy(684),
      width: sx(120),
      height: sy(48),
      visible: true,
      caption: 'Guest',
      useCurrentUser: true,
      fontFamily: 'Arial',
      fontSize: 10,
      bold: true,
      foreColor: '#ffffff',
      backColor: '#808080',
      backStyle: 'solid',
      alignment: 'middleCenter'
    },
    gotoButton('NavUserLogin', 'User Login', '700_User_Management', 'userorange_2.bmp', 942, 672, true),
    {
      type: 'AlarmTicker',
      name: 'AlarmTicker',
      left: sx(6),
      top: sy(749),
      width: sx(1019),
      height: sy(21),
      visible: true,
      caption: 'ABCDE FGHIJK LMNOPQ RSTUV WXYZ ABCDE FGHIJK LMNOPQ RSTUV WXYZ',
      foreColor: '#cc0000',
      backColor: '#ffffff',
      backStyle: 'solid',
      fontFamily: 'Arial',
      fontSize: 10,
      bold: true
    }
  ];
}

module.exports = { defaultTemplateComponents };
