@echo off
:: 强制设置编码为 UTF-8，解决中文乱码问题
chcp 65001 >nul
title SSTI Master 快速启动器 (UTF-8 Mode)
setlocal enabledelayedexpansion

:: 设置颜色
color 0b

echo ====================================================
echo.
echo    SSTI MASTER - 安全研究工具 (v2.8)
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

:: 1. 尝试使用现代 Vite 启动 (如果有 Node.js)
echo [1/3] 正在探测 Node.js 开发环境...
call npm -v >nul 2>&1
if !errorlevel! equ 0 (
    echo [+] 成功: 发现 Node.js。正在准备高性能环境...
    if not exist node_modules (
        echo [!] 正在初次安装依赖 (这可能需要 1-2 分钟)...
        call npm install
    )
    echo [+] 正在通过 Vite 启动 (http://localhost:5173)...
    start http://localhost:5173
    call npm run dev
    goto :end
)

:: 2. 尝试 Python (无 Node.js 时的降级方案)
echo [1/3] 未发现 Node.js，正在探测 Python 环境...
python --version >nul 2>&1
if !errorlevel! equ 0 (
    echo [+] 成功: 发现 Python 环境。
    echo [+] 正在启动本地服务器 (http://localhost:8000)...
    start http://localhost:8000
    python -m http.server 8000
    goto :end
)

:: 3. 尝试 PHP
echo [1/3] 未发现 Python，正在探测 PHP 环境...
php -v >nul 2>&1
if !errorlevel! equ 0 (
    echo [+] 成功: 发现 PHP 环境。
    echo [+] 正在启动 PHP 内置服务器 (http://localhost:8888)...
    start http://localhost:8888
    php -S localhost:8888
    goto :end
)

:: 4. 如果都没有
color 0c
echo ----------------------------------------------------
echo [!] 启动失败：未找到可用的 Web 环境。
echo ----------------------------------------------------
echo 为确保应用在云端 (Vercel) 和本地正常运行，建议安装 Node.js。
echo.
echo 解决方案：
echo 1. 安装 Node.js (推荐，带编译功能): https://nodejs.org/
echo 2. 安装 Python (基础访问): https://www.python.org/
echo.
pause

:end