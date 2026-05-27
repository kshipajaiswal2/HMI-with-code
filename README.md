# PlantHMI Automation README

## 1) What Was Set Up

This repository is now configured to generate FactoryTalk View engineering artifacts from a master Excel sheet and a restored FactoryTalk project folder.

The setup supports an offline workflow (no live PLC needed) and is reusable for future projects by changing input paths and config mappings.

In addition to the PowerShell asset pipeline, this repo now includes a browser-based XML editor and package builder at `web-hmi-bridge/` for page preview, editing, and Batch Import package generation.

Core outcomes already implemented:

- HMI tag generation from equipment templates.
- Configurable HMI tag and PLC reference templates for reuse across projects.
- Device-to-alarm parsing from master sheet.
- FactoryTalk project root validation against real source structure.
- Alarm seed export with mapped/unmapped status.
- Duplicate device-key reporting to avoid silent wrong mappings.
- Screen specification export for repeated screen creation.
- Global object parameter export for standardized faceplates.
- Reusable JSON config for sheet names, columns, defaults, and type mappings.
- Live display XML browsing/editing with preview rendering through web-hmi-bridge.
- Two package modes for FactoryTalk import: current page package and all edited files package.

## 2) Why This Approach

FactoryTalk View runtime does not use the ACD path directly. Runtime references resolve through FactoryTalk Linx shortcuts.

So the practical automation model is:

1. Extract structured design data from your master sheet.
2. Generate import-ready CSV/spec files.
3. Import or apply inside FactoryTalk View Studio.
4. Keep one or more base screens/global objects in Studio and replicate using generated specs.

## 3) Files Added

### Scripts

- scripts/generate_hmi_tags.ps1  
  Generates HMI tags from a simple equipment list CSV.

- scripts/generate_factorytalk_assets.ps1  
  Main reusable pipeline that reads master sheet + config and generates device map, alarms, and screen specs.

### Web Bridge

- web-hmi-bridge/server.js  
  Express + Socket.IO bridge that serves display files, image lookups, edited saves, and Batch Import package creation.

- web-hmi-bridge/public/index.html and web-hmi-bridge/public/app.js  
  Browser UI for display list management, visual preview, XML editing, object edits, and package download.

### Config

- templates/factorytalk_pipeline.config.json  
  Controls worksheet names, column positions, default values, and device-type mapping rules.

### Templates/Input Samples

- templates/equipment_list.csv  
  Example input for quick tag generation.

### Documentation

- docs/offline_hmi_workflow.md  
  Offline workflow and constraints.

- docs/factorytalk_reusable_pipeline.md  
  Reuse instructions for swapping to other projects.

### Generated Outputs

- generated/hmi_tags.csv
- generated/device_map.csv
- generated/alarms_seed.csv
- generated/screen_spec.csv
- generated/global_object_params.csv
- generated/device_key_issues.csv
- generated/generation_summary.txt

## 4) Current Project Inputs Used

- Master Sheet: hmi/VAPR067_Master Sheet_V08 2 1.xlsx
- Restored Project Folder: hmi/MyPlantHMI
- APA Archive: hmi/MyPlantHMI.apa
- Runtime File (reference only): hmi/MyPlantHMI.mer

Note: `.apa` is the preferred source archive for portability and clean restore.

## 5) Pipeline Details

### 5.1 Device Parsing

The script reads the Device worksheet and extracts:

- EquipmentName
- EquipmentCode
- DeviceType
- PlcTag

From this it builds:

- PlcReference in format: [Shortcut]PlcTag
- Device map for later alarm/screen mapping
- PlcTagStatus so devices with no PLC tag still remain visible in outputs

The script now also validates the supplied FactoryTalk project folder by checking for:

- a `.med` application file
- required directories such as `Gfx`, `Global Objects`, and `TAG`

### 5.2 Alarm Parsing

The script reads the Alarms worksheet and:

- Finds the alarm header row via token (default: ErrorCode).
- Parses alarm rows until configured blank-row stop condition.
- Builds alarm records with severity/ack defaults.
- Attempts device mapping by normalized keys.
- Avoids silent auto-mapping when normalized keys are duplicated.

Normalization includes:

- Uppercase conversion
- Removal of non-alphanumeric characters
- Numeric sequence normalization (for cases like ROBOT-01 vs ROBOT-1)

Outputs include MappingStatus as Mapped or Unmapped.

Additional statuses now used:

- MatchedByName
- MatchedByCode
- MatchedNoPlcTag
- Ambiguous
- Unmapped

Duplicate/ambiguous key collisions are exported to `generated/device_key_issues.csv`.

### 5.3 Screen Spec Generation

For each device row, the script creates a screen entry:

- ScreenName (EQP_<EquipmentCode>)
- TemplateName (from DeviceType mapping)
- GlobalObjectName (from DeviceType mapping)
- Parameters for equipment, PLC tag, description
- ScreenStatus (`Ready` or `NeedsPlcTag`)

This is intended to accelerate repeated screen build using templates/global objects.

## 6) Commands

Run from workspace root.

### 6.1 Quick HMI Tag CSV

