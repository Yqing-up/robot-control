<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回主页</button>
        <h1 class="title">头部系统控制中心</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn btn-small header-action-btn" @click="resetSystem">重置系统</button>
          <button class="btn btn-small header-action-btn" @click="exportDecisionData">导出数据</button>
    </div>
      </div>
    </header>

    <main class="brain-main">
      <!-- 使用左右布局容器 -->
      <div class="brain-layout-container">
        <!-- 左侧控制区 -->
        <div class="brain-left-section">
          <!-- 新增：视频流区域 -->
          <section class="video-section">
            <div class="section-header">
              <h3>实时视频流</h3>
            </div>
            <div class="video-stream-box">
              <img :src="getVideoFeed()" class="camera-preview" @error="onVideoError" @load="onVideoLoad" />
              <div v-if="videoLoading" class="video-loading">视频加载中...</div>
            </div>
          </section>
          <!-- 信息处理模块 -->
          <section class="control-section">
            <div class="section-header">
              <h3>信息处理模块</h3>
              <div class="processing-status" :class="processingStatus">
                <div class="status-dot"></div>
                <span>{{ processingStatusText }}</span>
              </div>
            </div>

            <div class="info-processing">
              <!-- 输入信息区域 -->
              <div class="input-panel">
                <h4>输入信息</h4>
                <div class="input-sources">
                  <div class="source-item" v-for="source in inputSources" :key="source.id">
                    <div class="source-header">
                      <span class="source-name">{{ source.name }}</span>
                      <div class="source-status" :class="source.status"></div>
                    </div>
                    <div class="source-data">{{ source.data || '暂无数据' }}</div>
                  </div>
                </div>
              </div>

              <!-- 处理结果区域 -->
              <div class="processing-panel">
                <h4>处理结果</h4>
                <div class="processing-results">
                  <div class="result-item" v-for="result in processingResults" :key="result.id">
                    <div class="result-header">
                      <span class="result-type">{{ result.type }}</span>
                      <span class="result-confidence">置信度: {{ result.confidence }}%</span>
                    </div>
                    <div class="result-content">{{ result.content }}</div>
                    <div class="result-timestamp">{{ formatTime(result.timestamp) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 系统通信协调 -->
          <section class="communication-section">
            <div class="section-header">
              <h3>系统通信协调</h3>
              <button class="btn btn-small" @click="refreshConnections">刷新连接</button>
            </div>

            <div class="system-connections">
              <div class="connection-item" v-for="system in connectedSystems" :key="system.id">
                <div class="connection-header">
                  <span class="system-name">{{ system.name }}</span>
                  <div class="connection-status" :class="system.status">
                    <!-- <div class="status-indicator"></div> -->
                    <!-- <span>{{ system.statusText }}</span> -->
                  </div>
                </div>
                <div class="connection-stats">
                  <span>延迟: {{ system.latency }}ms</span>
                  <span>数据量: {{ system.dataVolume }}</span>
                </div>
                <div class="connection-actions">
                  <button class="btn btn-mini" @click="sendTestSignal(system.id)">测试</button>
                  <button class="btn btn-mini" @click="resetConnection(system.id)">重连</button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 右侧决策区 -->
        <div class="brain-right-section">
          <!-- 新增：头部控制操作盘 -->
          <section class="head-control-section">
            <div class="section-header">
              <h3>头部控制操作盘</h3>
            </div>
            <div class="direction-section">
              <div class="direction-pad">
                <div></div>
                <button class="direction-btn" @click="moveHead('up')">
                  <span class="arrow">▲</span>
                  <span class="label">上</span>
                </button>
                <div></div>
                <button class="direction-btn" @click="moveHead('left')">
                  <span class="arrow">◀</span>
                  <span class="label">左</span>
                </button>
                <button class="direction-btn" @click="moveHead('reset')">
                  <span class="arrow">●</span>
                  <span class="label">复位</span>
                </button>
                <button class="direction-btn" @click="moveHead('right')">
                  <span class="arrow">▶</span>
                  <span class="label">右</span>
                </button>
                <div></div>
                <button class="direction-btn" @click="moveHead('down')">
                  <span class="arrow">▼</span>
                  <span class="label">下</span>
                </button>
                <div></div>
              </div>
              <div class="func-btn-row">
                <button class="direction-btn emergency" @click="moveHead('stop')">
                  <span class="stop-icon">■</span>
                  <span class="label">停止</span>
                </button>
                <button class="direction-btn" @click="fetchHeadStatus">
                  <span class="arrow">ℹ️</span>
                  <span class="label">状态</span>
                </button>
              </div>
              <div class="head-status-text">{{ headStatusText }}</div>
            </div>
          </section>
          <!-- 决策逻辑界面 -->
          <section class="decision-section">
            <div class="section-header">
              <h3>决策逻辑界面</h3>
              <div class="decision-mode">
                <select v-model="decisionMode" @change="onDecisionModeChange">
                  <option value="auto">自动决策</option>
                  <option value="manual">手动决策</option>
                  <option value="hybrid">混合模式</option>
                </select>
              </div>
            </div>

            <div class="decision-panel">
              <!-- 当前决策状态 -->
              <div class="current-decision">
                <h4>当前决策</h4>
                <div class="decision-display">
                  <div class="decision-content">
                    <span class="decision-text">{{ currentDecision.text || '等待决策输入...' }}</span>
                    <div class="decision-priority" :class="currentDecision.priority">
                      {{ currentDecision.priority || 'normal' }}
                    </div>
                  </div>
                  <div class="decision-actions" v-if="currentDecision.text">
                    <button class="btn btn-success" @click="executeDecision">执行</button>
                    <button class="btn btn-secondary" @click="modifyDecision">修改</button>
                    <button class="btn btn-danger" @click="cancelDecision">取消</button>
                  </div>
                </div>
              </div>

              <!-- 决策历史 -->
              <div class="decision-history">
                <h4>决策历史</h4>
                <div class="history-list">
                  <div class="history-item" v-for="decision in decisionHistory" :key="decision.id">
                    <div class="history-header">
                      <span class="history-time">{{ formatTime(decision.timestamp) }}</span>
                      <div class="history-status" :class="decision.status">{{ decision.status }}</div>
                    </div>
                    <div class="history-content">{{ decision.text }}</div>
                    <div class="history-result" v-if="decision.result">
                      结果: {{ decision.result }}
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </section>

          <!-- 系统监控 -->
          <section class="monitoring-section">
            <div class="section-header">
              <h3>系统监控</h3>
            </div>

            <div class="monitoring-grid">
              <div class="monitor-item">
                <div class="monitor-label">CPU使用率</div>
                <div class="monitor-value">{{ formatToTwoDecimals(systemMetrics.cpu) }}%</div>
                <div class="monitor-bar">
                  <div class="bar-fill" :style="{ width: systemMetrics.cpu + '%' }"></div>
                </div>
              </div>

              <div class="monitor-item">
                <div class="monitor-label">内存使用</div>
                <div class="monitor-value">{{ formatToTwoDecimals(systemMetrics.memory) }}%</div>
                <div class="monitor-bar">
                  <div class="bar-fill" :style="{ width: systemMetrics.memory + '%' }"></div>
                </div>
              </div>

              <div class="monitor-item">
                <div class="monitor-label">决策速度</div>
                <div class="monitor-value">{{ formatToTwoDecimals(systemMetrics.decisionSpeed) }}ms</div>
                <div class="monitor-bar">
                  <div class="bar-fill" :style="{ width: Math.min(systemMetrics.decisionSpeed / 10, 100) + '%' }"></div>
                </div>
              </div>

              <div class="monitor-item">
                <div class="monitor-label">系统温度</div>
                <div class="monitor-value">{{ formatToTwoDecimals(systemMetrics.temperature) }}°C</div>
                <div class="monitor-bar">
                  <div class="bar-fill" :style="{ width: systemMetrics.temperature + '%' }"></div>
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
import { cameraApi } from '../api/cameraApi'
import { moveHeadUp, moveHeadDown, moveHeadLeft, moveHeadRight, resetHead, stopHead, getHeadStatus } from '../api/simulationHeadApi'

const router = useRouter()

// 响应式数据
const processingStatus = ref('idle')
const processingStatusText = ref('系统就绪')
const decisionMode = ref('auto')

// 输入信息源
const inputSources = ref([
  { id: 1, name: '听觉系统', status: 'online', data: '环境音频正常，无异常声音检测' },
  { id: 2, name: '视觉系统', status: 'online', data: '视野清晰，检测到3个移动物体' },
  { id: 3, name: '传感器网络', status: 'online', data: '温度23°C，湿度45%，气压正常' },
  { id: 4, name: '下肢系统', status: 'online', data: '运动状态稳定，电池电量85%' },
  { id: 5, name: '上肢系统', status: 'offline', data: '系统离线' }
])

// 处理结果
const processingResults = ref([
  { id: 1, type: '环境分析', confidence: 95, content: '当前环境安全，适合正常活动', timestamp: Date.now() - 30000 },
  { id: 2, type: '行为建议', confidence: 87, content: '建议保持当前位置，继续监控环境变化', timestamp: Date.now() - 60000 },
  { id: 3, type: '系统优化', confidence: 92, content: '上肢系统需要重新连接，其他系统运行正常', timestamp: Date.now() - 120000 }
])

// 连接的系统
const connectedSystems = ref([
  { id: 1, name: '听觉系统', status: 'connected', statusText: '已连接', latency: 12, dataVolume: '2.3KB/s' },
  { id: 2, name: '视觉系统', status: 'connected', statusText: '已连接', latency: 8, dataVolume: '15.7KB/s' },
  { id: 3, name: '语音系统', status: 'connected', statusText: '已连接', latency: 15, dataVolume: '1.2KB/s' },
  { id: 4, name: '下肢系统', status: 'connected', statusText: '已连接', latency: 5, dataVolume: '0.8KB/s' },
  { id: 5, name: '上肢系统', status: 'disconnected', statusText: '连接中断', latency: 999, dataVolume: '0KB/s' }
])

// 当前决策
const currentDecision = reactive({
  text: '',
  priority: 'normal',
  timestamp: null
})

// 决策历史
const decisionHistory = ref([
  { id: 1, timestamp: Date.now() - 300000, text: '检测到障碍物，执行避障程序', status: 'completed', result: '成功避开障碍物' },
  { id: 2, timestamp: Date.now() - 600000, text: '电池电量低于20%，寻找充电站', status: 'completed', result: '已找到充电站并完成充电' },
  { id: 3, timestamp: Date.now() - 900000, text: '接收到语音指令，准备执行任务', status: 'completed', result: '任务执行完成' },
  { id: 4, timestamp: Date.now() - 1200000, text: '环境温度异常，启动散热系统', status: 'completed', result: '温度已恢复正常' },
  { id: 5, timestamp: Date.now() - 1500000, text: '检测到人员接近，切换到交互模式', status: 'completed', result: '成功切换到交互模式' },
  { id: 6, timestamp: Date.now() - 1800000, text: '网络连接不稳定，尝试重新连接', status: 'completed', result: '网络连接已恢复' },
  { id: 7, timestamp: Date.now() - 2100000, text: '执行定时巡检任务', status: 'completed', result: '巡检任务完成，系统正常' },
  { id: 8, timestamp: Date.now() - 2400000, text: '接收到紧急停止指令', status: 'completed', result: '已安全停止所有运动' },
  { id: 9, timestamp: Date.now() - 2700000, text: '开始充电程序', status: 'completed', result: '充电完成，电量100%' },
  { id: 10, timestamp: Date.now() - 3000000, text: '系统自检完成', status: 'completed', result: '所有系统运行正常' }
])

// 系统指标
const systemMetrics = reactive({
  cpu: 45.444,
  memory: 62.789,
  decisionSpeed: 150.123,
  temperature: 38.567
})

// 格式化数字为两位小数
const formatToTwoDecimals = (value) => {
  return Number(value).toFixed(2)
}

// 视频流相关
const videoLoading = ref(true)
const getVideoFeed = () => {
  videoLoading.value = false
  return cameraApi.getRawVideoFeed()
}
const onVideoError = () => {
  videoLoading.value = false
}
const onVideoLoad = () => {
  videoLoading.value = false
}
// 头部控制相关
const headStatusText = ref('')
const moveHead = async (direction) => {
  headStatusText.value = '操作中...'
  try {
    if (direction === 'up') await moveHeadUp()
    else if (direction === 'down') await moveHeadDown()
    else if (direction === 'left') await moveHeadLeft()
    else if (direction === 'right') await moveHeadRight()
    else if (direction === 'reset') await resetHead()
    else if (direction === 'stop') await stopHead()
    headStatusText.value = '操作成功'
  } catch (e) {
    headStatusText.value = '操作失败'
  }
}
const fetchHeadStatus = async () => {
  headStatusText.value = '获取中...'
  try {
    const res = await getHeadStatus()
    headStatusText.value = res?.data ? JSON.stringify(res.data) : '无数据'
  } catch (e) {
    headStatusText.value = '获取失败'
  }
}

// 方法
const goBack = () => {
  router.push('/')
}

const resetSystem = () => {
  processingStatus.value = 'resetting'
  processingStatusText.value = '系统重置中...'

  setTimeout(() => {
    processingStatus.value = 'idle'
    processingStatusText.value = '系统就绪'
    currentDecision.text = ''
    currentDecision.priority = 'normal'
  }, 2000)
}

const exportDecisionData = () => {
  const data = {
    decisionHistory: decisionHistory.value,
    processingResults: processingResults.value,
    systemMetrics: systemMetrics,
    timestamp: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `brain-system-data-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const refreshConnections = () => {
  connectedSystems.value.forEach(system => {
    if (system.status === 'disconnected') {
      system.status = 'connecting'
      system.statusText = '重新连接中...'

      setTimeout(() => {
        system.status = 'connected'
        system.statusText = '已连接'
        system.latency = Math.floor(Math.random() * 20) + 5
        system.dataVolume = (Math.random() * 10 + 0.5).toFixed(1) + 'KB/s'
      }, 2000)
    }
  })
}

const sendTestSignal = (systemId) => {
  const system = connectedSystems.value.find(s => s.id === systemId)
  if (system) {
    system.statusText = '测试中...'
    setTimeout(() => {
      system.statusText = '测试完成'
      setTimeout(() => {
        system.statusText = '已连接'
      }, 1000)
    }, 1000)
  }
}

const resetConnection = (systemId) => {
  const system = connectedSystems.value.find(s => s.id === systemId)
  if (system) {
    system.status = 'connecting'
    system.statusText = '重新连接中...'

    setTimeout(() => {
      system.status = 'connected'
      system.statusText = '已连接'
      system.latency = Math.floor(Math.random() * 20) + 5
    }, 1500)
  }
}

const onDecisionModeChange = () => {
  processingStatusText.value = `切换到${decisionMode.value === 'auto' ? '自动' : decisionMode.value === 'manual' ? '手动' : '混合'}决策模式`
}

const executeDecision = () => {
  if (currentDecision.text) {
    const newDecision = {
      id: Date.now(),
      timestamp: Date.now(),
      text: currentDecision.text,
      status: 'executing',
      result: null
    }

    decisionHistory.value.unshift(newDecision)

    setTimeout(() => {
      newDecision.status = 'completed'
      newDecision.result = '执行成功'
    }, 2000)

    currentDecision.text = ''
    currentDecision.priority = 'normal'
  }
}

const modifyDecision = () => {
  // 这里可以打开一个编辑对话框
  const newText = prompt('修改决策内容:', currentDecision.text)
  if (newText) {
    currentDecision.text = newText
  }
}

const cancelDecision = () => {
  currentDecision.text = ''
  currentDecision.priority = 'normal'
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 模拟智能决策生成
const generateDecision = () => {
  if (decisionMode.value === 'auto' && !currentDecision.text) {
    const decisions = [
      { text: '检测到环境变化，建议调整传感器灵敏度', priority: 'normal' },
      { text: '系统性能良好，继续当前任务', priority: 'low' },
      { text: '发现异常数据，需要进一步分析', priority: 'high' },
      { text: '建议优化系统资源分配', priority: 'normal' },
      { text: '检测到通信延迟，建议检查网络连接', priority: 'high' }
    ]

    const randomDecision = decisions[Math.floor(Math.random() * decisions.length)]
    currentDecision.text = randomDecision.text
    currentDecision.priority = randomDecision.priority
    currentDecision.timestamp = Date.now()
  }
}

// 更新系统指标
const updateMetrics = () => {
  systemMetrics.cpu = Math.max(20, Math.min(80, systemMetrics.cpu + (Math.random() - 0.5) * 10))
  systemMetrics.memory = Math.max(30, Math.min(90, systemMetrics.memory + (Math.random() - 0.5) * 8))
  systemMetrics.decisionSpeed = Math.max(50, Math.min(500, systemMetrics.decisionSpeed + (Math.random() - 0.5) * 50))
  systemMetrics.temperature = Math.max(25, Math.min(60, systemMetrics.temperature + (Math.random() - 0.5) * 5))
}

// 生命周期
let decisionInterval
let metricsInterval

onMounted(() => {
  console.log('大脑系统组件已挂载')

  // 定期生成决策
  decisionInterval = setInterval(generateDecision, 10000)

  // 定期更新系统指标
  metricsInterval = setInterval(updateMetrics, 3000)
})

onUnmounted(() => {
  console.log('大脑系统组件已卸载')
  if (decisionInterval) clearInterval(decisionInterval)
  if (metricsInterval) clearInterval(metricsInterval)
})
</script>

<style scoped>
.brain-system {
  min-height: 100vh;
  overflow: visible;
  padding-top: 80px; /* 为固定header留出空间 */
}

.brain-content {
  overflow: visible;
  min-height: calc(100vh - 80px);
}
/* 组件特定样式将在CSS文件中添加 */
.title {
  color: #fff !important;
  background: none !important;
  -webkit-background-clip: unset !important;
  -webkit-text-fill-color: unset !important;
  background-clip: unset !important;
  text-shadow: 0 0 15px rgba(0, 153, 255, 0.2);
}
.head-control-section {
  margin-bottom: 24px;
  background: #232b3a;
  border-radius: 10px;
  padding: 18px 20px 12px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.head-control-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.head-btn-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 4px;
}
.head-btn {
  min-width: 56px;
  min-height: 36px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.head-btn:hover {
  background: #1565c0;
}
.head-status-text {
  margin-top: 8px;
  color: #ffeb3b;
  font-size: 14px;
  min-height: 20px;
}
.video-section {
  margin-bottom: 24px;
  background: #232b3a;
  border-radius: 10px;
  padding: 18px 20px 12px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.video-stream-box {
  position: relative;
  width: 100%;
  height: 380px;
  background: #222;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  margin: 0;
  padding: 0;
  background: #222;
}
.video-loading {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0,0,0,0.4);
  font-size: 18px;
  z-index: 2;
}
.direction-section {
  width: 100%;
  height: 380px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.direction-pad {
  display: grid;
  grid-template-columns: repeat(3, 70px);
  grid-template-rows: repeat(3, 70px);
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}
.direction-btn {
  background: linear-gradient(145deg, rgba(0, 102, 255, 0.15) 0%, rgba(0, 102, 255, 0.08) 100%);
  border: 2px solid rgba(0, 102, 255, 0.4);
  border-radius: 16px;
  color: #4da6ff;
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-height: 55px;
  min-width: 70px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 102, 255, 0.1), inset 0 1px 0 rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  font-size: 18px;
}
.direction-btn .arrow {
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 10px currentColor;
}
.direction-btn .label {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  line-height: 1.2;
  text-align: center;
}
.direction-btn.emergency {
  background: linear-gradient(145deg, rgba(255, 0, 0, 0.25) 0%, rgba(255, 0, 0, 0.15) 100%);
  border-color: rgba(255, 0, 0, 0.6);
  color: #ff6666;
}
.direction-btn .stop-icon {
  font-size: 20px;
  color: #ff6666;
  text-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
}
.func-btn-row {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 10px;
}
</style>
