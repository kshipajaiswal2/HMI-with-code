/** Equipment Status legend (FT Group24 @ 201_Settings.xml, scaled 800/1024). */
const SCALE = 800 / 1024;
const s = (n) => Math.round(Number(n) * SCALE);

function wireRect(name, left, top, width, height, color = '#000000') {
  return {
    type: 'Rectangle', name, left, top, width, height, visible: true,
    backStyle: 'solid', backColor: color, useBackColor: true,
    foreColor: color, lineWidth: 0
  };
}

function buildLegend(prefix = 'ManualLegend') {
  const boxL = s(867);
  const boxT = s(82);
  const boxW = s(155);
  const boxH = s(143);
  const items = [
    { color: 'red', label: 'Fault', swatchTop: 116, swatchH: 18, labelTop: 113, labelW: 117, labelH: 23 },
    { color: '#71FF71', label: 'Automatic - Idle', swatchTop: 138, swatchH: 17, labelTop: 134, labelW: 120, labelH: 23 },
    { color: 'green', label: 'Automatic - Run', swatchTop: 159, swatchH: 17, labelTop: 154, labelW: 119, labelH: 24 },
    { color: '#00F0FF', label: 'Manual - Idle', swatchTop: 180, swatchH: 17, labelTop: 178, labelW: 117, labelH: 22 },
    { color: 'blue', label: 'Manual - Run', swatchTop: 201, swatchH: 17, labelTop: 198, labelW: 118, labelH: 24 }
  ];
  const comps = [
    {
      type: 'Rectangle', name: `${prefix}Box`, left: boxL, top: boxT, width: boxW, height: boxH,
      visible: true, backStyle: 'solid', backColor: '#E8E8E8', useBackColor: true,
      foreColor: '#000000', lineWidth: 1
    },
    {
      type: 'Text', name: `${prefix}Title`, caption: 'Equipment Status',
      left: s(884), top: s(85), width: s(127), height: s(20),
      fontFamily: 'Arial', fontSize: 12, backStyle: 'transparent', alignment: 'middleCenter',
      wordWrap: false
    }
  ];
  items.forEach((item, i) => {
    comps.push(wireRect(
      `${prefix}Swatch${i}`, s(874), s(item.swatchTop), s(16), s(item.swatchH), item.color
    ));
    comps.push({
      type: 'Text', name: `${prefix}Label${i}`, caption: item.label,
      left: s(894), top: s(item.labelTop), width: s(item.labelW), height: s(item.labelH),
      fontFamily: 'Arial', fontSize: 12, backStyle: 'transparent', alignment: 'middleLeft',
      wordWrap: false
    });
  });
  return comps;
}

module.exports = { buildLegend, wireRect, s, SCALE };
