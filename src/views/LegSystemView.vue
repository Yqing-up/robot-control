<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回主页</button>
        <h1 class="title">下肢系统控制中心</h1>
      </div>
      <div class="header-controls">
        <!-- 状态指示器已移除 -->
        <div class="header-buttons">
          <button class="btn btn-small" @click="initializeCamera" :disabled="cameraLoading">
            {{ cameraLoading ? '连接中...' : '刷新摄像头' }}
          </button>
          <button class="btn btn-small" @click="exportMovementData">导出数据</button>
        </div>
      </div>
    </header>

    <main class="leg-main">
      <!-- 使用左右布局容器 -->
      <div class="leg-layout-container">
        <!-- 左侧控制区 -->
        <div class="leg-left-section">
          <!-- 主控制区 -->
          <section class="control-section">
            <div class="main-controls">
              <!-- 机器人控制中心 -->
              <div class="robot-control-center">
                <div class="control-layout">
                  <!-- 摄像头视频流区域 - 上方 -->
                  <div class="camera-section">
                    <div class="video-display">
                      <!-- 视频模式 -->
                      <video
                        v-if="!useFallbackImage"
                        ref="cameraVideo"
                        class="camera-stream"
                        :src="cameraStreamUrl"
                        autoplay
                        muted
                        playsinline
                        controls
                        preload="none"
                        @loadstart="onVideoLoadStart"
                        @loadeddata="onVideoLoaded"
                        @play="onVideoPlay"
                        @pause="onVideoPause"
                        @ended="onVideoEnded"
                        @error="onVideoError"
                        @canplay="onVideoCanPlay"
                        @waiting="onVideoWaiting"
                      >
                        <div class="video-placeholder">
                          <div class="placeholder-icon">📹</div>
                          <div class="placeholder-text">摄像头画面</div>
                          <div class="placeholder-status">{{ cameraStatus }}</div>
                        </div>
                      </video>

                      <!-- 图片模式（MJPEG流备用方案） -->
                      <img
                        v-else
                        ref="cameraImage"
                        class="camera-stream"
                        :src="cameraStreamUrl"
                        @load="onImageLoad"
                        @error="onImageError"
                        alt="摄像头画面"
                      />
                      <div v-if="!cameraConnected" class="video-overlay">
                        <div class="overlay-content">
                          <div class="overlay-icon">📹</div>
                          <div class="overlay-text">摄像头画面</div>
                          <div class="overlay-status">{{ cameraStatus }}</div>
                        </div>
                      </div>
                    </div>
                    <div class="camera-controls">
                      <button class="camera-btn" @click="toggleCamera" :disabled="cameraLoading">
                        {{ cameraConnected ? '断开摄像头' : '连接摄像头' }}
                      </button>
                      <button class="camera-btn" @click="toggleFullscreen" :disabled="!cameraConnected">
                        {{ isFullscreen ? '🔍 退出全屏' : '🔍 全屏' }}
                      </button>
                    </div>
                  </div>

                  <!-- 方向控制区域 - 下方 -->
                  <div class="direction-section">
                    <div class="direction-pad-extended">
                      <!-- 左移按钮 -->
                      <button class="direction-btn side-btn left-move"
                              :class="{ active: currentDirection === 'left-move', disabled: isExecutingAction }"
                              :disabled="isExecutingAction"
                              @click="setDirection('left-move')"
                              data-direction="left-move">
                        <span class="arrow">←</span>
                        <span class="label">左移</span>
                      </button>

                      <!-- 中央控制区域 -->
                      <div class="center-controls">
                        <button class="direction-btn forward"
                                :class="{ active: currentDirection === 'forward', disabled: isExecutingAction }"
                                :disabled="isExecutingAction"
                                @click="setDirection('forward')"
                                data-direction="forward">
                          <span class="arrow">↑</span>
                          <span class="label">前进</span>
                        </button>
                        <div class="middle-row">
                          <button class="direction-btn left"
                                  :class="{ active: currentDirection === 'left', disabled: isExecutingAction }"
                                  :disabled="isExecutingAction"
                                  @click="setDirection('left')"
                                  data-direction="left">
                            <span class="arrow">↺</span>
                            <span class="label">左转</span>
                          </button>
                          <button class="direction-btn stop emergency"
                                  :class="{ active: currentDirection === 'stop' }"
                                  @click="emergencyStop"
                                  data-direction="stop">
                            <span class="stop-icon">■</span>
                            <span class="label">紧急停止</span>
                          </button>
                          <button class="direction-btn right"
                                  :class="{ active: currentDirection === 'right', disabled: isExecutingAction }"
                                  :disabled="isExecutingAction"
                                  @click="setDirection('right')"
                                  data-direction="right">
                            <span class="arrow">↻</span>
                            <span class="label">右转</span>
                          </button>
                        </div>
                        <button class="direction-btn backward"
                                :class="{ active: currentDirection === 'backward', disabled: isExecutingAction }"
                                :disabled="isExecutingAction"
                                @click="setDirection('backward')"
                                data-direction="backward">
                          <span class="arrow">↓</span>
                          <span class="label">后退</span>
                        </button>
                      </div>

                      <!-- 右移按钮 -->
                      <button class="direction-btn side-btn right-move"
                              :class="{ active: currentDirection === 'right-move', disabled: isExecutingAction }"
                              :disabled="isExecutingAction"
                              @click="setDirection('right-move')"
                              data-direction="right-move">
                        <span class="arrow">→</span>
                        <span class="label">右移</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 右侧监控区 -->
        <div class="leg-right-section">
          <!-- 状态监控区 -->
          <section class="monitoring-section">
            <div class="monitor-grid">
              <!-- 平衡系统监控 -->
              <div class="monitor-panel balance-panel">
                <div class="panel-header">
                  <h3>平衡系统</h3>
                  <div class="leg-status-indicator online"></div>
                </div>
                <div class="balance-display">
                  <div class="balance-meter">
                    <div class="balance-indicator" :style="{ transform: `translate3d(calc(-50% + ${balance.tilt * 3}px), -50%, 0)` }"></div>
                    <div class="balance-scale">
                      <span>-30°</span>
                      <span>0°</span>
                      <span>+30°</span>
                    </div>
                  </div>
                  <div class="balance-values">
                    <div class="balance-item">
                      <span class="label">倾斜角度</span>
                      <span class="value">{{ balance.tilt.toFixed(1) }}°</span>
                    </div>
                    <div class="balance-item">
                      <span class="label">稳定性</span>
                      <span class="value">{{ balance.stability.toFixed(2) }}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 移动状态监控 -->
              <div class="monitor-panel movement-panel">
                <div class="panel-header">
                  <h3>移动状态</h3>
                  <div class="leg-status-indicator online"></div>
                </div>
                <div class="movement-display">
                  <div class="position-info">
                    <div class="position-item">
                      <span class="label">X坐标</span>
                      <span class="value">{{ position.x.toFixed(1) }} m</span>
                    </div>
                    <div class="position-item">
                      <span class="label">Y坐标</span>
                      <span class="value">{{ position.y.toFixed(1) }} m</span>
                    </div>
                    <div class="position-item">
                      <span class="label">朝向</span>
                      <span class="value">{{ heading }}°</span>
                    </div>
                    <div class="position-item">
                      <span class="label">总距离</span>
                      <span class="value">{{ totalDistance.toFixed(1) }} m</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 步态选择 -->
              <div class="monitor-panel gait-panel">
                <div class="panel-header">
                  <h3>步态模式</h3>
                  <div class="leg-status-indicator online"></div>
                </div>
                <div class="gait-selector">
                  <button class="gait-btn"
                          :class="{ active: currentGait === 'normal' }"
                          @click="setGait('normal')"
                          data-gait="normal">
                    <span class="gait-icon">👣</span>
                    <span class="gait-name">正常行走</span>
                    <span class="gait-desc">稳定平衡</span>
                  </button>
                  <button class="gait-btn"
                          :class="{ active: currentGait === 'fast' }"
                          @click="setGait('fast')"
                          data-gait="fast">
                    <span class="gait-icon">⚡</span>
                    <span class="gait-name">快速移动</span>
                    <span class="gait-desc">高效率</span>
                  </button>
                  <button class="gait-btn"
                          :class="{ active: currentGait === 'precise' }"
                          @click="setGait('precise')"
                          data-gait="precise">
                    <span class="gait-icon">🎯</span>
                    <span class="gait-name">精确定位</span>
                    <span class="gait-desc">高精度</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { movementApi } from '../api/movementApi.js'
