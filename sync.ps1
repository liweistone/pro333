# 万象智造项目 - 同步到 GitHub 脚本
# 用法: 双击运行或在 PowerShell 中执行 .\sync.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  万象智造项目 - GitHub 同步脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查是否有未提交的更改
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "[1/4] 发现未提交的更改，正在添加并提交..." -ForegroundColor Yellow
    git add -A
    git commit -m "sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') 自动同步"
    Write-Host "  提交成功!" -ForegroundColor Green
} else {
    Write-Host "[1/4] 没有未提交的更改，跳过提交步骤" -ForegroundColor Gray
}

# 2. 拉取远程最新代码（避免冲突）
Write-Host "[2/4] 拉取远程最新代码..." -ForegroundColor Yellow
try {
    git pull origin main --rebase --no-edit
    Write-Host "  拉取成功!" -ForegroundColor Green
} catch {
    Write-Host "  拉取失败，可能存在冲突。请手动解决后重新运行此脚本。" -ForegroundColor Red
    exit 1
}

# 3. 推送到远程
Write-Host "[3/4] 推送到 GitHub (liweistone/pro3333)..." -ForegroundColor Yellow
try {
    git push origin main
    Write-Host "  推送成功!" -ForegroundColor Green
} catch {
    Write-Host "  推送失败: $_" -ForegroundColor Red
    exit 1
}

# 4. 显示状态
Write-Host "[4/4] 同步完成!" -ForegroundColor Green
Write-Host ""
git log --oneline -3
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  同步完成，仓库地址: https://github.com/liweistone/pro3333" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
