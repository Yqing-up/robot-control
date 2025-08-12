<template>
  <div class="container">
    <div class="main-title">机器人控制中心</div>
    <div class="top-buttons">
      <div class="remote-interaction-btn" @click="goRemoteInteraction">远程交互</div>
      <div class="multimodal-perception-btn" @click="goMultimodalPerception">多模态感知</div>
      <div class="health-wellness-btn" @click="goHealthWellness">智能养生</div>
      <div class="health-report-btn" @click="goHealthReport">健康报告</div>
      <div class="management-btn" @click="goManagement">综合管理</div>
    </div>
    <!-- header 已移除 -->
    <main class="main-content">
      <div class="robot-section">
        <div class="side-panel left-panel">
          <!-- 左侧三个系统 -->
          <div class="control-panel brain-panel" data-part="brain" @click="goBrainSystem">
            <div class="panel-header">
              <h3>头部系统</h3>
              <div class="connection-status online"></div>
            </div>
            <div class="panel-description">
              <p class="system-intro">智能决策中心，负责处理信息和控制逻辑运算</p>
              <div class="panel-action">
                <span class="action-hint">点击进入头部系统 →</span>
              </div>
            </div>
          </div>
          <div class="control-panel eyes-panel" data-part="eyes" @click="goVisionSystem">
            <div class="panel-header">
              <h3>视觉系统</h3>
              <div class="connection-status online"></div>
            </div>
            <div class="panel-description">
              <p class="system-intro">高清图像采集，实现环境感知和目标识别</p>
              <div class="panel-action">
                <span class="action-hint">点击进入视觉系统 →</span>
              </div>
            </div>
          </div>
          <div class="control-panel arms-panel" data-part="arms" @click="goArmSystem">
            <div class="panel-header">
              <h3>上肢系统</h3>
              <div class="connection-status online"></div>
            </div>
            <div class="panel-description">
              <p class="system-intro">精密动作执行，提供灵活操作和力量控制</p>
              <div class="panel-action">
                <span class="action-hint">点击进入上肢系统 →</span>
              </div>
            </div>
          </div>
        </div>
        <div class="robot-container">
          <img :src="robotImg" alt="机器人" class="robot-image" id="robotImage" />
        </div>
        <div class="side-panel right-panel">
          <!-- 右侧三个系统 -->
          <div class="control-panel ears-panel" data-part="ears" @click="goAudioSystem">
            <div class="panel-header">
              <h3>听觉系统</h3>
              <div class="connection-status online"></div>
            </div>
            <div class="panel-description">
              <p class="system-intro">音频信号处理，支持语音识别和声源定位</p>
              <div class="panel-action">
                <span class="action-hint">点击进入听觉系统 →</span>
              </div>
            </div>
          </div>
          <div class="control-panel mouth-panel" data-part="mouth" @click="goVoiceSystem">
            <div class="panel-header">
              <h3>语音系统</h3>
              <div class="connection-status online"></div>
            </div>
            <div class="panel-description">
              <p class="system-intro">智能语音合成，支持多语言和情感表达</p>
              <div class="panel-action">
                <span class="action-hint">点击进入语音系统 →</span>
              </div>
            </div>
          </div>
          <div class="control-panel legs-panel" data-part="legs" @click="goLegSystem">
            <div class="panel-header">
              <h3>下肢系统</h3>
              <div class="connection-status online"></div>
            </div>
            <div class="panel-description">
              <p class="system-intro">稳定运动控制，实现平衡行走和地形适应</p>
              <div class="panel-action">
                <span class="action-hint">点击进入下肢系统 →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import robotImg from '../assets/robot.png';
import { onMounted, ref, reactive } from 'vue';

const router = useRouter();

// 系统状态
const systemStatus = reactive({
  brain: 'online',
  eyes: 'online',
  ears: 'online',
  arms: 'online',
  mouth: 'online',
  legs: 'online'
});

