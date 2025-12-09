# Script de Prueba de Endpoints de Reportes
# Ejecutar: .\scripts\test-reportes.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA DE ENDPOINTS DE REPORTES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Configuración
$baseUrl = "http://localhost:3001"
$fechaInicio = "2024-01-01"
$fechaFin = "2024-12-31"

Write-Host "Configuración:" -ForegroundColor Yellow
Write-Host "  URL Base: $baseUrl" -ForegroundColor White
Write-Host "  Fecha Inicio: $fechaInicio" -ForegroundColor White
Write-Host "  Fecha Fin: $fechaFin`n" -ForegroundColor White

# Nota: Si tienes autenticación, necesitas agregar el token aquí
# $token = "TU_TOKEN_JWT"
# $headers = @{ Authorization = "Bearer $token" }

Write-Host "IMPORTANTE: Si tienes autenticación JWT habilitada," -ForegroundColor Yellow
Write-Host "necesitas obtener un token primero y agregarlo al script.`n" -ForegroundColor Yellow

# ============================================================================
# 1. REPORTE DE PARQUEADEROS
# ============================================================================
Write-Host "1. Probando endpoint de parqueaderos..." -ForegroundColor Cyan
try {
    $url = "$baseUrl/api/reportes/parqueaderos?fechaInicio=$fechaInicio&fechaFin=$fechaFin"
    Write-Host "   GET $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    Write-Host "   Status: OK" -ForegroundColor Green
    Write-Host "   Datos recibidos:" -ForegroundColor White
    Write-Host "   $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
}
catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# 2. REPORTE DE VISITAS
# ============================================================================
Write-Host "2. Probando endpoint de visitas..." -ForegroundColor Cyan
try {
    $url = "$baseUrl/api/reportes/visitas?fechaInicio=$fechaInicio&fechaFin=$fechaFin"
    Write-Host "   GET $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    Write-Host "   Status: OK" -ForegroundColor Green
    Write-Host "   Total visitas: $($response.data.totalVisitas)" -ForegroundColor White
}
catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# 3. REPORTE DE PAQUETES
# ============================================================================
Write-Host "3. Probando endpoint de paquetes..." -ForegroundColor Cyan
try {
    $url = "$baseUrl/api/reportes/paquetes?fechaInicio=$fechaInicio&fechaFin=$fechaFin"
    Write-Host "   GET $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    Write-Host "   Status: OK" -ForegroundColor Green
    Write-Host "   Total paquetes: $($response.data.totalPaquetes)" -ForegroundColor White
    Write-Host "   Entregados: $($response.data.entregados)" -ForegroundColor White
    Write-Host "   Pendientes: $($response.data.pendientes)" -ForegroundColor White
}
catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# 4. REPORTE DE RESERVAS
# ============================================================================
Write-Host "4. Probando endpoint de reservas..." -ForegroundColor Cyan
try {
    $url = "$baseUrl/api/reportes/reservas?fechaInicio=$fechaInicio&fechaFin=$fechaFin"
    Write-Host "   GET $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    Write-Host "   Status: OK" -ForegroundColor Green
    Write-Host "   Total reservas: $($response.data.totalReservas)" -ForegroundColor White
}
catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# 5. REPORTE CONSOLIDADO
# ============================================================================
Write-Host "5. Probando endpoint consolidado..." -ForegroundColor Cyan
try {
    $url = "$baseUrl/api/reportes/consolidado?fechaInicio=$fechaInicio&fechaFin=$fechaFin"
    Write-Host "   GET $url" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop
    Write-Host "   Status: OK" -ForegroundColor Green
    Write-Host "   Datos consolidados recibidos correctamente" -ForegroundColor White
}
catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS COMPLETADAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
