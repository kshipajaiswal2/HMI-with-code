const NAV_ICONS = {
  home: '⌂', settings: '⚙', manual: '☞', alarms: '🔔',
  recipe: '📋', legends: 'ℹ', user: '👤'
};

const NAV_IMAGES = {
  home: 'button2_home.bmp',
  settings: 'button2_settings.bmp',
  manual: 'manual1.bmp',
  alarms: 'button2_alarm.bmp',
  recipe: 'recipe1 1.bmp',
  legends: 'legend1.bmp',
  user: 'userorange_2.bmp'
};

const ComponentRegistry = {
  _alarmListControllers: new Map(),
  SectionHeader(comp) {
    const el = document.createElement('h2');
    el.className = 'section-header';
    el.textContent = comp.label || '';
    return el;
  },

  SubNav(comp, ctx) {
    const nav = document.createElement('nav');
    nav.className = 'sub-nav';
    const items = ctx.navigation?.subNav?.[comp.navKey] || [];
    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sub-nav-btn';
      btn.textContent = item.label;
      if (ctx.currentScreen === item.screen) btn.classList.add('active');
      btn.addEventListener('click', () => ctx.navigate(item.screen));
      nav.appendChild(btn);
    }
    return nav;
  },

  NavButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-btn';
    btn.textContent = comp.label;
    btn.addEventListener('click', () => ctx.navigate(comp.target));
    return btn;
  },

  ActionButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action-btn';
    btn.textContent = comp.label;
    btn.addEventListener('click', () => {
      if (comp.action === 'ackAllAlarms') ctx.acknowledgeAllAlarms();
      else if (comp.action === 'logout') ctx.logout();
    });
    return btn;
  },

  ToggleButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toggle-btn';
    btn.textContent = comp.label;
    const update = (val) => {
      btn.classList.toggle('on', val === true || val === 1);
      btn.classList.toggle('off', !(val === true || val === 1));
    };
    ctx.bindTag(comp.tag, update);
    btn.addEventListener('click', async () => {
      const current = ctx.getTagValue(comp.tag);
      await ctx.writeTag(comp.tag, !(current === true || current === 1));
    });
    return btn;
  },

  MomentaryButton(comp, ctx) {
    if (!ComponentRegistry.isPlacedGraphic(comp)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'momentary-btn';
      btn.textContent = comp.label || comp.caption || '';
      if (ctx.studioEdit) return btn;
      const pressValue = comp.value ?? 1;
      const releaseValue = comp.releaseValue ?? 0;
      const writeTag = comp.tag ? ComponentRegistry.resolveWriteTagName(comp.tag) : null;
      let held = false;
      const press = () => {
        held = true;
        if (writeTag) ctx.writeTag(writeTag, pressValue);
      };
      const release = () => {
        if (!held) return;
        held = false;
        if (writeTag) ctx.writeTag(writeTag, releaseValue);
      };
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); press(); });
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
      return btn;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-momentary-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultMomentaryButtonStates(comp.caption ?? comp.label);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);

    let pressed = false;
    let releaseTimer = null;
    const holdTime = comp.holdTime ?? 250;
    const indicatorTag = comp.indicatorTag || comp.tag;

    const renderState = (stateDef) => {
      if (!stateDef) return;
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit });
      ComponentRegistry.applyShapePattern(btn, merged);
      caption.textContent = stateDef.caption ?? comp.caption ?? comp.label ?? '';
      const alignId = stateDef.alignment || comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || stateDef.foreColor || comp.foreColor,
        useForeColor: stateDef.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: stateDef.wordWrap !== undefined ? stateDef.wordWrap : comp.wordWrap,
        alignment: alignId
      });
      if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid') {
        caption.style.backgroundColor = stateDef.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = 'transparent';
      }
      caption.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));

      let imgEl = btn.querySelector('.ft-btn-image');
      if (stateDef.image) {
        if (!imgEl) {
          imgEl = document.createElement('img');
          imgEl.className = 'ft-btn-image ft-goto-btn-icon';
          imgEl.alt = '';
          imgEl.draggable = false;
          imgEl.style.pointerEvents = 'none';
          btn.insertBefore(imgEl, caption);
        }
        imgEl.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        imgEl.classList.toggle('ft-goto-btn-icon-scaled', Boolean(stateDef.imageScaled));
        imgEl.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
        if (stateDef.useImageBackColor && stateDef.imageBackStyle === 'solid') {
          imgEl.style.backgroundColor = stateDef.imageBackColor || '#001C38';
        } else {
          imgEl.style.backgroundColor = 'transparent';
        }
      } else if (imgEl) {
        imgEl.remove();
      }
    };

    const showTagState = (val) => {
      if (pressed) return;
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const defaultState = ComponentRegistry.resolveMultistateState(states, comp.releaseValue ?? 0);

    if (indicatorTag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(indicatorTag, showTagState, ctx);
    } else {
      renderState(defaultState);
    }

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MomentaryButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MomentaryButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const pressValue = comp.value ?? 1;
    const releaseValue = comp.releaseValue ?? 0;
    const state1 = states.find((s) => s.id === 'State1' || s.value === 1) || states[1];

    const press = () => {
      if (releaseTimer) {
        clearTimeout(releaseTimer);
        releaseTimer = null;
      }
      pressed = true;
      if (state1) renderState(state1);
      if (comp.tag) {
        const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
        if (writeTag) ctx.writeTag(writeTag, pressValue);
      }
    };

    const release = () => {
      if (!pressed) return;
      const finish = () => {
        pressed = false;
        releaseTimer = null;
        if (comp.tag) {
          const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
          if (writeTag) ctx.writeTag(writeTag, releaseValue);
        }
        const val = indicatorTag
          ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
          : releaseValue;
        showTagState(val !== undefined ? val : releaseValue);
      };
      if (releaseTimer) clearTimeout(releaseTimer);
      if (holdTime > 0) releaseTimer = setTimeout(finish, holdTime);
      else finish();
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); press(); });
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); press(); }, { passive: false });
      btn.addEventListener('touchend', release);
      btn.addEventListener('touchcancel', release);
    }

    return btn;
  },

  MaintainedButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-maintained-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultMaintainedButtonStates(comp.caption ?? comp.label);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);
    let imgEl = null;

    const indicatorTag = comp.indicatorTag || comp.tag;
    const state0 = states.find((s) => s.id === 'State0') || states[0];
    const state1 = states.find((s) => s.id === 'State1') || states[1];
    const state0Val = state0?.value ?? 0;
    const state1Val = state1?.value ?? 1;

    const renderState = (stateDef) => {
      if (!stateDef) return;
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit, useHighlightColor: false });
      ComponentRegistry.applyShapePattern(btn, merged);
      if (comp.useHighlightColor && comp.highlightColor) {
        btn.classList.add('ft-highlight-on-focus');
        btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
      } else {
        btn.classList.remove('ft-highlight-on-focus');
        btn.style.removeProperty('--ft-highlight-color');
      }
      if (stateDef.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-maintained-btn-icon';
        imgEl.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        const scaled = Boolean(stateDef.imageScaled);
        imgEl.style.maxWidth = scaled ? '100%' : '88%';
        imgEl.style.maxHeight = scaled ? '100%' : '88%';
        imgEl.style.objectFit = scaled ? 'fill' : 'contain';
        imgEl.style.width = scaled ? '100%' : '';
        imgEl.style.height = scaled ? '100%' : '';
        imgEl.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
        btn.insertBefore(imgEl, caption);
      }
      caption.textContent = stateDef.caption ?? comp.caption ?? comp.label ?? '';
      caption.style.display = caption.textContent ? '' : 'none';
      const alignId = stateDef.alignment || comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || stateDef.foreColor || comp.foreColor,
        useForeColor: stateDef.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: stateDef.wordWrap !== undefined ? stateDef.wordWrap : comp.wordWrap,
        alignment: alignId
      });
      if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid') {
        caption.style.backgroundColor = stateDef.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = 'transparent';
      }
      caption.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const defaultState = ComponentRegistry.resolveMultistateState(states, state0Val);
    const previewState = (studioEdit && comp.previewStateId)
      ? (states.find((s) => s.id === comp.previewStateId) || defaultState)
      : defaultState;

    if (indicatorTag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(indicatorTag, showTagState, ctx);
    } else {
      renderState(previewState);
    }

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MaintainedButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MaintainedButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const isState1 = (val) => {
      const resolved = ComponentRegistry.resolveMultistateState(states, val);
      return resolved?.id === 'State1' || resolved?.value === state1Val;
    };

    const toggle = () => {
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const basedOnValue = (comp.nextStateBasedOn || 'currentState') === 'valueControl';
      const current = basedOnValue
        ? ctx.getTagValue(comp.tag)
        : (indicatorTag
          ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
          : ctx.getTagValue(comp.tag));
      const nextVal = isState1(current) ? state0Val : state1Val;
      ctx.writeTag(writeTag, nextVal);
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggle();
    });

    return btn;
  },

  LatchedButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-latched-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultLatchedButtonStates(comp.caption ?? comp.label);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);
    let imgEl = null;

    const indicatorTag = comp.indicatorTag || comp.tag;
    const handshakeTag = comp.handshakeTag || '';
    const state0 = states.find((s) => s.id === 'State0') || states[0];
    const state1 = states.find((s) => s.id === 'State1') || states[1];
    const state0Val = state0?.value ?? 0;
    const latchVal = comp.latchValue ?? state1?.value ?? 1;

    const renderState = (stateDef) => {
      if (!stateDef) return;
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit, useHighlightColor: false });
      ComponentRegistry.applyShapePattern(btn, merged);
      if (comp.useHighlightColor && comp.highlightColor) {
        btn.classList.add('ft-highlight-on-focus');
        btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
      } else {
        btn.classList.remove('ft-highlight-on-focus');
        btn.style.removeProperty('--ft-highlight-color');
      }
      if (stateDef.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-latched-btn-icon';
        imgEl.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        const scaled = Boolean(stateDef.imageScaled);
        imgEl.style.maxWidth = scaled ? '100%' : '88%';
        imgEl.style.maxHeight = scaled ? '100%' : '88%';
        imgEl.style.objectFit = scaled ? 'fill' : 'contain';
        imgEl.style.width = scaled ? '100%' : '';
        imgEl.style.height = scaled ? '100%' : '';
        imgEl.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
        btn.insertBefore(imgEl, caption);
      }
      caption.textContent = stateDef.caption ?? comp.caption ?? comp.label ?? '';
      caption.style.display = caption.textContent ? '' : 'none';
      const alignId = stateDef.alignment || comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || stateDef.foreColor || comp.foreColor,
        useForeColor: stateDef.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: stateDef.wordWrap !== undefined ? stateDef.wordWrap : comp.wordWrap,
        alignment: alignId
      });
      if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid') {
        caption.style.backgroundColor = stateDef.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = 'transparent';
      }
      caption.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const defaultState = ComponentRegistry.resolveMultistateState(states, state0Val);
    const previewState = (studioEdit && comp.previewStateId)
      ? (states.find((s) => s.id === comp.previewStateId) || defaultState)
      : defaultState;

    if (indicatorTag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(indicatorTag, showTagState, ctx);
    } else {
      renderState(previewState);
    }

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'LatchedButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'LatchedButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const isLatched = (val) => {
      const n = Number(val);
      if (comp.latchResetType === 'zeroValue') return n !== 0;
      return n !== 0 && n !== state0Val;
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const resetVal = handshakeTag
        ? ComponentRegistry.readIndicatorRef(handshakeTag, ctx)
        : (indicatorTag
          ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
          : ctx.getTagValue(comp.tag));
      if (!isLatched(resetVal)) {
        ctx.writeTag(writeTag, latchVal);
      }
    });

    return btn;
  },

  MultistateButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-multistate-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const userStateCount = comp.numberOfStates ?? (comp.states?.filter((s) => s.id !== 'Error').length || 2);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultMultistateButtonStates(userStateCount, comp.caption ?? comp.label);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);
    let imgEl = null;

    const indicatorTag = comp.indicatorTag || comp.tag;
    const userStates = states.filter((s) => s.id !== 'Error');

    const renderState = (stateDef) => {
      if (!stateDef) return;
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit, useHighlightColor: false });
      ComponentRegistry.applyShapePattern(btn, merged);
      if (comp.useHighlightColor && comp.highlightColor) {
        btn.classList.add('ft-highlight-on-focus');
        btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
      } else {
        btn.classList.remove('ft-highlight-on-focus');
        btn.style.removeProperty('--ft-highlight-color');
      }
      if (stateDef.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-multistate-btn-icon';
        imgEl.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        const scaled = Boolean(stateDef.imageScaled);
        imgEl.style.maxWidth = scaled ? '100%' : '88%';
        imgEl.style.maxHeight = scaled ? '100%' : '88%';
        imgEl.style.objectFit = scaled ? 'fill' : 'contain';
        imgEl.style.width = scaled ? '100%' : '';
        imgEl.style.height = scaled ? '100%' : '';
        imgEl.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
        btn.insertBefore(imgEl, caption);
      }
      caption.textContent = stateDef.caption ?? comp.caption ?? comp.label ?? '';
      caption.style.display = caption.textContent ? '' : 'none';
      const alignId = stateDef.alignment || comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || stateDef.foreColor || comp.foreColor,
        useForeColor: stateDef.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: stateDef.wordWrap !== undefined ? stateDef.wordWrap : comp.wordWrap,
        alignment: alignId
      });
      if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid') {
        caption.style.backgroundColor = stateDef.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = 'transparent';
      }
      caption.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const defaultState = ComponentRegistry.resolveMultistateState(states, userStates[0]?.value ?? 0);
    const previewState = (studioEdit && comp.previewStateId)
      ? (states.find((s) => s.id === comp.previewStateId) || defaultState)
      : defaultState;

    if (indicatorTag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(indicatorTag, showTagState, ctx);
    } else {
      renderState(previewState);
    }

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MultistateButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MultistateButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const advance = () => {
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const basedOnValue = (comp.nextStateBasedOn || 'currentState') === 'valueControl';
      const current = basedOnValue
        ? ctx.getTagValue(comp.tag)
        : (indicatorTag
          ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
          : ctx.getTagValue(comp.tag));
      const resolved = ComponentRegistry.resolveMultistateState(states, current);
      const idx = userStates.findIndex((s) => s.id === resolved?.id);
      const nextIdx = idx < 0 ? 0 : (idx + 1) % userStates.length;
      ctx.writeTag(writeTag, userStates[nextIdx]?.value ?? nextIdx);
    };

    let repeatTimer = null;
    let repeatDelayTimer = null;
    const rate = Number(comp.autoRepeatRate ?? 0);
    const delay = comp.autoRepeatDelay ?? 400;
    const intervalMs = rate <= 0 ? 0 : (rate <= 20 ? Math.max(50, Math.round(1000 / rate)) : rate);

    const stopRepeat = () => {
      if (repeatDelayTimer) clearTimeout(repeatDelayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      repeatDelayTimer = null;
      repeatTimer = null;
    };

    const startRepeat = () => {
      advance();
      if (intervalMs <= 0) return;
      repeatDelayTimer = setTimeout(() => {
        repeatTimer = setInterval(advance, intervalMs);
      }, delay);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); startRepeat(); });
    btn.addEventListener('mouseup', stopRepeat);
    btn.addEventListener('mouseleave', stopRepeat);
    btn.addEventListener('click', (e) => e.preventDefault());
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRepeat(); }, { passive: false });
      btn.addEventListener('touchend', stopRepeat);
      btn.addEventListener('touchcancel', stopRepeat);
    }

    return btn;
  },

  defaultMultistateButtonStates(count = 2, caption = '') {
    const n = Math.max(2, Number(count) || 2);
    const state = (id, extra = {}) => ({
      id,
      backColor: '#001C38',
      borderColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      caption: '',
      captionColor: '#ffffff',
      useCaptionColor: false,
      captionBackColor: '#001C38',
      useCaptionBackColor: true,
      captionBlink: false,
      captionBackStyle: 'transparent',
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      wordWrap: true,
      alignment: 'middleCenter',
      blink: false,
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#001C38',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      ...extra
    });
    const states = [];
    for (let i = 0; i < n; i++) {
      states.push(state(`State${i}`, { value: i, caption: i === 0 ? caption : '' }));
    }
    states.push(state('Error', { caption: 'Error', blink: true, useCaptionColor: true, backColor: 'navy', borderColor: 'navy' }));
    return states;
  },

  InterlockedButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-interlocked-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultInterlockedButtonStates(comp.caption ?? comp.label);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);
    let imgEl = null;

    const rawBv = Number(comp.buttonValue);
    const buttonValue = Number.isFinite(rawBv) ? rawBv : 0;
    const state0 = states.find((s) => s.id === 'State0') || states[0];
    const state1 = states.find((s) => s.id === 'State1') || states[1];

    const renderState = (stateDef) => {
      if (!stateDef) return;
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit, useHighlightColor: false });
      ComponentRegistry.applyShapePattern(btn, merged);
      if (comp.useHighlightColor && comp.highlightColor) {
        btn.classList.add('ft-highlight-on-focus');
        btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
      } else {
        btn.classList.remove('ft-highlight-on-focus');
        btn.style.removeProperty('--ft-highlight-color');
      }
      if (stateDef.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-interlocked-btn-icon';
        imgEl.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        const scaled = Boolean(stateDef.imageScaled);
        imgEl.style.maxWidth = scaled ? '100%' : '88%';
        imgEl.style.maxHeight = scaled ? '100%' : '88%';
        imgEl.style.objectFit = scaled ? 'fill' : 'contain';
        imgEl.style.width = scaled ? '100%' : '';
        imgEl.style.height = scaled ? '100%' : '';
        imgEl.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
        btn.insertBefore(imgEl, caption);
      }
      caption.textContent = stateDef.caption ?? comp.caption ?? comp.label ?? '';
      caption.style.display = caption.textContent ? '' : 'none';
      const alignId = stateDef.alignment || comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || stateDef.foreColor || comp.foreColor,
        useForeColor: stateDef.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: stateDef.wordWrap !== undefined ? stateDef.wordWrap : comp.wordWrap,
        alignment: alignId
      });
      if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid') {
        caption.style.backgroundColor = stateDef.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = 'transparent';
      }
      caption.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const stateForValue = (val) => {
      const n = Number(val);
      return (Number.isFinite(n) && n === buttonValue) ? (state1 || state0) : state0;
    };

    const showTagState = (val) => {
      renderState(stateForValue(val));
    };

    const previewState = (studioEdit && comp.previewStateId)
      ? (states.find((s) => s.id === comp.previewStateId) || state0)
      : state0;

    if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showTagState, ctx);
    } else {
      renderState(previewState);
    }

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'InterlockedButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'InterlockedButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const press = () => {
      renderState(state1 || state0);
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (writeTag) ctx.writeTag(writeTag, buttonValue);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); press(); });
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); press(); }, { passive: false });
    }

    return btn;
  },

  RampButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-ramp-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);
    let imgEl = null;

    const renderAppearance = () => {
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      ComponentRegistry.applyButtonAppearance(btn, { ...comp, studioEdit, useHighlightColor: false });
      ComponentRegistry.applyShapePattern(btn, comp);
      if (comp.useHighlightColor && comp.highlightColor) {
        btn.classList.add('ft-highlight-on-focus');
        btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
      } else {
        btn.classList.remove('ft-highlight-on-focus');
        btn.style.removeProperty('--ft-highlight-color');
      }
      if (comp.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-ramp-btn-icon';
        imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        const scaled = Boolean(comp.imageScaled);
        imgEl.style.maxWidth = scaled ? '100%' : '88%';
        imgEl.style.maxHeight = scaled ? '100%' : '88%';
        imgEl.style.objectFit = scaled ? 'fill' : 'contain';
        imgEl.style.width = scaled ? '100%' : '';
        imgEl.style.height = scaled ? '100%' : '';
        if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
          imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
        }
        imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
        btn.insertBefore(imgEl, caption);
      }
      caption.textContent = comp.caption ?? comp.label ?? '';
      caption.style.display = caption.textContent ? '' : 'none';
      const alignId = comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: comp.captionColor || comp.foreColor,
        useForeColor: comp.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: comp.wordWrap !== false,
        alignment: alignId
      });
      if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
        caption.style.backgroundColor = comp.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = 'transparent';
      }
      caption.classList.toggle('ft-blink', Boolean(comp.captionBlink));
      btn.classList.toggle('ft-blink', Boolean(comp.blink));
    };
    renderAppearance();

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'RampButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'RampButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
    if (!writeTag) return btn;

    const rampUp = (comp.operationDirection || 'rampUp') === 'rampUp';
    const rate = Number(comp.autoRepeatRate) || 0;
    const delay = comp.autoRepeatDelay ?? 400;
    const intervalMs = rate <= 0 ? 0 : (rate <= 20 ? Math.max(50, Math.round(1000 / rate)) : rate);
    let repeatTimer = null;
    let delayTimer = null;

    const getRampStep = () => {
      if (comp.useVariableRamp && comp.rampTag) {
        const v = ComponentRegistry.readIndicatorRef(comp.rampTag, ctx);
        const n = Number(v);
        if (!Number.isNaN(n) && n > 0) return n;
      }
      return comp.rampValue ?? 1;
    };

    const getLimit = () => {
      if (comp.useVariableLimit && comp.limitTag) {
        const v = ComponentRegistry.readIndicatorRef(comp.limitTag, ctx);
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
      return rampUp ? (comp.upperLimit ?? 100) : (comp.lowerLimit ?? 0);
    };

    const step = () => {
      const current = Number(ctx.getTagValue(comp.tag)) || 0;
      const stepVal = getRampStep();
      const limit = getLimit();
      let next = rampUp ? current + stepVal : current - stepVal;
      if (rampUp) next = Math.min(next, limit);
      else next = Math.max(next, limit);
      if (next !== current) ctx.writeTag(writeTag, next);
    };

    const stop = () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      delayTimer = null;
      repeatTimer = null;
    };

    const start = () => {
      step();
      if (intervalMs <= 0) return;
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(step, intervalMs);
      }, delay);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); start(); });
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    btn.addEventListener('click', (e) => e.preventDefault());
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
      btn.addEventListener('touchend', stop);
      btn.addEventListener('touchcancel', stop);
    }

    return btn;
  },

  defaultInterlockedButtonStates(caption = '') {
    const state = (id, extra = {}) => ({
      id,
      backColor: '#001C38',
      borderColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      caption,
      captionColor: '#ffffff',
      useCaptionColor: false,
      captionBackColor: '#001C38',
      useCaptionBackColor: false,
      captionBlink: false,
      captionBackStyle: 'transparent',
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      wordWrap: true,
      alignment: 'middleCenter',
      blink: false,
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#ffffff',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      ...extra
    });
    return [
      state('State0'),
      state('State1')
    ];
  },

  defaultMaintainedButtonStates(caption = '') {
    const state = (id, extra = {}) => ({
      id,
      backColor: '#001C38',
      borderColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      caption,
      captionColor: '#ffffff',
      useCaptionColor: false,
      captionBackColor: '#001C38',
      useCaptionBackColor: false,
      captionBlink: false,
      captionBackStyle: 'transparent',
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      wordWrap: true,
      alignment: 'middleRight',
      blink: false,
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#001C38',
      useImageBackColor: false,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      ...extra
    });
    return [
      state('State0', { value: 0 }),
      state('State1', { value: 1 }),
      state('Error', { caption: 'Error', blink: true, useCaptionColor: true, backColor: 'navy', borderColor: 'navy' })
    ];
  },

  defaultLatchedButtonStates(caption = '') {
    const state = (id, extra = {}) => ({
      id,
      backColor: '#001C38',
      borderColor: '#001C38',
      useBackColor: true,
      useBorderColor: true,
      caption,
      captionColor: '#ffffff',
      useCaptionColor: false,
      captionBackColor: '#001C38',
      useCaptionBackColor: true,
      captionBlink: false,
      captionBackStyle: 'transparent',
      patternStyle: 'none',
      usePatternColor: false,
      patternColor: '#ffffff',
      wordWrap: true,
      alignment: 'middleCenter',
      blink: false,
      image: '',
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter',
      useImageColor: false,
      imageColor: '#001C38',
      useImageBackColor: true,
      imageBackColor: '#001C38',
      imageBlink: false,
      imageScaled: false,
      ...extra
    });
    return [
      state('State0', { value: 0 }),
      state('State1', { value: 1 }),
      state('Error', { caption: 'Error', blink: true, useCaptionColor: true, backColor: 'navy', borderColor: 'navy' })
    ];
  },

  defaultMomentaryButtonStates(caption = 'Conveyor Run') {
    return [
      {
        id: 'State0', value: 0, backColor: '#dcdcdc', borderColor: '#c0c0c0',
        useBackColor: true, useBorderColor: false, caption,
        captionColor: '#000000', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      },
      {
        id: 'State1', value: 1, backColor: '#00c000', borderColor: '#40ff10',
        useBackColor: true, useBorderColor: true, caption,
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      },
      {
        id: 'Error', backColor: 'navy', borderColor: 'navy',
        useBackColor: true, useBorderColor: true, caption: 'Error',
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: true
      }
    ];
  },

  mergeMomentaryState(comp, stateDef) {
    return {
      ...comp,
      useBackColor: stateDef.useBackColor !== false,
      backColor: stateDef.backColor || comp.backColor,
      useBorderColor: stateDef.useBorderColor !== false,
      borderColor: stateDef.borderColor || comp.borderColor,
      backStyle: stateDef.backStyle || comp.backStyle || 'solid',
      blink: stateDef.blink,
      patternStyle: stateDef.patternStyle || 'none',
      usePatternColor: Boolean(stateDef.patternStyle && stateDef.patternStyle !== 'none' && stateDef.usePatternColor !== false),
      patternColor: stateDef.patternColor || '#ffffff'
    };
  },

  applyButtonAppearance(el, comp) {
    const borderWidth = comp.borderWidth ?? 1;
    const borderStyle = comp.borderStyle || 'raisedInset';
    const defaultFace = '#dcdcdc';
    const faceColor = comp.useBackColor ? (comp.backColor || defaultFace) : defaultFace;

    let borderColor = comp.borderColor || '#c0c0c0';
    if (comp.borderUsesBackColor) {
      borderColor = faceColor;
    } else if (comp.useBorderColor && comp.borderColor) {
      borderColor = comp.borderColor;
    }

    if (borderStyle === 'raisedInset') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      el.style.borderColor = '#808080 #ffffff #ffffff #808080';
    } else if (borderStyle === 'raised') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      if (comp.navSideAccent && comp.useBorderColor && comp.borderColor && !comp.borderUsesBackColor) {
        el.style.borderColor = '#ffffff #808080 #808080 #ffffff';
        el.style.borderLeftColor = comp.borderColor;
        el.style.borderRightColor = comp.borderColor;
        el.style.borderLeftWidth = `${Math.max(borderWidth, 3)}px`;
        el.style.borderRightWidth = `${Math.max(borderWidth, 3)}px`;
      } else if (comp.useBorderColor && comp.borderColor && !comp.borderUsesBackColor) {
        el.style.borderColor = comp.borderColor;
      } else {
        el.style.borderColor = '#ffffff #808080 #808080 #ffffff';
      }
    } else if (borderStyle === 'inset') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      el.style.borderColor = '#808080 #ffffff #ffffff #808080';
    } else if (borderStyle === 'none') {
      el.style.border = 'none';
    } else {
      el.style.border = `${borderWidth}px solid ${borderColor}`;
    }

    if (comp.backStyle === 'gradient') {
      const end = comp.endColor || '#e8e8e8';
      el.style.background = `linear-gradient(to left, ${faceColor}, ${end})`;
      el.style.backgroundColor = '';
    } else if (comp.backStyle === 'solid') {
      el.style.background = 'none';
      el.style.backgroundColor = faceColor;
    } else {
      el.style.backgroundColor = 'transparent';
      el.style.background = 'none';
    }

    if (comp.useHighlightColor && comp.highlightColor) {
      el.style.boxShadow = `inset 0 0 0 2px ${comp.highlightColor}`;
    } else {
      el.style.boxShadow = '';
    }

    el.classList.toggle('ft-blink', Boolean(comp.blink));
    if (comp.shape === 'circle') {
      el.style.borderRadius = '50%';
    } else if (comp.shape === 'ellipse') {
      el.style.borderRadius = '50%';
    } else if (comp.shape === 'roundedRectangle') {
      el.style.borderRadius = '4px';
    } else {
      el.style.borderRadius = '0';
    }
    el.style.cursor = comp.studioEdit ? 'default' : 'pointer';
    el.style.padding = (comp.width != null && comp.width <= 36) ? '0' : '0 4px';
    el.style.overflow = 'hidden';
    el.style.margin = '0';
    el.style.outline = 'none';
    el.style.boxSizing = 'border-box';
  },

  applyGotoButtonLayout(btn, imgEl, cap, comp) {
    const capAlign = comp.alignment || 'middleCenter';
    const imgAlign = comp.imageAlignment
      || (imgEl && String(capAlign).includes('bottom') ? 'topCenter' : 'middleCenter');
    const navStyle = Boolean(imgEl) && imgAlign.startsWith('top') && String(capAlign).includes('bottom');

    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.gap = '0';
    btn.style.overflow = 'hidden';
    btn.classList.toggle('ft-goto-btn-nav', navStyle);

    if (navStyle) {
      btn.style.justifyContent = 'space-between';
      btn.style.alignItems = imgAlign === 'topLeft' ? 'flex-start' : imgAlign === 'topRight' ? 'flex-end' : 'center';
      btn.style.padding = '2px 3px 3px';
      if (imgEl) {
        imgEl.style.flex = '1 1 auto';
        imgEl.style.maxHeight = '68%';
        imgEl.style.marginTop = '1px';
      }
      if (cap) {
        cap.style.flex = '0 0 auto';
        cap.style.marginBottom = '1px';
      }
      return;
    }

    const align = ComponentRegistry.textAlignment(capAlign, 'column');
    btn.style.justifyContent = align.justify;
    btn.style.alignItems = align.align;
    btn.style.padding = (comp.width != null && comp.width <= 36) ? '1px 2px' : '2px 3px 3px';
    if (imgEl) {
      imgEl.style.flex = '';
      imgEl.style.maxHeight = '';
      imgEl.style.marginTop = '';
    }
    if (cap) {
      cap.style.flex = '';
      cap.style.marginBottom = '';
    }
  },

  applyCaptionStyle(el, comp) {
    el.style.fontFamily = comp.fontFamily || 'Arial Unicode MS';
    el.style.fontSize = `${comp.fontSize ?? 10}px`;
    el.style.fontWeight = comp.bold ? '700' : '400';
    el.style.fontStyle = comp.italic ? 'italic' : 'normal';
    el.style.textDecoration = comp.underline ? 'underline' : 'none';
    if (comp.useForeColor !== false) el.style.color = comp.foreColor || '#000000';
    const textAlignMap = {
      topLeft: 'left', topCenter: 'center', topRight: 'right',
      middleLeft: 'left', middleCenter: 'center', middleRight: 'right',
      bottomLeft: 'left', bottomCenter: 'center', bottomRight: 'right'
    };
    el.style.textAlign = textAlignMap[comp.alignment] || 'center';
    if (comp.wordWrap !== false) {
      el.style.whiteSpace = 'pre-wrap';
      el.style.overflowWrap = 'break-word';
      el.style.lineHeight = '1.2';
    } else {
      el.style.whiteSpace = 'nowrap';
    }
  },

  NumericDisplay(comp, ctx) {
    if (!ComponentRegistry.isPlacedGraphic(comp)) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      const labelEl = document.createElement('div');
      labelEl.className = 'metric-label';
      labelEl.textContent = comp.label || '';
      card.appendChild(labelEl);
      const valueEl = document.createElement('div');
      valueEl.className = 'metric-value';
      const showValue = (val) => {
        valueEl.textContent = ComponentRegistry.formatNumericDisplayValue(val, comp);
      };
      if (comp.tag && !ctx.studioEdit) {
        ComponentRegistry.bindIndicatorRef(comp.tag, showValue, ctx);
      } else {
        showValue(comp.defaultValue ?? 0);
      }
      card.appendChild(valueEl);
      if (comp.unit) {
        const unitEl = document.createElement('span');
        unitEl.className = 'metric-unit';
        unitEl.textContent = comp.unit;
        valueEl.appendChild(unitEl);
      }
      return card;
    }

    const el = document.createElement('div');
    el.className = 'ft-numeric-display ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 4,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      studioEdit
    });
    ComponentRegistry.applyShapePattern(el, comp);

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.padding = '0 4px';

    const valueEl = document.createElement('span');
    valueEl.className = 'ft-numeric-display-value';
    valueEl.style.pointerEvents = 'none';
    valueEl.style.width = '100%';
    el.appendChild(valueEl);

    const placeholder = ComponentRegistry.numericDisplayPlaceholder(comp);
    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId);
    el.style.justifyContent = align.justify;
    el.style.alignItems = align.align;

    const applyTextStyle = () => {
      ComponentRegistry.applyCaptionStyle(valueEl, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: comp.foreColor || '#ffffff',
        useForeColor: true,
        wordWrap: false,
        alignment: alignId
      });
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    };
    applyTextStyle();

    const applyPolarity = (val) => {
      if (!comp.polarityTag) return val;
      const p = ComponentRegistry.readIndicatorRef(comp.polarityTag, ctx);
      const flag = Number(p);
      if (!flag) return val;
      const n = Number(val);
      return Number.isNaN(n) ? val : -n;
    };

    const showValue = (val) => {
      valueEl.textContent = ComponentRegistry.formatNumericDisplayValue(val, comp);
    };

    const refresh = () => {
      if (!comp.tag) {
        valueEl.textContent = placeholder;
        return;
      }
      const current = ctx.getTagValue?.(comp.tag);
      if (current === undefined || current === null) {
        valueEl.textContent = placeholder;
        return;
      }
      showValue(applyPolarity(current));
    };

    if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, () => refresh(), ctx);
      if (comp.polarityTag) ComponentRegistry.bindIndicatorRef(comp.polarityTag, () => refresh(), ctx);
      refresh();
    } else {
      valueEl.textContent = placeholder;
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'NumericDisplay',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'NumericDisplay',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  NumericInputEnable(comp, ctx) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ft-numeric-input ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.padding = '0 4px';
    el.style.overflow = 'hidden';
    el.style.cursor = studioEdit ? 'default' : 'pointer';
    el.appendChild(caption);
    let imgEl = null;

    const applyCaptionLook = (alignId) => {
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: comp.captionColor || comp.foreColor || '#ffffff',
        useForeColor: Boolean(comp.useCaptionColor),
        wordWrap: comp.wordWrap !== false,
        alignment: alignId
      });
      if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
        caption.style.backgroundColor = comp.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = 'transparent';
      }
      caption.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    };

    const renderAppearance = (displayText) => {
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      ComponentRegistry.applyButtonAppearance(el, {
        ...comp,
        borderStyle: comp.borderStyle || 'line',
        borderWidth: comp.borderWidth ?? 4,
        borderUsesBackColor: comp.borderUsesBackColor !== false,
        backStyle: comp.backStyle || 'solid',
        backColor: comp.backColor || '#001C38',
        useBackColor: comp.useBackColor !== false,
        studioEdit,
        useHighlightColor: false
      });
      ComponentRegistry.applyShapePattern(el, comp);
      if (comp.useHighlightColor && comp.highlightColor) {
        el.classList.add('ft-highlight-on-focus');
        el.style.setProperty('--ft-highlight-color', comp.highlightColor);
      } else {
        el.classList.remove('ft-highlight-on-focus');
        el.style.removeProperty('--ft-highlight-color');
      }
      if (comp.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-numeric-input-icon';
        imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        const scaled = Boolean(comp.imageScaled);
        imgEl.style.maxWidth = scaled ? '100%' : '88%';
        imgEl.style.maxHeight = scaled ? '100%' : '88%';
        imgEl.style.objectFit = scaled ? 'fill' : 'contain';
        imgEl.style.width = scaled ? '100%' : '';
        imgEl.style.height = scaled ? '100%' : '';
        if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
          imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
        }
        imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
        el.insertBefore(imgEl, caption);
      }
      const text = displayText ?? (comp.caption ?? comp.label ?? '');
      caption.textContent = text;
      caption.style.display = text ? '' : 'none';
      const alignId = comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      el.style.justifyContent = align.justify;
      el.style.alignItems = align.align;
      applyCaptionLook(alignId);
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    };

    const showValue = (val) => {
      renderAppearance(ComponentRegistry.formatNumericDisplayValue(val, {
        ...comp,
        numberOfDigits: comp.numberOfDigits ?? 5,
        decimalPlaces: comp.digitsAfterDecimal ?? comp.decimalPlaces ?? 0
      }));
    };

    if (studioEdit) {
      renderAppearance(comp.caption ?? comp.label ?? '');
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'NumericInputEnable',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'NumericInputEnable',
          source: comp._source || ''
        }, '*');
      });
      return el;
    }

    if (comp.tag) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showValue, ctx);
    } else {
      renderAppearance(comp.caption ?? comp.label ?? '');
    }

    const getMin = () => {
      if (comp.useVariableMinMax && comp.minimumTag) {
        const v = Number(ComponentRegistry.readIndicatorRef(comp.minimumTag, ctx));
        if (!Number.isNaN(v)) return v;
      }
      return comp.minValue ?? 0;
    };

    const getMax = () => {
      if (comp.useVariableMinMax && comp.maximumTag) {
        const v = Number(ComponentRegistry.readIndicatorRef(comp.maximumTag, ctx));
        if (!Number.isNaN(v)) return v;
      }
      return comp.maxValue ?? 2147483647;
    };

    const commitValue = (raw) => {
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const n = Number(raw);
      if (Number.isNaN(n)) return;
      const min = getMin();
      const max = getMax();
      const clamped = Math.min(max, Math.max(min, n));
      ctx.writeTag(writeTag, clamped);
      if (comp.enterTag) {
        const enterWrite = ComponentRegistry.resolveWriteTagName(comp.enterTag);
        if (enterWrite) {
          ctx.writeTag(enterWrite, 1);
          setTimeout(() => ctx.writeTag(enterWrite, 0), comp.enterKeyHoldTime ?? 250);
        }
      }
      showValue(clamped);
    };

    el.addEventListener('click', (e) => {
      e.preventDefault();
      const current = comp.tag ? ctx.getTagValue(comp.tag) : '';
      const input = window.prompt('Enter value:', current !== undefined && current !== null ? String(current) : '');
      if (input === null) return;
      commitValue(input);
    });

    return el;
  },

  NumericInputCursorPoint(comp, ctx) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ft-numeric-input ft-numeric-input-cursor ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 4,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(el, comp);
    if (comp.useHighlightColor && comp.highlightColor) {
      el.classList.add('ft-highlight-on-focus');
      el.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      el.classList.remove('ft-highlight-on-focus');
      el.style.removeProperty('--ft-highlight-color');
    }

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.padding = '0 4px';
    el.style.cursor = studioEdit ? 'default' : 'pointer';
    el.classList.toggle('ft-blink', Boolean(comp.blink));

    const valueEl = document.createElement('span');
    valueEl.className = 'ft-numeric-display-value';
    valueEl.style.pointerEvents = 'none';
    valueEl.style.width = '100%';
    el.appendChild(valueEl);

    const placeholder = ComponentRegistry.numericDisplayPlaceholder(comp);
    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId);
    el.style.justifyContent = align.justify;
    el.style.alignItems = align.align;

    ComponentRegistry.applyCaptionStyle(valueEl, {
      fontFamily: comp.fontFamily,
      fontSize: comp.fontSize,
      bold: comp.bold,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.foreColor || '#ffffff',
      useForeColor: true,
      wordWrap: false,
      alignment: alignId
    });

    const showValue = (val) => {
      valueEl.textContent = ComponentRegistry.formatNumericDisplayValue(val, comp);
    };

    const displayRef = comp.indicatorTag || comp.tag;
    if (displayRef && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(displayRef, showValue, ctx);
    } else {
      valueEl.textContent = placeholder;
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'NumericInputCursorPoint',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'NumericInputCursorPoint',
          source: comp._source || ''
        }, '*');
      });
      return el;
    }

    const getMin = () => {
      if (comp.useVariableMinMax && comp.minimumTag) {
        const v = Number(ComponentRegistry.readIndicatorRef(comp.minimumTag, ctx));
        if (!Number.isNaN(v)) return v;
      }
      return comp.minValue ?? 0;
    };

    const getMax = () => {
      if (comp.useVariableMinMax && comp.maximumTag) {
        const v = Number(ComponentRegistry.readIndicatorRef(comp.maximumTag, ctx));
        if (!Number.isNaN(v)) return v;
      }
      return comp.maxValue ?? 2147483647;
    };

    const commitValue = (raw) => {
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const n = Number(raw);
      if (Number.isNaN(n)) return;
      const min = getMin();
      const max = getMax();
      const clamped = Math.min(max, Math.max(min, n));
      ctx.writeTag(writeTag, clamped);
      if (comp.enterTag) {
        const enterWrite = ComponentRegistry.resolveWriteTagName(comp.enterTag);
        if (enterWrite) {
          ctx.writeTag(enterWrite, 1);
          setTimeout(() => ctx.writeTag(enterWrite, 0), comp.enterKeyHoldTime ?? 250);
        }
      }
      if (!comp.indicatorTag) showValue(clamped);
    };

    el.addEventListener('click', (e) => {
      e.preventDefault();
      const currentRef = comp.indicatorTag || comp.tag;
      const current = currentRef ? ctx.getTagValue(currentRef) : '';
      const caption = comp.keypadCaption ? `${comp.keypadCaption}\n` : '';
      const input = window.prompt(`${caption}Enter value:`, current !== undefined && current !== null ? String(current) : '');
      if (input === null) return;
      commitValue(input);
    });

    return el;
  },

  formatNumericDisplayValue(val, comp) {
    const digits = comp.numberOfDigits ?? 5;
    const decimalPlaces = comp.decimalPlaces ?? comp.decimals ?? 0;
    const placeholder = () => {
      if (decimalPlaces > 0) {
        const intDigits = Math.max(1, digits - decimalPlaces - 1);
        return `${'N'.repeat(intDigits)}.${'N'.repeat(decimalPlaces)}`;
      }
      return 'N'.repeat(Math.max(1, digits));
    };
    if (val === null || val === undefined) return placeholder();
    const n = Number(val);
    if (Number.isNaN(n)) return String(val);
    let text = decimalPlaces > 0 ? n.toFixed(decimalPlaces) : String(Math.round(n));
    const fill = (comp.fillLeftWith || 'none').toLowerCase();
    if (fill === 'zero' || fill === 'zeroes') text = text.padStart(digits, '0');
    else if (fill === 'space' || fill === 'spaces') text = text.padStart(digits, ' ');
    return text;
  },

  numericDisplayPlaceholder(comp) {
    const digits = comp.numberOfDigits ?? 5;
    const decimalPlaces = comp.decimalPlaces ?? comp.decimals ?? 0;
    if (decimalPlaces > 0) {
      const intDigits = Math.max(1, digits - decimalPlaces - 1);
      return `${'N'.repeat(intDigits)}.${'N'.repeat(decimalPlaces)}`;
    }
    return 'N'.repeat(Math.max(1, digits));
  },

  StateIndicator(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'state-indicator';
    const label = document.createElement('div');
    label.className = 'state-label';
    label.textContent = comp.label || '';
    const value = document.createElement('div');
    value.className = 'state-value';
    value.textContent = '—';
    el.appendChild(label);
    el.appendChild(value);
    ctx.bindTag(comp.tag, (val) => {
      const key = String(val);
      const state = comp.states?.[key] || { text: String(val), color: '#888' };
      value.textContent = state.text;
      value.style.backgroundColor = state.color;
      el.style.borderColor = state.color;
    });
    return el;
  },

  MultistateIndicator(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-multistate ft-multistate-indicator ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);

    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultMultistateIndicatorStates(comp.numberOfStates ?? 4);

    if (comp.shape === 'circle') {
      el.classList.add('ft-multistate-circle', 'ft-status-led');
      el.style.borderRadius = '50%';
    } else if (comp.shape === 'ellipse') {
      el.style.borderRadius = '50%';
    } else if (comp.borderStyle === 'none' && (comp.width == null || comp.width <= 36)) {
      el.classList.add('ft-multistate-flat');
    }

    el.style.display = 'flex';
    el.style.overflow = 'hidden';

    let imgEl = null;
    const caption = document.createElement('span');
    caption.className = 'ft-multistate-caption';
    caption.style.pointerEvents = 'none';
    el.appendChild(caption);

    const applyLedClass = (stateDef) => {
      if (comp.shape !== 'circle' || !stateDef) return;
      el.classList.remove('ft-status-led--green', 'ft-status-led--red', 'ft-status-led--error');
      const fill = (stateDef.backColor || stateDef.color || '').toLowerCase();
      if (stateDef.id === 'Error' || fill === 'navy' || fill === '#001c38') {
        el.classList.add('ft-status-led--error');
      } else if (fill === '#10eb10' || fill === '#00c000' || stateDef.value === 1) {
        el.classList.add('ft-status-led--green');
      } else {
        el.classList.add('ft-status-led--red');
      }
    };

    const applyState = (stateDef) => {
      if (!stateDef) return;

      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }

      const merged = {
        ...comp,
        backColor: stateDef.useBackColor !== false ? (stateDef.backColor || '#001C38') : 'transparent',
        useBackColor: stateDef.useBackColor !== false,
        borderColor: stateDef.useBorderColor !== false ? (stateDef.borderColor || stateDef.backColor || '#001C38') : 'transparent',
        useBorderColor: stateDef.useBorderColor !== false,
        borderStyle: comp.borderStyle || 'line',
        borderWidth: comp.borderWidth ?? 4,
        borderUsesBackColor: comp.borderUsesBackColor !== false,
        backStyle: comp.backStyle || 'solid',
        shape: comp.shape || 'rectangle',
        patternStyle: stateDef.patternStyle || 'none',
        patternColor: stateDef.patternColor || '#ffffff',
        usePatternColor: Boolean(stateDef.usePatternColor),
        blink: stateDef.blink,
        studioEdit,
        useHighlightColor: false
      };

      ComponentRegistry.applyButtonAppearance(el, merged);
      ComponentRegistry.applyShapePattern(el, merged);
      if (comp.shape === 'circle') applyLedClass(stateDef);

      if (stateDef.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-multistate-image';
        imgEl.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        if (stateDef.imageScaled) {
          imgEl.style.maxWidth = '100%';
          imgEl.style.maxHeight = '100%';
          imgEl.style.objectFit = 'contain';
        }
        if (stateDef.useImageBackColor && stateDef.imageBackStyle === 'solid') {
          imgEl.style.backgroundColor = stateDef.imageBackColor || '#001C38';
        }
        imgEl.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
        el.insertBefore(imgEl, caption);
      }

      const label = stateDef.caption || stateDef.text || '';
      caption.textContent = label;

      const alignId = stateDef.alignment || 'middleCenter';
      const hasImage = Boolean(stateDef.image);
      if (hasImage) {
        const imgAlign = ComponentRegistry.textAlignment(stateDef.imageAlignment || 'middleCenter', 'column');
        el.style.flexDirection = 'column';
        el.style.justifyContent = imgAlign.justify;
        el.style.alignItems = imgAlign.align;
        caption.style.width = '100%';
        caption.style.height = '';
        caption.style.flex = '0 0 auto';
        caption.style.display = label ? '' : 'none';
      } else if (label) {
        const align = ComponentRegistry.textAlignment(alignId, 'row');
        el.style.flexDirection = 'row';
        el.style.justifyContent = align.justify;
        el.style.alignItems = align.align;
        caption.style.width = '100%';
        caption.style.height = '100%';
        caption.style.flex = '1 1 auto';
        caption.style.display = 'flex';
        caption.style.alignItems = align.align;
        caption.style.justifyContent = align.justify;
      } else {
        caption.style.display = 'none';
      }

      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: stateDef.fontFamily || comp.fontFamily || 'Arial Unicode MS',
        fontSize: stateDef.fontSize ?? comp.fontSize ?? 10,
        bold: stateDef.bold ?? comp.bold,
        italic: stateDef.italic ?? comp.italic,
        underline: stateDef.underline ?? comp.underline,
        foreColor: stateDef.captionColor || stateDef.textColor || '#ffffff',
        useForeColor: stateDef.useCaptionColor !== undefined ? Boolean(stateDef.useCaptionColor) : Boolean(label),
        wordWrap: stateDef.wordWrap !== false,
        alignment: alignId
      });
      caption.style.whiteSpace = stateDef.wordWrap !== false ? 'pre-wrap' : 'nowrap';
      if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid') {
        caption.style.backgroundColor = stateDef.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = '';
      }
      caption.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
      el.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      applyState(ComponentRegistry.resolveMultistateState(states, val, comp.triggerType));
    };

    if (studioEdit && comp.previewStateId) {
      applyState(states.find((s) => s.id === comp.previewStateId) || states[0]);
    } else {
      const tag = comp.tag || comp.indicatorTag;
      if (tag && !studioEdit) {
        ComponentRegistry.bindIndicatorRef(tag, showTagState, ctx);
        const current = ctx.getTagValue(tag);
        if (current !== undefined && current !== null) {
          showTagState(current);
        } else {
          showTagState(comp.defaultValue ?? comp.previewValue ?? 0);
        }
      } else {
        showTagState(comp.defaultValue ?? comp.previewValue ?? 0);
      }
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MultistateIndicator',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MultistateIndicator',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  SymbolIndicator(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-symbol-indicator ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultSymbolIndicatorStates(comp.numberOfStates ?? 4);

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.position = 'absolute';

    const placeholder = document.createElement('span');
    placeholder.className = 'ft-symbol-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    el.appendChild(placeholder);

    const img = document.createElement('img');
    img.className = 'ft-symbol-indicator-image';
    img.alt = '';
    img.draggable = false;
    img.style.pointerEvents = 'none';
    el.appendChild(img);

    const applyState = (stateDef) => {
      if (!stateDef) return;
      const hasImage = Boolean(stateDef.image);
      const merged = {
        ...comp,
        borderStyle: comp.borderStyle || 'none',
        borderWidth: comp.borderWidth ?? 4,
        borderUsesBackColor: false,
        useBorderColor: Boolean(stateDef.useBorderColor),
        borderColor: stateDef.borderColor || '#808080',
        backStyle: hasImage && stateDef.imageBackStyle === 'solid' ? 'solid' : 'transparent',
        useBackColor: hasImage && stateDef.imageBackStyle === 'solid',
        backColor: stateDef.imageBackColor || '#808080',
        shape: comp.shape || 'rectangle',
        blink: stateDef.imageBlink,
        studioEdit,
        useHighlightColor: false
      };
      ComponentRegistry.applyButtonAppearance(el, merged);

      const alignId = stateDef.imageAlignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      el.style.justifyContent = align.justify;
      el.style.alignItems = align.align;

      if (hasImage) {
        placeholder.style.display = 'none';
        img.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        img.style.display = '';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        if (stateDef.imageBackStyle === 'solid') {
          img.style.backgroundColor = stateDef.imageBackColor || '#808080';
        } else {
          img.style.backgroundColor = 'transparent';
        }
      } else {
        placeholder.style.display = '';
        img.removeAttribute('src');
        img.style.display = 'none';
      }
      img.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
      el.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
    };

    const showTagState = (val) => {
      applyState(ComponentRegistry.resolveMultistateState(states, val, comp.triggerType));
    };

    if (studioEdit && comp.previewStateId) {
      applyState(states.find((s) => s.id === comp.previewStateId) || states[0]);
    } else {
      const tag = comp.tag || comp.indicatorTag;
      if (tag && !studioEdit) {
        ComponentRegistry.bindIndicatorRef(tag, showTagState, ctx);
        const current = ctx.getTagValue(tag);
        if (current !== undefined && current !== null) showTagState(current);
        else showTagState(comp.defaultValue ?? 0);
      } else {
        showTagState(comp.defaultValue ?? 0);
      }
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'SymbolIndicator',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'SymbolIndicator',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  ListIndicator(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-list-indicator ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states.filter((s) => s.id !== 'Error')
      : ComponentRegistry.defaultListIndicatorStates(comp.numberOfStates ?? 5);

    const patternStyle = comp.patternStyle || 'none';
    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 4,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle === 'gradient' ? 'gradient' : 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: comp.borderColor || '#001C38',
      patternStyle,
      usePatternColor: patternStyle !== 'none',
      patternColor: comp.patternColor || '#ffffff',
      blink: comp.blink,
      studioEdit
    });

    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.overflow = 'hidden';
    el.style.padding = '0';

    const rows = states.map((stateDef) => {
      const row = document.createElement('div');
      row.className = 'ft-list-indicator-row';
      row.style.flex = '1 1 0';
      row.style.display = 'flex';
      row.style.overflow = 'hidden';
      row.style.minHeight = '0';
      row.dataset.stateId = stateDef.id;

      const cap = document.createElement('span');
      cap.className = 'ft-list-indicator-caption';
      cap.style.pointerEvents = 'none';
      cap.style.width = '100%';
      cap.style.padding = '0 4px';
      if (comp.captionTruncate === 'character') {
        cap.style.whiteSpace = 'nowrap';
        cap.style.textOverflow = 'ellipsis';
      } else {
        cap.style.whiteSpace = 'normal';
        cap.style.textOverflow = 'clip';
      }
      row.appendChild(cap);
      el.appendChild(row);
      return { row, cap, stateDef };
    });

    const applyRowStyle = (entry, isActive) => {
      const { row, cap, stateDef } = entry;
      const alignId = stateDef.alignment || 'middleLeft';
      const align = ComponentRegistry.textAlignment(alignId);
      row.style.justifyContent = align.justify;
      row.style.alignItems = align.align;

      if (isActive) {
        row.style.backgroundColor = comp.selectionBackColor || '#99CCFF';
        ComponentRegistry.applyCaptionStyle(cap, {
          fontFamily: comp.fontFamily || 'Arial Unicode MS',
          fontSize: comp.fontSize ?? 10,
          bold: comp.bold,
          italic: comp.italic,
          underline: comp.underline,
          foreColor: comp.selectionForeColor || '#000000',
          useForeColor: true,
          wordWrap: comp.captionTruncate !== 'character',
          alignment: alignId
        });
      } else {
        if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid') {
          row.style.backgroundColor = stateDef.captionBackColor || '#001C38';
        } else {
          row.style.backgroundColor = 'transparent';
        }
        ComponentRegistry.applyCaptionStyle(cap, {
          fontFamily: comp.fontFamily || 'Arial Unicode MS',
          fontSize: comp.fontSize ?? 10,
          bold: comp.bold,
          italic: comp.italic,
          underline: comp.underline,
          foreColor: stateDef.useCaptionColor ? (stateDef.captionColor || '#ffffff') : '#ffffff',
          useForeColor: true,
          wordWrap: comp.captionTruncate !== 'character',
          alignment: alignId
        });
      }

      cap.textContent = stateDef.caption || '';
      cap.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
      row.classList.toggle('ft-list-indicator-row--active', isActive);
    };

    const renderList = (val) => {
      const active = ComponentRegistry.resolveMultistateState(states, val, comp.triggerType);
      rows.forEach((entry) => applyRowStyle(entry, entry.stateDef.id === active?.id));
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    };

    if (studioEdit && comp.previewStateId) {
      const preview = states.find((s) => s.id === comp.previewStateId) || states[0];
      rows.forEach((entry) => applyRowStyle(entry, entry.stateDef.id === preview?.id));
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    } else {
      const tag = comp.tag || comp.indicatorTag;
      if (tag && !studioEdit) {
        ComponentRegistry.bindIndicatorRef(tag, renderList, ctx);
        const current = ctx.getTagValue?.(tag);
        if (current !== undefined && current !== null) renderList(current);
        else renderList(comp.defaultValue ?? 0);
      } else {
        renderList(comp.defaultValue ?? 0);
      }
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'ListIndicator',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'ListIndicator',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  BarGraph(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-bar-graph ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);

    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 4,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: true,
      useBorderColor: true,
      borderColor: comp.borderColor || '#001C38',
      studioEdit
    });

    el.style.overflow = 'hidden';
    el.style.padding = '0';
    el.style.boxSizing = 'border-box';

    const track = document.createElement('div');
    track.className = 'ft-bar-graph-track';
    const fill = document.createElement('div');
    fill.className = 'ft-bar-graph-fill';
    track.appendChild(fill);
    el.appendChild(track);

    const thresholdCompare = (num, thresholdValue) => {
      const type = String(comp.thresholdType || 'value').toLowerCase();
      if (type === 'percentage') {
        const min = comp.minValue ?? 0;
        const max = comp.maxValue ?? 100;
        const pct = ((num - min) / ((max - min) || 1)) * 100;
        return pct >= thresholdValue;
      }
      return num >= thresholdValue;
    };

    const resolveFillColor = (num) => {
      const count = comp.numberOfThresholds ?? 0;
      const thresholds = comp.thresholds || [];
      if (count >= 2 && thresholdCompare(num, thresholds[1]?.value ?? 75)) {
        return thresholds[1]?.fillColor || '#ff0000';
      }
      if (count >= 1 && thresholdCompare(num, thresholds[0]?.value ?? 50)) {
        return thresholds[0]?.fillColor || '#ffff00';
      }
      return comp.fillColor || '#99CCFF';
    };

    const resolveBlink = (num) => {
      const count = comp.numberOfThresholds ?? 0;
      const thresholds = comp.thresholds || [];
      if (count >= 2 && thresholdCompare(num, thresholds[1]?.value ?? 75) && thresholds[1]?.blink) return true;
      if (count >= 1 && thresholdCompare(num, thresholds[0]?.value ?? 50) && thresholds[0]?.blink) return true;
      return false;
    };

    const applyFillPaint = (fillEl, color, dir) => {
      if (comp.fillStyle === 'gradient') {
        const angle = dir === 'leftToRight' ? '90deg'
          : dir === 'rightToLeft' ? '270deg'
          : dir === 'topToBottom' ? '180deg'
          : '0deg';
        fillEl.style.background = `linear-gradient(${angle}, ${color}, #ffffff)`;
        fillEl.style.backgroundColor = '';
      } else {
        fillEl.style.background = '';
        fillEl.style.backgroundColor = color;
      }
    };

    const applyValue = (val) => {
      const min = comp.minValue ?? 0;
      const max = comp.maxValue ?? 100;
      let num = val;
      if (typeof num === 'string' && num.trim() !== '' && !Number.isNaN(Number(num))) num = Number(num);
      if (typeof num !== 'number' || Number.isNaN(num)) num = min;
      const pct = Math.max(0, Math.min(1, (num - min) / ((max - min) || 1)));
      const dir = comp.fillDirection || 'bottomToTop';

      applyFillPaint(fill, resolveFillColor(num), dir);
      fill.classList.toggle('ft-blink', resolveBlink(num));

      fill.style.top = '';
      fill.style.bottom = '';
      fill.style.left = '';
      fill.style.right = '';
      fill.style.width = '';
      fill.style.height = '';

      if (dir === 'bottomToTop') {
        fill.style.left = '0';
        fill.style.right = '0';
        fill.style.bottom = '0';
        fill.style.height = `${pct * 100}%`;
      } else if (dir === 'topToBottom') {
        fill.style.left = '0';
        fill.style.right = '0';
        fill.style.top = '0';
        fill.style.height = `${pct * 100}%`;
      } else if (dir === 'leftToRight') {
        fill.style.top = '0';
        fill.style.bottom = '0';
        fill.style.left = '0';
        fill.style.width = `${pct * 100}%`;
      } else {
        fill.style.top = '0';
        fill.style.bottom = '0';
        fill.style.right = '0';
        fill.style.width = `${pct * 100}%`;
      }
    };

    const tag = comp.tag;
    if (tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(tag, applyValue, ctx);
    } else {
      applyValue(studioEdit ? (comp.minValue ?? 0) + ((comp.maxValue ?? 100) - (comp.minValue ?? 0)) * 0.25 : (comp.defaultValue ?? 25));
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'BarGraph',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'BarGraph',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  Gauge(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-gauge ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);

    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: 'none',
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: true,
      studioEdit
    });
    el.style.overflow = 'hidden';
    el.style.padding = '0';
    el.style.boxSizing = 'border-box';
    el.style.cursor = studioEdit ? 'default' : 'default';

    const w = Math.max(1, Number(comp.width) || 191);
    const h = Math.max(1, Number(comp.height) || 140);
    const fontSize = Number(comp.fontSize) || 10;
    const fontFamily = comp.fontFamily || 'Arial Unicode MS';
    const majorTicks = Math.max(2, Number(comp.majorTicks) || 5);
    const minorTicks = Math.max(0, Number(comp.minorTicks) || 0);
    const lineWidth = Number(comp.lineWidth) || 1;
    const needleWidth = Math.max(1, Number(comp.needleWidth) || 2);
    const lineStyle = comp.lineStyle || 'solid';
    const sweepStyle = comp.sweepStyle || 'solidFill';
    const min = comp.minValue ?? 0;
    const max = comp.maxValue ?? 100;
    const decimals = Math.max(0, Number(comp.decimalDigits) || 0);
    const showLegend = comp.showLegend !== false;
    const foreColor = comp.foreColor || '#FFFFFF';
    const needleColor = comp.needleColor || '#FFFFFF';
    const legendColor = comp.legendColor || '#FFFFFF';
    const fillColor = comp.fillColor || '#99CCFF';
    const ns = 'http://www.w3.org/2000/svg';
    const safeName = String(comp.name || 'gauge').replace(/[^A-Za-z0-9_-]/g, '');
    const gradId = `gg-fill-${safeName}`;

    const padL = fontSize * 1.8;
    const padR = fontSize * 2.4;
    const padT = fontSize * 1.5;
    const padB = Math.max(6, needleWidth + 2);
    const cx = w / 2;
    const cy = h - padB;
    const radius = Math.max(12, Math.min(cx - padL, cx - padR, cy - padT) - 2);

    const polar = (r, angle) => ({
      x: cx + r * Math.cos(angle),
      y: cy - r * Math.sin(angle)
    });
    const valueToAngle = (num) => {
      const t = Math.max(0, Math.min(1, (num - min) / ((max - min) || 1)));
      return Math.PI - t * Math.PI;
    };
    const formatLegend = (v) => {
      if (decimals <= 0) return String(Math.round(v));
      return Number(v).toFixed(decimals);
    };

    const thresholdCompare = (num, thresholdValue) => {
      const type = String(comp.thresholdType || 'value').toLowerCase();
      if (type === 'percentage') {
        const pct = ((num - min) / ((max - min) || 1)) * 100;
        return pct >= thresholdValue;
      }
      return num >= thresholdValue;
    };
    const resolveFillColor = (num) => {
      const count = comp.numberOfThresholds ?? 0;
      const thresholds = comp.thresholds || [];
      if (count >= 2 && thresholdCompare(num, thresholds[1]?.value ?? 75)) {
        return thresholds[1]?.fillColor || '#ff0000';
      }
      if (count >= 1 && thresholdCompare(num, thresholds[0]?.value ?? 50)) {
        return thresholds[0]?.fillColor || '#ffff00';
      }
      return fillColor;
    };
    const resolveBlink = (num) => {
      const count = comp.numberOfThresholds ?? 0;
      const thresholds = comp.thresholds || [];
      if (count >= 2 && thresholdCompare(num, thresholds[1]?.value ?? 75) && thresholds[1]?.blink) return true;
      if (count >= 1 && thresholdCompare(num, thresholds[0]?.value ?? 50) && thresholds[0]?.blink) return true;
      return false;
    };

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('aria-hidden', 'true');

    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '100%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');
    const stopA = document.createElementNS(ns, 'stop');
    stopA.setAttribute('offset', '0%');
    const stopB = document.createElementNS(ns, 'stop');
    stopB.setAttribute('offset', '100%');
    stopB.setAttribute('stop-color', '#ffffff');
    grad.appendChild(stopA);
    grad.appendChild(stopB);
    defs.appendChild(grad);
    svg.appendChild(defs);

    const fillPath = document.createElementNS(ns, 'path');
    fillPath.setAttribute('stroke', 'none');
    svg.appendChild(fillPath);

    if (lineStyle !== 'none' && lineWidth > 0) {
      const left = polar(radius, Math.PI);
      const right = polar(radius, 0);
      const arc = document.createElementNS(ns, 'path');
      arc.setAttribute('d', `M ${left.x} ${left.y} A ${radius} ${radius} 0 0 1 ${right.x} ${right.y}`);
      arc.setAttribute('fill', 'none');
      arc.setAttribute('stroke', foreColor);
      arc.setAttribute('stroke-width', String(lineWidth));
      arc.setAttribute('stroke-linecap', 'butt');
      const dash = ComponentRegistry.lineStyleToDashArray(lineStyle, lineWidth);
      if (dash) arc.setAttribute('stroke-dasharray', dash);
      svg.appendChild(arc);
    }

    const tickGroup = document.createElementNS(ns, 'g');
    const majorLen = Math.max(6, radius * 0.12);
    const minorLen = Math.max(4, radius * 0.07);
    for (let i = 0; i < majorTicks; i++) {
      const t = i / (majorTicks - 1);
      const val = min + t * (max - min);
      const ang = valueToAngle(val);
      const outer = polar(radius, ang);
      const inner = polar(radius - majorLen, ang);
      const tick = document.createElementNS(ns, 'line');
      tick.setAttribute('x1', String(outer.x));
      tick.setAttribute('y1', String(outer.y));
      tick.setAttribute('x2', String(inner.x));
      tick.setAttribute('y2', String(inner.y));
      tick.setAttribute('stroke', foreColor);
      tick.setAttribute('stroke-width', String(Math.max(1, lineWidth)));
      tickGroup.appendChild(tick);

      if (showLegend) {
        const lp = polar(radius + fontSize * 0.85, ang);
        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', String(lp.x));
        label.setAttribute('y', String(lp.y));
        label.setAttribute('fill', legendColor);
        label.setAttribute('font-family', fontFamily);
        label.setAttribute('font-size', String(fontSize));
        label.setAttribute('font-weight', comp.bold ? '700' : '400');
        label.setAttribute('font-style', comp.italic ? 'italic' : 'normal');
        label.setAttribute('text-decoration', comp.underline ? 'underline' : 'none');
        label.setAttribute('dominant-baseline', 'middle');
        if (t <= 0.02) label.setAttribute('text-anchor', 'end');
        else if (t >= 0.98) label.setAttribute('text-anchor', 'start');
        else label.setAttribute('text-anchor', 'middle');
        label.textContent = formatLegend(val);
        tickGroup.appendChild(label);
      }

      if (minorTicks > 1 && i < majorTicks - 1) {
        for (let m = 1; m < minorTicks; m++) {
          const mt = (i + m / minorTicks) / (majorTicks - 1);
          const mang = valueToAngle(min + mt * (max - min));
          const mOuter = polar(radius, mang);
          const mInner = polar(radius - minorLen, mang);
          const mTick = document.createElementNS(ns, 'line');
          mTick.setAttribute('x1', String(mOuter.x));
          mTick.setAttribute('y1', String(mOuter.y));
          mTick.setAttribute('x2', String(mInner.x));
          mTick.setAttribute('y2', String(mInner.y));
          mTick.setAttribute('stroke', foreColor);
          mTick.setAttribute('stroke-width', String(Math.max(1, lineWidth)));
          tickGroup.appendChild(mTick);
        }
      }
    }
    svg.appendChild(tickGroup);

    const needle = document.createElementNS(ns, 'line');
    needle.setAttribute('stroke-linecap', 'round');
    svg.appendChild(needle);
    el.appendChild(svg);

    const applyValue = (val) => {
      let num = val;
      if (typeof num === 'string' && num.trim() !== '' && !Number.isNaN(Number(num))) num = Number(num);
      if (typeof num !== 'number' || Number.isNaN(num)) num = min;
      const ang = valueToAngle(num);
      const tip = polar(radius * 0.92, ang);
      needle.setAttribute('x1', String(cx));
      needle.setAttribute('y1', String(cy));
      needle.setAttribute('x2', String(tip.x));
      needle.setAttribute('y2', String(tip.y));
      needle.setAttribute('stroke', needleColor);
      needle.setAttribute('stroke-width', String(needleWidth));

      const color = resolveFillColor(num);
      stopA.setAttribute('stop-color', color);
      fillPath.classList.toggle('ft-blink', resolveBlink(num));

      const span = Math.abs(num - min);
      if (sweepStyle === 'point' || span < ((max - min) || 1) * 0.002) {
        fillPath.setAttribute('d', '');
        fillPath.setAttribute('fill', 'none');
        return;
      }
      const start = polar(radius, Math.PI);
      const end = polar(radius, ang);
      const large = 0;
      fillPath.setAttribute('d', `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y} Z`);
      if (sweepStyle === 'gradientFill') {
        fillPath.setAttribute('fill', `url(#${gradId})`);
      } else {
        fillPath.setAttribute('fill', color);
      }
      fillPath.setAttribute('fill-opacity', '0.9');
    };

    const tag = comp.tag;
    if (tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(tag, applyValue, ctx);
      const current = ctx.getTagValue?.(tag);
      if (current !== undefined && current !== null) applyValue(current);
      else applyValue(comp.defaultValue ?? min);
    } else {
      applyValue(studioEdit ? min : (comp.defaultValue ?? min));
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'Gauge',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'Gauge',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  Scale(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-scale ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const backStyle = comp.backStyle || 'transparent';
    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'none',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle,
      backColor: comp.backColor || '#001C38',
      useBackColor: backStyle !== 'transparent',
      useBorderColor: true,
      borderColor: comp.borderColor || '#001C38',
      blink: Boolean(comp.blink),
      studioEdit
    });
    el.style.overflow = 'hidden';
    el.style.padding = '0';
    el.style.boxSizing = 'border-box';
    el.style.cursor = 'default';

    const w = Math.max(1, Number(comp.width) || 184);
    const h = Math.max(1, Number(comp.height) || 101);
    const lineStyle = comp.lineStyle || 'solid';
    const lineWidth = Number(comp.lineWidth) || 1;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('aria-hidden', 'true');

    if (lineStyle !== 'none' && lineWidth > 0) {
      const color = comp.foreColor || '#001C38';
      const dash = ComponentRegistry.lineStyleToDashArray(lineStyle, lineWidth);
      const addLine = (x1, y1, x2, y2) => {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', String(x1));
        line.setAttribute('y1', String(y1));
        line.setAttribute('x2', String(x2));
        line.setAttribute('y2', String(y2));
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', String(lineWidth));
        line.setAttribute('stroke-linecap', 'butt');
        if (dash) line.setAttribute('stroke-dasharray', dash);
        svg.appendChild(line);
      };
      const dir = comp.tickDirection || 'right';
      const majors = Math.max(2, Number(comp.majorTicks) || 3);
      const minors = Math.max(0, Number(comp.minorTicks) || 0);
      const pad = Math.max(1, lineWidth / 2);
      if (dir === 'right' || dir === 'left') {
        const xBase = dir === 'right' ? pad : w - pad;
        const sign = dir === 'right' ? 1 : -1;
        const inner = Math.max(1, h - 2 * pad);
        const majorLen = Math.max(4, (w - 2 * pad) * 0.5);
        const minorLen = majorLen * 0.45;
        addLine(xBase, pad, xBase, h - pad);
        for (let i = 0; i < majors; i++) {
          const y = pad + (i / (majors - 1)) * inner;
          addLine(xBase, y, xBase + sign * majorLen, y);
          if (i < majors - 1 && minors > 0) {
            for (let m = 1; m <= minors; m++) {
              const yt = pad + ((i + m / (minors + 1)) / (majors - 1)) * inner;
              addLine(xBase, yt, xBase + sign * minorLen, yt);
            }
          }
        }
      } else {
        const yBase = dir === 'down' ? pad : h - pad;
        const sign = dir === 'down' ? 1 : -1;
        const inner = Math.max(1, w - 2 * pad);
        const majorLen = Math.max(4, (h - 2 * pad) * 0.5);
        const minorLen = majorLen * 0.45;
        addLine(pad, yBase, w - pad, yBase);
        for (let i = 0; i < majors; i++) {
          const x = pad + (i / (majors - 1)) * inner;
          addLine(x, yBase, x, yBase + sign * majorLen);
          if (i < majors - 1 && minors > 0) {
            for (let m = 1; m <= minors; m++) {
              const xt = pad + ((i + m / (minors + 1)) / (majors - 1)) * inner;
              addLine(xt, yBase, xt, yBase + sign * minorLen);
            }
          }
        }
      }
    }

    el.appendChild(svg);

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'Scale',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'Scale',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  defaultListIndicatorStates(count = 5) {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`,
        value: i,
        caption: '',
        useCaptionColor: false,
        captionColor: '#ffffff',
        useCaptionBackColor: false,
        captionBackColor: '#001C38',
        captionBlink: false,
        captionBackStyle: 'transparent',
        alignment: 'middleLeft'
      });
    }
    return states;
  },

  defaultSymbolIndicatorStates(count = 4) {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`,
        value: i,
        image: '',
        useBorderColor: false,
        borderColor: '#808080',
        imageColor: '#001C38',
        imageBackColor: '#808080',
        imageBlink: false,
        imageScaled: true,
        imageBackStyle: 'transparent',
        imageAlignment: 'middleCenter'
      });
    }
    states.push({
      id: 'Error',
      image: '',
      useBorderColor: false,
      borderColor: '#808080',
      imageColor: '#001C38',
      imageBackColor: '#808080',
      imageBlink: false,
      imageScaled: true,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter'
    });
    return states;
  },

  resolveMultistateState(states, value, triggerType) {
    const errorState = states.find((s) => s.id === 'Error' || s.stateId === 'Error');
    if (value === null || value === undefined) return errorState || states[0];

    let num = value;
    if (value === true) num = 1;
    if (value === false) num = 0;
    if (typeof num === 'string' && num.trim() !== '' && !Number.isNaN(Number(num))) {
      num = Number(num);
    }

    if (String(triggerType || '').toLowerCase() === 'lsb') {
      const bits = Number(num);
      if (!Number.isFinite(bits) || bits === 0) return errorState || states[0];
      const lowest = bits & -bits;
      const bitIndex = Math.round(Math.log2(lowest >>> 0));
      const match = states.find((s) => s.value === bitIndex) || states.find((s) => s.id === `State${bitIndex}`);
      return match || errorState || states[0];
    }

    const match = states.find((s) => s.value !== undefined && s.value === num);
    return match || errorState || states.find((s) => s.value === 0) || states[0];
  },

  defaultMultistateIndicatorStates(count = 4) {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`,
        value: i,
        useBackColor: true,
        backColor: '#001C38',
        useBorderColor: true,
        borderColor: '#001C38',
        caption: '',
        useCaptionColor: false,
        captionColor: '#ffffff',
        wordWrap: true,
        alignment: 'middleCenter'
      });
    }
    states.push({
      id: 'Error',
      caption: 'Error',
      useBackColor: true,
      backColor: '#001C38',
      useBorderColor: true,
      borderColor: '#001C38',
      useCaptionColor: true,
      captionColor: '#ffffff',
      wordWrap: true,
      alignment: 'middleCenter'
    });
    return states;
  },

  defaultModeIndicator() {
    return {
      type: 'MultistateIndicator',
      tag: 'System.AutoMode',
      width: 71,
      height: 33,
      states: [
        { id: 'Error', caption: 'Error', backColor: 'navy', borderColor: 'navy', captionColor: '#fff' },
        { id: '0', value: 0, caption: 'Manual', backColor: 'blue', borderColor: '#ff8000', captionColor: '#fff' },
        { id: '1', value: 1, caption: 'Auto', backColor: '#00c000', borderColor: '#40ff10', captionColor: '#fff' }
      ]
    };
  },

  defaultHealthIndicator() {
    return {
      type: 'MultistateIndicator',
      tag: 'System.Healthy',
      width: 71,
      height: 33,
      states: [
        { id: 'Error', caption: 'Error', backColor: '#001C38', borderColor: '#001C38', captionColor: '#fff' },
        { id: '0', value: 0, caption: 'Fault', backColor: 'red', borderColor: '#ff8000', captionColor: '#fff' },
        { id: '1', value: 1, caption: 'Healthy', backColor: '#00c000', borderColor: '#40ff10', captionColor: '#fff' }
      ]
    };
  },

  DataTable(comp, ctx) {
    const table = document.createElement('table');
    table.className = 'data-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>${comp.columns.map((c) => `<th>${c}</th>`).join('')}</tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const row of comp.rows || []) {
      const tr = document.createElement('tr');
      const valueCell = document.createElement('td');
      valueCell.className = 'mono';
      valueCell.textContent = '—';
      tr.innerHTML = `<td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.description || '')}</td>`;
      tr.appendChild(valueCell);
      tbody.appendChild(tr);
      if (row.tag) {
        ctx.bindTag(row.tag, (val) => {
          let text = ComponentRegistry.formatValue(val, row);
          if (row.unit) text += ' ' + row.unit;
          valueCell.textContent = text;
          if (row.format === 'boolean') {
            valueCell.style.color = (val === true || val === 1) ? '#00c000' : '#888';
            valueCell.style.fontWeight = '700';
          }
        });
      }
    }
    table.appendChild(tbody);
    return table;
  },

  LegendTable(comp) {
    const table = document.createElement('table');
    table.className = 'legend-table';
    table.innerHTML = '<thead><tr><th>Color</th><th>Meaning</th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const item of comp.items || []) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><span class="legend-swatch" style="background:${item.color}"></span></td><td>${escapeHtml(item.label)}</td>`;
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  },

  AlarmList(comp, ctx) {
    if (ComponentRegistry.isPlacedGraphic(comp)) {
      return ComponentRegistry.renderFtAlarmList(comp, ctx);
    }
    const wrapper = document.createElement('div');
    const table = document.createElement('table');
    table.className = 'alarm-table';
    table.innerHTML = '<thead><tr><th>Time</th><th>Pri</th><th>Message</th><th>Status</th><th></th></tr></thead><tbody></tbody>';
    wrapper.appendChild(table);
    ctx.onAlarmUpdate((alarms) => {
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';
      if (!alarms.active.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No active alarms</td></tr>';
        return;
      }
      for (const alarm of alarms.active) {
        const tr = document.createElement('tr');
        tr.className = alarm.acknowledged ? 'acked' : 'unacked';
        tr.innerHTML = `<td>${formatTime(alarm.activatedAt)}</td><td>P${alarm.priority}</td><td>${escapeHtml(alarm.message)}</td><td>${alarm.acknowledged ? 'Ack' : 'Active'}</td><td class="ack-cell">${alarm.acknowledged ? '' : '<button type="button">Ack</button>'}</td>`;
        tr.querySelector('button')?.addEventListener('click', () => ctx.acknowledgeAlarm(alarm.id));
        tbody.appendChild(tr);
      }
    });
    return wrapper;
  },

  renderFtAlarmList(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-alarm-list ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    el.style.boxSizing = 'border-box';
    el.style.overflow = 'hidden';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.backgroundColor = comp.backColor || '#dcdcdc';

    const borderWidth = comp.borderWidth ?? 2;
    if (comp.borderStyle === 'raisedInset') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      el.style.borderColor = '#808080 #ffffff #ffffff #808080';
    }

    const fontSize = comp.fontSize || 12;
    const rowHeight = fontSize + 10;
    const headerHeight = rowHeight + 2;
    const visibleCount = Math.max(1, Math.floor(((comp.height || 428) - headerHeight) / rowHeight));
    const listWidth = comp.width || 678;
    const timeColWidth = Math.max(140, Math.round(listWidth * 0.34));
    const gridColumns = `${timeColWidth}px minmax(0, 1fr)`;

    const header = document.createElement('div');
    header.className = 'ft-alarm-list-header';
    header.style.height = `${headerHeight}px`;
    header.style.width = '100%';
    header.style.minWidth = '0';
    header.style.boxSizing = 'border-box';
    header.style.backgroundColor = comp.headerBackColor || '#808080';
    header.style.color = comp.headerForeColor || '#000000';
    header.style.fontFamily = comp.fontFamily || 'Arial';
    header.style.fontSize = `${fontSize}px`;
    header.style.fontWeight = comp.bold ? '700' : '400';
    header.style.display = comp.displayHeader === false ? 'none' : 'grid';
    header.style.gridTemplateColumns = gridColumns;
    header.style.alignItems = 'center';
    if (comp.displayHeader !== false) {
      header.innerHTML = `<span class="ft-alarm-list-time">${escapeHtml(comp.headerTextAlarmTime || 'Alarm time')}</span><span class="ft-alarm-list-msg">${escapeHtml(comp.headerTextMessage || 'Message')}</span>`;
    }

    const body = document.createElement('div');
    body.className = 'ft-alarm-list-body';
    body.style.flex = '1';
    body.style.width = '100%';
    body.style.minWidth = '0';
    body.style.overflow = 'hidden';
    body.style.fontFamily = comp.fontFamily || 'Arial';
    body.style.fontSize = `${fontSize}px`;

    el.appendChild(header);
    el.appendChild(body);

    const controller = {
      selectedIndex: 0,
      scrollOffset: 0,
      rows: [],
      visibleCount,
      moveUp() {
        if (controller.selectedIndex > 0) {
          controller.selectedIndex -= 1;
          if (controller.selectedIndex < controller.scrollOffset) {
            controller.scrollOffset = controller.selectedIndex;
          }
        } else if (controller.scrollOffset > 0) {
          controller.scrollOffset -= 1;
        }
        paint();
      },
      moveDown() {
        const maxIndex = controller.rows.length - 1;
        if (controller.selectedIndex < maxIndex) {
          controller.selectedIndex += 1;
          if (controller.selectedIndex >= controller.scrollOffset + controller.visibleCount) {
            controller.scrollOffset = controller.selectedIndex - controller.visibleCount + 1;
          }
        }
        paint();
      },
      pageUp() {
        controller.scrollOffset = Math.max(0, controller.scrollOffset - controller.visibleCount);
        controller.selectedIndex = controller.scrollOffset;
        paint();
      },
      pageDown() {
        const maxOffset = Math.max(0, controller.rows.length - controller.visibleCount);
        controller.scrollOffset = Math.min(maxOffset, controller.scrollOffset + controller.visibleCount);
        controller.selectedIndex = Math.min(controller.rows.length - 1, controller.scrollOffset);
        paint();
      }
    };

    const buildRows = (alarms) => {
      const mode = comp.listMode || 'active';
      let rows = [];
      if (mode === 'history') {
        rows = (alarms?.history || []).map((entry) => ({
          time: entry.activatedAt || entry.acknowledgedAt || entry.clearedAt || Date.now(),
          message: entry.message || '—',
          id: entry.id
        }));
      } else {
        rows = (alarms?.active || []).map((entry) => ({
          time: entry.activatedAt || Date.now(),
          message: entry.message || '—',
          id: entry.id
        }));
      }
      if (!rows.length && comp.demoMessage) {
        rows = [{ time: Date.now(), message: comp.demoMessage, demo: true }];
      }
      return rows;
    };

    const paint = () => {
      body.innerHTML = '';
      const slice = controller.rows.slice(controller.scrollOffset, controller.scrollOffset + controller.visibleCount);
      slice.forEach((row, idx) => {
        const absoluteIndex = controller.scrollOffset + idx;
        const rowEl = document.createElement('div');
        rowEl.className = 'ft-alarm-list-row';
        rowEl.style.display = 'grid';
        rowEl.style.gridTemplateColumns = gridColumns;
        rowEl.style.width = '100%';
        rowEl.style.minWidth = '0';
        rowEl.style.height = `${rowHeight}px`;
        rowEl.style.alignItems = 'center';
        rowEl.style.boxSizing = 'border-box';
        rowEl.style.padding = '0 4px';
        if (comp.wordWrap !== false) {
          rowEl.style.whiteSpace = 'normal';
          rowEl.style.overflowWrap = 'break-word';
        } else {
          rowEl.style.whiteSpace = 'nowrap';
          rowEl.style.overflow = 'hidden';
        }
        if (absoluteIndex === controller.selectedIndex) {
          rowEl.classList.add('selected');
          rowEl.style.backgroundColor = comp.selectionBackColor || '#000080';
          rowEl.style.color = comp.selectionForeColor || '#ffffff';
        }
        const timeText = comp.formatAlarmTime === 'shortDateTime'
          ? ComponentRegistry.formatFtShortDateTime(new Date(row.time))
          : formatTime(row.time);
        rowEl.innerHTML = `<span class="ft-alarm-list-time">${escapeHtml(timeText)}</span><span class="ft-alarm-list-msg">${escapeHtml(row.message)}</span>`;
        rowEl.addEventListener('click', () => {
          controller.selectedIndex = absoluteIndex;
          paint();
        });
        body.appendChild(rowEl);
      });
    };

    ctx.onAlarmUpdate((alarms) => {
      controller.rows = buildRows(alarms);
      if (controller.selectedIndex >= controller.rows.length) {
        controller.selectedIndex = Math.max(0, controller.rows.length - 1);
      }
      if (controller.scrollOffset > Math.max(0, controller.rows.length - controller.visibleCount)) {
        controller.scrollOffset = Math.max(0, controller.rows.length - controller.visibleCount);
      }
      paint();
    });

    if (comp.name) {
      ComponentRegistry._alarmListControllers.set(comp.name, controller);
    }
    return el;
  },

  ListNavKey(comp, ctx, action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-list-nav-key ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'raised',
      borderWidth: comp.borderWidth ?? 3,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#A0A0A4',
      useBackColor: comp.useBackColor !== false,
      studioEdit: Boolean(ctx.studioEdit)
    });
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0';
    if (comp.image) {
      const img = document.createElement('img');
      img.className = 'ft-list-nav-icon';
      img.src = ComponentRegistry.imageUrl(comp.image, ctx);
      img.alt = '';
      img.draggable = false;
      img.style.maxWidth = '70%';
      img.style.maxHeight = '70%';
      img.style.objectFit = 'contain';
      img.style.pointerEvents = 'none';
      btn.appendChild(img);
    }
    if (!ctx.studioEdit) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const list = ComponentRegistry._alarmListControllers.get(comp.linkedObject);
        list?.[action]?.();
      });
    }
    return btn;
  },

  MoveUpKey(comp, ctx) {
    return ComponentRegistry.ListNavKey(comp, ctx, 'moveUp');
  },

  PageUpKey(comp, ctx) {
    return ComponentRegistry.ListNavKey(comp, ctx, 'pageUp');
  },

  PageDownKey(comp, ctx) {
    return ComponentRegistry.ListNavKey(comp, ctx, 'pageDown');
  },

  MoveDownKey(comp, ctx) {
    return ComponentRegistry.ListNavKey(comp, ctx, 'moveDown');
  },

  ClearAlarmHistoryButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-clear-alarm-history ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'raised',
      borderWidth: comp.borderWidth ?? 3,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#dcdcdc',
      useBackColor: comp.useBackColor !== false,
      studioEdit: Boolean(ctx.studioEdit)
    });
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.padding = '0';
    if (comp.image) {
      const img = document.createElement('img');
      img.className = 'ft-clear-alarm-icon';
      img.src = ComponentRegistry.imageUrl(comp.image, ctx);
      img.alt = '';
      img.draggable = false;
      img.style.maxWidth = '80%';
      img.style.maxHeight = '80%';
      img.style.objectFit = 'contain';
      img.style.pointerEvents = 'none';
      btn.appendChild(img);
    }
    if (!ctx.studioEdit && ctx.clearAlarmHistory) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        ctx.clearAlarmHistory();
      });
    }
    return btn;
  },

  AlarmHistory(comp, ctx) {
    const wrapper = document.createElement('div');
    const table = document.createElement('table');
    table.className = 'alarm-table history';
    table.innerHTML = '<thead><tr><th>Time</th><th>Event</th><th>Priority</th><th>Message</th></tr></thead><tbody></tbody>';
    wrapper.appendChild(table);
    ctx.onAlarmUpdate((alarms) => {
      const tbody = table.querySelector('tbody');
      tbody.innerHTML = '';
      const history = alarms.history || [];
      if (!history.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No alarm history</td></tr>';
        return;
      }
      for (const entry of history.slice(0, 30)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${formatTime(entry.activatedAt || entry.acknowledgedAt || Date.now())}</td><td>${escapeHtml(entry.event || '—')}</td><td>P${entry.priority}</td><td>${escapeHtml(entry.message)}</td>`;
        tbody.appendChild(tr);
      }
    });
    return wrapper;
  },

  LoginPanel(comp, ctx) {
    const panel = document.createElement('div');
    panel.className = 'login-panel';
    const status = document.createElement('div');
    status.className = 'login-status';
    const form = document.createElement('form');
    form.className = 'login-form';
    form.innerHTML = `
      <label>Username<input type="text" name="username" autocomplete="username" /></label>
      <label>Password<input type="password" name="password" autocomplete="current-password" /></label>
      <div class="login-actions">
        <button type="submit" class="action-btn primary">Login</button>
        <button type="button" class="action-btn" data-action="logout">Logout</button>
      </div>
      <p class="login-hint">operator/operator · engineer/engineer · admin/admin</p>
    `;
    const refresh = () => {
      const user = ctx.getCurrentUser();
      status.innerHTML = user
        ? `<strong>Logged in:</strong> ${escapeHtml(user.username)} (${escapeHtml(user.role)}, level ${user.level})`
        : '<strong>Not logged in</strong> — Guest access only';
    };
    refresh();
    ctx.onUserChange(refresh);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      await ctx.login(fd.get('username'), fd.get('password'));
    });
    form.querySelector('[data-action="logout"]').addEventListener('click', () => ctx.logout());
    panel.appendChild(status);
    panel.appendChild(form);
    return panel;
  },

  Panel(comp, ctx) {
    const panel = document.createElement('div');
    const isPlaced = ComponentRegistry.isPlacedGraphic(comp)
      || comp.width != null
      || comp.height != null
      || comp.backColor != null
      || comp.borderStyle != null;
    panel.className = isPlaced ? 'ft-panel ft-graphic' : (comp.style?.className || 'panel');
    if (comp.name) panel.dataset.name = comp.name;
    if (comp.visible === false) {
      panel.style.display = 'none';
      return panel;
    }
    if (isPlaced) {
      ComponentRegistry.applyGraphicsObject(panel, comp);
      ComponentRegistry.applyPanelAppearance(panel, comp);
    }
    for (const child of comp.children || []) {
      panel.appendChild(ComponentRegistry.render(child, ctx));
    }
    return panel;
  },

  ContentArea(comp, ctx) {
    const area = document.createElement('div');
    area.className = 'ft-content-area ft-graphic';
    if (comp.name) area.dataset.name = comp.name;
    ComponentRegistry.applyGraphicsObject(area, comp);
    area.style.overflow = 'auto';
    area.style.padding = '8px';
    area.style.boxSizing = 'border-box';
    area.style.background = 'transparent';
    area.style.zIndex = '5';
    area.style.display = 'flex';
    area.style.flexDirection = 'column';
    for (const child of comp.children || []) {
      area.appendChild(ComponentRegistry.render(child, ctx));
    }
    return area;
  },

  Grid(comp, ctx) {
    const grid = document.createElement('div');
    grid.className = comp.style?.className || 'grid';
    for (const child of comp.children || []) {
      grid.appendChild(ComponentRegistry.render(child, ctx));
    }
    return grid;
  },

  ChecklistTable(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-checklist-table ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);

    const body = document.createElement('div');
    body.className = 'ft-checklist-table__body';

    const headerRow = document.createElement('div');
    headerRow.className = 'ft-checklist-table__row ft-checklist-table__row--header';
    ['Device', 'Req.', 'Act.'].forEach((label, index) => {
      const cell = document.createElement('div');
      cell.className = 'ft-checklist-table__cell'
        + (index > 0 ? ' ft-checklist-table__cell--center' : '');
      cell.textContent = label;
      headerRow.appendChild(cell);
    });
    body.appendChild(headerRow);

    for (const row of comp.rows || []) {
      const rowEl = document.createElement('div');
      rowEl.className = 'ft-checklist-table__row';

      const labelCell = document.createElement('div');
      labelCell.className = 'ft-checklist-table__cell';
      labelCell.textContent = row.label || '';
      rowEl.appendChild(labelCell);

      const reqCell = document.createElement('div');
      reqCell.className = 'ft-checklist-table__cell ft-checklist-table__cell--center';
      const reqLed = document.createElement('span');
      reqLed.className = 'ft-checklist-table__led ft-checklist-table__led--green';
      reqCell.appendChild(reqLed);
      rowEl.appendChild(reqCell);

      const actCell = document.createElement('div');
      actCell.className = 'ft-checklist-table__cell ft-checklist-table__cell--center';
      const actLed = document.createElement('span');
      actLed.className = 'ft-checklist-table__led ft-checklist-table__led--red';
      actCell.appendChild(actLed);

      const applyActState = (val) => {
        const on = val === true || val === 1 || val === '1';
        actLed.classList.toggle('ft-checklist-table__led--green', on);
        actLed.classList.toggle('ft-checklist-table__led--red', !on);
      };

      if (row.actTag) {
        ctx.bindTag(row.actTag, applyActState);
        const current = ctx.getTagValue(row.actTag);
        if (current !== undefined) applyActState(current);
      }

      rowEl.appendChild(actCell);
      body.appendChild(rowEl);
    }

    el.appendChild(body);

    for (const dividerClass of ['ft-checklist-table__divider--req', 'ft-checklist-table__divider--act']) {
      const divider = document.createElement('div');
      divider.className = 'ft-checklist-table__divider ' + dividerClass;
      divider.setAttribute('aria-hidden', 'true');
      el.appendChild(divider);
    }

    return el;
  },

  lineStyleToCss(lineStyle) {
    if (lineStyle === 'none') return 'none';
    if (lineStyle === 'dash') return 'dashed';
    if (lineStyle === 'dot') return 'dotted';
    if (lineStyle === 'dashDot' || lineStyle === 'dashDotDot') return 'dashed';
    return 'solid';
  },

  lineStyleToDashArray(lineStyle, lineWidth = 1) {
    const w = Math.max(1, Number(lineWidth) || 1);
    if (lineStyle === 'dash') return `${w * 8},${w * 4}`;
    if (lineStyle === 'dot') return `${w},${w * 3}`;
    if (lineStyle === 'dashDot') return `${w * 8},${w * 4},${w},${w * 4}`;
    if (lineStyle === 'dashDotDot') return `${w * 8},${w * 4},${w},${w * 4},${w},${w * 4}`;
    return '';
  },

  applyShapeFill(el, comp) {
    const useBack = comp.useBackColor !== false;
    if (comp.backStyle === 'gradient' && useBack) {
      const start = comp.backColor || '#c6c6c6';
      const end = comp.endColor || '#e8e8e8';
      const stop = comp.gradientStop ?? 95;
      const shading = comp.gradientShadingStyle || comp.gradientDirection || '';
      if (shading === 'gradientHorizontalFromRight') {
        el.style.background = `linear-gradient(to left, ${start} 0%, ${end} ${stop}%)`;
      } else if (shading === 'gradientHorizontalFromLeft') {
        el.style.background = `linear-gradient(to right, ${start} 0%, ${end} ${stop}%)`;
      } else {
        el.style.background = `linear-gradient(to bottom, ${start} 0%, ${end} ${stop}%)`;
      }
      el.style.backgroundColor = '';
    } else if (comp.backStyle === 'transparent' || !useBack) {
      el.style.backgroundColor = 'transparent';
      el.style.background = 'none';
    } else {
      el.style.backgroundColor = comp.backColor || '#ffffff';
      el.style.background = '';
    }
  },

  applyShapePattern(el, comp) {
    if (!comp.patternStyle || comp.patternStyle === 'none' || comp.usePatternColor === false) {
      if (el.dataset.ftPattern) {
        el.style.backgroundImage = '';
        delete el.dataset.ftPattern;
      }
      return;
    }
    const color = comp.patternColor || '#808080';
    const style = comp.patternStyle;
    let pattern = '';
    switch (style) {
      case 'horizontal':
      case 'horizontalLines':
        pattern = `repeating-linear-gradient(0deg, ${color} 0, ${color} 1px, transparent 1px, transparent 4px)`;
        break;
      case 'wideHorizontalLines':
        pattern = `repeating-linear-gradient(0deg, ${color} 0, ${color} 2px, transparent 2px, transparent 8px)`;
        break;
      case 'vertical':
      case 'verticalLines':
        pattern = `repeating-linear-gradient(90deg, ${color} 0, ${color} 1px, transparent 1px, transparent 4px)`;
        break;
      case 'wideVerticalLines':
        pattern = `repeating-linear-gradient(90deg, ${color} 0, ${color} 2px, transparent 2px, transparent 8px)`;
        break;
      case 'cross':
        pattern = `repeating-linear-gradient(0deg, ${color} 0, ${color} 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, ${color} 0, ${color} 1px, transparent 1px, transparent 4px)`;
        break;
      case '50Percent':
      case 'percent50':
        pattern = `repeating-conic-gradient(${color} 0% 25%, transparent 0% 50%) 0 0 / 4px 4px`;
        break;
      case 'dots':
        pattern = `radial-gradient(circle, ${color} 1px, transparent 1px) 0 0 / 4px 4px`;
        break;
      case 'checks':
        pattern = `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%) 0 0 / 6px 6px, linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%) 3px 3px / 6px 6px`;
        break;
      case 'smallBoxes':
        pattern = `linear-gradient(${color} 1px, transparent 1px) 0 0 / 4px 4px, linear-gradient(90deg, ${color} 1px, transparent 1px) 0 0 / 4px 4px`;
        break;
      case 'mediumBoxes':
        pattern = `linear-gradient(${color} 1px, transparent 1px) 0 0 / 8px 8px, linear-gradient(90deg, ${color} 1px, transparent 1px) 0 0 / 8px 8px`;
        break;
      case 'largeBoxes':
        pattern = `linear-gradient(${color} 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, ${color} 1px, transparent 1px) 0 0 / 12px 12px`;
        break;
      case 'rightDiagonal':
        pattern = `repeating-linear-gradient(45deg, ${color} 0, ${color} 1px, transparent 1px, transparent 6px)`;
        break;
      case 'wideRightDiagonal':
        pattern = `repeating-linear-gradient(45deg, ${color} 0, ${color} 2px, transparent 2px, transparent 10px)`;
        break;
      case 'leftDiagonal':
        pattern = `repeating-linear-gradient(-45deg, ${color} 0, ${color} 1px, transparent 1px, transparent 6px)`;
        break;
      case 'wideLeftDiagonal':
        pattern = `repeating-linear-gradient(-45deg, ${color} 0, ${color} 2px, transparent 2px, transparent 10px)`;
        break;
      case 'hatch':
        pattern = `repeating-linear-gradient(45deg, ${color} 0, ${color} 1px, transparent 1px, transparent 4px), repeating-linear-gradient(-45deg, ${color} 0, ${color} 1px, transparent 1px, transparent 4px)`;
        break;
      case 'bricks':
        pattern = `linear-gradient(${color} 1px, transparent 1px) 0 0 / 12px 6px, linear-gradient(90deg, ${color} 1px, transparent 1px) 0 0 / 12px 6px`;
        break;
      case 'ovals':
        pattern = `radial-gradient(ellipse, ${color} 1px, transparent 1px) 0 0 / 8px 6px`;
        break;
      case 'diamonds':
        pattern = `repeating-conic-gradient(from 45deg, ${color} 0% 25%, transparent 0% 50%) 0 0 / 8px 8px`;
        break;
      case 'scales':
        pattern = `repeating-radial-gradient(circle at 0 100%, ${color} 0, ${color} 1px, transparent 1px, transparent 6px)`;
        break;
      case 'waves':
        pattern = `repeating-radial-gradient(circle at 50% 0, ${color} 0, ${color} 1px, transparent 1px, transparent 8px)`;
        break;
      default:
        return;
    }
    const existingBg = el.style.background;
    const existingColor = el.style.backgroundColor;
    if (existingBg && existingBg !== 'none') {
      el.style.background = `${pattern}, ${existingBg}`;
    } else if (existingColor && existingColor !== 'transparent') {
      el.style.background = `${pattern}, linear-gradient(${existingColor}, ${existingColor})`;
    } else {
      el.style.background = pattern;
    }
    el.dataset.ftPattern = '1';
  },

  applyPanelAppearance(el, comp) {
    ComponentRegistry.applyShapeFill(el, comp);
    ComponentRegistry.applyShapePattern(el, comp);

    const borderWidth = comp.borderWidth ?? 1;
    const borderStyle = comp.borderStyle || 'line';
    const backColor = comp.backColor || '#001C38';
    let borderColor = comp.borderColor || backColor;
    if (comp.borderUsesBackColor !== false) borderColor = backColor;

    el.style.boxShadow = '';
    if (borderStyle === 'none') {
      el.style.border = 'none';
    } else if (borderStyle === 'raised') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      el.style.borderColor = '#ffffff #808080 #808080 #ffffff';
    } else if (borderStyle === 'inset') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      el.style.borderColor = '#808080 #ffffff #ffffff #808080';
    } else if (borderStyle === 'raisedInset') {
      el.style.borderStyle = 'solid';
      el.style.borderWidth = `${borderWidth}px`;
      el.style.borderColor = '#808080 #ffffff #ffffff #808080';
      el.style.boxShadow = 'inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff';
    } else {
      el.style.border = `${borderWidth}px solid ${borderColor}`;
    }

    el.classList.toggle('ft-blink', Boolean(comp.blink));
    el.style.boxSizing = 'border-box';
    el.style.overflow = 'hidden';
  },

  applyShapeBorder(el, comp, options = {}) {
    const { borderMode } = options;
    const borderW = comp.lineWidth ?? comp.borderWidth ?? 1;
    const borderColor = comp.foreColor || comp.borderColor || '#c6c6c6';
    const useFore = comp.useForeColor !== false;
    const lineStyle = ComponentRegistry.lineStyleToCss(comp.lineStyle);

    if (borderMode === 'tableRow') {
      el.style.border = 'none';
      el.style.borderBottom = useFore && borderW > 0 ? `${borderW}px ${lineStyle} ${borderColor}` : 'none';
      return;
    }
    if (borderMode === 'tableHeader') {
      el.style.border = useFore && borderW > 0 ? `${borderW}px ${lineStyle} ${borderColor}` : 'none';
      el.style.borderBottom = useFore && borderW > 0 ? `${borderW}px ${lineStyle} ${borderColor}` : 'none';
      return;
    }
    if (borderMode === 'tableFrame') {
      el.style.backgroundColor = 'transparent';
      el.style.border = useFore && borderW > 0 ? `${borderW}px ${lineStyle} ${borderColor}` : 'none';
      return;
    }
    if (!useFore || borderW <= 0 || comp.lineStyle === 'none') {
      el.style.border = 'none';
      return;
    }
    el.style.border = `${borderW}px ${lineStyle} ${borderColor}`;
  },

  ellipticalArcPoint(cx, cy, rx, ry, deg) {
    const r = (Number(deg) * Math.PI) / 180;
    return { x: cx + rx * Math.cos(r), y: cy - ry * Math.sin(r) };
  },

  arcPathData(cx, cy, rx, ry, startAngle, sweepAngle, pie = false) {
    const start = ComponentRegistry.ellipticalArcPoint(cx, cy, rx, ry, startAngle);
    const end = ComponentRegistry.ellipticalArcPoint(cx, cy, rx, ry, startAngle + sweepAngle);
    const large = Math.abs(sweepAngle) > 180 ? 1 : 0;
    const sweepFlag = sweepAngle >= 0 ? 0 : 1;
    const arc = `A ${rx} ${ry} 0 ${large} ${sweepFlag} ${end.x} ${end.y}`;
    if (pie) return `M ${cx} ${cy} L ${start.x} ${start.y} ${arc} Z`;
    return `M ${start.x} ${start.y} ${arc}`;
  },

  applyArcAppearance(el, comp) {
    if (comp.visible === false) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    ComponentRegistry.applyGraphicsObject(el, comp);
    const sweep = Number(comp.sweepAngle);
    const startAngle = Number(comp.startAngle) || 0;
    const isWedge = comp.type === 'Wedge' || el.classList.contains('ft-wedge');
    const isPartial = (comp.type === 'Arc' || isWedge || el.classList.contains('ft-arc'))
      && Number.isFinite(sweep)
      && Math.abs(sweep) < 359.5;
    el.style.borderRadius = isPartial ? '0' : '50%';
    el.style.border = 'none';
    el.style.boxSizing = 'border-box';
    el.style.overflow = 'hidden';
    if (!isPartial) {
      ComponentRegistry.applyShapeFill(el, comp);
      ComponentRegistry.applyShapePattern(el, comp);
    } else {
      el.style.background = 'none';
      el.style.backgroundColor = 'transparent';
    }

    el.querySelector('svg')?.remove();

    const w = comp.width || 100;
    const h = comp.height || 100;
    const lineW = comp.lineWidth ?? 1;
    const lineStyle = comp.lineStyle || 'solid';
    const useFore = comp.useForeColor !== false && lineStyle !== 'none';
    const useBack = comp.useBackColor !== false && comp.backStyle !== 'transparent';
    const usePattern = Boolean(comp.patternStyle && comp.patternStyle !== 'none' && comp.usePatternColor !== false);
    const needsSvg = (useFore && lineW > 0) || (isPartial && useBack) || (isPartial && usePattern);
    if (!needsSvg) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;left:0;top:0;display:block;pointer-events:none';
    const cx = w / 2;
    const cy = h / 2;
    const rx = Math.max(0, w / 2 - lineW / 2);
    const ry = Math.max(0, h / 2 - lineW / 2);

    if (isPartial && useBack && Math.abs(sweep) > 0.01) {
      if (comp.backStyle === 'gradient') {
        const gradId = `arc-grad-${(comp.name || 'shape').replace(/[^A-Za-z0-9_-]/g, '')}`;
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', gradId);
        const shading = comp.gradientShadingStyle || comp.gradientDirection || '';
        if (shading === 'gradientHorizontalFromRight') {
          grad.setAttribute('x1', '100%'); grad.setAttribute('y1', '0%');
          grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '0%');
        } else if (shading === 'gradientHorizontalFromLeft') {
          grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
          grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
        } else {
          grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
          grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
        }
        const s0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s0.setAttribute('offset', '0%');
        s0.setAttribute('stop-color', comp.backColor || '#c0c0c0');
        const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s1.setAttribute('offset', `${comp.gradientStop ?? 95}%`);
        s1.setAttribute('stop-color', comp.endColor || '#e8e8e8');
        grad.appendChild(s0);
        grad.appendChild(s1);
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.appendChild(grad);
        svg.appendChild(defs);
        const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fillPath.setAttribute('d', ComponentRegistry.arcPathData(cx, cy, w / 2, h / 2, startAngle, sweep, true));
        fillPath.setAttribute('fill', `url(#${gradId})`);
        fillPath.setAttribute('stroke', 'none');
        svg.appendChild(fillPath);
      } else {
        const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        fillPath.setAttribute('d', ComponentRegistry.arcPathData(cx, cy, w / 2, h / 2, startAngle, sweep, true));
        fillPath.setAttribute('fill', comp.backColor || '#c0c0c0');
        fillPath.setAttribute('stroke', 'none');
        svg.appendChild(fillPath);
      }
    }

    if (useFore && lineW > 0) {
      if (isPartial && Math.abs(sweep) > 0.01) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', ComponentRegistry.arcPathData(cx, cy, rx, ry, startAngle, sweep, isWedge));
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', comp.foreColor || '#000000');
        path.setAttribute('stroke-width', String(lineW));
        path.setAttribute('stroke-linecap', 'round');
        const dash = ComponentRegistry.lineStyleToDashArray(lineStyle, lineW);
        if (dash) path.setAttribute('stroke-dasharray', dash);
        svg.appendChild(path);
      } else if (!isPartial) {
        const ell = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ell.setAttribute('cx', String(cx));
        ell.setAttribute('cy', String(cy));
        ell.setAttribute('rx', String(rx));
        ell.setAttribute('ry', String(ry));
        ell.setAttribute('fill', 'none');
        ell.setAttribute('stroke', comp.foreColor || '#000000');
        ell.setAttribute('stroke-width', String(lineW));
        const dash = ComponentRegistry.lineStyleToDashArray(lineStyle, lineW);
        if (dash) ell.setAttribute('stroke-dasharray', dash);
        svg.appendChild(ell);
      }
    }
    el.appendChild(svg);

    if (isPartial && usePattern && Number.isFinite(sweep) && Math.abs(sweep) > 0.01) {
      const d = ComponentRegistry.arcPathData(cx, cy, w / 2, h / 2, startAngle, sweep, true);
      const overlay = document.createElement('div');
      overlay.className = 'ft-arc-pattern';
      overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;background:none;background-color:transparent;'
        + `clip-path:path('${d}');-webkit-clip-path:path('${d}')`;
      ComponentRegistry.applyShapePattern(overlay, { ...comp, usePatternColor: true });
      el.appendChild(overlay);
    }
  },

  Arc(comp) {
    const el = document.createElement('div');
    el.className = 'ft-arc ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyArcAppearance(el, comp);
    return el;
  },

  freehandPathData(points, close = false) {
    if (!points?.length) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      + (close && points.length > 2 ? ' Z' : '');
  },

  freehandShouldClosePath(comp) {
    if (comp.type === 'Polygon') return true;
    const useBack = comp.useBackColor !== false;
    return useBack && (comp.backStyle === 'solid' || comp.backStyle === 'gradient');
  },

  freehandFillColor(comp) {
    const useBack = comp.useBackColor !== false;
    if (comp.backStyle === 'transparent' || !useBack) return 'none';
    if (comp.backStyle === 'gradient') return `url(#fh-grad-${comp.name || 'shape'})`;
    return comp.backColor || '#808080';
  },

  applyFreehandAppearance(el, comp) {
    if (comp.visible === false) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    ComponentRegistry.applyGraphicsObject(el, comp);
    el.style.border = 'none';
    el.style.background = 'none';
    el.style.boxSizing = 'border-box';
    el.style.overflow = 'visible';

    el.querySelector('svg')?.remove();

    const w = comp.width || 100;
    const h = comp.height || 100;
    const points = comp.points || [];
    if (points.length < 2) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;left:0;top:0;display:block;pointer-events:none;overflow:visible';

    const gradId = `fh-grad-${String(comp.name || 'shape').replace(/[^A-Za-z0-9_-]/g, '')}`;
    if (comp.backStyle === 'gradient' && comp.useBackColor !== false) {
      const start = comp.backColor || '#808080';
      const end = comp.endColor || '#e8e8e8';
      const stop = comp.gradientStop ?? 95;
      const shading = comp.gradientShadingStyle || comp.gradientDirection || '';
      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', gradId);
      if (shading === 'gradientHorizontalFromRight') {
        grad.setAttribute('x1', '100%'); grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '0%');
      } else if (shading === 'gradientHorizontalFromLeft') {
        grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
      } else {
        grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
      }
      const s0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s0.setAttribute('offset', '0%');
      s0.setAttribute('stop-color', start);
      const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s1.setAttribute('offset', `${stop}%`);
      s1.setAttribute('stop-color', end);
      grad.appendChild(s0);
      grad.appendChild(s1);
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.appendChild(grad);
      svg.appendChild(defs);
    }

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ComponentRegistry.freehandPathData(points, ComponentRegistry.freehandShouldClosePath(comp)));
    path.setAttribute('fill', ComponentRegistry.freehandFillColor(comp));
    path.setAttribute('fill-rule', 'evenodd');

    const lineW = comp.lineWidth ?? 1;
    const lineStyle = comp.lineStyle || 'solid';
    const useFore = comp.useForeColor !== false && lineStyle !== 'none';
    if (useFore && lineW > 0) {
      path.setAttribute('stroke', comp.foreColor || '#000000');
      path.setAttribute('stroke-width', String(lineW));
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('stroke-linecap', 'round');
      const dash = ComponentRegistry.lineStyleToDashArray(lineStyle, lineW);
      if (dash) path.setAttribute('stroke-dasharray', dash);
    } else {
      path.setAttribute('stroke', 'none');
    }

    svg.appendChild(path);
    el.appendChild(svg);

    const usePattern = Boolean(comp.patternStyle && comp.patternStyle !== 'none');
    if (usePattern && points.length >= 2) {
      const clip = `polygon(${points.map((p) => `${Number(p.x) || 0}px ${Number(p.y) || 0}px`).join(',')})`;
      const overlay = document.createElement('div');
      overlay.className = 'ft-freehand-pattern';
      overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;background:none;background-color:transparent;'
        + `-webkit-clip-path:${clip};clip-path:${clip}`;
      ComponentRegistry.applyShapePattern(overlay, { ...comp, usePatternColor: true });
      el.appendChild(overlay);
    }
  },

  Freehand(comp) {
    const el = document.createElement('div');
    el.className = 'ft-freehand ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyFreehandAppearance(el, comp);
    return el;
  },

  applyLineAppearance(el, comp) {
    if (comp.visible === false) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    ComponentRegistry.applyGraphicsObject(el, comp);
    el.style.border = 'none';
    el.style.boxSizing = 'border-box';
    el.style.overflow = 'visible';
    el.style.position = 'absolute';

    const useBack = comp.useBackColor !== false && comp.backStyle === 'solid';
    if (useBack) {
      el.style.backgroundColor = comp.backColor || '#c0c0c0';
      el.style.background = '';
    } else {
      el.style.backgroundColor = 'transparent';
      el.style.background = 'none';
    }

    el.querySelector('svg')?.remove();

    const w = Math.max(1, Number(comp.width) || 1);
    const h = Math.max(1, Number(comp.height) || 1);
    const x1 = Number.isFinite(Number(comp.x1)) ? Number(comp.x1) : 0;
    const y1 = Number.isFinite(Number(comp.y1)) ? Number(comp.y1) : 0;
    const x2 = Number.isFinite(Number(comp.x2)) ? Number(comp.x2) : w;
    const y2 = Number.isFinite(Number(comp.y2)) ? Number(comp.y2) : h;

    const lineW = comp.lineWidth ?? 1;
    const lineStyle = comp.lineStyle || 'solid';
    const useFore = comp.useForeColor !== false && lineStyle !== 'none' && lineW > 0;
    if (!useFore) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;left:0;top:0;display:block;pointer-events:none;overflow:visible';

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', comp.foreColor || '#808080');
    line.setAttribute('stroke-width', String(lineW));
    line.setAttribute('stroke-linecap', 'round');
    const dash = ComponentRegistry.lineStyleToDashArray(lineStyle, lineW);
    if (dash) line.setAttribute('stroke-dasharray', dash);
    svg.appendChild(line);
    el.appendChild(svg);
  },

  Line(comp) {
    const el = document.createElement('div');
    el.className = 'ft-line ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyLineAppearance(el, comp);
    return el;
  },

  applyPolygonAppearance(el, comp) {
    if (comp.visible === false) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    ComponentRegistry.applyGraphicsObject(el, comp);
    el.style.border = 'none';
    el.style.background = 'none';
    el.style.backgroundColor = 'transparent';
    el.style.boxSizing = 'border-box';
    el.style.overflow = 'visible';
    el.style.position = 'absolute';

    el.querySelectorAll('svg, .ft-polygon-fill, .ft-polygon-pattern').forEach((node) => node.remove());

    const w = Math.max(1, Number(comp.width) || 1);
    const h = Math.max(1, Number(comp.height) || 1);
    const points = comp.points || [];
    if (points.length < 2) return;

    const closeStroke = comp.type !== 'Polyline';
    const fillPathD = ComponentRegistry.freehandPathData(points, true);
    const strokePathD = ComponentRegistry.freehandPathData(points, closeStroke);
    const useBack = comp.useBackColor !== false && (comp.backStyle === 'solid' || comp.backStyle === 'gradient');
    const usePattern = Boolean(comp.patternStyle && comp.patternStyle !== 'none');
    const lineW = comp.lineWidth ?? 1;
    const lineStyle = comp.lineStyle || 'solid';
    const useFore = comp.useForeColor !== false && lineStyle !== 'none' && lineW > 0;

    const makeSvg = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = 'position:absolute;left:0;top:0;display:block;pointer-events:none;overflow:visible';
      return svg;
    };

    if (useBack) {
      const fillSvg = makeSvg();
      let fill = comp.backColor || '#c0c0c0';
      if (comp.backStyle === 'gradient') {
        const safeName = String(comp.name || 'shape').replace(/[^A-Za-z0-9_-]/g, '');
        const gradId = `${comp.type === 'Polyline' ? 'pl' : 'pg'}-grad-${safeName}`;
        const start = comp.backColor || '#c0c0c0';
        const end = comp.endColor || '#e8e8e8';
        const stop = comp.gradientStop ?? 95;
        const shading = comp.gradientShadingStyle || comp.gradientDirection || '';
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.setAttribute('id', gradId);
        if (shading === 'gradientHorizontalFromRight') {
          grad.setAttribute('x1', '100%'); grad.setAttribute('y1', '0%');
          grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '0%');
        } else if (shading === 'gradientHorizontalFromLeft') {
          grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
          grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
        } else {
          grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
          grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
        }
        const s0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s0.setAttribute('offset', '0%');
        s0.setAttribute('stop-color', start);
        const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s1.setAttribute('offset', `${stop}%`);
        s1.setAttribute('stop-color', end);
        grad.appendChild(s0);
        grad.appendChild(s1);
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.appendChild(grad);
        fillSvg.appendChild(defs);
        fill = `url(#${gradId})`;
      }
      const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      fillPath.setAttribute('d', fillPathD);
      fillPath.setAttribute('fill', fill);
      fillPath.setAttribute('fill-rule', 'evenodd');
      fillPath.setAttribute('stroke', 'none');
      fillSvg.appendChild(fillPath);
      el.appendChild(fillSvg);
    }

    if (usePattern) {
      const clip = `polygon(${points.map((p) => `${Number(p.x) || 0}px ${Number(p.y) || 0}px`).join(',')})`;
      const overlay = document.createElement('div');
      overlay.className = 'ft-polygon-pattern';
      overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;background:none;background-color:transparent;'
        + `-webkit-clip-path:${clip};clip-path:${clip}`;
      ComponentRegistry.applyShapePattern(overlay, { ...comp, usePatternColor: true });
      el.appendChild(overlay);
    }

    if (!useFore) return;

    const strokeSvg = makeSvg();
    const strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    strokePath.setAttribute('d', strokePathD);
    strokePath.setAttribute('fill', 'none');
    strokePath.setAttribute('stroke', comp.foreColor || '#000000');
    strokePath.setAttribute('stroke-width', String(lineW));
    strokePath.setAttribute('stroke-linejoin', 'miter');
    strokePath.setAttribute('stroke-linecap', closeStroke ? 'butt' : 'round');
    const dash = ComponentRegistry.lineStyleToDashArray(lineStyle, lineW);
    if (dash) strokePath.setAttribute('stroke-dasharray', dash);
    strokeSvg.appendChild(strokePath);
    el.appendChild(strokeSvg);
  },

  Polygon(comp) {
    const el = document.createElement('div');
    el.className = 'ft-polygon ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyPolygonAppearance(el, comp);
    return el;
  },

  Polyline(comp) {
    const el = document.createElement('div');
    el.className = 'ft-polyline ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyPolygonAppearance(el, comp);
    return el;
  },

  Rectangle(comp) {
    const el = document.createElement('div');
    el.className = 'ft-rectangle ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    if (comp.name?.startsWith('SafetyRung') || comp.name?.startsWith('SafetyRail') || comp.name?.startsWith('SafetyBusLine')) {
      el.classList.add('ft-ladder-wire');
    } else if (comp.name?.includes('BarL') || comp.name?.includes('BarR') || comp.name?.startsWith('SafetyBusDrop') || comp.name?.startsWith('SafetyBusRise')) {
      el.classList.add('ft-ladder-bar');
    }
    const borderMode = comp.borderMode;
    ComponentRegistry.applyShapeFill(el, comp);
    ComponentRegistry.applyShapePattern(el, comp);
    ComponentRegistry.applyShapeBorder(el, comp, { borderMode });
    el.style.boxSizing = 'border-box';
    return el;
  },

  roundedRectCornerRadius(comp) {
    const w = Math.max(1, Number(comp.width) || 1);
    const h = Math.max(1, Number(comp.height) || 1);
    if (comp.cornerRadius != null && Number.isFinite(Number(comp.cornerRadius))) {
      return Math.max(0, Number(comp.cornerRadius));
    }
    return Math.round(Math.min(w, h) * 0.28);
  },

  applyRoundedRectangleAppearance(el, comp) {
    if (comp.visible === false) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    ComponentRegistry.applyGraphicsObject(el, comp);
    ComponentRegistry.applyShapeFill(el, comp);
    ComponentRegistry.applyShapePattern(el, comp);
    ComponentRegistry.applyShapeBorder(el, comp, { borderMode: comp.borderMode });
    el.style.borderRadius = `${ComponentRegistry.roundedRectCornerRadius(comp)}px`;
    el.style.overflow = 'hidden';
    el.style.boxSizing = 'border-box';
  },

  RoundedRectangle(comp) {
    const el = document.createElement('div');
    el.className = 'ft-rounded-rectangle ft-rectangle ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyRoundedRectangleAppearance(el, comp);
    return el;
  },

  Ellipse(comp) {
    const el = document.createElement('div');
    el.className = 'ft-ellipse ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyArcAppearance(el, comp);
    return el;
  },

  Wedge(comp) {
    const el = document.createElement('div');
    el.className = 'ft-wedge ft-ellipse ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyArcAppearance(el, comp);
    return el;
  },

  SafetyLadderDiagram(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-safety-ladder ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);

    const applyIndicator = (indicator, val, fallback = 0) => {
      const on = val === true || val === 1 || val === '1';
      const useOn = val === undefined ? Boolean(fallback) : on;
      indicator.classList.toggle('ft-safety-ladder__indicator--green', useOn);
      indicator.classList.toggle('ft-safety-ladder__indicator--red', !useOn);
    };

    const bindIndicator = (indicator, contact) => {
      if (contact.tag) {
        ctx.bindTag(contact.tag, (val) => applyIndicator(indicator, val, contact.defaultValue));
        applyIndicator(indicator, ctx.getTagValue(contact.tag), contact.defaultValue);
      } else {
        applyIndicator(indicator, contact.defaultValue, contact.defaultValue);
      }
    };

    const createContact = (contact) => {
      const cell = document.createElement('div');
      cell.className = 'ft-safety-ladder__cell';

      const label = document.createElement('div');
      label.className = 'ft-safety-ladder__label';
      label.textContent = (contact.label || '').replace(/\\n/g, '\n');

      const symbol = document.createElement('div');
      symbol.className = 'ft-safety-ladder__symbol';
      const barL = document.createElement('span');
      barL.className = 'ft-safety-ladder__bar';
      const indicator = document.createElement('span');
      indicator.className = 'ft-safety-ladder__indicator';
      const barR = document.createElement('span');
      barR.className = 'ft-safety-ladder__bar';
      bindIndicator(indicator, contact);
      symbol.append(barL, indicator, barR);

      cell.append(label, symbol);
      return cell;
    };

    const createCoil = (coil) => {
      const cell = document.createElement('div');
      cell.className = 'ft-safety-ladder__cell ft-safety-ladder__cell--coil';

      const label = document.createElement('div');
      label.className = 'ft-safety-ladder__label';
      label.textContent = (coil.label || '').replace(/\\n/g, '\n');

      const symbol = document.createElement('div');
      symbol.className = 'ft-safety-ladder__coil';
      const parenL = document.createElement('span');
      parenL.className = 'ft-safety-ladder__coil-paren';
      parenL.textContent = '(';
      const indicator = document.createElement('span');
      indicator.className = 'ft-safety-ladder__indicator';
      const parenR = document.createElement('span');
      parenR.className = 'ft-safety-ladder__coil-paren';
      parenR.textContent = ')';
      bindIndicator(indicator, coil);
      symbol.append(parenL, indicator, parenR);

      cell.append(label, symbol);
      return cell;
    };

    const body = document.createElement('div');
    body.className = 'ft-safety-ladder__body';

    const rail = document.createElement('div');
    rail.className = 'ft-safety-ladder__rail';
    rail.setAttribute('aria-hidden', 'true');
    body.appendChild(rail);

    const rungs = document.createElement('div');
    rungs.className = 'ft-safety-ladder__rungs';

    const rowCount = (comp.rows || []).length;
    (comp.rows || []).forEach((row, rowIndex) => {
      const rung = document.createElement('div');
      rung.className = 'ft-safety-ladder__rung';
      const isFirst = rowIndex === 0;
      const isLast = rowIndex === rowCount - 1;
      if (isFirst) rung.classList.add('ft-safety-ladder__rung--first');
      if (isLast) rung.classList.add('ft-safety-ladder__rung--last');
      if (!isLast) rung.classList.add('ft-safety-ladder__rung--bus-end');

      const rungLine = document.createElement('div');
      rungLine.className = 'ft-safety-ladder__rung-line';
      rungLine.setAttribute('aria-hidden', 'true');
      rung.appendChild(rungLine);

      const slotCount = comp.columns ?? 6;
      for (let col = 0; col < slotCount; col++) {
        const contact = row[col];
        if (contact) {
          rung.appendChild(createContact(contact));
        } else {
          const wire = document.createElement('div');
          wire.className = 'ft-safety-ladder__cell ft-safety-ladder__cell--wire';
          rung.appendChild(wire);
        }
      }

      if (isLast && comp.coil) {
        rung.appendChild(createCoil(comp.coil));
      } else {
        const tail = document.createElement('div');
        tail.className = 'ft-safety-ladder__cell ft-safety-ladder__cell--wire';
        rung.appendChild(tail);
      }

      rungs.appendChild(rung);

      if (!isLast) {
        const bus = document.createElement('div');
        bus.className = 'ft-safety-ladder__serpentine-bus';
        bus.setAttribute('aria-hidden', 'true');
        bus.innerHTML = [
          '<span class="ft-safety-ladder__serpentine-drop"></span>',
          '<span class="ft-safety-ladder__serpentine-line"></span>',
          '<span class="ft-safety-ladder__serpentine-rise"></span>'
        ].join('');
        rungs.appendChild(bus);
      }
    });

    body.appendChild(rungs);
    el.appendChild(body);
    return el;
  },

  GotoButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      navSideAccent: comp.navSideAccent,
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const resolveTarget = () => {
      if (comp.useVariableDisplay && comp.displayNameTag) {
        const val = ComponentRegistry.readIndicatorRef(comp.displayNameTag, ctx);
        return val != null && val !== '' ? String(val) : '';
      }
      return comp.target || '';
    };

    const navigateToTarget = () => {
      const target = resolveTarget();
      if (!target) return;
      const navOpts = {};
      const pf = String(comp.parameterFile || '').trim();
      if (pf && (
        typeof ParameterFiles === 'undefined'
          ? true
          : ParameterFiles.usesParameterFile(comp)
      )) {
        navOpts.parameterFile = pf;
      }
      ctx.navigate(target, navOpts);
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'GotoButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'GotoButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      if (comp.useVariableDisplay && comp.displayNameTag) {
        ComponentRegistry.bindIndicatorRef(comp.displayNameTag, () => {}, ctx);
      }
      if (comp.target || comp.useVariableDisplay) {
        btn.addEventListener('click', navigateToTarget);
      }
    }
    return btn;
  },

  ReturnToButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-return-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'ReturnToButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'ReturnToButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', () => {
        if (typeof ctx.navigateBack === 'function') ctx.navigateBack();
      });
    }
    return btn;
  },

  RecipePlusButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.action) btn.dataset.action = comp.action;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const runRecipeAction = () => {
      if (typeof ctx.runRecipePlusAction === 'function') {
        ctx.runRecipePlusAction(comp.action || 'download', comp);
        return;
      }
      ctx.navigate?.('500_Recipe');
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'RecipePlusButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'RecipePlusButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', runRecipeAction);
    }
    return btn;
  },

  AddUserGroupButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const openAddUserDialog = async () => {
      const dlg = ComponentRegistry.ensureRuntimeAddUserDialog();
      const status = dlg.querySelector('#runtimeAddUserStatus');
      const nameEl = dlg.querySelector('#runtimeAddUserName');
      const passEl = dlg.querySelector('#runtimeAddUserPassword');
      const confirmEl = dlg.querySelector('#runtimeAddUserConfirm');
      const groupsEl = dlg.querySelector('#runtimeAddUserGroups');
      const submitBtn = dlg.querySelector('#runtimeAddUserSubmit');
      nameEl.value = '';
      passEl.value = '';
      confirmEl.value = '';
      groupsEl.innerHTML = 'Loading groups…';
      status.textContent = '';
      status.className = 'runtime-comm-status';
      submitBtn.disabled = false;
      try {
        dlg.showModal();
      } catch (err) {
        dlg.setAttribute('open', '');
      }
      nameEl.focus();
      try {
        const res = await ctx.listGroups();
        const groups = res?.groups || [];
        const lowest = [...groups].sort((a, b) => a.level - b.level)[0];
        ComponentRegistry.renderGroupChecklist(groupsEl, groups, lowest ? [lowest.id] : []);
      } catch (err) {
        groupsEl.innerHTML = `<p class="dialog-hint">Could not load groups: ${err.message}</p>`;
      }
      submitBtn.onclick = async () => {
        const username = nameEl.value.trim();
        const password = passEl.value;
        const confirmPassword = confirmEl.value;
        const groups = ComponentRegistry.readGroupChecklist(groupsEl);
        if (!username) {
          status.textContent = 'Username is required';
          status.className = 'runtime-comm-status error';
          nameEl.focus();
          return;
        }
        if (!password) {
          status.textContent = 'Password is required';
          status.className = 'runtime-comm-status error';
          passEl.focus();
          return;
        }
        if (password !== confirmPassword) {
          status.textContent = 'Passwords do not match';
          status.className = 'runtime-comm-status error';
          confirmEl.focus();
          return;
        }
        if (!groups.length) {
          status.textContent = 'Select at least one group';
          status.className = 'runtime-comm-status error';
          return;
        }
        submitBtn.disabled = true;
        status.textContent = 'Adding user...';
        status.className = 'runtime-comm-status';
        try {
          const result = await ctx.addUserGroup({ username, password, groups });
          if (result?.success) {
            status.textContent = `User "${username}" added (${result.user?.role || 'group assigned'}).`;
            status.className = 'runtime-comm-status ok';
            setTimeout(() => {
              try { dlg.close(); } catch (_) { /* ignore */ }
            }, 900);
          } else {
            status.textContent = result?.error || 'Could not add user';
            status.className = 'runtime-comm-status error';
            submitBtn.disabled = false;
          }
        } catch (err) {
          status.textContent = err.message || 'Could not add user';
          status.className = 'runtime-comm-status error';
          submitBtn.disabled = false;
        }
      };
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'AddUserGroupButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'AddUserGroupButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', openAddUserDialog);
    }
    return btn;
  },

  DeleteUserGroupButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const openDeleteUserDialog = () => {
      const dlg = ComponentRegistry.ensureRuntimeDeleteUserDialog();
      const status = dlg.querySelector('#runtimeDeleteUserStatus');
      const nameEl = dlg.querySelector('#runtimeDeleteUserName');
      const submitBtn = dlg.querySelector('#runtimeDeleteUserSubmit');
      nameEl.value = '';
      status.textContent = '';
      status.className = 'runtime-comm-status';
      submitBtn.disabled = false;
      submitBtn.onclick = async () => {
        const username = nameEl.value.trim();
        if (!username) {
          status.textContent = 'Username is required';
          status.className = 'runtime-comm-status error';
          nameEl.focus();
          return;
        }
        submitBtn.disabled = true;
        status.textContent = 'Checking username...';
        status.className = 'runtime-comm-status';
        try {
          const result = await ctx.deleteUserGroup({ username });
          if (result?.success) {
            status.textContent = `User "${username}" deleted.`;
            status.className = 'runtime-comm-status ok';
            setTimeout(() => {
              try { dlg.close(); } catch (_) { /* ignore */ }
            }, 900);
          } else {
            // "except check the name" — surface the not-found/validation error clearly and
            // leave the dialog open so the operator can correct the username and retry.
            status.textContent = result?.error || `No user found with the username "${username}"`;
            status.className = 'runtime-comm-status error';
            submitBtn.disabled = false;
            nameEl.focus();
            nameEl.select();
          }
        } catch (err) {
          status.textContent = err.message || 'Could not delete user';
          status.className = 'runtime-comm-status error';
          submitBtn.disabled = false;
        }
      };
      try {
        dlg.showModal();
      } catch (err) {
        dlg.setAttribute('open', '');
      }
      nameEl.focus();
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'DeleteUserGroupButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'DeleteUserGroupButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', openDeleteUserDialog);
    }
    return btn;
  },

ModifyGroupMembershipButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const openRuntimeDialog = async () => {
      const dlg = ComponentRegistry.ensureModifyGroupDialog();
      const status = dlg.querySelector('#runtimeModifyGroupStatus');
      const nameEl = dlg.querySelector('#runtimeModifyGroupName');
      const groupsEl = dlg.querySelector('#runtimeModifyGroupGroups');
      const submitBtn = dlg.querySelector('#runtimeModifyGroupSubmit');
      nameEl.value = '';
      groupsEl.innerHTML = 'Loading groups…';
      status.textContent = '';
      status.className = 'runtime-comm-status';
      submitBtn.disabled = false;
      try {
        dlg.showModal();
      } catch (err) {
        dlg.setAttribute('open', '');
      }
      nameEl.focus();
      let loadedGroups = [];
      try {
        const res = await ctx.listGroups();
        loadedGroups = res?.groups || [];
        const lowest = [...loadedGroups].sort((a, b) => a.level - b.level)[0];
        ComponentRegistry.renderGroupChecklist(groupsEl, loadedGroups, lowest ? [lowest.id] : []);
      } catch (err) {
        groupsEl.innerHTML = `<p class="dialog-hint">Could not load groups: ${err.message}</p>`;
      }
      // Re-check the boxes to match the TARGET user's actual current groups as soon as a real
      // username is entered — this is a full-replace action (whatever's checked at submit time
      // becomes the user's entire group list), so without this the checklist would keep
      // whatever default it opened with and submitting could silently strip groups the admin
      // never meant to remove, just because they didn't happen to re-check them.
      nameEl.onblur = async () => {
        const username = nameEl.value.trim();
        if (!username || !loadedGroups.length) return;
        try {
          const lookup = await ctx.findUser({ username });
          if (lookup?.success && lookup.user) {
            ComponentRegistry.renderGroupChecklist(groupsEl, loadedGroups, lookup.user.groups || []);
          }
        } catch (_) { /* leave the checklist as-is; submit-time still validates the username */ }
      };
      submitBtn.onclick = async () => {
        const username = nameEl.value.trim();
        const groups = ComponentRegistry.readGroupChecklist(groupsEl);
        if (!username) {
          status.textContent = 'Username is required';
          status.className = 'runtime-comm-status error';
          nameEl.focus();
          return;
        }
        if (!groups.length) {
          status.textContent = 'Select at least one group';
          status.className = 'runtime-comm-status error';
          return;
        }
        submitBtn.disabled = true;
        status.textContent = 'Checking username...';
        status.className = 'runtime-comm-status';
        try {
          const result = await ctx.modifyGroupMembership({ username, groups });
          if (result?.success) {
            status.textContent = `User "${username}" moved to ${result.user?.role || 'the selected group(s)'}.`;
            status.className = 'runtime-comm-status ok';
            setTimeout(() => {
              try { dlg.close(); } catch (_) { /* ignore */ }
            }, 900);
          } else {
            status.textContent = result?.error || `No user found with the username "${username}"`;
            status.className = 'runtime-comm-status error';
            submitBtn.disabled = false;
            nameEl.focus();
            nameEl.select();
          }
        } catch (err) {
          status.textContent = err.message || 'Could not complete the request';
          status.className = 'runtime-comm-status error';
          submitBtn.disabled = false;
        }
      };
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'ModifyGroupMembershipButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'ModifyGroupMembershipButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', openRuntimeDialog);
    }
    return btn;
  },

  UnlockUserButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const openRuntimeDialog = () => {
      const dlg = ComponentRegistry.ensureUnlockUserDialog();
      const status = dlg.querySelector('#runtimeUnlockUserStatus');
      const nameEl = dlg.querySelector('#runtimeUnlockUserName');
      const submitBtn = dlg.querySelector('#runtimeUnlockUserSubmit');
      nameEl.value = '';
      status.textContent = '';
      status.className = 'runtime-comm-status';
      submitBtn.disabled = false;
      submitBtn.onclick = async () => {
        const username = nameEl.value.trim();
        if (!username) {
          status.textContent = 'Username is required';
          status.className = 'runtime-comm-status error';
          nameEl.focus();
          return;
        }
        submitBtn.disabled = true;
        status.textContent = 'Checking username...';
        status.className = 'runtime-comm-status';
        try {
          const result = await ctx.unlockUser({ username: username });
          if (result?.success) {
            status.textContent = `User "${username}" unlocked.`;
            status.className = 'runtime-comm-status ok';
            setTimeout(() => {
              try { dlg.close(); } catch (_) { /* ignore */ }
            }, 900);
          } else {
            status.textContent = result?.error || `No user found with the username "${username}"`;
            status.className = 'runtime-comm-status error';
            submitBtn.disabled = false;
            nameEl.focus();
            nameEl.select();
          }
        } catch (err) {
          status.textContent = err.message || 'Could not complete the request';
          status.className = 'runtime-comm-status error';
          submitBtn.disabled = false;
        }
      };
      try {
        dlg.showModal();
      } catch (err) {
        dlg.setAttribute('open', '');
      }
      nameEl.focus();
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'UnlockUserButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'UnlockUserButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', openRuntimeDialog);
    }
    return btn;
  },

  EnableUserButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const openRuntimeDialog = () => {
      const dlg = ComponentRegistry.ensureEnableUserDialog();
      const status = dlg.querySelector('#runtimeEnableUserStatus');
      const nameEl = dlg.querySelector('#runtimeEnableUserName');
      const submitBtn = dlg.querySelector('#runtimeEnableUserSubmit');
      nameEl.value = '';
      status.textContent = '';
      status.className = 'runtime-comm-status';
      submitBtn.disabled = false;
      submitBtn.onclick = async () => {
        const username = nameEl.value.trim();
        if (!username) {
          status.textContent = 'Username is required';
          status.className = 'runtime-comm-status error';
          nameEl.focus();
          return;
        }
        submitBtn.disabled = true;
        status.textContent = 'Checking username...';
        status.className = 'runtime-comm-status';
        try {
          const result = await ctx.enableUser({ username: username });
          if (result?.success) {
            status.textContent = `User "${username}" enabled.`;
            status.className = 'runtime-comm-status ok';
            setTimeout(() => {
              try { dlg.close(); } catch (_) { /* ignore */ }
            }, 900);
          } else {
            status.textContent = result?.error || `No user found with the username "${username}"`;
            status.className = 'runtime-comm-status error';
            submitBtn.disabled = false;
            nameEl.focus();
            nameEl.select();
          }
        } catch (err) {
          status.textContent = err.message || 'Could not complete the request';
          status.className = 'runtime-comm-status error';
          submitBtn.disabled = false;
        }
      };
      try {
        dlg.showModal();
      } catch (err) {
        dlg.setAttribute('open', '');
      }
      nameEl.focus();
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'EnableUserButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'EnableUserButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', openRuntimeDialog);
    }
    return btn;
  },

  DisableUserButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const openRuntimeDialog = () => {
      const dlg = ComponentRegistry.ensureDisableUserDialog();
      const status = dlg.querySelector('#runtimeDisableUserStatus');
      const nameEl = dlg.querySelector('#runtimeDisableUserName');
      const submitBtn = dlg.querySelector('#runtimeDisableUserSubmit');
      nameEl.value = '';
      status.textContent = '';
      status.className = 'runtime-comm-status';
      submitBtn.disabled = false;
      submitBtn.onclick = async () => {
        const username = nameEl.value.trim();
        if (!username) {
          status.textContent = 'Username is required';
          status.className = 'runtime-comm-status error';
          nameEl.focus();
          return;
        }
        submitBtn.disabled = true;
        status.textContent = 'Checking username...';
        status.className = 'runtime-comm-status';
        try {
          const result = await ctx.disableUser({ username: username });
          if (result?.success) {
            status.textContent = `User "${username}" disabled.`;
            status.className = 'runtime-comm-status ok';
            setTimeout(() => {
              try { dlg.close(); } catch (_) { /* ignore */ }
            }, 900);
          } else {
            status.textContent = result?.error || `No user found with the username "${username}"`;
            status.className = 'runtime-comm-status error';
            submitBtn.disabled = false;
            nameEl.focus();
            nameEl.select();
          }
        } catch (err) {
          status.textContent = err.message || 'Could not complete the request';
          status.className = 'runtime-comm-status error';
          submitBtn.disabled = false;
        }
      };
      try {
        dlg.showModal();
      } catch (err) {
        dlg.setAttribute('open', '');
      }
      nameEl.focus();
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'DisableUserButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'DisableUserButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', openRuntimeDialog);
    }
    return btn;
  },

  PasswordButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const openRuntimeDialog = () => {
      const dlg = ComponentRegistry.ensureChangePasswordDialog();
      const status = dlg.querySelector('#runtimeChangePasswordStatus');
      const nameEl = dlg.querySelector('#runtimeChangePasswordName');
      const passEl = dlg.querySelector('#runtimeChangePasswordPassword');
      const confirmEl = dlg.querySelector('#runtimeChangePasswordConfirm');
      const submitBtn = dlg.querySelector('#runtimeChangePasswordSubmit');
      nameEl.value = '';
      passEl.value = '';
      confirmEl.value = '';
      status.textContent = '';
      status.className = 'runtime-comm-status';
      submitBtn.disabled = false;
      submitBtn.onclick = async () => {
        const username = nameEl.value.trim();
        if (!username) {
          status.textContent = 'Username is required';
          status.className = 'runtime-comm-status error';
          nameEl.focus();
          return;
        }
        const password = passEl.value;
        const confirmPassword = confirmEl.value;
        if (!password) {
          status.textContent = 'New password is required';
          status.className = 'runtime-comm-status error';
          passEl.focus();
          return;
        }
        if (password !== confirmPassword) {
          status.textContent = 'Passwords do not match';
          status.className = 'runtime-comm-status error';
          confirmEl.focus();
          return;
        }
        submitBtn.disabled = true;
        status.textContent = 'Checking username...';
        status.className = 'runtime-comm-status';
        try {
          const result = await ctx.changeUserPassword({ username: username, password: password });
          if (result?.success) {
            status.textContent = `Password changed for "${username}".`;
            status.className = 'runtime-comm-status ok';
            setTimeout(() => {
              try { dlg.close(); } catch (_) { /* ignore */ }
            }, 900);
          } else {
            status.textContent = result?.error || `No user found with the username "${username}"`;
            status.className = 'runtime-comm-status error';
            submitBtn.disabled = false;
            nameEl.focus();
            nameEl.select();
          }
        } catch (err) {
          status.textContent = err.message || 'Could not complete the request';
          status.className = 'runtime-comm-status error';
          submitBtn.disabled = false;
        }
      };
      try {
        dlg.showModal();
      } catch (err) {
        dlg.setAttribute('open', '');
      }
      nameEl.focus();
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'PasswordButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'PasswordButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', openRuntimeDialog);
    }
    return btn;
  },

  ChangeUserPropertiesButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-recipeplus-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const openRuntimeDialog = async () => {
      const dlg = ComponentRegistry.ensureChangePropertiesDialog();
      const status = dlg.querySelector('#runtimeChangePropertiesStatus');
      const nameEl = dlg.querySelector('#runtimeChangePropertiesName');
      const groupsEl = dlg.querySelector('#runtimeChangePropertiesGroups');
      const enabledEl = dlg.querySelector('#runtimeChangePropertiesEnabled');
      const submitBtn = dlg.querySelector('#runtimeChangePropertiesSubmit');
      nameEl.value = '';
      groupsEl.innerHTML = 'Loading groups…';
      enabledEl.checked = true;
      status.textContent = '';
      status.className = 'runtime-comm-status';
      submitBtn.disabled = false;
      try {
        dlg.showModal();
      } catch (err) {
        dlg.setAttribute('open', '');
      }
      nameEl.focus();
      let loadedGroups = [];
      try {
        const res = await ctx.listGroups();
        loadedGroups = res?.groups || [];
        const lowest = [...loadedGroups].sort((a, b) => a.level - b.level)[0];
        ComponentRegistry.renderGroupChecklist(groupsEl, loadedGroups, lowest ? [lowest.id] : []);
      } catch (err) {
        groupsEl.innerHTML = `<p class="dialog-hint">Could not load groups: ${err.message}</p>`;
      }
      // Same reasoning as Modify Group Membership: this is a full-replace action for both the
      // group list AND the enabled flag, so pre-populate both from the TARGET user's real
      // current state once a real username is entered — otherwise submitting without touching
      // either field could silently strip real group memberships or re-enable a deliberately
      // disabled account, just because the dialog opened with generic defaults.
      nameEl.onblur = async () => {
        const username = nameEl.value.trim();
        if (!username || !loadedGroups.length) return;
        try {
          const lookup = await ctx.findUser({ username });
          if (lookup?.success && lookup.user) {
            ComponentRegistry.renderGroupChecklist(groupsEl, loadedGroups, lookup.user.groups || []);
            enabledEl.checked = lookup.user.enabled !== false;
          }
        } catch (_) { /* leave the form as-is; submit-time still validates the username */ }
      };
      submitBtn.onclick = async () => {
        const username = nameEl.value.trim();
        const groups = ComponentRegistry.readGroupChecklist(groupsEl);
        if (!username) {
          status.textContent = 'Username is required';
          status.className = 'runtime-comm-status error';
          nameEl.focus();
          return;
        }
        if (!groups.length) {
          status.textContent = 'Select at least one group';
          status.className = 'runtime-comm-status error';
          return;
        }
        submitBtn.disabled = true;
        status.textContent = 'Checking username...';
        status.className = 'runtime-comm-status';
        try {
          const result = await ctx.changeUserProperties({ username, groups, enabled: enabledEl.checked });
          if (result?.success) {
            status.textContent = `Properties updated for "${username}".`;
            status.className = 'runtime-comm-status ok';
            setTimeout(() => {
              try { dlg.close(); } catch (_) { /* ignore */ }
            }, 900);
          } else {
            status.textContent = result?.error || `No user found with the username "${username}"`;
            status.className = 'runtime-comm-status error';
            submitBtn.disabled = false;
            nameEl.focus();
            nameEl.select();
          }
        } catch (err) {
          status.textContent = err.message || 'Could not complete the request';
          status.className = 'runtime-comm-status error';
          submitBtn.disabled = false;
        }
      };
    };

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'ChangeUserPropertiesButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'ChangeUserPropertiesButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', openRuntimeDialog);
    }
    return btn;
  },

  RecipePlusSelector(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-recipeplus-selector ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const columns = comp.columns?.length
      ? comp.columns
      : ComponentRegistry.defaultRecipePlusColumns();
    const recipeCol = columns.find((c) => c.id === 'recipe') || columns[0];
    const unitCol = columns.find((c) => c.id === 'unit') || columns[1];

    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      useBorderColor: comp.useBorderColor !== false,
      borderColor: comp.borderColor || '#001C38',
      studioEdit
    });

    el.style.padding = '0';
    el.style.overflow = 'hidden';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.tabIndex = comp.keyNavigation === false ? -1 : 0;

    const fontBase = {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold,
      italic: comp.italic,
      underline: comp.underline
    };
    const wrap = comp.wordWrap !== false;
    const linesPerItem = Math.max(1, Math.min(10, Number(comp.linesPerItem) || 1));
    const recipeWidth = Math.max(20, Number(recipeCol?.width) || 150);
    const unitWidth = Math.max(20, Number(unitCol?.width) || 100);

    const applyColStyle = (node, kind) => {
      node.style.flex = kind === 'recipe' ? `1 1 ${recipeWidth}px` : `0 0 ${unitWidth}px`;
      node.style.minWidth = '0';
      node.style.textAlign = kind === 'unit' ? 'right' : 'left';
      node.style.overflow = 'hidden';
      node.style.whiteSpace = wrap && linesPerItem > 1 ? 'normal' : 'nowrap';
      node.style.textOverflow = 'ellipsis';
    };

    const paintText = (node, color) => {
      ComponentRegistry.applyCaptionStyle(node, {
        ...fontBase,
        foreColor: color,
        useForeColor: true,
        wordWrap: wrap,
        alignment: node.style.textAlign === 'right' ? 'middleRight' : 'middleLeft'
      });
    };

    if (comp.displayHeader !== false) {
      const headerEl = document.createElement('div');
      headerEl.className = 'ft-recipeplus-selector-header';
      headerEl.style.backgroundColor = comp.headerBackColor || '#001C38';
      const recipeHead = document.createElement('span');
      recipeHead.className = 'ft-recipeplus-selector-col recipe';
      recipeHead.textContent = recipeCol?.headerText || recipeCol?.label || 'Recipe';
      applyColStyle(recipeHead, 'recipe');
      paintText(recipeHead, comp.headerForeColor || '#ffffff');
      const unitHead = document.createElement('span');
      unitHead.className = 'ft-recipeplus-selector-col unit';
      unitHead.textContent = unitCol?.headerText || unitCol?.label || 'Unit';
      applyColStyle(unitHead, 'unit');
      paintText(unitHead, comp.headerForeColor || '#ffffff');
      headerEl.appendChild(recipeHead);
      headerEl.appendChild(unitHead);
      el.appendChild(headerEl);
    }

    const body = document.createElement('div');
    body.className = 'ft-recipeplus-selector-body';
    el.appendChild(body);

    const demoRows = ComponentRegistry.defaultRecipePlusSelectorRows();
    let selectedIndex = studioEdit ? 0 : (comp.selectedIndex ?? 0);

    const rowEls = demoRows.map((item, index) => {
      const row = document.createElement('div');
      row.className = 'ft-recipeplus-selector-row';
      row.dataset.index = String(index);
      row.style.flex = `${linesPerItem} 1 0`;
      const recipeCell = document.createElement('span');
      recipeCell.className = 'ft-recipeplus-selector-col recipe';
      recipeCell.textContent = typeof item === 'string' ? item : (item.recipe || '');
      applyColStyle(recipeCell, 'recipe');
      const unitCell = document.createElement('span');
      unitCell.className = 'ft-recipeplus-selector-col unit';
      unitCell.textContent = typeof item === 'string' ? '' : (item.unit || '');
      applyColStyle(unitCell, 'unit');
      row.appendChild(recipeCell);
      row.appendChild(unitCell);
      body.appendChild(row);
      return { row, recipeCell, unitCell };
    });

    const applySelection = (index) => {
      selectedIndex = index;
      rowEls.forEach(({ row, recipeCell, unitCell }, i) => {
        const isActive = i === selectedIndex;
        const back = isActive
          ? (comp.selectionBackColor || '#99CCFF')
          : 'transparent';
        const fore = isActive
          ? (comp.selectionForeColor || '#000000')
          : (comp.foreColor || '#ffffff');
        row.style.backgroundColor = back;
        paintText(recipeCell, fore);
        paintText(unitCell, fore);
        row.classList.toggle('ft-recipeplus-selector-row--active', isActive);
      });
    };

    applySelection(selectedIndex);

    if (!studioEdit) {
      rowEls.forEach(({ row }, index) => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => applySelection(index));
      });
      if (comp.keyNavigation !== false) {
        el.addEventListener('keydown', (e) => {
          const last = rowEls.length - 1;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = selectedIndex >= last ? (comp.wrapAround ? 0 : last) : selectedIndex + 1;
            applySelection(next);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = selectedIndex <= 0 ? (comp.wrapAround ? last : 0) : selectedIndex - 1;
            applySelection(next);
          }
        });
      }
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'RecipePlusSelector',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'RecipePlusSelector',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  defaultRecipePlusColumns() {
    return [
      { id: 'recipe', label: 'Recipe', headerText: 'Recipe', width: 150 },
      { id: 'unit', label: 'Unit', headerText: 'Unit', width: 100 }
    ];
  },

  defaultRecipePlusSelectorRows() {
    return Array.from({ length: 8 }, () => ({
      recipe: 'recipe recipe recipe reci*',
      unit: 'unit*'
    }));
  },

  defaultRecipePlusTableColumns() {
    return [
      { id: 'ingredientName', label: 'Ingredient name', headerText: 'Ingredient', width: 100, display: true },
      { id: 'currentValue', label: 'Current value', headerText: 'Current', width: 55, display: true },
      { id: 'recipeValue', label: 'Recipe value', headerText: 'Recipe', width: 55, display: true },
      { id: 'compareStatus', label: 'Compare status', headerText: 'Compare', width: 55, display: true },
      { id: 'tagName', label: 'Tag name', headerText: 'Tag Name', width: 100, display: true }
    ];
  },

  defaultRecipePlusTableRows() {
    return [
      { ingredientName: 'ingredient', currentValue: '', recipeValue: '', compareStatus: '', tagName: '' },
      { ingredientName: 'ingredient', currentValue: '', recipeValue: '', compareStatus: '', tagName: '' },
      { ingredientName: '', currentValue: '', recipeValue: '', compareStatus: '', tagName: '' }
    ];
  },

  RecipePlusTable(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-recipeplus-table ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const columns = (comp.columns?.length
      ? comp.columns
      : ComponentRegistry.defaultRecipePlusTableColumns()
    ).filter((c) => c.display !== false);
    const gridColor = comp.gridColor || '#A0A8B0';

    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      useBorderColor: comp.useBorderColor !== false,
      borderColor: comp.borderColor || '#001C38',
      studioEdit
    });

    el.style.padding = '0';
    el.style.overflow = 'hidden';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.tabIndex = comp.keyNavigation === false ? -1 : 0;

    const fontBase = {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold,
      italic: comp.italic,
      underline: comp.underline
    };
    const wrap = comp.wordWrap !== false;
    const linesPerItem = Math.max(1, Math.min(10, Number(comp.linesPerItem) || 1));

    const applyColStyle = (node, col, isLast) => {
      const width = Math.max(20, Number(col.width) || 100);
      node.style.flex = `0 0 ${width}px`;
      node.style.width = `${width}px`;
      node.style.minWidth = '0';
      node.style.textAlign = 'left';
      node.style.overflow = 'hidden';
      node.style.whiteSpace = wrap && linesPerItem > 1 ? 'normal' : 'nowrap';
      node.style.textOverflow = 'ellipsis';
      node.style.padding = '0 4px';
      node.style.boxSizing = 'border-box';
      if (!isLast) node.style.borderRight = `1px solid ${gridColor}`;
    };

    const paintText = (node, color) => {
      ComponentRegistry.applyCaptionStyle(node, {
        ...fontBase,
        foreColor: color,
        useForeColor: true,
        wordWrap: wrap,
        alignment: 'middleLeft'
      });
    };

    const fillCells = (rowEl, getText, color) => {
      columns.forEach((col, i) => {
        const cell = document.createElement('span');
        cell.className = 'ft-recipeplus-table-col';
        cell.textContent = getText(col) || '';
        applyColStyle(cell, col, i === columns.length - 1);
        paintText(cell, color);
        rowEl.appendChild(cell);
      });
    };

    if (comp.displayHeader !== false) {
      const headerEl = document.createElement('div');
      headerEl.className = 'ft-recipeplus-table-header';
      headerEl.style.backgroundColor = comp.headerBackColor || '#001C38';
      headerEl.style.borderBottom = `1px solid ${gridColor}`;
      fillCells(headerEl, (col) => col.headerText || col.label || '', comp.headerForeColor || '#ffffff');
      el.appendChild(headerEl);
    }

    const body = document.createElement('div');
    body.className = 'ft-recipeplus-table-body';
    el.appendChild(body);

    const demoRows = ComponentRegistry.defaultRecipePlusTableRows();
    let selectedIndex = studioEdit ? 0 : (comp.selectedIndex ?? 0);

    const rowEls = demoRows.map((item, index) => {
      const row = document.createElement('div');
      row.className = 'ft-recipeplus-table-row';
      row.dataset.index = String(index);
      row.style.flex = `${linesPerItem} 1 0`;
      row.style.borderBottom = `1px solid ${gridColor}`;
      fillCells(row, (col) => (typeof item === 'string' ? item : (item[col.id] || '')), comp.foreColor || '#ffffff');
      body.appendChild(row);
      return row;
    });

    const applySelection = (index) => {
      selectedIndex = index;
      rowEls.forEach((row, i) => {
        const isActive = i === selectedIndex;
        const back = isActive ? (comp.selectionBackColor || '#99CCFF') : 'transparent';
        const fore = isActive
          ? (comp.selectionForeColor || '#000000')
          : (comp.foreColor || '#ffffff');
        row.style.backgroundColor = back;
        row.querySelectorAll('.ft-recipeplus-table-col').forEach((cell) => paintText(cell, fore));
        row.classList.toggle('ft-recipeplus-table-row--active', isActive);
      });
    };

    applySelection(selectedIndex);

    if (comp.displayFooter !== false) {
      const footerEl = document.createElement('div');
      footerEl.className = 'ft-recipeplus-table-footer';
      footerEl.style.backgroundColor = comp.footerBackColor || '#001C38';
      footerEl.style.borderTop = `1px solid ${gridColor}`;
      const footerText = document.createElement('span');
      footerText.className = 'ft-recipeplus-table-footer-text';
      footerText.textContent = 'recipe : unit :';
      paintText(footerText, comp.footerForeColor || '#ffffff');
      footerEl.appendChild(footerText);
      el.appendChild(footerEl);
    }

    if (!studioEdit && !comp.viewOnly) {
      rowEls.forEach((row, index) => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => applySelection(index));
      });
      if (comp.keyNavigation !== false) {
        el.addEventListener('keydown', (e) => {
          const last = rowEls.length - 1;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = selectedIndex >= last ? (comp.wrapAround ? 0 : last) : selectedIndex + 1;
            applySelection(next);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = selectedIndex <= 0 ? (comp.wrapAround ? last : 0) : selectedIndex - 1;
            applySelection(next);
          }
        });
      }
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'RecipePlusTable',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'RecipePlusTable',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  CloseDisplayButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-close-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'CloseDisplayButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'CloseDisplayButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', async () => {
        if (comp.writeOnClose && comp.tag) {
          const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
          if (writeTag) await ctx.writeTag(writeTag, comp.closeValue ?? 0);
        }
        if (typeof ctx.closeDisplay === 'function') ctx.closeDisplay();
        else if (typeof ctx.navigateBack === 'function') ctx.navigateBack();
      });
    }
    return btn;
  },

  PausePenButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-pause-pen-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'PausePenButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'PausePenButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', () => {
        const sendPressTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
        const linkedObject = (comp.linkedObject || '').trim();
        const target = sendPressTo === 'linkedObject'
          ? linkedObject
          : (ctx.focusedObjectName || ctx.focusObject || '');
        if (typeof ctx.pauseTrendPen === 'function') {
          ctx.pauseTrendPen({ sendPressTo, linkedObject, target, audio: comp.audio !== false });
        } else {
          btn.dispatchEvent(new CustomEvent('planthmi-pause-pen', {
            bubbles: true,
            detail: { sendPressTo, linkedObject, target, audio: comp.audio !== false }
          }));
        }
      });
    }
    return btn;
  },

  NextPenButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-next-pen-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'NextPenButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'NextPenButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', () => {
        const sendPressTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
        const linkedObject = (comp.linkedObject || '').trim();
        const target = sendPressTo === 'linkedObject'
          ? linkedObject
          : (ctx.focusedObjectName || ctx.focusObject || '');
        if (typeof ctx.nextTrendPen === 'function') {
          ctx.nextTrendPen({ sendPressTo, linkedObject, target, audio: comp.audio !== false });
        } else {
          btn.dispatchEvent(new CustomEvent('planthmi-next-pen', {
            bubbles: true,
            detail: { sendPressTo, linkedObject, target, audio: comp.audio !== false }
          }));
        }
      });
    }
    return btn;
  },

  resolveGraphicImageFile(fileName) {
    const name = String(fileName || '').trim();
    if (!name) return '';
    if (/\.[a-z0-9]+$/i.test(name)) return name;
    return `${name}.bmp`;
  },

  sendKeyToInputTarget(ctx, comp, key) {
    const sendPressTo = comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus';
    const linkedObject = (comp.linkedObject || '').trim();
    const root = ctx.root || document;
    const escapeName = (name) => {
      try { return CSS.escape(name); } catch (_) { return String(name).replace(/"/g, '\\"'); }
    };
    const findInHost = (host) => {
      if (!host) return null;
      if (host.matches?.('input, textarea')) return host;
      return host.querySelector?.('input, textarea') || null;
    };
    let input = null;
    if (sendPressTo === 'linkedObject' && linkedObject) {
      input = findInHost(root.querySelector(`[data-name="${escapeName(linkedObject)}"]`));
    }
    if (!input) {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) input = active;
    }
    if (!input && (ctx.focusedObjectName || ctx.focusObject)) {
      input = findInHost(root.querySelector(`[data-name="${escapeName(ctx.focusedObjectName || ctx.focusObject)}"]`));
    }
    if (!input || input.disabled || input.readOnly) return;
    input.focus();
    if (key === 'Backspace') {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      if (typeof start === 'number' && typeof end === 'number') {
        if (start !== end) {
          input.value = input.value.slice(0, start) + input.value.slice(end);
          input.setSelectionRange(start, start);
        } else if (start > 0) {
          input.value = input.value.slice(0, start - 1) + input.value.slice(start);
          input.setSelectionRange(start - 1, start - 1);
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    if (key === 'End') {
      const len = input.value.length;
      try { input.setSelectionRange(len, len); } catch (_) { /* ignore */ }
    }
    if (key === 'Home' || key === 'ArrowUp' || key === 'PageUp') {
      try { input.setSelectionRange(0, 0); } catch (_) { /* ignore */ }
    }
    if (key === 'ArrowDown' || key === 'PageDown') {
      const len = input.value.length;
      try { input.setSelectionRange(len, len); } catch (_) { /* ignore */ }
    }
    if (key === 'ArrowLeft') {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      try {
        if (start !== end) input.setSelectionRange(start, start);
        else if (start > 0) input.setSelectionRange(start - 1, start - 1);
      } catch (_) { /* ignore */ }
    }
    if (key === 'ArrowRight') {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? start;
      const len = input.value.length;
      try {
        if (start !== end) input.setSelectionRange(end, end);
        else if (end < len) input.setSelectionRange(end + 1, end + 1);
      } catch (_) { /* ignore */ }
    }
    input.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
  },

  BackspaceButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-backspace-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Backspace');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'BackspaceButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'BackspaceButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', () => {
        if (typeof ctx.sendKeyPress === 'function') {
          ctx.sendKeyPress({
            key: 'Backspace',
            sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
            linkedObject: (comp.linkedObject || '').trim(),
            audio: comp.audio !== false
          });
        } else {
          ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'Backspace');
        }
      });
    }
    return btn;
  },

  EndButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-end-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'End');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'EndButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'EndButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', () => {
        if (typeof ctx.sendKeyPress === 'function') {
          ctx.sendKeyPress({
            key: 'End',
            sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
            linkedObject: (comp.linkedObject || '').trim(),
            audio: comp.audio !== false
          });
        } else {
          ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'End');
        }
      });
    }
    return btn;
  },

  EnterButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-enter-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Enter');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'EnterButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'EnterButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', () => {
        if (typeof ctx.sendKeyPress === 'function') {
          ctx.sendKeyPress({
            key: 'Enter',
            sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
            linkedObject: (comp.linkedObject || '').trim(),
            audio: comp.audio !== false
          });
        } else {
          ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'Enter');
        }
      });
    }
    return btn;
  },

  HomeButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-home-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Home');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'HomeButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'HomeButton',
          source: comp._source || ''
        }, '*');
      });
    } else {
      btn.addEventListener('click', () => {
        if (typeof ctx.sendKeyPress === 'function') {
          ctx.sendKeyPress({
            key: 'Home',
            sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
            linkedObject: (comp.linkedObject || '').trim(),
            audio: comp.audio !== false
          });
        } else {
          ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'Home');
        }
      });
    }
    return btn;
  },

  MoveLeftButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-move-left-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Arrow Left');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MoveLeftButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MoveLeftButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const doPress = () => {
      if (typeof ctx.sendKeyPress === 'function') {
        ctx.sendKeyPress({
          key: 'ArrowLeft',
          sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
          linkedObject: (comp.linkedObject || '').trim(),
          audio: comp.audio !== false
        });
      } else {
        ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'ArrowLeft');
      }
    };
    const rate = Number(comp.autoRepeatRate) || 0;
    const delay = comp.autoRepeatDelay ?? 400;
    const intervalMs = rate <= 0 ? 0 : (rate <= 20 ? Math.max(50, Math.round(1000 / rate)) : rate);
    let repeatTimer = null;
    let delayTimer = null;

    const stopRepeat = () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      delayTimer = null;
      repeatTimer = null;
    };

    const startRepeat = () => {
      doPress();
      if (intervalMs <= 0) return;
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(doPress, intervalMs);
      }, delay);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); startRepeat(); });
    btn.addEventListener('mouseup', stopRepeat);
    btn.addEventListener('mouseleave', stopRepeat);
    btn.addEventListener('click', (e) => e.preventDefault());
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRepeat(); }, { passive: false });
      btn.addEventListener('touchend', stopRepeat);
      btn.addEventListener('touchcancel', stopRepeat);
    }
    return btn;
  },

  MoveRightButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-move-right-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Arrow Right');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MoveRightButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MoveRightButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const doPress = () => {
      if (typeof ctx.sendKeyPress === 'function') {
        ctx.sendKeyPress({
          key: 'ArrowRight',
          sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
          linkedObject: (comp.linkedObject || '').trim(),
          audio: comp.audio !== false
        });
      } else {
        ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'ArrowRight');
      }
    };
    const rate = Number(comp.autoRepeatRate) || 0;
    const delay = comp.autoRepeatDelay ?? 400;
    const intervalMs = rate <= 0 ? 0 : (rate <= 20 ? Math.max(50, Math.round(1000 / rate)) : rate);
    let repeatTimer = null;
    let delayTimer = null;

    const stopRepeat = () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      delayTimer = null;
      repeatTimer = null;
    };

    const startRepeat = () => {
      doPress();
      if (intervalMs <= 0) return;
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(doPress, intervalMs);
      }, delay);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); startRepeat(); });
    btn.addEventListener('mouseup', stopRepeat);
    btn.addEventListener('mouseleave', stopRepeat);
    btn.addEventListener('click', (e) => e.preventDefault());
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRepeat(); }, { passive: false });
      btn.addEventListener('touchend', stopRepeat);
      btn.addEventListener('touchcancel', stopRepeat);
    }
    return btn;
  },

  MoveUpButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-move-up-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Arrow Up');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MoveUpButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MoveUpButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const doPress = () => {
      if (typeof ctx.sendKeyPress === 'function') {
        ctx.sendKeyPress({
          key: 'ArrowUp',
          sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
          linkedObject: (comp.linkedObject || '').trim(),
          audio: comp.audio !== false
        });
      } else {
        ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'ArrowUp');
      }
    };
    const rate = Number(comp.autoRepeatRate) || 0;
    const delay = comp.autoRepeatDelay ?? 400;
    const intervalMs = rate <= 0 ? 0 : (rate <= 20 ? Math.max(50, Math.round(1000 / rate)) : rate);
    let repeatTimer = null;
    let delayTimer = null;

    const stopRepeat = () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      delayTimer = null;
      repeatTimer = null;
    };

    const startRepeat = () => {
      doPress();
      if (intervalMs <= 0) return;
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(doPress, intervalMs);
      }, delay);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); startRepeat(); });
    btn.addEventListener('mouseup', stopRepeat);
    btn.addEventListener('mouseleave', stopRepeat);
    btn.addEventListener('click', (e) => e.preventDefault());
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRepeat(); }, { passive: false });
      btn.addEventListener('touchend', stopRepeat);
      btn.addEventListener('touchcancel', stopRepeat);
    }
    return btn;
  },

  MoveDownButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-move-down-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Arrow Down');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'MoveDownButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'MoveDownButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const doPress = () => {
      if (typeof ctx.sendKeyPress === 'function') {
        ctx.sendKeyPress({
          key: 'ArrowDown',
          sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
          linkedObject: (comp.linkedObject || '').trim(),
          audio: comp.audio !== false
        });
      } else {
        ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'ArrowDown');
      }
    };
    const rate = Number(comp.autoRepeatRate) || 0;
    const delay = comp.autoRepeatDelay ?? 400;
    const intervalMs = rate <= 0 ? 0 : (rate <= 20 ? Math.max(50, Math.round(1000 / rate)) : rate);
    let repeatTimer = null;
    let delayTimer = null;

    const stopRepeat = () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      delayTimer = null;
      repeatTimer = null;
    };

    const startRepeat = () => {
      doPress();
      if (intervalMs <= 0) return;
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(doPress, intervalMs);
      }, delay);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); startRepeat(); });
    btn.addEventListener('mouseup', stopRepeat);
    btn.addEventListener('mouseleave', stopRepeat);
    btn.addEventListener('click', (e) => e.preventDefault());
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRepeat(); }, { passive: false });
      btn.addEventListener('touchend', stopRepeat);
      btn.addEventListener('touchcancel', stopRepeat);
    }
    return btn;
  },

  PageDownButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-page-down-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Page Down');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'PageDownButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'PageDownButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const doPress = () => {
      if (typeof ctx.sendKeyPress === 'function') {
        ctx.sendKeyPress({
          key: 'PageDown',
          sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
          linkedObject: (comp.linkedObject || '').trim(),
          audio: comp.audio !== false
        });
      } else {
        ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'PageDown');
      }
    };
    const rate = Number(comp.autoRepeatRate) || 0;
    const delay = comp.autoRepeatDelay ?? 400;
    const intervalMs = rate <= 0 ? 0 : (rate <= 20 ? Math.max(50, Math.round(1000 / rate)) : rate);
    let repeatTimer = null;
    let delayTimer = null;

    const stopRepeat = () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      delayTimer = null;
      repeatTimer = null;
    };

    const startRepeat = () => {
      doPress();
      if (intervalMs <= 0) return;
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(doPress, intervalMs);
      }, delay);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); startRepeat(); });
    btn.addEventListener('mouseup', stopRepeat);
    btn.addEventListener('mouseleave', stopRepeat);
    btn.addEventListener('click', (e) => e.preventDefault());
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRepeat(); }, { passive: false });
      btn.addEventListener('touchend', stopRepeat);
      btn.addEventListener('touchcancel', stopRepeat);
    }
    return btn;
  },

  PageUpButton(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-page-up-btn ft-goto-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }
    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(btn, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: Boolean(comp.borderUsesBackColor),
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: comp.shape || 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(btn, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    if (comp.useHighlightColor !== false && comp.highlightColor) {
      btn.classList.add('ft-highlight-on-focus');
      btn.style.setProperty('--ft-highlight-color', comp.highlightColor);
    } else {
      btn.classList.remove('ft-highlight-on-focus');
      btn.style.removeProperty('--ft-highlight-color');
    }
    let imgEl = null;
    const imageName = ComponentRegistry.resolveGraphicImageFile(comp.image || 'Page Up');
    if (imageName) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(imageName, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      imgEl.style.pointerEvents = 'none';
      if (comp.imageScaled) imgEl.classList.add('ft-goto-btn-icon-scaled');
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      const missing = document.createElement('span');
      missing.className = 'ft-goto-btn-missing hidden';
      missing.setAttribute('aria-hidden', 'true');
      imgEl.addEventListener('error', () => {
        imgEl.style.display = 'none';
        missing.classList.remove('hidden');
      });
      btn.appendChild(missing);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    const captionText = comp.label || comp.caption || '';
    cap.textContent = captionText;
    cap.style.display = captionText ? '' : 'none';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : (comp.useForeColor !== false);
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.captionColor || comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: comp.alignment || 'middleCenter'
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';

    ComponentRegistry.applyGotoButtonLayout(btn, imgEl, cap, comp);
    if (imgEl) btn.appendChild(imgEl);
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'PageUpButton',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'PageUpButton',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const doPress = () => {
      if (typeof ctx.sendKeyPress === 'function') {
        ctx.sendKeyPress({
          key: 'PageUp',
          sendPressTo: comp.sendPressTo === 'linkedObject' ? 'linkedObject' : 'objectWithFocus',
          linkedObject: (comp.linkedObject || '').trim(),
          audio: comp.audio !== false
        });
      } else {
        ComponentRegistry.sendKeyToInputTarget(ctx, comp, 'PageUp');
      }
    };
    const rate = Number(comp.autoRepeatRate) || 0;
    const delay = comp.autoRepeatDelay ?? 400;
    const intervalMs = rate <= 0 ? 0 : (rate <= 20 ? Math.max(50, Math.round(1000 / rate)) : rate);
    let repeatTimer = null;
    let delayTimer = null;

    const stopRepeat = () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      delayTimer = null;
      repeatTimer = null;
    };

    const startRepeat = () => {
      doPress();
      if (intervalMs <= 0) return;
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(doPress, intervalMs);
      }, delay);
    };

    btn.addEventListener('mousedown', (e) => { e.preventDefault(); startRepeat(); });
    btn.addEventListener('mouseup', stopRepeat);
    btn.addEventListener('mouseleave', stopRepeat);
    btn.addEventListener('click', (e) => e.preventDefault());
    if (comp.touch !== false) {
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); startRepeat(); }, { passive: false });
      btn.addEventListener('touchend', stopRepeat);
      btn.addEventListener('touchcancel', stopRepeat);
    }
    return btn;
  },

  Trend(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-trend ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const fontFamily = comp.fontFamily || 'Arial Unicode MS';
    const fontSize = Math.max(6, Number(comp.fontSize) || 8);
    const textColor = comp.textColor || '#000000';
    const backColor = comp.backColor || '#000000';
    const gridColor = comp.xGridColor || comp.yGridColor || '#808080';
    const xGridLines = Math.max(0, Number(comp.xGridLines ?? 4));
    const yGridLines = Math.max(0, Number(comp.yGridLines ?? 4));
    const xMinor = Math.max(0, Number(comp.xMinorGridLines) || 0);
    const yMinor = Math.max(0, Number(comp.yMinorGridLines) || 0);
    const connectPoints = (comp.dataPointConnection || 'connect') !== 'none'
      && (comp.dataPointConnection || 'connect') !== 'noconnect';
    const pens = Array.isArray(comp.pens) && comp.pens.length ? comp.pens : [];
    const buffer = Math.max(8, Number(comp.bufferRecords) || 200);
    const spanMs = (() => {
      const n = Number(comp.timeSpan) || 2;
      const u = comp.timeSpanUnit || 'min';
      if (u === 'ms') return n;
      if (u === 's') return n * 1000;
      if (u === 'h') return n * 3600000;
      return n * 60000;
    })();

    el.style.fontFamily = fontFamily;
    el.style.fontSize = `${fontSize}px`;
    el.style.color = textColor;
    el.style.fontStyle = (comp.fontStyle === 'oblique' || comp.fontStyle === 'boldOblique') ? 'italic' : 'normal';
    el.style.fontWeight = (comp.fontStyle === 'bold' || comp.fontStyle === 'boldOblique') ? '700' : '400';
    el.style.textDecoration = [comp.underline ? 'underline' : '', comp.strikeout ? 'line-through' : ''].filter(Boolean).join(' ') || 'none';
    if (comp.focusHighlight !== false) el.classList.add('ft-highlight-on-focus');

    const dateEl = document.createElement('div');
    dateEl.className = 'ft-trend-date';
    const plot = document.createElement('div');
    plot.className = 'ft-trend-plot';
    plot.style.background = backColor;
    if (comp.useGradientStyle) {
      plot.style.background = `linear-gradient(#404040, ${backColor})`;
    }
    const timesEl = document.createElement('div');
    timesEl.className = 'ft-trend-times';
    const timeLeft = document.createElement('span');
    const timeRight = document.createElement('span');
    timesEl.appendChild(timeLeft);
    timesEl.appendChild(timeRight);
    el.appendChild(dateEl);
    el.appendChild(plot);
    el.appendChild(timesEl);

    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    plot.appendChild(svg);

    const formatTrendTime = (d) => {
      const fmt = comp.timeFormat || 'system';
      const opts = { hour: 'numeric', minute: '2-digit', second: '2-digit' };
      if (fmt === '24' || fmt === '24h') {
        opts.hour12 = false;
        opts.hour = '2-digit';
      } else if (fmt === '12' || fmt === '12h') {
        opts.hour12 = true;
      }
      let s = d.toLocaleTimeString(undefined, opts);
      if (comp.displayMilliseconds) s += `.${String(d.getMilliseconds()).padStart(3, '0')}`;
      return s;
    };
    const dashFor = (style) => {
      if (style === 'dash') return '2 1.5';
      if (style === 'dot') return '0.6 1.2';
      if (style === 'dashDot') return '2.4 1.2 0.6 1.2';
      if (style === 'dashDotDot') return '2.4 1.2 0.6 1.2 0.6 1.2';
      return '';
    };
    const histories = pens.map(() => []);
    let paused = false;

    const drawGrid = () => {
      const parts = [];
      if (comp.xDisplayGrid !== false) {
        for (let i = 1; i <= xGridLines; i++) {
          const x = (i / (xGridLines + 1)) * 100;
          parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="100" stroke="${gridColor}" stroke-width="0.35" vector-effect="non-scaling-stroke" />`);
        }
        if (xMinor > 0) {
          const cells = xGridLines + 1;
          for (let c = 0; c < cells; c++) {
            for (let m = 1; m <= xMinor; m++) {
              const x = ((c + m / (xMinor + 1)) / cells) * 100;
              parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="100" stroke="${gridColor}" stroke-width="0.15" opacity="0.55" vector-effect="non-scaling-stroke" />`);
            }
          }
        }
      }
      if (comp.yDisplayGrid !== false) {
        for (let i = 1; i <= yGridLines; i++) {
          const y = (i / (yGridLines + 1)) * 100;
          parts.push(`<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="${gridColor}" stroke-width="0.35" vector-effect="non-scaling-stroke" />`);
        }
        if (yMinor > 0) {
          const cells = yGridLines + 1;
          for (let c = 0; c < cells; c++) {
            for (let m = 1; m <= yMinor; m++) {
              const y = ((c + m / (yMinor + 1)) / cells) * 100;
              parts.push(`<line x1="0" y1="${y}" x2="100" y2="${y}" stroke="${gridColor}" stroke-width="0.15" opacity="0.55" vector-effect="non-scaling-stroke" />`);
            }
          }
        }
      }
      return parts.join('');
    };

    const redraw = (now = Date.now()) => {
      const start = now - spanMs;
      dateEl.textContent = new Date(now).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      dateEl.style.display = comp.xDisplayScale === false ? 'none' : '';
      timesEl.style.display = comp.xDisplayScale === false ? 'none' : '';
      timeLeft.textContent = formatTrendTime(new Date(start));
      timeRight.textContent = formatTrendTime(new Date(now));

      const traces = [];
      pens.forEach((pen, i) => {
        if (!pen || pen.visible === false || !pen.tag) return;
        const pts = histories[i].filter((p) => p.t >= start);
        if (!pts.length) return;
        let min = Number(pen.min);
        let max = Number(pen.max);
        if (!Number.isFinite(min)) min = 0;
        if (!Number.isFinite(max)) max = 100;
        if (comp.yMode === 'automatic' && pts.length) {
          min = Math.min(...pts.map((p) => p.v));
          max = Math.max(...pts.map((p) => p.v));
          if (min === max) { min -= 1; max += 1; }
        } else if (comp.yMode === 'custom') {
          min = Number(comp.yMinValue) || 0;
          max = Number(comp.yMaxValue) || 100;
        }
        const range = (max - min) || 1;
        const coords = pts.map((p) => {
          const x = Math.max(0, Math.min(100, ((p.t - start) / spanMs) * 100));
          const y = Math.max(0, Math.min(100, 100 - ((p.v - min) / range) * 100));
          return { x, y };
        });
        const color = pen.color || '#00ff00';
        const width = Math.max(0.4, Number(pen.width) || 1);
        const dash = dashFor(pen.style);
        if (connectPoints && coords.length > 1) {
          const d = coords.map((c, idx) => `${idx ? 'L' : 'M'}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
          traces.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width * 0.35}" ${dash ? `stroke-dasharray="${dash}"` : ''} vector-effect="non-scaling-stroke" />`);
        }
        if (pen.marker && pen.marker !== 'none') {
          coords.forEach((c) => {
            if (pen.marker === 'square') traces.push(`<rect x="${c.x - 0.8}" y="${c.y - 0.8}" width="1.6" height="1.6" fill="${color}" />`);
            else if (pen.marker === 'diamond') traces.push(`<polygon points="${c.x},${c.y - 1} ${c.x + 1},${c.y} ${c.x},${c.y + 1} ${c.x - 1},${c.y}" fill="${color}" />`);
            else if (pen.marker === 'triangle') traces.push(`<polygon points="${c.x},${c.y - 1.1} ${c.x + 1},${c.y + 0.8} ${c.x - 1},${c.y + 0.8}" fill="${color}" />`);
            else traces.push(`<circle cx="${c.x}" cy="${c.y}" r="0.9" fill="${color}" />`);
          });
        }
      });
      svg.innerHTML = drawGrid() + traces.join('');
    };

    const sample = () => {
      if (paused || studioEdit) return;
      const now = Date.now();
      pens.forEach((pen, i) => {
        if (!pen?.tag) return;
        const raw = ctx.getTagValue?.(pen.tag);
        const v = typeof raw === 'number' ? raw : Number(raw);
        histories[i].push({ t: now, v: Number.isFinite(v) ? v : 0 });
        if (histories[i].length > buffer) histories[i].splice(0, histories[i].length - buffer);
      });
      redraw(now);
    };

    redraw();

    if (!studioEdit) {
      const unitMs = (n, u) => {
        const v = Number(n) || 1;
        if (u === 'ms') return v;
        if (u === 'min') return v * 60000;
        if (u === 'h') return v * 3600000;
        return v * 1000;
      };
      const interval = comp.updateMode === 'onChange'
        ? unitMs(comp.heartbeat, comp.heartbeatUnit || 'min')
        : unitMs(comp.refreshRate, comp.refreshUnit || 's');
      const timer = setInterval(sample, Math.max(200, interval));
      el.addEventListener('DOMNodeRemoved', () => clearInterval(timer), { once: true });
      pens.forEach((pen) => {
        if (pen?.tag) ComponentRegistry.bindIndicatorRef(pen.tag, sample, ctx);
      });
      el.pauseTrendPen = () => { paused = !paused; };
      el.nextTrendPen = () => {
        const vis = pens.map((p, i) => (p.visible !== false && p.tag ? i : -1)).filter((i) => i >= 0);
        if (!vis.length) return;
        const cur = vis.findIndex((i) => pens[i].active) || 0;
        vis.forEach((i) => { pens[i].active = false; });
        pens[vis[(cur + 1) % vis.length]].active = true;
      };
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'Trend',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'Trend',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  DisplayListSelector(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-display-list-selector ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultDisplayListSelectorStates(comp.numberOfStates ?? 5);

    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 4,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      shape: 'rectangle',
      studioEdit,
      useHighlightColor: false
    });
    ComponentRegistry.applyShapePattern(el, {
      ...comp,
      usePatternColor: comp.usePatternColor !== false,
      patternColor: comp.patternColor || '#ffffff'
    });
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.padding = '0';
    el.style.overflow = 'hidden';
    el.style.boxSizing = 'border-box';
    el.tabIndex = studioEdit ? -1 : (comp.keyNavigation !== false ? 0 : -1);
    el.classList.toggle('ft-blink', Boolean(comp.blink));

    const fontBase = {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: Boolean(comp.bold),
      italic: Boolean(comp.italic),
      underline: Boolean(comp.underline)
    };
    const truncate = comp.captionTruncate === 'character' ? 'character' : 'word';
    let selectedIndex = 0;

    const rowEls = states.map((stateDef, index) => {
      const row = document.createElement('div');
      row.className = 'ft-display-list-row';
      row.dataset.index = String(index);
      const arrow = document.createElement('span');
      arrow.className = 'ft-display-list-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      const cap = document.createElement('span');
      cap.className = 'ft-display-list-caption';
      cap.classList.add(truncate === 'character' ? 'truncate-character' : 'truncate-word');
      row.appendChild(arrow);
      row.appendChild(cap);
      el.appendChild(row);
      return { row, arrow, cap, stateDef };
    });

    const paint = (index) => {
      selectedIndex = Math.max(0, Math.min(rowEls.length - 1, Number(index) || 0));
      rowEls.forEach(({ row, arrow, cap, stateDef }, i) => {
        const isSelected = i === selectedIndex;
        row.classList.toggle('is-selected', isSelected);
        arrow.textContent = '';
        let capText = stateDef.caption ?? '';
        if (stateDef.useDisplayName && stateDef.target) capText = stateDef.target;
        cap.textContent = capText;
        const alignId = stateDef.alignment || 'middleLeft';
        const align = ComponentRegistry.textAlignment(alignId);
        cap.style.textAlign = align.align === 'flex-end' ? 'right' : align.align === 'center' ? 'center' : 'left';
        if (isSelected) {
          row.style.backgroundColor = comp.selectionBackColor || '#d0e7ff';
          ComponentRegistry.applyCaptionStyle(cap, {
            ...fontBase,
            foreColor: stateDef.useCaptionColor ? (stateDef.captionColor || '#000000') : (comp.selectionForeColor || '#000000'),
            useForeColor: true,
            wordWrap: false,
            alignment: alignId
          });
        } else {
          row.style.backgroundColor = 'transparent';
          ComponentRegistry.applyCaptionStyle(cap, {
            ...fontBase,
            foreColor: stateDef.captionColor || '#ffffff',
            useForeColor: Boolean(stateDef.useCaptionColor),
            wordWrap: false,
            alignment: alignId
          });
        }
        if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid' && !isSelected) {
          cap.style.backgroundColor = stateDef.captionBackColor || '#001C38';
        } else {
          cap.style.backgroundColor = '';
        }
        cap.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
      });
    };

    const indexFromValue = (val) => {
      const resolved = ComponentRegistry.resolveMultistateState(states, val);
      const idx = states.findIndex((s) => s.id === resolved?.id);
      return idx < 0 ? 0 : idx;
    };

    paint(studioEdit ? 0 : (comp.tag ? indexFromValue(ctx.getTagValue?.(comp.tag)) : 0));

    if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, (val) => paint(indexFromValue(val)), ctx);
    }

    const goToIndex = (index) => {
      if (!rowEls.length) return;
      let next = index;
      if (comp.wrapAround !== false) {
        next = ((index % rowEls.length) + rowEls.length) % rowEls.length;
      } else {
        next = Math.max(0, Math.min(rowEls.length - 1, index));
      }
      paint(next);
      const stateDef = states[next];
      if (comp.tag) {
        const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
        if (writeTag) ctx.writeTag(writeTag, stateDef?.value ?? next);
      }
      if (stateDef?.target && typeof ctx.navigate === 'function') ctx.navigate(stateDef.target);
    };

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'DisplayListSelector',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'DisplayListSelector',
          source: comp._source || ''
        }, '*');
      });
    } else {
      rowEls.forEach(({ row }, index) => {
        row.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          goToIndex(index);
        });
      });
      if (comp.keyNavigation !== false) {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            goToIndex(selectedIndex + 1);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            goToIndex(selectedIndex - 1);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            goToIndex(selectedIndex);
          }
        });
      }
    }
    return el;
  },

  defaultDisplayListSelectorStates(count = 5) {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`,
        value: i,
        target: '',
        parameterType: 'file',
        parameterFile: '',
        parameterList: '',
        displayPosition: false,
        displayTop: 0,
        displayLeft: 0,
        useDisplayName: false,
        caption: '',
        useCaptionColor: false,
        captionColor: '#ffffff',
        useCaptionBackColor: false,
        captionBackColor: '#001C38',
        captionBlink: false,
        captionBackStyle: 'transparent',
        alignment: 'middleLeft'
      });
    }
    return states;
  },

  formatFtShortDateTime(date = new Date()) {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).replace(',', '');
  },

  formatFtEuroDateTime(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  },

  formatTimeDateDisplay(comp, date = new Date()) {
    const fmt = comp?.dateFormat || 'locale';
    if (fmt === 'short') {
      return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
    }
    if (fmt === 'long') {
      return date.toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'medium' });
    }
    if (fmt === 'euro24') {
      return ComponentRegistry.formatFtEuroDateTime(date);
    }
    return ComponentRegistry.formatFtShortDateTime(date);
  },

  TimeDateDisplay(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-time-date ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx?.studioEdit);

    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'none',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'transparent',
      backColor: comp.backColor || '#ffffff',
      useBackColor: comp.useBackColor === true,
      studioEdit
    });

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.padding = '0 1px';
    el.style.boxSizing = 'border-box';

    const valueEl = document.createElement('span');
    valueEl.className = 'ft-time-date-value';
    valueEl.style.pointerEvents = 'none';
    el.appendChild(valueEl);

    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId, 'row');
    el.style.justifyContent = align.justify;
    el.style.alignItems = align.align;

    ComponentRegistry.applyCaptionStyle(valueEl, {
      fontFamily: comp.fontFamily,
      fontSize: comp.fontSize,
      bold: comp.bold,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.foreColor || '#000000',
      useForeColor: comp.useForeColor !== false,
      wordWrap: false,
      alignment: alignId
    });
    valueEl.style.width = '100%';
    valueEl.style.lineHeight = '1.1';
    el.classList.toggle('ft-blink', Boolean(comp.blink));

    const renderClock = () => {
      valueEl.textContent = ComponentRegistry.formatTimeDateDisplay(comp);
    };
    renderClock();
    if (!studioEdit) {
      const timerId = setInterval(renderClock, 1000);
      el.dataset.clockTimer = String(timerId);
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'TimeDateDisplay',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'TimeDateDisplay',
          source: comp._source || ''
        }, '*');
      });
    }
    return el;
  },

  StringDisplay(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-string-display ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 4,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      studioEdit
    });
    ComponentRegistry.applyShapePattern(el, comp);

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.padding = '2px 4px';

    const valueEl = document.createElement('span');
    valueEl.className = 'ft-string-display-value';
    valueEl.style.pointerEvents = 'none';
    valueEl.style.width = '100%';
    el.appendChild(valueEl);

    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId);
    el.style.justifyContent = align.justify;
    el.style.alignItems = align.align;

    const applyTextStyle = () => {
      ComponentRegistry.applyCaptionStyle(valueEl, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: comp.foreColor || '#ffffff',
        useForeColor: true,
        wordWrap: comp.wordWrap !== false,
        alignment: alignId
      });
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    };
    applyTextStyle();

    const placeholder = ComponentRegistry.stringDisplayPlaceholder(comp);
    const showValue = (val) => {
      valueEl.textContent = val != null && val !== '' ? String(val) : '';
    };

    if (comp.useCurrentUser && !studioEdit) {
      const renderUser = (user) => showValue(user?.username || comp.caption || 'Guest');
      renderUser(ctx.getCurrentUser?.());
      ctx.onUserChange?.(renderUser);
    } else if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showValue, ctx);
      const current = ctx.getTagValue?.(comp.tag);
      if (current !== undefined && current !== null) showValue(current);
      else valueEl.textContent = placeholder;
    } else if (studioEdit) {
      valueEl.textContent = comp.useCurrentUser
        ? (comp.caption || 'Guest')
        : placeholder;
    } else {
      showValue(comp.caption);
    }

    if (studioEdit) {
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'StringDisplay',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'StringDisplay',
          source: comp._source || ''
        }, '*');
      });
    }

    return el;
  },

  StringInputEnable(comp, ctx) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ft-string-input ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption ft-string-input-value';
    caption.style.pointerEvents = 'none';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.padding = '0 4px';
    el.style.overflow = 'hidden';
    el.style.cursor = studioEdit ? 'default' : 'pointer';
    el.appendChild(caption);
    let imgEl = null;

    const applyCaptionLook = (alignId) => {
      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: comp.captionColor || comp.foreColor || '#ffffff',
        useForeColor: Boolean(comp.useCaptionColor),
        wordWrap: comp.wordWrap !== false,
        alignment: alignId
      });
      if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
        caption.style.backgroundColor = comp.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = 'transparent';
      }
      caption.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    };

    const renderAppearance = (displayText) => {
      if (imgEl) {
        imgEl.remove();
        imgEl = null;
      }
      ComponentRegistry.applyButtonAppearance(el, {
        ...comp,
        borderStyle: comp.borderStyle || 'line',
        borderWidth: comp.borderWidth ?? 4,
        borderUsesBackColor: comp.borderUsesBackColor !== false,
        backStyle: comp.backStyle || 'solid',
        backColor: comp.backColor || '#001C38',
        useBackColor: comp.useBackColor !== false,
        studioEdit,
        useHighlightColor: false
      });
      ComponentRegistry.applyShapePattern(el, {
        ...comp,
        usePatternColor: comp.usePatternColor !== false,
        patternColor: comp.patternColor || '#ffffff'
      });
      if (comp.useHighlightColor !== false && comp.highlightColor) {
        el.classList.add('ft-highlight-on-focus');
        el.style.setProperty('--ft-highlight-color', comp.highlightColor);
      } else {
        el.classList.remove('ft-highlight-on-focus');
        el.style.removeProperty('--ft-highlight-color');
      }
      if (comp.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-string-input-icon';
        imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        const scaled = Boolean(comp.imageScaled);
        imgEl.style.maxWidth = scaled ? '100%' : '88%';
        imgEl.style.maxHeight = scaled ? '100%' : '88%';
        imgEl.style.objectFit = scaled ? 'fill' : 'contain';
        imgEl.style.width = scaled ? '100%' : '';
        imgEl.style.height = scaled ? '100%' : '';
        if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
          imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
        }
        imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
        el.insertBefore(imgEl, caption);
      }
      const text = displayText ?? (comp.caption ?? comp.label ?? '');
      caption.textContent = text;
      caption.style.display = text ? '' : 'none';
      const alignId = comp.alignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      el.style.justifyContent = align.justify;
      el.style.alignItems = align.align;
      applyCaptionLook(alignId);
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    };

    const showValue = (val) => {
      if (studioEdit) {
        renderAppearance(comp.caption ?? comp.label ?? '');
        return;
      }
      const formatted = ComponentRegistry.formatStringInputValue(val, comp);
      renderAppearance(formatted || comp.caption || '');
    };

    if (studioEdit) {
      renderAppearance(comp.caption ?? comp.label ?? '');
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'StringInputEnable',
          source: comp._source || ''
        }, '*');
      });
      el.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'StringInputEnable',
          source: comp._source || ''
        }, '*');
      });
      return el;
    }

    if (comp.tag) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showValue, ctx);
      const current = ctx.getTagValue?.(comp.tag);
      if (current !== undefined && current !== null) showValue(current);
      else renderAppearance(comp.caption ?? '');
    } else {
      renderAppearance(comp.caption ?? '');
    }

    const commitValue = (raw) => {
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const text = ComponentRegistry.formatStringInputValue(raw, { ...comp, maskScratchpad: false });
      ctx.writeTag(writeTag, text);
      if (comp.enterTag) {
        const enterWrite = ComponentRegistry.resolveWriteTagName(comp.enterTag);
        if (enterWrite) {
          ctx.writeTag(enterWrite, 1);
          setTimeout(() => ctx.writeTag(enterWrite, 0), comp.enterKeyHoldTime ?? 250);
        }
      }
      showValue(text);
    };

    el.addEventListener('click', (e) => {
      e.preventDefault();
      const current = comp.tag ? ctx.getTagValue(comp.tag) : '';
      const input = window.prompt('Enter text:', current !== undefined && current !== null ? String(current) : '');
      if (input === null) return;
      commitValue(input);
    });

    return el;
  },

  formatStringInputValue(val, comp) {
    let text = val != null && val !== '' ? String(val) : '';
    const maxLen = comp.numberOfInputCharacters ?? 8;
    text = text.slice(0, maxLen);
    const fill = String(comp.fillCharacter || 'null').toLowerCase();
    if (text.length < maxLen) {
      if (fill === 'space' || fill === 'spaces') text = text.padEnd(maxLen, ' ');
      else if (fill === 'zero' || fill === 'zeros') text = text.padEnd(maxLen, '0');
      else if (fill === 'ff') text = text.padEnd(maxLen, String.fromCharCode(0xFF));
    }
    if (comp.maskScratchpad && text) {
      return '*'.repeat(text.length);
    }
    return text;
  },

  stringDisplayPlaceholder(comp) {
    const fontSize = Number(comp?.fontSize) || 10;
    const width = Number(comp?.width) || 168;
    const height = Number(comp?.height) || 91;
    const cols = Math.max(4, Math.min(40, Math.round((width - 8) / Math.max(6, fontSize * 0.8))));
    const rows = Math.max(1, Math.min(12, Math.round((height - 8) / Math.max(16, fontSize * 2.05))));
    const line = 'S'.repeat(cols);
    return Array(rows).fill(line).join('\n');
  },

  AlarmTicker(comp, ctx) {
    const studioEdit = Boolean(ctx.studioEdit);
    const el = document.createElement('div');
    el.className = 'ft-alarm-ticker ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.gap = '6px';
    el.style.overflow = 'hidden';
    el.style.backgroundColor = comp.backStyle === 'solid' ? (comp.backColor || '#ffffff') : '#ffffff';
    el.style.fontFamily = comp.fontFamily || 'Arial';
    el.style.fontSize = `${comp.fontSize || 10}px`;
    el.style.fontWeight = comp.bold !== false ? '700' : '400';
    el.style.color = comp.foreColor || '#cc0000';
    el.style.padding = '0 2px';
    const timeEl = document.createElement('span');
    timeEl.className = 'ft-alarm-ticker-time';
    const textEl = document.createElement('span');
    textEl.className = 'ft-alarm-ticker-text';
    el.appendChild(timeEl);
    el.appendChild(textEl);
    const fallback = (comp.caption != null && comp.caption !== '')
      ? comp.caption
      : 'ABCDE FGHIJK LMNOPQ RSTUV WXYZ ABCDE FGHIJK LMNOPQ RSTUV WXYZ';
    const tickTime = () => {
      timeEl.textContent = ComponentRegistry.formatFtShortDateTime();
    };
    tickTime();
    if (!studioEdit) {
      const timerId = setInterval(tickTime, 1000);
      el.dataset.tickerTimer = String(timerId);
    }
    const render = (alarms) => {
      const active = alarms?.active?.filter((a) => !a.acknowledged) || [];
      textEl.textContent = active.length
        ? active.map((a) => a.message).join('   ')
        : fallback;
    };
    render({ active: [] });
    ctx.onAlarmUpdate(render);
    return el;
  },

  Image(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-image ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);

    if (comp.backStyle === 'solid' && comp.useBackColor) {
      el.style.backgroundColor = comp.backColor || '#c0c0c0';
    } else {
      el.style.backgroundColor = 'transparent';
    }

    if (comp.image) {
      const img = document.createElement('img');
      img.className = 'ft-image-picture';
      img.src = ComponentRegistry.imageUrl(comp.image, ctx);
      img.alt = comp.name || comp.image;
      img.draggable = false;
      if (comp.useImageColor) {
        img.style.opacity = '0.85';
      }
      el.appendChild(img);
    } else {
      el.classList.add('ft-image-placeholder');
    }

    return el;
  },

  Text(comp, ctx) {
    const el = document.createElement('div');
    el.className = 'ft-text ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);

    let caption = String(comp.caption ?? comp.label ?? '').replace(/\\n/g, '\n');
    if (comp.name === 'Title' && ctx?.projectSubtitle) {
      caption = ctx.projectSubtitle;
    }
    el.textContent = caption;

    const fontFamily = comp.fontFamily || 'Arial Unicode MS';
    const fontSize = comp.fontSize ?? 10;
    el.style.fontFamily = fontFamily;
    el.style.fontSize = `${fontSize}px`;
    el.style.fontWeight = comp.bold ? '700' : '400';
    el.style.fontStyle = comp.italic ? 'italic' : 'normal';
    el.style.textDecoration = comp.underline ? 'underline' : 'none';

    if (comp.useForeColor !== false) {
      el.style.color = comp.foreColor || '#000000';
    }
    if (comp.useBackColor && comp.backStyle === 'gradient') {
      const start = comp.backColor || '#c6c6c6';
      const end = comp.endColor || '#e8e8e8';
      const stop = comp.gradientStop ?? 95;
      const shading = comp.gradientShadingStyle || comp.gradientDirection || '';
      if (shading === 'gradientHorizontalFromRight') {
        el.style.background = `linear-gradient(to left, ${start} 0%, ${end} ${stop}%)`;
      } else if (shading === 'gradientHorizontalFromLeft') {
        el.style.background = `linear-gradient(to right, ${start} 0%, ${end} ${stop}%)`;
      } else {
        el.style.background = `linear-gradient(to bottom, ${start} 0%, ${end} ${stop}%)`;
      }
    } else if (comp.useBackColor && comp.backStyle === 'solid') {
      el.style.backgroundColor = comp.backColor || '#ffffff';
    } else {
      el.style.backgroundColor = 'transparent';
    }

    if (comp.wordWrap !== false) {
      el.style.whiteSpace = 'pre-wrap';
      el.style.overflowWrap = 'break-word';
    } else {
      el.style.whiteSpace = 'nowrap';
      el.style.overflow = 'hidden';
    }

    const align = ComponentRegistry.textAlignment(comp.alignment || 'middleCenter');
    el.style.display = 'flex';
    el.style.justifyContent = align.justify;
    el.style.alignItems = align.align;

    return el;
  },

  resolveWriteTagName(ref) {
    const s = String(ref || '').trim();
    if (!s) return null;
    if (typeof ExpressionEval !== 'undefined' && ExpressionEval.isExpression(s)) return null;
    return s;
  },

  readIndicatorRef(ref, ctx) {
    const s = String(ref || '').trim();
    if (!s) return undefined;
    if (typeof ExpressionEval !== 'undefined' && ExpressionEval.isExpression(s)) {
      const refs = ExpressionEval.extractTagRefs(s);
      const snap = {};
      refs.forEach((name) => { snap[name] = ctx.getTagValue(name); });
      try {
        return ExpressionEval.evaluate(s, snap);
      } catch {
        return undefined;
      }
    }
    const parsed = window.StudioTagTools?.parseFtTagRef
      ? window.StudioTagTools.parseFtTagRef(s)
      : { tag: s };
    const val = ctx.getTagValue(parsed.tag);
    if (parsed.bit != null && val != null && typeof val === 'object') {
      return val[parsed.bit];
    }
    if (parsed.bit != null && typeof val === 'number') {
      return (val >> parsed.bit) & 1;
    }
    return val;
  },

  bindIndicatorRef(ref, callback, ctx) {
    const s = String(ref || '').trim();
    if (!s) return;
    if (typeof ExpressionEval !== 'undefined' && ExpressionEval.isExpression(s)) {
      ExpressionEval.bindExpression(s, callback, ctx);
      return;
    }
    const parsed = window.StudioTagTools?.parseFtTagRef
      ? window.StudioTagTools.parseFtTagRef(s)
      : { tag: s };
    ctx.bindTag(parsed.tag, (val) => {
      if (parsed.bit != null && val != null && typeof val === 'object') {
        callback(val[parsed.bit]);
      } else if (parsed.bit != null && typeof val === 'number') {
        callback((val >> parsed.bit) & 1);
      } else {
        callback(val);
      }
    });
  },

  applyGraphicsObject(el, comp) {
    if (!ComponentRegistry.isPlacedGraphic(comp)) return;
    if (comp.left != null) el.style.left = `${comp.left}px`;
    if (comp.top != null) el.style.top = `${comp.top}px`;
    if (comp.width != null) el.style.width = `${comp.width}px`;
    if (comp.height != null) el.style.height = `${comp.height}px`;
    el.classList.add('ft-graphic');
    if (comp.type === 'RoundedRectangle') {
      el.style.borderRadius = `${ComponentRegistry.roundedRectCornerRadius(comp)}px`;
      el.style.overflow = 'hidden';
    }
  },

  isPlacedGraphic(comp) {
    return comp != null && (comp.left != null || comp.top != null);
  },

  graphicClass(baseClass, comp) {
    return ComponentRegistry.isPlacedGraphic(comp) ? `${baseClass} ft-graphic` : baseClass;
  },

  textAlignment(id, flexDirection = 'row') {
    const rowMap = {
      topLeft: { justify: 'flex-start', align: 'flex-start' },
      topCenter: { justify: 'center', align: 'flex-start' },
      topRight: { justify: 'flex-end', align: 'flex-start' },
      middleLeft: { justify: 'flex-start', align: 'center' },
      middleCenter: { justify: 'center', align: 'center' },
      middleRight: { justify: 'flex-end', align: 'center' },
      bottomLeft: { justify: 'flex-start', align: 'flex-end' },
      bottomCenter: { justify: 'center', align: 'flex-end' },
      bottomRight: { justify: 'flex-end', align: 'flex-end' }
    };
    const entry = rowMap[id] || rowMap.middleCenter;
    if (flexDirection === 'column') {
      return { justify: entry.align, align: entry.justify };
    }
    return entry;
  },

  defaultTextComponent(overrides = {}) {
    return {
      type: 'Text',
      name: 'Text1',
      caption: '',
      left: 215,
      top: 179,
      width: 352,
      height: 213,
      visible: true,
      fontFamily: 'Arial Unicode MS',
      fontSize: 10,
      bold: false,
      italic: false,
      underline: false,
      foreColor: '#000000',
      useForeColor: true,
      backColor: '#ffffff',
      useBackColor: false,
      backStyle: 'transparent',
      wordWrap: true,
      sizeToFit: true,
      alignment: 'middleCenter',
      ...overrides
    };
  },

  DisplayShell(comp, ctx) {
    const shell = document.createElement('div');
    shell.className = 'ft-display-shell';

    const header = document.createElement('header');
    header.className = 'ft-shell-header';
    const logo = document.createElement('img');
    logo.className = 'ft-shell-logo';
    logo.alt = 'Logo';
    logo.src = ComponentRegistry.imageUrl(comp.logo || 'Cybernetik-Logo_1-removebg-preview.bmp', ctx);
    header.appendChild(logo);

    const title = document.createElement('div');
    title.className = 'ft-shell-title';
    title.textContent = comp.title || ctx.projectSubtitle || 'Processing System';
    header.appendChild(title);

    const headerRight = document.createElement('div');
    headerRight.className = 'ft-shell-header-right';
    const clock = document.createElement('div');
    clock.className = 'ft-shell-clock';
    const tickClock = () => { clock.textContent = new Date().toLocaleString(); };
    tickClock();
    setInterval(tickClock, 1000);
    headerRight.appendChild(clock);

    const indicators = comp.headerIndicators || [
      ComponentRegistry.defaultModeIndicator(),
      ComponentRegistry.defaultHealthIndicator()
    ];
    for (const ind of indicators) {
      headerRight.appendChild(ComponentRegistry.render(ind, ctx));
    }
    header.appendChild(headerRight);
    shell.appendChild(header);

    const body = document.createElement('div');
    body.className = 'ft-shell-body';

    if (comp.showSubNav && comp.navKey) {
      body.appendChild(ComponentRegistry.SubNav({ navKey: comp.navKey }, ctx));
    }

    const content = document.createElement('main');
    content.className = 'ft-shell-content';
    for (const child of comp.children || []) {
      content.appendChild(ComponentRegistry.render(child, ctx));
    }
    body.appendChild(content);
    shell.appendChild(body);

    const footer = document.createElement('nav');
    footer.className = 'ft-shell-footer';
    const mainNav = ctx.navigation?.mainNav || [];
    for (const item of mainNav) {
      if (item.screen === '700_User_Management') continue;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ft-shell-nav-btn';
      const imgFile = item.image || NAV_IMAGES[item.icon] || '';
      if (imgFile) {
        const img = document.createElement('img');
        img.src = ComponentRegistry.imageUrl(imgFile, ctx);
        img.alt = '';
        btn.appendChild(img);
      }
      const cap = document.createElement('span');
      cap.textContent = item.label;
      btn.appendChild(cap);
      btn.addEventListener('click', () => ctx.navigate(item.screen));
      footer.appendChild(btn);
    }

    const userBox = document.createElement('div');
    userBox.className = 'ft-shell-user';
    userBox.textContent = 'Guest';
    ctx.onUserChange((user) => {
      userBox.textContent = user?.username || 'Guest';
    });
    footer.appendChild(userBox);

    const loginBtn = document.createElement('button');
    loginBtn.type = 'button';
    loginBtn.className = 'ft-shell-nav-btn login';
    const loginImg = document.createElement('img');
    loginImg.src = ComponentRegistry.imageUrl(NAV_IMAGES.user, ctx);
    loginImg.alt = '';
    loginBtn.appendChild(loginImg);
    const loginCap = document.createElement('span');
    loginCap.textContent = 'User Login';
    loginBtn.appendChild(loginCap);
    loginBtn.addEventListener('click', () => ctx.navigate('700_User_Management'));
    footer.appendChild(loginBtn);
    shell.appendChild(footer);

    const ticker = document.createElement('div');
    ticker.className = 'ft-shell-ticker';
    const tickerTime = document.createElement('span');
    tickerTime.className = 'ft-shell-ticker-time';
    ticker.appendChild(tickerTime);
    const tickerText = document.createElement('span');
    tickerText.className = 'ft-shell-ticker-text';
    tickerText.textContent = '';
    ticker.appendChild(tickerText);
    const tickTicker = () => { tickerTime.textContent = new Date().toLocaleString(); };
    ctx.onAlarmUpdate((alarms) => {
      const active = alarms.active?.filter((a) => !a.acknowledged) || [];
      if (active.length) {
        tickTicker();
        tickerText.textContent = active.map((a) => a.message).join('   ');
        ticker.style.display = 'flex';
        ticker.classList.add('alarm');
      } else {
        ticker.style.display = 'none';
        tickerText.textContent = '';
        tickerTime.textContent = '';
        ticker.classList.remove('alarm');
      }
    });
    shell.appendChild(ticker);

    return shell;
  },

  imageUrl(fileName, ctx) {
    const pid = ctx.projectId || '';
    if (!pid || !fileName) return '';
    return `/projects/${encodeURIComponent(pid)}/Images/${encodeURIComponent(fileName)}`;
  },

  // Shared by every User Management runtime popup that needs to pick group membership
  // (Add User/Group, Modify Group Membership, Change User Properties): renders a checkbox
  // per real, live group (fetched via ctx.listGroups(), never hardcoded) into `container`,
  // and reads back the checked group ids. A user can check more than one — real multi-group
  // membership, not the old single Role select.
  renderGroupChecklist(container, groups, checkedIds = []) {
    if (!container) return;
    if (!groups.length) {
      container.innerHTML = '<p class="dialog-hint">No groups defined yet — an Administrator needs to create one in Studio under Runtime Security first.</p>';
      return;
    }
    const sorted = [...groups].sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
    container.innerHTML = sorted.map((g) => `
      <label class="dialog-checklist-item">
        <input type="checkbox" value="${escapeHtml(g.id)}" ${checkedIds.includes(g.id) ? 'checked' : ''} />
        <span>${escapeHtml(g.name)} (level ${g.level})</span>
      </label>
    `).join('');
  },

  readGroupChecklist(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map((el) => el.value);
  },

  ensureRuntimeAddUserDialog() {
    let dlg = document.getElementById('runtimeAddUserDialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'runtimeAddUserDialog';
    dlg.className = 'dialog runtime-adduser-dialog';
    dlg.innerHTML = `
      <form method="dialog" onsubmit="return false">
        <h3>Add User/Group</h3>
        <p class="dialog-hint">Create a new user account and assign it to a role/group.</p>
        <label class="dialog-field">
          <span>Username</span>
          <input type="text" id="runtimeAddUserName" autocomplete="off" />
        </label>
        <label class="dialog-field">
          <span>Password</span>
          <input type="password" id="runtimeAddUserPassword" autocomplete="new-password" />
        </label>
        <label class="dialog-field">
          <span>Confirm password</span>
          <input type="password" id="runtimeAddUserConfirm" autocomplete="new-password" />
        </label>
        <div class="dialog-field">
          <span>Groups</span>
          <div id="runtimeAddUserGroups" class="dialog-group-checklist">Loading groups…</div>
        </div>
        <div id="runtimeAddUserStatus" class="runtime-comm-status"></div>
        <div class="dialog-actions">
          <button type="button" id="runtimeAddUserCancel">Cancel</button>
          <button type="button" id="runtimeAddUserSubmit" class="primary">Add User</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector('#runtimeAddUserCancel').addEventListener('click', () => {
      try { dlg.close(); } catch (_) { /* ignore */ }
    });
    dlg.addEventListener('cancel', () => {
      const status = dlg.querySelector('#runtimeAddUserStatus');
      if (status) {
        status.textContent = '';
        status.className = 'runtime-comm-status';
      }
    });
    return dlg;
  },

  ensureRuntimeDeleteUserDialog() {
    let dlg = document.getElementById('runtimeDeleteUserDialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'runtimeDeleteUserDialog';
    dlg.className = 'dialog runtime-adduser-dialog';
    dlg.innerHTML = `
      <form method="dialog" onsubmit="return false">
        <h3>Delete User/Group</h3>
        <p class="dialog-hint">Enter the username to remove. The username is checked before anything is deleted.</p>
        <label class="dialog-field">
          <span>Username</span>
          <input type="text" id="runtimeDeleteUserName" autocomplete="off" />
        </label>
        <div id="runtimeDeleteUserStatus" class="runtime-comm-status"></div>
        <div class="dialog-actions">
          <button type="button" id="runtimeDeleteUserCancel">Cancel</button>
          <button type="button" id="runtimeDeleteUserSubmit" class="primary">Delete User</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector('#runtimeDeleteUserCancel').addEventListener('click', () => {
      try { dlg.close(); } catch (_) { /* ignore */ }
    });
    dlg.addEventListener('cancel', () => {
      const status = dlg.querySelector('#runtimeDeleteUserStatus');
      if (status) {
        status.textContent = '';
        status.className = 'runtime-comm-status';
      }
    });
    return dlg;
  },

ensureModifyGroupDialog() {
    let dlg = document.getElementById('runtimeModifyGroupDialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'runtimeModifyGroupDialog';
    dlg.className = 'dialog runtime-adduser-dialog';
    dlg.innerHTML = `
      <form method="dialog" onsubmit="return false">
        <h3>Modify Group Membership</h3>
        <p class="dialog-hint">Enter the username and check the group(s) it should belong to — this REPLACES the user's full group membership. The username is checked before anything changes.</p>
        <label class="dialog-field">
          <span>Username</span>
          <input type="text" id="runtimeModifyGroupName" autocomplete="off" />
        </label>
        <div class="dialog-field">
          <span>Groups</span>
          <div id="runtimeModifyGroupGroups" class="dialog-group-checklist">Loading groups…</div>
        </div>
        <div id="runtimeModifyGroupStatus" class="runtime-comm-status"></div>
        <div class="dialog-actions">
          <button type="button" id="runtimeModifyGroupCancel">Cancel</button>
          <button type="button" id="runtimeModifyGroupSubmit" class="primary">Modify</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector('#runtimeModifyGroupCancel').addEventListener('click', () => {
      try { dlg.close(); } catch (_) { /* ignore */ }
    });
    dlg.addEventListener('cancel', () => {
      const status = dlg.querySelector('#runtimeModifyGroupStatus');
      if (status) {
        status.textContent = '';
        status.className = 'runtime-comm-status';
      }
    });
    return dlg;
  },

  ensureUnlockUserDialog() {
    let dlg = document.getElementById('runtimeUnlockUserDialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'runtimeUnlockUserDialog';
    dlg.className = 'dialog runtime-adduser-dialog';
    dlg.innerHTML = `
      <form method="dialog" onsubmit="return false">
        <h3>Unlock User</h3>
        <p class="dialog-hint">Enter the username to unlock. The username is checked before anything changes.</p>
        <label class="dialog-field">
          <span>Username</span>
          <input type="text" id="runtimeUnlockUserName" autocomplete="off" />
        </label>
        <div id="runtimeUnlockUserStatus" class="runtime-comm-status"></div>
        <div class="dialog-actions">
          <button type="button" id="runtimeUnlockUserCancel">Cancel</button>
          <button type="button" id="runtimeUnlockUserSubmit" class="primary">Unlock</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector('#runtimeUnlockUserCancel').addEventListener('click', () => {
      try { dlg.close(); } catch (_) { /* ignore */ }
    });
    dlg.addEventListener('cancel', () => {
      const status = dlg.querySelector('#runtimeUnlockUserStatus');
      if (status) {
        status.textContent = '';
        status.className = 'runtime-comm-status';
      }
    });
    return dlg;
  },

  ensureEnableUserDialog() {
    let dlg = document.getElementById('runtimeEnableUserDialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'runtimeEnableUserDialog';
    dlg.className = 'dialog runtime-adduser-dialog';
    dlg.innerHTML = `
      <form method="dialog" onsubmit="return false">
        <h3>Enable User</h3>
        <p class="dialog-hint">Enter the username to enable. The username is checked before anything changes.</p>
        <label class="dialog-field">
          <span>Username</span>
          <input type="text" id="runtimeEnableUserName" autocomplete="off" />
        </label>
        <div id="runtimeEnableUserStatus" class="runtime-comm-status"></div>
        <div class="dialog-actions">
          <button type="button" id="runtimeEnableUserCancel">Cancel</button>
          <button type="button" id="runtimeEnableUserSubmit" class="primary">Enable</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector('#runtimeEnableUserCancel').addEventListener('click', () => {
      try { dlg.close(); } catch (_) { /* ignore */ }
    });
    dlg.addEventListener('cancel', () => {
      const status = dlg.querySelector('#runtimeEnableUserStatus');
      if (status) {
        status.textContent = '';
        status.className = 'runtime-comm-status';
      }
    });
    return dlg;
  },

  ensureDisableUserDialog() {
    let dlg = document.getElementById('runtimeDisableUserDialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'runtimeDisableUserDialog';
    dlg.className = 'dialog runtime-adduser-dialog';
    dlg.innerHTML = `
      <form method="dialog" onsubmit="return false">
        <h3>Disable User</h3>
        <p class="dialog-hint">Enter the username to disable. The username is checked before anything changes.</p>
        <label class="dialog-field">
          <span>Username</span>
          <input type="text" id="runtimeDisableUserName" autocomplete="off" />
        </label>
        <div id="runtimeDisableUserStatus" class="runtime-comm-status"></div>
        <div class="dialog-actions">
          <button type="button" id="runtimeDisableUserCancel">Cancel</button>
          <button type="button" id="runtimeDisableUserSubmit" class="primary">Disable</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector('#runtimeDisableUserCancel').addEventListener('click', () => {
      try { dlg.close(); } catch (_) { /* ignore */ }
    });
    dlg.addEventListener('cancel', () => {
      const status = dlg.querySelector('#runtimeDisableUserStatus');
      if (status) {
        status.textContent = '';
        status.className = 'runtime-comm-status';
      }
    });
    return dlg;
  },

  ensureChangePasswordDialog() {
    let dlg = document.getElementById('runtimeChangePasswordDialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'runtimeChangePasswordDialog';
    dlg.className = 'dialog runtime-adduser-dialog';
    dlg.innerHTML = `
      <form method="dialog" onsubmit="return false">
        <h3>Change Password</h3>
        <p class="dialog-hint">Enter the username and its new password. The username is checked before anything changes.</p>
        <label class="dialog-field">
          <span>Username</span>
          <input type="text" id="runtimeChangePasswordName" autocomplete="off" />
        </label>
        <label class="dialog-field">
          <span>New password</span>
          <input type="password" id="runtimeChangePasswordPassword" autocomplete="new-password" />
        </label>
        <label class="dialog-field">
          <span>Confirm new password</span>
          <input type="password" id="runtimeChangePasswordConfirm" autocomplete="new-password" />
        </label>
        <div id="runtimeChangePasswordStatus" class="runtime-comm-status"></div>
        <div class="dialog-actions">
          <button type="button" id="runtimeChangePasswordCancel">Cancel</button>
          <button type="button" id="runtimeChangePasswordSubmit" class="primary">Save</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector('#runtimeChangePasswordCancel').addEventListener('click', () => {
      try { dlg.close(); } catch (_) { /* ignore */ }
    });
    dlg.addEventListener('cancel', () => {
      const status = dlg.querySelector('#runtimeChangePasswordStatus');
      if (status) {
        status.textContent = '';
        status.className = 'runtime-comm-status';
      }
    });
    return dlg;
  },

  ensureChangePropertiesDialog() {
    let dlg = document.getElementById('runtimeChangePropertiesDialog');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'runtimeChangePropertiesDialog';
    dlg.className = 'dialog runtime-adduser-dialog';
    dlg.innerHTML = `
      <form method="dialog" onsubmit="return false">
        <h3>Change User Properties</h3>
        <p class="dialog-hint">Enter the username, then update its group membership and enabled state. The username is checked before anything changes.</p>
        <label class="dialog-field">
          <span>Username</span>
          <input type="text" id="runtimeChangePropertiesName" autocomplete="off" />
        </label>
        <div class="dialog-field">
          <span>Groups</span>
          <div id="runtimeChangePropertiesGroups" class="dialog-group-checklist">Loading groups…</div>
        </div>
        <label class="dialog-field dialog-check">
          <input type="checkbox" id="runtimeChangePropertiesEnabled" checked />
          <span>Enabled</span>
        </label>
        <div id="runtimeChangePropertiesStatus" class="runtime-comm-status"></div>
        <div class="dialog-actions">
          <button type="button" id="runtimeChangePropertiesCancel">Cancel</button>
          <button type="button" id="runtimeChangePropertiesSubmit" class="primary">Save</button>
        </div>
      </form>
    `;
    document.body.appendChild(dlg);
    dlg.querySelector('#runtimeChangePropertiesCancel').addEventListener('click', () => {
      try { dlg.close(); } catch (_) { /* ignore */ }
    });
    dlg.addEventListener('cancel', () => {
      const status = dlg.querySelector('#runtimeChangePropertiesStatus');
      if (status) {
        status.textContent = '';
        status.className = 'runtime-comm-status';
      }
    });
    return dlg;
  },

  formatValue(val, comp) {
    if (val === null || val === undefined) return '—';
    switch (comp.format) {
      case 'integer': return Math.round(Number(val)).toLocaleString();
      case 'float': return Number(val).toFixed(comp.decimals ?? 1);
      case 'percent': return Number(val).toFixed(comp.decimals ?? 1) + '%';
      case 'string': return String(val);
      case 'boolean': return (val === true || val === 1) ? 'ON' : 'OFF';
      default: return String(val);
    }
  },

  render(comp, ctx) {
    let type = comp.type;
    if (type === 'ChecklistGrid') type = 'ChecklistTable';
    if (type === 'TrendChart') type = 'Trend';
    const renderer = ComponentRegistry[type];
    if (!renderer) {
      const fallback = document.createElement('div');
      fallback.className = 'unknown-component';
      fallback.textContent = `Unknown: ${comp.type}`;
      return fallback;
    }
    return renderer(comp, ctx);
  }
};

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
