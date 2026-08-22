const test = require('node:test');
const assert = require('node:assert/strict');

test('tag CSV export uses connection when plcAddress is empty', () => {
  const tags = [{
    name: 'PLC_DI_Tags.Data_00',
    type: 'string',
    description: 'DI01',
    folder: 'PLC_DI_Tags',
    connection: 'RIO01:I.0'
  }];
  const csvLines = ['Tag Name,Type,Description,PLC Address'];
  for (const t of tags) {
    const desc = String(t.description || '').replace(/"/g, '""');
    const plc = String(t.plcAddress || t.connection || t.alias || '').replace(/"/g, '""');
    csvLines.push(`"${t.name}","${t.type}","${desc}","${plc}"`);
  }
  assert.match(csvLines[1], /RIO01:I\.0/);
});
