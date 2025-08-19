<template>
  <div class="health-wellness-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goHome">← 返回主页</button>
        <h1 class="title">智能养生中心</h1>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 左侧区域：实时数据展示 -->
      <div class="left-section">
        <!-- 上半部分：图片展示区域 -->
        <div class="image-display-panel">
          <div class="panel-header">
            <h3 class="panel-title">实时图片数据</h3>
            <div class="update-info">
              <span class="update-time">最后更新: {{ lastImageUpdate }}</span>
              <div class="auto-refresh-indicator" :class="{ active: isAutoRefreshing }">
                <span class="indicator-dot"></span>
                自动刷新
              </div>
            </div>
          </div>
          <div class="image-content">
            <div v-if="realtimeImages.length > 0" class="image-grid">
              <div v-for="(image, index) in realtimeImages" :key="image.filename" class="image-item">
                <img
                  :src="image.url"
                  :alt="image.filename"
                  class="image-thumbnail"
                  @click="openImageModal(image, index)"
                />
                <div class="image-info">
                  <div class="image-filename">{{ image.filename }}</div>
                  <div class="image-time">{{ formatImageTime(image.timestamp) }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-images">
              <div class="empty-icon">📷</div>
              <div class="empty-message">暂无图片数据</div>
            </div>
          </div>
        </div>

        <!-- 下半部分：语音文本展示区域 -->
        <div class="text-display-panel">
          <div class="panel-header">
            <h3 class="panel-title">实时语音文本</h3>
            <div class="update-info">
              <span class="update-time">最后更新: {{ lastTextUpdate }}</span>
              <div class="auto-refresh-indicator" :class="{ active: isAutoRefreshing }">
                <span class="indicator-dot"></span>
                自动刷新
              </div>
            </div>
          </div>
          <div class="text-content">
            <div v-if="realtimeTexts.length > 0" class="text-list">
              <div v-for="(text, index) in sortedRealtimeTexts" :key="index" class="text-item">
                <div class="text-timestamp">{{ formatTextTime(text.timestamp) }}</div>
                <div class="text-content-text">{{ text.content }}</div>
              </div>
            </div>
            <div v-else class="empty-texts">
              <div class="empty-icon">🎤</div>
              <div class="empty-message">暂无语音文本数据</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧区域：智能分析模块 -->
      <div class="right-section">
        <!-- 需求描述区域 -->
        <section class="input-section">
          <div class="section-header">
            <h2 class="section-title">需求描述</h2>
            <div class="char-counter">{{ userInput.length }}/1000</div>
          </div>
          <div class="input-wrapper">
            <textarea
              v-model="userInput"
              maxlength="1000"
              placeholder="请输入您的养生需求或健康问题..."
              class="text-input"
              :class="{ 'input-error': inputError }"
              @input="handleInputChange"
              @focus="clearInputError"
            ></textarea>
            <div v-if="inputError" class="error-message">{{ inputError }}</div>
          </div>

          <!-- 操作按钮 -->
          <div class="button-group">
            <button
              @click="submitAnalysis"
              :disabled="!canSubmit"
              class="submit-btn"
              :class="{ loading: isSubmitting }"
            >
              <span v-if="!isSubmitting">{{ submitButtonText }}</span>
              <span v-else class="loading-text">
                <span class="loading-spinner"></span>
                分析中...
              </span>
            </button>
            <button @click="saveDraft" class="draft-btn" :disabled="!userInput.trim()">
              保存草稿
            </button>
            <button @click="resetForm" class="reset-btn">
              重置
            </button>
          </div>
        </section>



        <!-- 分析结果区域 -->
        <section class="result-section">
          <div class="section-header">
            <h2 class="section-title">分析结果</h2>
            <div class="result-actions" v-if="resultText">
              <button @click="copyResult" class="copy-btn" :class="{ copied: copySuccess }">
                {{ copySuccess ? '已复制' : '复制' }}
              </button>
            </div>
          </div>

          <!-- 分析步骤指示器 -->
          <div class="analysis-steps" v-if="isSubmitting || isLoadingImageData">
            <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
              <div class="step-number">1</div>
              <div class="step-text">获取数据</div>
            </div>
            <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
              <div class="step-number">2</div>
              <div class="step-text">智能分析</div>
            </div>
            <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
              <div class="step-number">3</div>
              <div class="step-text">展示结果</div>
            </div>
          </div>

          <div class="result-wrapper">
            <div v-if="!resultText && !isSubmitting && !isLoadingImageData" class="result-placeholder">
              <div class="placeholder-icon">🌿</div>
              <div class="placeholder-text">智能养生分析结果将在这里显示</div>
              <div class="placeholder-steps">
                <p>分析流程：</p>
                <p>1️⃣ 获取实时图片和语音数据</p>
                <p>2️⃣ 结合养生需求进行智能分析</p>
                <p>3️⃣ 展示个性化养生建议</p>
              </div>
            </div>
            <div v-else-if="isSubmitting || isLoadingImageData" class="result-loading">
              <div class="loading-container">
                <div class="loading-animation"></div>
                <div class="loading-text">
                  <span v-if="isLoadingImageData">正在获取多模态数据...</span>
                  <span v-else-if="currentStep === 2">正在进行智能分析...</span>
                  <span v-else>处理中...</span>
                </div>
                <div class="loading-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                  </div>
                  <div class="progress-text">{{ progress }}%</div>
                </div>
              </div>
            </div>
            <div v-else class="result-content">
              <div class="result-text">{{ resultText }}</div>
              <div class="result-metadata" v-if="resultMetadata">
                <div class="metadata-item">
                  <span class="metadata-label">分析时间:</span>
                  <span class="metadata-value">{{ formatTimestamp(resultMetadata.timestamp) }}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">图片数量:</span>
                  <span class="metadata-value">{{ resultMetadata.imageCount }}张</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">文本数量:</span>
                  <span class="metadata-value">{{ resultMetadata.textCount }}条</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 图片模态框 -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeImageModal">&times;</button>
        <img :src="selectedImage?.url" :alt="selectedImage?.filename" class="modal-image" />
        <div class="modal-info">
          <h3>{{ selectedImage?.filename }}</h3>
          <p>拍摄时间: {{ formatImageTime(selectedImage?.timestamp) }}</p>
        </div>
        <div class="modal-navigation">
          <button @click="previousImage" :disabled="currentImageIndex <= 0" class="nav-btn prev-btn">
            ← 上一张
          </button>
          <span class="image-counter">{{ currentImageIndex + 1 }} / {{ realtimeImages.length }}</span>
          <button @click="nextImage" :disabled="currentImageIndex >= realtimeImages.length - 1" class="nav-btn next-btn">
            下一张 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getRecentImageData,
  getRecentImagesByCount,
  getAllImageData,
  analyzeImageData,
  validateInput,
  formatAnalysisResult,
  extractImageUrls
} from '../api/imageAnalysis.js'
import { voiceApi } from '../api/voiceApi'
import { robotApi } from '../api/robotApi'

