const socket = io();

const bridgeStatus = document.getElementById('bridgeStatus');
const inboundList = document.getElementById('inboundList');
const outboundList = document.getElementById('outboundList');
const uploadForm = document.getElementById('uploadForm');
const target = document.getElementById('target');
const fileInput = document.getElementById('fileInput');

const pageName = document.getElementById('pageName');
const pagePrompt = document.getElementById('pagePrompt');
const btnRun = document.getElementById('btnRun');
const btnStop = document.getElementById('btnStop');
const btnError = document.getElementById('btnError');
const toggleMode = document.getElementById('toggleMode');
const previewBtn = document.getElementById('previewBtn');
const saveSpecBtn = document.getElementById('saveSpecBtn');
const previewPane = document.getElementById('previewPane');

function kb(sizeBytes) {
  return `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function setBridgeCard(status) {
  const dot = bridgeStatus.querySelector('.dot');
  dot.style.background = status.connected ? '#27ae60' : '#e74c3c';
  bridgeStatus.querySelector('span:last-child').textContent =
    `Bridge live | inbound ${status.inboundCount} | outbound ${status.outboundCount} | specs ${status.specsCount}`;
}

async function fetchBucket(bucket) {
  const res = await fetch(`/api/files/${bucket}`);
  if (!res.ok) {
    throw new Error(`Failed to load ${bucket}`);
  }
  return res.json();
}

function renderFiles(el, files, bucket) {
  el.innerHTML = '';
  if (!files.length) {
    el.innerHTML = '<li>No files</li>';
    return;
  }

  for (const file of files) {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/api/files/download/${bucket}/${encodeURIComponent(file.name)}`;
    link.textContent = file.name;
    link.target = '_blank';

    const meta = document.createElement('div');
    meta.textContent = `${kb(file.sizeBytes)} | ${new Date(file.lastModified).toLocaleString()}`;

    li.appendChild(link);
    li.appendChild(meta);
    el.appendChild(li);
  }
}

async function refreshLists() {
  const [inbound, outbound] = await Promise.all([
    fetchBucket('inbound'),
    fetchBucket('outbound')
  ]);
  renderFiles(inboundList, inbound.files, 'inbound');
  renderFiles(outboundList, outbound.files, 'outbound');
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!fileInput.files.length) {
    alert('Select a file first.');
    return;
  }

  const fd = new FormData();
  fd.append('target', target.value);
  fd.append('file', fileInput.files[0]);

  const res = await fetch('/api/files/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Upload failed');
    return;
  }

  fileInput.value = '';
  await refreshLists();
});

function buildControls() {
  const controls = [];
  if (btnRun.checked) controls.push({ key: 'Run', className: 'run' });
  if (btnStop.checked) controls.push({ key: 'Stop', className: 'stop' });
  if (btnError.checked) controls.push({ key: 'Error', className: 'error' });
  return controls;
}

function renderPreview() {
  const title = pageName.value.trim() || 'Untitled Page';
  const prompt = pagePrompt.value.trim();
  const controls = buildControls();

  previewPane.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'preview-header';
  header.textContent = title;
  previewPane.appendChild(header);

  const row = document.createElement('div');
  row.className = 'preview-controls';

  for (const ctl of controls) {
    const btn = document.createElement('div');
    btn.className = `hmi-btn ${ctl.className}${toggleMode.checked ? ' toggle' : ''}`;
    btn.textContent = ctl.key;
    row.appendChild(btn);
  }

  previewPane.appendChild(row);

  const note = document.createElement('div');
  note.className = 'preview-note';
  note.textContent = prompt || 'No prompt entered yet.';
  previewPane.appendChild(note);
}

previewBtn.addEventListener('click', renderPreview);

saveSpecBtn.addEventListener('click', async () => {
  const payload = {
    pageName: pageName.value,
    prompt: pagePrompt.value,
    controls: buildControls().map((c) => ({
      name: c.key,
      style: toggleMode.checked ? 'toggle' : 'momentary'
    }))
  };

  const res = await fetch('/api/specs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Failed to save spec');
    return;
  }

  alert(`Spec saved as ${data.saved}`);
  await refreshLists();
});

socket.on('bridge-status', (status) => {
  setBridgeCard(status);
  refreshLists().catch(() => {});
});

async function init() {
  const res = await fetch('/api/bridge/status');
  const status = await res.json();
  setBridgeCard(status);
  await refreshLists();
  renderPreview();
}

init().catch((err) => {
  console.error(err);
  bridgeStatus.querySelector('span:last-child').textContent = 'Bridge unavailable';
});
