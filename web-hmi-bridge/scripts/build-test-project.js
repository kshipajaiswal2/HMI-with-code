const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const xlsxPath = 'D:/Kshipa/PlantHMI/hmi/import_templates/VAPR069_Master Sheet_V05.xlsx';
const xmlPath = path.join(ROOT, 'ftio/default-pages/303_IO_List.xml');

function convertXlsx(buffer) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5050,
      path: '/api/convert-io-list-xlsx',
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': buffer.length }
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 400) {
          reject(new Error(body));
          return;
        }
        resolve(JSON.parse(body));
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

async function main() {
  const buffer = fs.readFileSync(xlsxPath);
  const converted = await convertXlsx(buffer);
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const now = new Date().toISOString();
  const project = {
    id: 'project-test-io',
    name: 'IO Test',
    collapsed: false,
    tagsFiles: [{
      id: 'csv-test',
      name: 'IO Test-Tags.CSV',
      content: converted.csv,
      sizeBytes: Buffer.byteLength(converted.csv),
      lastModified: now
    }],
    parametersFiles: [],
    ioListFiles: [{
      id: 'io-test',
      name: 'VAPR069_Master Sheet_V05.xlsx',
      content: '# test',
      sizeBytes: 6,
      lastModified: now,
      sourceType: 'xlsx'
    }],
    ioListMeta: converted.parsed.meta,
    ioListPreviewZone: 'Packing',
    ioListPreviewPage: 1,
    tagsCollapsed: false,
    parametersCollapsed: false,
    ioListCollapsed: false,
    folders: [{
      name: '300_Manual_Operation',
      collapsed: false,
      screens: [{
        name: '303_IO_List.xml',
        xml,
        width: 1024,
        height: 768,
        sizeBytes: Buffer.byteLength(xml),
        lastModified: now
      }]
    }],
    popupTemplates: [],
    popupPlanRows: []
  };

  const out = path.join(__dirname, 'test-project.json');
  fs.writeFileSync(out, JSON.stringify([project]));
  console.log('Wrote', out, 'tags', converted.parsed.tags.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
