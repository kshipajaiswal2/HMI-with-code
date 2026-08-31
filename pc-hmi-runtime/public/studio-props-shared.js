/** Shared helpers for Studio shape property dialogs (one copy of duplicated pattern/color/tab logic). */
(function () {
  const PATTERN_OPTIONS = [
    ['none', 'None'],
    ['dots', 'Dots'],
    ['checks', 'Checks'],
    ['smallBoxes', 'Small Boxes'],
    ['mediumBoxes', 'Medium Boxes'],
    ['largeBoxes', 'Large Boxes'],
    ['verticalLines', 'Vertical Lines'],
    ['wideVerticalLines', 'Wide Vertical Lines'],
    ['horizontalLines', 'Horizontal Lines'],
    ['wideHorizontalLines', 'Wide Horizontal Lines'],
    ['rightDiagonal', 'Right Diagonal'],
    ['wideRightDiagonal', 'Wide Right Diagonal'],
    ['leftDiagonal', 'Left Diagonal'],
    ['wideLeftDiagonal', 'Wide Left Diagonal'],
    ['hatch', 'Hatch'],
    ['bricks', 'Bricks'],
    ['ovals', 'Ovals'],
    ['diamonds', 'Diamonds'],
    ['scales', 'Scales'],
    ['waves', 'Waves']
  ];

  function setColorFieldValue(id, raw) {
    const input = document.getElementById(id);
    if (!input) return;
    if (window.FtColorPicker?.setValueSilent) {
      window.FtColorPicker.setValueSilent(input, raw);
    } else {
      input.value = raw;
    }
  }

  function getColorFieldValue(id) {
    const input = document.getElementById(id);
    if (!input) return '#000000';
    return window.FtColorPicker?.getInputColor?.(input) ?? input.value;
  }

  function fillPatternSelect(selectId, filledKey) {
    const el = document.getElementById(selectId);
    if (!el || el.dataset[filledKey]) return;
    el.dataset[filledKey] = '1';
    el.innerHTML = PATTERN_OPTIONS.map(([value, label]) =>
      `<option value="${value}">${label}</option>`
    ).join('');
  }

  function switchDialogTab(dialogId, tabAttr, panelAttr, tabId) {
    document.querySelectorAll(`#${dialogId} .dialog-tab`).forEach((el) => {
      el.classList.toggle('active', el.dataset[tabAttr] === tabId);
    });
    document.querySelectorAll(`#${dialogId} .dialog-tab-panel`).forEach((el) => {
      el.classList.toggle('active', el.dataset[panelAttr] === tabId);
    });
  }

  function wireColorInputs(formSelector, datasetKey, onChange) {
    document.querySelectorAll(`${formSelector} .ft-color-input`).forEach((input) => {
      if (input.dataset[datasetKey] === '1') return;
      input.dataset[datasetKey] = '1';
      input.addEventListener('input', onChange);
      input.addEventListener('change', onChange);
    });
  }

  function wireColorPicker(dialog) {
    if (!dialog || !window.FtColorPicker) return;
    window.FtColorPicker.initAllSync(dialog);
    window.FtColorPicker.refreshAll(dialog);
  }

  function resolvedEditIndex(comp, ref, editIndex) {
    const resolved = editIndex ?? window.resolveEditComponentIndex?.(comp, ref);
    return resolved >= 0 ? resolved : null;
  }

  function previewShape(comp, readFn, applyBtnId) {
    if (window.patchShapeLivePreview) window.patchShapeLivePreview(comp);
    else if (comp?.name && window.previewPatchByName) window.previewPatchByName(comp.name, comp);
    window.updatePropsApplyButton?.(readFn, applyBtnId);
  }

  function syncGradientExtras(backStyleId, extrasId) {
    const isGradient = document.getElementById(backStyleId)?.value === 'gradient';
    document.getElementById(extrasId)?.classList.toggle('hidden', !isGradient);
    return isGradient;
  }

  window.StudioPropsShared = {
    PATTERN_OPTIONS,
    setColorFieldValue,
    getColorFieldValue,
    fillPatternSelect,
    switchDialogTab,
    wireColorInputs,
    wireColorPicker,
    resolvedEditIndex,
    previewShape,
    syncGradientExtras
  };
})();
