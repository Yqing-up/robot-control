@echo off
title 机器人控制中心 - 网络开发服务器

echo 🤖 机器人控制中心 - 网络开发服务器
echo ================================================

echo.
echo 📋 启动步骤：
echo 1. 获取网络信息
echo 2. 启动Vite开发服务器 (网络模式)
echo.

echo 🌐 获取网络信息...
call npm run network-info

echo.
echo 🚀 启动网络开发服务器...
echo 按 Ctrl+C 停止服务器
echo.

call npm run dev:network
