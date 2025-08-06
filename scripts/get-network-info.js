#!/usr/bin/env node

/**
 * 获取网络信息脚本
 * 用于显示本机IP地址和访问URL
 */

import { networkInterfaces } from 'os';

function getNetworkInfo() {
  const interfaces = networkInterfaces();
  const networkInfo = [];

  console.log('\n🌐 网络配置信息');
  console.log('='.repeat(50));

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;

    for (const net of nets) {
      // 跳过内部地址和IPv6地址
      if (net.internal || net.family !== 'IPv4') continue;

      networkInfo.push({
        interface: name,
        address: net.address,
        netmask: net.netmask,
        mac: net.mac
      });

      console.log(`\n📡 网络接口: ${name}`);
      console.log(`   IP地址: ${net.address}`);
      console.log(`   子网掩码: ${net.netmask}`);
      console.log(`   MAC地址: ${net.mac}`);
    }
  }

  if (networkInfo.length > 0) {
    console.log('\n🚀 访问地址:');
    console.log('='.repeat(50));

    networkInfo.forEach(info => {
      console.log(`\n📱 ${info.interface} 网络:`);
      console.log(`   开发服务器: http://${info.address}:5173`);
      console.log(`   预览服务器: http://${info.address}:4173`);
    });

    console.log('\n📋 使用说明:');
    console.log('='.repeat(50));
    console.log('1. 启动网络开发服务器: npm run dev:network');
    console.log('2. 或者启动网络预览服务器: npm run preview:network');
    console.log('3. 在其他设备上使用上述IP地址访问');
    console.log('4. 确保防火墙允许5173和4173端口');

    console.log('\n🔥 防火墙配置 (Windows):');
    console.log('='.repeat(50));
    console.log('netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173');
    console.log('netsh advfirewall firewall add rule name="Vite Preview Server" dir=in action=allow protocol=TCP localport=4173');

    console.log('\n🛡️ 临时关闭防火墙 (仅测试用):');
    console.log('='.repeat(50));
    console.log('netsh advfirewall set allprofiles state off');
    console.log('netsh advfirewall set allprofiles state on  # 测试完成后重新开启');

  } else {
    console.log('\n❌ 未找到可用的网络接口');
  }

  console.log('\n');
}

// 如果直接运行此脚本
getNetworkInfo();

export { getNetworkInfo };
