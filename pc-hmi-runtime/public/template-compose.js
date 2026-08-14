/** Shared template + display composition (browser + Node) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TemplateCompose = factory();
  }
}(typeof self !== 'undefined' ? self : this, function templateComposeFactory() {
  const FLOW_COMPONENT_TYPES = new Set([
    'SubNav', 'Panel', 'Grid', 'SectionHeader', 'DataTable', 'AlarmTable',
    'LegendTable', 'LoginPanel', 'MimicPanel', 'ChecklistGrid', 'ControlRow',
    'StatusRow', 'PlaceholderScreen', 'AccessDenied', 'NavButton',
    'ActionButton', 'ToggleButton', 'MomentaryButton', 'NumericDisplay', 'StateIndicator'
  ]);

  function isFlowComponent(comp) {
    if (!comp || comp.type === 'ContentArea') return false;
    if (comp.left != null || comp.top != null) return false;
    return FLOW_COMPONENT_TYPES.has(comp.type);
  }

  function isEmptyFlowComponent(comp) {
    if (!comp) return true;
    if (comp.type === 'Panel' || comp.type === 'Grid' || comp.type === 'SubNav') {
      return !(comp.children && comp.children.length);
    }
    return false;
  }

  function hasVisibleFlowContent(flowScreen) {
    return flowScreen.some((comp) => !isEmptyFlowComponent(comp));
  }

  function deriveContentBounds(templateComponents, runtime = {}) {
    const width = runtime.width || 800;
    const height = runtime.height || 600;
    const header = templateComponents.find((c) => c.name === 'HeaderBar');
    const footer = templateComponents.find((c) => c.name === 'FooterBar');
    const top = header ? (header.top || 0) + (header.height || 0) : Math.round(height * 0.105);
    const footerTop = footer?.top ?? height - Math.round(height * 0.105);
    return {
      left: 0,
      top,
      width,
      height: Math.max(0, footerTop - top)
    };
  }

  const OVERVIEW_NAV_ITEMS = [
    { target: '101_Production_Data', label: 'Production\nData', top: 96 },
    { target: '102_Prestart', label: 'Prestart', top: 168 },
    { target: '103_Safety', label: 'Safety', top: 240 },
    { target: '104_Mimic_Screen', label: 'Mimic\nScreen', top: 312 }
  ];

  const MANUAL_NAV_ITEMS = [
    { target: '301_PLC_IO_List', label: 'PLC Input\nOutput List', top: 96 },
    { target: '302_PLC_Architecture', label: 'PLC\nArchitecture', top: 168 },
    { target: '303_Run_Count', label: 'Run\nTime', top: 240 },
    { target: '304_Cycle_Time', label: 'Cycle\nTime', top: 312 },
    { target: '305_Network', label: 'Network', top: 384 }
  ];

  const ALARM_NAV_ITEMS = [
    { target: '400_Active_Alarms', label: 'Active\nAlarms', top: 96 },
    { target: '401_Alarm_History', label: 'Alarm\nHistory', top: 168 },
    { target: '402_Alarm_Remedies_Popup', label: 'Alarm\nRemedy', top: 240 }
  ];

  /** Overview nav uses fixed 800×600-friendly sizes (FT 85×45 @ 1024 feels too tight when scaled). */
  const OVERVIEW_NAV_GEOMETRY = { left: 8, width: 72, height: 40 };
  const MANUAL_NAV_GEOMETRY = { left: 8, width: 66, height: 35 };
  const ALARM_NAV_GEOMETRY = { left: 8, width: 66, height: 35 };

  const DISPLAY_SCALE = 800 / 1024;

  function scaleCoord(value) {
    return Math.round(value * DISPLAY_SCALE);
  }

  function buildOverviewShell(rawScreen) {
    if (rawScreen.navGroup !== 'overview') return [];

    const overrides = rawScreen.overviewShell || {};
    const screenId = rawScreen.id;
    const shell = OVERVIEW_NAV_ITEMS.map((item) => {
      const name = `OverviewNav_${item.target}`;
      const isActive = screenId === item.target;
      const custom = overrides[name] || {};
      return {
        type: 'GotoButton',
        name,
        label: item.label,
        target: item.target,
        left: custom.left ?? OVERVIEW_NAV_GEOMETRY.left,
        top: custom.top ?? scaleCoord(item.top),
        width: custom.width ?? OVERVIEW_NAV_GEOMETRY.width,
        height: custom.height ?? OVERVIEW_NAV_GEOMETRY.height,
        useBackColor: custom.useBackColor ?? true,
        backColor: custom.backColor ?? '#dcdcdc',
        backStyle: custom.backStyle ?? 'solid',
        borderStyle: custom.borderStyle ?? 'raised',
        borderWidth: custom.borderWidth ?? 2,
        fontSize: custom.fontSize ?? 9,
        bold: custom.bold ?? true,
        alignment: custom.alignment ?? 'middleCenter',
        visible: custom.visible !== false,
        audio: custom.audio !== false,
        ...custom,
        name,
        target: item.target,
        label: custom.label ?? item.label,
        useBorderColor: custom.useBorderColor ?? isActive,
        borderColor: custom.borderColor ?? (isActive ? '#F99746' : '#E0E0E0'),
        borderUsesBackColor: custom.borderUsesBackColor ?? (isActive ? false : true),
        foreColor: custom.foreColor ?? '#000000',
        useForeColor: custom.useForeColor !== false,
        navSideAccent: custom.navSideAccent ?? (isActive && custom.borderColor == null),
        _source: 'shell'
      };
    });

    const subtitleOverride = overrides.ScreenSubtitle || {};
    shell.push({
      type: 'Text',
      name: 'ScreenSubtitle',
      caption: subtitleOverride.caption ?? rawScreen.subtitle ?? rawScreen.title ?? '',
      left: subtitleOverride.left ?? scaleCoord(437),
      top: subtitleOverride.top ?? scaleCoord(34),
      width: subtitleOverride.width ?? scaleCoord(151),
      height: subtitleOverride.height ?? scaleCoord(22),
      fontFamily: subtitleOverride.fontFamily ?? 'Arial',
      fontSize: subtitleOverride.fontSize ?? 14,
      bold: subtitleOverride.bold ?? true,
      foreColor: subtitleOverride.foreColor ?? '#000000',
      backStyle: subtitleOverride.backStyle ?? 'transparent',
      alignment: subtitleOverride.alignment ?? 'middleCenter',
      wordWrap: subtitleOverride.wordWrap ?? false,
      visible: subtitleOverride.visible !== false,
      ...subtitleOverride,
      name: 'ScreenSubtitle',
      _source: 'shell'
    });

    return shell;
  }

  function buildManualShell(rawScreen) {
    if (rawScreen.navGroup !== 'manual') return [];

    const overrides = rawScreen.manualShell || {};
    const screenId = rawScreen.id;
    const shell = MANUAL_NAV_ITEMS.map((item) => {
      const name = `ManualNav_${item.target}`;
      const isActive = screenId === item.target;
      const custom = overrides[name] || {};
      return {
        type: 'GotoButton',
        name,
        label: item.label,
        target: item.target,
        left: custom.left ?? MANUAL_NAV_GEOMETRY.left,
        top: custom.top ?? scaleCoord(item.top),
        width: custom.width ?? MANUAL_NAV_GEOMETRY.width,
        height: custom.height ?? MANUAL_NAV_GEOMETRY.height,
        useBackColor: custom.useBackColor ?? true,
        backColor: custom.backColor ?? '#dcdcdc',
        backStyle: custom.backStyle ?? 'solid',
        borderStyle: custom.borderStyle ?? 'raised',
        borderWidth: custom.borderWidth ?? 3,
        fontSize: custom.fontSize ?? 9,
        bold: custom.bold ?? true,
        alignment: custom.alignment ?? 'middleCenter',
        wordWrap: custom.wordWrap ?? true,
        visible: custom.visible !== false,
        audio: custom.audio !== false,
        ...custom,
        name,
        target: item.target,
        label: custom.label ?? item.label,
        caption: custom.caption ?? custom.label ?? item.label,
        foreColor: custom.foreColor ?? '#000000',
        useForeColor: custom.useForeColor !== false,
        navSideAccent: custom.navSideAccent ?? (isActive && custom.borderColor == null),
        useBorderColor: custom.useBorderColor ?? isActive,
        borderColor: custom.borderColor ?? (isActive ? '#F99746' : '#E0E0E0'),
        borderUsesBackColor: custom.borderUsesBackColor ?? !isActive,
        _source: 'shell'
      };
    });

    const subtitleOverride = overrides.ScreenSubtitle || {};
    shell.push({
      type: 'Text',
      name: 'ScreenSubtitle',
      caption: subtitleOverride.caption ?? rawScreen.subtitle ?? rawScreen.title ?? '',
      left: subtitleOverride.left ?? scaleCoord(437),
      top: subtitleOverride.top ?? scaleCoord(34),
      width: subtitleOverride.width ?? scaleCoord(151),
      height: subtitleOverride.height ?? scaleCoord(22),
      fontFamily: subtitleOverride.fontFamily ?? 'Arial',
      fontSize: subtitleOverride.fontSize ?? 14,
      bold: subtitleOverride.bold ?? true,
      foreColor: subtitleOverride.foreColor ?? '#000000',
      backStyle: subtitleOverride.backStyle ?? 'transparent',
      alignment: subtitleOverride.alignment ?? 'middleCenter',
      wordWrap: subtitleOverride.wordWrap ?? false,
      visible: subtitleOverride.visible !== false,
      ...subtitleOverride,
      name: 'ScreenSubtitle',
      _source: 'shell'
    });

    return shell;
  }

  function buildAlarmsShell(rawScreen) {
    if (rawScreen.navGroup !== 'alarms') return [];

    const overrides = rawScreen.alarmsShell || {};
    const screenId = rawScreen.id;
    const shell = ALARM_NAV_ITEMS.map((item) => {
      const name = `AlarmNav_${item.target}`;
      const isActive = screenId === item.target;
      const custom = overrides[name] || {};
      return {
        type: 'GotoButton',
        name,
        label: item.label,
        caption: item.label,
        target: item.target,
        left: custom.left ?? ALARM_NAV_GEOMETRY.left,
        top: custom.top ?? scaleCoord(item.top),
        width: custom.width ?? ALARM_NAV_GEOMETRY.width,
        height: custom.height ?? ALARM_NAV_GEOMETRY.height,
        useBackColor: custom.useBackColor ?? true,
        backColor: custom.backColor ?? '#dcdcdc',
        backStyle: custom.backStyle ?? 'solid',
        borderStyle: custom.borderStyle ?? 'raised',
        borderWidth: custom.borderWidth ?? 3,
        fontSize: custom.fontSize ?? 9,
        bold: custom.bold ?? true,
        foreColor: custom.foreColor ?? '#000000',
        useForeColor: custom.useForeColor !== false,
        alignment: custom.alignment ?? 'middleCenter',
        wordWrap: custom.wordWrap ?? true,
        visible: custom.visible !== false,
        audio: custom.audio !== false,
        ...custom,
        name,
        target: item.target,
        label: custom.label ?? item.label,
        caption: custom.caption ?? custom.label ?? item.label,
        foreColor: custom.foreColor ?? '#000000',
        useForeColor: custom.useForeColor !== false,
        navSideAccent: custom.navSideAccent ?? (isActive && custom.borderColor == null),
        useBorderColor: custom.useBorderColor ?? isActive,
        borderColor: custom.borderColor ?? (isActive ? '#F99746' : '#E0E0E0'),
        borderUsesBackColor: custom.borderUsesBackColor ?? !isActive,
        _source: 'shell'
      };
    });

    const subtitleOverride = overrides.ScreenSubtitle || {};
    shell.push({
      type: 'Text',
      name: 'ScreenSubtitle',
      caption: subtitleOverride.caption ?? rawScreen.subtitle ?? rawScreen.title ?? '',
      left: subtitleOverride.left ?? scaleCoord(448),
      top: subtitleOverride.top ?? scaleCoord(34),
      width: subtitleOverride.width ?? scaleCoord(128),
      height: subtitleOverride.height ?? scaleCoord(22),
      fontFamily: subtitleOverride.fontFamily ?? 'Arial',
      fontSize: subtitleOverride.fontSize ?? 14,
      bold: subtitleOverride.bold ?? true,
      foreColor: subtitleOverride.foreColor ?? '#000000',
      backStyle: subtitleOverride.backStyle ?? 'transparent',
      alignment: subtitleOverride.alignment ?? 'middleCenter',
      wordWrap: subtitleOverride.wordWrap ?? false,
      visible: subtitleOverride.visible !== false,
      ...subtitleOverride,
      name: 'ScreenSubtitle',
      _source: 'shell'
    });

    return shell;
  }

  function buildSettingsShell(rawScreen) {
    if (rawScreen.navGroup !== 'settings') return [];

    const overrides = rawScreen.settingsShell || {};
    const subtitleOverride = overrides.ScreenSubtitle || {};
    return [{
      type: 'Text',
      name: 'ScreenSubtitle',
      caption: subtitleOverride.caption ?? rawScreen.subtitle ?? rawScreen.title ?? '',
      left: subtitleOverride.left ?? scaleCoord(476),
      top: subtitleOverride.top ?? scaleCoord(44),
      width: subtitleOverride.width ?? scaleCoord(73),
      height: subtitleOverride.height ?? scaleCoord(24),
      fontFamily: subtitleOverride.fontFamily ?? 'Arial',
      fontSize: subtitleOverride.fontSize ?? 14,
      bold: subtitleOverride.bold ?? true,
      foreColor: subtitleOverride.foreColor ?? '#000000',
      backStyle: subtitleOverride.backStyle ?? 'transparent',
      alignment: subtitleOverride.alignment ?? 'middleCenter',
      wordWrap: subtitleOverride.wordWrap ?? false,
      visible: subtitleOverride.visible !== false,
      ...subtitleOverride,
      name: 'ScreenSubtitle',
      _source: 'shell'
    }];
  }

  function resolveTemplateConfig(screen) {
    const cfg = screen.template || {};
    const enabled = cfg.enabled !== false
      && screen.kind !== 'global-object'
      && screen.layout !== 'global'
      && screen.layout !== 'popup';
    return {
      enabled,
      globalObjectId: cfg.globalObjectId || 'Template',
      contentBounds: cfg.contentBounds || null,
      hide: Array.isArray(cfg.hide) ? cfg.hide : [],
      replace: cfg.replace && typeof cfg.replace === 'object' ? cfg.replace : {}
    };
  }

  function applyTemplateOverrides(templateComponents, templateConfig, screenComponents) {
    const hideSet = new Set(templateConfig.hide);
    const screenByName = new Map();
    for (let i = 0; i < screenComponents.length; i += 1) {
      const comp = screenComponents[i];
      if (comp?.name) screenByName.set(comp.name, { comp, index: i });
    }

    const consumedNames = new Set();

    const merged = templateComponents
      .filter((c) => !hideSet.has(c.name))
      .map((c, templateIndex) => {
        const replacement = c.name ? screenByName.get(c.name) : null;
        if (replacement) {
          consumedNames.add(c.name);
          return {
            ...c,
            ...replacement.comp,
            _source: 'display',
            _templateIndex: templateIndex,
            _displayIndex: replacement.index,
            _replacesTemplate: true
          };
        }
        const partial = c.name ? templateConfig.replace[c.name] : null;
        const next = partial ? { ...c, ...partial } : { ...c };
        return { ...next, _source: 'template', _templateIndex: templateIndex };
      });

    return { merged, consumedNames };
  }

  function composeScreen(rawScreen, templateObject, runtime = {}) {
    if (!rawScreen) return null;

    const templateConfig = resolveTemplateConfig(rawScreen);
    const screenComponents = rawScreen.components || [];

    if (!templateConfig.enabled || !templateObject?.components?.length) {
      return {
        ...rawScreen,
        _composed: false,
        components: screenComponents.map((comp, index) => ({
          ...comp,
          _source: 'display',
          _displayIndex: index
        }))
      };
    }

    const templateComponents = templateObject.components || [];
    const bounds = templateConfig.contentBounds
      || deriveContentBounds(templateComponents, runtime);

    const { merged, consumedNames } = applyTemplateOverrides(
      templateComponents,
      templateConfig,
      screenComponents
    );

    const absoluteScreen = [];
    const flowScreen = [];

    for (let i = 0; i < screenComponents.length; i += 1) {
      const comp = screenComponents[i];
      if (comp.name && consumedNames.has(comp.name)) continue;
      const tagged = { ...comp, _source: 'display', _displayIndex: i };
      if (isFlowComponent(comp)) flowScreen.push(tagged);
      else absoluteScreen.push(tagged);
    }

    const contentArea = hasVisibleFlowContent(flowScreen)
      ? [{
        type: 'ContentArea',
        name: '__displayContent',
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        children: flowScreen,
        _source: 'display',
        _displayIndex: null
      }]
      : [];

    const footerBar = merged.find((c) => c.name === 'FooterBar');
    const splitY = footerBar?.top ?? bounds.top + bounds.height;
    const templateAbove = merged.filter((c) => {
      if (c.name === 'AlarmTicker') return false;
      const top = c.top ?? 0;
      return top < splitY;
    });
    const templateBelow = merged.filter((c) => {
      if (c.name === 'AlarmTicker') return true;
      const top = c.top ?? 0;
      return top >= splitY;
    });

    const overviewShell = buildOverviewShell(rawScreen);
    const manualShell = buildManualShell(rawScreen);
    const settingsShell = buildSettingsShell(rawScreen);
    const alarmsShell = buildAlarmsShell(rawScreen);
    const sideShell = overviewShell.length
      ? overviewShell
      : manualShell.length
        ? manualShell
        : settingsShell.length
          ? settingsShell
          : alarmsShell;

    return {
      ...rawScreen,
      _composed: true,
      template: {
        ...templateConfig,
        contentBounds: bounds
      },
      components: [...templateAbove, ...sideShell, ...contentArea, ...absoluteScreen, ...templateBelow]
    };
  }

  return {
    composeScreen,
    buildOverviewShell,
    buildManualShell,
    buildAlarmsShell,
    buildSettingsShell,
    deriveContentBounds,
    isFlowComponent,
    resolveTemplateConfig
  };
}));
