# FactoryTalk Import-Ready Steps

## 1) Export Template CSVs From FactoryTalk

Export one sample row for each from your exact FactoryTalk version:

- HMI Tags export CSV -> save as `hmi/import_templates/hmi_tags_template.csv`
- Alarms export CSV -> save as `hmi/import_templates/alarms_template.csv`

Keep headers and one sample row in each template file.

## 2) Run Import Mapper

From workspace root:

```powershell
.\scripts\build_factorytalk_imports.ps1 `
  -TagTemplateCsv "hmi/import_templates/hmi_tags_template.csv" `
  -AlarmTemplateCsv "hmi/import_templates/alarms_template.csv" `
  -TagSourceCsv "generated/change_set_demo/device_map.changed.csv" `
  -AlarmSourceCsv "generated/change_set_demo/alarms_seed.changed.csv" `
  -OutputDir "generated/factorytalk_import_ready"
```

## 3) Use Generated Files

- `generated/factorytalk_import_ready/hmi_tags.import_ready.csv`
- `generated/factorytalk_import_ready/alarms.import_ready.csv`
- `generated/factorytalk_import_ready/import_mapping_summary.txt`

## 4) Import Back In FactoryTalk

- Import `hmi_tags.import_ready.csv` in HMI Tags import.
- Import `alarms.import_ready.csv` in Alarm import.

## Notes

- This mapper aligns to your exported template headers automatically.
- If a field does not map perfectly in your version, edit the output CSV once and reuse the same template next time.