const router = useRouter()

// 响应式数据
const userInput = ref('')
const isSubmitting = ref(false)
const isLoadingImageData = ref(false)
const resultText = ref('')
const resultMetadata = ref(null)
const progress = ref(0)
const inputError = ref('')
const copySuccess = ref(false)
const currentStep = ref(1)

// 实时数据相关
const realtimeImages = ref([
  {
    filename: 'health_check_001.jpg',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGY0ZjRmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuiIjOiHiOajgOa1izwvdGV4dD48L3N2Zz4=',
    timestamp: Date.now() - 300000
  },
  {
    filename: 'pulse_reading_002.jpg',
    url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMmE0ZDNhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuiEieiviumHh+a1izwvdGV4dD48L3N2Zz4=',
    timestamp: Date.now() - 180000
  }
])
const realtimeTexts = ref([
  {
    content: '最近感觉比较疲劳，睡眠质量不太好，想要调理一下身体',
    timestamp: Date.now() - 240000
  },
  {
    content: '平时工作压力大，经常熬夜，希望能有一些养生建议',
    timestamp: Date.now() - 120000
  }
])
const lastImageUpdate = ref('--:--:--')
const lastTextUpdate = ref('--:--:--')
const isAutoRefreshing = ref(true)



const healthProfile = ref({
  age: '28',
  gender: '女',
  constitution: '气虚体质',
  concerns: '睡眠质量、疲劳调理'
})

// 图片模态框相关
const showImageModal = ref(false)
const selectedImage = ref(null)
const currentImageIndex = ref(0)

// 定时器
let imageRefreshTimer = null
let textRefreshTimer = null

// 常量配置
const maxInputLength = 1000
const REFRESH_INTERVAL = 5000 // 5秒
const INITIAL_LOAD_MINUTES = 30 // 初始加载30分钟数据
const REALTIME_LOAD_MINUTES = 1 // 实时加载1分钟数据

// 计算属性
const canSubmit = computed(() => {
  return userInput.value.trim().length >= 5 && !isSubmitting.value
})

