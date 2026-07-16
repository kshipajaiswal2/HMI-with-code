# PlantHMI

PlantHMI is a FactoryTalk View ME engineering workspace with two connected workflows:

1. A PowerShell generator pipeline that turns master-sheet and template inputs into reusable project assets.
2. A browser-based bridge for previewing, editing, and packaging display XML for FactoryTalk import.

## What this repository contains

- PowerShell automation for building HMI engineering artifacts such as:
  - `device_map.csv`
  - `alarms_seed.csv`
  - `screen_spec.csv`
  - `global_object_params.csv`
  - `hmi_tags.csv`
- A local web app for working with display XML, project trees, and FactoryTalk package generation.
- A default display library for creating new bridge projects from a known template set.
- Popup planning tooling for creating common equipment popups directly on the active display.

## Repository layout

- `scripts/` — build and generation scripts
- `templates/` — pipeline configuration and reusable input templates
- `generated/` — generated CSV and summary outputs
- `web-hmi-bridge/` — Node.js bridge server and browser UI
- `web-hmi-bridge/ftio/default-pages/` — starting XML library used by New Project
- `web-hmi-bridge/ftio/reimport/` — edited XML working area
- `web-hmi-bridge/ftio/reimport/packages/` — generated import package artifacts
- `web-hmi-bridge/ftio/display-folders.json` — display folder mapping used during package generation
- `Export import/` — FactoryTalk export drop folder, usually the source for bridge package workflows

## Prerequisites

- Windows PowerShell
- Node.js and npm
- Access to the HMI source folder and a FactoryTalk export location

## Quick start

### 1) Generate the engineering assets

From the repository root:

```powershell
.\scripts\generate_factorytalk_assets.ps1 `
  -MasterSheetPath "hmi/VAPR067_Master Sheet_V08 2 1.xlsx" `
  -ProjectRoot "hmi/MyPlantHMI" `
  -ConfigPath "templates/factorytalk_pipeline.config.json" `
  -OutputDir "generated"
```

This creates the main generated outputs under `generated/`.

### 2) Start the web bridge

```powershell
cd .\web-hmi-bridge
npm install
npm start
```

Then open:

- `http://localhost:5050`

Optional environment variables:

- `PORT` — web server port, default `5050`
- `FT_EXPORT_DIR` — FactoryTalk export folder, default `..\Export import`
- `FT_IMAGE_DIR` — preview image library, default `..\hmi\MyPlantHMI\Images`
- `FT_HMI_DIR` — HMI project root, default `..\hmi`

## Typical bridge workflows

### Create a new project

Use the bridge's **New Project** action to seed a project from the default XML library in `web-hmi-bridge/ftio/default-pages/`.

Foldering is controlled by `web-hmi-bridge/ftio/display-folders.json`.

### Import a full XML folder

From the bridge UI:

1. Click **Import Folder**.
2. Select a directory containing display XML files.
3. The bridge creates a project tree and maps the imported screens into the sidebar.
4. The first imported display is opened in the editor automatically.

Behavior notes:

- Files such as `BatchImport_*.xml` are skipped during folder import.
- Nested folder structure is preserved in the project tree.
- Existing project names are made unique automatically.

### Edit and package screens

The editor supports:

- screen preview with object selection
- property editing for the selected object
- XML inspection and status output
- page-level and all-page package generation

The toolbar buttons available in the bridge include:

- **Preview** — show the selected screen at a scaled size
- **Apply Size** — write geometry changes back to the active XML
- **Page Import** — package only the current display
- **All Import** — package all edited displays in the current project

## Popup Planner

The bridge includes a **Popup Planner** section below the preview pane.

Use it to:

1. Add popup plan rows with a display name, component type, popup type, and quantity.
2. Click **Generate** to place popup groups onto the active screen.
3. Review generated history from the same planner panel.

Common popup patterns include VFD, Speed, Forward/Reverse, and Up/Down. Component presets cover common equipment styles such as Conveyor, Pneumatic, Motor, and Servo.

## Default template refresh flow

The bridge's default page library lives in `web-hmi-bridge/ftio/default-pages/`.

When a display is updated in FactoryTalk and exported back into the bridge workspace:

1. Confirm the exported file is placed under `web-hmi-bridge/ftio/reimport/`.
2. Replace the matching file in `web-hmi-bridge/ftio/default-pages/`.
3. Restart the bridge if it is already running.
4. Create a new project so the bridge picks up the updated template set.

Example:

```powershell
Copy-Item `
  ".\web-hmi-bridge\ftio\reimport\402_IO_List.xml" `
  ".\web-hmi-bridge\ftio\default-pages\402_IO_List.xml" `
  -Force
```

## Package generation

The bridge writes package artifacts into `web-hmi-bridge/ftio/reimport/packages/`.

Typical generated outputs include:

- `BatchImport.xml`
- `BatchImport_Foldered.xml`
- `BatchImport_Flat.xml`
- `DisplaysImport_WebBridge.txt`
- `DeleteTargets.txt`

Use the package folder created by the bridge for FactoryTalk import, especially when foldered display assignments are important.

## FactoryTalk folder handling

FactoryTalk display folders are logical project grouping metadata rather than always matching real Windows folders under the HMI graphics tree.

When using imported packages:

- keep `web-hmi-bridge/ftio/display-folders.json` aligned with the intended folder structure
- prefer `BatchImport.xml` for the normal folder-aware workflow
- fall back to `BatchImport_Foldered.xml` if the target version does not honor folder metadata cleanly
- use `DeleteTargets.txt` when you need to re-import over the same display targets

## Additional scripts

### Generate HMI tag CSVs

```powershell
.\scripts\generate_hmi_tags.ps1 `
  -EquipmentFile templates/equipment_list.csv `
  -OutputFile generated/hmi_tags.csv
```

### Reusable naming templates

```powershell
.\scripts\generate_hmi_tags.ps1 `
  -EquipmentFile templates/equipment_list.csv `
  -OutputFile generated/hmi_tags.csv `
  -HmiTagTemplate "{HmiBasePath}.{Suffix}" `
  -PlcReferenceTemplate "[{Shortcut}]Program:MainProgram.{PlcTagPath}"
```

## Documentation

- `docs/offline_hmi_workflow.md`
- `docs/factorytalk_reusable_pipeline.md`
- `docs/factorytalk_import_ready_steps.md`

## Troubleshooting

- If preview images are missing, verify `FT_IMAGE_DIR` points to the correct FactoryTalk image library.
- If the browser preview looks stale, hard refresh the page with `Ctrl+F5`.
- If import or package generation appears to do nothing, restart the bridge and refresh the browser.
- If folder grouping looks wrong, review `web-hmi-bridge/ftio/display-folders.json`.
- If the popup planner does not show expected geometry, confirm the generated XML contains `left`, `top`, `width`, and `height` values.

## Notes

- Final runtime validation and display authoring still happen in FactoryTalk View Studio.
- The `generated/` folder and the `web-hmi-bridge/ftio/reimport/packages/` folder are build artifacts and should be treated as disposable output.
