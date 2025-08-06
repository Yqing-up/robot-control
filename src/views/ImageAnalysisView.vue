<template>
  <div class="photo-upload-control">
    <!-- 页面标题 -->
    <header class="page-header">
      <button class="btn btn-back" @click="goBack">← 返回</button>
      <h1 class="page-title">智能图片分析</h1>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-container">
      <!-- 左侧列 -->
      <div class="left-column">
        <!-- 用户输入区域 -->
        <section class="input-section">
          <div class="section-header">
            <h2 class="section-title">需求描述</h2>
            <div class="char-counter">{{ userInput.length }}/{{ maxInputLength }}</div>
          </div>
          <div class="input-wrapper">
            <textarea
              v-model="userInput"
              :maxlength="maxInputLength"
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
              @click="submitData"
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

        <!-- 结果显示区域 -->
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
              <div class="step-text">获取图片数据</div>
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
              <div class="placeholder-icon">📷</div>
              <div class="placeholder-text">智能图片分析结果将在这里显示</div>
              <div class="placeholder-steps">
                <p>分析流程：</p>
                <p>1️⃣ 根据时间范围获取图片数据</p>
                <p>2️⃣ 结合需求描述进行智能分析</p>
                <p>3️⃣ 展示个性化分析结果</p>
              </div>
            </div>
            <div v-else-if="isSubmitting || isLoadingImageData" class="result-loading">
              <div class="loading-container">
                <div class="loading-animation"></div>
                <div class="loading-text">
                  <span v-if="isLoadingImageData">正在获取图片数据...</span>
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
                  <span class="metadata-value">{{ resultMetadata.imageCount || 0 }}张</span>
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

      <!-- 右侧列 -->
      <div class="right-column">
        <!-- 时间参数控制区域 -->
        <section class="time-control-section">
          <div class="section-header">
            <h2 class="section-title">采集照片时间范围</h2>
            <div class="time-display">{{ uploadDuration }} 分钟</div>
          </div>
          <div class="time-control-wrapper">
            <div class="time-slider-container">
              <span class="time-label">{{ minDuration }}</span>
              <input
                type="range"
                v-model="uploadDuration"
                :min="minDuration"
                :max="maxDuration"
                :step="durationStep"
                class="time-slider"
                @input="handleTimeChange"
              />
              <span class="time-label">{{ maxDuration }}</span>
            </div>
            <div class="time-presets">
              <button
                v-for="preset in timePresets"
                :key="preset.value"
                @click="setTimePreset(preset.value)"
                class="preset-btn"
                :class="{ active: uploadDuration === preset.value }"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>
        </section>

        <!-- 图片展示区域 -->
        <section class="image-display-section">
          <div class="section-header">
            <h2 class="section-title">图片展示</h2>
            <div class="image-data-status" v-if="isLoadingImageData">
              <span class="loading-indicator">🔄</span>
              <span>获取图片数据中...</span>
            </div>

          </div>
          <div class="image-display-wrapper">
            <div class="image-display-inner-wrapper">
              <!-- 图片数据信息框已隐藏，只显示图片 -->

              <!-- 显示获取到的图片 -->
              <div v-if="imageUrls.length > 0" class="current-images">
                <div class="current-images-header">
                  <h4>当前获取的图片 ({{ imageUrls.length }}张)</h4>
                </div>
                <div class="current-images-gallery">
                  <div
                    v-for="(url, index) in imageUrls"
                    :key="index"
                    class="current-image-item"
                    @click="openImageModal({
                      imageUrl: url,
                      imageTitle: `当前图片${index + 1}`,
                      timestamp: currentImages[index]?.date || new Date().toISOString(),
                      input: userInput
                    }, index)"
                  >
                    <div class="current-image-container">
                      <img :src="url" :alt="`当前图片${index + 1}`" class="current-image" />
                      <div class="current-image-overlay">
                        <span class="current-image-index">{{ index + 1 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 占位符 -->
              <div v-if="imageUrls.length === 0 && !imageDataText" class="image-placeholder">
                <div class="placeholder-icon">📷</div>
                <div class="placeholder-text">选择时间范围并点击"开始智能分析"获取图片数据</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 图片放大模态框 -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeImageModal">×</button>
        <div class="modal-image-container">
          <img :src="selectedImage.imageUrl" :alt="selectedImage.imageTitle" class="modal-image" />
        </div>
        <div class="modal-info">
          <div class="modal-details">
            <div class="detail-item">
              <span class="detail-label">拍摄时间:</span>
              <span class="detail-value">{{ formatTimestamp(selectedImage.timestamp) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">分析需求:</span>
              <span class="detail-value">{{ selectedImage.input }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getRecentImageData,
  analyzeImageData,
  validateInput,
  formatImageDataForDisplay,
  formatAnalysisResult,
  getTimeRangeOptions,
  extractImageUrls
} from '../api/imageAnalysis.js'

const router = useRouter()

// 响应式数据
const userInput = ref('')
const uploadDuration = ref(5)
const isSubmitting = ref(false)
const isLoadingImageData = ref(false)
const resultText = ref('')
const imageDataText = ref('')
const imageUrls = ref([])
const currentImages = ref([]) // 存储完整的图片数据（包含时间戳等信息）
const resultMetadata = ref(null)
const progress = ref(0)
const inputError = ref('')
const copySuccess = ref(false)

const currentStep = ref(1) // 当前步骤：1-获取图片数据，2-分析数据，3-显示结果

// 图片模态框相关状态
const showImageModal = ref(false)
const selectedImage = ref({})
const selectedImageIndex = ref(-1)

// 常量配置
const maxInputLength = 1000
const minDuration = 1
const maxDuration = 60
const durationStep = 1

// 时间预设选项 - 使用API提供的选项
const timePresets = getTimeRangeOptions()

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

// 方法
const goBack = () => {
  router.push('/vision-system')
}

const handleInputChange = () => {
  clearInputError()
  saveDraft()
}

const handleTimeChange = () => {
  saveDraft()
}

const clearInputError = () => {
  inputError.value = ''
}

const setTimePreset = (value) => {
  uploadDuration.value = value
  saveDraft()
}

const submitData = async () => {
  if (!canSubmit.value) return

  // 验证用户输入
  const validation = validateInput(userInput.value.trim(), uploadDuration.value)
  if (!validation.isValid) {
    inputError.value = validation.errors.join(', ')
    return
  }

  try {
    // 重置状态
    progress.value = 0
    resultText.value = ''
    imageDataText.value = ''
    imageUrls.value = []
    currentImages.value = []
    resultMetadata.value = null
    inputError.value = ''
    currentStep.value = 1

    // 第一步：获取图片数据
    console.log('第一步：获取图片数据...')
    isLoadingImageData.value = true
    progress.value = 10

    const imageDataResult = await getRecentImageData(uploadDuration.value)

    if (!imageDataResult.success) {
      throw new Error(imageDataResult.message || '获取图片数据失败')
    }

    // 格式化并显示图片数据
    const formattedImageData = formatImageDataForDisplay(imageDataResult.data)
    imageDataText.value = formattedImageData.displayText
    imageUrls.value = formattedImageData.imageUrls
    currentImages.value = imageDataResult.data // 保存完整的图片数据

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
    console.log('📊 原始分析数据:', analysisResult.data)
    currentStep.value = 3
    progress.value = 100

    const formattedResult = formatAnalysisResult(analysisResult.data)
    console.log('✨ 格式化后的结果:', formattedResult)
    resultText.value = formattedResult
    console.log('📝 resultText.value 已设置为:', resultText.value)

    resultMetadata.value = {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - Date.now(), // 实际应该记录开始时间
      imageCount: formattedImageData.count,
      timeRange: uploadDuration.value
    }



    // 清除草稿
    localStorage.removeItem('image_analysis_draft')

    console.log('智能图片分析完成！')

  } catch (error) {
    console.error('智能图片分析失败:', error)
    inputError.value = error.message || '分析过程中发生错误，请重试'

    // 重置步骤状态
    currentStep.value = 1
  } finally {
    isSubmitting.value = false
    isLoadingImageData.value = false
  }
}

const saveDraft = () => {
  const draftData = {
    input: userInput.value,
    duration: uploadDuration.value,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem('image_analysis_draft', JSON.stringify(draftData))
}

const resetForm = () => {
  userInput.value = ''
  uploadDuration.value = 5
  resultText.value = ''
  resultMetadata.value = null
  inputError.value = ''
  progress.value = 0
  localStorage.removeItem('image_analysis_draft')
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

const copyImageData = async () => {
  if (!imageDataText.value) return

  try {
    await navigator.clipboard.writeText(imageDataText.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('复制图片数据失败:', error)
  }
}





// 图片模态框相关方法
const openImageModal = (item, index) => {
  selectedImage.value = item
  selectedImageIndex.value = index
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = {}
  selectedImageIndex.value = -1
}



const loadSavedData = () => {
  // 加载草稿
  const draft = localStorage.getItem('image_analysis_draft')
  if (draft) {
    try {
      const draftData = JSON.parse(draft)
      userInput.value = draftData.input || ''
      uploadDuration.value = draftData.duration || 5
    } catch (error) {
      console.error('加载草稿失败:', error)
    }
  }


}





// 清理虚拟数据
const clearVirtualData = () => {
  // 清空所有状态
  userInput.value = ''
  uploadDuration.value = 5
  resultText.value = ''
  imageDataText.value = ''
  imageUrls.value = []
  currentImages.value = []
  resultMetadata.value = null
  // 清空localStorage中的虚拟数据
  localStorage.removeItem('image_analysis_draft')

  console.log('✅ 虚拟数据已清理')
}

// 时间格式化函数
const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}



// 生命周期
onMounted(() => {
  console.log('🎯 ImageAnalysisView 组件已挂载')

  // 清理虚拟数据（确保干净的初始状态）
  clearVirtualData()

  // 然后加载真实的保存数据（如果有的话）
  loadSavedData()
})
</script>

<style scoped>
@import '../assets/imageAnalysis.css';
/* 图片分析页面响应式设计 */
@media (max-width: 1024px) {
  .main-container {
    flex-direction: column;
    gap: 15px;
  }

  .left-column,
  .right-column {
    width: 100%;
    max-width: none;
  }

  .input-section,
  .result-section,
  .image-section {
    padding: 15px;
  }
}

@media (max-width: 768px) {
  .main-container {
    padding: 8px;
    gap: 12px;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .text-input {
    min-height: 120px;
    font-size: 16px; /* 防止iOS缩放 */
    padding: 14px;
  }

  .button-group {
    flex-direction: column;
    gap: 10px;
  }

  .submit-btn,
  .draft-btn,
  .reset-btn,
  .copy-btn {
    min-height: 44px;
    min-width: 44px;
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
    touch-action: manipulation;
  }

  .step-indicator {
    flex-direction: column;
    gap: 8px;
  }

  .step-divider {
    width: 2px;
    height: 20px;
    transform: rotate(90deg);
  }

  .current-images-gallery {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .image-modal .modal-content {
    width: 95vw;
    height: 90vh;
    margin: 5vh auto;
  }
}

@media (max-width: 480px) {
  .main-container {
    padding: 4px;
  }

  .input-section,
  .result-section,
  .image-section {
    padding: 12px;
  }

  .text-input {
    min-height: 100px;
    font-size: 16px;
    padding: 16px;
  }

  .submit-btn,
  .draft-btn,
  .reset-btn,
  .copy-btn {
    min-height: 48px;
    padding: 14px 18px;
    font-size: 16px;
  }

  .current-images-gallery {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .step-indicator {
    gap: 6px;
  }

  .step-text {
    font-size: 12px;
  }

  .char-counter {
    font-size: 12px;
  }
}
</style>

