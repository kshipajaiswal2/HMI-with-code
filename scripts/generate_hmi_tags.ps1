param(
    [Parameter(Mandatory = $true)]
    [string]$EquipmentFile,

    [Parameter(Mandatory = $false)]
    [string]$OutputFile = "generated/hmi_tags.csv"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-TemplateRows {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TemplateName
    )

    switch ($TemplateName.ToLowerInvariant()) {
        "pallet_dispenser" {
            return @(
                @{ Suffix = "StartCmd"; DataType = "BOOL"; Access = "Read/Write"; Description = "Start command" }
                @{ Suffix = "StopCmd"; DataType = "BOOL"; Access = "Read/Write"; Description = "Stop command" }
                @{ Suffix = "SetSpeed"; DataType = "REAL"; Access = "Read/Write"; Description = "Speed setpoint" }
                @{ Suffix = "RunningSpeed"; DataType = "REAL"; Access = "Read"; Description = "Actual running speed" }
                @{ Suffix = "MotorCurrent"; DataType = "REAL"; Access = "Read"; Description = "Motor current" }
                @{ Suffix = "MPCB_Healthy"; DataType = "BOOL"; Access = "Read"; Description = "MPCB healthy feedback" }
            )
        }
        "stopper" {
            return @(
                @{ Suffix = "UpCmd"; DataType = "BOOL"; Access = "Read/Write"; Description = "Move up command" }
                @{ Suffix = "DownCmd"; DataType = "BOOL"; Access = "Read/Write"; Description = "Move down command" }
                @{ Suffix = "UpFb"; DataType = "BOOL"; Access = "Read"; Description = "Up position feedback" }
                @{ Suffix = "DownFb"; DataType = "BOOL"; Access = "Read"; Description = "Down position feedback" }
            )
        }
        default {
            throw "Unsupported template '$TemplateName'. Supported values: pallet_dispenser, stopper"
        }
    }
}

if (-not (Test-Path -LiteralPath $EquipmentFile)) {
    throw "Equipment file not found: $EquipmentFile"
}

$rows = Import-Csv -LiteralPath $EquipmentFile
if (-not $rows -or $rows.Count -eq 0) {
    throw "Equipment file is empty: $EquipmentFile"
}

$outRows = New-Object System.Collections.Generic.List[object]

foreach ($row in $rows) {
    if (-not $row.Equipment -or -not $row.Template) {
        throw "Each row must contain Equipment and Template columns."
    }

    $equipment = $row.Equipment.Trim()
    $template = $row.Template.Trim()
    $shortcut = if ($row.Shortcut) { $row.Shortcut.Trim() } else { "Offline" }

    $templateRows = Get-TemplateRows -TemplateName $template
    foreach ($templateRow in $templateRows) {
        $baseTag = "$equipment.$($templateRow.Suffix)"
        $outRows.Add([PSCustomObject]@{
                HmiTagName   = $baseTag
                PlcReference = "[$shortcut]$baseTag"
                DataType     = $templateRow.DataType
                Access       = $templateRow.Access
                Description  = $templateRow.Description
            })
    }
}

$outputDirectory = Split-Path -Path $OutputFile -Parent
if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -Path $outputDirectory -ItemType Directory | Out-Null
}

$outRows | Export-Csv -Path $OutputFile -NoTypeInformation
Write-Host "Generated $($outRows.Count) HMI tags at: $OutputFile"
