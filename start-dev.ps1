# Panch Sattva Full-Stack Environment Launcher
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "✨ Starting Panch Sattva Luxury Suite + YOUPI Payment Gateway" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Start YOUPI Payment Gateway Services (Ports: 8090, 6100, 7000, 6001)
Write-Host "[1/3] Launching YOUPI PG Gateway Supervisor (Dev/Localhost)..." -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\YouPI-PG'; node scripts/dev.js`"" -WindowStyle Normal

Start-Sleep -Seconds 2

# 2. Start Panch Sattva Express Backend Server (Port: 5000)
Write-Host "[2/3] Launching Panch Sattva Backend Server..." -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\panchsattva-server'; npm run dev`"" -WindowStyle Normal

Start-Sleep -Seconds 2

# 3. Start Panch Sattva React Storefront (Port: 5173)
Write-Host "[3/3] Launching Panch Sattva React Storefront..." -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\panchsattva-react'; npm run dev`"" -WindowStyle Normal

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "🎉 All Panch Sattva Services Running Successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "🛍️ Storefront UI:       http://localhost:5173" -ForegroundColor Yellow
Write-Host "🚀 Backend API:          http://localhost:5000/api" -ForegroundColor Yellow
Write-Host "💳 YOUPI Payment API:    http://localhost:6100" -ForegroundColor Yellow
Write-Host "📱 Checkout Portal:      http://localhost:7000" -ForegroundColor Yellow
Write-Host "🏪 Merchant Hub:         http://localhost:6001" -ForegroundColor Yellow
Write-Host "🖥️ Control Center:       http://localhost:8090" -ForegroundColor Yellow
Write-Host ""
Write-Host "Default Store Admin: admin@panchsattva.com / Admin@123" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Cyan
