@echo off
chcp 65001 >nul
title 万象智造 - GitHub 同步
color 0B

echo ========================================
echo   万象智造项目 - GitHub 自动同步
echo ========================================
echo.

REM 1. 检查是否有未提交的更改
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 当前目录不是 Git 仓库，请先运行 git init
    pause
    exit /b 1
)

for /f %%i in ('git status --porcelain') do set HAS_CHANGES=1

if defined HAS_CHANGES (
    echo [1/4] 发现未提交的更改，正在提交...
    git add -A
    for /f "tokens=1-2 delims= " %%a in ('powershell -command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do (
        git commit -m "sync: %%a %%b 自动同步"
    )
    echo   提交成功!
) else (
    echo [1/4] 没有未提交的更改，跳过提交
)

REM 2. 拉取远程最新代码
echo [2/4] 拉取远程最新代码...
git pull origin main --rebase --no-edit
if %errorlevel% neq 0 (
    echo [错误] 拉取失败，可能存在冲突，请手动解决后重试
    pause
    exit /b 1
)

REM 3. 推送到远程
echo [3/4] 推送到 GitHub (liweistone/pro3333)...
git push origin main
if %errorlevel% neq 0 (
    echo [错误] 推送失败
    pause
    exit /b 1
)

REM 4. 显示状态
echo.
echo [4/4] 同步完成!
echo.
git log --oneline -3
echo.
echo ========================================
echo   仓库地址: https://github.com/liweistone/pro3333
echo ========================================
echo.
pause
