<template>
  <div class="container">
    <!-- 成功提示 -->
    <div v-if="showSuccessToast" class="success-toast">
      <div class="success-content">
        <span class="success-icon">✅</span>
        <span class="success-text">{{ successMessage }}</span>
      </div>
    </div>

    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回</button>
        <h1 class="title">机器人综合管理中心 - {{ currentSceneInfo.title }}</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn btn-small" @click="handleRefreshAllStatus">刷新状态</button>
          <button class="btn btn-small" @click="handleEmergencyStopAll">紧急停止</button>
          <button class="btn btn-small" @click="handleExportAllData">导出数据</button>
        </div>
      </div>
    </header>

    <main class="management-main">
      <!-- 第一层：机器人画面区域 -->
      <section class="camera-layer">
        <div class="camera-section-row" style="display: flex; gap: 20px; align-items: flex-start;">
          <!-- 头部控制操作盘 - 移到左侧 -->
          <div class="head-control-section" style="flex: 0 0 280px;">
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
          </div>

          <!-- 视频显示区域 - 居中 -->
          <div class="camera-section" style="flex: 1; min-width: 0; max-width: 1000px;">
            <div class="video-display" style="height: 630px !important; width: 100% !important; margin: 0 auto !important;">
              <!-- 视频模式 -->
              <video
                v-if="!useFallbackImage"
                ref="cameraVideo"
                class="camera-stream"
                style="object-fit: contain !important; width: 100% !important; height: 100% !important;"
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
                style="object-fit: contain !important; width: 100% !important; height: 100% !important;"
                :src="cameraStreamUrl"
                @load="onImageLoad"
                @error="onImageError"
                alt="摄像头画面"
              />
              <div v-if="!cameraConnected && !cameraStreamUrl" class="video-overlay">
                <div class="overlay-content">
                  <div class="overlay-icon">📹</div>
                  <div class="overlay-text">摄像头画面</div>
                  <div class="overlay-status">{{ cameraStatus }}</div>
                </div>
              </div>
            </div>
            <!-- 摄像头控制按钮 -->
            <div class="camera-controls">
              <button class="camera-btn" @click="handleInitializeCamera" :disabled="cameraLoading">
                {{ cameraLoading ? '连接中...' : '刷新摄像头' }}
              </button>
              <button class="camera-btn" @click="handleToggleCamera" :disabled="cameraLoading">
                {{ cameraConnected ? '断开摄像头' : '连接摄像头' }}
              </button>
              <button class="camera-btn" @click="handleToggleFullscreen" :disabled="!cameraConnected">
                {{ isFullscreen ? '🔍 退出全屏' : '🔍 全屏' }}
              </button>
            </div>
          </div>

          <!-- 下肢移动控制 - 移到右侧 -->
          <div class="leg-control-section" style="flex: 0 0 320px;">
            <div class="module-header">
              <h3>🦵 下肢移动控制</h3>
              <div class="module-status" :class="legStatus">{{ legStatusText }}</div>
            </div>

            <div class="module-content">
              <!-- 方向控制 -->
              <div class="direction-control-panel">
                <h4>方向控制</h4>
                <div class="direction-pad-extended">
                  <!-- 左移按钮 -->
                  <button
                    class="direction-btn side-btn left-move"
                    :class="{ active: currentDirection === 'left-move' }"
                    :disabled="isExecutingMovement"
                    @click="handleExecuteMovement('left-move')"
                  >
                    <span class="direction-icon">←</span>
                    <span class="direction-label">左移</span>
                  </button>

                  <!-- 中央控制区域 -->
                  <div class="center-controls">
                    <button
                      class="direction-btn forward"
                      :class="{ active: currentDirection === 'forward' }"
                      @click="handleExecuteMovement('forward')"
                      :disabled="isExecutingMovement"
                    >
                      <span class="direction-icon">↑</span>
                      <span class="direction-label">前进</span>
                    </button>
                    <div class="direction-middle-row">
                      <button
                        class="direction-btn left"
                        :class="{ active: currentDirection === 'left' }"
                        @click="handleExecuteMovement('left')"
                        :disabled="isExecutingMovement"
                      >
                        <span class="direction-icon">↺</span>
                        <span class="direction-label">左转</span>
                      </button>
                      <button
                        class="direction-btn stop emergency"
                        :class="{ active: currentDirection === 'stop' }"
                        @click="handleExecuteMovement('stop')"
                      >
                        <span class="direction-icon">■</span>
                        <span class="direction-label">紧急停止</span>
                      </button>
                      <button
                        class="direction-btn right"
                        :class="{ active: currentDirection === 'right' }"
                        @click="handleExecuteMovement('right')"
                        :disabled="isExecutingMovement"
                      >
                        <span class="direction-icon">↻</span>
                        <span class="direction-label">右转</span>
                      </button>
                    </div>
                    <div class="direction-bottom-row">
                      <button
                        class="direction-btn march"
                        :class="{ active: currentDirection === 'march' }"
                        @click="handleExecuteMovement('march')"
                        :disabled="isExecutingMovement"
                      >
                        <span class="direction-icon">⬆⬇</span>
                        <span class="direction-label">踏步</span>
                      </button>
                      <button
                        class="direction-btn backward"
                        :class="{ active: currentDirection === 'backward' }"
                        @click="handleExecuteMovement('backward')"
                        :disabled="isExecutingMovement"
                      >
                        <span class="direction-icon">↓</span>
                        <span class="direction-label">后退</span>
                      </button>
                    </div>
                  </div>

                  <!-- 右移按钮 -->
                  <button
                    class="direction-btn side-btn right-move"
                    :class="{ active: currentDirection === 'right-move' }"
                    :disabled="isExecutingMovement"
                    @click="handleExecuteMovement('right-move')"
                  >
                    <span class="direction-icon">→</span>
                    <span class="direction-label">右移</span>
                  </button>
                </div>
              </div>

              <!-- 单步移动控制 -->
              <div class="single-step-panel">
                <h4>单步移动控制</h4>
                <div class="single-step-buttons">
                  <button
                    class="btn btn-step forward-step"
                    @click="executeSingleStep('forward')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">↑</span>
                    <span class="step-label">前进一步</span>
                  </button>
                  <button
                    class="btn btn-step backward-step"
                    @click="executeSingleStep('backward')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">↓</span>
                    <span class="step-label">后退一步</span>
                  </button>
                  <button
                    class="btn btn-step left-turn-step"
                    @click="executeSingleStep('turn_left')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">↺</span>
                    <span class="step-label">左转一下</span>
                  </button>
                  <button
                    class="btn btn-step right-turn-step"
                    @click="executeSingleStep('turn_right')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">↻</span>
                    <span class="step-label">右转一下</span>
                  </button>
                  <button
                    class="btn btn-step left-move-step"
                    @click="executeSingleStep('left')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">←</span>
                    <span class="step-label">左移一步</span>
                  </button>
                  <button
                    class="btn btn-step right-move-step"
                    @click="executeSingleStep('right')"
                    :disabled="isExecutingSingleStep"
                  >
                    <span class="step-icon">→</span>
                    <span class="step-label">右移一步</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 第二层：两个功能模块水平排列 -->
      <section class="modules-layer">
        <div class="modules-grid" style="grid-template-columns: 1fr 1fr; gap: 32px;">

          <!-- 左侧模块：语音库管理 -->
          <div class="module-section voice-module">
            <div class="module-header">
              <h3>🎤 语音库管理</h3>
              <div class="module-status" :class="voiceStatus">{{ voiceStatusText }}</div>
            </div>

            <div class="module-content">
              <!-- 语音库统计 -->
              <div class="library-stats">
                <span>共 {{ voiceLibrary.length }} 条语音</span>
                <button class="btn btn-small btn-secondary" @click="goToChatInteractionPage">💬 交互</button>
                <button class="btn btn-small btn-primary" @click="handleShowAddDialog">+ 添加语音</button>
              </div>



              <!-- 语音列表 -->
              <div class="voice-list scrollable-list">
                <!-- 空状态提示 -->
                <div v-if="voiceLibrary.length === 0" class="empty-state">
                  <div class="empty-icon">🎤</div>
                  <div class="empty-text">暂无语音数据</div>
                  <div class="empty-hint">点击"+ 添加语音"按钮创建第一条语音</div>
                </div>

                <!-- 语音条目列表 -->
                <div
                  class="voice-item"
                  v-for="voice in voiceLibrary"
                  :key="voice.id"
                  :class="{ playing: playingVoiceId === voice.id }"
                >
                  <div class="voice-header">
                    <div class="voice-info">
                      <span class="voice-title">{{ voice.title }}</span>
                      <div class="voice-meta">
                        <span class="voice-category">{{ getCategoryName(voice.category) }}</span>
                      </div>
                    </div>
                    <div class="voice-actions">
                      <button
                        class="btn btn-mini btn-execute"
                        @click="handleExecuteVoiceAction(voice)"
                        :disabled="isSpeaking"
                      >
                        执行
                      </button>
                      <button
                        class="btn btn-mini btn-edit"
                        @click="handleEditVoiceText(voice)"
                      >
                        编辑
                      </button>
                      <button
                        class="btn btn-mini btn-delete"
                        @click="handleDeleteVoiceText(voice)"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div class="voice-content">{{ voice.content }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧模块：上肢动作库管理 -->
          <div class="module-section arm-module">
            <div class="module-header">
              <h3>🦾 上肢动作库</h3>
              <div class="module-status" :class="armStatus">{{ armStatusText }}</div>
            </div>

            <div class="module-content">
              <!-- 动作库统计 -->
              <div class="library-stats">
                <span>共 {{ actionLibrary.length }} 个动作</span>
                <div class="library-actions">
                  <button class="btn btn-small btn-primary" @click="handleExecuteTaiji" :disabled="isExecutingTaiji">
                    {{ isExecutingTaiji ? '太极中...' : '太极' }}
                  </button>
                  <button class="btn btn-small btn-secondary" @click="handleLoadActionLibrary" :disabled="isLoadingActions">
                    {{ isLoadingActions ? '刷新中...' : '刷新' }}
                  </button>
                </div>
              </div>

              <!-- 搜索和筛选 -->
              <div class="action-controls">
                <div class="search-box">
                  <input
                    type="text"
                    v-model="actionSearchText"
                    placeholder="搜索动作名称..."
                    class="search-input"
                  >
                </div>
                <div class="filter-controls">
                  <select v-model="selectedActionCategory" class="filter-select">
                    <option value="">所有分类</option>
                    <option value="basic">基础动作</option>
                    <option value="gesture">手势动作</option>
                    <option value="manipulation">操作动作</option>
                    <option value="expression">表达动作</option>
                  </select>
                </div>
              </div>

              <!-- 动作列表 -->
              <div class="action-list scrollable-list">
                <div
                  class="action-item"
                  v-for="action in filteredActionLibrary"
                  :key="action.id"
                  :class="{ executing: executingActionId === action.id }"
                >
                  <div class="action-header">
                    <div class="action-info">
                      <span class="action-name">{{ action.name }}</span>
                      <div class="action-meta">
                        <span class="action-category">{{ getActionCategoryName(action.category) }}</span>
                        <span class="action-duration">{{ action.duration }}s</span>
                      </div>
                    </div>
                    <div class="action-actions">
                      <button
                        class="btn btn-mini btn-execute"
                        @click="handleExecuteAction(action)"
                        :disabled="isExecutingArmAction"
                      >
                        {{ executingActionId === action.id ? '执行中' : '执行' }}
                      </button>
                    </div>
                  </div>
                  <div class="action-description">{{ action.description }}</div>
                  <div v-if="executingActionId === action.id" class="action-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" :style="{ width: armProgress + '%' }"></div>
                    </div>
                    <span class="progress-text">{{ armProgress }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <!-- 调试信息面板 -->
      <section class="debug-panel" style="background: rgba(0, 20, 40, 0.6); border: 1px solid rgba(255, 255, 0, 0.3); border-radius: 8px; padding: 15px; margin-top: 20px;">
        <h4 style="color: #ffeb3b; margin: 0 0 10px 0;">🔧 系统状态监控</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; font-size: 13px;">
          <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
            <div style="color: #4da6ff; font-weight: bold; margin-bottom: 5px;">🎵 语音系统</div>
            <div style="color: #ffffff;">状态: {{ isSpeaking ? '播放中' : '空闲' }}</div>
            <div style="color: #ffffff;">语音库: {{ voiceLibrary.length }} 条</div>
            <div style="color: #ffffff;">当前播放: {{ playingVoiceId ? `ID ${playingVoiceId}` : '无' }}</div>
          </div>
          <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
            <div style="color: #4da6ff; font-weight: bold; margin-bottom: 5px;">🦾 上肢系统</div>
            <div style="color: #ffffff;">状态: {{ isExecutingArmAction ? '执行中' : '空闲' }}</div>
            <div style="color: #ffffff;">动作库: {{ actionLibrary.length }} 个</div>
            <div style="color: #ffffff;">执行进度: {{ armProgress }}%</div>
          </div>
          <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
            <div style="color: #4da6ff; font-weight: bold; margin-bottom: 5px;">🦵 下肢系统</div>
            <div style="color: #ffffff;">状态: {{ isExecutingMovement ? '执行中' : '空闲' }}</div>
            <div style="color: #ffffff;">当前动作: {{ currentMovement }}</div>
            <div style="color: #ffffff;">位置: X{{ position.x }}, Y{{ position.y }}</div>
          </div>
          <div style="background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">
            <div style="color: #4da6ff; font-weight: bold; margin-bottom: 5px;">📹 摄像头</div>
            <div style="color: #ffffff;">状态: {{ cameraConnected ? '已连接' : '未连接' }}</div>
            <div style="color: #ffffff;">{{ cameraStatus }}</div>
            <div style="color: #ffffff;">全屏: {{ isFullscreen ? '是' : '否' }}</div>
          </div>
        </div>
        <div style="margin-top: 10px; padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 4px; font-size: 11px; color: #cccccc;">
          <strong>API端点:</strong> TTS: /api/tts/* | 机器人: /api/robot/* | 移动: /api/robot_movement/* | 摄像头: /api/video/*
        </div>
      </section>
    </main>

    <!-- 添加/编辑语音对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="handleCloseDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '添加语音' : '编辑语音' }}</h3>
          <button class="dialog-close" @click="handleCloseDialog">×</button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>标题</label>
            <input type="text" v-model="dialogData.title" placeholder="输入语音标题">
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="dialogData.content" placeholder="输入语音内容" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>动作</label>
            <select v-model="dialogData.action">
              <option value="">请选择动作</option>
              <option v-for="action in actionLibrary" :key="action.id" :value="action.name">
                {{ action.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="handleCloseDialog">取消</button>
          <button class="btn btn-primary" @click="handleSaveVoiceData">保存</button>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { voiceApi } from '../api/voiceApi.js'
import { movementApi } from '../api/movementApi.js'
import { cameraApi } from '../api/cameraApi.js'
import { realRobotApi } from '../api/realRobotApi.js'

import { activityScenesApi } from '../api/activityScenesApi.js'
import { moveHeadUp, moveHeadDown, moveHeadLeft, moveHeadRight, resetHead, stopHead, getHeadStatus } from '../api/simulationHeadApi'
// 其它API如有需要可继续补充

const router = useRouter()
const route = useRoute()

// 摄像头相关数据
const cameraConnected = ref(false)
const cameraLoading = ref(false)
const cameraStatus = ref('摄像头未连接')
const cameraStreamUrl = ref('')
const cameraVideo = ref(null)
const cameraImage = ref(null)
const useFallbackImage = ref(true) // 默认使用图片模式显示MJPEG流
const isFullscreen = ref(false) // 全屏状态

// 语音控制相关
const voiceStatus = ref('online')
const voiceStatusText = ref('语音系统就绪')
const isSpeaking = ref(false)
const playingVoiceId = ref(null)

// 语音库数据和搜索筛选 - 只使用接口返回的数据
const voiceLibrary = ref([])

// 当前板块信息
const currentSceneInfo = ref({
  id: null,
  title: '未知板块',
  description: ''
})







// 获取板块信息
const fetchSceneInfo = async (sceneId) => {
  try {
    console.log('🔍 获取板块信息，ID:', sceneId)

    // 先设置备用标题（从query参数获取或默认）
    const backupTitle = route.query.sceneTitle || `条目${sceneId}`
    currentSceneInfo.value.title = backupTitle

    const response = await activityScenesApi.getSceneDetail(sceneId)

    if (response && response.data) {
      const sceneData = response.data
      console.log('📋 获取到板块信息:', sceneData)

      currentSceneInfo.value = {
        id: sceneData.id || sceneId,
        title: sceneData.title || sceneData.name || backupTitle,
        description: sceneData.description || ''
      }

      console.log('✅ 板块信息更新完成:', currentSceneInfo.value)
    } else {
      console.warn('⚠️ 未获取到板块信息，使用备用标题:', backupTitle)
      currentSceneInfo.value.title = backupTitle
    }
  } catch (error) {
    console.error('❌ 获取板块信息失败:', error)
    const backupTitle = route.query.sceneTitle || `条目${sceneId}`
    currentSceneInfo.value.title = backupTitle
    console.log('🔄 使用备用标题:', backupTitle)
  }
}

// 语音相关方法
const fetchVoiceTexts = async () => {
  try {
    // 获取路由参数中的条目ID，如果没有则从query参数中获取
    const sceneId = route.params.id || route.query.fromItem
    console.log('🔄 ===== 开始获取语音文本 =====')
    console.log('🔄 当前路由:', route.path)
    console.log('🔄 路由参数:', route.params)
    console.log('🔄 查询参数:', route.query)
    console.log('🔄 条目ID:', sceneId, '类型:', typeof sceneId)
    console.log('🌐 API端点:', sceneId ? `/scene_actions?scene_id=${sceneId}` : '/scene_actions')
    voiceStatusText.value = '正在加载语音库...'

    const result = await voiceApi.getVoiceTexts(sceneId)
    console.log('📥 API响应完整数据:', JSON.stringify(result, null, 2))
    console.log('📚 API返回的原始数据:', result)
    console.log('📊 返回数据类型:', typeof result, '是否为对象:', typeof result === 'object')

    // 检查不同可能的数据结构
    console.log('🔍 检查数据结构:')
    console.log('- result.success:', result?.success)
    console.log('- result.data:', result?.data)
    console.log('- result.data.scene_actions:', result?.data?.scene_actions)
    console.log('- result直接是数组:', Array.isArray(result))
    console.log('- result.data直接是数组:', Array.isArray(result?.data))

    // 尝试多种数据结构处理方式
    let sceneActions = null

    if (result && result.success && result.data && result.data.scene_actions) {
      // 原有的数据结构：result.data.scene_actions
      sceneActions = result.data.scene_actions
      console.log('✅ 使用原有数据结构: result.data.scene_actions')
    } else if (result && Array.isArray(result.data)) {
      // 新的数据结构：result.data直接是数组
      sceneActions = result.data
      console.log('✅ 使用新数据结构: result.data')
    } else if (Array.isArray(result)) {
      // 最简单的数据结构：result直接是数组
      sceneActions = result
      console.log('✅ 使用最简数据结构: result')
    }

    if (sceneActions && Array.isArray(sceneActions)) {
      console.log('📝 开始转换服务器数据格式...')
      console.log('📝 提取的scene_actions数组:', sceneActions)
      console.log('📊 scene_actions数组长度:', sceneActions.length)

      // 验证数据是否按scene_id正确筛选
      const currentSceneId = parseInt(sceneId)
      console.log('🔍 当前请求的scene_id:', currentSceneId)
      console.log('🔍 返回数据中的scene_id分布:', sceneActions.map(item => item.scene_id))

      // 将服务器数据转换为前端格式
      const serverTexts = sceneActions.map((item, index) => {
        console.log(`📝 处理语音数据${index + 1}:`, {
          id: item.id,
          scene_id: item.scene_id,
          title: item.title,
          voice_text: item.voice_text?.substring(0, 30) + '...'
        })

        const converted = {
          // 根据API文档调整字段映射
          id: item.id,
          scene_id: item.scene_id,  // 添加scene_id字段
          title: item.title || `语音文本${item.id}`,
          content: item.voice_text || '',  // voice_text -> content
          category: item.action_text || 'custom',  // action_text -> category (临时映射)
          action: item.action_text || '',  // 新增action字段
          language: 'zh-CN',
          created_at: item.created_at,
          updated_at: item.updated_at,
          duration: Math.round(((item.voice_text || '')?.length || 0) * 0.1 * 10) / 10,
          volume: 80,
          speed: 1.0,
          pitch: 1.0,
          showSettings: false,
          originalData: item  // 保留原始数据用于调试
        }
        console.log(`📝 转换第${index + 1}条:`, {
          原始数据: {
            id: item.id,
            text_id: item.text_id,
            title: item.title,
            content: (item.content || '').substring(0, 30) + '...'
          },
          转换后: {
            id: converted.id,
            title: converted.title,
            content: converted.content.substring(0, 30) + '...'
          }
        })
        return converted
      })

      // 强制更新 voiceLibrary
      voiceLibrary.value.splice(0, voiceLibrary.value.length, ...serverTexts)
      voiceStatusText.value = `语音库已加载，共 ${serverTexts.length} 条`
      console.log('✅ 语音文本加载完成，数量:', serverTexts.length)
    } else {
      console.log('ℹ️ 服务器返回空的语音文本列表或数据结构不正确')
      console.log('ℹ️ 返回的数据结构:', result)
      voiceLibrary.value = []
      voiceStatusText.value = '语音库为空或数据格式错误'
    }
  } catch (error) {
    console.error('❌ 获取语音文本失败:', error)
    console.error('❌ 错误详情:', error.message, error.stack)
    voiceStatusText.value = `获取语音库失败: ${error.message}`
  }
}



// 执行语音和动作 - 双接口调用实现
const handleExecuteVoiceAction = async (voice) => {
  if (isSpeaking.value) {
    console.log('🎵 语音正在播放中，忽略新的执行请求')
    return
  }

  try {
    console.log('🎵 ===== 开始执行语音和动作 =====')
    console.log('🎵 语音内容:', voice.content)
    console.log('🎵 动作信息:', voice.action)
    console.log('🎵 语音参数:', {
      speed: voice.speed,
      pitch: voice.pitch,
      volume: voice.volume,
      duration: voice.duration
    })

    // 设置执行状态
    playingVoiceId.value = voice.id
    isSpeaking.value = true
    voiceStatusText.value = '正在执行语音和动作...'

    // 准备并发执行的Promise数组
    const promises = []
    const results = {}

    // 1. 语音合成接口调用 - 使用/api-voice代理到TTS服务
    if (voice.content && voice.content.trim()) {
      console.log('🎤 准备调用TTS接口...')
      const ttsPromise = voiceApi.synthesizeText(voice.content.trim(), {
        voice_id: 'zh-CN',
        speed: voice.speed || 1.0,
        pitch: voice.pitch || 1.0,
        volume: (voice.volume || 80) / 100, // 转换为0-1范围
        play_immediately: true // 让后端直接播放
      }).then(result => {
        console.log('✅ TTS接口调用成功:', result)
        results.tts = result
        return result
      }).catch(error => {
        console.error('❌ TTS接口调用失败:', error)
        results.ttsError = error
        throw new Error(`语音合成失败: ${error.message}`)
      })
      promises.push(ttsPromise)
    } else {
      console.log('⚠️ 语音内容为空，跳过TTS调用')
    }

    // 2. 机器人动作执行接口调用 - 使用/api-robot-real代理到真实机器人服务
    if (voice.action && voice.action.trim()) {
      console.log('🤖 准备调用机器人执行接口...')
      console.log('🤖 动作名称:', voice.action.trim())
      console.log('🤖 执行参数:', { duration: voice.duration || 3.0 })

      const robotPromise = realRobotApi.executeAction(voice.action.trim(), {
        duration: voice.duration || 3.0
      }).then(result => {
        console.log('✅ 机器人执行接口调用成功:', result)
        results.robot = result
        return result
      }).catch(error => {
        console.error('❌ 机器人执行接口调用失败:', error)
        console.error('❌ 错误详情:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url
        })
        results.robotError = error
        throw new Error(`动作执行失败: ${error.message}`)
      })
      promises.push(robotPromise)
    } else {
      console.log('⚠️ 动作信息为空，跳过机器人执行调用')
    }

    // 检查是否有有效的执行内容
    if (promises.length === 0) {
      throw new Error('语音内容和动作信息都为空，无法执行')
    }

    // 并发执行所有接口调用
    console.log(`🚀 开始并发执行 ${promises.length} 个接口...`)
    voiceStatusText.value = `正在执行${promises.length === 2 ? '语音合成和动作' : promises.length === 1 ? (voice.content ? '语音合成' : '动作执行') : ''}...`

    await Promise.allSettled(promises)

    // 检查执行结果
    const hasErrors = results.ttsError || results.robotError
    if (hasErrors) {
      const errorMessages = []
      if (results.ttsError) errorMessages.push(`语音: ${results.ttsError.message}`)
      if (results.robotError) errorMessages.push(`动作: ${results.robotError.message}`)
      throw new Error(errorMessages.join('; '))
    }

    console.log('✅ 所有接口调用成功')
    console.log('📊 执行结果汇总:', results)

    // 计算总执行时间（取语音和动作的最大时间）
    const estimatedDuration = Math.max(
      voice.content ? (voice.content.length * 0.15) : 0, // 语音时长估算
      voice.duration || 3.0 // 动作时长
    )

    voiceStatusText.value = '执行中...'

    // 设置执行完成的定时器
    setTimeout(() => {
      isSpeaking.value = false
      playingVoiceId.value = null
      voiceStatusText.value = '执行完成'
      console.log('✅ 语音和动作执行完成')

      // 2秒后恢复状态显示
      setTimeout(() => {
        voiceStatusText.value = `语音库已加载，共 ${voiceLibrary.value.length} 条`
      }, 2000)
    }, estimatedDuration * 1000)

  } catch (error) {
    console.error('❌ 语音和动作执行失败:', error)

    // 重置状态
    isSpeaking.value = false
    playingVoiceId.value = null
    voiceStatusText.value = `执行失败: ${error.message}`

    // 显示错误提示
    alert(`执行失败: ${error.message}`)

    // 3秒后恢复状态显示
    setTimeout(() => {
      voiceStatusText.value = `语音库已加载，共 ${voiceLibrary.value.length} 条`
    }, 3000)
  }
}


// 删除语音条目
const handleDeleteVoiceText = async (voice) => {
  if (confirm(`确定要删除语音"${voice.title}"吗？`)) {
    try {
      console.log('🗑️ 准备删除语音文本，ID:', voice.id)

      // 调用API删除后端数据 - 机器人综合管理中心使用 scene_actions 接口
      const result = await voiceApi.deleteVoiceText(voice.id, true)

      if (result.success) {
        console.log('✅ 后端删除成功，刷新语音库列表')

        // 重新获取语音库数据，确保前后端同步
        await fetchVoiceTexts()

        // 显示成功提示
        showSuccess(`语音"${voice.title}"删除成功`)
      } else {
        throw new Error(result.message || '删除失败')
      }
    } catch (error) {
      console.error('❌ 语音删除失败:', error)
      alert(`删除失败: ${error.message}`)
    }
  }
}



// 对话框相关
const showDialog = ref(false)
const dialogMode = ref('add') // 'add' 或 'edit'
const dialogData = reactive({
  id: null,
  title: '',
  content: '',
  category: '',
  action: ''
})

// 成功提示相关
const showSuccessToast = ref(false)
const successMessage = ref('')

// 显示成功提示的函数
const showSuccess = (message) => {
  successMessage.value = message
  showSuccessToast.value = true

  // 3秒后自动隐藏
  setTimeout(() => {
    showSuccessToast.value = false
  }, 3000)
}

// 上肢控制相关
const armStatus = ref('online')
const armStatusText = ref('上肢系统就绪')
const isExecutingArmAction = ref(false)
const executingActionId = ref(null)
const armProgress = ref(0)
const isLoadingActions = ref(false)

// 太极动作相关
const isExecutingTaiji = ref(false)

// 动作库数据和搜索筛选
const actionLibrary = ref([])
const actionSearchText = ref('')
const selectedActionCategory = ref('')

// 动作库过滤
const filteredActionLibrary = computed(() => {
  return actionLibrary.value.filter(action => {
    const matchesSearch = !actionSearchText.value ||
      action.name.toLowerCase().includes(actionSearchText.value.toLowerCase()) ||
      action.description.toLowerCase().includes(actionSearchText.value.toLowerCase())
    const matchesCategory = !selectedActionCategory.value || action.category === selectedActionCategory.value
    return matchesSearch && matchesCategory
  })
})

// 动作库相关方法
const handleLoadActionLibrary = async () => {
  isLoadingActions.value = true
  try {
    console.log('📚 正在从API加载动作库...')
    armStatusText.value = '正在加载动作库...'

    // 临时修改：如果真实机器人服务器不可用，尝试使用仿真机器人服务器
    let response
    try {
      console.log('📚 尝试从真实机器人服务器加载动作库...')
      response = await movementApi.getRobotActions()
      console.log('真实机器人动作列表API响应:', response)
    } catch (error) {
      console.warn('❌ 真实机器人服务器不可用，尝试仿真机器人服务器:', error.message)
      console.log('📚 尝试从仿真机器人服务器加载动作库...')
      response = await movementApi.getSimulationActions()
      console.log('仿真机器人动作列表API响应:', response)
    }

    if (response.success) {
      // 服务器返回格式: { success: true, data: { success: true, actions: [...] } }
      console.log('API调用成功，解析动作数据...')
      console.log('完整响应数据:', JSON.stringify(response, null, 2))

      let actionsData = null

      // 根据实际的服务器响应结构解析数据
      // 服务器返回: { success: true, data: { success: true, message: "...", data: { success: true, actions: [...] } } }

      if (response.data && response.data.data && response.data.data.actions && Array.isArray(response.data.data.actions)) {
        // 实际格式: response.data.data.actions
        actionsData = response.data.data.actions
        console.log('✅ 找到动作数据（三层嵌套），数量:', actionsData.length)
      } else if (response.data && response.data.actions && Array.isArray(response.data.actions)) {
        // 备用格式: response.data.actions
        actionsData = response.data.actions
        console.log('✅ 找到动作数据（二层嵌套），数量:', actionsData.length)
      } else if (Array.isArray(response.data)) {
        // 备用格式: response.data 直接是数组
        actionsData = response.data
        console.log('✅ 找到动作数据（直接数组），数量:', actionsData.length)
      } else {
        console.error('❌ 未找到actions数组')
        console.error('response.data结构:', response.data)
        if (response.data && response.data.data) {
          console.error('response.data.data结构:', response.data.data)
          console.error('response.data.data的keys:', Object.keys(response.data.data))
        }
      }

      if (actionsData && Array.isArray(actionsData) && actionsData.length > 0) {
        const apiActions = parseApiActions(actionsData)
        actionLibrary.value = apiActions
        armStatusText.value = `动作库已加载，共 ${apiActions.length} 个动作`
        console.log('✅ 动作库加载完成，解析后动作数量:', apiActions.length)
      } else {
        console.warn('❌ 动作数据为空或格式不正确')
        console.warn('actionsData:', actionsData)
        actionLibrary.value = [...defaultActions]
        armStatusText.value = '动作数据为空，使用默认动作'
      }
    } else {
      // API调用失败，使用默认动作
      const errorMessage = response.error || response.message || '未知错误'
      console.warn('API获取动作列表失败，使用默认动作:', errorMessage)
      actionLibrary.value = [...defaultActions]
      armStatusText.value = `加载动作库失败: ${errorMessage}`
    }
  } catch (error) {
    console.error('❌ 加载动作库失败:', error)
    actionLibrary.value = [...defaultActions]
    armStatusText.value = `加载动作库失败: ${error.message}`
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

// 默认动作列表
const defaultActions = [
  {
    id: 1,
    name: '挥手',
    description: '机器人挥手动作',
    category: 'gesture',
    difficulty: 'easy',
    duration: 2.0,
    showSteps: false,
    steps: [
      { description: '准备挥手', duration: 0.5 },
      { description: '执行挥手', duration: 1.0 },
      { description: '完成挥手', duration: 0.5 }
    ]
  },
  {
    id: 2,
    name: '点头',
    description: '机器人点头动作',
    category: 'gesture',
    difficulty: 'easy',
    duration: 1.5,
    showSteps: false,
    steps: [
      { description: '准备点头', duration: 0.3 },
      { description: '执行点头', duration: 0.9 },
      { description: '完成点头', duration: 0.3 }
    ]
  }
]

const handleExecuteAction = async (action) => {
  if (isExecutingArmAction.value) return

  isExecutingArmAction.value = true
  executingActionId.value = action.id
  armProgress.value = 0

  console.log('🦾 开始执行上肢动作:', action.name)

  // 启动进度条动画
  const progressInterval = setInterval(() => {
    if (armProgress.value < 90) {
      armProgress.value += 5
    }
  }, (action.duration * 1000) / 18)

  try {
    const result = await movementApi.executeAction(action)

    if (result.success) {
      console.log('✅ 机器人动作执行成功')
      armProgress.value = 100

      setTimeout(() => {
        clearInterval(progressInterval)
        isExecutingArmAction.value = false
        executingActionId.value = null
        armProgress.value = 0
        console.log('🦾 上肢动作执行完成:', action.name)
      }, 500)
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('❌ 上肢动作执行异常:', error)
    clearInterval(progressInterval)
    isExecutingArmAction.value = false
    executingActionId.value = null
    armProgress.value = 0
    alert(`动作执行失败: ${error.message}`)
  }
}

// 太极动作执行方法
const handleExecuteTaiji = async () => {
  if (isExecutingTaiji.value) return

  isExecutingTaiji.value = true
  console.log('🥋 开始执行太极动作')

  try {
    const result = await realRobotApi.executeTaijiAction({
      duration: 30.0 // 太极动作通常需要较长时间
    })

    if (result && result.success !== false) {
      console.log('✅ 太极动作执行成功')
      armStatusText.value = '太极动作执行中...'

      // 模拟太极动作执行时间（30秒）
      setTimeout(() => {
        isExecutingTaiji.value = false
        armStatusText.value = '太极动作执行完成'
        console.log('🥋 太极动作执行完成')

        // 3秒后恢复状态文本
        setTimeout(() => {
          armStatusText.value = '上肢系统就绪'
        }, 3000)
      }, 30000)
    } else {
      throw new Error(result?.error || '太极动作执行失败')
    }
  } catch (error) {
    console.error('❌ 太极动作执行异常:', error)
    isExecutingTaiji.value = false
    armStatusText.value = '上肢系统就绪'

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
    }

    alert(errorMessage)
  }
}

// 下肢控制相关
const legStatus = ref('online')
const legStatusText = ref('下肢系统就绪')
const isExecutingMovement = ref(false)
const currentMovement = ref('静止')
const currentDirection = ref('stop')
const position = reactive({ x: 0, y: 0 })

// 单步移动控制相关
const isExecutingSingleStep = ref(false)

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

// 基础方法
const goBack = () => {
  const sceneId = route.params.id || route.query.fromItem;
  if (sceneId) {
    router.push(`/scene-detail/${sceneId}`);
  } else {
    router.push('/activity-scenes');
  }
}


const goToChatInteractionPage = () => {
  router.push('/chat-interaction');
};

// 系统控制方法
const handleRefreshAllStatus = async () => {
  try {
    console.log('🔄 开始刷新所有系统状态...')

    // 更新状态文本
    voiceStatusText.value = '正在刷新语音库...'
    armStatusText.value = '正在刷新动作库...'
    cameraStatus.value = '正在刷新摄像头...'

    const result = await movementApi.refreshAllStatus()

    if (result.success) {
      // 更新数据
      voiceLibrary.value = result.data.voiceTexts
      actionLibrary.value = result.data.actionList
      cameraConnected.value = result.data.cameraStatus.connected

      // 更新状态文本
      voiceStatusText.value = `语音库已加载，共 ${result.data.voiceTexts.length} 条`
      armStatusText.value = `动作库已加载，共 ${result.data.actionList.length} 个动作`
      cameraStatus.value = result.data.cameraStatus.connected ? '摄像头已连接' : '摄像头未连接'

      console.log('✅ 所有系统状态刷新完成')
    }
  } catch (error) {
    console.error('❌ 刷新系统状态时出现错误:', error)
    alert(`刷新失败: ${error.message}`)
  }
}

const handleEmergencyStopAll = async () => {
  try {
    console.log('🚨 执行紧急停止所有系统')

    // 本地状态重置
    isSpeaking.value = false
    playingVoiceId.value = null
    isExecutingArmAction.value = false
    executingActionId.value = null
    isExecutingMovement.value = false
    currentMovement.value = '紧急停止'
    currentDirection.value = 'stop'

    // 调用系统API
    await movementApi.emergencyStopAll()

    alert('所有系统已紧急停止')
  } catch (error) {
    console.error('❌ 紧急停止失败:', error)
    alert(`紧急停止失败: ${error.message}`)
  }
}

const handleExportAllData = async () => {
  try {
    await movementApi.exportAllData()
    alert('数据导出成功')
  } catch (error) {
    console.error('❌ 导出数据失败:', error)
    alert(`导出失败: ${error.message}`)
  }
}

// 对话框相关方法
const handleShowAddDialog = () => {
  dialogMode.value = 'add'
  dialogData.id = null
  dialogData.title = ''
  dialogData.content = ''
  dialogData.category = ''
  dialogData.action = ''
  showDialog.value = true
}

const handleEditVoiceText = (voice) => {
  console.log('✏️ ===== 开始编辑语音 =====')
  console.log('✏️ 编辑的语音数据:', voice)
  console.log('✏️ 语音ID:', voice.id, '类型:', typeof voice.id)

  dialogMode.value = 'edit'
  dialogData.id = voice.id
  dialogData.title = voice.title
  dialogData.content = voice.content
  dialogData.category = voice.category
  dialogData.action = voice.action || voice.category  // 使用action字段，如果没有则使用category

  console.log('✏️ 设置的dialogData:', {
    mode: dialogMode.value,
    id: dialogData.id,
    title: dialogData.title,
    content: dialogData.content,
    action: dialogData.action
  })

  showDialog.value = true
}

const handleCloseDialog = () => {
  showDialog.value = false
}

const handleSaveVoiceData = async () => {
  try {
    console.log('💾 ===== 保存语音数据 =====')
    console.log('💾 当前模式:', dialogMode.value)
    console.log('💾 dialogData:', {
      id: dialogData.id,
      title: dialogData.title,
      content: dialogData.content,
      action: dialogData.action
    })

    // 转换为后端期望的数据格式
    const sceneId = route.params.id || route.query.fromItem || 1  // 使用当前条目ID，如果没有则默认为1
    console.log('💾 当前路由:', route.path)
    console.log('💾 条目ID:', sceneId, '类型:', typeof sceneId)

    const voiceData = {
      title: dialogData.title,
      voice_text: dialogData.content,  // content -> voice_text
      action_text: dialogData.action,  // 直接使用中文动作名称
      scene_id: parseInt(sceneId)      // 使用当前条目的ID
    }

    console.log('💾 准备保存的数据:', voiceData)
    console.log('💾 当前模式:', dialogMode.value)

    // 根据模式选择API调用
    if (dialogMode.value === 'edit') {
      console.log('📤 更新语音文本，ID:', dialogData.id)
      await voiceApi.updateVoiceText(dialogData.id, voiceData)
      console.log('✅ 语音文本更新成功')
    } else {
      console.log('📤 创建新语音文本')
      await voiceApi.saveVoiceText(voiceData)
      console.log('✅ 语音文本创建成功')
    }
    await fetchVoiceTexts()
    handleCloseDialog()

    // 显示成功提示（不阻塞用户操作）
    const message = dialogMode.value === 'add' ? '语音文本添加成功' : '语音文本更新成功'
    showSuccess(message)
  } catch (error) {
    console.error('❌ 保存语音文本失败:', error)
    alert(`保存失败: ${error.message}`)
  }
}



// 移动控制相关方法
const handleExecuteMovement = async (direction) => {
  if (isExecutingMovement.value && direction !== 'stop') return

  isExecutingMovement.value = true
  currentDirection.value = direction
  currentMovement.value = movementApi.getMovementLabel(direction)

  console.log('🦵 开始执行移动动作:', direction)

  try {
    const result = await movementApi.executeMovement(direction)

    if (result.success) {
      console.log(`✅ ${result.actionName}指令发送成功`)
      currentMovement.value = `${movementApi.getMovementLabel(direction)}中...`

      // 根据不同动作类型设置不同的执行时间
      let executionTime = 2000
      if (direction === 'stop') {
        executionTime = 500
      } else if (direction === 'left' || direction === 'right') {
        executionTime = 1500
      }
      // 踏步动作和其他移动动作一样，使用默认的2000ms执行时间

      setTimeout(() => {
        isExecutingMovement.value = false
        currentDirection.value = 'stop'
        currentMovement.value = '静止'

        if (direction !== 'stop') {
          updatePosition(direction)
        }

        console.log(`🦵 ${result.actionName}动作执行完成`)
      }, executionTime)

    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('❌ 移动动作执行异常:', error)
    currentMovement.value = '执行异常'
    alert(`移动控制失败: ${error.message}`)

    setTimeout(() => {
      isExecutingMovement.value = false
      currentDirection.value = 'stop'
      currentMovement.value = '静止'
    }, 1500)
  }
}

const updatePosition = (direction) => {
  const step = 10
  switch (direction) {
    case 'forward':
      position.y += step
      break
    case 'backward':
      position.y -= step
      break
    case 'left-move':
      position.x -= step
      break
    case 'right-move':
      position.x += step
      break
  }
}

// 执行单步移动
const executeSingleStep = async (stepType) => {
  if (isExecutingSingleStep.value) {
    console.log('⚠️ 单步移动正在执行中，请等待完成')
    return
  }

  isExecutingSingleStep.value = true

  try {
    console.log(`🦵 执行单步移动: ${stepType}`)

    // 使用统一的movementApi
    const response = await movementApi.executeSingleStep(stepType)

    if (!response.success) {
      throw new Error(`单步移动失败: ${response.error || '未知错误'}`)
    }

    console.log(`✅ 单步移动 ${stepType} 执行成功:`, response.data)

    // 显示成功消息
    const actionNames = {
      'forward': '前进一步',
      'backward': '后退一步',
      'turn_left': '左转一下',
      'turn_right': '右转一下',
      'left': '左移一步',
      'right': '右移一步'
    }

    alert(`${actionNames[stepType]} 执行成功！`)

  } catch (error) {
    console.error(`❌ 单步移动 ${stepType} 执行失败:`, error)

    let errorMessage = `单步移动失败: ${error.message}`
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = '网络连接失败，请检查机器人是否在线'
    } else if (error.message.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接'
    }

    alert(errorMessage)
  } finally {
    isExecutingSingleStep.value = false
  }
}

// 摄像头相关方法
const handleInitializeCamera = async () => {
  cameraLoading.value = true
  cameraStatus.value = '正在连接摄像头...'

  try {
    const response = await cameraApi.testConnection()
    console.log('📹 摄像头连接测试响应:', response)

    // 从Axios响应对象中提取数据
    const result = response.data || response
    console.log('📹 提取的摄像头状态数据:', result)

    if (result && result.connected) {
      cameraConnected.value = true
      cameraStatus.value = '摄像头已连接'
      cameraStreamUrl.value = cameraApi.getStreamUrl()
      console.log('✅ 摄像头连接成功')
    } else {
      cameraConnected.value = false
      cameraStatus.value = result?.error || '摄像头连接失败'
      console.log('❌ 摄像头连接失败:', result?.error)
    }
  } catch (error) {
    console.error('❌ 摄像头初始化异常:', error)
    cameraConnected.value = false
    cameraStatus.value = `连接异常: ${error.message}`
  } finally {
    cameraLoading.value = false
  }
}

const handleToggleCamera = async () => {
  if (cameraConnected.value) {
    // 断开摄像头
    cameraConnected.value = false
    cameraStatus.value = '摄像头已断开'
    cameraStreamUrl.value = ''
  } else {
    // 连接摄像头
    await handleInitializeCamera()
  }
}

const handleToggleFullscreen = () => {
  if (!cameraConnected.value) return

  const videoElement = cameraVideo.value || cameraImage.value
  if (!videoElement) return

  if (!isFullscreen.value) {
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen()
    } else if (videoElement.webkitRequestFullscreen) {
      videoElement.webkitRequestFullscreen()
    } else if (videoElement.mozRequestFullScreen) {
      videoElement.mozRequestFullScreen()
    }
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    }
    isFullscreen.value = false
  }
}

// 视频事件处理方法
const onVideoLoadStart = () => {
  console.log('📹 视频开始加载')
}

const onVideoLoaded = () => {
  console.log('📹 视频数据加载完成')
}

const onVideoPlay = () => {
  console.log('📹 视频开始播放')
}

const onVideoPause = () => {
  console.log('📹 视频暂停')
}

const onVideoEnded = () => {
  console.log('📹 视频播放结束')
}

const onVideoError = (event) => {
  console.error('📹 视频播放错误:', event)
  cameraStatus.value = '视频播放错误'
}

const onVideoCanPlay = () => {
  console.log('📹 视频可以播放')
}

const onVideoWaiting = () => {
  console.log('📹 视频缓冲中')
}

const onImageLoad = () => {
  console.log('📹 图片加载成功')
}

const onImageError = () => {
  console.error('📹 图片加载失败')
  cameraStatus.value = '图片加载失败'
}

// 工具方法
const getCategoryName = (category) => {
  if (!category) return '无动作'
  return category  // 直接显示动作名称
}

const getActionCategoryName = (category) => {
  return movementApi.getActionCategoryName(category)
}

// 生命周期钩子
onMounted(async () => {
  console.log('🚀 综合管理页面已加载，开始初始化...')
  console.log('📊 初始数据状态:')
  console.log('- voiceLibrary length:', voiceLibrary.value.length)
  console.log('- cameraStreamUrl:', cameraStreamUrl.value)

  try {
    // 获取板块信息
    const sceneId = route.params.id || route.query.fromItem
    if (sceneId) {
      console.log('📋 开始获取板块信息...')
      await fetchSceneInfo(sceneId)
    }

    // 初始化摄像头
    console.log('📹 开始初始化摄像头...')
    cameraStreamUrl.value = cameraApi.getStreamUrl()
    console.log('📹 摄像头流URL:', cameraStreamUrl.value)
    await handleInitializeCamera()

    // 获取语音库数据
    console.log('📚 开始获取语音库数据...')
    await fetchVoiceTexts()
    console.log('📚 语音库数据加载完成，数量:', voiceLibrary.value.length)

    // 加载动作库
    console.log('🦾 开始加载动作库...')
    await handleLoadActionLibrary()

    console.log('✅ 所有系统初始化完成')

    // 延迟1秒后检查数据状态
    setTimeout(() => {
      console.log('🔍 初始化后数据检查:')
      console.log('- 语音库数量:', voiceLibrary.value.length)
      console.log('- 动作库数量:', actionLibrary.value.length)
      console.log('- 摄像头状态:', cameraConnected.value)
    }, 1000)

  } catch (error) {
    console.error('❌ 页面初始化过程中出现错误:', error)
  }
})

onUnmounted(() => {
  // 停止所有语音播放
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }

  // 停止聊天轮询
  stopChatPolling()

  console.log('综合管理页面已卸载')
})

// 侦听路由参数的变化，确保返回管理页面时能重新加载场景信息
watch(() => route.params.id, (newId) => {
  if (newId) {
    console.log(`🔄 路由参数变化或组件加载: ID=${newId}，重新加载数据...`);
    fetchSceneInfo(newId);
    fetchVoiceTexts(); // 同时重新加载语音库
  }
}, { immediate: true }); // immediate: true 确保组件初次加载时也能触发

</script>

<style scoped>
@import '../assets/management.css';

/* 成功提示样式 */
.success-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  background: #4CAF50;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
}

.success-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-icon {
  font-size: 16px;
}

.success-text {
  font-size: 14px;
  font-weight: 500;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 覆盖全局CSS中的video-display规则，确保我们的高度设置生效 */
.camera-section .video-display {
  aspect-ratio: unset !important;
  height: 630px !important;
  min-height: 630px !important;
  max-height: 630px !important;
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
.head-control-section {
  width: 340px;
  min-width: 260px;
  background: linear-gradient(135deg, #232b3a 60%, #1a2233 100%);
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1.5px 0 #1976d2 inset;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  border: 1.5px solid #1976d2;
  margin: 0;
  padding: 20px 10px;
  transition: box-shadow 0.3s;
}
.head-control-section:hover {
  box-shadow: 0 8px 32px rgba(0,102,255,0.22), 0 2px 0 #1976d2 inset;
}
.section-header {
  margin-bottom: 30px;
}
.section-header h3 {
  color: #4da6ff;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 0 15px rgba(0, 153, 255, 0.2);
  margin: 0;
}
.direction-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}
.direction-pad {
  display: grid;
  grid-template-columns: repeat(3, 70px);
  grid-template-rows: repeat(3, 70px);
  gap: 10px;
  justify-content: center;
  align-items: center;
}
.func-btn-row {
  display: flex;
  justify-content: center;
  gap: 24px;
}
.head-status-text {
  color: #ffeb3b;
  font-size: 14px;
  min-height: 20px;
  text-align: center;
}
@media (max-width: 900px) {
  .camera-section-row {
    flex-direction: column;
    gap: 18px;
    align-items: stretch;
  }
  .head-control-section {
    width: 100%;
    min-width: 0;
    height: 340px;
    margin: 0 auto;
    margin-bottom: 12px;
    padding: 0 4vw;
  }
  .direction-pad {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 6px;
  }
  /* 在中等屏幕上也覆盖aspect-ratio */
  .camera-section .video-display {
    aspect-ratio: unset !important;
    height: 480px !important;
    min-height: 480px !important;
    max-height: 480px !important;
  }
}
@media (max-width: 600px) {
  .head-control-section {
    min-height: 160px;






    height: auto;
    border-radius: 8px;
    padding: 0 1vw 10px 1vw;
    min-width: 0;
    width: 100%;
  }






















  .section-header h3 {
    font-size: 15px;
























  }
  .direction-section {
    padding: 0 2vw;
  }




  .direction-pad {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    gap: 2vw;
    margin-bottom: 4px;
    min-height: 90px;
    height: auto;
    padding: 6px 0;
  }
  .direction-btn {
    min-width: 10vw;
    min-height: 10vw;
    max-width: 16vw;
    max-height: 16vw;
    font-size: 4vw;
    border-radius: 5vw;
    padding: 0;
    box-sizing: border-box;
  }
  .func-btn-row {
    gap: 4vw;
    margin-top: 2vw;
  }
  .head-status-text {
    font-size: 12px;
    min-height: 14px;
    margin-top: 2px;
  }
  /* 在小屏幕上也覆盖aspect-ratio */
  .camera-section .video-display {
        aspect-ratio: unset !important;
    height: 380px !important;
    min-height: 380px !important;
    max-height: 380px !important;
  }
}
</style>
