<template>
  <div class="photo-upload-control">
    <!-- 页面标题 -->
    <header class="page-header">
      <button class="btn btn-back" @click="goBack">← 返回</button>
      <h1 class="page-title">智能语音分析</h1>
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
              placeholder="请输入您想要描述的语音分析需求或想法..."
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
          <div class="step-indicator" v-if="isSubmitting || isLoadingVoiceData || resultText">
            <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
              <div class="step-number">1</div>
              <div class="step-text">获取语音数据</div>
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
            <div v-if="!resultText && !isSubmitting && !isLoadingVoiceData" class="result-placeholder">
              <div class="placeholder-icon">🎤</div>
              <div class="placeholder-text">智能语音分析结果将在这里显示</div>
              <div class="placeholder-steps">
                <p>分析流程：</p>
                <p>1️⃣ 根据时间范围获取语音识别数据</p>
                <p>2️⃣ 结合需求描述进行智能分析</p>
                <p>3️⃣ 展示个性化分析结果</p>
              </div>
            </div>
            <div v-else-if="isSubmitting || isLoadingVoiceData" class="result-loading">
              <div class="loading-container">
                <div class="loading-animation"></div>
                <div class="loading-text">
                  <span v-if="isLoadingVoiceData">正在获取语音数据...</span>
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
                  <span class="metadata-label">语音数据条数:</span>
                  <span class="metadata-value">{{ resultMetadata.voiceDataCount || 0 }}条</span>
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
            <h2 class="section-title">语音采集时间范围</h2>
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

        <!-- 文本展示区域 -->
        <section class="text-display-section">
          <div class="section-header">
            <h2 class="section-title">文本展示</h2>
            <div class="voice-data-status" v-if="isLoadingVoiceData">
              <span class="loading-indicator">🔄</span>
              <span>获取语音数据中...</span>
            </div>
          </div>
          <div class="text-display-wrapper">
            <div class="text-display-inner-wrapper">
              <!-- 显示当前获取的语音数据 -->
              <div v-if="voiceDataText" class="voice-data-display">
                <div class="voice-data-header">
                  <h4>语音识别数据 ({{ uploadDuration }}分钟内)</h4>
                  <button @click="copyVoiceData" class="copy-btn-small" :class="{ copied: copySuccess }">
                    {{ copySuccess ? '已复制' : '复制' }}
                  </button>
                </div>
                <div class="voice-data-content">
                  <pre>{{ voiceDataText }}</pre>
                </div>
              </div>

              <!-- 占位符 -->
              <div v-if="!voiceDataText" class="text-placeholder">
                <div class="placeholder-icon">📝</div>
                <div class="placeholder-text">选择时间范围并点击"开始智能分析"获取语音数据</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getRecentVoiceData,
  analyzeVoiceData,
  validateInput,
  formatVoiceDataForDisplay,
  formatAnalysisResult,
  getTimeRangeOptions
} from '../api/voiceAnalysis.js'

const router = useRouter()

// 响应式数据
const userInput = ref('')
const uploadDuration = ref(5)
const isSubmitting = ref(false)
const isLoadingVoiceData = ref(false)
const resultText = ref('')
const voiceDataText = ref('')
const resultMetadata = ref(null)
const progress = ref(0)
const inputError = ref('')
const copySuccess = ref(false)

const currentStep = ref(1) // 当前步骤：1-获取语音数据，2-分析数据，3-显示结果

// 常量配置
const maxInputLength = 1000
const minDuration = 1
const maxDuration = 60
const durationStep = 1

// 时间预设选项 - 使用API提供的选项
const timePresets = getTimeRangeOptions()

// 计算属性
const canSubmit = computed(() => {
  return userInput.value.trim().length >= 5 && !isSubmitting.value && !isLoadingVoiceData.value
})

const submitButtonText = computed(() => {
  if (isLoadingVoiceData.value) return '获取语音数据中...'
  if (isSubmitting.value) return '分析中...'
  if (!userInput.value.trim()) return '请输入需求描述'
  if (userInput.value.trim().length < 5) return '需求描述过短'
  return '开始智能分析'
})

