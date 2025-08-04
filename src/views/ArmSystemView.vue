<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回主页</button>
        <h1 class="title">上肢系统控制中心</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn btn-small header-action-btn" @click="emergencyStop">紧急停止</button>
          <button class="btn btn-small header-action-btn" @click="resetArms">重置上肢</button>
          <button class="btn btn-small header-action-btn" @click="exportActionData">导出数据</button>
        </div>
      </div>
    </header>

    <main class="arm-main">
      <!-- 执行状态通知 -->
      <div v-if="executionNotification.show" class="execution-notification" :class="executionNotification.type">
        <div class="notification-icon">
          {{ executionNotification.type === 'success' ? '✅' : executionNotification.type === 'error' ? '❌' : '⏳' }}
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ executionNotification.title }}</div>
          <div class="notification-message">{{ executionNotification.message }}</div>
        </div>
        <button class="notification-close" @click="hideExecutionNotification">×</button>
      </div>

      <!-- 使用左右布局容器 -->
      <div class="arm-layout-container">
        <!-- 左侧动作库管理区 -->
        <div class="arm-left-section">
          <!-- 动作库管理 -->
          <section class="action-library-section">
            <div class="section-header">
              <h3>动作库管理</h3>
              <div class="library-stats">
                <div class="stats-info">
                  <span>共 {{ actionStats.total }} 个动作</span>
                  <span v-if="actionStats.fromAPI > 0" class="api-stats">({{ actionStats.fromAPI }} 个来自API)</span>
                  <span v-if="actionStats.fromDefault > 0" class="default-stats">({{ actionStats.fromDefault }} 个默认)</span>
                </div>
                <div class="library-actions">
                  <button
                    class="btn btn-small btn-secondary"
                    @click="loadActionLibrary"
                    :disabled="isLoadingActions"
                  >
                    {{ isLoadingActions ? '刷新中...' : '刷新' }}
                  </button>
                <button class="btn btn-small btn-primary" @click="showAddActionDialog">+ 添加动作</button>
                </div>
              </div>
            </div>

            <!-- 仿真模式切换 -->
            <div class="simulation-mode-section">
              <div class="simulation-toggle-container">
                <div class="simulation-info">
                  <label class="simulation-label">仿真机器人模式</label>
                  <div class="simulation-status">
                    <span class="status-text" :class="{ 'simulation-active': isSimulationMode }">
                      {{ isSimulationMode ? '仿真模式' : '真实机器人' }}
                    </span>
                    <span class="api-address" v-if="!isSimulationMode">{{ currentApiAddress }}</span>
                  </div>
                </div>
                <div class="simulation-toggle">
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      v-model="isSimulationMode"
                      @change="handleSimulationModeChange"
                      :disabled="isExecutingAction"
                    >
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="simulation-description">
                <p v-if="isSimulationMode" class="simulation-desc active">
                  <span v-if="simulationServerAvailable">
                    🤖 当前使用仿真机器人，动作执行将发送到仿真环境
                  </span>
                  <span v-else class="server-warning">
                    ⚠️ 仿真服务器不可用，已自动降级到真实机器人
                  </span>
                </p>
                <p v-else class="simulation-desc">
                  🦾 当前使用真实机器人，动作执行将发送到物理机器人
                </p>


              </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="action-controls">
              <div class="search-box">
                <input
                  type="text"
                  v-model="searchText"
                  placeholder="搜索动作名称或描述..."
                  class="search-input"
                >
              </div>
              <div class="filter-controls">
                <select v-model="selectedCategory" class="filter-select">
                  <option value="">所有分类</option>
                  <option value="basic">基础动作</option>
                  <option value="gesture">手势动作</option>
                  <option value="manipulation">操作动作</option>
                  <option value="expression">表达动作</option>
                  <option value="complex">复合动作</option>
                </select>
                <select v-model="selectedDifficulty" class="filter-select">
                  <option value="">所有难度</option>
                  <option value="easy">简单</option>
                  <option value="medium">中等</option>
                  <option value="hard">困难</option>
                </select>
              </div>
            </div>

            <!-- 动作列表 -->
            <div class="action-list">
              <!-- 加载状态 -->
              <div v-if="isLoadingActions" class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-text">正在加载动作列表...</div>
              </div>

              <!-- 错误状态 -->
              <div v-else-if="actionLoadError" class="error-state">
                <div class="error-icon">⚠️</div>
                <div class="error-text">{{ actionLoadError }}</div>
                <button class="btn btn-small btn-primary" @click="loadActionLibrary">重试</button>
              </div>

              <!-- 动作列表 -->
              <template v-else>
                <!-- 空状态 -->
                <div v-if="filteredActionLibrary.length === 0" class="empty-state">
                  <div class="empty-icon">🤖</div>
                  <div class="empty-text">暂无动作</div>
                  <div class="empty-hint">点击刷新按钮重新加载动作列表</div>
                </div>

                <!-- 动作列表 -->
                <div
                  v-else
                class="action-item"
                v-for="action in filteredActionLibrary"
                :key="action.id"
                :class="{ executing: executingActionId === action.id }"
              >
                <div class="action-header">
                  <div class="action-info">
                    <span class="action-name">{{ action.name }}</span>
                    <div class="action-meta">
                      <span class="action-category">{{ getCategoryName(action.category) }}</span>
                      <span class="action-difficulty" :class="action.difficulty">{{ getDifficultyName(action.difficulty) }}</span>
                      <span class="action-duration">{{ action.duration }}s</span>
                    </div>
                  </div>
                  <div class="action-actions">
                    <button
                      class="btn btn-mini btn-execute"
                      @click="executeAction(action)"
                      :disabled="executingActionId === action.id || systemStatus !== 'ready'"
                    >
                        <span v-if="executingActionId === action.id" class="executing-indicator">⏳</span>
                      {{ executingActionId === action.id ? '执行中' : '执行' }}
                    </button>
                    <button class="btn btn-mini btn-edit" @click="editAction(action)">编辑</button>
                    <button class="btn btn-mini btn-danger" @click="deleteAction(action.id)">删除</button>
                  </div>
                </div>
                <div class="action-description">
                  {{ action.description }}
                    <div class="action-file-info" v-if="action.fileName">
                      <span class="file-info-item">文件: {{ action.fileName }}</span>
                      <span class="file-info-item" v-if="action.fileSize">大小: {{ formatFileSize(action.fileSize) }}</span>
                      <span class="file-info-item" v-if="action.modifiedTimeStr">修改: {{ action.modifiedTimeStr }}</span>
                    </div>
                </div>
                <div class="action-steps" v-if="action.showSteps">
                  <h5>动作步骤:</h5>
                  <div class="step-list">
                    <div class="step-item" v-for="(step, index) in action.steps" :key="index">
                      <span class="step-number">{{ index + 1 }}</span>
                      <span class="step-description">{{ step.description }}</span>
                      <span class="step-duration">{{ step.duration }}s</span>
                    </div>
                  </div>
                </div>
                <div class="action-controls">
                  <button class="btn btn-mini" @click="toggleSteps(action.id)">
                    {{ action.showSteps ? '隐藏步骤' : '显示步骤' }}
                  </button>
                  <button class="btn btn-mini" @click="previewAction(action)">预览</button>
                </div>
              </div>
              </template>
            </div>
          </section>
        </div>

        <!-- 右侧控制面板区 -->
        <div class="arm-right-section">
          <!-- 机器人第三方视觉视频流 -->
          <section class="vision-stream-section">
            <div class="section-header">
              <h3>机器人视觉</h3>
            </div>
            <div class="vision-stream-container">
              <div class="vision-stream-box">
                <video
                  ref="visionVideo"
                  autoplay
                  muted
                  controls
                  style="width:100%;max-width:800px"
                >您的浏览器不支持视频播放</video>
              </div>
            </div>
          </section>

          <!-- 执行控制面板 -->
          <section class="execution-section">
            <div class="section-header">
              <h3>执行控制</h3>
              <div class="system-status" :class="systemStatus">
                <div class="status-dot"></div>
                <span>{{ systemStatusText }}</span>
              </div>
            </div>

            <div class="execution-controls">
              <!-- 当前执行信息 -->
              <div class="current-execution" v-if="currentAction">
                <h4>正在执行</h4>
                <div class="execution-info">
                  <div class="execution-name">{{ currentAction.name }}</div>
                  <div class="execution-description">{{ currentAction.description }}</div>
                  <div class="execution-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: executionProgress + '%' }"></div>
                    </div>
                    <div class="progress-text">
                      {{ Math.round(executionProgress) }}% - {{ currentStepDescription }}
                    </div>
                  </div>
                </div>
                <div class="execution-buttons">
                  <button class="btn btn-secondary" @click="pauseExecution">暂停</button>
                  <button class="btn btn-danger" @click="stopExecution">停止</button>
                </div>
              </div>

              <!-- 快速动作按钮 -->
              <div class="quick-actions">
                <h4>快速动作</h4>
                <div class="quick-buttons">
                  <!-- 太极按钮 -->
                  <button
                    class="btn btn-quick btn-taiji"
                    @click="executeTaijiAction"
                    :disabled="systemStatus !== 'ready' || isExecutingTaiji"
                  >
                    <span v-if="isExecutingTaiji" class="executing-indicator">⏳</span>
                    {{ isExecutingTaiji ? '太极中...' : '太极' }}
                  </button>
                  <!-- 其他快速动作 -->
                  <button
                    class="btn btn-quick"
                    v-for="action in quickActions"
                    :key="action.id"
                    @click="executeAction(action)"
                    :disabled="systemStatus !== 'ready'"
                  >
                    {{ action.name }}
                  </button>
                </div>
              </div>


            </div>
          </section>



          <!-- 执行历史 -->
          <section class="history-section">
            <div class="section-header">
              <h3>执行历史</h3>
              <button class="btn btn-small" @click="clearHistory">清空历史</button>
            </div>

            <div class="history-list">
              <div class="history-item" v-for="item in executionHistory" :key="item.id">
                <div class="history-header">
                  <span class="history-name">{{ item.name }}</span>
                  <span class="history-time">{{ formatTime(item.timestamp) }}</span>
                </div>
                <div class="history-status" :class="item.status">
                  {{ getStatusText(item.status) }}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>

    <!-- 添加/编辑动作对话框 -->
    <div class="modal" v-if="showActionDialog" @click="closeActionDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editingAction ? '编辑动作' : '上传动作文件' }}</h3>
          <button class="modal-close" @click="closeActionDialog">×</button>
        </div>
        <div class="modal-body">
          <!-- 文件上传区域 -->
          <div class="file-upload-section">
            <div class="upload-area"
                 :class="{ 'drag-over': isDragOver, 'has-file': selectedFile }"
                 @drop="handleFileDrop"
                 @dragover="handleDragOver"
                 @dragleave="handleDragLeave"
                 @click="triggerFileInput">
              <div class="upload-content">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                  <span v-if="!selectedFile">拖拽 .tact 文件到此处或点击选择文件</span>
                  <span v-else class="file-name">{{ selectedFile.name }}</span>
                </div>
                <div class="upload-hint">支持 .tact 格式的动作文件</div>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".tact"
                  @change="handleFileSelect"
                  style="display: none"
                >
              </div>
            </div>

            <!-- 文件信息显示 -->
            <div class="file-info" v-if="selectedFile">
              <div class="file-details">
                <div class="file-detail-item">
                  <span class="detail-label">文件名:</span>
                  <span class="detail-value">{{ selectedFile.name }}</span>
                </div>
                <div class="file-detail-item">
                  <span class="detail-label">文件大小:</span>
                  <span class="detail-value">{{ formatFileSize(selectedFile.size) }}</span>
                </div>
                <div class="file-detail-item" v-if="parsedAction">
                  <span class="detail-label">动作名称:</span>
                  <span class="detail-value">{{ parsedAction.name }}</span>
                </div>
                <div class="file-detail-item" v-if="parsedAction">
                  <span class="detail-label">动作时长:</span>
                  <span class="detail-value">{{ parsedAction.duration }}s</span>
                </div>
              </div>

              <!-- 解析预览 -->
              <div class="action-preview" v-if="parsedAction">
                <h4>动作预览</h4>
                <div class="preview-content">
                  <div class="preview-item">
                    <span class="preview-label">描述:</span>
                    <span class="preview-value">{{ parsedAction.description }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">分类:</span>
                    <span class="preview-value">{{ getCategoryName(parsedAction.category) }}</span>
                  </div>
                  <div class="preview-item">
                    <span class="preview-label">难度:</span>
                    <span class="preview-value">{{ getDifficultyName(parsedAction.difficulty) }}</span>
                  </div>
                  <div class="preview-item" v-if="parsedAction.steps && parsedAction.steps.length > 0">
                    <span class="preview-label">步骤数:</span>
                    <span class="preview-value">{{ parsedAction.steps.length }} 步</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 错误信息显示 -->
            <div class="error-message" v-if="uploadError">
              <div class="error-icon">⚠️</div>
              <div class="error-text">{{ uploadError }}</div>
            </div>
          </div>

          <!-- 手动输入选项 -->
          <div class="manual-input-section">
            <div class="section-divider">
              <span>或手动输入动作信息</span>
            </div>

          <div class="form-group">
            <label>动作名称:</label>
            <input type="text" v-model="actionForm.name" class="form-input">
          </div>
          <div class="form-group">
            <label>描述:</label>
            <textarea v-model="actionForm.description" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label>分类:</label>
            <select v-model="actionForm.category" class="form-select">
              <option value="basic">基础动作</option>
              <option value="gesture">手势动作</option>
              <option value="manipulation">操作动作</option>
              <option value="expression">表达动作</option>
              <option value="complex">复合动作</option>
            </select>
          </div>
          <div class="form-group">
            <label>难度:</label>
            <select v-model="actionForm.difficulty" class="form-select">
              <option value="easy">简单</option>
              <option value="medium">中等</option>
              <option value="hard">困难</option>
            </select>
          </div>
          <div class="form-group">
            <label>持续时间 (秒):</label>
            <input type="number" v-model="actionForm.duration" min="0.1" step="0.1" class="form-input">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeActionDialog">取消</button>
          <button class="btn btn-primary" @click="saveAction" :disabled="!canSaveAction">保存</button>
        </div>
      </div>
    </div>

    <!-- 视觉配置对话框 -->
    <div class="modal" v-if="showVisionConfigDialog" @click="closeVisionConfigDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>视觉流配置</h3>
          <button class="modal-close" @click="closeVisionConfigDialog">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>视觉流地址:</label>
            <input
              type="text"
              v-model="visionStreamUrl"
              class="form-input"
              placeholder="http://192.168.0.103:8080/live/demo"
            >
          </div>
          <div class="form-group">
            <label>说明:</label>
            <p class="config-hint">
              请输入有效的HLS流地址，支持 .m3u8 格式的视频流
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeVisionConfigDialog">取消</button>
          <button class="btn btn-primary" @click="saveVisionConfig">保存</button>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { robotApi } from '../api/robotApi.js'
// 注意：此页面使用独立的robotApi，不影响其他页面的movementApi

const router = useRouter()

// 响应式数据
const searchText = ref('')
const selectedCategory = ref('')
const selectedDifficulty = ref('')
const executingActionId = ref(null)
const systemStatus = ref('ready')
const systemStatusText = ref('系统就绪')
const currentAction = ref(null)
const executionProgress = ref(0)
const currentStepDescription = ref('')

// 机器人模式相关
const isSimulationMode = ref(false)
const simulationServerAvailable = ref(true)
const realServerAvailable = ref(true)

// 太极动作相关
const isExecutingTaiji = ref(false)

const ROBOT_MODE_STORAGE_KEY = 'armRobotMode'

// 对话框相关
const showActionDialog = ref(false)
const showVisionConfigDialog = ref(false)
const editingAction = ref(null)
const actionForm = reactive({
  name: '',
  description: '',
  category: 'basic',
  difficulty: 'easy',
  duration: 2.0
})

// 文件上传相关
const selectedFile = ref(null)
const isDragOver = ref(false)
const uploadError = ref('')
const parsedAction = ref(null)
const fileInput = ref(null)

// 执行通知相关
const executionNotification = ref({
  show: false,
  type: 'info', // success, error, info
  title: '',
  message: ''
})

// 视觉流相关（最简实现）
const isVisionConnected = ref(false)
const visionStreamUrl = ref('http://192.168.0.103:8080/live/demo.m3u8')
const visionVideo = ref(null)
let hls = null
// 移除自动追帧定时器
// let visionSyncTimer = null

// 移除startVisionSync和stopVisionSync函数

const connectVision = async () => {
  if (isVisionConnected.value) return
  await loadHlsLibrary()
  await nextTick()
  if (!visionVideo.value) return

  if (window.Hls && window.Hls.isSupported()) {
    hls = new window.Hls({
      lowLatencyMode: true,
      liveSyncDuration: 0.1, // 极限低延迟
      maxBufferLength: 2,
      maxMaxBufferLength: 4,
      liveBackBufferLength: 0,
      liveDurationInfinity: true,
      maxLiveSyncPlaybackRate: 1.5, // 自动加速追帧
    })
    hls.loadSource(visionStreamUrl.value)
    hls.attachMedia(visionVideo.value)
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      visionVideo.value.play()
      isVisionConnected.value = true
      // 移除startVisionSync()
    })
    hls.on(window.Hls.Events.ERROR, (_, data) => {
      console.error('HLS error', data)
      isVisionConnected.value = false
      // 移除stopVisionSync()
    })
  } else if (visionVideo.value.canPlayType('application/vnd.apple.mpegurl')) {
    visionVideo.value.src = visionStreamUrl.value
    visionVideo.value.play()
    isVisionConnected.value = true
    // 移除startVisionSync()
  } else {
    alert('HLS.js 不支持，且浏览器不支持原生播放')
  }
}

