<template>
  <div class="multimodal-perception-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goHome">← 返回主页</button>
        <h1 class="title">多模态感知中心</h1>
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
              placeholder="请输入您想要描述的内容或想法..."
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

          <!-- 步骤指示器 -->
          <div class="step-indicator" v-if="isSubmitting || isLoadingImageData || resultText">
            <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
              <div class="step-number">1</div>
              <div class="step-text">获取数据</div>
            </div>
            <div class="step-divider"></div>
            <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
              <div class="step-number">2</div>
              <div class="step-text">智能分析</div>
            </div>
            <div class="step-divider"></div>
            <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
              <div class="step-number">3</div>
              <div class="step-text">展示结果</div>
            </div>
          </div>

          <div class="result-wrapper">
            <div v-if="!resultText && !isSubmitting && !isLoadingImageData" class="result-placeholder">
              <div class="placeholder-icon">🤖</div>
              <div class="placeholder-text">多模态智能分析结果将在这里显示</div>
              <div class="placeholder-steps">
                <p>分析流程：</p>
                <p>1️⃣ 获取实时图片和语音数据</p>
                <p>2️⃣ 结合需求描述进行智能分析</p>
                <p>3️⃣ 展示个性化分析结果</p>
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
                  <span class="metadata-label">数据类型:</span>
                  <span class="metadata-value">图片+语音</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">时间范围:</span>
                  <span class="metadata-value">{{ resultMetadata.timeRange }}分钟</span>
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
        <button class="modal-close" @click="closeImageModal">×</button>
        <img :src="selectedImage.url" :alt="selectedImage.filename" class="modal-image" />
        <div class="modal-info">
          <div class="modal-filename">{{ selectedImage.filename }}</div>
          <div class="modal-timestamp">{{ formatImageTime(selectedImage.timestamp) }}</div>
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
import { recordingApi } from '../api/recordingApi'

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
const realtimeImages = ref([])
const realtimeTexts = ref([])
const lastImageUpdate = ref('--:--:--')
const lastTextUpdate = ref('--:--:--')
const isAutoRefreshing = ref(false)

// 页面加载时生成的固定时间戳（当前时间前一分钟）
const pageLoadTimestamp = new Date(Date.now() - 1 * 60 * 1000).toISOString()

// 图片模态框相关
const showImageModal = ref(false)
const selectedImage = ref({})



// 定时器
let refreshTimer = null

// 常量配置
const maxInputLength = 1000
const REFRESH_INTERVAL = 5000 // 5秒
const INITIAL_LOAD_MINUTES = 30 // 初始加载30分钟数据
const REALTIME_LOAD_MINUTES = 1 // 实时加载1分钟数据

// 计算属性
const canSubmit = computed(() => {
  return userInput.value.trim().length >= 5 && !isSubmitting.value && !isLoadingImageData.value
})