import { cameraApi } from '../api/cameraApi.js'
// 如需用到工具函数请在本文件实现

const router = useRouter()

// 响应式数据
const isMoving = ref(false)
const currentDirection = ref('stop')
const currentGait = ref('normal')
const isExecutingAction = ref(false) // 机器人是否正在执行动作

// 摄像头相关数据
const cameraConnected = ref(false)
const cameraLoading = ref(false)
const cameraStatus = ref('摄像头未连接')
const cameraStreamUrl = ref('') // 摄像头流URL从API获取
const cameraVideo = ref(null)
const cameraImage = ref(null)
const useFallbackImage = ref(true) // 默认使用图片模式显示MJPEG流
const isFullscreen = ref(false) // 全屏状态

// 使用reactive而非ref来避免不必要的响应式更新传播
const position = reactive({ x: 0, y: 0 })
const heading = ref(0)
const totalDistance = ref(0)
const stepCount = ref(0)
const balance = reactive({
  tilt: 0, // 初始值为0度
  stability: 98
})
const runTime = ref(0)
const batteryLevel = ref(1.0)
const temperature = ref(45)

// 系统状态
const systemStatus = ref('online')
const statusText = ref('系统就绪')

// 动画帧ID
let animationFrameId = null
let lastUpdateTime = 0
let isUpdating = false
let updateCount = 0