const disconnectVision = () => {
  isVisionConnected.value = false
  if (hls) {
    hls.destroy()
    hls = null
  }
  if (visionVideo.value) {
    visionVideo.value.src = ''
  }
  // 移除stopVisionSync()
}

const loadHlsLibrary = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.Hls !== 'undefined') return resolve()
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// 动作库数据
const actionLibrary = ref([])
const isLoadingActions = ref(false)
const actionLoadError = ref('')

// 默认动作数据（作为备用）
const defaultActions = [
  {
    id: 1,
    name: '挥手问候',
    description: '友好的挥手问候动作',
    category: 'gesture',
    difficulty: 'easy',
    duration: 2.5,
    showSteps: false,
    steps: [
      { description: '抬起右臂', duration: 0.8 },
      { description: '左右摆动手掌', duration: 1.2 },
      { description: '放下右臂', duration: 0.5 }
    ]
  },
  {
    id: 2,
    name: '握手动作',
    description: '标准的握手礼仪动作',
    category: 'gesture',
    difficulty: 'medium',
    duration: 3.0,
    showSteps: false,
    steps: [
      { description: '伸出右臂', duration: 1.0 },
      { description: '握拳姿态', duration: 1.0 },
      { description: '收回右臂', duration: 1.0 }
    ]
  },
  {
    id: 3,
    name: '拿取物品',
    description: '精确拿取桌面物品的动作',
    category: 'manipulation',
    difficulty: 'hard',
    duration: 4.5,
    showSteps: false,
    steps: [
      { description: '定位目标物品', duration: 1.0 },
      { description: '伸出上肢接近', duration: 1.5 },
      { description: '张开手指抓取', duration: 1.0 },
      { description: '提起物品', duration: 1.0 }
    ]
  },
  {
    id: 4,
    name: '指向动作',
    description: '用手指指向特定方向',
    category: 'expression',
    difficulty: 'easy',
    duration: 1.8,
    showSteps: false,
    steps: [
      { description: '抬起上肢', duration: 0.6 },
      { description: '伸出食指', duration: 0.6 },
      { description: '保持指向', duration: 0.6 }
    ]
  },
  {
    id: 5,
    name: '双臂展开',
    description: '张开双臂表示欢迎',
    category: 'expression',
    difficulty: 'medium',
    duration: 3.2,
    showSteps: false,
    steps: [
      { description: '同时抬起双臂', duration: 1.2 },
      { description: '向两侧展开', duration: 1.0 },
      { description: '放下双臂', duration: 1.0 }
    ]
  }
]



