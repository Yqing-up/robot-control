<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回</button>
        <h1 class="title">机器人仿真画面</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn btn-small header-action-btn" @click="openConfigDialog">配置</button>
        </div>
      </div>
    </header>

    <main class="simulation-main">
      <!-- 全屏视频画面区域 -->
      <div class="fullscreen-video-container">
        <video
          ref="visionVideo"
          autoplay
          muted
          controls
          class="fullscreen-video"
        >您的浏览器不支持视频播放</video>

        <!-- 视频未连接时的占位符 -->
        <div v-if="!isVisionConnected" class="video-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">📹</div>
            <div class="placeholder-text">仿真画面未连接</div>
            <div class="placeholder-hint">点击右上角「配置」按钮进行设置</div>
          </div>
        </div>


      </div>
    </main>

    <!-- 仿真控制配置对话框 -->
    <div v-if="showConfigDialog" class="modal-overlay" @click="closeConfigDialog">
      <div class="modal-content config-modal" @click.stop>
        <div class="modal-header">
          <h3>仿真控制</h3>
          <button class="modal-close" @click="closeConfigDialog">×</button>
        </div>
        <div class="modal-body">
          <!-- 连接控制区域 -->
          <div class="config-section">
            <h4 class="section-title">连接控制</h4>
            <div class="control-buttons">
              <button
                class="btn btn-primary"
                @click="connectVision"
                :disabled="isVisionConnected"
              >
                {{ isVisionConnected ? '已连接' : '连接' }}
              </button>
              <button
                class="btn btn-secondary"
                @click="disconnectVision"
                :disabled="!isVisionConnected"
              >
                断开连接
              </button>
            </div>
            <div class="status-display">
              <span class="status-label">连接状态:</span>
              <span class="status-value" :class="{ connected: isVisionConnected, disconnected: !isVisionConnected }">
                {{ isVisionConnected ? '已连接' : '未连接' }}
              </span>
            </div>
            <div class="status-display" v-if="isVisionConnected">
              <span class="status-label">缓冲状态:</span>
              <span class="status-value">{{ bufferStatus }}</span>
            </div>
          </div>

          <!-- 视频设置区域 -->
          <div class="config-section">
            <h4 class="section-title">视频设置</h4>
            <div class="form-group">
              <label>视频质量:</label>
              <select v-model="videoQuality" @change="updateVideoQuality" class="form-select">
                <option value="high">高清</option>
                <option value="medium">标清</option>
                <option value="low">流畅</option>
              </select>
            </div>
            <div class="form-group">
              <label>视频流地址:</label>
              <input
                type="text"
                v-model="visionStreamUrl"
                class="form-input"
                placeholder="视频流地址"
              >
            </div>
            <div class="url-display">
              <span class="url-label">当前地址:</span>
              <span class="url-text">{{ visionStreamUrl }}</span>
            </div>
          </div>

          <!-- 说明信息 -->
          <div class="config-section">
            <h4 class="section-title">说明</h4>
            <p class="config-hint">
              • 请输入完整的HLS视频流地址<br>
              • 支持 .m3u8 格式的视频流<br>
              • 修改地址后需要重新连接才能生效
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeConfigDialog">关闭</button>
          <button class="btn btn-primary" @click="saveAndReconnect">保存并重连</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 视觉流相关
const isVisionConnected = ref(false)
const visionStreamUrl = ref(getVisionStreamUrl())
const visionVideo = ref(null)
const videoQuality = ref('medium')
const showConfigDialog = ref(false)
const bufferStatus = ref('正常')
let hls = null
let bufferHealthTimer = null

// 方法
const goBack = () => {
  router.push('/brain-system')
}

// 获取视频流地址
function getVisionStreamUrl() {
  const simulationHost = import.meta.env.VITE_ROBOT_SIMULATION_HOST
  if (simulationHost) {
    const baseUrl = simulationHost.replace(':5001', ':8080')
    return `${baseUrl}/live/demo.m3u8`
  }
  // 使用环境变量中的默认视频流地址
  const defaultStreamHost = import.meta.env.VITE_VIDEO_STREAM_HOST_1
  return `${defaultStreamHost}/live/demo.m3u8`
}

// 简单稳定的HLS配置
const createSimpleHlsConfig = () => ({
  debug: false,
  maxBufferLength: 15,
  maxMaxBufferLength: 30,
  lowLatencyMode: false,
  liveSyncDuration: 2,
  liveMaxLatencyDuration: 8,
  liveDurationInfinity: true,
  maxLiveSyncPlaybackRate: 1.1,
  fragLoadingTimeOut: 20000,
  manifestLoadingTimeOut: 10000,
  fragLoadingMaxRetry: 3,
  manifestLoadingMaxRetry: 2,
  startLevel: -1,
})