// 方法
const goBack = () => {
  router.push('/')
}

// 获取方向标签的辅助函数
const getDirectionLabel = (direction) => {
  return movementApi.getMovementLabel(direction)
}

// 设置方向
const setDirection = async (direction) => {
  // 检查是否正在执行动作
  if (isExecutingAction.value && direction !== 'stop') {
    console.warn('⚠️ 机器人正在执行动作，请等待完成后再操作')
    statusText.value = '⚠️ 请等待当前动作完成'
    // 1秒后恢复状态文本
    setTimeout(() => {
      if (!isExecutingAction.value) {
        statusText.value = '系统就绪'
      }
    }, 1000)
    return
  }

  currentDirection.value = direction
  isMoving.value = direction !== 'stop'

  if (direction === 'stop') {
    statusText.value = '系统就绪'
  } else {
    statusText.value = `正在${getDirectionLabel(direction)}`
  }

  // 调用对应的机器人移动API
  await executeMovement(direction)
}

// 执行机器人移动
const executeMovement = async (direction) => {
  if (direction === 'stop') {
    // 停止时不调用API，只更新状态
    return
  }

  // 设置执行状态为true，锁定其他按钮
  isExecutingAction.value = true
  const actionName = getDirectionLabel(direction)
  console.log(`🔒 锁定控制按钮，开始执行${actionName}`)

  // 调用API
  const response = await movementApi.executeMovement(direction)
  console.log('执行移动API响应:', response)
  const result = response.data || response
  console.log('提取的执行移动数据:', result)

  // 更新状态文本
  if (result.success) {
    statusText.value = `✅ ${result.action}完成`
    console.log(`✅ ${result.action}执行完成，解锁控制按钮`)

    // 2秒后恢复为就绪状态并解锁按钮
    setTimeout(() => {
      isExecutingAction.value = false
      if (currentDirection.value === 'stop') {
        statusText.value = '系统就绪'
      }
      console.log('🔓 控制按钮已解锁')
    }, 2000)
  } else {
    statusText.value = `❌ ${result.action || actionName}失败: ${result.error}`
    console.log(`❌ ${result.action || actionName}执行失败，解锁控制按钮`)

    // 立即解锁按钮，3秒后恢复状态文本
    isExecutingAction.value = false
    setTimeout(() => {
      statusText.value = '系统就绪'
    }, 3000)
    console.log('🔓 控制按钮已解锁')
  }
}

