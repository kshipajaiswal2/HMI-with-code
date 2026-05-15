param(
    [Parameter(Mandatory = $false)]
    [string]$InputDir = "generated",

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "generated/change_set_demo",

    [Parameter(Mandatory = $false)]
    [string]$NewShortcut = "PLC01",

    [Parameter(Mandatory = $false)]
    [switch]$RenameRobotTags = $true,

    [Parameter(Mandatory = $false)]
    [string]$RobotTagOldToken = "ROB",

    [Parameter(Mandatory = $false)]
    [string]$RobotTagNewToken = "RBT",

    [Parameter(Mandatory = $false)]
    [int]$AddAlarmsCount = 20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Ensure-Array {
    param($Value)
    return @($Value)
}

function Ensure-Dir {
    param([string]$PathValue)
    if (-not (Test-Path -LiteralPath $PathValue)) {
        New-Item -Path $PathValue -ItemType Directory | Out-Null
    }
}

function New-Row {
    param(
        [string[]]$Columns,
        [hashtable]$Values
    )

    $row = [ordered]@{}
    foreach ($column in $Columns) {
        if ($Values.ContainsKey($column)) {
            $row[$column] = [string]$Values[$column]
        }
        else {
            $row[$column] = ""
        }
    }

    return [PSCustomObject]$row
}

if (-not (Test-Path -LiteralPath $InputDir)) {
    throw "Input directory not found: $InputDir"
}

$deviceMapPath = Join-Path $InputDir "device_map.csv"
$alarmsPath = Join-Path $InputDir "alarms_seed.csv"
$screenSpecPath = Join-Path $InputDir "screen_spec.csv"

foreach ($required in @($deviceMapPath, $alarmsPath, $screenSpecPath)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Required input file not found: $required"
    }
}

$deviceRows = Ensure-Array (Import-Csv -LiteralPath $deviceMapPath)
$alarmRows = Ensure-Array (Import-Csv -LiteralPath $alarmsPath)
$screenRows = Ensure-Array (Import-Csv -LiteralPath $screenSpecPath)

if ($deviceRows.Count -eq 0 -or $alarmRows.Count -eq 0 -or $screenRows.Count -eq 0) {
    throw "One or more input CSV files are empty."
}

$robotTagMap = @{}

foreach ($row in $deviceRows) {
    $oldTag = [string]$row.PlcTag
    $newTag = $oldTag

    if ($RenameRobotTags -and $oldTag -and ($oldTag.ToUpperInvariant().Contains($RobotTagOldToken.ToUpperInvariant()) -or [string]$row.EquipmentName -match 'ROBOT')) {
        $newTag = $oldTag -replace [regex]::Escape($RobotTagOldToken), $RobotTagNewToken
        if ($newTag -ne $oldTag) {
            $robotTagMap[$oldTag] = $newTag
            $row.PlcTag = $newTag
        }
    }

    if ($NewShortcut -and $row.PlcTag) {
        $row.Shortcut = $NewShortcut
        $row.PlcReference = "[$NewShortcut]$($row.PlcTag)"
    }
}

foreach ($row in $alarmRows) {
    $oldTag = [string]$row.PlcTag
    if ($oldTag -and $robotTagMap.ContainsKey($oldTag)) {
        $row.PlcTag = $robotTagMap[$oldTag]
    }

    if ($NewShortcut -and $row.PlcTag) {
        $row.Shortcut = $NewShortcut
        $row.PlcReference = "[$NewShortcut]$($row.PlcTag)"
    }

    if ($row.PlcTag -and $row.ErrorCode) {
        $row.TriggerTag = "$($row.PlcTag).Alarm.$($row.ErrorCode)"
    }

    if (-not $row.MappingStatus -and $row.PlcTag) {
        $row.MappingStatus = "Mapped"
    }
}

foreach ($row in $screenRows) {
    $oldTag = [string]$row.Param_PlcTag
    if ($oldTag -and $robotTagMap.ContainsKey($oldTag)) {
        $row.Param_PlcTag = $robotTagMap[$oldTag]
    }

    if ($row.Param_PlcTag) {
        $row.ScreenStatus = "Ready"
    }
}

$maxError = 0
foreach ($row in $alarmRows) {
    $match = [regex]::Match([string]$row.ErrorCode, '^E(\d+)$')
    if ($match.Success) {
        $n = [int]$match.Groups[1].Value
        if ($n -gt $maxError) {
            $maxError = $n
        }
    }
}

$mappedCandidates = $alarmRows | Where-Object { $_.PlcTag } | Select-Object -First 1
$seedTag = if (@($mappedCandidates).Count -gt 0) { [string]$mappedCandidates[0].PlcTag } else { "FB_SYS01" }
$seedShortcut = if ($NewShortcut) { $NewShortcut } else { "Offline" }

$alarmColumns = @($alarmRows[0].PSObject.Properties.Name)
for ($i = 1; $i -le $AddAlarmsCount; $i++) {
    $codeNum = $maxError + $i
    $errorCode = "E{0:D3}" -f $codeNum
    $values = @{
        AlarmName        = "ALM_$errorCode"
        ErrorCode        = $errorCode
        SrNo             = [string]($alarmRows.Count + $i)
        Device           = "System"
        AlarmDescription = "Demo generated alarm"
        Message          = "$errorCode Demo generated alarm"
        Severity         = "500"
        AckRequired      = "true"
        PlcTag           = $seedTag
        Shortcut         = $seedShortcut
        PlcReference     = "[$seedShortcut]$seedTag"
        TriggerTag       = "$seedTag.Alarm.$errorCode"
        MappingStatus    = "Mapped"
        MatchSource      = "Generated"
        CandidateCodes   = ""
    }
    $alarmRows += (New-Row -Columns $alarmColumns -Values $values)
}

Ensure-Dir -PathValue $OutputDir

$deviceOut = Join-Path $OutputDir "device_map.changed.csv"
$alarmOut = Join-Path $OutputDir "alarms_seed.changed.csv"
$screenOut = Join-Path $OutputDir "screen_spec.changed.csv"
$summaryOut = Join-Path $OutputDir "change_set_summary.txt"

$deviceRows | Export-Csv -LiteralPath $deviceOut -NoTypeInformation
$alarmRows | Export-Csv -LiteralPath $alarmOut -NoTypeInformation
$screenRows | Export-Csv -LiteralPath $screenOut -NoTypeInformation

@(
    "InputDir=$InputDir"
    "OutputDir=$OutputDir"
    "NewShortcut=$NewShortcut"
    "RenameRobotTags=$RenameRobotTags"
    "RobotTagsRenamed=$($robotTagMap.Count)"
    "AddedAlarms=$AddAlarmsCount"
    "DeviceRows=$($deviceRows.Count)"
    "AlarmRows=$($alarmRows.Count)"
    "ScreenRows=$($screenRows.Count)"
) | Set-Content -LiteralPath $summaryOut

Write-Host "Generated changed files:"
Write-Host " - $deviceOut"
Write-Host " - $alarmOut"
Write-Host " - $screenOut"
Write-Host " - $summaryOut"
