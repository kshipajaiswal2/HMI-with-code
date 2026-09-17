const fs = require('fs');
const os = require('os');
const path = require('path');

const SKIP_DIRS = new Set([
  '$recycle.bin',
  'system volume information',
  'recovery',
  'config.msi'
]);

function existsDir(folder) {
  try {
    return fs.statSync(folder).isDirectory();
  } catch {
    return false;
  }
}

function uniqueFolders(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = String(item.path || item.id || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function oneDriveFolders(home) {
  const candidates = [
    process.env.OneDriveCommercial,
    process.env.OneDrive,
    path.join(home, 'OneDrive'),
    path.join(home, 'OneDrive - Personal')
  ].filter(Boolean);
  return uniqueFolders(candidates.filter(existsDir).map((folder) => ({
    id: `onedrive-${path.basename(folder)}`,
    label: path.basename(folder),
    icon: 'onedrive',
    path: folder
  })));
}

function specialFolders() {
  const home = os.homedir();
  const known = [
    { id: 'documents', label: 'Documents', icon: 'documents', path: path.join(home, 'Documents') },
    { id: 'gallery', label: 'Gallery', icon: 'gallery', path: path.join(home, 'Pictures') },
    ...oneDriveFolders(home),
    { id: 'desktop', label: 'Desktop', icon: 'desktop', path: path.join(home, 'Desktop') },
    { id: 'downloads', label: 'Downloads', icon: 'downloads', path: path.join(home, 'Downloads') },
    { id: 'music', label: 'Music', icon: 'music', path: path.join(home, 'Music') },
    { id: 'pictures', label: 'Pictures', icon: 'pictures', path: path.join(home, 'Pictures') },
    { id: 'videos', label: 'Videos', icon: 'videos', path: path.join(home, 'Videos') },
    { id: 'thispc', label: 'This PC', icon: 'thispc', path: '', virtual: 'thispc' }
  ];
  return known.filter((item) => item.virtual || existsDir(item.path));
}

function documentsPath() {
  const docs = path.join(os.homedir(), 'Documents');
  return existsDir(docs) ? docs : os.homedir();
}

function listDrives() {
  if (process.platform !== 'win32') {
    return [{ name: 'Computer', path: path.parse(os.homedir()).root || '/' }];
  }
  const out = [];
  for (let i = 65; i <= 90; i += 1) {
    const letter = String.fromCharCode(i);
    const folder = `${letter}:\\`;
    if (existsDir(folder)) out.push({ name: `${letter}:`, path: folder, icon: 'drive' });
  }
  return out;
}

function resolveFolder(raw) {
  const value = String(raw || '').trim();
  if (!value) throw new Error('Folder path required');
  if (process.platform === 'win32' && /^[a-zA-Z]:$/.test(value)) {
    return path.resolve(`${value}\\`);
  }
  return path.resolve(value);
}

function listChildren(raw) {
  const folder = resolveFolder(raw);
  if (!existsDir(folder)) throw new Error('Folder not found');
  const entries = fs.readdirSync(folder, { withFileTypes: true });
  return entries
    .filter((entry) => {
      if (!entry.isDirectory()) return false;
      const name = String(entry.name || '');
      if (!name || SKIP_DIRS.has(name.toLowerCase())) return false;
      if (name.startsWith('.') && process.platform !== 'win32') return false;
      return true;
    })
    .map((entry) => ({
      name: entry.name,
      path: path.join(folder, entry.name),
      icon: 'folder'
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function makeFolder(parentRaw, nameRaw) {
  const parent = resolveFolder(parentRaw);
  if (!existsDir(parent)) throw new Error('Parent folder not found');
  const name = String(nameRaw || '').trim();
  if (!name) throw new Error('Folder name required');
  if (/[\\/:*?"<>|]/.test(name) || name === '.' || name === '..') {
    throw new Error('Invalid folder name');
  }
  const dest = path.join(parent, name);
  fs.mkdirSync(dest, { recursive: false });
  return dest;
}

module.exports = {
  specialFolders,
  documentsPath,
  listDrives,
  listChildren,
  makeFolder
};