// 紧急停止
const emergencyStop = async () => {
  currentDirection.value = 'stop'
  isMoving.value = false
  statusText.value = '紧急停止中...'
  console.log('🚨 紧急停止 - 强制中断当前动作')

  // 紧急停止时立即设置执行状态，防止其他操作
  isExecutingAction.value = true

  // 调用紧急停止API
  const result = await movementApi.emergencyStop()

  // 更新状态文本
  if (result.success) {
    statusText.value = `✅ ${result.action}完成`
    console.log(`✅ ${result.action}执行完成`)
  } else {
    statusText.value = `❌ ${result.action || '紧急停止'}失败: ${result.error}`
    console.log(`❌ ${result.action || '紧急停止'}执行失败`)
  }

  // 2秒后恢复为就绪状态并解锁按钮
  setTimeout(() => {
    isExecutingAction.value = false
    statusText.value = '系统就绪'
    console.log('🔓 紧急停止完成，控制按钮已解锁')
  }, 2000)
}

// 测试摄像头连接
const testCameraConnection = async () => {
  return await cameraApi.testConnection()
}

// 摄像头控制函数
const toggleCamera = async () => {
  cameraLoading.value = true

  try {
    if (cameraConnected.value) {
      // 断开摄像头
      cameraStreamUrl.value = ''
      cameraConnected.value = false
      cameraStatus.value = '摄像头已断开'
      console.log('摄像头已断开')
    } else {
      // 连接摄像头
      cameraStatus.value = '正在连接摄像头...'

      // 测试摄像头连接
      const isConnectable = await testCameraConnection()

      if (isConnectable) {
        // 设置视频流URL
        const streamUrl = cameraApi.getStreamUrl()
        cameraStreamUrl.value = streamUrl
        cameraConnected.value = true
        cameraStatus.value = '摄像头已连接'
        console.log('摄像头已连接，视频流URL:', streamUrl)
      } else {
        throw new Error('无法连接到摄像头服务')
      }
    }
  } catch (error) {
    console.error('摄像头连接失败:', error)
    cameraStatus.value = `连接失败: ${error.message}`
    cameraConnected.value = false
    cameraStreamUrl.value = ''
  } finally {
    cameraLoading.value = false
  }
}

// 完善的全屏功能
const toggleFullscreen = async () => {
  if (!cameraConnected.value) return

  try {
    if (isFullscreen.value) {
      // 退出全屏
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen()
      }
      console.log('🔍 退出全屏模式')
    } else {
      // 进入全屏 - 支持MJPEG和视频模式
      const element = useFallbackImage.value ? cameraImage.value : cameraVideo.value

      if (element) {
        if (element.requestFullscreen) {
          await element.requestFullscreen()
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen()
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen()
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen()
        }
        console.log('🔍 进入全屏模式')
      }
    }
  } catch (error) {
    console.error('❌ 全屏操作失败:', error)
    cameraStatus.value = '❌ 全屏操作失败'
  }
}

const onVideoLoadStart = () => {
  console.log('🎥 视频开始加载')
  cameraStatus.value = '正在加载视频流...'
}

const onVideoError = (event) => {
  console.error('❌ 视频加载错误:', event)

  // 获取更详细的错误信息
  const video = event.target
  if (video && video.error) {
    const errorCode = video.error.code
    const errorMessage = video.error.message
    console.error('📹 视频错误详情:', {
      code: errorCode,
      message: errorMessage,
      src: video.src
    })

    // 根据错误代码提供具体的错误信息
    let errorText = '视频加载失败'
    switch (errorCode) {
      case 1: // MEDIA_ERR_ABORTED
        errorText = '视频加载被中止'
        break
      case 2: // MEDIA_ERR_NETWORK
        errorText = '网络错误，无法加载视频'
        break
      case 3: // MEDIA_ERR_DECODE
        errorText = '视频解码错误'
        break
      case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
        errorText = '视频格式不支持或源不可用'
        break
      default:
        errorText = `视频错误 (代码: ${errorCode})`
    }

    cameraStatus.value = `❌ ${errorText}`
  } else {
    cameraStatus.value = '❌ 视频加载失败，原因未知'
  }

  cameraConnected.value = false

  // 10秒后自动重试连接
  setTimeout(() => {
    if (!cameraConnected.value) {
      console.log('🔄 自动重试摄像头连接')
      cameraStatus.value = '🔄 正在重试连接...'
      initializeCamera()
    }
  }, 10000)
}

