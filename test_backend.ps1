# Test script for backend availability

$backend = "https://slc-qls9.onrender.com"
Write-Host "Testing backend at: $backend"
Write-Host "================================"

# Test /test endpoint
Write-Host "1. GET /test"
try {
    $resp = Invoke-WebRequest -Uri "$backend/test" -Method Get -UseBasicParsing -TimeoutSec 10
    Write-Host "   Status: $($resp.StatusCode)"
    Write-Host "   Response: $([System.Text.Encoding]::UTF8.GetString($resp.Content))"
} catch {
    Write-Host "   Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "2. POST /api/auth/login"
try {
    $body = '{"phone":"1234567890","password":"test","role":"farmer"}'
    $resp = Invoke-WebRequest -Uri "$backend/api/auth/login" -Method Post -Headers @{'Content-Type'='application/json'} -Body $body -UseBasicParsing -TimeoutSec 10
    Write-Host "   Status: $($resp.StatusCode)"
    $json = [System.Text.Encoding]::UTF8.GetString($resp.Content) | ConvertFrom-Json
    Write-Host "   Has access_token: $($json.access_token -ne $null)"
    Write-Host "   Has user: $($json.user -ne $null)"
    if ($json.user) {
        Write-Host "   User name: $($json.user.name)"
        Write-Host "   User role: $($json.user.role)"
    }
} catch {
    Write-Host "   Error: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "================================"
Write-Host "Update frontend .env:"
Write-Host "  REACT_APP_BACKEND_URL=$backend"