// 执行历史 - 从API获取真实数据
const executionHistory = ref([])

// 当前API地址显示
const currentApiAddress = computed(() => {
  return robotApi.getCurrentServerAddress()
})

// 是否正在执行动作
const isExecutingAction = computed(() => {
  return executingActionId.value !== null
})

// 快速动作
const quickActions = computed(() => {
  return actionLibrary.value.filter(action =>
    action.difficulty === 'easy' || action.category === 'gesture'
  ).slice(0, 6)
})

// 过滤后的动作库
const filteredActionLibrary = computed(() => {
  return actionLibrary.value.filter(action => {
    const matchesSearch = !searchText.value ||
      action.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      action.description.toLowerCase().includes(searchText.value.toLowerCase())

    const matchesCategory = !selectedCategory.value || action.category === selectedCategory.value
    const matchesDifficulty = !selectedDifficulty.value || action.difficulty === selectedDifficulty.value

    return matchesSearch && matchesCategory && matchesDifficulty
  })
})

// 检查是否可以保存动作
const canSaveAction = computed(() => {
  return actionForm.name.trim() && actionForm.description.trim()
})

// 动作统计信息
const actionStats = computed(() => {
  const total = actionLibrary.value.length
  const filtered = filteredActionLibrary.value.length
  const fromAPI = actionLibrary.value.filter(action => action.fileName).length

  return {
    total,
    filtered,
    fromAPI,
    fromDefault: total - fromAPI
  }
})