// 视频加载成功事件
const onVideoLoaded = () => {
  console.log('✅ 视频数据加载成功')
  cameraStatus.value = '📺 视频流数据加载完成'
}

// 视频播放事件
const onVideoPlay = () => {
  console.log('▶️ 视频开始播放')
  cameraStatus.value = '🎥 摄像头正常工作'
  console.log('✅ 视频流连接成功，摄像头工作正常')
}

// 视频暂停事件
const onVideoPause = () => {
  console.log('⏸️ 视频暂停')
  cameraStatus.value = '视频流暂停'
}

// 视频结束事件
const onVideoEnded = () => {
  console.log('⏹️ 视频流结束')
  cameraStatus.value = '视频流已结束'
}

// 视频可以播放事件
const onVideoCanPlay = () => {
  console.log('✅ 视频可以开始播放')
  cameraStatus.value = '📺 视频准备就绪'
}

// 视频等待事件
const onVideoWaiting = () => {
  console.log('⏳ 视频缓冲中...')
  cameraStatus.value = '⏳ 视频缓冲中...'
}

// 图片加载成功事件（MJPEG流）
const onImageLoad = () => {
  console.log('📺 MJPEG流加载成功')
  cameraStatus.value = '📺 MJPEG摄像头正常工作'
  cameraConnected.value = true
}

// 图片加载错误事件（MJPEG流）
const onImageError = (event) => {
  console.log('❌ MJPEG流加载失败:', event)
  cameraStatus.value = '❌ MJPEG流加载失败，正在重试...'
  cameraConnected.value = false

  // 5秒后自动重试
  setTimeout(() => {
    if (!cameraConnected.value && cameraStreamUrl.value) {
      console.log('🔄 自动重试MJPEG流连接')
      // 通过重新设置src来触发重新加载
      const url = cameraStreamUrl.value
      cameraStreamUrl.value = ''
      setTimeout(() => {
        cameraStreamUrl.value = url
      }, 100)
    }
  }, 5000)
}

// 切换显示模式
const toggleDisplayMode = () => {
  useFallbackImage.value = !useFallbackImage.value
  console.log(`🔄 切换显示模式: ${useFallbackImage.value ? 'MJPEG模式' : '视频模式'}`)
  cameraStatus.value = `🔄 切换到${useFallbackImage.value ? 'MJPEG' : '视频'}模式...`

  if (cameraStreamUrl.value) {
    // 重新设置源以触发重新加载
    const url = cameraStreamUrl.value
    cameraStreamUrl.value = ''
    setTimeout(() => {
      cameraStreamUrl.value = url
    }, 100)
  }
}

// 诊断视频流功能
const diagnoseVideoStream = async () => {
  console.log('🔍 开始诊断视频流...')
  cameraStatus.value = '🔍 正在诊断视频流...'

  try {
    const diagnosis = await cameraApi.diagnoseVideoStream()

    if (diagnosis.overall) {
      cameraStatus.value = '✅ 视频流诊断通过'
      console.log('✅ 视频流诊断完成，所有测试通过')
    } else {
      cameraStatus.value = '❌ 视频流诊断失败'
      console.log('❌ 视频流诊断失败:', diagnosis)
    }

    // 3. 检查响应头
    const headers = {}
    getResponse.headers.forEach((value, key) => {
      headers[key] = value
    })
    console.log('📋 响应头信息:', headers)

    // 4. 检查视频元素状态
    const video = cameraVideo.value
    if (video) {
      console.log('📺 视频元素状态:', {
        src: video.src,
        readyState: video.readyState,
        networkState: video.networkState,
        error: video.error,
        paused: video.paused,
        ended: video.ended
      })
    }

    cameraStatus.value = '✅ 诊断完成，请查看控制台日志'

  } catch (error) {
    console.error('❌ 诊断过程中出错:', error)
    cameraStatus.value = `❌ 诊断失败: ${error.message}`
  }
}

