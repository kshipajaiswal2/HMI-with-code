# PlantHMI

FactoryTalk View ME engineering workspace with two main parts:

1. A PowerShell data pipeline that generates import-ready assets from Excel and project templates.
2. A browser-based XML bridge for display editing, preview, popup planning, and Batch Import package generation.

## What This Repo Does

- Generates reusable HMI engineering outputs (`device_map`, `alarms_seed`, `screen_spec`, `global_object_params`).
- Supports offline-first HMI preparation (no live PLC needed during most build work).
- Provides a web editor for display XML preview and edits.
- Supports importing a full XML folder directly into a new project tree in the web bridge.
- Builds FactoryTalk import packages, including foldered display import paths.
- Supports default template libraries used when creating new projects in the web bridge.
- Includes a Popup Planner for generating standard equipment popups from plan rows.

## Key Paths

| Purpose | Path |
|--------|------|
| Pipeline scripts | `scripts/` |
| Pipeline config | `templates/factorytalk_pipeline.config.json` |
| Generated outputs | `generated/` |
| Web bridge app | `web-hmi-bridge/` |
| Default template XML library | `web-hmi-bridge/ftio/default-pages/` |
| Edited display XML (working copy) | `web-hmi-bridge/ftio/reimport/` |
| FactoryTalk import packages | `web-hmi-bridge/ftio/reimport/packages/` |
| Display folder assignments | `web-hmi-bridge/ftio/display-folders.json` |
| FactoryTalk export drop folder | `Export import/` (override with `FT_EXPORT_DIR`) |

## Quick Start

### 1) Run the Asset Pipeline

From workspace root:

```powershell
.\scripts\generate_factorytalk_assets.ps1 `
  -MasterSheetPath "hmi/VAPR067_Master Sheet_V08 2 1.xlsx" `
  -ProjectRoot "hmi/MyPlantHMI" `
  -ConfigPath "templates/factorytalk_pipeline.config.json" `
  -OutputDir "generated"
```

Main outputs:

- `generated/device_map.csv`
- `generated/alarms_seed.csv`
- `generated/screen_spec.csv`
- `generated/global_object_params.csv`
- `generated/device_key_issues.csv`
- `generated/generation_summary.txt`

### 2) Run the Web HMI Bridge

```powershell
cd .\web-hmi-bridge
npm install
npm start
```

Open:

- `http://localhost:5050`

Optional environment variables:

- `PORT` (default `5050`)
- `FT_EXPORT_DIR` (default `..\Export import`)
- `FT_IMAGE_DIR` (default `..\hmi\MyPlantHMI\Images`)
- `FT_HMI_DIR` (default `..\hmi`)

### 3) Import a Full XML Folder (Project Tree)

From the bridge UI:

1. Click **Import Folder**.
2. Select a folder that contains display XML files.
3. The bridge creates a new project and maps files into folders based on relative paths.
4. The first imported screen is loaded automatically in the editor.

Notes:

- Files named like `BatchImport_*.xml` are skipped during folder import.
- Nested folders are preserved in the project sidebar.
- If a project with the same name exists, a unique name is created automatically.

## Web Bridge Editor

Toolbar actions:

- **Preview** — scaled screen preview with drag/resize for selected objects.
- **Apply Size** — writes width/height to the active display XML and saves.
- **Page Import** — build a FactoryTalk package for the current screen.
- **All Import** — build a package for all edited screens in the project.

Side panel tabs:

- **Properties** — edit the selected object (position, colors, caption, font).
- **XML** — raw display XML and package/status messages.

**Popup Planner** (below the preview):

1. Add plan rows (name, component type, popup type, count).
2. Click **Generate** to insert popups onto the active screen.
3. Generated history appears at the bottom of the planner table.

Popup types include VFD, Speed, Forward/Reverse, and Up/Down. Component presets cover Conveyor, Pneumatic, Motor, and Servo.

## Default Template Workflow (New Project)

The **New Project** flow uses XML from:

- `web-hmi-bridge/ftio/default-pages/`

Folder grouping is controlled by:

- `web-hmi-bridge/ftio/display-folders.json`

Current default display set (representative):