// 方法
const goBack = () => {
  router.push('/audio-system')
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
    voiceDataText.value = ''
    resultMetadata.value = null
    inputError.value = ''
    currentStep.value = 1

    // 第一步：获取语音数据
    console.log('第一步：获取语音数据...')
    isLoadingVoiceData.value = true
    progress.value = 10

    const voiceDataResult = await getRecentVoiceData(uploadDuration.value)

    if (!voiceDataResult.success) {
      throw new Error(voiceDataResult.message || '获取语音数据失败')
    }

    // 格式化并显示语音数据
    const formattedVoiceData = formatVoiceDataForDisplay(voiceDataResult.data)
    voiceDataText.value = formattedVoiceData

    isLoadingVoiceData.value = false
    progress.value = 30
    currentStep.value = 2

    console.log('第一步完成，获取到语音数据:', voiceDataResult.data)

    // 第二步：发送数据进行分析
    console.log('第二步：发送数据进行智能分析...')
    isSubmitting.value = true
    progress.value = 40

    // 组合语音文本数据（用于分析的原始数据）- 使用逗号分隔
    console.log('🔍 检查语音数据结构:', voiceDataResult.data)
    console.log('🔍 数据类型:', typeof voiceDataResult.data, '是否为数组:', Array.isArray(voiceDataResult.data))

    const voiceTextForAnalysis = Array.isArray(voiceDataResult.data)
      ? voiceDataResult.data.map(item => {
          console.log('📝 处理语音项:', item)
          return item.text || item.content || ''
        }).filter(text => text.trim() !== '').join(',')
      : String(voiceDataResult.data)

    console.log('🎤 组合后的语音文本:', voiceTextForAnalysis)
    console.log('📏 语音文本长度:', voiceTextForAnalysis.length)

    const analysisResult = await analyzeVoiceData(voiceTextForAnalysis, userInput.value.trim())

    progress.value = 80

    if (!analysisResult.success) {
      throw new Error(analysisResult.message || '智能分析失败')
    }

    // 第三步：展示分析结果
    console.log('第三步：展示分析结果...')
    currentStep.value = 3
    progress.value = 100

    const formattedResult = formatAnalysisResult(analysisResult.data)
    resultText.value = formattedResult

    resultMetadata.value = {
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - Date.now(), // 实际应该记录开始时间
      voiceDataCount: Array.isArray(voiceDataResult.data) ? voiceDataResult.data.length : 1,
      timeRange: uploadDuration.value
    }



    // 清除草稿
    localStorage.removeItem('voice_recognition_draft')

    console.log('智能语音分析完成！')

  } catch (error) {
    console.error('智能语音分析失败:', error)
    inputError.value = error.message || '分析过程中发生错误，请重试'

    // 重置步骤状态
    currentStep.value = 1
  } finally {
    isSubmitting.value = false
    isLoadingVoiceData.value = false
  }
}

const saveDraft = () => {
  const draftData = {
    input: userInput.value,
    duration: uploadDuration.value,
    timestamp: new Date().toISOString()
  }
  localStorage.setItem('voice_recognition_draft', JSON.stringify(draftData))
}

const resetForm = () => {
  userInput.value = ''
  uploadDuration.value = 5
  resultText.value = ''
  resultMetadata.value = null
  inputError.value = ''
  progress.value = 0
  localStorage.removeItem('voice_recognition_draft')
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

const copyVoiceData = async () => {
  if (!voiceDataText.value) return

  try {
    await navigator.clipboard.writeText(voiceDataText.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('复制语音数据失败:', error)
  }
}



const loadSavedData = () => {
  // 加载草稿
  const draft = localStorage.getItem('voice_recognition_draft')
  if (draft) {
    try {
      const draftData = JSON.parse(draft)
      userInput.value = draftData.input || ''
      uploadDuration.value = draftData.duration || 5
    } catch (error) {
      console.error('加载草稿失败:', error)
    }
  }

  // 清空localStorage中的虚拟数据
  localStorage.removeItem('voice_recognition_history')
}

// 时间格式化函数
const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadSavedData()
})
</script>

<style scoped>
@import '../assets/imageAnalysis.css';
/* 语音识别页面响应式设计 */
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
  .time-control-section,
  .text-display-section {
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
  .copy-btn,
  .copy-btn-small {
    min-height: 44px;
    min-width: 44px;
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
    touch-action: manipulation;
  }

  .time-presets {
    flex-direction: column;
    gap: 8px;
  }

  .preset-btn {
    min-height: 44px;
    min-width: 44px;
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
    touch-action: manipulation;
  }

  .time-slider {
    min-height: 44px;
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

  .voice-data-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .main-container {
    padding: 4px;
  }

  .input-section,
  .result-section,
  .time-control-section,
  .text-display-section {
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
  .copy-btn,
  .copy-btn-small,
  .preset-btn {
    min-height: 48px;
    padding: 14px 18px;
    font-size: 16px;
  }

  .time-slider-container {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .time-slider {
    width: 100%;
    min-height: 48px;
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

  .time-display {
    font-size: 14px;
  }
}
</style>
