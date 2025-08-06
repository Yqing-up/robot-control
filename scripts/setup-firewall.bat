@echo off
echo 🔥 配置Windows防火墙允许Vite开发服务器
echo ================================================

echo.
echo 📋 当前操作：
echo 1. 添加Vite开发服务器端口5173的防火墙规则
echo 2. 添加Vite预览服务器端口4173的防火墙规则
echo.

echo 🔧 正在配置防火墙规则...

REM 删除可能存在的旧规则
netsh advfirewall firewall delete rule name="Vite Dev Server" >nul 2>&1
netsh advfirewall firewall delete rule name="Vite Preview Server" >nul 2>&1

REM 添加新规则
echo 添加Vite开发服务器规则 (端口5173)...
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173

echo 添加Vite预览服务器规则 (端口4173)...
netsh advfirewall firewall add rule name="Vite Preview Server" dir=in action=allow protocol=TCP localport=4173

echo.
echo ✅ 防火墙配置完成！
echo.
echo 📱 现在您可以：
echo 1. 运行 npm run network-info 查看访问地址
echo 2. 运行 npm run dev:network 启动网络开发服务器
echo 3. 在其他设备上使用显示的IP地址访问
echo.
echo 🔍 验证防火墙规则：
netsh advfirewall firewall show rule name="Vite Dev Server"
netsh advfirewall firewall show rule name="Vite Preview Server"

echo.
echo 🎯 如果仍然无法访问，请尝试：
echo 1. 检查路由器设置
echo 2. 确保设备在同一网络
echo 3. 临时关闭防火墙测试：netsh advfirewall set allprofiles state off
echo 4. 测试完成后重新开启：netsh advfirewall set allprofiles state on
echo.

pause