// 连接视频流
const connectVision = async () => {
  if (isVisionConnected.value) return

  await loadHlsLibrary()
  await nextTick()

  if (!visionVideo.value) return

  console.log('🎥 尝试连接仿真视频流:', visionStreamUrl.value)

  if (window.Hls && window.Hls.isSupported()) {
    try {
      // 首先尝试简单配置
      console.log('🔧 尝试使用简单稳定配置创建HLS实例')
      hls = new window.Hls(createSimpleHlsConfig())
    } catch (error) {
      console.error('❌ 简单配置创建失败，尝试最小配置:', error)
      // 如果简单配置失败，使用最小配置
      try {
        hls = new window.Hls({
          debug: false,
          lowLatencyMode: false,
          maxBufferLength: 10,
          liveDurationInfinity: true,
        })
      } catch (minimalError) {
        console.error('❌ 最小配置也失败:', minimalError)
        return
      }
    }

    // 添加视频元素事件监听
    visionVideo.value.addEventListener('loadstart', () => {
      console.log('🎬 开始加载视频')
    })

    visionVideo.value.addEventListener('loadedmetadata', () => {
      console.log('📋 视频元数据加载完成')
    })

    visionVideo.value.addEventListener('canplay', () => {
      console.log('▶️ 视频可以开始播放')
    })

    visionVideo.value.addEventListener('waiting', () => {
      console.log('⏳ 视频缓冲中...')
    })

    visionVideo.value.addEventListener('playing', () => {
      console.log('🎥 视频正在播放')
    })

    visionVideo.value.addEventListener('error', (e) => {
      console.error('❌ 视频元素错误:', e)
      isVisionConnected.value = false
    })

    visionVideo.value.addEventListener('stalled', () => {
      console.warn('⚠️ 视频播放停滞')
    })

    hls.loadSource(visionStreamUrl.value)
    hls.attachMedia(visionVideo.value)

    // 成功事件处理
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      console.log('✅ 仿真视频流连接成功')
      visionVideo.value.play().catch(err => {
        console.warn('自动播放失败，可能需要用户交互:', err)
      })
      isVisionConnected.value = true

      // 启动缓冲区健康检查
      setTimeout(() => {
        startBufferHealthCheck()
      }, 3000) // 延迟3秒启动，让初始缓冲稳定
    })

    // 错误事件处理 - 增强版
    hls.on(window.Hls.Events.ERROR, (_, data) => {
      console.error('❌ 仿真视频流错误:', data)

      // 对于bufferStalledError，采用静默处理
      if (data.details === 'bufferStalledError') {
        console.log('🔧 静默处理缓冲区停滞错误')
        bufferStatus.value = '缓冲区停滞，自动恢复中...'

        // 简单的恢复策略：跳过一小段时间
        setTimeout(() => {
          if (visionVideo.value && !visionVideo.value.paused) {
            try {
              const currentTime = visionVideo.value.currentTime
              visionVideo.value.currentTime = currentTime + 0.5
              console.log('⏭️ 跳过停滞点:', currentTime, '->', currentTime + 0.5)
              bufferStatus.value = '正常'
            } catch (error) {
              console.warn('跳过停滞点失败:', error)
            }
          }
        }, 200)
        return // 不进行其他处理
      }

      if (data.fatal) {
        console.error('致命错误，尝试恢复...')
        switch (data.type) {
          case window.Hls.ErrorTypes.NETWORK_ERROR:
            console.log('网络错误，尝试重新加载...')
            setTimeout(() => {
              if (hls) {
                try {
                  hls.startLoad()
                } catch (error) {
                  console.error('重新加载失败:', error)
                  // 降级到原生播放
                  fallbackToNativePlayback()
                }
              }
            }, 1000)
            break
          case window.Hls.ErrorTypes.MEDIA_ERROR:
            console.log('媒体错误，尝试恢复...')
            if (hls) {
              try {
                hls.recoverMediaError()
              } catch (error) {
                console.error('媒体错误恢复失败:', error)
                fallbackToNativePlayback()
              }
            }
            break
          default:
            console.log('其他致命错误，降级到原生播放')
            fallbackToNativePlayback()
            break
        }
      } else {
        console.warn('非致命错误，继续播放:', data.details)
      }
    })

    // 缓冲区事件处理
    hls.on(window.Hls.Events.BUFFER_APPENDING, () => {
      console.log('📦 正在添加缓冲区数据')
      bufferStatus.value = '缓冲中...'
    })

    hls.on(window.Hls.Events.BUFFER_APPENDED, () => {
      console.log('✅ 缓冲区数据添加完成')
      bufferStatus.value = '正常'
    })

    hls.on(window.Hls.Events.BUFFER_EOS, () => {
      console.log('📺 缓冲区到达流结束')
      bufferStatus.value = '流结束'
    })

    hls.on(window.Hls.Events.BUFFER_FLUSHED, () => {
      console.log('🗑️ 缓冲区已清空')
      bufferStatus.value = '缓冲区清空'
    })

    // 片段加载事件
    hls.on(window.Hls.Events.FRAG_LOADED, (_, data) => {
      console.log(`📥 片段加载完成: ${data.frag.url}`)
    })

    hls.on(window.Hls.Events.FRAG_LOAD_ERROR, (_, data) => {
      console.warn(`⚠️ 片段加载失败: ${data.frag.url}`, data)
    })
  } else {
    // 尝试原生播放
    fallbackToNativePlayback()
  }
}

