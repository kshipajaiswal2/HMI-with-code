param(
    [Parameter(Mandatory = $false)]
    [string]$MasterSheetPath = "hmi/VAPR067_Master Sheet_V08 2 1.xlsx",

    [Parameter(Mandatory = $false)]
    [string]$ProjectRoot = "hmi/MyPlantHMI",

    [Parameter(Mandatory = $false)]
    [string]$ConfigPath = "templates/factorytalk_pipeline.config.json",

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "generated"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AbsolutePath {
    param([string]$PathValue)

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return $PathValue
    }

    return [System.IO.Path]::GetFullPath((Join-Path -Path (Get-Location) -ChildPath $PathValue))
}

function Get-CellText {
    param(
        $Worksheet,
        [int]$Row,
        [int]$Column
    )

    return [string]$Worksheet.Cells.Item($Row, $Column).Text
}

function Normalize-Key {
    param([string]$Value)

    if (-not $Value) {
        return ""
    }

    $compact = ($Value -replace '[^A-Za-z0-9]', '').ToUpperInvariant()
    return [regex]::Replace($compact, '\d+', { param($m) ([int]$m.Value).ToString() })
}

function Get-Worksheet {
    param(
        $Workbook,
        [string]$Name
    )

    foreach ($sheet in $Workbook.Worksheets) {
        if ($sheet.Name -eq $Name) {
            return $sheet
        }
    }

    throw "Worksheet '$Name' not found in workbook."
}

function Get-ExcelWorkbook {
    param([string]$WorkbookPath)

    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($WorkbookPath)

    return @($excel, $workbook)
}

function Close-ExcelWorkbook {
    param(
        $Excel,
        $Workbook
    )

    if ($Workbook) {
        $Workbook.Close($false)
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($Workbook)
    }

    if ($Excel) {
        $Excel.Quit()
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($Excel)
    }

    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

function Read-DeviceRows {
    param(
        $Worksheet,
        $Columns,
        [int]$StartRow,
        [string]$Shortcut
    )

    $rows = New-Object System.Collections.Generic.List[object]
    $usedRows = [Math]::Max($Worksheet.UsedRange.Rows.Count, $StartRow)

    for ($r = $StartRow; $r -le $usedRows; $r++) {
        $equipmentName = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.EquipmentName).Trim()
        $equipmentCode = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.EquipmentCode).Trim()
        $deviceType = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.DeviceType).Trim()
        $plcTag = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.PlcTag).Trim()

        if ([string]::IsNullOrWhiteSpace($equipmentName) -and [string]::IsNullOrWhiteSpace($equipmentCode) -and [string]::IsNullOrWhiteSpace($plcTag)) {
            continue
        }

        if ([string]::IsNullOrWhiteSpace($equipmentCode) -and -not [string]::IsNullOrWhiteSpace($plcTag)) {
            $equipmentCode = $plcTag
        }

        if ([string]::IsNullOrWhiteSpace($plcTag)) {
            continue
        }

        $rows.Add([PSCustomObject]@{
                RowNo         = $r
                EquipmentName = $equipmentName
                EquipmentCode = $equipmentCode
                DeviceType    = $deviceType
                PlcTag        = $plcTag
                Shortcut      = $Shortcut
                PlcReference  = "[$Shortcut]$plcTag"
            })
    }

    return $rows
}

function Find-AlarmHeaderRow {
    param(
        $Worksheet,
        [int]$SearchStartRow,
        [int]$SearchEndRow,
        [int]$ErrorCodeColumn,
        [string]$HeaderToken
    )

    for ($r = $SearchStartRow; $r -le $SearchEndRow; $r++) {
        $cell = (Get-CellText -Worksheet $Worksheet -Row $r -Column $ErrorCodeColumn).Trim()
        if ($cell -and $cell.ToUpperInvariant().Contains($HeaderToken.ToUpperInvariant())) {
            return $r
        }
    }

    throw "Alarm header token '$HeaderToken' not found in rows $SearchStartRow-$SearchEndRow."
}

