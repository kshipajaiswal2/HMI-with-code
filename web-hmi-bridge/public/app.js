const socket = io();

const bridgeStatus = document.getElementById('bridgeStatus');
const displaysList = document.getElementById('displaysList');
const refreshBtn = document.getElementById('refreshBtn');

const displayName = document.getElementById('displayName');
const screenWidth = document.getElementById('screenWidth');
const screenHeight = document.getElementById('screenHeight');
const xmlEditor = document.getElementById('xmlEditor');
const previewBtn = document.getElementById('previewBtn');
const applySizeBtn = document.getElementById('applySizeBtn');
const saveXmlBtn = document.getElementById('saveXmlBtn');
const buildPackageBtn = document.getElementById('buildPackageBtn');
const previewPane = document.getElementById('previewPane');
const packageResult = document.getElementById('packageResult');

const objType = document.getElementById('objType');
const objName = document.getElementById('objName');
const objCaption = document.getElementById('objCaption');
const objLeft = document.getElementById('objLeft');
const objTop = document.getElementById('objTop');
const objWidth = document.getElementById('objWidth');
const objHeight = document.getElementById('objHeight');
const objBackColor = document.getElementById('objBackColor');
const objBorderColor = document.getElementById('objBorderColor');
const objTextColor = document.getElementById('objTextColor');
const objFontSize = document.getElementById('objFontSize');
const applyObjectBtn = document.getElementById('applyObjectBtn');
const objBackColorPicker = document.getElementById('objBackColorPicker');
const objBorderColorPicker = document.getElementById('objBorderColorPicker');
const objTextColorPicker = document.getElementById('objTextColorPicker');
const objBackColorSwatch = document.getElementById('objBackColorSwatch');
const objBorderColorSwatch = document.getElementById('objBorderColorSwatch');
const objTextColorSwatch = document.getElementById('objTextColorSwatch');

let selectedDisplay = '';
let selectedFiles = [];
let selectedObjectIndex = null;

function fitCanvasToFrame(frame, canvas, width, height) {
  const frameStyles = getComputedStyle(frame);
  const horizontalPadding = parseFloat(frameStyles.paddingLeft || '0') + parseFloat(frameStyles.paddingRight || '0');
  const verticalPadding = parseFloat(frameStyles.paddingTop || '0') + parseFloat(frameStyles.paddingBottom || '0');
  const availableWidth = Math.max(1, frame.clientWidth - horizontalPadding);
  const availableHeight = Math.max(1, frame.clientHeight - verticalPadding);

  // Keep the full display visible and allow meaningful zoom-in in large panes.
  const scale = Math.min(2.2, availableWidth / width, availableHeight / height);
  const finalScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

  canvas.style.width = `${Math.floor(width * finalScale)}px`;
  canvas.style.height = `${Math.floor(height * finalScale)}px`;
}

function parseCaptionAlignment(alignmentRaw) {
  const alignment = String(alignmentRaw || '').toLowerCase();

  const horizontal = alignment.includes('right')
    ? 'right'
    : alignment.includes('left')
      ? 'left'
      : 'center';

  const vertical = alignment.includes('top')
    ? 'top'
    : alignment.includes('bottom')
      ? 'bottom'
      : 'middle';

  return { horizontal, vertical };
}