// 方法
const goBack = () => {
  router.push('/')
}

// 仿真模式相关方法
const loadRobotModeFromStorage = () => {
  try {
    const saved = localStorage.getItem(ROBOT_MODE_STORAGE_KEY)
    if (saved !== null) {
      const mode = JSON.parse(saved)
      const isSimulation = mode === 'simulation'
      isSimulationMode.value = isSimulation
      robotApi.setRobotMode(mode)
      console.log('🔄 从localStorage恢复机器人模式:', mode)
    } else {
      // 默认使用真实机器人
      isSimulationMode.value = false
      robotApi.setRobotMode('real')
      console.log('🔄 使用默认机器人模式: real (真实机器人)')
    }
  } catch (error) {
    console.error('❌ 加载机器人模式失败:', error)
    isSimulationMode.value = false
    robotApi.setRobotMode('real')
  }
}

const saveRobotModeToStorage = (mode) => {
  try {
    localStorage.setItem(ROBOT_MODE_STORAGE_KEY, JSON.stringify(mode))
    console.log('💾 机器人模式已保存到localStorage:', mode)
  } catch (error) {
    console.error('❌ 保存机器人模式失败:', error)
  }
}

const handleSimulationModeChange = async () => {
  const enabled = isSimulationMode.value
  const newMode = enabled ? 'simulation' : 'real'
  console.log('🔄 机器人模式切换:', newMode)

  // 检测服务器状态
  console.log('🔍 检测机器人服务器状态...')
  const connections = await robotApi.checkBothConnections()

  simulationServerAvailable.value = connections.simulation.connected
  realServerAvailable.value = connections.real.connected

  // 检查目标服务器是否可用
  if (enabled && !connections.simulation.connected) {
    showExecutionNotification(
      'warning',
      '仿真服务器不可用',
      `仿真机器人服务器 (192.168.0.103:5001) 无法连接，将保持真实机器人模式`,
      8000
    )
    // 强制保持真实机器人模式
    isSimulationMode.value = false
    robotApi.setRobotMode('real')
    return
  } else if (!enabled && !connections.real.connected) {
    showExecutionNotification(
      'warning',
      '真实机器人不可用',
      `真实机器人服务器 (192.168.0.115:5001) 无法连接，将保持仿真机器人模式`,
      8000
    )
    // 强制保持仿真机器人模式
    isSimulationMode.value = true
    robotApi.setRobotMode('simulation')
    return
  }

  // 更新机器人模式
  robotApi.setRobotMode(newMode)

  // 保存到localStorage
  saveRobotModeToStorage(newMode)

  // 重新加载动作列表以获取对应服务器的动作
  console.log('🔄 重新加载动作列表...')
  await loadActionLibrary()

  // 重新获取执行历史数据以获取对应服务器的历史记录
  console.log('🔄 重新加载执行历史...')
  await fetchExecutionHistory()

  // 模式切换完成，不显示通知
  const statusText = robotApi.getCurrentModeLabel()
  console.log(`✅ 已切换到${statusText}模式，动作列表和执行历史已更新`)
}



