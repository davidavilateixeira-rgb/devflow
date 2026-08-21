param(
    [Parameter(Mandatory = $true)]
    [string]$EnvFile,
    [int]$IntervalMinutes = 2,
    [string]$TaskName = "DevFlow - Monitor SC ERP"
)

$ErrorActionPreference = "Stop"
if ($IntervalMinutes -lt 1) { throw "IntervalMinutes deve ser maior ou igual a 1." }
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw "Arquivo .env nao encontrado: $EnvFile" }

$repository = Split-Path -Parent $PSScriptRoot
$connector = Join-Path $PSScriptRoot "sincronizar_compras_sc.py"
$python = (Get-Command python -ErrorAction Stop).Source
$userId = "$env:USERDOMAIN\$env:USERNAME"

$arguments = '"' + $connector + '" --only-requested --env-file "' + $EnvFile + '"'
$action = New-ScheduledTaskAction -Execute $python -Argument $arguments -WorkingDirectory "C:\Windows\Temp"
$logon = New-ScheduledTaskTrigger -AtLogOn -User $userId
$periodic = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
    -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 1)

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Set-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($logon, $periodic) -Settings $settings | Out-Null
} else {
    $principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger @($logon, $periodic) `
        -Settings $settings -Principal $principal -Description "Processa somente solicitacoes ERP do DevFlow." | Out-Null
}

Start-ScheduledTask -TaskName $TaskName
Write-Host "Tarefa '$TaskName' configurada a cada $IntervalMinutes minuto(s)."
Write-Host "Repositorio: $repository"
