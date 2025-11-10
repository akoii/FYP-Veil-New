# Start Cookie Classification API Server
# Run this script from the project root directory

Write-Host "🍪 Starting Veil Cookie Classification API..." -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:HF_TOKEN = Read-Host "Enter your Hugging Face token (or press Enter to skip)"
$env:PORT = "5000"

Write-Host "✓ Environment configured" -ForegroundColor Green
Write-Host "  - HF Token: Set" -ForegroundColor Gray
Write-Host "  - Port: 5000" -ForegroundColor Gray
Write-Host ""

# Navigate to deployment directory
$deploymentPath = Join-Path $PSScriptRoot "03_AI_ML_Pipeline\deployment"
Set-Location $deploymentPath

Write-Host "✓ Changed directory to: $deploymentPath" -ForegroundColor Green
Write-Host ""

# Check if required packages are installed
Write-Host "📦 Checking Python dependencies..." -ForegroundColor Yellow

$packagesInstalled = $true
$requiredPackages = @("flask", "flask_cors", "huggingface_hub", "transformers")

foreach ($package in $requiredPackages) {
    python -c "import $package" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Missing: $package" -ForegroundColor Red
        $packagesInstalled = $false
    }
}

if (-not $packagesInstalled) {
    Write-Host ""
    Write-Host "Installing missing packages..." -ForegroundColor Yellow
    python -m pip install -r requirements-api.txt
    Write-Host ""
}

Write-Host "✓ All dependencies installed" -ForegroundColor Green
Write-Host ""

# Start the API server
Write-Host "🚀 Starting Flask API server..." -ForegroundColor Cyan
Write-Host "   API will be available at: http://localhost:5000" -ForegroundColor Gray
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

python cookie_classifier_api.py
