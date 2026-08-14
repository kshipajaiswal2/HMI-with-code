# Screen Customization Guide - Isolation Rules

## Overview
To prevent changes in one screen from affecting others, follow these strict separation rules:

## ✅ DO - Screen-Specific Changes Only

### 1. Modify Screen Components (Isolated)
Only edit components within the screen's own `components` array:
```json
{
  "id": "102_Prestart",
  "components": [
    {
      "type": "Rectangle",
      "name": "MyScreenSpecificElement",
      ...
    }
  ]
}
```

### 2. Modify Screen-Specific Overrides (Isolated)
Use the `template.replace` section ONLY to override how template elements appear on THIS screen:
```json
{
  "template": {
    "enabled": true,
    "globalObjectId": "Template",
    "replace": {
      "Title": {
        "caption": "This Screen's Custom Title"
      }
    }
  }
}
```

### 3. Modify Navigation Shell (Screen-Specific)
Only modify the screen's own `overviewShell` or navigation elements:
```json
{
  "overviewShell": {
    "OverviewNav_101_Production_Data": {
      "caption": "Production Data"
    }
  }
}
```

## ❌ DON'T - Avoid These

### 1. ❌ Never Modify the Global Template Object from a Screen
- Don't edit `/pc-hmi-runtime/projects/a/Global Objects/Template.json` to make screen-specific changes
- The Template is ONLY for changes that should appear in ALL screens

### 2. ❌ Never Share Component References Between Screens
- Each screen's components should be unique
- Don't copy component IDs or names from other screens

### 3. ❌ Never Merge Overrides from Multiple Screens
- Each screen's `template.replace` should only contain that screen's overrides
- Don't include overrides meant for other screens

## 🔧 When to Edit the Global Template

**ONLY** modify `Template.json` when you want changes to appear in **ALL SCREENS**:

Examples:
- ✅ Change the header bar background color (affects all screens)
- ✅ Update the logo image (affects all screens)
- ✅ Modify the clock display format (affects all screens)
- ✅ Change global tag references (affects all screens)

## ✅ Change Flow

### To modify ONE screen only:
1. Open the screen file (e.g., `102_Prestart.json`)
2. Edit either:
   - The `components` array (for new/modified components)
   - The `template.replace` section (for template element overrides)
3. **Save the screen file only**
4. **Do NOT modify Template.json**

### To modify ALL screens:
1. Open `Template.json` in Global Objects
2. Modify components in the Template's `components` array
3. **Save Template.json only**
4. All screens will automatically reflect the changes

## 🚨 Troubleshooting Cross-Screen Changes

If a change in one screen is appearing in another screen:

1. **Check what was modified:**
   - Was `Template.json` edited? → Revert to affect all screens uniformly
   - Was a screen file edited? → Changes should stay isolated

2. **Verify isolation:**
   - Ensure screen files have unique component names
   - Ensure screen `template.replace` sections don't reference other screens
   - Check that `overviewShell` elements are screen-specific

3. **Reset a screen:**
   - Remove unwanted overrides from `template.replace`
   - Remove unwanted components from `components` array
   - The screen will use default Template elements

## Summary

| Change Type | Where to Edit | Affects |
|---|---|---|
| Header/Navigation (all screens) | `Template.json` | All screens |
| This screen's appearance | `screen.json` → `template.replace` | Only this screen |
| This screen's new elements | `screen.json` → `components` | Only this screen |
| Navigation buttons | `screen.json` → `overviewShell` | Only this screen |