function goAudioSystem() {
  console.log('🎧 点击听觉系统卡片，准备跳转到 /audio-system')
  // alert('听觉系统卡片被点击了！') // 临时测试
  try {
    router.push('/audio-system')
    console.log('✅ 路由跳转成功')
  } catch (error) {
    console.error('❌ 路由跳转失败:', error)
  }
}
function goLegSystem() {
  router.push('/leg-system');
}
function goVisionSystem() {
  router.push('/vision-system');
}
function goBrainSystem() {
  router.push('/brain-system');
}
function goArmSystem() {
  router.push('/arm-system');
}
function goVoiceSystem() {
  router.push('/voice-system');
}
function goRemoteInteraction() {
  router.push('/remote-interaction');
}
function goMultimodalPerception() {
  router.push('/multimodal-perception');
}
function goHealthWellness() {
  router.push('/health-wellness');
}
function goHealthReport() {
  router.push('/report');
}
function goManagement() {
  router.push('/management');
}

// 更新连接状态
function updateConnectionStatus(part, status) {
  const panel = document.querySelector(`[data-part="${part}"]`);
  if (panel) {
    const statusIndicator = panel.querySelector('.connection-status');
    if (statusIndicator) {
      statusIndicator.className = `connection-status ${status}`;
    }
  }
}

// 添加交互效果
function addInteractiveEffects() {
  const panels = document.querySelectorAll('.control-panel');
  panels.forEach(panel => {
    panel.addEventListener('mouseenter', () => {
      const part = panel.getAttribute('data-part');
      highlightConnectionLine(part, true);
    });
    panel.addEventListener('mouseleave', () => {
      const part = panel.getAttribute('data-part');
      highlightConnectionLine(part, false);
    });
  });
}

// 高亮连接线（预留，当前无svg线条）
function highlightConnectionLine(part, highlight) {
  // 可扩展SVG动画
}

// 动画效果（如有SVG线条可扩展）
function animateConnectionLines() {
  // 可扩展SVG动画
}

// 状态导出（可扩展为按钮功能）
function exportSystemStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    components: { ...systemStatus }
  };
  const dataStr = JSON.stringify(status, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'robot_status.json';
  link.click();
}

// 生命周期钩子
onMounted(() => {
  // 恢复状态
  const savedStatus = localStorage.getItem('robotSystemStatus');
  if (savedStatus) {
    const parsed = JSON.parse(savedStatus);
    Object.keys(systemStatus).forEach(k => {
      if (parsed[k]) systemStatus[k] = parsed[k];
    });
  }
  // 初始化各面板状态
  Object.keys(systemStatus).forEach(part => {
    updateConnectionStatus(part, systemStatus[part]);
  });
  // 动画和交互
  animateConnectionLines();
  addInteractiveEffects();
  // 错误处理
  window.addEventListener('error', (e) => {
    console.error('系统错误:', e.error);
  });
  // 卸载前保存状态
  window.addEventListener('beforeunload', () => {
    localStorage.setItem('robotSystemStatus', JSON.stringify(systemStatus));
  });
});
</script>

<style scoped>
/* 全局样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Orbitron', monospace;
    background: linear-gradient(135deg, #0a0a0a 0%, #181818 100%);
    color: #ffffff;
    min-height: 100vh;
    overflow-x: auto;
    overflow-y: auto;
    position: relative;
}

body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
        radial-gradient(circle at 20% 80%, rgba(0, 153, 255, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(77, 166, 255, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
}

.container {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  position: relative;
  overflow: visible;
}

/* 恢复原始flex布局 */
.robot-section {
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    position: relative;
    background: transparent;
    padding: 0 120px;
    box-sizing: border-box;
}

.side-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: clamp(20px, 3vh, 40px);
  flex: 0 0 auto;
  width: clamp(180px, 15vw, 280px);
}

.left-panel {
  align-items: stretch;
  position: absolute;
  left: clamp(20px, 4vw, 60px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}

.right-panel {
  align-items: stretch;
  position: absolute;
  right: clamp(50px, 8vw, 120px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}
.robot-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: clamp(500px, 50vw, 1000px);
  height: clamp(600px, 60vh, 1100px);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  transition: all 0.3s ease;
}

.robot-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter:
        drop-shadow(0 0 40px rgba(0, 153, 255, 0.4))
        drop-shadow(0 0 80px rgba(77, 166, 255, 0.2))
        drop-shadow(0 0 120px rgba(255, 255, 255, 0.1));
    z-index: 5;
    transition: filter 0.3s ease;
}

