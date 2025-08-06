# 🌐 网络访问配置指南

本指南将帮助您配置机器人控制中心，使其能够被其他设备（手机、平板等）访问。

## 🚀 快速开始

### 方法一：使用自动化脚本（推荐）

1. **配置防火墙**（需要管理员权限）：
   ```bash
   # 右键以管理员身份运行
   scripts/setup-firewall.bat
   ```

2. **启动网络开发服务器**：
   ```bash
   scripts/start-network-dev.bat
   ```

### 方法二：手动配置

1. **获取网络信息**：
   ```bash
   npm run network-info
   ```

2. **启动网络开发服务器**：
   ```bash
   npm run dev:network
   ```

3. **或启动网络预览服务器**：
   ```bash
   npm run preview:network
   ```

## 📱 访问方式

启动服务器后，您将看到类似以下的访问地址：

```
📡 网络接口: Wi-Fi
   IP地址: 192.168.1.100
   
📱 Wi-Fi 网络:
   开发服务器: http://192.168.1.100:5173
   预览服务器: http://192.168.1.100:4173
```

在其他设备上打开浏览器，输入显示的IP地址即可访问。

## 🔧 配置详情

### Vite配置 (vite.config.js)

```javascript
export default defineConfig({
  server: {
    host: '0.0.0.0', // 绑定到所有网络接口
    port: 5173,      // 指定端口
    strictPort: true, // 端口被占用时失败而不是尝试下一个端口
    // ... 其他配置
  }
})
```

### NPM脚本 (package.json)

```json
{
  "scripts": {
    "dev": "vite",                                    // 本地开发
    "dev:network": "vite --host 0.0.0.0 --port 5173", // 网络开发
    "preview:network": "vite preview --host 0.0.0.0 --port 4173", // 网络预览
    "network-info": "node scripts/get-network-info.js" // 获取网络信息
  }
}
```

## 🛡️ 防火墙配置

### Windows防火墙

**自动配置**（推荐）：
```bash
# 以管理员身份运行
scripts/setup-firewall.bat
```

**手动配置**：
```bash
# 添加开发服务器规则
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173

# 添加预览服务器规则
netsh advfirewall firewall add rule name="Vite Preview Server" dir=in action=allow protocol=TCP localport=4173
```

**临时关闭防火墙**（仅测试用）：
```bash
# 关闭防火墙
netsh advfirewall set allprofiles state off

# 测试完成后重新开启
netsh advfirewall set allprofiles state on
```

### 验证防火墙规则

```bash
# 查看已添加的规则
netsh advfirewall firewall show rule name="Vite Dev Server"
netsh advfirewall firewall show rule name="Vite Preview Server"
```

## 🔍 故障排除

### 1. 无法访问服务器

**检查项目**：
- [ ] 服务器是否正常启动
- [ ] 防火墙规则是否正确配置
- [ ] 设备是否在同一网络
- [ ] IP地址是否正确

**解决方案**：
```bash
# 1. 检查服务器状态
npm run network-info

# 2. 重新配置防火墙
scripts/setup-firewall.bat

# 3. 临时关闭防火墙测试
netsh advfirewall set allprofiles state off
```

### 2. 端口被占用

**检查端口占用**：
```bash
netstat -ano | findstr :5173
netstat -ano | findstr :4173
```

**解决方案**：
- 关闭占用端口的程序
- 或修改vite.config.js中的端口号

### 3. 网络连接问题

**检查网络**：
- 确保所有设备连接到同一Wi-Fi网络
- 检查路由器是否启用了设备隔离
- 尝试使用手机热点测试

## 📋 常用命令

```bash
# 获取网络信息
npm run network-info

# 启动网络开发服务器
npm run dev:network

# 启动网络预览服务器  
npm run preview:network

# 构建项目
npm run build

# 配置防火墙（管理员权限）
scripts/setup-firewall.bat

# 一键启动（包含网络信息显示）
scripts/start-network-dev.bat
```

## 🎯 最佳实践

1. **开发阶段**：使用 `npm run dev:network`
2. **测试阶段**：使用 `npm run preview:network`
3. **生产部署**：使用专门的Web服务器（如Nginx）

## 🔒 安全注意事项

1. **仅在可信网络中使用**：开发服务器不适合生产环境
2. **及时关闭服务器**：测试完成后关闭开发服务器
3. **防火墙管理**：定期检查和清理防火墙规则
4. **网络隔离**：在公共网络中避免使用网络模式

## 📞 技术支持

如果遇到问题，请检查：
1. 控制台错误信息
2. 网络连接状态
3. 防火墙配置
4. 设备网络设置

---

**注意**：本配置仅适用于开发和测试环境，生产环境请使用专业的Web服务器。
