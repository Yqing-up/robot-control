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
      // 运动相关接口代理
      '/api-move': {
        target: 'http://192.168.0.117:5001/api',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-move/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('运动接口代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('运动接口代理请求 -> 目标服务器:', req.method, req.url, '->', options.target + req.url.replace(/^\/api-move/, ''));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('运动接口代理响应 <- 目标服务器:', proxyRes.statusCode, req.url);
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
        target: 'http://192.168.0.103:5001',
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