/* 控制面板样式 */
.control-panel {
  margin: clamp(4px, 1vh, 12px);
  background: linear-gradient(135deg,
      rgba(26, 26, 26, 0.95) 0%,
      rgba(45, 45, 45, 0.9) 50%,
      rgba(26, 26, 26, 0.95) 100%);
  border: 1px solid rgba(102, 102, 102, 0.4);
  border-radius: clamp(12px, 1.5vw, 20px);
  padding: clamp(10px, 1.5vw, 20px) clamp(8px, 1.2vw, 16px) clamp(15px, 2vw, 30px) clamp(8px, 1.2vw, 16px);
  width: clamp(180px, 22vw, 350px);
  min-height: clamp(100px, 12vh, 150px);
  max-height: clamp(140px, 18vh, 200px);
  backdrop-filter: blur(20px);
  box-shadow:
      0 4px 16px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 100;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  position: relative;
}

.control-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
        transparent,
        rgba(0, 153, 255, 0.1),
        transparent);
    transition: left 0.6s ease;
}

.control-panel:hover {
    transform: translateY(-5px) scale(1.02);
    border-color: rgba(0, 153, 255, 0.6);
    box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.5),
        0 0 60px rgba(0, 153, 255, 0.2),
        0 0 0 1px rgba(0, 153, 255, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.control-panel:hover::before {
    left: 100%;
}

.panel-header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: clamp(8px, 1.5vh, 18px);
    padding-bottom: clamp(6px, 1vh, 12px);
    border-bottom: 1px solid rgba(136, 136, 136, 0.3);
    position: relative;
}

.panel-header h3 {
  font-size: 1.8rem;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.8px;
  font-family: 'Microsoft YaHei', sans-serif;
  text-align: center;
  flex: 1;
  transition: font-family 0.3s ease;
}

/* 字体加载完成后的样式 */
.font-loaded .panel-header h3 {
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
}

.connection-status {
    position: absolute;
    right: 0;
}

.connection-status {
    width: clamp(8px, 1.2vw, 14px);
    height: clamp(8px, 1.2vw, 14px);
    border-radius: 50%;
    background: radial-gradient(circle, #0099ff, #007acc);
    animation: statusPulse 2s infinite;
    box-shadow: 0 0 15px rgba(0, 153, 255, 0.6);
}

.connection-status::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    border: 1px solid rgba(0, 153, 255, 0.3);
    animation: ripple 2s infinite;
}

.connection-status.offline {
    background: radial-gradient(circle, #ff6b6b, #ff0000);
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.6);
}

.panel-description {
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 0.8vh, 10px);
}

.panel-action {
    margin-top: clamp(2px, 0.5vh, 6px);
    text-align: center;
}

.ears-panel {
    cursor: pointer;
    transition: all 0.3s ease;
}

.ears-panel:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 255, 255, 0.3);
}

.ears-panel:hover .action-hint {
    opacity: 1;
}

/* 按钮样式 */
.btn {
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    font-family: 'Orbitron', monospace;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
}

.btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.6s ease;
}

.btn:hover::before {
    left: 100%;
}

