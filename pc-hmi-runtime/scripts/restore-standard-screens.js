const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(ROOT, '..');
const lib = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'standard-screens.json'), 'utf8'));

function readFromGit(screenId) {
  const gitPath = `pc-hmi-runtime/screens/${screenId}.json`;
  return execSync(`git show HEAD:${gitPath}`, {
    cwd: REPO_ROOT,
    encoding: 'utf8'
  });
}

let count = 0;
for (const entry of lib.screens) {
  const content = readFromGit(entry.id);
  for (const dir of ['screens', 'projects/_template/screens']) {
    const dest = path.join(ROOT, dir, `${entry.id}.json`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content.endsWith('\n') ? content : `${content}\n`);
    count += 1;
  }
}

console.log(`Restored ${count} starter screen files from git.`);