const submitButtonText = computed(() => {
  if (isLoadingImageData.value) return '获取图片数据中...'
  if (isSubmitting.value) return '分析中...'
  if (!userInput.value.trim()) return '请输入需求描述'
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

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
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

// 页面初始化时加载数据
onMounted(async () => {
  console.log('🎯 MultimodalPerceptionView 组件已挂载')

  // 初始加载数据
  await loadInitialData()

  // 启动自动刷新
  startAutoRefresh()
})

// 页面卸载时清理定时器
onUnmounted(() => {
  console.log('🔄 MultimodalPerceptionView 组件卸载，清理定时器')
  stopAutoRefresh()
})

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

// 加载图片数据
const loadImageData = async (minutes, isInitial = false) => {
  try {
    console.log(`📷 加载所有图片数据...`)

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

    // 如果是初始加载失败，设置空数组
    if (isInitial) {
      realtimeImages.value = []
    }
  }
}

// 加载语音文本数据
const loadTextData = async (minutes, isInitial = false) => {
  try {
    console.log(`🎤 加载最近${minutes}分钟的语音文本数据...`)

    // 注释掉API调用，使用虚拟测试数据
    // const data = await recordingApi.getRecentRecords(minutes)
    // console.log('📥 语音文本API返回数据:', data)

    // // 处理返回的数据
    // let texts = data.texts || data.data || []

    // // 如果data是对象且包含results数组，使用results
    // if (texts && typeof texts === 'object' && texts.results && Array.isArray(texts.results)) {
    //   texts = texts.results
    // }

    // if (!Array.isArray(texts)) {
    //   console.warn('⚠️ 语音文本数据不是数组格式:', texts)
    //   if (isInitial) {
    //     realtimeTexts.value = []
    //   }
    //   return
    // }

    // const newTexts = texts.map(item => ({
    //   content: item.text || item.content || item,
    //   timestamp: item.timestamp || new Date().toISOString(),
    //   confidence: item.confidence || 1.0
    // }))

    // 使用虚拟测试数据 - 使用页面加载时间戳避免重复
    const newTexts = [
      {
        content: '小海，你还记得这样照片是什么时候拍的吗？',
        timestamp: pageLoadTimestamp,
        confidence: 0.98
      }
    ]

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
      // 提供模拟数据用于演示 - 使用页面加载时间戳避免重复
      realtimeTexts.value = [
        {
          content: '小海，你还记得这张照片是什么时候拍的吗？',
          timestamp: pageLoadTimestamp,
          confidence: 0.98
        }
      ]
      console.log('🎤 使用模拟语音文本数据')
    }
  }
}

// 启动自动刷新
const startAutoRefresh = () => {
  console.log('🔄 启动自动刷新机制')
  isAutoRefreshing.value = true

  refreshTimer = setInterval(async () => {
    console.log('🔄 执行自动刷新...')

    // 获取最近1分钟的新数据
    await Promise.all([
      loadImageData(REALTIME_LOAD_MINUTES, false),
      loadTextData(REALTIME_LOAD_MINUTES, false)
    ])
  }, REFRESH_INTERVAL)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  console.log('⏹️ 停止自动刷新机制')
  isAutoRefreshing.value = false

  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 智能分析相关方法
const submitAnalysis = async () => {
  if (!canSubmit.value) return

  // 验证用户输入
  if (userInput.value.trim().length < 5) {
    inputError.value = '需求描述至少需要5个字符'
    return
  }

  try {
    // 重置状态 - 确保完全清空之前的结果
    progress.value = 0
    resultText.value = ''
    resultMetadata.value = null
    inputError.value = ''
    currentStep.value = 1
    isSubmitting.value = false
    isLoadingImageData.value = false

    // ===== 开发测试阶段：使用固定回复 =====
    // TODO: 后续可以通过配置开关来启用真实的AI分析功能
    console.log('🎭 使用固定回复模式进行多模态感知分析')

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
    console.log('第三步：展示固定分析结果...')
    currentStep.value = 3
    progress.value = 100

    // 固定回复内容
    const fixedReply = "这是去年您过生日照的，我特别记得给您戴生日帽的时候，您像个老小孩似的笑着吵着，说要给我唱段拿手的京剧，那股子认真又可爱的劲儿，现在想起来还觉得特别温暖，一点都没忘。"

    // 确保清空后再设置新的结果
    resultText.value = ''
    await new Promise(resolve => setTimeout(resolve, 100)) // 短暂延迟确保清空生效
    resultText.value = fixedReply

    resultMetadata.value = {
      timestamp: new Date().toISOString(),
      processingTime: 2000, // 模拟处理时间
      imageCount: 1,
      timeRange: 1,
      mode: 'fixed_reply' // 标记为固定回复模式
    }

    console.log('✨ 固定回复展示完成:', fixedReply)
    console.log('🎭 多模态感知固定回复完成！')

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
          console.log('✅ 固定回复语音合成成功')
        } else {
          console.warn('⚠️ 固定回复语音合成失败:', ttsResult?.message)
        }
      }).catch(ttsError => {
        console.error('❌ 固定回复语音合成错误:', ttsError.message)
        // TTS失败不影响主流程
      })
    )

    // 2. 异步执行机器人动作：连续执行两次"说话自然摆动1"
    promises.push(
      (async () => {
        try {
          console.log('🤖 多模态感知开始执行第一次动作：说话自然摆动1')

          // 第一次动作执行
          const firstActionResult = await robotApi.executeAction('说话自然摆动1', {
            duration: 3.0
          })

          if (firstActionResult && firstActionResult.success) {
            console.log('✅ 多模态感知第一次机器人动作执行成功')
          } else {
            console.warn('⚠️ 多模态感知第一次机器人动作执行失败:', firstActionResult?.message)
          }

          // 等待第一次动作完成后，执行第二次动作
          console.log('🤖 多模态感知开始执行第二次动作：说话自然摆动1')

          const secondActionResult = await robotApi.executeAction('说话自然摆动1', {
            duration: 3.0
          })

          if (secondActionResult && secondActionResult.success) {
            console.log('✅ 多模态感知第二次机器人动作执行成功')
            console.log('🎉 多模态感知两次动作全部执行完成')
          } else {
            console.warn('⚠️ 多模态感知第二次机器人动作执行失败:', secondActionResult?.message)
          }

        } catch (actionError) {
          console.error('❌ 多模态感知机器人动作执行错误:', actionError.message)
          // 动作执行失败不影响主流程
        }
      })()
    )

    // 并行执行所有任务，不等待完成
    Promise.allSettled(promises).then(results => {
      console.log('🎭 多模态感知语音和动作并行执行完成:', results)
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
    console.log('第二步：发送数据进行智能分析...')
    isSubmitting.value = true
    progress.value = 40

    // 提取图片URL列表用于分析
    const urlsForAnalysis = extractImageUrls(imageDataResult.data)

    if (urlsForAnalysis.length === 0) {
      throw new Error('未找到有效的图片数据进行分析')
    }

    const analysisResult = await analyzeImageData(urlsForAnalysis, userInput.value.trim())
    console.log('🔍 分析结果:', analysisResult)

    progress.value = 80

    if (!analysisResult.success) {
      console.error('❌ 分析失败:', analysisResult.message)
      throw new Error(analysisResult.message || '智能分析失败')
    }

    // 第三步：展示分析结果
    console.log('第三步：展示分析结果...')
    currentStep.value = 3
    progress.value = 100

    const formattedResult = formatAnalysisResult(analysisResult.data)
    console.log('✨ 格式化后的结果:', formattedResult)
    resultText.value = formattedResult

    resultMetadata.value = {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - Date.now(),
      imageCount: imageDataResult.data?.length || 0,
      timeRange: 1
    }

    console.log('智能图片分析完成！')
    ===== 真实AI分析代码结束 ===== */

  } catch (error) {
    console.error('多模态感知分析失败:', error)
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

// 新增方法
const saveDraft = () => {
  // 保存草稿功能
  const draft = {
    content: userInput.value,
    timestamp: new Date().toISOString(),
    timeRange: analysisTimeRange.value
  }
  localStorage.setItem('multimodal_draft', JSON.stringify(draft))
  console.log('📝 草稿已保存')
}

const clearInputError = () => {
  inputError.value = ''
}



const copyResult = async () => {
  if (!resultText.value) return

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

// 图片模态框相关方法
const openImageModal = (image, index) => {
  selectedImage.value = image
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = {}
}
</script>

<style scoped>
/* 多模态感知页面样式 */
.multimodal-perception-container {
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
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 153, 255, 0.3);
  padding: 12px 20px;
}

.nav-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.btn-back {
  background: linear-gradient(135deg, rgba(0, 153, 255, 0.2), rgba(0, 102, 204, 0.3));
  border: 1px solid rgba(0, 153, 255, 0.4);
  color: #00ccff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.btn-back:hover {
  background: linear-gradient(135deg, rgba(0, 153, 255, 0.3), rgba(0, 102, 204, 0.4));
  transform: translateY(-1px);
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00ccff;
  text-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
  margin: 0;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  gap: 24px;
  padding: 85px 20px 20px;
  min-height: calc(100vh - 85px);
}

/* 左侧区域：实时数据展示 */
.left-section {
  flex: 1;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 0; /* 移除负边距，避免与标题栏重合 */
}

/* 输入区域样式 */
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
}

.text-input:focus {
  outline: none;
  border-color: rgba(0, 102, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.2);
  background: rgba(0, 20, 40, 0.4);
}

.text-input.input-error {
  border-color: #ff6b6b;
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
}

.text-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.error-message {
  color: #ff6b6b;
  font-size: 12px;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 8px;
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
  background: linear-gradient(135deg, #0066ff 0%, #004db3 100%);
  color: white;
  flex: 1;
  min-width: 140px;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0052cc 0%, #003d8a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
}

.submit-btn:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
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
  color: #ffc107;
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
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
  padding: 8px 16px;
  font-size: 12px;
}

.copy-btn:hover {
  background: rgba(40, 167, 69, 0.3);
}

.copy-btn.copied {
  background: rgba(40, 167, 69, 0.4);
  color: #20c997;
}

/* 步骤指示器样式 */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
  padding: 16px;
  background: rgba(0, 20, 40, 0.3);
  border-radius: 12px;
  border: 1px solid rgba(0, 102, 255, 0.2);
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
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
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: linear-gradient(135deg, #0066ff 0%, #004db3 100%);
  border-color: #0066ff;
  color: white;
  box-shadow: 0 0 12px rgba(0, 102, 255, 0.4);
}

.step.completed .step-number {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-color: #28a745;
  color: white;
}

.step-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  transition: all 0.3s ease;
}