// 设置步态模式
const setGait = (gait) => {
  currentGait.value = gait
  console.log('步态模式设置为:', gait)
}



const resetSystem = () => {
  currentDirection.value = 'stop'
  currentGait.value = 'normal'
  isMoving.value = false
  position.value = { x: 0, y: 0 }
  heading.value = 0
  totalDistance.value = 0
  stepCount.value = 0
  console.log('系统已重置')
}

const exportMovementData = () => {
  const data = {
    position: position.value,
    heading: heading.value,
    totalDistance: totalDistance.value,
    stepCount: stepCount.value,
    currentGait: currentGait.value,
    balance: balance.value,
    runTime: runTime.value,
    batteryLevel: batteryLevel.value,
    temperature: temperature.value,
    systemStatus: systemStatus.value
  }

  systemUtils.exportMovementData(data)
}

// 键盘控制
const handleKeyDown = async (event) => {
  switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      await setDirection('forward')
      break
    case 's':
    case 'arrowdown':
      await setDirection('backward')
      break
    case 'a':
    case 'arrowleft':
      await setDirection('left')
      break
    case 'd':
    case 'arrowright':
      await setDirection('right')
      break
    case 'q':
      await setDirection('left-move')
      break
    case 'e':
      await setDirection('right-move')
      break
    case ' ':
      event.preventDefault()
      await emergencyStop()
      break
  }
}

const handleKeyUp = async (event) => {
  // 松开按键时停止移动（除了空格键）
  if (event.key !== ' ') {
    await setDirection('stop')
  }
}

// 模拟数据更新 - 使用requestAnimationFrame替代setInterval
const startMonitoring = () => {
  // 初始化时间
  lastUpdateTime = performance.now()
  isUpdating = true

  // 创建平滑的更新函数
  const updateFrame = (timestamp) => {
    if (!isUpdating) return

    // 计算经过的时间（毫秒）
    const elapsed = timestamp - lastUpdateTime

    // 控制更新频率，每200ms更新一次数据
    if (elapsed > 200) {
      updateCount++

      // 平衡系统数据 - 使用平滑的变化算法
      // 使用更小更平滑的变化量
      const tiltChange = (Math.random() - 0.5) * 0.3 // 更小的变化
      let newTilt = balance.tilt + tiltChange

      // 模拟一种自然的平衡恢复效果 - 向0回归
      newTilt = newTilt * 0.95 // 缓慢向中心位置靠近

      // 限制在合理范围内
      newTilt = Math.max(-5, Math.min(5, newTilt))

      // 保留1位小数，减少频繁微小更新
      balance.tilt = parseFloat(newTilt.toFixed(1))

      // 稳定性只使用较小的变化，并立即格式化为2位小数
      const stabilityChange = (Math.random() - 0.5) * 0.1
      let newStability = Math.max(95, Math.min(99, balance.stability + stabilityChange))
      balance.stability = parseFloat(newStability.toFixed(2)) // 直接保留2位小数，避免显示过多小数位

      // 只有需要更新的数据才在这里更新
      // 如果正在移动，更新位置
      if (isMoving.value && currentDirection.value !== 'stop') {
        const speed = 1.0 // 固定速度 1.0 m/s
        const deltaTime = 0.1 // 100ms

        switch (currentDirection.value) {
          case 'forward':
            position.y += speed * deltaTime
            break
          case 'backward':
            position.y -= speed * deltaTime
            break
          case 'left':
            heading.value = (heading.value - 5) % 360
            break
          case 'right':
            heading.value = (heading.value + 5) % 360
            break
          case 'left-move':
            position.x -= speed * deltaTime
            break
          case 'right-move':
            position.x += speed * deltaTime
            break
        }

        stepCount.value++
        totalDistance.value += speed * deltaTime
      }

      // 只在每10次更新才处理这些不太重要的数据，减少页面重绘
      if (updateCount % 10 === 0) {
        // 更新运行时间
        runTime.value++

        // 模拟电池消耗
        if (isMoving.value) {
          batteryLevel.value = Math.max(0, batteryLevel.value - 0.001)
        }

        // 模拟温度变化
        temperature.value = Math.round((40 + Math.random() * 10) * 10) / 10 // 保留1位小数
      }

      lastUpdateTime = timestamp
    }

    // 继续下一帧
    animationFrameId = requestAnimationFrame(updateFrame)
  }

  // 开始动画循环
  animationFrameId = requestAnimationFrame(updateFrame)

  // 返回一个停止函数
  return () => {
    isUpdating = false
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  }
}