const submitButtonText = computed(() => {
  if (isSubmitting.value) return '分析中...'
  if (userInput.value.trim().length < 5) return '需求描述过短'
  return '开始智能分析'
})

// 排序后的实时语音文本 - 最新的在上面
const sortedRealtimeTexts = computed(() => {
  return [...realtimeTexts.value].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime()
    const timeB = new Date(b.timestamp).getTime()
    return timeB - timeA // 降序排列，最新的在前面
  })
})

// 方法
const goHome = () => {
  router.push('/')
}

const handleInputChange = () => {
  inputError.value = ''
}

const clearInputError = () => {
  inputError.value = ''
}

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

const formatImageTime = (timestamp) => {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN')
}

const formatTextTime = (timestamp) => {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN')
}

const formatTime = (date) => {
  return date.toLocaleTimeString('zh-CN')
}



const editProfile = () => {
  // 这里可以打开编辑对话框
  console.log('编辑健康档案')
}

// 初始数据加载
const loadInitialData = async () => {
  console.log('📥 开始加载初始数据...')

  try {
    // 加载最近30分钟的图片数据
    await loadImageData(INITIAL_LOAD_MINUTES, true)

    // 加载最近30分钟的语音文本数据
    await loadTextData(INITIAL_LOAD_MINUTES, true)

    console.log('✅ 初始数据加载完成')
  } catch (error) {
    console.error('❌ 初始数据加载失败:', error)
  }
}

// 启动自动刷新
const startAutoRefresh = () => {
  console.log('🔄 启动自动刷新机制')
  isAutoRefreshing.value = true

  imageRefreshTimer = setInterval(async () => {
    console.log('🔄 执行图片数据自动刷新...')
    await loadImageData(REALTIME_LOAD_MINUTES, false)
  }, REFRESH_INTERVAL)

  textRefreshTimer = setInterval(async () => {
    console.log('🔄 执行语音文本自动刷新...')
    await loadTextData(REALTIME_LOAD_MINUTES, false)
  }, REFRESH_INTERVAL)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  console.log('⏹️ 停止自动刷新机制')
  isAutoRefreshing.value = false

  if (imageRefreshTimer) {
    clearInterval(imageRefreshTimer)
    imageRefreshTimer = null
  }

  if (textRefreshTimer) {
    clearInterval(textRefreshTimer)
    textRefreshTimer = null
  }
}

// 获取图片数据
const loadImageData = async (minutes = 30, isInitial = false) => {
  try {
    console.log(`📸 加载所有图片数据...`)

    // 获取所有图片数据
    const imageDataResult = await getAllImageData()

    if (imageDataResult.success && imageDataResult.data) {
      const newImages = imageDataResult.data.map(photo => ({
        filename: photo.filename,
        url: photo.url,
        timestamp: photo.date || photo.timestamp || new Date().toISOString(),
        size: photo.size || photo.size_kb ? photo.size_kb * 1024 : 0
      }))

      if (isInitial) {
        // 初始加载：替换所有数据
        realtimeImages.value = newImages
        console.log(`✅ 初始加载完成，共${newImages.length}张图片`)
      } else {
        // 实时更新：检查是否有新图片
        const existingFilenames = new Set(realtimeImages.value.map(img => img.filename))
        const uniqueNewImages = newImages.filter(img => !existingFilenames.has(img.filename))

        if (uniqueNewImages.length > 0) {
          // 有新图片，更新整个列表
          realtimeImages.value = newImages
          console.log(`✅ 发现${uniqueNewImages.length}张新图片，已更新列表`)
        } else {
          console.log('📸 没有新图片')
        }
      }

      lastImageUpdate.value = new Date().toLocaleTimeString('zh-CN')
      console.log(`✅ 图片数据加载成功，当前共${realtimeImages.value.length}张图片`)
    }
  } catch (error) {
    console.error('❌ 图片数据加载失败:', error)

    if (isInitial) {
      // 提供模拟数据用于演示
      const now = new Date()
      realtimeImages.value = [
        {
          filename: 'health_check_001.jpg',
          url: '/api/placeholder/300/200',
          timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(), // 3分钟前
          size: 245760
        },
        {
          filename: 'pulse_reading_002.jpg',
          url: '/api/placeholder/300/200',
          timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(), // 1分钟前
          size: 189440
        }
      ]
      console.log('📸 使用模拟图片数据')
    }
  }
}