const getCategoryName = (category) => {
  const categoryMap = {
    basic: '基础动作',
    gesture: '手势动作',
    manipulation: '操作动作',
    expression: '表达动作',
    complex: '复合动作'
  }
  return categoryMap[category] || category
}

const getDifficultyName = (difficulty) => {
  const difficultyMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return difficultyMap[difficulty] || difficulty
}



const getStatusText = (status) => {
  const statusMap = {
    completed: '执行完成',
    failed: '执行失败',
    cancelled: '已取消',
    executing: '执行中'
  }
  return statusMap[status] || status
}

const executeAction = async (action) => {
  if (systemStatus.value !== 'ready') return

  executingActionId.value = action.id
  currentAction.value = action
  systemStatus.value = 'executing'
  systemStatusText.value = '正在执行动作'
  executionProgress.value = 0

  // 添加到执行历史
  const historyItem = {
    id: Date.now(),
    name: action.name,
    timestamp: Date.now(),
    status: 'executing',
    duration: 0
  }
  executionHistory.value.unshift(historyItem)

  try {
    // 准备API调用参数
    let actionName = action.name
    let apiParams = {
      duration: action.duration || 3.0
    }

    // 如果有文件名，使用文件名作为动作名称
    if (action.fileName) {
      actionName = action.fileName.replace('.tact', '')
      apiParams.filePath = action.filePath || action.fileName
    }

    console.log('调用API执行动作:', {
      actionName,
      apiParams,
      originalAction: action
    })

    const result = await robotApi.executeAction(actionName, apiParams)
    console.log('执行动作API响应:', result)

    if (result.success) {
      // API执行成功，更新历史记录
      console.log('动作执行成功:', result.message)
      completeExecution(historyItem, action.duration, 'completed')

      // 显示成功通知
      showExecutionNotification(
        'success',
        '执行成功',
        `${action.name} 动作执行完成`,
        4000
      )
    } else {
      // API执行失败
      console.error('API执行动作失败:', {
        message: result.message,
        errorCode: result.error_code,
        details: result.details
      })
      completeExecution(historyItem, action.duration, 'failed')

      // 显示错误通知
      showExecutionNotification(
        'error',
        '执行失败',
        `${action.name} 动作执行失败: ${result.message}`,
        6000
      )
    }
  } catch (error) {
    console.error('执行动作时发生错误:', error)
    completeExecution(historyItem, action.duration, 'failed')

    // 显示错误通知
    showExecutionNotification(
      'error',
      '执行错误',
      `${action.name} 动作执行出错: ${error.message || '网络错误'}`,
      6000
    )
  }
}



const completeExecution = async (historyItem, duration, status = 'completed') => {
  executingActionId.value = null
  currentAction.value = null
  systemStatus.value = 'ready'
  systemStatusText.value = '系统就绪'
  executionProgress.value = 0
  currentStepDescription.value = ''

  // 更新历史记录
  historyItem.status = status
  historyItem.duration = duration

  // 动作执行完成后，刷新执行历史数据
  setTimeout(async () => {
    await fetchExecutionHistory()
  }, 1000) // 延迟1秒后刷新，确保服务器端数据已更新
}

const pauseExecution = () => {
  // 暂停执行逻辑
  systemStatus.value = 'paused'
  systemStatusText.value = '执行已暂停'
}

const stopExecution = () => {
  executingActionId.value = null
  currentAction.value = null
  systemStatus.value = 'ready'
  systemStatusText.value = '系统就绪'
  executionProgress.value = 0
  currentStepDescription.value = ''
}

const emergencyStop = () => {
  stopExecution()
  systemStatusText.value = '紧急停止'
}

const resetArms = () => {
  stopExecution()
  armStatus.leftArm.position = '待机位置'
  armStatus.rightArm.position = '待机位置'
  systemStatusText.value = '上肢已重置'
}

// 太极动作执行方法
const executeTaijiAction = async () => {
  if (isExecutingTaiji.value || systemStatus.value !== 'ready') return

  isExecutingTaiji.value = true
  systemStatus.value = 'executing'
  systemStatusText.value = '正在执行太极动作'

  console.log('🥋 开始执行太极动作')

  // 添加到执行历史
  const historyItem = {
    id: Date.now(),
    name: '太极',
    timestamp: Date.now(),
    status: 'executing',
    duration: 0
  }
  executionHistory.value.unshift(historyItem)

  try {
    const result = await robotApi.executeTaijiAction({
      duration: 30.0 // 太极动作通常需要较长时间
    })

    console.log('太极动作API响应:', result)

    if (result && result.success !== false) {
      console.log('✅ 太极动作执行成功')
      completeExecution(historyItem, 30.0, 'completed')

      // 显示成功通知
      showExecutionNotification(
        'success',
        '执行成功',
        '太极动作执行完成',
        4000
      )
    } else {
      throw new Error(result?.message || '太极动作执行失败')
    }
  } catch (error) {
    console.error('❌ 太极动作执行异常:', error)
    completeExecution(historyItem, 30.0, 'failed')

    // 提供更友好的错误信息
    let errorMessage = '太极动作执行失败'
    if (error.message) {
      errorMessage += `: ${error.message}`
    }
    if (error.response?.status === 404) {
      errorMessage = '太极接口不存在，请检查服务器配置'
    } else if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请检查机器人状态'
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请检查网络连接'
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `无法连接到${robotApi.getCurrentModeLabel()}服务器，请检查网络连接`
    }

    // 显示错误通知
    showExecutionNotification(
      'error',
      '执行失败',
      errorMessage,
      6000
    )
  } finally {
    isExecutingTaiji.value = false
  }
}

