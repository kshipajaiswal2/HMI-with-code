const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ProjectService } = require('../server/services/project-service');
const { buildManualShell } = require('../public/template-compose');

function makeProjectService() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plant-hmi-isolation-'));
  const configDir = path.join(rootDir, 'config');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(path.join(configDir, 'navigation.json'), JSON.stringify({
    subNav: {
      overview: [
        { screen: '100_Overview' },
        { screen: '101_Production_Data' }
      ]
    }
  }, null, 2));
  fs.mkdirSync(path.join(rootDir, 'projects', 'a', 'Gfx'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'projects', 'a', 'Global Objects'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'projects', 'a', 'project.json'), JSON.stringify({
    id: 'a',
    name: 'Alpha',
    runtime: { width: 800, height: 600 },
    studio: { globalObjectDefaults: {} }
  }, null, 2));

  const otherScreen = {
    id: '101_Production_Data',
    title: 'Production Data',
    navGroup: 'overview',
    overviewShell: {
      OverviewNav_102_Prestart: { left: 99, top: 100, width: 70, height: 40, caption: 'Remote value' },
      ScreenSubtitle: { caption: 'Remote subtitle' }
    }
  };
  const localScreen = {
    id: '100_Overview',
    title: 'Overview',
    navGroup: 'overview',
    overviewShell: {
      OverviewNav_101_Production_Data: { left: 8, top: 75, width: 66, height: 35 },
      ScreenSubtitle: { caption: 'Local subtitle' }
    }
  };

  fs.writeFileSync(path.join(rootDir, 'projects', 'a', 'Gfx', '101_Production_Data.json'), JSON.stringify(otherScreen, null, 2));
  fs.writeFileSync(path.join(rootDir, 'projects', 'a', 'Gfx', '100_Overview.json'), JSON.stringify(localScreen, null, 2));

  return new ProjectService(rootDir);
}

test('nav overrides merge across sibling screens in the same nav group', () => {
  const service = makeProjectService();
  const rawScreen = {
    id: '100_Overview',
    navGroup: 'overview',
    overviewShell: {
      ScreenSubtitle: { caption: 'Local subtitle' }
    }
  };

  const result = service.mergeSharedNavShell('a', rawScreen);

  assert.equal(result.overviewShell.OverviewNav_101_Production_Data.left, 8);
  assert.equal(result.overviewShell.OverviewNav_102_Prestart.left, 99);
  assert.equal(result.overviewShell.OverviewNav_102_Prestart.width, 70);
  assert.equal(result.overviewShell.OverviewNav_102_Prestart.caption, undefined);
});

test('manual nav shell uses scaled 800x600 geometry', () => {
  const screen = {
    id: '300_Manual_Operation',
    navGroup: 'manual',
    title: 'Manual Operation',
    subtitle: 'Manual Operation'
  };

  const shell = buildManualShell(screen);
  const plcIo = shell.find((c) => c.name === 'ManualNav_301_PLC_IO_List');
  const architecture = shell.find((c) => c.name === 'ManualNav_302_PLC_Architecture');

  assert.deepEqual({
    left: plcIo.left,
    top: plcIo.top,
    width: plcIo.width,
    height: plcIo.height
  }, { left: 8, top: 75, width: 66, height: 35 });

  assert.deepEqual({
    left: architecture.left,
    top: architecture.top,
    width: architecture.width,
    height: architecture.height
  }, { left: 8, top: 131, width: 66, height: 35 });
});

test('new projects default to project A as the starter source', () => {
  const service = makeProjectService();
  assert.equal(service.getDefaultNewProjectSourceId(), 'a');
});
