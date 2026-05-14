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

function Expand-Template {
    param(
        [string]$Template,
        [hashtable]$Tokens
    )

    $expanded = $Template
    foreach ($key in $Tokens.Keys) {
        $replacement = if ($null -eq $Tokens[$key]) { "" } else { [string]$Tokens[$key] }
        $expanded = $expanded.Replace("{$key}", $replacement)
    }

    return $expanded
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

function Get-ProjectMetadata {
    param(
        [string]$ProjectRoot,
        [string[]]$RequiredDirectories
    )

    $medFiles = @(Get-ChildItem -LiteralPath $ProjectRoot -Filter *.med -File -ErrorAction Stop)
    if (-not $medFiles -or $medFiles.Count -eq 0) {
        throw "No .med project file found in project root: $ProjectRoot"
    }

    $missingDirectories = New-Object System.Collections.Generic.List[string]
    foreach ($directory in $RequiredDirectories) {
        $fullPath = Join-Path -Path $ProjectRoot -ChildPath $directory
        if (-not (Test-Path -LiteralPath $fullPath -PathType Container)) {
            $missingDirectories.Add($directory)
        }
    }

    if ($missingDirectories.Count -gt 0) {
        throw "Project root is missing required FactoryTalk directories: $($missingDirectories -join ', ')"
    }

    return [PSCustomObject]@{
        ProjectRoot         = $ProjectRoot
        ApplicationName     = [System.IO.Path]::GetFileNameWithoutExtension($medFiles[0].Name)
        MedFilePath         = $medFiles[0].FullName
        MedFileCount        = $medFiles.Count
        RequiredDirectories = ($RequiredDirectories -join ';')
    }
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

function Add-LookupValue {
    param(
        [hashtable]$Lookup,
        [string]$Key,
        $Value
    )

    if (-not $Key) {
        return
    }

    if (-not $Lookup.ContainsKey($Key)) {
        $Lookup[$Key] = New-Object System.Collections.Generic.List[object]
    }

    $Lookup[$Key].Add($Value)
}

function Get-LookupIssues {
    param(
        [hashtable]$Lookup,
        [string]$KeyType
    )

    $issues = New-Object System.Collections.Generic.List[object]
    foreach ($entry in $Lookup.GetEnumerator()) {
        if ($entry.Value.Count -le 1) {
            continue
        }

        $issues.Add([PSCustomObject]@{
                KeyType          = $KeyType
                NormalizedKey    = $entry.Key
                MatchCount       = $entry.Value.Count
                EquipmentCodes   = ($entry.Value | ForEach-Object { $_.EquipmentCode } | Sort-Object -Unique) -join '; '
                EquipmentNames   = ($entry.Value | ForEach-Object { $_.EquipmentName } | Sort-Object -Unique) -join '; '
                PlcTags          = ($entry.Value | ForEach-Object { $_.PlcTag } | Where-Object { $_ } | Sort-Object -Unique) -join '; '
            })
    }

    return $issues
}

function Resolve-DeviceMatch {
    param(
        [string]$DeviceText,
        [hashtable]$DeviceByNameKey,
        [hashtable]$DeviceByCodeKey
    )

    $deviceKey = Normalize-Key -Value $DeviceText
    if (-not $deviceKey) {
        return [PSCustomObject]@{
            Status          = "Unmapped"
            MatchSource     = "None"
            Device          = $null
            CandidateCodes  = ""
        }
    }

    if ($DeviceByNameKey.ContainsKey($deviceKey)) {
        $nameMatches = $DeviceByNameKey[$deviceKey]
        if ($nameMatches.Count -eq 1) {
            return [PSCustomObject]@{
                Status         = "MatchedByName"
                MatchSource    = "Name"
                Device         = $nameMatches[0]
                CandidateCodes = ($nameMatches | ForEach-Object { $_.EquipmentCode } | Sort-Object -Unique) -join '; '
            }
        }

        return [PSCustomObject]@{
            Status         = "Ambiguous"
            MatchSource    = "Name"
            Device         = $null
            CandidateCodes = ($nameMatches | ForEach-Object { $_.EquipmentCode } | Sort-Object -Unique) -join '; '
        }
    }

    if ($DeviceByCodeKey.ContainsKey($deviceKey)) {
        $codeMatches = $DeviceByCodeKey[$deviceKey]
        if ($codeMatches.Count -eq 1) {
            return [PSCustomObject]@{
                Status         = "MatchedByCode"
                MatchSource    = "Code"
                Device         = $codeMatches[0]
                CandidateCodes = ($codeMatches | ForEach-Object { $_.EquipmentCode } | Sort-Object -Unique) -join '; '
            }
        }

        return [PSCustomObject]@{
            Status         = "Ambiguous"
            MatchSource    = "Code"
            Device         = $null
            CandidateCodes = ($codeMatches | ForEach-Object { $_.EquipmentCode } | Sort-Object -Unique) -join '; '
        }
    }

    return [PSCustomObject]@{
        Status          = "Unmapped"
        MatchSource     = "None"
        Device          = $null
        CandidateCodes  = ""
    }
}

function Read-DeviceRows {
    param(
        $Worksheet,
        $Columns,
        [int]$StartRow,
        [string]$Shortcut,
        [string]$DevicePlcReferenceTemplate
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

        $plcReference = ""
        if (-not [string]::IsNullOrWhiteSpace($plcTag)) {
            $plcReference = Expand-Template -Template $DevicePlcReferenceTemplate -Tokens @{
                Shortcut      = $Shortcut
                PlcTag        = $plcTag
                EquipmentCode = $equipmentCode
                EquipmentName = $equipmentName
                DeviceType    = $deviceType
            }
        }

        $rows.Add([PSCustomObject]@{
                RowNo         = $r
                EquipmentName = $equipmentName
                EquipmentCode = $equipmentCode
                DeviceType    = $deviceType
                PlcTag        = $plcTag
                Shortcut      = $Shortcut
                PlcReference  = $plcReference
                PlcTagStatus  = if ([string]::IsNullOrWhiteSpace($plcTag)) { "MissingPlcTag" } else { "Ready" }
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

        $match = Resolve-DeviceMatch -DeviceText $device -DeviceByNameKey $DeviceByNameKey -DeviceByCodeKey $DeviceByCodeKey
        $deviceObj = $match.Device

        $plcTag = ""
        $shortcut = ""
        $plcReference = ""
        $mappingStatus = $match.Status
        if ($deviceObj) {
            $plcTag = $deviceObj.PlcTag
            $shortcut = $deviceObj.Shortcut
            $plcReference = $deviceObj.PlcReference
            if ([string]::IsNullOrWhiteSpace($plcTag)) {
                $mappingStatus = "MatchedNoPlcTag"
            }
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
                MappingStatus     = $mappingStatus
                MatchSource       = $match.MatchSource
                CandidateCodes    = $match.CandidateCodes
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
        [string]$DefaultGlobalObject,
        [string]$ScreenNameTemplate
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

        $screenName = Expand-Template -Template $ScreenNameTemplate -Tokens @{
            EquipmentCode = ($row.EquipmentCode -replace '[^A-Za-z0-9_]', '_')
            EquipmentName = ($row.EquipmentName -replace '[^A-Za-z0-9_]', '_')
            DeviceType    = ($row.DeviceType -replace '[^A-Za-z0-9_]', '_')
            PlcTag        = ($row.PlcTag -replace '[^A-Za-z0-9_]', '_')
        }
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
            ScreenStatus     = if ([string]::IsNullOrWhiteSpace($row.PlcTag)) { "NeedsPlcTag" } else { "Ready" }
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

$requiredDirectories = @("Gfx", "Global Objects", "TAG")
if ($config.PSObject.Properties.Name -contains "project" -and $config.project -and $config.project.requiredDirectories) {
    $requiredDirectories = @($config.project.requiredDirectories)
}

$devicePlcReferenceTemplate = "[{Shortcut}]{PlcTag}"
if ($config.defaults.PSObject.Properties.Name -contains "devicePlcReferenceTemplate" -and $config.defaults.devicePlcReferenceTemplate) {
    $devicePlcReferenceTemplate = [string]$config.defaults.devicePlcReferenceTemplate
}

$screenNameTemplate = "EQP_{EquipmentCode}"
if ($config.defaults.PSObject.Properties.Name -contains "screenNameTemplate" -and $config.defaults.screenNameTemplate) {
    $screenNameTemplate = [string]$config.defaults.screenNameTemplate
}

$excel = $null
$workbook = $null
try {
    $projectMetadata = Get-ProjectMetadata -ProjectRoot $projectRootAbsolute -RequiredDirectories $requiredDirectories

    $opened = Get-ExcelWorkbook -WorkbookPath $masterSheetAbsolute
    $excel = $opened[0]
    $workbook = $opened[1]

    $deviceSheet = Get-Worksheet -Workbook $workbook -Name $config.sheets.device.name
    $alarmSheet = Get-Worksheet -Workbook $workbook -Name $config.sheets.alarm.name

    $deviceRows = Read-DeviceRows -Worksheet $deviceSheet -Columns $config.sheets.device.columns -StartRow ([int]$config.sheets.device.startRow) -Shortcut ([string]$config.defaults.shortcut) -DevicePlcReferenceTemplate $devicePlcReferenceTemplate

    $deviceByName = @{}
    $deviceByCode = @{}
    foreach ($d in $deviceRows) {
        $nameKey = Normalize-Key -Value $d.EquipmentName
        $codeKey = Normalize-Key -Value $d.EquipmentCode
        Add-LookupValue -Lookup $deviceByName -Key $nameKey -Value $d
        Add-LookupValue -Lookup $deviceByCode -Key $codeKey -Value $d
    }

    $lookupIssues = New-Object System.Collections.Generic.List[object]
    foreach ($issue in (Get-LookupIssues -Lookup $deviceByName -KeyType "EquipmentName")) {
        $lookupIssues.Add($issue)
    }
    foreach ($issue in (Get-LookupIssues -Lookup $deviceByCode -KeyType "EquipmentCode")) {
        $lookupIssues.Add($issue)
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

    $screenSpecRows = Build-ScreenSpecRows -DeviceRows $deviceRows -TemplateByDeviceType $templateMap -DefaultTemplate ([string]$config.defaults.defaultTemplate) -GlobalObjectByDeviceType $globalObjectMap -DefaultGlobalObject ([string]$config.defaults.defaultGlobalObject) -ScreenNameTemplate $screenNameTemplate

    $deviceOut = Join-Path $outputAbsolute "device_map.csv"
    $alarmOut = Join-Path $outputAbsolute "alarms_seed.csv"
    $screenOut = Join-Path $outputAbsolute "screen_spec.csv"
    $parameterOut = Join-Path $outputAbsolute "global_object_params.csv"
    $lookupIssueOut = Join-Path $outputAbsolute "device_key_issues.csv"

    $deviceRows | Export-Csv -LiteralPath $deviceOut -NoTypeInformation
    $alarmRows | Export-Csv -LiteralPath $alarmOut -NoTypeInformation
    $screenSpecRows | Export-Csv -LiteralPath $screenOut -NoTypeInformation

    $screenSpecRows |
        Select-Object ScreenName, GlobalObjectName, Param_Equipment, Param_PlcTag, Param_Description |
        Export-Csv -LiteralPath $parameterOut -NoTypeInformation
    $lookupIssues | Export-Csv -LiteralPath $lookupIssueOut -NoTypeInformation

    $summaryOut = Join-Path $outputAbsolute "generation_summary.txt"
    @(
        "MasterSheetPath=$masterSheetAbsolute"
        "ProjectRoot=$projectRootAbsolute"
        "ProjectApplicationName=$($projectMetadata.ApplicationName)"
        "ProjectMedFile=$($projectMetadata.MedFilePath)"
        "DeviceCount=$($deviceRows.Count)"
        "DevicesMissingPlcTag=$(@($deviceRows | Where-Object { $_.PlcTagStatus -eq 'MissingPlcTag' }).Count)"
        "AlarmCount=$($alarmRows.Count)"
        "MappedAlarms=$(@($alarmRows | Where-Object { $_.MappingStatus -like 'Matched*' -or $_.MappingStatus -eq 'Mapped' }).Count)"
        "AmbiguousAlarms=$(@($alarmRows | Where-Object { $_.MappingStatus -eq 'Ambiguous' }).Count)"
        "UnmappedAlarms=$(@($alarmRows | Where-Object { $_.MappingStatus -eq 'Unmapped' }).Count)"
        "DuplicateDeviceKeys=$($lookupIssues.Count)"
    ) | Set-Content -LiteralPath $summaryOut

    Write-Host "Generated files:"
    Write-Host " - $deviceOut"
    Write-Host " - $alarmOut"
    Write-Host " - $screenOut"
    Write-Host " - $parameterOut"
    Write-Host " - $lookupIssueOut"
    Write-Host " - $summaryOut"
}
finally {
    Close-ExcelWorkbook -Excel $excel -Workbook $workbook
}