const toggleSteps = (actionId) => {
  const action = actionLibrary.value.find(a => a.id === actionId)
  if (action) {
    action.showSteps = !action.showSteps
  }
}

const previewAction = (action) => {
  alert(`预览动作: ${action.name}\n${action.description}\n持续时间: ${action.duration}秒`)
}

const showAddActionDialog = () => {
  editingAction.value = null
  actionForm.name = ''
  actionForm.description = ''
  actionForm.category = 'basic'
  actionForm.difficulty = 'easy'
  actionForm.duration = 2.0
  selectedFile.value = null
  parsedAction.value = null
  uploadError.value = ''
  isDragOver.value = false
  showActionDialog.value = true
}

const editAction = (action) => {
  editingAction.value = action
  actionForm.name = action.name
  actionForm.description = action.description
  actionForm.category = action.category
  actionForm.difficulty = action.difficulty
  actionForm.duration = action.duration
  showActionDialog.value = true
}

const closeActionDialog = () => {
  showActionDialog.value = false
  editingAction.value = null
  selectedFile.value = null
  parsedAction.value = null
  uploadError.value = ''
  isDragOver.value = false
}

const saveAction = () => {
  // 优先使用解析的文件数据
  const actionData = parsedAction.value || actionForm

  if (!actionData.name?.trim() || !actionData.description?.trim()) {
    alert('请填写完整信息或上传有效的动作文件')
    return
  }

  if (editingAction.value) {
    // 编辑现有动作
    const index = actionLibrary.value.findIndex(a => a.id === editingAction.value.id)
    if (index !== -1) {
      actionLibrary.value[index] = {
        ...actionLibrary.value[index],
        name: actionData.name,
        description: actionData.description,
        category: actionData.category,
        difficulty: actionData.difficulty,
        duration: actionData.duration
      }
    }
  } else {
    // 添加新动作
    const newAction = {
      id: Date.now(),
      name: actionData.name,
      description: actionData.description,
      category: actionData.category,
      difficulty: actionData.difficulty,
      duration: actionData.duration,
      showSteps: false,
      steps: actionData.steps || [
        { description: '准备动作', duration: actionData.duration * 0.3 },
        { description: '执行动作', duration: actionData.duration * 0.4 },
        { description: '完成动作', duration: actionData.duration * 0.3 }
      ]
    }
    actionLibrary.value.unshift(newAction)
  }

  closeActionDialog()
}

const deleteAction = (actionId) => {
  if (confirm('确定要删除这个动作吗？')) {
    const index = actionLibrary.value.findIndex(a => a.id === actionId)
    if (index !== -1) {
      actionLibrary.value.splice(index, 1)
    }
  }
}



// 获取执行历史数据
const fetchExecutionHistory = async () => {
  try {
    console.log('📜 获取执行历史数据...')
    const response = await robotApi.getActionsHistory()

    if (response && response.data) {
      console.log('📜 API返回的原始数据:', response.data)

      // 处理API返回的数据格式 - 数据在 data.records 中
      let historyData = []
      if (response.data.records && Array.isArray(response.data.records)) {
        historyData = response.data.records
      } else if (Array.isArray(response.data)) {
        historyData = response.data
      }

      console.log('📜 解析出的历史数据:', historyData)

      // 格式化历史数据以匹配界面需求
      executionHistory.value = historyData.map(item => {
        // 确定状态
        let status = 'completed'
        if (item.success === false || item.status === 'failed') {
          status = 'failed'
        } else if (item.status === 'executing' || item.status === 'running') {
          status = 'executing'
        } else if (item.status === 'cancelled') {
          status = 'cancelled'
        }

        return {
          id: item.id || Date.now() + Math.random(),
          name: item.action_name || item.name || '未知动作',
          timestamp: item.start_time ? new Date(item.start_time).getTime() :
                    (item.timestamp ? new Date(item.timestamp).getTime() : Date.now()),
          status: status,
          duration: item.duration || 0
        }
      })

      console.log('✅ 执行历史数据获取成功:', executionHistory.value.length, '条记录')
      console.log('✅ 格式化后的数据:', executionHistory.value)
    } else {
      console.log('📜 执行历史数据为空或格式不正确')
      executionHistory.value = []
    }
  } catch (error) {
    console.error('❌ 获取执行历史失败:', error)

    // 检查是否是404错误（接口未实现）
    if (error.response && error.response.status === 404) {
      console.warn('⚠️ 执行历史接口未实现，当前服务器不支持历史记录功能')
      // 显示友好提示
      showExecutionNotification(
        'warning',
        '历史记录功能不可用',
        `当前${robotApi.getCurrentModeLabel()}服务器暂不支持执行历史功能`,
        5000
      )
    }

    // 保持当前历史数据，不清空
  }
}

const clearHistory = () => {
  if (confirm('确定要清空执行历史吗？')) {
    executionHistory.value = []
  }
}

// 测试API连接的辅助函数
const testHistoryAPI = async () => {
  try {
    console.log('🧪 测试执行历史API连接...')
    const response = await robotApi.getActionsHistory()
    console.log('🧪 API测试响应:', response)
    return response
  } catch (error) {
    console.error('🧪 API测试失败:', error)
    return null
  }
}

