param(
    [Parameter(Mandatory = $false)]
    [string]$TagTemplateCsv = "hmi/import_templates/hmi_tags_template.csv",

    [Parameter(Mandatory = $false)]
    [string]$AlarmTemplateCsv = "hmi/import_templates/alarms_template.csv",

    [Parameter(Mandatory = $false)]
    [string]$TagSourceCsv = "generated/change_set_demo/device_map.changed.csv",

    [Parameter(Mandatory = $false)]
    [string]$AlarmSourceCsv = "generated/change_set_demo/alarms_seed.changed.csv",

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "generated/factorytalk_import_ready"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Header {
    param([string]$Value)

    if (-not $Value) {
        return ""
    }

    return ($Value -replace '[^A-Za-z0-9]', '').ToLowerInvariant()
}

function Ensure-Dir {
    param([string]$PathValue)

    if (-not (Test-Path -LiteralPath $PathValue)) {
        New-Item -Path $PathValue -ItemType Directory | Out-Null
    }
}

function Find-HeaderMatch {
    param(
        [string[]]$Headers,
        [string[]]$PreferredPatterns
    )

    $normalized = @{}
    foreach ($header in $Headers) {
        $normalized[$header] = Normalize-Header -Value $header
    }

    foreach ($pattern in $PreferredPatterns) {
        foreach ($header in $Headers) {
            if ($normalized[$header] -like $pattern) {
                return $header
            }
        }
    }

    return $null
}

function Build-TagTemplateMap {
    param([string[]]$TemplateHeaders)

    $map = @{}
    $map.TagName = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*tagname*", "*name*", "*hmitag*")
    $map.PlcRef = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*plcreference*", "*address*", "*reference*", "*tagaddress*")
    $map.DataType = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*datatype*", "*type*")
    $map.Access = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*access*", "*readwrite*", "*security*")
    $map.Description = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*description*", "*desc*", "*comment*")
    return $map
}

function Build-AlarmTemplateMap {
    param([string[]]$TemplateHeaders)

    $map = @{}
    $map.AlarmName = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*alarmname*", "*name*")
    $map.ErrorCode = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*errorcode*", "*code*")
    $map.Message = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*message*", "*text*")
    $map.Severity = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*severity*", "*priority*")
    $map.Ack = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*ack*", "*ackrequired*")
    $map.Trigger = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*trigger*", "*expression*", "*condition*")
    $map.Device = Find-HeaderMatch -Headers $TemplateHeaders -PreferredPatterns @("*device*", "*area*")
    return $map
}

function New-OutputRows {
    param(
        [object[]]$SourceRows,
        [string[]]$TemplateHeaders,
        [hashtable]$Map,
        [ValidateSet("Tag", "Alarm")]
        [string]$Mode
    )

    $output = New-Object System.Collections.Generic.List[object]

    foreach ($row in $SourceRows) {
        $result = [ordered]@{}
        foreach ($header in $TemplateHeaders) {
            $result[$header] = ""
        }

        if ($Mode -eq "Tag") {
            if ($Map.TagName) { $result[$Map.TagName] = if ($row.EquipmentCode) { [string]$row.EquipmentCode } else { [string]$row.PlcTag } }
            if ($Map.PlcRef) { $result[$Map.PlcRef] = [string]$row.PlcReference }
            if ($Map.DataType) { $result[$Map.DataType] = "DINT" }
            if ($Map.Access) { $result[$Map.Access] = "Read/Write" }
            if ($Map.Description) { $result[$Map.Description] = [string]$row.EquipmentName }
        }
        else {
            if ($Map.AlarmName) { $result[$Map.AlarmName] = [string]$row.AlarmName }
            if ($Map.ErrorCode) { $result[$Map.ErrorCode] = [string]$row.ErrorCode }
            if ($Map.Message) { $result[$Map.Message] = [string]$row.Message }
            if ($Map.Severity) { $result[$Map.Severity] = [string]$row.Severity }
            if ($Map.Ack) { $result[$Map.Ack] = [string]$row.AckRequired }
            if ($Map.Trigger) { $result[$Map.Trigger] = [string]$row.TriggerTag }
            if ($Map.Device) { $result[$Map.Device] = [string]$row.Device }
        }

        $output.Add([PSCustomObject]$result)
    }

    return $output
}

if (-not (Test-Path -LiteralPath $TagTemplateCsv)) {
    throw "Tag template CSV not found: $TagTemplateCsv"
}

if (-not (Test-Path -LiteralPath $AlarmTemplateCsv)) {
    throw "Alarm template CSV not found: $AlarmTemplateCsv"
}

if (-not (Test-Path -LiteralPath $TagSourceCsv)) {
    throw "Tag source CSV not found: $TagSourceCsv"
}

if (-not (Test-Path -LiteralPath $AlarmSourceCsv)) {
    throw "Alarm source CSV not found: $AlarmSourceCsv"
}

$tagTemplateRows = @((Import-Csv -LiteralPath $TagTemplateCsv))
$alarmTemplateRows = @((Import-Csv -LiteralPath $AlarmTemplateCsv))
$tagSourceRows = @((Import-Csv -LiteralPath $TagSourceCsv))
$alarmSourceRows = @((Import-Csv -LiteralPath $AlarmSourceCsv))

if ($tagTemplateRows.Count -eq 0) {
    throw "Tag template CSV has no data rows. Keep one sample row in template export."
}

if ($alarmTemplateRows.Count -eq 0) {
    throw "Alarm template CSV has no data rows. Keep one sample row in template export."
}

$tagHeaders = @($tagTemplateRows[0].PSObject.Properties.Name)
$alarmHeaders = @($alarmTemplateRows[0].PSObject.Properties.Name)

$tagMap = Build-TagTemplateMap -TemplateHeaders $tagHeaders
$alarmMap = Build-AlarmTemplateMap -TemplateHeaders $alarmHeaders

$tagOutputRows = New-OutputRows -SourceRows $tagSourceRows -TemplateHeaders $tagHeaders -Map $tagMap -Mode Tag
$alarmOutputRows = New-OutputRows -SourceRows $alarmSourceRows -TemplateHeaders $alarmHeaders -Map $alarmMap -Mode Alarm

Ensure-Dir -PathValue $OutputDir

$tagOutPath = Join-Path $OutputDir "hmi_tags.import_ready.csv"
$alarmOutPath = Join-Path $OutputDir "alarms.import_ready.csv"
$summaryOutPath = Join-Path $OutputDir "import_mapping_summary.txt"

$tagOutputRows | Export-Csv -LiteralPath $tagOutPath -NoTypeInformation
$alarmOutputRows | Export-Csv -LiteralPath $alarmOutPath -NoTypeInformation

@(
    "TagTemplateCsv=$TagTemplateCsv"
    "AlarmTemplateCsv=$AlarmTemplateCsv"
    "TagSourceCsv=$TagSourceCsv"
    "AlarmSourceCsv=$AlarmSourceCsv"
    "TagRowsOut=$($tagOutputRows.Count)"
    "AlarmRowsOut=$($alarmOutputRows.Count)"
    "TagFieldMap_TagName=$($tagMap.TagName)"
    "TagFieldMap_PlcRef=$($tagMap.PlcRef)"
    "AlarmFieldMap_AlarmName=$($alarmMap.AlarmName)"
    "AlarmFieldMap_Trigger=$($alarmMap.Trigger)"
) | Set-Content -LiteralPath $summaryOutPath

Write-Host "Generated FactoryTalk import-ready files:"
Write-Host " - $tagOutPath"
Write-Host " - $alarmOutPath"
Write-Host " - $summaryOutPath"