// 降级到原生播放
const fallbackToNativePlayback = () => {
  console.log('🔄 降级到原生HLS播放')

  // 清理现有的HLS实例
  if (hls) {
    try {
      hls.destroy()
    } catch (error) {
      console.warn('销毁HLS实例时出错:', error)
    }
    hls = null
  }

  if (visionVideo.value) {
    if (visionVideo.value.canPlayType('application/vnd.apple.mpegurl')) {
      console.log('✅ 使用浏览器原生HLS支持')
      visionVideo.value.src = visionStreamUrl.value
      visionVideo.value.play().then(() => {
        isVisionConnected.value = true
        bufferStatus.value = '原生播放'
        console.log('✅ 原生HLS播放成功')
      }).catch(error => {
        console.error('❌ 原生HLS播放失败:', error)
        bufferStatus.value = '播放失败'
        isVisionConnected.value = false
      })
    } else {
      console.error('❌ 浏览器不支持HLS播放')
      bufferStatus.value = '不支持HLS'
      isVisionConnected.value = false

      // 最后尝试：直接设置src，有些浏览器可能仍然能播放
      visionVideo.value.src = visionStreamUrl.value
      visionVideo.value.play().catch(() => {
        console.error('❌ 所有播放方式都失败')
      })
    }
  }
}

// 缓冲区健康检查
const startBufferHealthCheck = () => {
  if (bufferHealthTimer) {
    clearInterval(bufferHealthTimer)
  }

  bufferHealthTimer = setInterval(() => {
    if (hls && visionVideo.value && isVisionConnected.value) {
      try {
        const buffered = visionVideo.value.buffered
        const currentTime = visionVideo.value.currentTime

        if (buffered.length > 0) {
          const bufferEnd = buffered.end(buffered.length - 1)
          const bufferLength = bufferEnd - currentTime

          console.log(`📊 缓冲区健康检查: 当前时间=${currentTime.toFixed(2)}s, 缓冲结束=${bufferEnd.toFixed(2)}s, 缓冲长度=${bufferLength.toFixed(2)}s`)

          if (bufferLength < 1) {
            console.warn('⚠️ 缓冲区不足，主动加载更多数据')
            bufferStatus.value = '缓冲区不足，正在加载...'
            hls.startLoad()
          } else if (bufferLength > 5) {
            bufferStatus.value = '缓冲充足'
          } else {
            bufferStatus.value = '正常'
          }
        }
      } catch (error) {
        console.error('缓冲区健康检查失败:', error)
      }
    }
  }, 2000) // 每2秒检查一次
}

const stopBufferHealthCheck = () => {
  if (bufferHealthTimer) {
    clearInterval(bufferHealthTimer)
    bufferHealthTimer = null
  }
}

// 断开视频流
const disconnectVision = () => {
  isVisionConnected.value = false
  stopBufferHealthCheck()
  if (hls) {
    hls.destroy()
    hls = null
  }
  if (visionVideo.value) {
    visionVideo.value.src = ''
  }
}

// 加载HLS库 - 使用稳定版本
const loadHlsLibrary = () => {
  return new Promise((resolve) => {
    if (window.Hls) {
      resolve()
      return
    }

    // 使用稳定的HLS.js版本而不是latest
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.12/dist/hls.min.js'
    script.onload = () => {
      console.log('✅ HLS.js库加载成功，版本:', window.Hls?.version || 'unknown')
      resolve()
    }
    script.onerror = (error) => {
      console.error('❌ HLS.js库加载失败:', error)
      // 尝试备用CDN
      const backupScript = document.createElement('script')
      backupScript.src = 'https://unpkg.com/hls.js@1.4.12/dist/hls.min.js'
      backupScript.onload = resolve
      backupScript.onerror = resolve
      document.head.appendChild(backupScript)
    }
    document.head.appendChild(script)
  })
}