const exportActionData = () => {
  const data = {
    actionLibrary: actionLibrary.value,
    savedSequences: savedSequences.value,
    executionHistory: executionHistory.value,
    armStatus: armStatus,
    timestamp: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `arm-system-data-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 加载动作列表
const loadActionLibrary = async () => {
  isLoadingActions.value = true
  actionLoadError.value = ''

  try {
    console.log(`开始加载动作列表... [${robotApi.getCurrentModeLabel()}]`)
    const result = await robotApi.getActions()
    console.log('动作列表API响应:', result)

    // 根据实际的服务器响应结构解析数据
    let actionsData = null

    // 详细调试信息
    console.log('🔍 robotApi响应调试信息:')
    console.log('result存在:', !!result)
    console.log('result.data存在:', !!(result && result.data))
    console.log('result.data.actions存在:', !!(result && result.data && result.data.actions))
    if (result && result.data && result.data.actions) {
      console.log('result.data.actions是数组:', Array.isArray(result.data.actions))
      console.log('result.data.actions长度:', result.data.actions.length)
    }

    if (result && result.data && result.data.actions && Array.isArray(result.data.actions)) {
      // 格式1: {success: true, message: "...", data: {success: true, actions: [...]}}
      actionsData = result.data.actions
      console.log('✅ 使用格式1: result.data.actions (三层嵌套)')
    } else if (result && result.success && result.actions) {
      // 格式2: {success: true, actions: [...]}
      actionsData = result.actions
      console.log('✅ 使用格式2: result.actions')
    } else if (result && Array.isArray(result.actions)) {
      // 格式3: {actions: [...]}
      actionsData = result.actions
      console.log('✅ 使用格式3: result.actions (数组)')
    } else if (Array.isArray(result)) {
      // 格式4: 直接返回数组
      actionsData = result
      console.log('✅ 使用格式4: 直接数组')
    } else if (result && result.data && Array.isArray(result.data)) {
      // 格式5: {data: [...]}
      actionsData = result.data
      console.log('✅ 使用格式5: result.data')
    } else {
      console.error('❌ 未识别的数据格式')
      console.error('result结构:', result)
      if (result && result.data) {
        console.error('result.data结构:', result.data)
        console.error('result.data的keys:', Object.keys(result.data))
      }
    }

    if (actionsData && Array.isArray(actionsData)) {
      const apiActions = parseApiActions(actionsData)
      actionLibrary.value = apiActions
      console.log('动作列表加载成功:', apiActions.length, '个动作')
    } else {
      console.warn('未找到有效的动作数据，使用默认动作')
      console.warn('响应数据结构:', result)
      actionLibrary.value = [...defaultActions]
      actionLoadError.value = '服务器返回的数据格式不正确'
    }
  } catch (error) {
    console.error('加载动作列表时发生错误:', error)
    actionLibrary.value = [...defaultActions]
    actionLoadError.value = '网络连接失败，使用默认动作'
  } finally {
    isLoadingActions.value = false
  }
}

// 解析API返回的动作数据
const parseApiActions = (apiData) => {
  if (!apiData || !Array.isArray(apiData)) {
    console.warn('API返回的动作数据格式不正确:', apiData)
    return defaultActions
  }

  return apiData.map((action, index) => {
    // 处理API返回的动作对象格式
    if (typeof action === 'object' && action.name) {
      return {
        id: Date.now() + index,
        name: action.name,
        description: `动作文件: ${action.file_name}`,
        category: 'basic', // 默认分类，可以根据需要调整
        difficulty: 'medium', // 默认难度
        duration: 3.0, // 默认持续时间
        showSteps: false,
        steps: [
          { description: '准备动作', duration: 1.0 },
          { description: '执行动作', duration: 1.5 },
          { description: '完成动作', duration: 0.5 }
        ],
        fileName: action.file_name, // 保存文件名用于API调用
        filePath: action.file_path,
        fileSize: action.file_size,
        modifiedTime: action.modified_time,
        modifiedTimeStr: action.modified_time_str
      }
    }

    // 如果API返回的是字符串（文件名）
    if (typeof action === 'string' && action.endsWith('.tact')) {
      return {
        id: Date.now() + index,
        name: action.replace('.tact', ''),
        description: `从文件 ${action} 加载的动作`,
        category: 'basic',
        difficulty: 'easy',
        duration: 2.0,
        showSteps: false,
        steps: [
          { description: '准备动作', duration: 0.6 },
          { description: '执行动作', duration: 0.8 },
          { description: '完成动作', duration: 0.6 }
        ],
        fileName: action
      }
    }

    // 其他情况，创建默认动作
    return {
      id: Date.now() + index,
      name: `动作${index + 1}`,
      description: '未知动作',
      category: 'basic',
      difficulty: 'easy',
      duration: 2.0,
      showSteps: false,
      steps: [
        { description: '准备动作', duration: 0.6 },
        { description: '执行动作', duration: 0.8 },
        { description: '完成动作', duration: 0.6 }
      ]
    }
  })
}

// 文件上传相关方法
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

const handleFileDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false

  const files = event.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    if (file.name.endsWith('.tact')) {
      processFile(file)
    } else {
      uploadError.value = '请选择 .tact 格式的文件'
    }
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragOver.value = false
}

const processFile = (file) => {
  selectedFile.value = file
  uploadError.value = ''
  parsedAction.value = null

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target.result
      const action = parseTactFile(content, file.name)
      parsedAction.value = action

      // 自动填充表单
      actionForm.name = action.name
      actionForm.description = action.description
      actionForm.category = action.category
      actionForm.difficulty = action.difficulty
      actionForm.duration = action.duration
    } catch (error) {
      uploadError.value = `文件解析失败: ${error.message}`
      console.error('文件解析错误:', error)
    }
  }

  reader.onerror = () => {
    uploadError.value = '文件读取失败'
  }

  reader.readAsText(file)
}

const parseTactFile = (content, filename) => {
  try {
    // 尝试解析JSON格式
    const data = JSON.parse(content)

    // 验证必需字段
    if (!data.name || !data.description) {
      throw new Error('缺少必需的字段: name 或 description')
    }

    return {
      name: data.name,
      description: data.description,
      category: data.category || 'basic',
      difficulty: data.difficulty || 'easy',
      duration: data.duration || 2.0,
      steps: data.steps || []
    }
  } catch (jsonError) {
    // 如果不是JSON格式，尝试解析自定义格式
    return parseCustomTactFormat(content, filename)
  }
}

const parseCustomTactFormat = (content, filename) => {
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length < 2) {
    throw new Error('文件格式不正确，至少需要动作名称和描述')
  }

  const name = lines[0].trim()
  const description = lines[1].trim()

  // 解析其他可选信息
  let category = 'basic'
  let difficulty = 'easy'
  let duration = 2.0
  let steps = []

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('category:')) {
      category = line.substring(9).trim()
    } else if (line.startsWith('difficulty:')) {
      difficulty = line.substring(10).trim()
    } else if (line.startsWith('duration:')) {
      duration = parseFloat(line.substring(9).trim()) || 2.0
    } else if (line.startsWith('step:')) {
      const stepDesc = line.substring(5).trim()
      const stepDuration = duration / (lines.length - 2) // 平均分配时间
      steps.push({
        description: stepDesc,
        duration: stepDuration
      })
    }
  }

  // 如果没有步骤，创建默认步骤
  if (steps.length === 0) {
    steps = [
      { description: '准备动作', duration: duration * 0.3 },
      { description: '执行动作', duration: duration * 0.4 },
      { description: '完成动作', duration: duration * 0.3 }
    ]
  }

  return {
    name,
    description,
    category,
    difficulty,
    duration,
    steps
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 通知相关方法
const showExecutionNotification = (type, title, message, duration = 5000) => {
  executionNotification.value = {
    show: true,
    type,
    title,
    message
  }

  // 自动隐藏通知
  setTimeout(() => {
    hideExecutionNotification()
  }, duration)
}

const hideExecutionNotification = () => {
  executionNotification.value.show = false
}

// 视觉配置相关方法
const showVisionConfig = () => {
  showVisionConfigDialog.value = true
}

const closeVisionConfigDialog = () => {
  showVisionConfigDialog.value = false
}

const saveVisionConfig = () => {
  // 验证URL格式
  if (!visionStreamUrl.value.trim()) {
    showExecutionNotification(
      'error',
      '配置错误',
      '请输入有效的视觉流地址',
      3000
    )
    return
  }

  try {
    new URL(visionStreamUrl.value)
  } catch (error) {
    showExecutionNotification(
      'error',
      '配置错误',
      '请输入有效的URL地址',
      3000
    )
    return
  }

  // 如果当前已连接，先断开
  if (isVisionConnected.value) {
    disconnectVision()
  }

  closeVisionConfigDialog()

  // 显示配置成功通知
  showExecutionNotification(
    'success',
    '配置成功',
    '视觉流地址已更新',
    2000
  )
}



// 手动同步到最新片段
const manualSyncToLive = () => {
  if (isVisionConnected.value && hls && visionVideo.value) {
    if (hls.liveSyncPosition) {
      console.log('手动同步到最新片段:', hls.liveSyncPosition)
      visionVideo.value.currentTime = hls.liveSyncPosition

      // 临时加快播放速度，帮助追帧
      visionVideo.value.playbackRate = 1.5
      setTimeout(() => {
        visionVideo.value.playbackRate = 1.05
      }, 1000)

      showExecutionNotification(
        'info',
        '同步成功',
        '已同步到最新画面',
        1000
      )
    }
  }
}

// 生命周期
onMounted(async () => {
  console.log('上肢系统组件已挂载')

  // 加载机器人模式状态
  loadRobotModeFromStorage()

  await loadActionLibrary()

  // 获取执行历史数据
  await fetchExecutionHistory()

  // 自动连接视觉流
  console.log('自动连接视觉流...')
  setTimeout(() => {
    connectVision()
  }, 1000) // 延迟1秒连接，确保组件完全加载

  // 保留进度条，但自动追到直播点前0.2秒
  nextTick(() => {
    if (visionVideo.value) {
      visionVideo.value.addEventListener('timeupdate', () => {
        if (hls && hls.liveSyncPosition) {
          const target = hls.liveSyncPosition - 0.2
          const lag = target - visionVideo.value.currentTime
          // 只要落后0.5秒以上就自动追到直播点前0.2秒
          if (lag > 0.5) {
            visionVideo.value.currentTime = target
          }
        }
      })
    }
  })
})

onUnmounted(() => {
  console.log('上肢系统组件已卸载')
  stopExecution()

  // 停止自动刷新
  // stopAutoRefresh() // 移除旧的自动刷新逻辑

  // 清理HLS实例
  if (hls) {
    hls.destroy()
    hls = null
  }
  // 移除stopVisionSync()
})
</script>

<style scoped>
/* 仿真模式切换样式 */
.simulation-mode-section {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  border: 1px solid #2d3748;
}

.simulation-toggle-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.simulation-info {
  flex: 1;
}

.simulation-label {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
  display: block;
  margin-bottom: 4px;
}

.simulation-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: #cbd5e0;
  transition: color 0.3s ease;
}

.status-text.simulation-active {
  color: #48bb78;
}

.api-address {
  font-size: 12px;
  color: #718096;
  font-family: 'Courier New', monospace;
}

.simulation-toggle {
  margin-left: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}



/* Toggle Switch 样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #4a5568;
  transition: 0.4s;
  border-radius: 34px;
  border: 2px solid #2d3748;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: 3px;
  bottom: 3px;
  background-color: #e2e8f0;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .toggle-slider {
  background-color: #48bb78;
  border-color: #38a169;
}

input:focus + .toggle-slider {
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.3);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
  background-color: #ffffff;
}

input:disabled + .toggle-slider {
  opacity: 0.6;
  cursor: not-allowed;
}

input:disabled + .toggle-slider:before {
  cursor: not-allowed;
}

.simulation-description {
  margin-top: 8px;
}

.simulation-desc {
  font-size: 13px;
  color: #a0aec0;
  margin: 0;
  padding: 8px 12px;
  background: rgba(45, 55, 72, 0.5);
  border-radius: 6px;
  border-left: 3px solid #4a5568;
  transition: all 0.3s ease;
}

.simulation-desc.active {
  color: #c6f6d5;
  background: rgba(72, 187, 120, 0.1);
  border-left-color: #48bb78;
}

.server-warning {
  color: #fed7d7 !important;
  background: rgba(245, 101, 101, 0.1) !important;
  border-left-color: #f56565 !important;
}

/* 太极按钮特殊样式 */
.btn-taiji {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.3)) !important;
  color: #ffd700 !important;
  border: 1px solid rgba(255, 215, 0, 0.4) !important;
  position: relative;
  overflow: hidden;
}

.btn-taiji:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 165, 0, 0.4)) !important;
  border-color: rgba(255, 215, 0, 0.8) !important;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3) !important;
  transform: translateY(-1px);
}

.btn-taiji:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-taiji .executing-indicator {
  animation: spin 1s linear infinite;
  margin-right: 4px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .simulation-toggle-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .simulation-toggle {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>