// 保存到本地存储
const saveToLocalStorage = () => {
  const data = {
    position: position.value,
    heading: heading.value,
    totalDistance: totalDistance.value,
    stepCount: stepCount.value,
    currentGait: currentGait.value,
    runTime: runTime.value,
    batteryLevel: batteryLevel.value
  }
  localStorage.setItem('legSystemData', JSON.stringify(data))
}

// 从本地存储加载
const loadFromLocalStorage = () => {
  const savedData = localStorage.getItem('legSystemData')
  if (savedData) {
    try {
      const data = JSON.parse(savedData)
      position.value = data.position || { x: 0, y: 0 }
      heading.value = data.heading || 0
      totalDistance.value = data.totalDistance || 0
      stepCount.value = data.stepCount || 0
      currentGait.value = data.currentGait || 'normal'
      runTime.value = data.runTime || 0
      batteryLevel.value = data.batteryLevel || 85
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }
}

// 初始化摄像头连接
const initializeCamera = async () => {
  try {
    console.log('🎥 正在初始化摄像头连接...')
    cameraLoading.value = true
    cameraStatus.value = '正在初始化摄像头...'

    // 测试摄像头连接
    const streamUrl = cameraApi.getStreamUrl()
    console.log('🔍 测试摄像头连接 (通过代理):', streamUrl)
    console.log('🔍 实际目标地址: http://192.168.0.116:5001/api/video/raw_video_feed')
    const isConnectable = await testCameraConnection()

    if (isConnectable) {
      // 自动连接摄像头
      console.log('✅ 摄像头服务可用，开始连接视频流')
      cameraStreamUrl.value = streamUrl
      cameraConnected.value = true
      cameraStatus.value = '摄像头连接成功，正在加载视频流...'
      console.log('🎥 摄像头自动连接成功，视频流URL:', streamUrl)
      console.log('📺 等待视频流加载完成...')
    } else {
      cameraStatus.value = '摄像头服务不可用，请检查服务器'
      console.log('❌ 摄像头服务不可用')
    }
  } catch (error) {
    console.error('❌ 摄像头初始化失败:', error)
    cameraStatus.value = `摄像头初始化失败: ${error.message}`
  } finally {
    cameraLoading.value = false
  }
}

// 全屏状态监听器
const setupFullscreenListeners = () => {
  const handleFullscreenChange = () => {
    isFullscreen.value = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
    console.log('🔍 全屏状态变化:', isFullscreen.value ? '已进入全屏' : '已退出全屏')
  }

  // 添加全屏状态变化监听器
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)

  // 返回清理函数
  return () => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
    document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
  }
}

onMounted(() => {
  console.log('下肢系统组件已挂载')
  loadFromLocalStorage()

  // 添加键盘事件监听
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)

  // 设置全屏状态监听器
  const cleanupFullscreenListeners = setupFullscreenListeners()

  // 开始监控
  const stopMonitoring = startMonitoring()

  // 初始化摄像头
  initializeCamera()

  // 定期保存数据
  const saveInterval = setInterval(saveToLocalStorage, 30000)

  onUnmounted(() => {
    console.log('下肢系统组件已卸载')
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keyup', handleKeyUp)
    cleanupFullscreenListeners() // 清理全屏监听器
    stopMonitoring() // 停止动画帧
    clearInterval(saveInterval)
    saveToLocalStorage() // 最后保存一次
  })
})
</script>

<style>
@import '../assets/leg-system-new.css';
</style>