// 获取语音文本数据
const loadTextData = async (minutes = 30, isInitial = false) => {
  try {
    console.log(`🎤 开始获取最近${minutes}分钟的语音文本数据...`)

    // 构建API URL，添加minutes参数 - 使用录音代理
    const apiUrl = `/api-rec/asr/recent?minutes=${minutes}`

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`语音文本数据获取失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📥 语音文本API返回数据:', data)

    // 处理返回的数据
    let texts = data.texts || data.data || []

    // 如果data是对象且包含results数组，使用results
    if (texts && typeof texts === 'object' && texts.results && Array.isArray(texts.results)) {
      texts = texts.results
    }

    if (!Array.isArray(texts)) {
      console.warn('⚠️ 语音文本数据不是数组格式:', texts)
      if (isInitial) {
        realtimeTexts.value = []
      }
      return
    }

    const newTexts = texts.map(item => ({
      content: item.text || item.content || item,
      timestamp: item.timestamp || new Date().toISOString(),
      confidence: item.confidence || 1.0
    }))

    if (isInitial) {
      // 初始加载：替换所有数据
      realtimeTexts.value = newTexts
    } else {
      // 实时更新：追加新数据
      const existingTexts = new Set(realtimeTexts.value.map(t => t.content + t.timestamp))
      const uniqueNewTexts = newTexts.filter(t => !existingTexts.has(t.content + t.timestamp))

      if (uniqueNewTexts.length > 0) {
        realtimeTexts.value = [...uniqueNewTexts, ...realtimeTexts.value]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 100) // 最多保留100条文本
      }
    }

    lastTextUpdate.value = new Date().toLocaleTimeString('zh-CN')
    console.log(`✅ 语音文本数据加载成功，共${newTexts.length}条文本`)
  } catch (error) {
    console.error('❌ 语音文本数据加载失败:', error)

    if (isInitial) {
      // 提供模拟数据用于演示
      const now = new Date()
      realtimeTexts.value = [
        {
          content: '最近感觉比较疲劳，睡眠质量不太好，想要调理一下身体',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5分钟前
          confidence: 0.95
        },
        {
          content: '平时工作压力大，经常熬夜，希望能有一些养生建议',
          timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(), // 3分钟前
          confidence: 0.92
        }
      ]
      console.log('🎤 使用模拟语音文本数据')
    }
  }
}

// 图片模态框相关方法
const openImageModal = (image, index) => {
  selectedImage.value = image
  currentImageIndex.value = index
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = null
  currentImageIndex.value = 0
}

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    selectedImage.value = realtimeImages.value[currentImageIndex.value]
  }
}

const nextImage = () => {
  if (currentImageIndex.value < realtimeImages.value.length - 1) {
    currentImageIndex.value++
    selectedImage.value = realtimeImages.value[currentImageIndex.value]
  }
}

// 分析相关方法
const submitAnalysis = async () => {
  if (!canSubmit.value) return

  // 验证用户输入
  if (userInput.value.trim().length < 5) {
    inputError.value = '需求描述至少需要5个字符'
    return
  }

  try {
    // 重置状态
    progress.value = 0
    resultText.value = ''
    resultMetadata.value = null
    inputError.value = ''
    currentStep.value = 1

    // ===== 开发测试阶段：使用固定回复 =====
    // TODO: 后续可以通过配置开关来启用真实的AI分析功能
    console.log('🏥 使用固定回复模式进行智能养生分析')

    // 模拟加载过程
    isLoadingImageData.value = true
    progress.value = 10

    // 模拟获取图片数据的延迟
    await new Promise(resolve => setTimeout(resolve, 800))

    isLoadingImageData.value = false
    progress.value = 30
    currentStep.value = 2

    // 模拟分析过程
    isSubmitting.value = true
    progress.value = 40

    await new Promise(resolve => setTimeout(resolve, 1200))

    progress.value = 80

    // 第三步：展示固定分析结果
    console.log('第三步：展示固定养生分析结果...')
    currentStep.value = 3
    progress.value = 100

    // 固定回复内容
    const fixedReply = "你的舌苔状态真的很不错，颜色是那种非常健康的淡红色，红润均匀，整个舌面干净清爽，没有明显的厚腻或者裂纹，说明你的身体状态非常棒，脾胃功能也很强健，消化吸收都没问题！"

    // 立即展示文本结果
    resultText.value = fixedReply

    resultMetadata.value = {
      timestamp: new Date().toISOString(),
      processingTime: 2000, // 模拟处理时间
      imageCount: 1,
      textCount: realtimeTexts.value.length,
      timeRange: 1,
      mode: 'fixed_reply' // 标记为固定回复模式
    }

    console.log('✨ 固定养生回复展示完成:', fixedReply)
    console.log('🏥 智能养生固定回复完成！')

    // 并行执行语音合成和机器人动作，不阻塞UI显示
    const promises = []

    // 1. 异步调用语音合成
    promises.push(
      voiceApi.synthesizeText(fixedReply, {
        voice_id: 'zh-CN',
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        play_immediately: true
      }).then(ttsResult => {
        if (ttsResult && ttsResult.success) {
          console.log('✅ 固定养生回复语音合成成功')
        } else {
          console.warn('⚠️ 固定养生回复语音合成失败:', ttsResult?.message)
        }
      }).catch(ttsError => {
        console.error('❌ 固定养生回复语音合成错误:', ttsError.message)
        // TTS失败不影响主流程
      })
    )

    // 2. 异步执行机器人动作：连续执行两次"随机摆动"
    promises.push(
      (async () => {
        try {
          console.log('🤖 智能养生开始执行第一次动作：随机摆动')

          // 第一次动作执行
          const firstActionResult = await robotApi.executeAction('随机摆动', {
            duration: 3.0
          })

          if (firstActionResult && firstActionResult.success) {
            console.log('✅ 智能养生第一次机器人动作执行成功')
          } else {
            console.warn('⚠️ 智能养生第一次机器人动作执行失败:', firstActionResult?.message)
          }

          // 等待第一次动作完成后，执行第二次动作
          console.log('🤖 智能养生开始执行第二次动作：随机摆动')

          const secondActionResult = await robotApi.executeAction('随机摆动', {
            duration: 3.0
          })

          if (secondActionResult && secondActionResult.success) {
            console.log('✅ 智能养生第二次机器人动作执行成功')
            console.log('🎉 智能养生两次动作全部执行完成')
          } else {
            console.warn('⚠️ 智能养生第二次机器人动作执行失败:', secondActionResult?.message)
          }

        } catch (actionError) {
          console.error('❌ 智能养生机器人动作执行错误:', actionError.message)
          // 动作执行失败不影响主流程
        }
      })()
    )

    // 并行执行所有任务，不等待完成
    Promise.allSettled(promises).then(results => {
      console.log('🏥 智能养生语音和动作并行执行完成:', results)
    })

    /* ===== 真实AI分析代码（已保留，暂时注释） =====
    // 第一步：获取图片数据
    console.log('第一步：获取最近1张图片数据...')
    isLoadingImageData.value = true
    progress.value = 10

    const imageDataResult = await getRecentImagesByCount(1) // 获取最近1张图片

    if (!imageDataResult.success) {
      throw new Error(imageDataResult.message || '获取图片数据失败')
    }

    isLoadingImageData.value = false
    progress.value = 30
    currentStep.value = 2

    console.log('第一步完成，获取到图片数据:', imageDataResult.data)

    // 第二步：发送数据进行分析
    console.log('第二步：发送数据进行智能养生分析...')
    isSubmitting.value = true
    progress.value = 40

    // 提取图片URL列表用于分析
    const urlsForAnalysis = extractImageUrls(imageDataResult.data)

    if (urlsForAnalysis.length === 0) {
      throw new Error('未找到有效的图片数据进行分析')
    }

    // 构建养生专用的分析提示
    const healthPrompt = `请基于用户需求"${userInput.value.trim()}"，结合提供的图片内容，从养生健康的角度进行专业分析，并提供个性化的养生建议。请重点关注：
1. 饮食调理建议
2. 运动健身方案
3. 作息调整建议
4. 心理调节方法
5. 环境优化建议

请提供具体可行的养生方案。`

    const analysisResult = await analyzeImageData(urlsForAnalysis, healthPrompt)
    console.log('🔍 养生分析结果:', analysisResult)

    progress.value = 80

    if (!analysisResult.success) {
      console.error('❌ 养生分析失败:', analysisResult.message)
      throw new Error(analysisResult.message || '智能养生分析失败')
    }

    // 第三步：展示分析结果
    console.log('第三步：展示养生分析结果...')
    currentStep.value = 3
    progress.value = 100

    const formattedResult = formatAnalysisResult(analysisResult.data)
    console.log('✨ 格式化后的养生结果:', formattedResult)
    resultText.value = formattedResult

    resultMetadata.value = {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - Date.now(),
      imageCount: imageDataResult.data?.length || 0,
      textCount: realtimeTexts.value.length,
      timeRange: 1
    }

    console.log('智能养生分析完成！')
    ===== 真实AI分析代码结束 ===== */

  } catch (error) {
    console.error('智能养生分析失败:', error)
    inputError.value = error.message || '分析过程中发生错误，请重试'

    // 重置步骤状态
    currentStep.value = 1
  } finally {
    isSubmitting.value = false
    isLoadingImageData.value = false
  }
}



const resetForm = () => {
  userInput.value = ''
  resultText.value = ''
  resultMetadata.value = null
  inputError.value = ''
  progress.value = 0
  currentStep.value = 1
}

const saveDraft = () => {
  const draft = {
    content: userInput.value,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem('health_wellness_draft', JSON.stringify(draft))
  console.log('📝 养生需求草稿已保存')
}

const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(resultText.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 生命周期钩子
onMounted(async () => {
  console.log('🌿 智能养生页面已加载')

  // 初始化时间显示
  const now = new Date()
  lastImageUpdate.value = formatTime(now)
  lastTextUpdate.value = formatTime(now)

  // 初始加载数据
  await loadInitialData()

  // 启动自动刷新
  startAutoRefresh()

  // 加载草稿
  try {
    const savedDraft = localStorage.getItem('health_wellness_draft')
    if (savedDraft) {
      const draft = JSON.parse(savedDraft)
      userInput.value = draft.content || ''
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
  }
})

onUnmounted(() => {
  console.log('🌿 智能养生页面已卸载，清理定时器')
  stopAutoRefresh()
})
</script>

<style scoped>
/* 智能养生页面样式 - 参考多模态感知页面 */
.health-wellness-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #ffffff;
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
}

/* 顶部导航栏 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.3);
  padding: 12px 20px;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-back {
  background: rgba(0, 102, 255, 0.2);
  color: #66b3ff;
  border: 1px solid rgba(0, 102, 255, 0.3);
}

.btn-back:hover {
  background: rgba(0, 102, 255, 0.3);
  transform: translateY(-1px);
}

.title {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #00ccff 0%, #0099ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 153, 255, 0.3);
}

/* 主要内容区域 */
.main-content {
  display: flex;
  align-items: flex-start; /* 确保顶端对齐 */
  gap: 32px;
  max-width: 95%; /* 使用更大的宽度比例 */
  width: 100%;
  margin: 0 auto;
  padding: 90px 2.5% 20px; /* 增加顶部内边距，避免与标题栏重合 */
  /* 移除高度限制，让内容自然撑开 */
}

/* 左侧区域：实时数据展示 */
.left-section {
  flex: 1;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-self: flex-start; /* 确保从顶部开始 */
  margin-top: 0; /* 移除负边距，避免与标题栏重合 */
}

/* 右侧区域：智能分析模块 */
.right-section {
  flex: 1;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  gap: 4px; /* 极小间距，让分析结果紧贴需求描述 */
  align-self: flex-start; /* 确保从顶部开始 */
}

/* 面板样式 */
.image-display-panel, .text-display-panel, .input-section, .result-section {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 20, 40, 0.3) 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 102, 255, 0.4);
  box-shadow: 0 0 0 1px rgba(0, 102, 255, 0.2), 0 4px 16px rgba(0, 102, 255, 0.1);
  backdrop-filter: blur(10px);
}

.image-display-panel {
  flex: 1;
  min-height: 442px; /* 减少8px */
}

.text-display-panel {
  flex: 1;
  min-height: 452px; /* 增加10px高度 */
}

/* 面板标题样式 */
.panel-header, .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-title, .section-title {
  font-size: 18px;
  font-weight: 600;
  color: #66b3ff;
  margin: 0;
  text-shadow: 0 0 10px rgba(102, 179, 255, 0.3);
}

.update-info {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
}

.update-time {
  color: rgba(255, 255, 255, 0.6);
}

.auto-refresh-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.auto-refresh-indicator.active {
  background: rgba(0, 102, 255, 0.2);
  color: #66b3ff;
}

.indicator-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.auto-refresh-indicator.active .indicator-dot {
  background: #66b3ff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.char-counter {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(0, 102, 255, 0.2);
}

/* 输入区域样式 */
.input-section {
  margin-bottom: 0; /* 移除下边距，使用父容器的gap控制间距 */
  flex-shrink: 0;
  /* 移除固定高度，让内容自然撑开 */
}

.input-wrapper {
  margin-bottom: 20px;
}

.text-input {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  background: rgba(0, 20, 40, 0.3);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
  font-family: inherit;

  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏 Webkit 浏览器的滚动条 */
.text-input::-webkit-scrollbar {
  display: none;
}

.text-input:focus {
  outline: none;
  border-color: #66b3ff;
  box-shadow: 0 0 0 3px rgba(102, 179, 255, 0.1);
  background: rgba(0, 20, 40, 0.5);
}

.text-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.text-input.input-error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* 按钮组样式 */
.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.submit-btn, .draft-btn, .reset-btn, .copy-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
}

.submit-btn {
  background: linear-gradient(135deg, #0066ff 0%, #0052cc 100%);
  color: white;
  flex: 1;
  min-width: 140px;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0052cc 0%, #003d99 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
}

.submit-btn:disabled {
  background: rgba(0, 102, 255, 0.3);
  cursor: not-allowed;
  transform: none;
}

/* 美化加载状态的按钮 */
.submit-btn.loading {
  background: linear-gradient(135deg, #0066ff 0%, #00ccff 50%, #0066ff 100%);
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite, pulse 2s ease-in-out infinite;
  cursor: wait;
  box-shadow: 0 4px 20px rgba(0, 102, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(0, 204, 255, 0.5);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 20px rgba(0, 102, 255, 0.4); }
  50% { transform: scale(1.02); box-shadow: 0 6px 25px rgba(0, 204, 255, 0.6); }
}

.draft-btn {
  background: rgba(255, 193, 7, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.draft-btn:hover:not(:disabled) {
  background: rgba(255, 193, 7, 0.3);
  transform: translateY(-1px);
}

.reset-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.copy-btn {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 8px 16px;
  font-size: 12px;
  min-height: 32px;
}

.copy-btn:hover {
  background: rgba(59, 130, 246, 0.3);
  transform: translateY(-1px);
}

.copy-btn.copied {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.3);
}

/* 美化按钮内的加载旋转器 */
.submit-btn .loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid #ffffff;
  border-right: 2px solid #00ccff;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 美化按钮内的加载文本 */
.submit-btn .loading-text {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  animation: textGlow 2s ease-in-out infinite;
}

@keyframes textGlow {
  0%, 100% { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); }
  50% { text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(0, 204, 255, 0.4); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 结果区域样式 */
.result-section {
  flex: 0 0 625px !important; /* 固定尺寸，增加25px */
  display: flex;
  flex-direction: column;
  height: 625px !important; /* 强制应用高度，增加25px */
  min-height: 625px !important; /* 最小高度，增加25px */
  max-height: 625px !important; /* 最大高度，增加25px */
}

.result-actions {
  display: flex;
  gap: 8px;
}

/* 分析步骤指示器 */
.analysis-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 0 20px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.step.active {
  opacity: 1;
}

.step.completed {
  opacity: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: rgba(0, 102, 255, 0.2);
  border-color: #66b3ff;
  color: #66b3ff;
}

.step.completed .step-number {
  background: #66b3ff;
  border-color: #66b3ff;
  color: white;
}

.step-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.step.active .step-text {
  color: #66b3ff;
}

.step.completed .step-text {
  color: #66b3ff;
}

/* 结果区域样式 */
.result-wrapper {
  height: 565px !important; /* 增加25px高度 */
  flex: 1;
  overflow: hidden; /* 防止内容溢出 */
}

.result-placeholder, .result-loading, .result-content {
  padding: 24px;
  border-radius: 12px;
  background: rgba(0, 20, 40, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.2);
  height: 100%; /* 填满父容器 */
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* 添加垂直滚动条 */
}

.result-placeholder {
  text-align: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
}

.placeholder-steps {
  text-align: center; /* 改为居中 */
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.6;
}

.placeholder-steps p {
  margin: 8px 0;
}

.result-loading {
  justify-content: center;
  align-items: center;
}

.loading-container {
  text-align: center;
}

.loading-animation {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 102, 255, 0.3);
  border-top: 3px solid #66b3ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  font-size: 16px;
  color: #66b3ff;
  margin-bottom: 20px;
}

.loading-progress {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #66b3ff 0%, #0066ff 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

/* 结果内容样式 */
.result-content {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 32px;
  border: 1px solid rgba(16, 185, 129, 0.2);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 525px; /* 增加25px高度 */
  overflow: hidden; /* 防止内容溢出 */
}

.result-text {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  text-align: left; /* 文本左对齐 */
  overflow-y: auto; /* 允许垂直滚动 */
  padding-right: 8px; /* 为滚动条留出空间 */

  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏 Webkit 浏览器的滚动条 */
.result-text::-webkit-scrollbar {
  display: none;
}

.result-metadata {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.metadata-label {
  color: rgba(255, 255, 255, 0.6);
}

.metadata-value {
  color: #66b3ff;
  font-weight: 500;
}

/* 数据展示区域样式 */
.image-content {
  height: 400px;
  max-height: 400px;
  overflow-y: auto;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.image-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.image-item:hover {
  transform: translateY(-2px);
  border-color: #66b3ff;
  box-shadow: 0 4px 12px rgba(102, 179, 255, 0.2);
}

.image-thumbnail {
  width: 100%;
  height: 80px;
  object-fit: cover;
  display: block;
}

.image-info {
  padding: 8px;
}

.image-filename {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-images, .empty-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-message {
  font-size: 14px;
}

/* 文本展示区域 */
.text-content {
  height: 415px; /* 统一使用增加后的高度 */
  max-height: 415px;
  overflow-y: auto;
}

.text-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.text-item:hover {
  border-color: #66b3ff;
  background: rgba(102, 179, 255, 0.05);
}

.text-timestamp {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.text-content-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  word-wrap: break-word;
}

/* 图片模态框 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(10px);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: rgba(10, 10, 10, 0.95);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 102, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 16px;
}

.modal-info {
  text-align: center;
  margin-bottom: 20px;
}

.modal-info h3 {
  color: #66b3ff;
  margin: 0 0 8px 0;
  font-size: 16px;
}

.modal-info p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 14px;
}

.modal-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  padding: 8px 16px;
  background: rgba(0, 102, 255, 0.2);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 8px;
  color: #66b3ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(0, 102, 255, 0.3);
  transform: translateY(-1px);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

/* 删除重复的图片展示区域样式，使用上面的统一定义 */

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.image-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.image-item:hover {
  transform: translateY(-2px);
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.image-thumbnail {
  width: 100%;
  height: 80px;
  object-fit: cover;
  display: block;
}

.image-info {
  padding: 8px;
}

.image-filename {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-images, .empty-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-message {
  font-size: 14px;
}

/* 文本展示区域 */
.text-content {
  height: 415px; /* 增加15px高度 */
  max-height: 415px;
  overflow-y: auto;
}

.text-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.text-item:hover {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.text-timestamp {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.text-content-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  word-wrap: break-word;
}

/* 滚动条样式 */
.image-content::-webkit-scrollbar,
.text-content::-webkit-scrollbar {
  width: 6px;
}

.image-content::-webkit-scrollbar-track,
.text-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.image-content::-webkit-scrollbar-thumb,
.text-content::-webkit-scrollbar-thumb {
  background: rgba(0, 153, 255, 0.5);
  border-radius: 3px;
}

.image-content::-webkit-scrollbar-thumb:hover,
.text-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 153, 255, 0.7);
}

/* 图片模态框 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(10px);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: rgba(10, 10, 10, 0.95);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 102, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 16px;
}

.modal-info {
  text-align: center;
  margin-bottom: 20px;
}

.modal-info h3 {
  color: #66b3ff;
  margin: 0 0 8px 0;
  font-size: 16px;
}

.modal-info p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 14px;
}

.modal-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  padding: 8px 16px;
  background: rgba(0, 102, 255, 0.2);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 8px;
  color: #66b3ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(0, 102, 255, 0.3);
  transform: translateY(-1px);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}



/* 健康档案样式 */
.health-profile-section {
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 102, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.health-profile-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.edit-profile-btn {
  padding: 6px 12px;
  background: rgba(0, 102, 255, 0.2);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 6px;
  color: #66b3ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
}

.edit-profile-btn:hover {
  background: rgba(0, 102, 255, 0.3);
  transform: translateY(-1px);
}

.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.profile-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 30, 60, 0.4);
  border: 1px solid rgba(0, 102, 255, 0.1);
  border-radius: 6px;
}

.profile-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.profile-value {
  color: #66b3ff;
  font-size: 12px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .main-content {
    max-width: 98%;
    padding: 80px 1% 20px;
  }
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    max-width: 95%;
    padding: 80px 2.5% 20px;
  }

  .left-section, .right-section {
    max-width: 100%;
  }

  .right-section {
    flex-direction: row;
    gap: 20px;
    transform: none;
  }

  .image-display-panel, .text-display-panel {
    flex: 1;
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .nav-section {
    padding: 12px 16px;
  }

  .main-content {
    padding: 80px 16px 16px;
    gap: 20px;
  }

  .right-section {
    flex-direction: column;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .button-group {
    flex-direction: column;
  }

  .submit-btn, .draft-btn, .reset-btn {
    width: 100%;
  }
}
</style>
