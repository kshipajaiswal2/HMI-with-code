# Reusable FactoryTalk Generation Pipeline

This setup lets you replace the master sheet and restored project folder for other projects without rewriting scripts.

## Inputs

- Master sheet Excel file (for example, alarms and device list)
- Restored FactoryTalk project folder (from your `.apa`)
- Pipeline config JSON

## Script

- `scripts/generate_factorytalk_assets.ps1`

## Config

- `templates/factorytalk_pipeline.config.json`

The config controls:

- Worksheet names
- Column indexes
- Default shortcut/severity
- Device type to template/global object mapping

## Run

From workspace root:

```powershell
.\scripts\generate_factorytalk_assets.ps1 `
  -MasterSheetPath "hmi/VAPR067_Master Sheet_V08 2 1.xlsx" `
  -ProjectRoot "hmi/MyPlantHMI" `
  -ConfigPath "templates/factorytalk_pipeline.config.json" `
  -OutputDir "generated"
```

## Generated Files

- `generated/device_map.csv`
- `generated/alarms_seed.csv`
- `generated/screen_spec.csv`
- `generated/global_object_params.csv`
- `generated/generation_summary.txt`

## How To Reuse For Another Project

1. Put the new master sheet in `hmi/`.
2. Restore the new project from `.apa` and place the folder in `hmi/`.
3. Update `templates/factorytalk_pipeline.config.json` if the worksheet names or columns changed.
4. Re-run the same script with new `-MasterSheetPath` and `-ProjectRoot` values.

## Notes

- This pipeline creates import-ready seed files and screen/build specs.
- Display `.gfx` files are binary and still edited in FactoryTalk View Studio.