function applyCaptionStyles(box, node, captionNode) {
  const fontSize = Number(captionNode?.getAttribute('fontSize') || node.getAttribute('fontSize'));
  if (Number.isFinite(fontSize) && fontSize > 0) {
    box.style.fontSize = `${fontSize}px`;
  }

  const fontFamily = captionNode?.getAttribute('fontFamily') || node.getAttribute('fontFamily');
  if (fontFamily) {
    box.style.fontFamily = fontFamily;
  }

  const color = captionNode?.getAttribute('color') || node.getAttribute('foreColor');
  if (color) {
    box.style.color = color;
  }

  const bold = (captionNode?.getAttribute('bold') || '').toLowerCase() === 'true';
  const italic = (captionNode?.getAttribute('italic') || '').toLowerCase() === 'true';
  const underline = (captionNode?.getAttribute('underline') || '').toLowerCase() === 'true';
  const strike = (captionNode?.getAttribute('strikethrough') || '').toLowerCase() === 'true';

  box.style.fontWeight = bold ? '700' : '500';
  box.style.fontStyle = italic ? 'italic' : 'normal';
  box.style.textDecoration = [underline ? 'underline' : '', strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none';

  const wrap = (captionNode?.getAttribute('wordWrap') || '').toLowerCase() === 'true';
  box.style.whiteSpace = wrap ? 'normal' : 'nowrap';
  box.style.textOverflow = wrap ? 'clip' : 'ellipsis';

  const { horizontal, vertical } = parseCaptionAlignment(captionNode?.getAttribute('alignment'));
  box.style.textAlign = horizontal;
  box.style.justifyContent = horizontal === 'left' ? 'flex-start' : horizontal === 'right' ? 'flex-end' : 'center';
  box.style.alignItems = vertical === 'top' ? 'flex-start' : vertical === 'bottom' ? 'flex-end' : 'center';
}

function kb(sizeBytes) {
  return `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function setBridgeCard(status) {
  const dot = bridgeStatus.querySelector('.dot');
  dot.style.background = status.connected ? '#27ae60' : '#e74c3c';
  bridgeStatus.querySelector('span:last-child').textContent =
    `Bridge live | displays ${status.displaysCount} | edited ${status.editedCount}`;
}

function renderDisplays(files) {
  displaysList.innerHTML = '';
  selectedFiles = files.map((file) => file.name);

  if (!files.length) {
    displaysList.innerHTML = '<li>No display XML files found in the export folder.</li>';
    return;
  }

  for (const file of files) {
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = 'list-row';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'small-btn';
    openBtn.textContent = selectedDisplay === file.name ? 'Opened' : 'Open';
    openBtn.disabled = selectedDisplay === file.name;
    openBtn.addEventListener('click', () => {
      loadDisplay(file.name).catch((err) => {
        console.error(err);
        alert('Could not open display XML');
      });
    });

    const name = document.createElement('strong');
    name.textContent = file.name;

    row.appendChild(openBtn);
    row.appendChild(name);

    const meta = document.createElement('div');
    const sizeLabel = file.width && file.height ? `${file.width}x${file.height}` : 'size unknown';
    meta.textContent = `${file.source} | ${sizeLabel} | ${kb(file.sizeBytes)} | ${new Date(file.lastModified).toLocaleString()}`;

    li.appendChild(row);
    li.appendChild(meta);
    displaysList.appendChild(li);
  }
}

async function refreshDisplays() {
  const res = await fetch('/api/displays');
  if (!res.ok) {
    throw new Error('Failed to load displays');
  }
  const data = await res.json();
  renderDisplays(data.files);
}

function renderPreview() {
  const name = displayName.value.trim() || 'Untitled Display';
  const xml = xmlEditor.value.trim();
  if (!xml) {
    previewPane.innerHTML = '<div class="preview-empty">Open a display XML to see preview.</div>';
    return;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    previewPane.innerHTML = '<div class="preview-empty">XML parse error. Fix XML to render preview.</div>';
    return;
  }

  const displaySettings = doc.querySelector('displaySettings');
  const width = Number(displaySettings?.getAttribute('width')) || Number(screenWidth.value) || 1;
  const height = Number(displaySettings?.getAttribute('height')) || Number(screenHeight.value) || 1;
  const backColor = displaySettings?.getAttribute('backColor') || '#d9d9d9';

  previewPane.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'preview-header';
  header.textContent = `${name} (${width} x ${height})`;
  previewPane.appendChild(header);

  const frame = document.createElement('div');
  frame.className = 'preview-frame';
  frame.style.background = backColor;

  const canvas = document.createElement('div');
  canvas.className = 'xml-canvas';
  fitCanvasToFrame(frame, canvas, width, height);

  const gfxRoot = doc.querySelector('gfx');
  const objectNodes = gfxRoot ? Array.from(gfxRoot.children).filter((el) => el.tagName !== 'displaySettings') : [];
  if (selectedObjectIndex !== null && (selectedObjectIndex < 0 || selectedObjectIndex >= objectNodes.length)) {
    selectedObjectIndex = null;
    clearObjectPanel();
  }

  if (gfxRoot) {
    objectNodes.forEach((el, index) => {
      const left = Number(el.getAttribute('left'));
      const top = Number(el.getAttribute('top'));
      const w = Number(el.getAttribute('width'));
      const h = Number(el.getAttribute('height'));
      if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(w) || !Number.isFinite(h)) {
        return;
      }

      const box = document.createElement('div');
      box.className = 'xml-object';
      if (selectedObjectIndex === index) {
        box.classList.add('selected');
      }
      box.style.left = `${(left / width) * 100}%`;
      box.style.top = `${(top / height) * 100}%`;
      box.style.width = `${(w / width) * 100}%`;
      box.style.height = `${(h / height) * 100}%`;

      const bg = el.getAttribute('backColor');
      if (bg) {
        box.style.background = bg;
      }

      const border = el.getAttribute('borderColor');
      if (border) {
        box.style.borderColor = border;
      }

      const captionNode = Array.from(el.children).find((child) => child.tagName === 'caption');
      const caption = captionNode?.getAttribute('caption') || el.getAttribute('name') || el.tagName;
      box.textContent = caption;
      applyCaptionStyles(box, el, captionNode);
      box.title = `${el.tagName} (${left},${top}) ${w}x${h}`;
      box.addEventListener('click', (event) => {
        event.stopPropagation();
        selectedObjectIndex = index;
        populateObjectPanel(doc, index);
        renderPreview();
      });
      canvas.appendChild(box);
    });
  }

  canvas.addEventListener('click', () => {
    selectedObjectIndex = null;
    clearObjectPanel();
    renderPreview();
  });

  frame.appendChild(canvas);
  previewPane.appendChild(frame);

  // Refit when the viewport changes size so the full display remains visible.
  requestAnimationFrame(() => fitCanvasToFrame(frame, canvas, width, height));
}

function readSizeFromXml(xml) {
  const widthMatch = xml.match(/\bwidth\s*=\s*"(\d+)"/i);
  const heightMatch = xml.match(/\bheight\s*=\s*"(\d+)"/i);
  return {
    width: widthMatch ? Number(widthMatch[1]) : null,
    height: heightMatch ? Number(heightMatch[1]) : null
  };
}

function replaceDisplaySize(xml, width, height) {
  let updated = xml;
  updated = updated.replace(/(\bdisplaySettings[^>]*\bwidth\s*=\s*")(\d+)(")/i, `$1${width}$3`);
  updated = updated.replace(/(\bdisplaySettings[^>]*\bheight\s*=\s*")(\d+)(")/i, `$1${height}$3`);
  return updated;
}

function getObjectNodes(doc) {
  const root = doc.querySelector('gfx');
  if (!root) {
    return [];
  }
  return Array.from(root.children).filter((el) => el.tagName !== 'displaySettings');
}

function clearObjectPanel() {
  objType.value = 'None';
  objName.value = '';
  objCaption.value = '';
  objLeft.value = 0;
  objTop.value = 0;
  objWidth.value = 1;
  objHeight.value = 1;
  objBackColor.value = '';
  objBorderColor.value = '';
  objTextColor.value = '';
  objFontSize.value = 10;
  syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch);
  syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch);
  syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch);
}

function populateObjectPanel(doc, index) {
  const nodes = getObjectNodes(doc);
  const node = nodes[index];
  if (!node) {
    clearObjectPanel();
    return;
  }

  const captionNode = Array.from(node.children).find((child) => child.tagName === 'caption');
  objType.value = node.tagName;
  objName.value = node.getAttribute('name') || '';
  objCaption.value = captionNode?.getAttribute('caption') || '';
  objLeft.value = Number(node.getAttribute('left') || 0);
  objTop.value = Number(node.getAttribute('top') || 0);
  objWidth.value = Number(node.getAttribute('width') || 1);
  objHeight.value = Number(node.getAttribute('height') || 1);
  objBackColor.value = node.getAttribute('backColor') || '';
  objBorderColor.value = node.getAttribute('borderColor') || '';
  objTextColor.value = captionNode?.getAttribute('color') || node.getAttribute('foreColor') || '';
  objFontSize.value = Number(captionNode?.getAttribute('fontSize') || node.getAttribute('fontSize') || 10);
  syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch);
  syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch);
  syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch);
}

function normalizeColor(value) {
  const probe = document.createElement('span');
  probe.style.color = '';
  probe.style.color = String(value || '').trim();
  if (!probe.style.color) {
    return null;
  }

  const computed = probe.style.color;
  if (computed.startsWith('#')) {
    const hex = computed.toUpperCase();
    return hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  }

  const rgbMatch = computed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i);
  if (!rgbMatch) {
    return null;
  }

  const toHex = (n) => Number(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
}

function syncColorControl(textEl, pickerEl, swatchEl) {
  const norm = normalizeColor(textEl.value);
  if (norm) {
    pickerEl.value = norm;
    swatchEl.style.background = norm;
    swatchEl.style.borderColor = '#1f2b30';
  } else {
    swatchEl.style.background = 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 5px, #d7d7d7 5px, #d7d7d7 10px)';
    swatchEl.style.borderColor = '#8a8a8a';
  }
}

function serializeXmlDoc(doc) {
  let xml = new XMLSerializer().serializeToString(doc);
  // XMLSerializer adds xmlns="" to elements with no namespace — remove them
  // or FactoryTalk's XML parser will reject the file.
  xml = xml.replace(/ xmlns=""/g, '');
  if (xml.startsWith('<?xml')) {
    return xml;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

function applyObjectChangesToXml() {
  if (selectedObjectIndex === null) {
    alert('Click an object in preview first.');
    return false;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlEditor.value, 'text/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    alert('XML parse error. Fix XML before applying object changes.');
    return false;
  }

  const nodes = getObjectNodes(doc);
  const node = nodes[selectedObjectIndex];
  if (!node) {
    alert('Selected object no longer exists.');
    selectedObjectIndex = null;
    clearObjectPanel();
    return false;
  }

  node.setAttribute('name', objName.value || node.getAttribute('name') || 'Object');
  node.setAttribute('left', String(Number(objLeft.value) || 0));
  node.setAttribute('top', String(Number(objTop.value) || 0));
  node.setAttribute('width', String(Math.max(1, Number(objWidth.value) || 1)));
  node.setAttribute('height', String(Math.max(1, Number(objHeight.value) || 1)));

  if (objBackColor.value.trim()) {
    node.setAttribute('backColor', objBackColor.value.trim());
  }
  if (objBorderColor.value.trim()) {
    node.setAttribute('borderColor', objBorderColor.value.trim());
  }

  let captionNode = Array.from(node.children).find((child) => child.tagName === 'caption');
  const needsCaption = objCaption.value.trim() || objTextColor.value.trim() || Number(objFontSize.value) > 0;
  if (!captionNode && needsCaption) {
    captionNode = doc.createElement('caption');
    node.appendChild(captionNode);
  }

  if (captionNode) {
    captionNode.setAttribute('caption', objCaption.value || node.getAttribute('name') || node.tagName);
    if (objTextColor.value.trim()) {
      captionNode.setAttribute('color', objTextColor.value.trim());
    }
    captionNode.setAttribute('fontSize', String(Math.max(1, Number(objFontSize.value) || 10)));
  }

  xmlEditor.value = serializeXmlDoc(doc);
  return true;
}

async function loadDisplay(name) {
  const res = await fetch(`/api/displays/${encodeURIComponent(name)}`);
  if (!res.ok) {
    throw new Error('Failed to load selected display');
  }

  const data = await res.json();
  selectedDisplay = data.name;
  displayName.value = data.name;
  xmlEditor.value = data.xml;
  selectedObjectIndex = null;
  clearObjectPanel();

  const size = readSizeFromXml(data.xml);
  if (size.width) screenWidth.value = size.width;
  if (size.height) screenHeight.value = size.height;

  renderPreview();
  await refreshDisplays();
}

previewBtn.addEventListener('click', renderPreview);
refreshBtn.addEventListener('click', () => {
  refreshDisplays().catch((err) => {
    console.error(err);
    alert('Could not refresh display list');
  });
});

applySizeBtn.addEventListener('click', () => {
  const width = Number(screenWidth.value);
  const height = Number(screenHeight.value);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    alert('Enter valid width and height values');
    return;
  }

  if (!xmlEditor.value.trim()) {
    alert('Load XML first');
    return;
  }

  xmlEditor.value = replaceDisplaySize(xmlEditor.value, width, height);
  renderPreview();
});

applyObjectBtn.addEventListener('click', () => {
  const changed = applyObjectChangesToXml();
  if (!changed) {
    return;
  }
  renderPreview();
});

objBackColorPicker.addEventListener('input', () => {
  objBackColor.value = objBackColorPicker.value;
  syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch);
});
objBorderColorPicker.addEventListener('input', () => {
  objBorderColor.value = objBorderColorPicker.value;
  syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch);
});
objTextColorPicker.addEventListener('input', () => {
  objTextColor.value = objTextColorPicker.value;
  syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch);
});

objBackColor.addEventListener('input', () => syncColorControl(objBackColor, objBackColorPicker, objBackColorSwatch));
objBorderColor.addEventListener('input', () => syncColorControl(objBorderColor, objBorderColorPicker, objBorderColorSwatch));
objTextColor.addEventListener('input', () => syncColorControl(objTextColor, objTextColorPicker, objTextColorSwatch));

saveXmlBtn.addEventListener('click', async () => {
  if (!selectedDisplay) {
    alert('Open a display from the list first');
    return;
  }

  const res = await fetch(`/api/displays/${encodeURIComponent(selectedDisplay)}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ xml: xmlEditor.value })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Failed to save display XML');
    return;
  }

  alert(`Saved edited file: ${data.saved}`);
  await refreshDisplays();
});