function Read-AlarmRows {
    param(
        $Worksheet,
        $Columns,
        [int]$HeaderRow,
        [int]$MaxBlankRows,
        [System.Collections.IDictionary]$DeviceByNameKey,
        [System.Collections.IDictionary]$DeviceByCodeKey,
        [string]$Severity,
        [string]$AckRequired,
        [string]$AlarmTriggerTemplate
    )

    $rows = New-Object System.Collections.Generic.List[object]
    $blankRun = 0
    $maxRow = $Worksheet.UsedRange.Rows.Count

    for ($r = $HeaderRow + 1; $r -le $maxRow; $r++) {
        $srNo = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.SrNo).Trim()
        $errorCode = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.ErrorCode).Trim()
        $device = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.Device).Trim()
        $alarmDescription = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.AlarmDescription).Trim()
        $alarmMessage = (Get-CellText -Worksheet $Worksheet -Row $r -Column $Columns.AlarmMessage).Trim()

        if ([string]::IsNullOrWhiteSpace($errorCode) -and [string]::IsNullOrWhiteSpace($alarmMessage) -and [string]::IsNullOrWhiteSpace($device)) {
            $blankRun++
            if ($blankRun -ge $MaxBlankRows) {
                break
            }

            continue
        }

        $blankRun = 0

        if ([string]::IsNullOrWhiteSpace($errorCode)) {
            continue
        }

        $deviceObj = $null
        $deviceKey = Normalize-Key -Value $device
        if ($deviceKey -and $DeviceByNameKey.Contains($deviceKey)) {
            $deviceObj = $DeviceByNameKey[$deviceKey]
        }
        elseif ($deviceKey -and $DeviceByCodeKey.Contains($deviceKey)) {
            $deviceObj = $DeviceByCodeKey[$deviceKey]
        }

        $plcTag = ""
        $shortcut = ""
        $plcReference = ""
        if ($deviceObj) {
            $plcTag = $deviceObj.PlcTag
            $shortcut = $deviceObj.Shortcut
            $plcReference = $deviceObj.PlcReference
        }

        $triggerTag = ""
        if ($plcTag) {
            $triggerTag = $AlarmTriggerTemplate.Replace('{PlcTag}', $plcTag).Replace('{ErrorCode}', $errorCode)
        }

        $alarmName = "ALM_$errorCode"
        $message = if ($alarmMessage) { $alarmMessage } else { "$errorCode $device $alarmDescription".Trim() }

        $rows.Add([PSCustomObject]@{
                AlarmName         = $alarmName
                ErrorCode         = $errorCode
                SrNo              = $srNo
                Device            = $device
                AlarmDescription  = $alarmDescription
                Message           = $message
                Severity          = $Severity
                AckRequired       = $AckRequired
                PlcTag            = $plcTag
                Shortcut          = $shortcut
                PlcReference      = $plcReference
                TriggerTag        = $triggerTag
                MappingStatus     = if ($plcTag) { "Mapped" } else { "Unmapped" }
            })
    }

    return $rows
}

function Build-ScreenSpecRows {
    param(
        $DeviceRows,
        [System.Collections.IDictionary]$TemplateByDeviceType,
        [string]$DefaultTemplate,
        [System.Collections.IDictionary]$GlobalObjectByDeviceType,
        [string]$DefaultGlobalObject
    )

    $rows = New-Object System.Collections.Generic.List[object]

    foreach ($row in $DeviceRows) {
        $typeKey = if ($row.DeviceType) { $row.DeviceType.Trim().ToUpperInvariant() } else { "" }

        $templateName = $DefaultTemplate
        if ($typeKey -and $TemplateByDeviceType.Contains($typeKey)) {
            $templateName = $TemplateByDeviceType[$typeKey]
        }

        $globalObject = $DefaultGlobalObject
        if ($typeKey -and $GlobalObjectByDeviceType.Contains($typeKey)) {
            $globalObject = $GlobalObjectByDeviceType[$typeKey]
        }

        $screenName = "EQP_{0}" -f ($row.EquipmentCode -replace '\s+', '_')
        $rows.Add([PSCustomObject]@{
                ScreenName       = $screenName
                EquipmentCode    = $row.EquipmentCode
                EquipmentName    = $row.EquipmentName
                DeviceType       = $row.DeviceType
                TemplateName     = $templateName
                GlobalObjectName = $globalObject
                Param_Equipment  = $row.EquipmentCode
                Param_PlcTag     = $row.PlcTag
                Param_Description = $row.EquipmentName
            })
    }

    return $rows
}

$masterSheetAbsolute = Get-AbsolutePath -PathValue $MasterSheetPath
$projectRootAbsolute = Get-AbsolutePath -PathValue $ProjectRoot
$configAbsolute = Get-AbsolutePath -PathValue $ConfigPath
$outputAbsolute = Get-AbsolutePath -PathValue $OutputDir

if (-not (Test-Path -LiteralPath $masterSheetAbsolute)) {
    throw "Master sheet not found: $masterSheetAbsolute"
}

if (-not (Test-Path -LiteralPath $projectRootAbsolute)) {
    throw "Project folder not found: $projectRootAbsolute"
}

if (-not (Test-Path -LiteralPath $configAbsolute)) {
    throw "Config file not found: $configAbsolute"
}

if (-not (Test-Path -LiteralPath $outputAbsolute)) {
    New-Item -Path $outputAbsolute -ItemType Directory | Out-Null
}