.btn-test {
    background: linear-gradient(135deg, rgba(0, 153, 255, 0.2), rgba(77, 166, 255, 0.3));
    color: #4da6ff;
    border: 1px solid rgba(0, 153, 255, 0.4);
    box-shadow:
        0 4px 15px rgba(0, 153, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.btn-test:hover {
    background: linear-gradient(135deg, rgba(0, 153, 255, 0.3), rgba(77, 166, 255, 0.4));
    border-color: rgba(0, 153, 255, 0.8);
    box-shadow:
        0 8px 25px rgba(0, 153, 255, 0.3),
        0 0 30px rgba(0, 153, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.btn-back {
    background: linear-gradient(135deg, rgba(100, 100, 100, 0.2), rgba(150, 150, 150, 0.3));
    color: #cccccc;
    border: 1px solid rgba(150, 150, 150, 0.4);
}

.btn-back:hover {
    background: linear-gradient(135deg, rgba(150, 150, 150, 0.3), rgba(200, 200, 200, 0.4));
    color: #ffffff;
    transform: translateY(-2px);
}

.btn-primary {
    background: linear-gradient(135deg, rgba(0, 153, 255, 0.2), rgba(77, 166, 255, 0.3));
    color: #4da6ff;
    border: 1px solid rgba(0, 153, 255, 0.4);
}

.btn-primary:hover {
    background: linear-gradient(135deg, rgba(0, 153, 255, 0.3), rgba(77, 166, 255, 0.4));
    border-color: rgba(0, 153, 255, 0.8);
    transform: translateY(-2px);
}

.btn-secondary {
    background: linear-gradient(135deg, rgba(120, 120, 120, 0.2), rgba(180, 180, 180, 0.3));
    color: #cccccc;
    border: 1px solid rgba(150, 150, 150, 0.4);
}

.btn-secondary:hover {
    background: linear-gradient(135deg, rgba(150, 150, 150, 0.3), rgba(200, 200, 200, 0.4));
    transform: translateY(-2px);
}

.btn-danger {
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 51, 51, 0.3));
    color: #ff6b6b;
    border: 1px solid rgba(255, 107, 107, 0.4);
}

.btn-danger:hover {
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(255, 51, 51, 0.4));
    transform: translateY(-2px);
}

/* 控制面板响应式字体 */
.panel-header h3 {
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.8px;
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  text-align: center;
  flex: 1;
}

.system-intro {
    color: #e0e0e0;
    font-size: clamp(0.8rem, 1.5vw, 1rem);
    line-height: 1.4;
    margin: 0;
    padding: 4px 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border-left: 3px solid #00ffff;
    text-align: center;
    font-weight: 400;
    font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
}

.action-hint {
    color: #00ffff;
    font-size: clamp(0.7rem, 1.2vw, 0.85rem);
    font-weight: 500;
    opacity: 0.8;
    transition: opacity 0.3s ease;
    font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
}

/* 动画效果 */
@keyframes pulse {
    0%, 100% {
        opacity: 0.6;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.05);
    }
}

@keyframes statusPulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
        box-shadow: 0 0 15px rgba(0, 153, 255, 0.6);
    }
    50% {
        opacity: 0.8;
        transform: scale(1.2);
        box-shadow: 0 0 25px rgba(0, 153, 255, 0.8);
    }
}

