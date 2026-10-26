# Start both frontend and backend
Write-Host "Starting Panch Sattva servers..." -ForegroundColor Cyan

# Start backend
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\panchsattva-server'; npm run dev`"" -WindowStyle Normal

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start frontend
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PSScriptRoot\panchsattva-react'; npm run dev`"" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers starting!" -ForegroundColor Green
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor Yellow
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Admin login: admin@panchsattva.com / Admin@123" -ForegroundColor Magenta