.step.active .step-text {
  color: #4da6ff;
  font-weight: 500;
}

.step.completed .step-text {
  color: #28a745;
  font-weight: 500;
}

.step-divider {
  width: 40px;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 16px;
  position: relative;
  top: -16px;
}

/* 结果区域样式 */
.result-wrapper {
  height: 425px; /* 增加25px高度 */
  max-height: 425px; /* 增加25px高度 */
  overflow-y: auto;
}

.result-placeholder, .result-loading, .result-content {
  padding: 24px;
  border-radius: 12px;
  background: rgba(0, 20, 40, 0.2);
  border: 1px solid rgba(0, 102, 255, 0.2);
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.placeholder-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 16px;
}

.placeholder-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 16px;
}

.placeholder-steps {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.placeholder-steps p {
  margin: 8px 0;
}





.panel-header {
  margin-bottom: 20px;
}

.panel-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #4da6ff;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 102, 255, 0.3);
}

/* 输入区域样式 */
.input-section {
  margin-bottom: 24px;
  flex-shrink: 0;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.input-header h3 {
  font-size: 1.1rem;
  color: #4da6ff;
  margin: 0;
}

.char-count {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

.input-wrapper {
  position: relative;
  margin-bottom: 15px;
}

.input-textarea {
  width: 100%;
  min-height: 180px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 8px;
  padding: 20px;
  color: #ffffff;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  transition: all 0.3s ease;
}

.input-textarea:focus {
  outline: none;
  border-color: rgba(0, 153, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(0, 153, 255, 0.2);
}

.input-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.error-message {
  color: #ff6b6b;
  font-size: 0.85rem;
  margin-top: 5px;
  padding: 8px 12px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 6px;
}

.button-group {
  display: flex;
  gap: 12px;
}

.submit-btn, .reset-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-btn {
  background: linear-gradient(135deg, #00ccff, #0099ff);
  color: #ffffff;
  flex: 1;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #00b8e6, #0088cc);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 204, 255, 0.3);
}

.submit-btn:disabled {
  background: rgba(0, 153, 255, 0.3);
  cursor: not-allowed;
  transform: none;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
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

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 结果区域样式 */
.result-section {
  height: 525px; /* 增加25px高度 */
  max-height: 525px; /* 增加25px高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.result-header h3 {
  font-size: 1.1rem;
  color: #4da6ff;
  margin: 0;
}

.copy-btn {
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.4);
  color: #00ccff;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  background: rgba(0, 153, 255, 0.3);
}

/* 进度步骤指示器 */
.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  position: relative;
}

.progress-steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: linear-gradient(135deg, #00ccff, #0099ff);
  border-color: #00ccff;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.4);
}

.step.completed .step-number {
  background: linear-gradient(135deg, #00ff88, #00cc66);
  border-color: #00ff88;
  color: #ffffff;
}

.step-label {
  margin-top: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.step.active .step-label {
  color: #00ccff;
  font-weight: 600;
}

.step.completed .step-label {
  color: #00ff88;
}

/* 结果内容样式 */
.result-content {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 32px;
  border: 1px solid rgba(0, 153, 255, 0.2);
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.loading-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-icon {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(0, 204, 255, 0.3);
  border-top: 4px solid #00ccff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-message {
  font-size: 1.1rem;
  color: #4da6ff;
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ccff, #0099ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

.analysis-result {
  padding: 20px 0;
}

.result-text {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #ffffff;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.result-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.metadata-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.metadata-value {
  font-size: 0.85rem;
  color: #4da6ff;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.empty-message {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 15px;
}

.empty-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.empty-description p {
  margin: 5px 0;
}

/* 右侧区域：智能分析模块 */
.right-section {
  flex: 1;
  max-width: 50%;
  display: flex;
  flex-direction: column;
  gap: 8px; /* 最小化间距，让分析结果紧贴需求描述 */
  margin-top: -30px !important; /* 上移30px，优化位置 */
}

/* 通用section样式 */
.input-section, .result-section {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 20, 40, 0.3) 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 102, 255, 0.4);
  box-shadow: 0 0 0 1px rgba(0, 102, 255, 0.2), 0 4px 16px rgba(0, 102, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* section标题样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #4da6ff;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 102, 255, 0.3);
}

/* 字符计数器 */
.char-counter {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 102, 255, 0.1);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(0, 102, 255, 0.2);
}

.image-display-panel, .text-display-panel {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 20, 40, 0.3) 100%);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid rgba(0, 102, 255, 0.4);
  box-shadow: 0 0 0 1px rgba(0, 102, 255, 0.2), 0 4px 16px rgba(0, 102, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
}

.image-display-panel {
  flex: 1;
  min-height: 350px;
}

.text-display-panel {
  flex: 1;
  min-height: 360px; /* 增加10px高度 */
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.panel-header h3 {
  font-size: 1.1rem;
  color: #4da6ff;
  margin: 0;
}

.update-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.update-time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.auto-refresh-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.auto-refresh-indicator.active {
  color: #00ff88;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.auto-refresh-indicator.active .indicator-dot {
  background: #00ff88;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 图片展示区域 */
.image-content {
  height: 320px;
  max-height: 320px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(0, 153, 255, 0.2);
  padding: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.image-item:hover {
  border-color: rgba(0, 153, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 153, 255, 0.2);
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
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-time {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.5);
}

.empty-images {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
}

.empty-images .empty-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.empty-images .empty-message {
  font-size: 0.9rem;
}

/* 文本展示区域 */
.text-content {
  height: 335px; /* 增加15px高度 */
  max-height: 335px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(0, 153, 255, 0.2);
  padding: 20px;
}

.text-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.text-item {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.text-item:hover {
  border-color: rgba(0, 153, 255, 0.3);
  background: rgba(0, 0, 0, 0.4);
}

.text-timestamp {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 5px;
}

.text-content-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
}

.empty-texts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
}

.empty-texts .empty-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.empty-texts .empty-message {
  font-size: 0.9rem;
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
  backdrop-filter: blur(5px);
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(0, 153, 255, 0.3);
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1;
  transition: color 0.3s ease;
}

.modal-close:hover {
  color: #ff6b6b;
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.modal-info {
  margin-top: 15px;
  text-align: center;
}

.modal-filename {
  font-size: 1rem;
  color: #4da6ff;
  margin-bottom: 5px;
}

.modal-timestamp {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }

  .left-section, .right-section {
    max-width: 100%;
  }

  .right-section {
    flex-direction: row;
    gap: 20px;
    margin-top: -30px; /* 上移30px，优化位置 */
  }

  .image-display-panel, .text-display-panel {
    flex: 1;
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 90px 10px 10px;
  }

  .right-section {
    flex-direction: column;
    margin-top: -30px; /* 上移30px，优化位置 */
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  .title {
    font-size: 1.2rem;
  }

  .panel-title {
    font-size: 1.1rem;
  }
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
</style>