// 更新视频质量
const updateVideoQuality = () => {
  console.log('视频质量设置为:', videoQuality.value)
}

// 配置对话框
const openConfigDialog = () => {
  showConfigDialog.value = true
}

const closeConfigDialog = () => {
  showConfigDialog.value = false
}

const saveAndReconnect = () => {
  if (!visionStreamUrl.value.trim()) {
    alert('请输入有效的视频流地址')
    return
  }

  try {
    new URL(visionStreamUrl.value)
  } catch (error) {
    alert('请输入有效的URL地址')
    return
  }

  console.log('保存视频配置:', visionStreamUrl.value)

  // 如果当前已连接，重新连接
  if (isVisionConnected.value) {
    disconnectVision()
    setTimeout(connectVision, 1000)
  }

  closeConfigDialog()
}

// 生命周期
onMounted(() => {
  console.log('机器人仿真页面已加载')
  visionStreamUrl.value = getVisionStreamUrl()

  // 延迟连接视频流
  setTimeout(() => {
    connectVision()
  }, 1000)
})

onUnmounted(() => {
  disconnectVision()
  stopBufferHealthCheck()
  console.log('机器人仿真页面已卸载')
})
</script>

<style scoped>
@import '../assets/styles.css';
@import '../assets/arm-system.css';

/* 仿真页面特定样式 */
.simulation-main {
  padding: 0;
  margin-top: 80px; /* 适当的顶部间距，避免被标题栏遮挡 */
  min-height: calc(100vh - 100px); /* 减少底部空间，让视频区域更大 */
  background: #000000;
  position: relative;
  overflow: hidden;
}

/* 全屏视频容器 */
.fullscreen-video-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 100px); /* 减少底部空间，让视频占用更多屏幕 */
  background: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fullscreen-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000000;
}



/* 视频占位符 */
.video-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 20, 40, 0.9) 100%);
  backdrop-filter: blur(10px);
}

.placeholder-content {
  text-align: center;
  color: #ffffff;
  max-width: 400px;
  padding: 40px;
}

.placeholder-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.7;
  filter: drop-shadow(0 0 20px rgba(0, 153, 255, 0.3));
}

.placeholder-text {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #4da6ff;
  font-weight: 600;
}

.placeholder-hint {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

/* 配置对话框特定样式 */
.config-modal {
  max-width: 600px;
  width: 90%;
}

.config-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 102, 255, 0.2);
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  color: #4da6ff;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 15px 0;
}

.control-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.control-buttons .btn {
  flex: 1;
  max-width: 120px;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-label {
  color: #4da6ff;
  font-weight: 500;
}

.status-value.connected {
  color: #4caf50;
  font-weight: 600;
}

.status-value.disconnected {
  color: #f44336;
  font-weight: 600;
}

.form-select {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 20, 40, 0.3) 100%);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 6px;
  color: #4da6ff;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  width: 100%;
}

.form-select:focus {
  outline: none;
  border-color: rgba(0, 102, 255, 0.6);
}

.url-display {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(0, 102, 255, 0.2);
}

.url-label {
  color: #4da6ff;
  font-weight: 500;
  min-width: 80px;
}

.url-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-family: monospace;
  word-break: break-all;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(30, 30, 40, 0.95));
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  border: 1px solid rgba(0, 102, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 102, 255, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 102, 255, 0.2);
}

.modal-header h3 {
  color: #4da6ff;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  color: #4da6ff;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 20, 40, 0.3) 100%);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 6px;
  color: #ffffff;
  padding: 10px;
  font-size: 14px;
  backdrop-filter: blur(8px);
}

.form-input:focus {
  outline: none;
  border-color: rgba(0, 102, 255, 0.6);
}

.config-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid rgba(0, 102, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .simulation-main {
    margin-top: 60px; /* 移动端适当的顶部间距 */
    min-height: calc(100vh - 80px); /* 移动端减少底部空间 */
  }

  .fullscreen-video-container {
    height: calc(100vh - 80px); /* 移动端让视频占用更多空间 */
  }

  .placeholder-content {
    padding: 20px;
    max-width: 300px;
  }

  .placeholder-icon {
    font-size: 3.5rem;
  }

  .placeholder-text {
    font-size: 1.2rem;
  }

  .placeholder-hint {
    font-size: 0.9rem;
  }

  .config-modal {
    width: 95%;
    margin: 10px;
  }

  .control-buttons {
    flex-direction: column;
  }

  .control-buttons .btn {
    max-width: none;
  }

  .url-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .url-label {
    min-width: auto;
  }
}
</style>
