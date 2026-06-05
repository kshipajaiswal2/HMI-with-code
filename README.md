# PlantHMI

FactoryTalk View ME engineering workspace with two main parts:

1. A PowerShell data pipeline that generates import-ready assets from Excel and project templates.
2. A browser-based XML bridge for display editing, preview, and Batch Import package generation.

## What This Repo Does

- Generates reusable HMI engineering outputs (`device_map`, `alarms_seed`, `screen_spec`, `global_object_params`).
- Supports offline-first HMI preparation (no live PLC needed during most build work).
- Provides a web editor for display XML preview and edits.
- Supports importing a full XML folder directly into a new project tree in the web bridge.
- Builds FactoryTalk import packages, including foldered display import paths.
- Supports default template libraries used when creating new projects in the web bridge.

## Key Paths

- Pipeline scripts: `scripts/`
- Pipeline config: `templates/factorytalk_pipeline.config.json`
- Generated outputs: `generated/`
- Web bridge app: `web-hmi-bridge/`
- Default template XML library: `web-hmi-bridge/ftio/default-pages/`
- Display folder assignments: `web-hmi-bridge/ftio/display-folders.json`

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

### 3) Import a Full XML Folder (Project Tree)

From the bridge UI:

1. Click `Import Folder`.
2. Select a folder that contains display XML files.
3. The bridge creates a new project and maps files into folders based on relative paths.
4. The first imported screen is loaded automatically in the editor.

Notes:

- Files named like `BatchImport_*.xml` are skipped during folder import.
- Nested folders are preserved in the project sidebar.
- If a project with the same name exists, a unique name is created automatically.

## Default Template Workflow (New Project)

The New Project flow in the bridge uses files from:

- `web-hmi-bridge/ftio/default-pages/`

Folder grouping is controlled by:

- `web-hmi-bridge/ftio/display-folders.json`

Recommended default set:

- Numbered displays (`100_...xml` to `700_...xml`) for foldered pages.
- Optional global objects like `Template.xml` and `IO_List.xml`.

## FactoryTalk Import Packaging

From the web bridge UI:

- `Get Page Import`: package selected edited page.
- `Get All Import`: package all edited pages.

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

- If preview images are missing, verify `FT_IMAGE_DIR` path.
- If import reports merge/update conflicts, delete targets first using `DeleteTargets.txt`, then re-import.
- If you changed default templates, refresh the bridge and recreate the project.
- If folder grouping looks wrong, check `web-hmi-bridge/ftio/display-folders.json`.
- If `Import Folder` appears to do nothing, restart the bridge server and hard refresh browser (`Ctrl+Shift+R`) to ensure latest frontend code is loaded.

## Notes

- Display `.gfx` authoring and final runtime verification still happen in FactoryTalk View Studio.
- Treat `generated/` and `web-hmi-bridge/ftio/reimport/packages/` as build artifacts.
