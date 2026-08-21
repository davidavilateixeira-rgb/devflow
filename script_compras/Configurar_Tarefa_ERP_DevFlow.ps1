param(
    [Parameter(Mandatory = $true)]
    [string]$EnvFile,
    [int]$IntervalMinutes = 2,
    [string]$TaskName = "DevFlow - Monitor SC ERP"
)

$ErrorActionPreference = "Stop"
if ($IntervalMinutes -lt 1) { throw "IntervalMinutes deve ser maior ou igual a 1." }
if (-not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw "Arquivo .env nao encontrado: $EnvFile" }

function Convert-ToStableTaskPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    $resolved = (Resolve-Path -LiteralPath $Path).Path
    if ($resolved -match '^([A-Za-z]):\\(.*)$') {
        $driveName = $Matches[1]
        $relativePath = $Matches[2]
        $drive = Get-PSDrive -Name $driveName -ErrorAction SilentlyContinue
        if ($drive -and $drive.DisplayRoot) {
            return Join-Path $drive.DisplayRoot $relativePath
        }
    }
    return $resolved
}

$repository = Convert-ToStableTaskPath (Split-Path -Parent $PSScriptRoot)
$connector = Convert-ToStableTaskPath (Join-Path $PSScriptRoot "sincronizar_compras_sc.py")
$pythonCommand = Get-Command pythonw -ErrorAction SilentlyContinue
if (-not $pythonCommand) { $pythonCommand = Get-Command python -ErrorAction Stop }
$python = $pythonCommand.Source
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
Write-Host "Execucao sem janela: $([IO.Path]::GetFileName($python) -ieq 'pythonw.exe')"
Write-Host "Repositorio: $repository"
