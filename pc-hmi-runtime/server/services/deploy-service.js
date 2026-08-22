const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RUNTIME_DIRS = ['server', 'public', 'electron', 'config', 'schemas'];
const RUNTIME_FILES = ['package.json', 'package-lock.json'];

class DeployService {
  constructor(rootDir) {
    this.root = rootDir;
    this.outputRoot = path.join(rootDir, 'deploy', 'packages');
  }

  ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
  }

  copyRecursive(src, dest) {
    fs.cpSync(src, dest, { recursive: true, force: true });
  }

  buildPanelPackage(projectId, projectService) {
    if (!projectService.projectExists(projectId)) {
      throw new Error('Project not found');
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const packageName = `${projectId}-panel-${stamp}`;
    const outDir = path.join(this.outputRoot, packageName);
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }
    this.ensureDir(outDir);

    for (const dir of RUNTIME_DIRS) {
      const src = path.join(this.root, dir);
      if (fs.existsSync(src)) this.copyRecursive(src, path.join(outDir, dir));
    }
    for (const file of RUNTIME_FILES) {
      const src = path.join(this.root, file);
      if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outDir, file));
    }

    this.ensureDir(path.join(outDir, 'projects'));
    this.copyRecursive(
      projectService.projectPath(projectId),
      path.join(outDir, 'projects', projectId)
    );
    fs.writeFileSync(
      path.join(outDir, 'projects', '.active.json'),
      JSON.stringify({ activeId: projectId }, null, 2),
      'utf8'
    );

    const startBat = `@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing Plant HMI runtime dependencies...
  call npm install --omit=dev
)
set PORT=8080
echo Starting Plant HMI Runtime for project ${projectId}
start "" http://127.0.0.1:8080/runtime.html?project=${projectId}
node server/index.js
`;
    const kioskBat = `@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing Plant HMI runtime dependencies...
  call npm install --omit=dev
)
echo Starting Plant HMI Kiosk Runtime for project ${projectId}
npm run desktop:kiosk
`;
    const readme = `# Plant HMI Panel Package — ${projectId}

1. Copy this entire folder to the panel PC (e.g. C:\\PlantHMI)
2. Install Node.js 18+ on the panel if not already installed
3. Double-click start-panel.bat for browser runtime
4. Double-click start-panel-kiosk.bat for fullscreen Electron kiosk

Runtime URL: http://127.0.0.1:8080/runtime.html?project=${projectId}

Configure PLC IP in Studio Communications Setup before deploy, or switch mode at runtime via the comm status indicator.
`;
    fs.writeFileSync(path.join(outDir, 'start-panel.bat'), startBat, 'utf8');
    fs.writeFileSync(path.join(outDir, 'start-panel-kiosk.bat'), kioskBat, 'utf8');
    fs.writeFileSync(path.join(outDir, 'PANEL-README.txt'), readme, 'utf8');

    const zipPath = path.join(this.outputRoot, `${packageName}.zip`);
    if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });
    try {
      execSync(
        `powershell -NoProfile -Command "Compress-Archive -Path '${outDir.replace(/'/g, "''")}\\*' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force"`,
        { stdio: 'pipe' }
      );
    } catch (err) {
      return {
        packageDir: outDir,
        zipPath: null,
        zipError: err.message || 'Zip creation failed — use folder copy instead'
      };
    }

    return {
      packageDir: outDir,
      zipPath,
      packageName,
      projectId
    };
  }

  deployToTarget(projectId, targetPath, projectService) {
    const normalized = path.resolve(String(targetPath || '').trim());
    if (!normalized) throw new Error('Target path is required');
    this.ensureDir(normalized);

    const built = this.buildPanelPackage(projectId, projectService);
    const dest = path.join(normalized, `${projectId}-panel`);
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    this.copyRecursive(built.packageDir, dest);

    return {
      ...built,
      deployPath: dest
    };
  }

  listPackages() {
    if (!fs.existsSync(this.outputRoot)) return [];
    return fs.readdirSync(this.outputRoot)
      .filter((name) => name.endsWith('.zip'))
      .map((name) => ({
        name,
        path: path.join(this.outputRoot, name),
        mtime: fs.statSync(path.join(this.outputRoot, name)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);
  }
}

module.exports = { DeployService };
