import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 临时修复：捕获错误的 /api-sim 请求并重定向到仿真服务器
      '/api-sim': {
        target: 'http://192.168.0.103:5001/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const rewrittenPath = path.replace(/^\/api-sim/, '/api');
          console.log('🔧 临时修复 - api-sim代理:', {
            原始路径: path,
            重写后路径: rewrittenPath,
            目标服务器: 'http://192.168.0.103:5001/api'
          });
          return rewrittenPath;
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('❌ 临时api-sim代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🚀 临时api-sim代理请求 -> 仿真机器人:', {
              方法: req.method,
              原始请求: req.url,
              最终URL: `${options.target}${proxyReq.path}`
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const success = proxyRes.statusCode >= 200 && proxyRes.statusCode < 300;
            console.log(`${success ? '✅' : '❌'} 临时api-sim代理响应:`, {
              状态码: proxyRes.statusCode,
              原始请求: req.url
            });
          });
        },
      },

      // 运动相关接口代理 - 真实机器人
      '/api-move': {
        target: 'http://192.168.0.117:5001/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-move/, '/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('运动接口代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const rewrittenPath = req.url.replace(/^\/api-move/, '/api');
            console.log('运动接口代理请求 -> 真实机器人:', req.method, req.url, '->', `${options.target}${rewrittenPath}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('运动接口代理响应 <- 真实机器人:', proxyRes.statusCode, req.url);
          });
        },
      },

      // 仿真机器人接口代理 - 代理到 192.168.0.103:5001
      '/api-move-sim': {
        target: 'http://192.168.0.103:5001/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // 将 /api-move-sim 重写为 /api
          const rewrittenPath = path.replace(/^\/api-move-sim/, '/api');
          console.log('🤖 仿真机器人代理路径重写:', {
            原始路径: path,
            重写后路径: rewrittenPath,
            目标服务器: 'http://192.168.0.103:5001/api'
          });
          return rewrittenPath;
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('❌ 仿真机器人代理错误:', {
              错误信息: err.message,
              目标服务器: options.target,
              请求路径: req.url
            });
          });

          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🚀 仿真机器人代理请求:', {
              方法: req.method,
              原始请求: req.url,
              目标服务器: options.target,
              最终URL: `${options.target}${proxyReq.path}`,
              用户代理: proxyReq.getHeader('user-agent')
            });
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            const success = proxyRes.statusCode >= 200 && proxyRes.statusCode < 300;
            console.log(`${success ? '✅' : '❌'} 仿真机器人代理响应:`, {
              状态码: proxyRes.statusCode,
              状态文本: proxyRes.statusMessage,
              原始请求: req.url,
              响应大小: proxyRes.headers['content-length'] || '未知',
              内容类型: proxyRes.headers['content-type'] || '未知'
            });
          });
        },
      },

      // 摄像头相关接口代理
      '/api-cam': {
        target: 'http://192.168.0.119:5001/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-cam/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('摄像头接口代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('摄像头接口代理请求 -> 目标服务器:', req.method, req.url, '->', options.target + req.url.replace(/^\/api-cam/, ''));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('摄像头接口代理响应 <- 目标服务器:', proxyRes.statusCode, req.url);
          });
        },
      },

      // 语音相关接口代理
      '/api-voice': {
        target: 'http://192.168.0.119:5001/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-voice/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('语音接口代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('语音接口代理请求 -> 目标服务器:', req.method, req.url, '->', options.target + req.url.replace(/^\/api-voice/, ''));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('语音接口代理响应 <- 目标服务器:', proxyRes.statusCode, req.url);
          });
        },
      },

      // 录音相关接口代理
      '/api-rec': {
        target: 'http://192.168.0.119:5001/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-rec/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('录音接口代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('录音接口代理请求 -> 目标服务器:', req.method, req.url, '->', options.target + req.url.replace(/^\/api-rec/, ''));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('录音接口代理响应 <- 目标服务器:', proxyRes.statusCode, req.url);
          });
        },
      },

      // 保留原有的通用API代理，用于其他接口
      '/api': {
        target: 'http://192.168.0.119:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('通用接口代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('通用接口代理请求 -> 目标服务器:', req.method, req.url, '->', options.target + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('通用接口代理响应 <- 目标服务器:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/v1': {
        target: 'http://192.168.0.103',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('工作流v1代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('工作流v1代理请求 -> 目标服务器:', req.method, req.url, '->', 'http://192.168.0.103' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('工作流v1代理响应 <- 目标服务器:', proxyRes.statusCode, req.url);
          });
        },
      },
    }
  }
})