buildPackageBtn.addEventListener('click', async () => {
  // Auto-save the currently open display so the package always reflects
  // what is visible in the editor, even if the user forgot to click Save.
  if (selectedDisplay && xmlEditor.value.trim()) {
    const saveRes = await fetch(`/api/displays/${encodeURIComponent(selectedDisplay)}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xml: xmlEditor.value })
    });
    if (!saveRes.ok) {
      alert('Could not auto-save the current display. Click "Save Edited XML" manually and try again.');
      return;
    }
  }

  const res = await fetch('/api/displays/package', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: selectedFiles })
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.error || 'Failed to build package');
    return;
  }

  packageResult.innerHTML = '';
  const warn = document.createElement('div');
  warn.className = 'import-checklist';
  warn.innerHTML =
    '<strong>Before importing in FactoryTalk:</strong>' +
    '<ol>' +
    '<li><b>Close every display you are about to import</b> (e.g. close MAIN, Testscreen, etc.)</li>' +
    '<li>Extract the downloaded ZIP to a local folder.</li>' +
    '<li>In FactoryTalk, use <em>Batch Import</em> and select <code>BatchImport.xml</code>.</li>' +
    '<li>Do <b>NOT</b> select the ZIP, the display XML, or any .txt file.</li>' +
    '</ol>' +
    `<small>Files packaged: ${data.files.join(', ')}</small>`;
  packageResult.appendChild(warn);

  const downloadUrl = data.downloadUrl || '/api/packages/download/latest.zip';
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  alert(
    'Import package generated and download started.\n\n' +
    'Before importing in FactoryTalk:\n' +
    '  1. CLOSE all displays you are importing (e.g. close MAIN before importing MAIN.xml).\n' +
    '  2. Extract the ZIP to a local folder.\n' +
    '  3. In FactoryTalk, use Batch Import and select BatchImport.xml from the extracted folder.\n\n' +
    'FactoryTalk will reject the import if the target display is open.'
  );
});

socket.on('bridge-status', (status) => {
  setBridgeCard(status);
  refreshDisplays().catch(() => {});
});

async function init() {
  const res = await fetch('/api/bridge/status');
  const status = await res.json();
  setBridgeCard(status);
  await refreshDisplays();
  renderPreview();
}

window.addEventListener('resize', () => {
  if (xmlEditor.value.trim()) {
    renderPreview();
  }
});

init().catch((err) => {
  console.error(err);
  bridgeStatus.querySelector('span:last-child').textContent = 'Bridge unavailable';
});