@keyframes ripple {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 左上角主标题样式 */
.main-title {
  position: fixed;
  top: 18px;
  left: 32px;
  z-index: 1200;
  font-size: clamp(1rem, 4vw, 2rem);
  font-weight: 700;
  background: linear-gradient(135deg, #00ccff, #0099ff, #ffffff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: clamp(1px, 0.5vw, 2px);
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  text-shadow: 0 0 15px rgba(0, 153, 255, 0.4);
  user-select: none;
  pointer-events: none;
  transition: font-family 0.3s ease;
}

/* 字体加载完成后的主标题样式 */
.font-loaded .main-title {
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
}

.top-buttons {
  position: fixed;
  top: 18px;
  right: 32px;
  z-index: 1200;
  display: flex;
  gap: 12px;
}

.remote-interaction-btn,
.multimodal-perception-btn,
.health-wellness-btn,
.health-report-btn,
.management-btn {
  font-size: clamp(0.8rem, 2.5vw, 1.2rem);
  font-weight: 700;
  background: linear-gradient(135deg, #00ccff, #0099ff, #ffffff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: clamp(1px, 0.3vw, 2px);
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  text-shadow: 0 0 15px rgba(0, 153, 255, 0.4);
  user-select: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: clamp(4px, 1vw, 8px) clamp(8px, 2vw, 16px);
  border-radius: clamp(4px, 1vw, 8px);
  border: 1px solid transparent;
  color: #fff;
}

/* 智能养生按钮使用与其他按钮相同的样式 */

/* 综合管理按钮使用与健康报告相同的样式 */

.remote-interaction-btn:hover,
.multimodal-perception-btn:hover,
.health-wellness-btn:hover,
.health-report-btn:hover,
.management-btn:hover {
  text-shadow: 0 0 20px rgba(0, 153, 255, 0.6);
  border-color: rgba(0, 153, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 153, 255, 0.2);
}

@media (max-width: 1440px) {
  .robot-container {
    width: 800px;
    height: 900px;
  }
  .robot-image {
    max-width: 800px;
    max-height: 900px;
  }
}

@media (max-width: 1024px) {
  .robot-container {
    width: 600px;
    height: 650px;
  }
  .robot-image {
    max-width: 600px;
    max-height: 650px;
  }
}

/* 大屏幕优化 (1200px以上) */
@media (min-width: 1200px) {
  .robot-section {
    padding: 0 150px;
  }

  .side-panel {
    gap: clamp(25px, 4vh, 50px);
  }


}

/* 中等屏幕适配 (768px-1200px) */
@media (max-width: 1200px) {
  .robot-section {
    padding: 0 80px;
  }

  .side-panel {
    min-width: clamp(160px, 18vw, 250px);
    max-width: clamp(220px, 22vw, 320px);
  }

  .robot-container {
    width: clamp(450px, 45vw, 800px);
    height: clamp(500px, 50vh, 900px);
  }
}

/* 平板设备适配 (768px以下) - 垂直布局 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .robot-section {
    flex-direction: row;
    padding: 10px 5px;
    min-height: 90vh;
    gap: 5px;
    justify-content: space-between;
    align-items: center;
  }

  .side-panel {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: clamp(80px, 22vw, 120px) !important;
    min-width: auto !important;
    max-width: none !important;
    gap: clamp(5px, 1vh, 10px);
    flex-wrap: nowrap;
  }

  .left-panel {
    order: 1;
    align-items: stretch !important;
  }

  .right-panel {
    order: 3;
    align-items: stretch !important;
  }

  .robot-container {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    order: 2;
    width: clamp(200px, 45vw, 280px);
    height: clamp(280px, 50vh, 400px);
    margin: 0 auto;
    flex: 0 0 auto;
  }

  .control-panel {
    width: clamp(140px, 20vw, 220px);
    min-height: clamp(80px, 10vh, 120px);
    max-height: clamp(110px, 14vh, 150px);
    margin: clamp(3px, 0.8vh, 8px);
    padding: clamp(6px, 1.2vw, 12px) clamp(5px, 1vw, 10px) clamp(10px, 1.5vw, 20px) clamp(5px, 1vw, 10px);
  }

  .main-title {
    font-size: clamp(1rem, 2.5vw, 1.4rem);
    top: 10px;
    left: 12px;
  }

  .top-buttons {
    top: 10px;
    right: 12px;
    gap: 8px;
  }

  .remote-interaction-btn,
  .multimodal-perception-btn,
  .health-wellness-btn,
  .health-report-btn,
  .management-btn {
    font-size: clamp(0.8rem, 2vw, 1.1rem);
    padding: clamp(4px, 1vw, 8px) clamp(8px, 1.5vw, 14px);
  }
}

/* 小屏幕设备适配 (480px以下) - 垂直布局 */
@media (max-width: 480px) {
  .container {
    padding: 8px;
  }

  .robot-section {
    flex-direction: row;
    padding: 8px 3px;
    min-height: 85vh;
    gap: 3px;
    justify-content: space-between;
    align-items: center;
  }

  .side-panel {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: clamp(65px, 20vw, 90px) !important;
    min-width: auto !important;
    max-width: none !important;
    gap: clamp(3px, 0.8vh, 8px);
    flex-wrap: nowrap;
  }

  .left-panel {
    order: 1;
    align-items: stretch !important;
  }

  .right-panel {
    order: 3;
    align-items: stretch !important;
  }

  .robot-container {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    order: 2;
    width: clamp(160px, 40vw, 220px);
    height: clamp(220px, 45vh, 300px);
    margin: 0 auto;
    flex: 0 0 auto;
  }

  .control-panel {
    width: clamp(70px, 20vw, 100px) !important;
    height: clamp(39px, 11.2vw, 56px) !important;
    min-width: auto !important;
    max-width: none !important;
    min-height: auto !important;
    max-height: none !important;
    margin: clamp(1px, 0.5vh, 3px) !important;
    padding: clamp(3px, 0.8vw, 6px) clamp(2px, 0.5vw, 4px) clamp(6px, 1vw, 10px) clamp(2px, 0.5vw, 4px);
    flex: 0 0 auto;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    right: auto !important;
  }

  .panel-header h3 {
    font-size: clamp(0.7rem, 3vw, 1rem) !important;
    margin-bottom: clamp(2px, 0.5vh, 4px) !important;
  }

  .system-intro {
    font-size: clamp(0.5rem, 2.2vw, 0.7rem) !important;
    line-height: 1.2 !important;
  }

  .action-hint {
    font-size: clamp(0.45rem, 2vw, 0.65rem) !important;
  }

  .panel-header h3 {
    font-size: clamp(0.9rem, 2.8vw, 1.1rem);
    margin-bottom: clamp(3px, 0.8vh, 6px);
  }

  .system-intro {
    font-size: clamp(0.65rem, 2.2vw, 0.8rem);
    line-height: 1.2;
    padding: clamp(1px, 0.3vw, 3px) clamp(2px, 0.5vw, 4px);
  }

  .action-hint {
    font-size: clamp(0.55rem, 1.8vw, 0.7rem);
  }

  .connection-status {
    width: clamp(5px, 1vw, 8px);
    height: clamp(5px, 1vw, 8px);
  }

  .main-title {
    font-size: clamp(0.9rem, 2.2vw, 1.1rem);
    top: 8px;
    left: 8px;
  }

  .top-buttons {
    top: 8px;
    right: 8px;
    gap: 6px;
  }

  .remote-interaction-btn,
  .multimodal-perception-btn,
  .health-wellness-btn,
  .health-report-btn,
  .management-btn {
    font-size: clamp(0.7rem, 1.8vw, 0.9rem);
    padding: clamp(3px, 0.8vw, 6px) clamp(6px, 1.2vw, 10px);
  }
}

/* 超小屏幕适配 (360px以下) - 垂直布局 */
@media (max-width: 360px) {
  .container {
    padding: 5px;
  }

  .robot-section {
    flex-direction: row;
    padding: 5px 2px;
    min-height: 80vh;
    gap: 2px;
    justify-content: space-between;
    align-items: center;
  }

  .side-panel {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: clamp(50px, 22vw, 70px) !important;
    min-width: auto !important;
    max-width: none !important;
    gap: clamp(2px, 0.6vh, 6px);
    flex-wrap: nowrap;
  }

  .left-panel {
    order: 1;
    align-items: stretch !important;
  }

  .right-panel {
    order: 3;
    align-items: stretch !important;
  }

  .robot-container {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    order: 2;
    width: clamp(120px, 45vw, 160px);
    height: clamp(160px, 50vh, 220px);
    margin: 0 auto;
    flex: 0 0 auto;
  }

  .control-panel {
    width: clamp(45px, 20vw, 65px) !important;
    height: clamp(25px, 11.2vw, 36px) !important;
    min-width: auto !important;
    max-width: none !important;
    min-height: auto !important;
    max-height: none !important;
    margin: clamp(1px, 0.3vh, 2px) !important;
    padding: clamp(2px, 0.6vw, 4px) clamp(1px, 0.4vw, 3px) clamp(4px, 0.8vw, 8px) clamp(1px, 0.4vw, 3px);
    flex: 0 0 auto;
    position: relative !important;
    left: auto !important;
    top: auto !important;
    transform: none !important;
    right: auto !important;
  }

  .panel-header h3 {
    font-size: clamp(0.6rem, 2.8vw, 0.9rem) !important;
    margin-bottom: clamp(1px, 0.3vh, 3px) !important;
  }

  .system-intro {
    font-size: clamp(0.45rem, 2vw, 0.6rem) !important;
    line-height: 1.1 !important;
  }

  .action-hint {
    font-size: clamp(0.4rem, 1.8vw, 0.55rem) !important;
  }

  .panel-header h3 {
    font-size: clamp(0.8rem, 3.2vw, 1rem);
    margin-bottom: clamp(2px, 0.5vh, 4px);
  }

  .system-intro {
    font-size: clamp(0.6rem, 2.5vw, 0.75rem);
    line-height: 1.1;
    padding: clamp(1px, 0.2vw, 2px) clamp(1px, 0.3vw, 3px);
  }

  .action-hint {
    font-size: clamp(0.5rem, 2vw, 0.65rem);
  }

  .connection-status {
    width: clamp(4px, 0.8vw, 6px);
    height: clamp(4px, 0.8vw, 6px);
  }

  .main-title {
    font-size: clamp(0.8rem, 2.5vw, 1rem);
  }

  .remote-interaction-btn,
  .multimodal-perception-btn,
  .health-wellness-btn,
  .health-report-btn,
  .management-btn {
    font-size: clamp(0.6rem, 2vw, 0.8rem);
    padding: clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px);
  }
}
</style>