| Folder | Displays |
|--------|----------|
| Overview | `100_Overview`, `101_Production_Data`, `102_Prestart`, `103_Safety`, `104_Mimic_Screen`, `105_Cycle_Time` |
| Settings | `200_Settings` |
| Manual Operation | `300_Manual_Operation`, `301_PLC_IO_List`, `302_PLC_Architecture`, `303_IO_Card` |
| Active Alarms | `400_Active_Alarms`, `401_Alarm_History`, `402_Alarm_Remedies_Popup` |
| Recipe | `500_Recipe`, `500_Recipe_1` |
| Legends | `600_Legends` |
| User Management | `700_User_Management` |

Global / shared templates:

- `Template.xml` — header/footer reference group used by numbered displays.
- `402_IO_List.xml` — IO list screen (also available as a numbered display default).

### Refresh a Default Template from FactoryTalk

After editing a display in FactoryTalk and exporting it back to the bridge:

1. Confirm the export landed in `web-hmi-bridge/ftio/reimport/` (for example `402_IO_List.xml`).
2. Copy the exported file over the matching default template:

```powershell
Copy-Item `
  ".\web-hmi-bridge\ftio\reimport\402_IO_List.xml" `
  ".\web-hmi-bridge\ftio\default-pages\402_IO_List.xml" `
  -Force
```

3. Restart the bridge (if running) and create a **New Project** to pick up the updated default.

FactoryTalk may also write batch metadata under `web-hmi-bridge/ftio/reimport/packages/` (for example `BatchImport_CFGX.xml`, `DisplaysExport.txt`).

## FactoryTalk Import Packaging

From the web bridge UI:

- **Page Import** — package the selected edited page.
- **All Import** — package all edited pages.

Generated package folder contains:

- `BatchImport.xml` (primary; foldered when mappings exist)
- `BatchImport_Foldered.xml` (explicit foldered variant)
- `BatchImport_Flat.xml` (flat fallback)
- `DisplaysImport_WebBridge.txt`
- `DeleteTargets.txt`

Packages are created under:

- `web-hmi-bridge/ftio/reimport/packages/`

## Important: Display Folders In FactoryTalk

FactoryTalk display folders are logical project metadata, not always real Windows folders under `Gfx`.

To import with grouping:

1. Use package `BatchImport.xml` from the generated package folder.
2. Keep folder assignments updated in `display-folders.json`.
3. Import with Replace/Overwrite behavior when updating existing displays.

If FactoryTalk ignores folder layout in your version/dialog, use `BatchImport_Foldered.xml` or manually organize after import.

When adding a new default display, add a matching entry to `display-folders.json` if it should appear in a numbered folder on import.

## Additional Scripts

Quick HMI tag CSV generation:

```powershell
.\scripts\generate_hmi_tags.ps1 `
  -EquipmentFile templates/equipment_list.csv `
  -OutputFile generated/hmi_tags.csv
```

Reusable naming options:

```powershell
.\scripts\generate_hmi_tags.ps1 `
  -EquipmentFile templates/equipment_list.csv `
  -OutputFile generated/hmi_tags.csv `
  -HmiTagTemplate "{HmiBasePath}.{Suffix}" `
  -PlcReferenceTemplate "[{Shortcut}]Program:MainProgram.{PlcTagPath}"
```

## Docs

- `docs/offline_hmi_workflow.md`
- `docs/factorytalk_reusable_pipeline.md`
- `docs/factorytalk_import_ready_steps.md`

## Troubleshooting

- If preview images are missing, verify `FT_IMAGE_DIR` points to your FactoryTalk image library.
- If preview layout looks wrong after UI changes, hard refresh the browser (`Ctrl+F5`).
- If import reports merge/update conflicts, delete targets first using `DeleteTargets.txt`, then re-import.
- If you changed default templates, recreate the project (existing browser projects keep their old copies).
- If folder grouping looks wrong, check `web-hmi-bridge/ftio/display-folders.json`.
- If **Import Folder** appears to do nothing, restart the bridge server and hard refresh the browser.
- If popups do not appear in preview, confirm the popup group has `left`, `top`, `width`, and `height` attributes in the XML.

## Notes

- Display `.gfx` authoring and final runtime verification still happen in FactoryTalk View Studio.
- Treat `generated/` and `web-hmi-bridge/ftio/reimport/packages/` as build artifacts (packages folder is gitignored).
