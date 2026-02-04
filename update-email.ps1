#!/usr/bin/env pwsh

# ============================================================================
# EMAIL UPDATE SCRIPT - QANTUM FRAMEWORK
# ============================================================================
# Updates email address across all project files
# ============================================================================

$OldEmail = "dimitar.prodromov@qantum.dev"
$NewEmail = "papica777@gmail.com"

Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "║                    EMAIL UPDATE SCRIPT                             ║" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "OLD: $OldEmail" -ForegroundColor Red
Write-Host "NEW: $NewEmail" -ForegroundColor Green
Write-Host ""

# Files to update
$FilesToUpdate = @(
    "index.html",
    "README.md"
)

$UpdatedCount = 0

foreach ($File in $FilesToUpdate) {
    if (Test-Path $File) {
        Write-Host "Processing: $File" -ForegroundColor Yellow
        
        # Read content
        $Content = Get-Content $File -Raw -Encoding UTF8
        
        # Replace email
        if ($Content -match [regex]::Escape($OldEmail)) {
            $Content = $Content -replace [regex]::Escape($OldEmail), $NewEmail
            
            # Write back
            Set-Content -Path $File -Value $Content -Encoding UTF8 -NoNewline
            
            Write-Host "  ✓ Updated: $File" -ForegroundColor Green
            $UpdatedCount++
        }
        else {
            Write-Host "  - No changes needed: $File" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  ✗ File not found: $File" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Updated $UpdatedCount file(s)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review changes with: git diff" -ForegroundColor White
Write-Host "2. Deploy updates with: .\deploy.ps1 -AutoCommit" -ForegroundColor White
Write-Host ""
