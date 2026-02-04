# QAntum Framework - GitHub Pages Deployment Script
# © 2026 Dimitar Prodromov

param(
    [string]$RepoPath = "C:\Users\papic\Desktop\Framework-Repo",
    [switch]$AutoCommit = $false
)

Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           QANTUM FRAMEWORK - GITHUB PAGES DEPLOYMENT                          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if repo exists
if (-not (Test-Path $RepoPath)) {
    Write-Host "[1/5] Cloning repository..." -ForegroundColor Yellow
    git clone https://github.com/QAntum-Fortres/Framework.git $RepoPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to clone repository" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Repository cloned successfully" -ForegroundColor Green
} else {
    Write-Host "[1/5] Repository already exists at $RepoPath" -ForegroundColor Green
}

# Step 2: Copy index.html
Write-Host "[2/5] Copying index.html..." -ForegroundColor Yellow
$SourceFile = "$PSScriptRoot\index.html"
$DestFile = "$RepoPath\index.html"

if (-not (Test-Path $SourceFile)) {
    Write-Host "❌ Source file not found: $SourceFile" -ForegroundColor Red
    exit 1
}

Copy-Item -Path $SourceFile -Destination $DestFile -Force
Write-Host "✅ index.html copied successfully" -ForegroundColor Green

# Step 3: Copy README (optional)
Write-Host "[3/5] Copying README.md..." -ForegroundColor Yellow
$ReadmeSource = "$PSScriptRoot\README.md"
$ReadmeDest = "$RepoPath\README.md"

if (Test-Path $ReadmeSource) {
    Copy-Item -Path $ReadmeSource -Destination $ReadmeDest -Force
    Write-Host "✅ README.md copied successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  README.md not found, skipping" -ForegroundColor Yellow
}

# Step 4: Git operations
Write-Host "[4/5] Preparing Git commit..." -ForegroundColor Yellow
Set-Location $RepoPath

git add index.html
if (Test-Path $ReadmeDest) {
    git add README.md
}

$Status = git status --porcelain
if ($Status) {
    Write-Host "📝 Changes detected:" -ForegroundColor Cyan
    Write-Host $Status -ForegroundColor Gray
    
    if ($AutoCommit) {
        Write-Host "[5/5] Committing and pushing..." -ForegroundColor Yellow
        git commit -m "🚀 Deploy Evidence Archive - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully deployed to GitHub!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🌐 Your site will be live at:" -ForegroundColor Cyan
            Write-Host "   https://qantum-fortres.github.io/Framework/" -ForegroundColor White
            Write-Host ""
            Write-Host "⏱️  GitHub Pages typically takes 1-2 minutes to build" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Failed to push to GitHub" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[5/5] Ready to commit (use -AutoCommit to push automatically)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 Manual steps:" -ForegroundColor Cyan
        Write-Host "   cd $RepoPath" -ForegroundColor White
        Write-Host "   git commit -m '🚀 Deploy Evidence Archive'" -ForegroundColor White
        Write-Host "   git push origin main" -ForegroundColor White
    }
} else {
    Write-Host "✅ No changes detected, already up to date" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                            DEPLOYMENT COMPLETE                                ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