```powershell
.\scripts\generate_hmi_tags.ps1 -EquipmentFile templates/equipment_list.csv -OutputFile generated/hmi_tags.csv
```

Optional reuse parameters:

```powershell
.\scripts\generate_hmi_tags.ps1 `
  -EquipmentFile templates/equipment_list.csv `
  -OutputFile generated/hmi_tags.csv `
  -HmiTagTemplate "{HmiBasePath}.{Suffix}" `
  -PlcReferenceTemplate "[{Shortcut}]Program:MainProgram.{PlcTagPath}"
```

Optional CSV columns for `templates/equipment_list.csv`:

- `HmiBasePath`
- `PlcBasePath`

### 6.2 Full Reusable Pipeline

```powershell
.\scripts\generate_factorytalk_assets.ps1 `
  -MasterSheetPath "hmi/VAPR067_Master Sheet_V08 2 1.xlsx" `
  -ProjectRoot "hmi/MyPlantHMI" `
  -ConfigPath "templates/factorytalk_pipeline.config.json" `
  -OutputDir "generated"
```

### 6.3 Run Web HMI Bridge

Install dependencies (first time only):

```powershell
cd .\web-hmi-bridge
npm install
```

Start server:

```powershell
cd .\web-hmi-bridge
npm start
```

Open:

- http://localhost:5050

Optional environment variables:

- `PORT` (default: `5050`)
- `FT_EXPORT_DIR` (default: `..\Export import`)
- `FT_IMAGE_DIR` (default: `..\hmi\MyPlantHMI\Images`)

Example:

```powershell
$env:FT_EXPORT_DIR = "D:\Kshipa\PlantHMI\Export import"
$env:FT_IMAGE_DIR = "D:\Kshipa\PlantHMI\hmi\MyPlantHMI\Images"
cd .\web-hmi-bridge
npm start
```

### 6.4 Web Bridge Packaging Actions

The editor exposes two import package buttons:

- `Get Page Import`: packages the currently selected edited display and related edited global objects matching `<PageName>_AddOns*.xml`.
- `Get All Import`: packages every edited XML currently in `web-hmi-bridge/ftio/reimport`.

Each package includes:

- `BatchImport.xml` and `BatchImport_WebBridge.xml` (UTF-16LE with BOM)
- `DisplaysImport.txt` and `DisplaysImport_WebBridge.txt`
- `DeleteTargets.txt`
- Selected display/global object XML files

Generated package folders are stored under:

- `web-hmi-bridge/ftio/reimport/packages/`

## 7) Current Run Summary

Latest generation summary:

- DeviceCount: 62
- DevicesMissingPlcTag: 6
- AlarmCount: 460
- MappedAlarms: 168
- AmbiguousAlarms: 0
- UnmappedAlarms: 292
- DuplicateDeviceKeys: 2

See generated/generation_summary.txt for latest values after each run.

## 8) Reusing For Another Project

1. Place new master sheet in hmi/.
2. Restore new FactoryTalk project from `.apa` and place restored folder in hmi/.
3. Update templates/factorytalk_pipeline.config.json only if sheet name or column locations changed.
4. Run the same pipeline command with new `-MasterSheetPath` and `-ProjectRoot`.
5. Review `generated/generation_summary.txt`, `generated/alarms_seed.csv`, and `generated/device_key_issues.csv` for mapping quality.

## 9) What Still Requires FactoryTalk View Studio

Some assets are binary/project-native and should be finalized in Studio:

- Display `.gfx` authoring/editing
- Final alarm/event database import verification
- Navigation wiring and runtime behavior validation

The generated files provide structured input/specification to reduce manual work significantly.

## 10) Recommended Next Enhancements

- Add a report for only unmapped alarms with suggested device candidates.
- Add per-template screen build checklists exported from screen_spec.csv.
- Add optional export format variants for specific FactoryTalk import expectations.
- Add project profile presets (one config per project) for one-command reuse.

## 11) Troubleshooting

- If Excel COM cannot open workbook, verify Excel is installed and sheet is closed.
- If alarm mappings are low, adjust sheet column mapping and naming normalization assumptions, then review `generated/device_key_issues.csv`.
- If project copy had locked files, prefer working from `.apa` restore instead of live folder copy.
- If web preview icons are missing, confirm image files exist under `hmi/MyPlantHMI/Images` or set `FT_IMAGE_DIR` to the correct image library.
- If FactoryTalk import reports `element does not exist in the Display and cannot be updated`, import is running in merge/update mode. Re-run Batch Import using REPLACE/OVERWRITE, or delete targets first using `DeleteTargets.txt`.
- In Batch Import, select `BatchImport.xml` from the extracted package folder, not the ZIP and not individual display XML files.

## 12) Versioning Advice

Keep these in source control for every project:

- scripts/
- templates/factorytalk_pipeline.config.json
- docs/

For web-hmi-bridge, consider ignoring generated package folders if they are only transient outputs:

- `web-hmi-bridge/ftio/reimport/packages/`

Treat generated/ as build artifacts that can be regenerated anytime from master sheet + restored project.
