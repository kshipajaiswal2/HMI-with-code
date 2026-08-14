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
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
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
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit });
      if (stateDef.image) {
        imgEl = document.createElement('img');
        imgEl.className = 'ft-maintained-btn-icon';
        imgEl.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        imgEl.alt = '';
        imgEl.draggable = false;
        imgEl.style.pointerEvents = 'none';
        imgEl.style.maxWidth = '88%';
        imgEl.style.maxHeight = '88%';
        imgEl.style.objectFit = 'contain';
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
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const defaultState = ComponentRegistry.resolveMultistateState(states, state0Val);

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
      const current = indicatorTag
        ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
        : ctx.getTagValue(comp.tag);
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
      : ComponentRegistry.defaultMaintainedButtonStates(comp.caption ?? comp.label);
    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);

    const indicatorTag = comp.indicatorTag || comp.tag;
    const state0 = states.find((s) => s.id === 'State0') || states[0];
    const state1 = states.find((s) => s.id === 'State1') || states[1];
    const state0Val = state0?.value ?? 0;
    const latchVal = comp.latchValue ?? state1?.value ?? 1;

    const renderState = (stateDef) => {
      if (!stateDef) return;
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit });
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
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    if (indicatorTag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(indicatorTag, showTagState, ctx);
    } else {
      renderState(ComponentRegistry.resolveMultistateState(states, state0Val));
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
      const current = indicatorTag
        ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
        : ctx.getTagValue(comp.tag);
      if (!isLatched(current)) {
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
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);

    const indicatorTag = comp.indicatorTag || comp.tag;
    const userStates = states.filter((s) => s.id !== 'Error');

    const renderState = (stateDef) => {
      if (!stateDef) return;
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit });
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
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    if (indicatorTag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(indicatorTag, showTagState, ctx);
    } else {
      renderState(ComponentRegistry.resolveMultistateState(states, userStates[0]?.value ?? 0));
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
      const current = indicatorTag
        ? ComponentRegistry.readIndicatorRef(indicatorTag, ctx)
        : ctx.getTagValue(comp.tag);
      const resolved = ComponentRegistry.resolveMultistateState(states, current);
      const idx = userStates.findIndex((s) => s.id === resolved?.id);
      const nextIdx = idx < 0 ? 0 : (idx + 1) % userStates.length;
      ctx.writeTag(writeTag, userStates[nextIdx]?.value ?? nextIdx);
    };

    let repeatTimer = null;
    let repeatDelayTimer = null;
    const rate = comp.autoRepeatRate ?? 0;
    const delay = comp.autoRepeatDelay ?? 400;

    const stopRepeat = () => {
      if (repeatDelayTimer) clearTimeout(repeatDelayTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      repeatDelayTimer = null;
      repeatTimer = null;
    };

    const startRepeat = () => {
      advance();
      if (rate <= 0) return;
      repeatDelayTimer = setTimeout(() => {
        repeatTimer = setInterval(advance, rate);
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
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`, value: i, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption: i === 0 ? caption : '',
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleCenter', blink: false
      });
    }
    states.push({
      id: 'Error', backColor: '#001C38', borderColor: '#001C38',
      useBackColor: true, useBorderColor: true, caption: 'Error',
      captionColor: '#ffffff', useCaptionColor: true,
      wordWrap: true, alignment: 'middleCenter', blink: false
    });
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
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);

    let pressed = false;
    const buttonValue = comp.buttonValue ?? 1;
    const releaseValue = 0;
    const state1 = states.find((s) => s.id === 'State1') || states[1];

    const renderState = (stateDef) => {
      if (!stateDef) return;
      const merged = ComponentRegistry.mergeMomentaryState(comp, stateDef);
      ComponentRegistry.applyButtonAppearance(btn, { ...merged, studioEdit });
      caption.textContent = stateDef.caption ?? comp.caption ?? comp.label ?? '';
      const alignId = stateDef.alignment || comp.alignment || 'middleLeft';
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
      btn.classList.toggle('ft-blink', Boolean(stateDef.blink));
    };

    const showTagState = (val) => {
      if (pressed) return;
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showTagState, ctx);
    } else {
      renderState(ComponentRegistry.resolveMultistateState(states, releaseValue));
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
      pressed = true;
      if (state1) renderState(state1);
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (writeTag) ctx.writeTag(writeTag, buttonValue);
    };

    const release = () => {
      if (!pressed) return;
      pressed = false;
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (writeTag) ctx.writeTag(writeTag, releaseValue);
      const val = comp.tag ? ctx.getTagValue(comp.tag) : releaseValue;
      showTagState(val !== undefined ? val : releaseValue);
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
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);

    const renderAppearance = () => {
      ComponentRegistry.applyButtonAppearance(btn, { ...comp, studioEdit });
      caption.textContent = comp.caption ?? comp.label ?? '';
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
    const rate = comp.autoRepeatRate ?? 0;
    const delay = comp.autoRepeatDelay ?? 400;
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
      if (rate <= 0) return;
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(step, rate);
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
    return [
      {
        id: 'State0', value: 0, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption,
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleLeft', blink: false
      },
      {
        id: 'State1', value: 1, backColor: '#001C38', borderColor: '#001C38',
        useBackColor: true, useBorderColor: true, caption,
        captionColor: '#ffffff', useCaptionColor: true,
        wordWrap: true, alignment: 'middleLeft', blink: false
      }
    ];
  },

  defaultMaintainedButtonStates(caption = 'Pump Run') {
    return ComponentRegistry.defaultMomentaryButtonStates(caption);
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
      useBorderColor: Boolean(stateDef.useBorderColor),
      borderColor: stateDef.borderColor || comp.borderColor,
      backStyle: stateDef.backStyle || comp.backStyle || 'solid',
      blink: stateDef.blink
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
    } else if (borderStyle === 'none') {
      el.style.border = 'none';
    } else {
      el.style.border = `${borderWidth}px solid ${borderColor}`;
    }

    if (comp.backStyle === 'solid') {
      el.style.backgroundColor = faceColor;
    } else {
      el.style.backgroundColor = 'transparent';
    }

    if (comp.useHighlightColor && comp.highlightColor) {
      el.style.boxShadow = `inset 0 0 0 2px ${comp.highlightColor}`;
    } else {
      el.style.boxShadow = '';
    }

    el.classList.toggle('ft-blink', Boolean(comp.blink));
    el.style.borderRadius = comp.shape === 'roundedRectangle' ? '4px' : '0';
    el.style.cursor = comp.studioEdit ? 'default' : 'pointer';
    el.style.padding = (comp.width != null && comp.width <= 36) ? '0' : '0 4px';
    el.style.overflow = 'hidden';
    el.style.margin = '0';
    el.style.outline = 'none';
    el.style.boxSizing = 'border-box';
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
        useForeColor: comp.useForeColor !== false,
        wordWrap: false,
        alignment: alignId
      });
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    };
    applyTextStyle();

    const showValue = (val) => {
      valueEl.textContent = ComponentRegistry.formatNumericDisplayValue(val, comp);
    };

    if (comp.tag && !studioEdit) {
      valueEl.textContent = placeholder;
      ComponentRegistry.bindIndicatorRef(comp.tag, showValue, ctx);
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

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.padding = '0 4px';
    el.style.cursor = studioEdit ? 'default' : 'pointer';

    const valueEl = document.createElement('span');
    valueEl.className = 'ft-numeric-display-value';
    valueEl.style.pointerEvents = 'none';
    valueEl.style.width = '100%';
    el.appendChild(valueEl);

    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId);
    el.style.justifyContent = align.justify;
    el.style.alignItems = align.align;

    const showValue = (val) => {
      valueEl.textContent = ComponentRegistry.formatNumericDisplayValue(val, comp);
    };

    if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showValue, ctx);
    } else {
      valueEl.textContent = ComponentRegistry.numericDisplayPlaceholder(comp);
    }

    if (comp.caption) {
      ComponentRegistry.applyCaptionStyle(valueEl, {
        fontFamily: comp.fontFamily,
        fontSize: comp.fontSize,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: comp.captionColor || comp.foreColor || '#ffffff',
        useForeColor: comp.useCaptionColor !== false && comp.useForeColor !== false,
        wordWrap: comp.wordWrap !== false,
        alignment: alignId
      });
    }

    if (studioEdit) {
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
      studioEdit
    });

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.padding = '0 4px';
    el.style.cursor = studioEdit ? 'default' : 'pointer';

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
      useForeColor: comp.useForeColor !== false,
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
    if (fill === 'zero') text = text.padStart(digits, '0');
    else if (fill === 'space') text = text.padStart(digits, ' ');
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
        borderUsesBackColor: stateDef.useBorderColor === false && comp.borderUsesBackColor !== false,
        backStyle: comp.backStyle || 'solid',
        blink: stateDef.blink,
        studioEdit
      };

      if (comp.shape === 'circle') {
        applyLedClass(stateDef);
      } else {
        ComponentRegistry.applyButtonAppearance(el, merged);
      }

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
      caption.style.display = label ? '' : 'none';

      const alignId = stateDef.alignment || 'middleCenter';
      const hasImage = Boolean(stateDef.image);
      if (hasImage) {
        const align = ComponentRegistry.textAlignment(alignId, 'column');
        el.style.flexDirection = 'column';
        el.style.justifyContent = align.justify;
        el.style.alignItems = align.align;
        caption.style.width = '100%';
        caption.style.height = '';
        caption.style.flex = '0 0 auto';
        caption.style.display = '';
      } else {
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
      }

      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily || 'Arial Unicode MS',
        fontSize: comp.fontSize ?? 10,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || stateDef.textColor || '#ffffff',
        useForeColor: stateDef.useCaptionColor !== false,
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
      applyState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const tag = comp.tag || comp.indicatorTag;
    if (tag) {
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
      : ComponentRegistry.defaultSymbolIndicatorStates(comp.numberOfStates ?? 2);

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.backgroundColor = 'transparent';

    const img = document.createElement('img');
    img.className = 'ft-symbol-indicator-image';
    img.alt = comp.name || '';
    img.draggable = false;
    img.style.pointerEvents = 'none';
    el.appendChild(img);

    const applyState = (stateDef) => {
      if (!stateDef) return;
      const alignId = stateDef.imageAlignment || 'middleCenter';
      const align = ComponentRegistry.textAlignment(alignId);
      el.style.justifyContent = align.justify;
      el.style.alignItems = align.align;

      if (stateDef.image) {
        img.src = ComponentRegistry.imageUrl(stateDef.image, ctx);
        img.style.display = '';
      } else {
        img.removeAttribute('src');
        img.style.display = 'none';
      }

      if (stateDef.imageScaled !== false) {
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
      } else {
        img.style.maxWidth = '';
        img.style.maxHeight = '';
        img.style.width = '';
        img.style.height = '';
        img.style.objectFit = '';
      }

      if (stateDef.useImageBackColor && stateDef.imageBackStyle === 'solid') {
        el.style.backgroundColor = stateDef.imageBackColor || '#001C38';
      } else {
        el.style.backgroundColor = 'transparent';
      }

      img.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
      el.classList.toggle('ft-blink', Boolean(stateDef.imageBlink));
    };

    const showTagState = (val) => {
      applyState(ComponentRegistry.resolveMultistateState(states, val));
    };

    const tag = comp.tag || comp.indicatorTag;
    if (tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(tag, showTagState, ctx);
    } else {
      showTagState(studioEdit ? 0 : (comp.defaultValue ?? 0));
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

    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 4,
      borderUsesBackColor: comp.borderUsesBackColor,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      useBorderColor: comp.useBorderColor !== false,
      borderColor: comp.borderColor || '#001C38',
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
        row.style.backgroundColor = comp.useSelectionBackColor !== false
          ? (comp.selectionBackColor || '#0066cc')
          : 'transparent';
        ComponentRegistry.applyCaptionStyle(cap, {
          fontFamily: comp.fontFamily || 'Arial Unicode MS',
          fontSize: comp.fontSize ?? 10,
          bold: comp.bold,
          italic: comp.italic,
          underline: comp.underline,
          foreColor: comp.useSelectionForeColor !== false ? (comp.selectionForeColor || '#000000') : '#ffffff',
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
      const active = ComponentRegistry.resolveMultistateState(states, val);
      rows.forEach((entry) => applyRowStyle(entry, entry.stateDef.id === active?.id));
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    };

    const tag = comp.tag || comp.indicatorTag;
    if (tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(tag, renderList, ctx);
    } else {
      renderList(studioEdit ? 0 : (comp.defaultValue ?? 0));
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
      useBackColor: comp.useBackColor !== false,
      useBorderColor: comp.useBorderColor !== false,
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

    const resolveFillColor = (num) => {
      const count = comp.numberOfThresholds ?? 0;
      const thresholds = comp.thresholds || [];
      if (count >= 2 && num >= (thresholds[1]?.value ?? 75) && thresholds[1]?.useFillColor) {
        return thresholds[1].fillColor || '#ffb6c1';
      }
      if (count >= 1 && num >= (thresholds[0]?.value ?? 50) && thresholds[0]?.useFillColor) {
        return thresholds[0].fillColor || '#ffff00';
      }
      return comp.useFillColor !== false ? (comp.fillColor || '#0066cc') : 'transparent';
    };

    const resolveBlink = (num) => {
      const count = comp.numberOfThresholds ?? 0;
      const thresholds = comp.thresholds || [];
      if (count >= 2 && num >= (thresholds[1]?.value ?? 75) && thresholds[1]?.blink) return true;
      if (count >= 1 && num >= (thresholds[0]?.value ?? 50) && thresholds[0]?.blink) return true;
      return false;
    };

    const applyValue = (val) => {
      const min = comp.minValue ?? 0;
      const max = comp.maxValue ?? 100;
      let num = val;
      if (typeof num === 'string' && num.trim() !== '' && !Number.isNaN(Number(num))) num = Number(num);
      if (typeof num !== 'number' || Number.isNaN(num)) num = min;
      const pct = Math.max(0, Math.min(1, (num - min) / ((max - min) || 1)));
      const dir = comp.fillDirection || 'bottomToTop';

      fill.style.backgroundColor = resolveFillColor(num);
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
      applyValue(studioEdit ? (comp.minValue ?? 0) + ((comp.maxValue ?? 100) - (comp.minValue ?? 0)) * 0.2 : (comp.defaultValue ?? 20));
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

  defaultListIndicatorStates(count = 5) {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`,
        value: i,
        caption: '',
        alignment: 'middleLeft'
      });
    }
    return states;
  },

  defaultSymbolIndicatorStates(count = 2) {
    const states = [];
    for (let i = 0; i < count; i++) {
      states.push({
        id: `State${i}`,
        value: i,
        image: '',
        imageScaled: true,
        imageBackStyle: 'transparent',
        imageAlignment: 'middleCenter'
      });
    }
    states.push({
      id: 'Error',
      image: '',
      imageScaled: true,
      imageBackStyle: 'transparent',
      imageAlignment: 'middleCenter'
    });
    return states;
  },

  resolveMultistateState(states, value) {
    const errorState = states.find((s) => s.id === 'Error' || s.stateId === 'Error');
    if (value === null || value === undefined) return errorState || states[0];

    let num = value;
    if (value === true) num = 1;
    if (value === false) num = 0;
    if (typeof num === 'string' && num.trim() !== '' && !Number.isNaN(Number(num))) {
      num = Number(num);
    }

    const match = states.find((s) => s.value !== undefined && s.value === num);
    return match || errorState || states.find((s) => s.value === 0) || states[0];
  },

  defaultMultistateIndicatorStates(count = 2) {
    const palette = [
      { backColor: '#F83D3D', borderColor: '#C00000' },
      { backColor: '#10EB10', borderColor: '#10EB10' },
      { backColor: '#001C38', borderColor: '#001C38' },
      { backColor: '#F79646', borderColor: '#E36C09' },
      { backColor: '#4F81BD', borderColor: '#1F497D' },
      { backColor: '#8064A2', borderColor: '#5F497A' },
      { backColor: '#C0504D', borderColor: '#953734' },
      { backColor: '#9BBB59', borderColor: '#76923C' }
    ];
    const states = [];
    for (let i = 0; i < count; i++) {
      const colors = palette[i] || palette[palette.length - 1];
      states.push({
        id: `State${i}`,
        value: i,
        useBackColor: true,
        backColor: colors.backColor,
        useBorderColor: true,
        borderColor: colors.borderColor,
        caption: '',
        useCaptionColor: true,
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
    panel.className = comp.style?.className || 'panel';
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
    const borderW = comp.lineWidth ?? comp.borderWidth ?? 1;
    const borderColor = comp.foreColor || comp.borderColor || '#c6c6c6';
    if (comp.backStyle === 'gradient') {
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
    } else if (comp.backStyle === 'transparent') {
      el.style.backgroundColor = 'transparent';
    } else {
      el.style.backgroundColor = comp.backColor || '#ffffff';
    }
    if (comp.borderMode === 'tableRow') {
      el.style.border = 'none';
      el.style.borderBottom = `${borderW}px solid ${borderColor}`;
    } else if (comp.borderMode === 'tableHeader') {
      el.style.border = `${borderW}px solid ${borderColor}`;
      el.style.borderBottom = `${borderW}px solid ${borderColor}`;
    } else if (comp.borderMode === 'tableFrame') {
      el.style.backgroundColor = 'transparent';
      el.style.border = `${borderW}px solid ${borderColor}`;
    } else if (borderW <= 0) {
      el.style.border = 'none';
    } else {
      el.style.border = `${borderW}px solid ${borderColor}`;
    }
    el.style.boxSizing = 'border-box';
    return el;
  },

  Ellipse(comp) {
    const el = document.createElement('div');
    el.className = 'ft-ellipse ft-status-led ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }
    ComponentRegistry.applyGraphicsObject(el, comp);
    const fill = (comp.backColor || '#10EB10').toLowerCase();
    if (fill === '#f83d3d' || fill === 'red') el.classList.add('ft-status-led--red');
    else if (fill === 'navy' || fill === '#000080') el.classList.add('ft-status-led--error');
    else el.classList.add('ft-status-led--green');
    const lineW = comp.lineWidth ?? comp.borderWidth ?? 0;
    if (lineW > 0 && comp.useForeColor !== false) {
      el.style.border = `${lineW}px solid ${comp.foreColor || comp.borderColor || '#000000'}`;
    }
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
      borderUsesBackColor: comp.borderUsesBackColor ?? true,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#dcdcdc',
      useBackColor: comp.useBackColor !== false,
      navSideAccent: comp.navSideAccent,
      studioEdit
    });
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId, 'column');
    btn.style.justifyContent = align.justify;
    btn.style.alignItems = align.align;
    btn.style.padding = '2px 3px 3px';
    btn.style.gap = '0';
    btn.style.overflow = 'hidden';

    let imgEl = null;
    if (comp.image) {
      imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      btn.appendChild(imgEl);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    cap.textContent = comp.label || comp.caption || '';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : comp.useForeColor !== false;
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: alignId
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';
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
      if (target) ctx.navigate(target);
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
      if (comp.userAction) {
        btn.addEventListener('click', () => ComponentRegistry.handleUserAction(comp.userAction, comp, ctx));
      } else if (comp.target || comp.useVariableDisplay) {
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
      studioEdit
    });
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId, 'column');
    btn.style.justifyContent = align.justify;
    btn.style.alignItems = align.align;
    btn.style.padding = '2px 3px 3px';
    btn.style.gap = '0';
    btn.style.overflow = 'hidden';

    if (comp.image) {
      const imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      btn.appendChild(imgEl);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    cap.textContent = comp.label || comp.caption || '';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : comp.useForeColor !== false;
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: alignId
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';
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
      studioEdit
    });
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId, 'column');
    btn.style.justifyContent = align.justify;
    btn.style.alignItems = align.align;
    btn.style.padding = '2px 3px 3px';
    btn.style.gap = '0';
    btn.style.overflow = 'hidden';

    if (comp.image) {
      const imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      btn.appendChild(imgEl);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    cap.textContent = comp.label || comp.caption || '';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : comp.useForeColor !== false;
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: alignId
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';
    btn.appendChild(cap);
    btn.classList.toggle('ft-blink', Boolean(comp.blink));

    const runRecipeAction = () => {
      ctx.navigate('500_Recipe');
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
    const activeCol = columns.find((c) => c.id === (comp.activeColumnId || 'recipe')) || columns[0];

    ComponentRegistry.applyButtonAppearance(el, {
      ...comp,
      borderStyle: comp.borderStyle || 'line',
      borderWidth: comp.borderWidth ?? 1,
      borderUsesBackColor: comp.borderUsesBackColor !== false,
      backStyle: comp.backStyle || 'solid',
      backColor: comp.backColor || '#001C38',
      useBackColor: comp.useBackColor !== false,
      useBorderColor: comp.useBorderColor !== false,
      borderColor: comp.borderColor || '#000000',
      studioEdit
    });

    el.style.padding = '0';
    el.style.overflow = 'hidden';

    const fontBase = {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold,
      italic: comp.italic,
      underline: comp.underline
    };

    let headerEl = null;
    if (comp.displayHeader !== false) {
      headerEl = document.createElement('div');
      headerEl.className = 'ft-recipeplus-selector-header';
      headerEl.textContent = activeCol?.headerText || activeCol?.label || 'Recipe';
      if (comp.useHeaderBackColor !== false) {
        headerEl.style.backgroundColor = comp.headerBackColor || '#001C38';
      }
      ComponentRegistry.applyCaptionStyle(headerEl, {
        ...fontBase,
        foreColor: comp.useHeaderForeColor !== false ? (comp.headerForeColor || '#ffffff') : '#ffffff',
        useForeColor: true,
        wordWrap: false,
        alignment: 'middleLeft'
      });
      el.appendChild(headerEl);
    }

    const body = document.createElement('div');
    body.className = 'ft-recipeplus-selector-body';
    el.appendChild(body);

    const demoRows = ComponentRegistry.defaultRecipePlusSelectorRows();
    let selectedIndex = studioEdit ? 1 : (comp.selectedIndex ?? 1);

    const rows = demoRows.map((text, index) => {
      const row = document.createElement('div');
      row.className = 'ft-recipeplus-selector-row';
      row.dataset.index = String(index);

      const cell = document.createElement('span');
      cell.className = 'ft-recipeplus-selector-cell';
      cell.textContent = text;
      row.appendChild(cell);
      body.appendChild(row);
      return { row, cell };
    });

    const applySelection = (index) => {
      selectedIndex = index;
      rows.forEach(({ row, cell }, i) => {
        const isActive = i === selectedIndex;
        if (isActive) {
          row.style.backgroundColor = comp.useSelectionBackColor !== false
            ? (comp.selectionBackColor || '#0066cc')
            : 'transparent';
          ComponentRegistry.applyCaptionStyle(cell, {
            ...fontBase,
            foreColor: comp.useSelectionForeColor !== false ? (comp.selectionForeColor || '#000000') : '#ffffff',
            useForeColor: true,
            wordWrap: comp.wordWrap !== false,
            alignment: 'middleLeft'
          });
          if (comp.wordWrap === false) cell.style.whiteSpace = 'nowrap';
          else cell.style.whiteSpace = 'normal';
        } else {
          row.style.backgroundColor = 'transparent';
          ComponentRegistry.applyCaptionStyle(cell, {
            ...fontBase,
            foreColor: comp.useForeColor !== false ? (comp.foreColor || '#ffffff') : '#ffffff',
            useForeColor: true,
            wordWrap: comp.wordWrap !== false,
            alignment: 'middleLeft'
          });
          if (comp.wordWrap === false) cell.style.whiteSpace = 'nowrap';
          else cell.style.whiteSpace = 'normal';
        }
        row.classList.toggle('ft-recipeplus-selector-row--active', isActive);
      });
    };

    applySelection(selectedIndex);

    if (!studioEdit) {
      rows.forEach(({ row }, index) => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => applySelection(index));
      });
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
    const sample = 'recipe recipe recipe rec';
    return Array.from({ length: 6 }, () => sample);
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
      studioEdit
    });
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    const alignId = comp.alignment || 'middleCenter';
    const align = ComponentRegistry.textAlignment(alignId, 'column');
    btn.style.justifyContent = align.justify;
    btn.style.alignItems = align.align;
    btn.style.padding = '2px 3px 3px';
    btn.style.gap = '0';
    btn.style.overflow = 'hidden';

    if (comp.image) {
      const imgEl = document.createElement('img');
      imgEl.className = 'ft-goto-btn-icon';
      imgEl.src = ComponentRegistry.imageUrl(comp.image, ctx);
      imgEl.alt = '';
      imgEl.draggable = false;
      if (comp.imageScaled) {
        imgEl.classList.add('ft-goto-btn-icon-scaled');
      }
      if (comp.useImageBackColor && comp.imageBackStyle === 'solid') {
        imgEl.style.backgroundColor = comp.imageBackColor || '#001C38';
      }
      imgEl.classList.toggle('ft-blink', Boolean(comp.imageBlink));
      btn.appendChild(imgEl);
    }

    const cap = document.createElement('span');
    cap.className = 'ft-goto-btn-caption';
    cap.textContent = comp.label || comp.caption || '';
    const useCaptionColor = comp.useCaptionColor !== undefined ? comp.useCaptionColor : comp.useForeColor !== false;
    ComponentRegistry.applyCaptionStyle(cap, {
      fontFamily: comp.fontFamily || 'Arial Unicode MS',
      fontSize: comp.fontSize ?? 10,
      bold: comp.bold ?? false,
      italic: comp.italic,
      underline: comp.underline,
      foreColor: comp.foreColor || '#000000',
      useForeColor: useCaptionColor,
      wordWrap: comp.wordWrap !== false,
      alignment: alignId
    });
    if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
      cap.style.backgroundColor = comp.captionBackColor || '#001C38';
    }
    cap.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    cap.style.width = '100%';
    cap.style.lineHeight = '1.15';
    cap.style.pointerEvents = 'none';
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

  DisplayListSelector(comp, ctx) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ft-display-list-btn ft-multistate-btn ft-graphic';
    if (comp.name) btn.dataset.name = comp.name;
    if (comp.visible === false) {
      btn.style.display = 'none';
      return btn;
    }

    ComponentRegistry.applyGraphicsObject(btn, comp);
    const studioEdit = Boolean(ctx.studioEdit);
    const states = comp.states?.length
      ? comp.states
      : ComponentRegistry.defaultDisplayListSelectorStates(comp.numberOfStates ?? 5);

    const caption = document.createElement('span');
    caption.className = 'ft-btn-caption';
    caption.style.pointerEvents = 'none';
    btn.style.display = 'flex';
    btn.style.padding = '0 4px';
    btn.style.overflow = 'hidden';
    btn.appendChild(caption);

    const renderState = (stateDef) => {
      if (!stateDef) return;
      ComponentRegistry.applyButtonAppearance(btn, {
        ...comp,
        borderStyle: comp.borderStyle || 'line',
        borderWidth: comp.borderWidth ?? 1,
        borderUsesBackColor: comp.borderUsesBackColor !== false,
        backStyle: comp.backStyle || 'solid',
        backColor: comp.backColor || '#001C38',
        useBackColor: comp.useBackColor !== false,
        useHighlightColor: comp.useHighlightColor,
        highlightColor: comp.highlightColor,
        studioEdit
      });

      let capText = stateDef.caption ?? '';
      if (stateDef.useDisplayName && stateDef.target) capText = stateDef.target;
      caption.textContent = capText;

      const alignId = stateDef.alignment || 'middleLeft';
      const align = ComponentRegistry.textAlignment(alignId);
      btn.style.justifyContent = align.justify;
      btn.style.alignItems = align.align;

      ComponentRegistry.applyCaptionStyle(caption, {
        fontFamily: comp.fontFamily || 'Arial Unicode MS',
        fontSize: comp.fontSize ?? 10,
        bold: comp.bold,
        italic: comp.italic,
        underline: comp.underline,
        foreColor: stateDef.captionColor || '#ffffff',
        useForeColor: Boolean(stateDef.useCaptionColor),
        alignment: alignId
      });
      if (stateDef.useCaptionBackColor && stateDef.captionBackStyle === 'solid') {
        caption.style.backgroundColor = stateDef.captionBackColor || '#001C38';
      } else {
        caption.style.backgroundColor = '';
      }
      caption.classList.toggle('ft-blink', Boolean(stateDef.captionBlink));
    };

    const showTagState = (val) => {
      renderState(ComponentRegistry.resolveMultistateState(states, val));
    };

    if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showTagState, ctx);
    } else {
      renderState(states[0]);
    }

    if (studioEdit) {
      btn.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-dblclick',
          name: comp.name || '',
          componentType: 'DisplayListSelector',
          source: comp._source || ''
        }, '*');
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.parent.postMessage({
          type: 'planthmi-embed-graphic-click',
          name: comp.name || '',
          componentType: 'DisplayListSelector',
          source: comp._source || ''
        }, '*');
      });
      return btn;
    }

    const advance = () => {
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const current = ctx.getTagValue(comp.tag);
      const resolved = ComponentRegistry.resolveMultistateState(states, current);
      const idx = states.findIndex((s) => s.id === resolved?.id);
      const nextIdx = idx < 0 ? 0 : (idx + 1) % states.length;
      const nextState = states[nextIdx];
      const nextValue = nextState?.value ?? nextIdx;
      ctx.writeTag(writeTag, nextValue);
      if (nextState?.target) ctx.navigate(nextState.target);
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      advance();
    });
    return btn;
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

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.padding = '2px 4px';

    const valueEl = document.createElement('span');
    valueEl.className = 'ft-string-display-value';
    valueEl.style.pointerEvents = 'none';
    valueEl.style.width = '100%';
    el.appendChild(valueEl);

    const alignId = comp.alignment || 'middleLeft';
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
        useForeColor: comp.useForeColor !== false,
        wordWrap: comp.wordWrap !== false,
        alignment: alignId
      });
      el.classList.toggle('ft-blink', Boolean(comp.blink));
    };
    applyTextStyle();

    const placeholder = ComponentRegistry.stringDisplayPlaceholder(comp);
    const showValue = (val) => {
      valueEl.textContent = val != null && val !== '' ? String(val) : (comp.caption || '');
    };

    if (comp.useCurrentUser && !studioEdit) {
      const renderUser = (user) => showValue(user?.username || comp.caption || 'Guest');
      renderUser(ctx.getCurrentUser?.());
      ctx.onUserChange?.(renderUser);
    } else if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showValue, ctx);
    } else if (studioEdit) {
      valueEl.textContent = comp.useCurrentUser
        ? placeholder
        : (comp.caption || placeholder);
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

    el.style.display = 'flex';
    el.style.overflow = 'hidden';
    el.style.padding = '2px 4px';
    el.style.cursor = studioEdit ? 'default' : 'pointer';

    const valueEl = document.createElement('span');
    valueEl.className = 'ft-string-input-value';
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
        foreColor: comp.captionColor || comp.foreColor || '#ffffff',
        useForeColor: comp.useCaptionColor || comp.useForeColor !== false,
        wordWrap: comp.wordWrap !== false,
        alignment: alignId
      });
      if (comp.useCaptionBackColor && comp.captionBackStyle === 'solid') {
        valueEl.style.backgroundColor = comp.captionBackColor || '#001C38';
      } else {
        valueEl.style.backgroundColor = 'transparent';
      }
      el.classList.toggle('ft-blink', Boolean(comp.blink));
      valueEl.classList.toggle('ft-blink', Boolean(comp.captionBlink));
    };
    applyTextStyle();

    const showValue = (val) => {
      if (studioEdit) return;
      const text = ComponentRegistry.formatStringInputValue(val, comp);
      valueEl.textContent = text || comp.caption || '';
    };

    if (comp.tag && !studioEdit) {
      ComponentRegistry.bindIndicatorRef(comp.tag, showValue, ctx);
    } else if (!studioEdit) {
      showValue(comp.caption);
    } else {
      valueEl.textContent = '';
    }

    if (studioEdit) {
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

    const commitValue = (raw) => {
      const writeTag = ComponentRegistry.resolveWriteTagName(comp.tag);
      if (!writeTag) return;
      const maxLen = comp.numberOfInputCharacters ?? 8;
      let text = String(raw ?? '').slice(0, maxLen);
      if (comp.fillCharacter === 'space' && text.length < maxLen) {
        text = text.padEnd(maxLen, ' ');
      }
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
    if (comp.fillCharacter === 'space' && text.length < maxLen) {
      text = text.padEnd(maxLen, ' ');
    }
    if (comp.maskScratchpad && text) {
      return '*'.repeat(text.length);
    }
    return text;
  },

  stringDisplayPlaceholder(comp) {
    const line = 's'.repeat(14);
    const lines = Math.max(2, Math.min(8, Math.round((comp?.height || 80) / 18)));
    return Array(lines).fill(line).join('\n');
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

  Text(comp) {
    const el = document.createElement('div');
    el.className = 'ft-text ft-graphic';
    if (comp.name) el.dataset.name = comp.name;
    if (comp.visible === false) {
      el.style.display = 'none';
      return el;
    }

    ComponentRegistry.applyGraphicsObject(el, comp);

    const caption = String(comp.caption ?? comp.label ?? '').replace(/\\n/g, '\n');
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
    return ctx.getTagValue(s);
  },

  bindIndicatorRef(ref, callback, ctx) {
    const s = String(ref || '').trim();
    if (!s) return;
    if (typeof ExpressionEval !== 'undefined' && ExpressionEval.isExpression(s)) {
      ExpressionEval.bindExpression(s, callback, ctx);
    } else {
      ctx.bindTag(s, callback);
    }
  },

  applyGraphicsObject(el, comp) {
    if (!ComponentRegistry.isPlacedGraphic(comp)) return;
    if (comp.left != null) el.style.left = `${comp.left}px`;
    if (comp.top != null) el.style.top = `${comp.top}px`;
    if (comp.width != null) el.style.width = `${comp.width}px`;
    if (comp.height != null) el.style.height = `${comp.height}px`;
    el.classList.add('ft-graphic');
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
