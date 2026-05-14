# Offline FactoryTalk HMI Workflow (No Live PLC)

You can prepare most HMI work without a live PLC.

## What You Can Do Offline

- Define and standardize tag naming from your PLC logic design.
- Generate HMI tags in bulk from equipment lists.
- Build screens, buttons, indicators, and animation bindings against generated HMI tags.
- Simulate values in HMI for UI testing.

## Important Limitation

- Runtime communication still uses FactoryTalk Linx shortcuts to a controller path.
- The ACD file itself is not a runtime data source for FactoryTalk View.

## Use This Project Script

Input CSV:

- `templates/equipment_list.csv`
- Columns: `Equipment`, `Template`, `Shortcut`
- Supported `Template` values: `pallet_dispenser`, `stopper`

Run from workspace root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate_hmi_tags.ps1 -EquipmentFile templates/equipment_list.csv -OutputFile generated/hmi_tags.csv
```

Output:

- `generated/hmi_tags.csv`
- Includes generated `HmiTagName`, `PlcReference`, `DataType`, `Access`, `Description`

## When PLC Is Available Later

- Replace the `Shortcut` value in CSV from `Offline` to your real FT Linx shortcut.
- Re-run generation to update references automatically.
- Import generated tags into FactoryTalk View and validate live data.
