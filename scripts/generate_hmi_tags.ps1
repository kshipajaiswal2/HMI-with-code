param(
    [Parameter(Mandatory = $true)]
    [string]$EquipmentFile,

    [Parameter(Mandatory = $false)]
    [string]$OutputFile = "generated/hmi_tags.csv",

    [Parameter(Mandatory = $false)]
    [string]$HmiTagTemplate = "{Equipment}.{Suffix}",

    [Parameter(Mandatory = $false)]
    [string]$PlcReferenceTemplate = "[{Shortcut}]{PlcTagPath}"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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
    $hmiBasePath = if ($row.PSObject.Properties.Name -contains 'HmiBasePath' -and $row.HmiBasePath) { $row.HmiBasePath.Trim() } else { $equipment }
    $plcBasePath = if ($row.PSObject.Properties.Name -contains 'PlcBasePath' -and $row.PlcBasePath) { $row.PlcBasePath.Trim() } else { $equipment }

    $templateRows = Get-TemplateRows -TemplateName $template
    foreach ($templateRow in $templateRows) {
        $hmiTagName = Expand-Template -Template $HmiTagTemplate -Tokens @{
            Equipment   = $equipment
            Suffix      = $templateRow.Suffix
            Shortcut    = $shortcut
            HmiBasePath = $hmiBasePath
            PlcBasePath = $plcBasePath
            PlcTagPath  = "$plcBasePath.$($templateRow.Suffix)"
        }
        $plcReference = Expand-Template -Template $PlcReferenceTemplate -Tokens @{
            Equipment   = $equipment
            Suffix      = $templateRow.Suffix
            Shortcut    = $shortcut
            HmiBasePath = $hmiBasePath
            PlcBasePath = $plcBasePath
            HmiTagName  = $hmiTagName
            PlcTagPath  = "$plcBasePath.$($templateRow.Suffix)"
        }

        $outRows.Add([PSCustomObject]@{
                HmiTagName   = $hmiTagName
                PlcReference = $plcReference
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
