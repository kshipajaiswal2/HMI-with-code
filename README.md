# PlantHMI

PlantHMI is our own **Windows PC-based HMI platform** — equivalent to Rockwell FactoryTalk View, with full customization control.

| Product | Folder | Purpose |
|---------|--------|---------|
| **Plant HMI Studio + Runtime** | `pc-hmi-runtime/` | Windows HMI — engineering studio, operator runtime, 18 standard displays per project |
| **Engineering Bridge** | `web-hmi-bridge/` | Legacy FactoryTalk XML tooling (tag generation, import packaging) |

See `docs/pc_hmi_platform.md` for the full architecture and Rockwell feature parity roadmap.

## What this repository contains

- PowerShell automation for building HMI engineering artifacts such as:
  - `device_map.csv`
  - `alarms_seed.csv`
  - `screen_spec.csv`
  - `global_object_params.csv`
  - `hmi_tags.csv`
- A local web app for working with display XML, IO lists, tag export, parameter files, and FactoryTalk package generation.
- A default display library for creating new bridge projects from a known template set.
- Popup planning tooling for creating common equipment popups directly on the active display.
- Reference import templates under `hmi/import_templates/` (Tags CSV, PAR files, master sheets, RSLogix tag exports).

## Repository layout

| Path | Purpose |
|------|---------|
| `scripts/` | Build and generation scripts |
| `templates/` | Pipeline configuration and reusable input templates |
| `generated/` | Generated CSV and summary outputs (disposable) |
| `pc-hmi-runtime/` | PC-based HMI runtime (live tags, alarms, screen renderer) |
| `web-hmi-bridge/` | Node.js bridge server and browser UI |
| `docs/pc_hmi_platform.md` | PC HMI platform architecture and roadmap |
| `web-hmi-bridge/public/` | Browser app (`app.js`, `io-tags.js`, UI) |
| `web-hmi-bridge/ftio/default-pages/` | Starting XML library used by **New Project** |
| `web-hmi-bridge/ftio/reimport/` | Edited XML working area |
| `web-hmi-bridge/ftio/reimport/packages/` | Generated import package artifacts |
| `web-hmi-bridge/ftio/display-folders.json` | Display folder mapping used during package generation |
| `hmi/import_templates/` | Reference Tags CSV, PAR folder, master sheets, PLC tag exports |
| `Export import/` | FactoryTalk export drop folder (default bridge source) |

### Key reference files

| File | Purpose |
|------|---------|
| `hmi/import_templates/69zone3.csv` | Reference FactoryTalk Tags CSV format (Packing / zone 3) |
| `hmi/import_templates/PAR/` | Reference parameter files (`PLC DI List 01.par`, etc.) |
| `hmi/import_templates/VAPR069_Master Sheet_V05.xlsx` | Sample master IO sheet |
| `hmi/import_templates/VAPR069_V51_08_05_2026_V1_Tags.CSV` | Sample RSLogix 5000 tag export for PLC matching |

## Prerequisites

- Windows PowerShell
- Node.js and npm
- Access to the HMI source folder and a FactoryTalk export location
- Optional: files in `hmi/import_templates/` for PLC/HMI import workflows

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

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `5050` | Web server port |
| `FT_EXPORT_DIR` | `..\Export import` | FactoryTalk export folder |
| `FT_IMAGE_DIR` | `..\hmi\MyPlantHMI\Images` | Preview image library |
| `FT_HMI_DIR` | `..\hmi` | HMI project root |

## Typical bridge workflows

### Create a new project

Use **New Project** to seed a project from the default XML library in `web-hmi-bridge/ftio/default-pages/`.

Foldering is controlled by `web-hmi-bridge/ftio/display-folders.json`.

Name the project to match your PLC/HMI naming (for example `VAPR069`). The bridge uses the project name when building processor addresses such as `Vapr069_Z3`.

### Import a full XML folder

1. Click **Import Folder**.
2. Select a directory containing display XML files.
3. The bridge creates a project tree and maps the imported screens into the sidebar.
4. The first imported display is opened in the editor automatically.

Notes:

- Files such as `BatchImport_*.xml` are skipped during folder import.
- Nested folder structure is preserved in the project tree.
- Existing project names are made unique automatically.

### Edit and package screens

The editor supports:

- screen preview with object selection
- property editing for the selected object
- XML inspection and status output
- page-level and all-page package generation

Toolbar actions:

| Action | Purpose |
|--------|---------|
| **Preview** | Show the selected screen at a scaled size |
| **Apply Size** | Write geometry changes back to the active XML |
| **Page Import** | Package only the current display |
| **All Import** | Package all edited displays in the current project |

## IO List, Tags CSV, and PAR export

The bridge can turn a master Excel IO sheet into FactoryTalk-ready Tags CSV and parameter (`.par`) files, one zone at a time.

### Step-by-step

