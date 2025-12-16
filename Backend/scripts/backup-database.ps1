# Script de Backup de Base de Datos
# Ejecutar: .\scripts\backup-database.ps1

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = ".\backups"
$backupFile = "$backupDir\backup_comunidadinteligente_$timestamp.sql"

# Crear directorio de backups si no existe
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Directorio de backups creado: $backupDir" -ForegroundColor Green
}

Write-Host ""
Write-Host "Leyendo configuracion de la base de datos..." -ForegroundColor Cyan

$dbName = "comunidadinteligente"
$dbUser = "root"
$dbPassword = ""
$dbHost = "127.0.0.1"
$dbPort = "3306"

Write-Host "   Base de datos: $dbName" -ForegroundColor Yellow
Write-Host "   Usuario: $dbUser" -ForegroundColor Yellow
Write-Host "   Host: $dbHost" -ForegroundColor Yellow
Write-Host "   Puerto: $dbPort" -ForegroundColor Yellow

# Buscar mysqldump
$mysqldumpPaths = @(
    "C:\xampp\mysql\bin\mysqldump.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe"
)

$mysqldump = $null
foreach ($path in $mysqldumpPaths) {
    if (Test-Path $path) {
        $mysqldump = $path
        break
    }
}

if (!$mysqldump) {
    Write-Host ""
    Write-Host "ERROR: No se encontro mysqldump.exe" -ForegroundColor Red
    Write-Host "Rutas buscadas:" -ForegroundColor Yellow
    $mysqldumpPaths | ForEach-Object { Write-Host "   - $_" }
    exit 1
}

Write-Host ""
Write-Host "mysqldump encontrado: $mysqldump" -ForegroundColor Green

# Ejecutar backup
Write-Host ""
Write-Host "Creando backup de la base de datos..." -ForegroundColor Cyan
Write-Host "Archivo: $backupFile" -ForegroundColor Yellow

& $mysqldump -h $dbHost -P $dbPort -u $dbUser --databases $dbName --result-file=$backupFile

if ($LASTEXITCODE -eq 0 -and (Test-Path $backupFile)) {
    $fileSize = (Get-Item $backupFile).Length / 1KB
    Write-Host ""
    Write-Host "Backup completado exitosamente!" -ForegroundColor Green
    Write-Host "Archivo: $backupFile" -ForegroundColor Green
    Write-Host "Tamano: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Backups disponibles:" -ForegroundColor Cyan
    Get-ChildItem $backupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | ForEach-Object {
        $size = $_.Length / 1KB
        Write-Host "   - $($_.Name) ($([math]::Round($size, 2)) KB)"
    }
    
    Write-Host ""
    Write-Host "Para restaurar este backup, ejecuta:" -ForegroundColor Yellow
    Write-Host "   mysql -u $dbUser $dbName < $backupFile" -ForegroundColor White
    Write-Host ""
    
}
else {
    Write-Host ""
    Write-Host "Error al crear el backup" -ForegroundColor Red
    exit 1
}