$config = Get-Content -LiteralPath $configAbsolute -Raw | ConvertFrom-Json

$excel = $null
$workbook = $null
try {
    $opened = Get-ExcelWorkbook -WorkbookPath $masterSheetAbsolute
    $excel = $opened[0]
    $workbook = $opened[1]

    $deviceSheet = Get-Worksheet -Workbook $workbook -Name $config.sheets.device.name
    $alarmSheet = Get-Worksheet -Workbook $workbook -Name $config.sheets.alarm.name

    $deviceRows = Read-DeviceRows -Worksheet $deviceSheet -Columns $config.sheets.device.columns -StartRow ([int]$config.sheets.device.startRow) -Shortcut ([string]$config.defaults.shortcut)

    $deviceByName = @{}
    $deviceByCode = @{}
    foreach ($d in $deviceRows) {
        $nameKey = Normalize-Key -Value $d.EquipmentName
        $codeKey = Normalize-Key -Value $d.EquipmentCode
        if ($nameKey -and -not $deviceByName.Contains($nameKey)) {
            $deviceByName[$nameKey] = $d
        }
        if ($codeKey -and -not $deviceByCode.Contains($codeKey)) {
            $deviceByCode[$codeKey] = $d
        }
    }

    $alarmHeaderRow = Find-AlarmHeaderRow -Worksheet $alarmSheet -SearchStartRow 1 -SearchEndRow ([int]$config.sheets.alarm.headerSearchMaxRow) -ErrorCodeColumn ([int]$config.sheets.alarm.columns.ErrorCode) -HeaderToken ([string]$config.sheets.alarm.headerToken)
    $alarmRows = Read-AlarmRows -Worksheet $alarmSheet -Columns $config.sheets.alarm.columns -HeaderRow $alarmHeaderRow -MaxBlankRows ([int]$config.sheets.alarm.maxBlankRowsBeforeStop) -DeviceByNameKey $deviceByName -DeviceByCodeKey $deviceByCode -Severity ([string]$config.defaults.alarmSeverity) -AckRequired ([string]$config.defaults.ackRequired) -AlarmTriggerTemplate ([string]$config.defaults.alarmTriggerTemplate)

    $templateMap = @{}
    foreach ($p in $config.deviceTypeToTemplate.PSObject.Properties) {
        $templateMap[$p.Name.ToUpperInvariant()] = [string]$p.Value
    }

    $globalObjectMap = @{}
    foreach ($p in $config.deviceTypeToGlobalObject.PSObject.Properties) {
        $globalObjectMap[$p.Name.ToUpperInvariant()] = [string]$p.Value
    }

    $screenSpecRows = Build-ScreenSpecRows -DeviceRows $deviceRows -TemplateByDeviceType $templateMap -DefaultTemplate ([string]$config.defaults.defaultTemplate) -GlobalObjectByDeviceType $globalObjectMap -DefaultGlobalObject ([string]$config.defaults.defaultGlobalObject
    )

    $deviceOut = Join-Path $outputAbsolute "device_map.csv"
    $alarmOut = Join-Path $outputAbsolute "alarms_seed.csv"
    $screenOut = Join-Path $outputAbsolute "screen_spec.csv"
    $parameterOut = Join-Path $outputAbsolute "global_object_params.csv"

    $deviceRows | Export-Csv -LiteralPath $deviceOut -NoTypeInformation
    $alarmRows | Export-Csv -LiteralPath $alarmOut -NoTypeInformation
    $screenSpecRows | Export-Csv -LiteralPath $screenOut -NoTypeInformation

    $screenSpecRows |
        Select-Object ScreenName, GlobalObjectName, Param_Equipment, Param_PlcTag, Param_Description |
        Export-Csv -LiteralPath $parameterOut -NoTypeInformation

    $summaryOut = Join-Path $outputAbsolute "generation_summary.txt"
    @(
        "MasterSheetPath=$masterSheetAbsolute"
        "ProjectRoot=$projectRootAbsolute"
        "DeviceCount=$($deviceRows.Count)"
        "AlarmCount=$($alarmRows.Count)"
        "MappedAlarms=$((($alarmRows | Where-Object { $_.MappingStatus -eq 'Mapped' }).Count))"
        "UnmappedAlarms=$((($alarmRows | Where-Object { $_.MappingStatus -eq 'Unmapped' }).Count))"
    ) | Set-Content -LiteralPath $summaryOut

    Write-Host "Generated files:"
    Write-Host " - $deviceOut"
    Write-Host " - $alarmOut"
    Write-Host " - $screenOut"
    Write-Host " - $parameterOut"
    Write-Host " - $summaryOut"
}
finally {
    Close-ExcelWorkbook -Excel $excel -Workbook $workbook
}
