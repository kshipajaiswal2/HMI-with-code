const socket = io();

const bridgeStatus = document.getElementById('bridgeStatus');
const exportsList = document.getElementById('exportsList');
const refreshBtn = document.getElementById('refreshBtn');

const pageName = document.getElementById('pageName');
const screenWidth = document.getElementById('screenWidth');
const screenHeight = document.getElementById('screenHeight');
const previewBtn = document.getElementById('previewBtn');
const saveScreenBtn = document.getElementById('saveScreenBtn');
const previewPane = document.getElementById('previewPane');

function kb(sizeBytes) {
  return `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function setBridgeCard(status) {
  const dot = bridgeStatus.querySelector('.dot');
  dot.style.background = status.connected ? '#27ae60' : '#e74c3c';
  bridgeStatus.querySelector('span:last-child').textContent =
    `Bridge live | exports ${status.exportsCount} | screens ${status.screensCount}`;
}

function renderExports(files) {
  exportsList.innerHTML = '';
  if (!files.length) {
    exportsList.innerHTML = '<li>No exported files found in ftio/inbound yet.</li>';
    return;
  }

  for (const file of files) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/api/exports/download/${encodeURIComponent(file.name)}`;
    link.textContent = file.name;
    link.target = '_blank';

    const meta = document.createElement('div');
    meta.textContent = `${kb(file.sizeBytes)} | ${new Date(file.lastModified).toLocaleString()}`;

    li.appendChild(link);
    li.appendChild(meta);
    exportsList.appendChild(li);
  }
}

async function refreshExports() {
  const res = await fetch('/api/exports');
  if (!res.ok) {
    throw new Error('Failed to load exports');
  }
  const data = await res.json();
  renderExports(data.files);
}

function renderPreview() {
  const name = pageName.value.trim() || 'Untitled Screen';
  const width = Number(screenWidth.value) || 1;
  const height = Number(screenHeight.value) || 1;

  previewPane.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'preview-header';
  header.textContent = `${name} (${width} x ${height})`;
  previewPane.appendChild(header);

  const frame = document.createElement('div');
  frame.className = 'preview-frame';
  frame.style.aspectRatio = `${width} / ${height}`;

  const row = document.createElement('div');
  row.className = 'preview-controls';

  const run = document.createElement('div');
  run.className = 'hmi-btn run';
  run.textContent = 'Run';

  const stop = document.createElement('div');
  stop.className = 'hmi-btn stop';
  stop.textContent = 'Stop';

  const error = document.createElement('div');
  error.className = 'hmi-btn error';
  error.textContent = 'Error';

  row.appendChild(run);
  row.appendChild(stop);
  row.appendChild(error);
  frame.appendChild(row);
  previewPane.appendChild(frame);
}

previewBtn.addEventListener('click', renderPreview);
refreshBtn.addEventListener('click', () => {
  refreshExports().catch((err) => {
    console.error(err);
    alert('Could not refresh exported files list');
  });
});

saveScreenBtn.addEventListener('click', async () => {
  const payload = {
    pageName: pageName.value,
    width: Number(screenWidth.value),
    height: Number(screenHeight.value)
  };

  const res = await fetch('/api/screens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Failed to save screen');
    return;
  }

  alert(`Screen spec saved as ${data.saved}`);
  await refreshExports();
});

socket.on('bridge-status', (status) => {
  setBridgeCard(status);
  refreshExports().catch(() => {});
});

async function init() {
  const res = await fetch('/api/bridge/status');
  const status = await res.json();
  setBridgeCard(status);
  await refreshExports();
  renderPreview();
}

init().catch((err) => {
  console.error(err);
  bridgeStatus.querySelector('span:last-child').textContent = 'Bridge unavailable';
});
