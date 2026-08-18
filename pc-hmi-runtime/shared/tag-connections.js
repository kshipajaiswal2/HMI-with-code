/** Sync internal HMI memory tags from connected PLC/source tags. */
function extractConnections(tagDefs) {
  const connections = [];
  for (const def of tagDefs || []) {
    const source = String(def.connection || def.sourceTag || '').trim();
    if (!source) continue;
    connections.push({ target: def.name, source });
  }
  return connections;
}

function syncTagConnections(tagService, connections) {
  if (!tagService || !connections?.length) return 0;
  let updated = 0;
  for (const { target, source } of connections) {
    const src = tagService.get(source);
    const dst = tagService.get(target);
    if (!src || !dst) continue;
    if (dst.value !== src.value) {
      tagService.set(target, src.value, src.quality || 'good');
      updated++;
    }
  }
  return updated;
}

function isInternalHmiTag(tag) {
  if (!tag) return false;
  if (tag.folder) return true;
  const source = String(tag.dataSource || '').toLowerCase();
  return source === 'memory' || source === 'hmi';
}

function isPlcDeviceTag(tag) {
  if (!tag || isInternalHmiTag(tag)) return false;
  if (tag.plcAddress || tag.alias) return true;
  if (tag.computed) return false;
  const name = String(tag.name || '');
  return /[:\\]|\b(I|O)\.\d/i.test(name);
}

module.exports = {
  extractConnections,
  syncTagConnections,
  isInternalHmiTag,
  isPlcDeviceTag
};
