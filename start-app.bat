@echo off
title SSTI Master 快速启动器
setlocal enabledelayedexpansion

:: 设置颜色
color 0b

echo ====================================================
echo.
echo    SSTI MASTER - 安全研究工具 (v2.6)
echo.
echo ====================================================
echo [!] 正在准备启动环境...
echo.

:: 切换到当前脚本所在目录
cd /d "%~dp0"

:: 检查 index.html 是否存在
if not exist index.html (
    color 0c
    echo [-] 错误: 未在当前文件夹找到 index.html。
    echo 请确保所有文件都在同一个文件夹中解压。
    pause
    exit
)

echo [1/3] 正在探测本地 Web 服务支持...

:: 1. 尝试 Python (Windows 用户最常用的环境)
python --version >nul 2>&1
if !errorlevel! equ 0 (
    echo [+] 成功: 发现 Python 环境。
    echo [+] 正在启动本地服务器并打开浏览器...
    start http://localhost:8000
    python -m http.server 8000
    goto :end
)

:: 2. 尝试 Node.js
call npx -v >nul 2>&1
if !errorlevel! equ 0 (
    echo [+] 成功: 发现 Node.js 环境。
    echo [+] 正在使用 npx serve 启动...
    start http://localhost:3000
    call npx serve -s . -l 3000
    goto :end
)

:: 3. 尝试 PHP
php -v >nul 2>&1
if !errorlevel! equ 0 (
    echo [+] 成功: 发现 PHP 环境。
    echo [+] 正在启动 PHP 内置服务器...
    start http://localhost:8888
    php -S localhost:8888
    goto :end
)

:: 4. 如果都没有
color 0c
echo ----------------------------------------------------
echo [!] 启动失败：未找到可用的 Web 环境。
echo ----------------------------------------------------
echo 现代浏览器出于安全考虑，禁止直接双击运行含脚本的代码。
echo.
echo 请安装以下任意一个环境：
echo 1. Python (推荐): https://www.python.org/ (安装时勾选 Add to PATH)
echo 2. Node.js: https://nodejs.org/
echo.
echo 或者使用“云端一键部署”方案 (详见 DEPLOY.md)。
echo.
pause

:end