1. **Create or open a project** (use a name like `VAPR069` so processor names resolve correctly).
2. In the sidebar under **IO List**, click **+** and upload the **Master Sheet** (`.xlsx`).
3. Optional but recommended: click **Upload PLC Tags** and upload an **RSLogix 5000 Tags CSV** export. This matches IO descriptions to PLC tag addresses.
4. Open the IO List editor and confirm zones loaded (for example Chopper, Dryer, Packing).
5. Use **Zone setup** to assign each zone to the correct **RIO module** (for example Packing → RIO03). If unset, the bridge infers RIO from zone order and PLC tag matching.
6. Pick a **zone** in the IO List toolbar. The same zone drives both Tags CSV and parameter file generation.
7. Click **Download Tags CSV** to export a single-zone FactoryTalk Tags file.
8. Under **Parameters**, click **Download PAR Folder** to export the `.par` files for that zone (same layout as `hmi/import_templates/PAR/`).

### Tags CSV format

Generated Tags CSV follows the structure of `hmi/import_templates/69zone3.csv`:

- UTF-8 with BOM
- 14 folders (`PLC_DI_Discr`, `PLC_DI_NO`, `PLC_DI_Tags`, …, `Temp_Tags`, `Values`)
- Tags grouped per channel: Discr → Lists → NO → Digital
- Section order: PLC DI → PLC DO → Safety DI → Safety DO → auxiliary tags
- List titles use `PLC Input List` / `PLC Output List` (not the zone name)
- Digital tag addresses use FactoryTalk format, for example `[Vapr069_Z3]RIO03_DI[001]`
  - DI indices are 3-digit (`[001]` … `[096]`)
  - DO / SDI / SDO indices are 2-digit (`[01]` …)
- Safety labels use unpadded numbers (`SDI1`, not `SDI01`)

A valid Packing-zone export is roughly **500+ lines** with **14 folder rows**. If the file is only ~27 lines (Temp_Tags and Values only), the export did not run for a zone — re-open the IO List editor, pick a zone, and download again.

### Import Tags CSV in FactoryTalk

1. Hard refresh the bridge page first (`Ctrl+Shift+R`) after updates.
2. Download a fresh Tags CSV for the target zone.
3. Open the file in Notepad and confirm folders and PLC tag rows are present.
4. In FactoryTalk View Studio, use **Tag Import Wizard** — do not open the CSV in Excel and save it (that can break encoding and quoting).

### Parameter (PAR) files

Parameter files are generated per zone and packaged as a ZIP matching the reference PAR folder layout:

- `PLC DI List 01.par`, `PLC DI List 02.par`, …
- `PLC DO List 01.par`, …
- `Safety DI List 01.par`, `Safety DO List 01.par`

Download these from the **Parameters** section (not IO List). Pick the same zone as for Tags CSV.

## Popup Planner

The bridge includes a **Popup Planner** section below the preview pane.

Use it to:

1. Add popup plan rows with a display name, component type, popup type, and quantity.
2. Click **Generate** to place popup groups onto the active screen.
3. Review generated history from the same planner panel.

Common popup patterns include VFD, Speed, Forward/Reverse, and Up/Down. Component presets cover Conveyor, Pneumatic, Motor, Servo, and similar equipment styles.

## Default template refresh flow

The default page library lives in `web-hmi-bridge/ftio/default-pages/`.

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

Typical generated outputs:

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

| Problem | What to check |
|---------|----------------|
| Preview images missing | Verify `FT_IMAGE_DIR` points to the correct FactoryTalk image library |
| Browser UI looks stale | Hard refresh with `Ctrl+Shift+R` (or `Ctrl+F5`) |
| Import or package does nothing | Restart the bridge and refresh the browser |
| Folder grouping wrong | Review `web-hmi-bridge/ftio/display-folders.json` |
| Popup planner geometry wrong | Confirm generated XML has `left`, `top`, `width`, and `height` |
| Tags CSV only has Temp_Tags / Values | Pick a zone in the IO List editor and re-download; confirm the Master Sheet loaded |
| FactoryTalk Tag Editor empty after import | Use Tag Import Wizard; confirm file has ~500 lines and 14 folders before importing |
| Wrong RIO module in addresses | Set RIO in Zone setup (IO List editor); re-upload RSLogix Tags CSV for PLC matching |
| Processor name shows `[PLC]` | Set the project name (for example `VAPR069`) and pick the correct zone |
| PAR ZIP will not extract on Windows | Re-download from Parameters; use a current bridge build (ZIP header offsets were fixed) |
| Tag count differs from reference `69zone3.csv` | Master sheet row count may differ (reference has 96 DI for Packing; your sheet may have fewer) |

## Notes

- Final runtime validation and display authoring still happen in FactoryTalk View Studio.
- The `generated/` folder and `web-hmi-bridge/ftio/reimport/packages/` are build artifacts — treat them as disposable output.
- Compare generated Tags CSV against `hmi/import_templates/69zone3.csv` when validating format for a new project.
