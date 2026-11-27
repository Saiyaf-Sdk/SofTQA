[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$JMeter,
    [ValidateRange(1024,65535)][int]$Port = 4282
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sut = Join-Path $root 'sut'
$run = Join-Path $root ('.tools/jmeter-run-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory $run | Out-Null
$jmeterCommand = (Get-Command $JMeter).Source
$nodeCommand = (Get-Command node).Source
$env:HOST = '127.0.0.1'
$env:DATABASE_PATH = ':memory:'
$service = Start-Process $nodeCommand -ArgumentList 'server/index.mjs','--port',$Port -WorkingDirectory $sut -PassThru -WindowStyle Hidden -RedirectStandardOutput "$run/server.txt" -RedirectStandardError "$run/server-error.txt"
try {
    $ready = $false
    for ($i = 0; $i -lt 50 -and !$service.HasExited; $i++) {
        try {
            $response = Invoke-WebRequest "http://127.0.0.1:$Port/api/products" -TimeoutSec 1
            $ready = $response.StatusCode -eq 200
        } catch {}
        if ($ready) { break }
        Start-Sleep -Milliseconds 200
    }
    if (!$ready) { throw "Storefront did not start on $Port." }

    foreach ($users in @(1, 10)) {
        $name = if ($users -eq 1) { 'baseline' } else { 'load' }
        & $jmeterCommand -n -t "$PSScriptRoot/catalog-load.jmx" -l "$run/$name.jtl" -j "$run/$name.log" "-Jport=$Port" "-Jusers=$users" '-Jloops=50' '-Jjmeter.save.saveservice.output_format=csv' |
            Tee-Object -FilePath "$run/$name-console.txt"
        if ($LASTEXITCODE) { throw "JMeter failed for $users users." }
    }
    $summary = & $nodeCommand "$PSScriptRoot/summarize-jmeter.mjs" "$run/baseline.jtl" "$run/load.jtl"
    if ($LASTEXITCODE) { throw 'Results could not be summarized.' }
    $summary | Set-Content "$run/summary.json" -Encoding utf8NoBOM
    $summary
    Write-Host "Raw evidence directory $run"
    $missedThreshold = $summary | ConvertFrom-Json | Where-Object { -not $_.thresholdPassed }
    if ($missedThreshold) {
        throw "Catalog load threshold failed for user counts: $($missedThreshold.users -join ', ')."
    }
} finally {
    if (!$service.HasExited) { Stop-Process -Id $service.Id }
}
