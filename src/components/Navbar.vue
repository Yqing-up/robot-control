<template>
  <header class="header">
    <div class="nav-section">
      <button class="btn btn-back" @click="goHome">← 返回主页</button>
      <h1 class="title">{{ getPageTitle() }}</h1>
    </div>
    <div class="header-controls">
      <div class="header-buttons">
        <button class="btn btn-small image-analysis-btn" @click="openImageAnalysis">智能图片分析</button>
        <button class="btn btn-small motion-detect-btn" @click="openMotionDialog">运动检测</button>
        <button class="btn btn-small tongue-detect-btn" @click="openTongueDialog">舌苔检测</button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Navbar响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    gap: 8px;
    padding: 8px 12px;
    flex-wrap: nowrap !important;
  }

  .nav-section {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    flex: 1 !important;
    min-width: 0 !important;
  }

  .title {
    font-size: 1.2rem;
    white-space: nowrap !important;
    text-overflow: ellipsis !important;
    overflow: hidden !important;
  }

  .header-controls {
    flex: 0 0 auto !important;
    display: flex !important;
    align-items: center !important;
  }

  .header-buttons {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 6px;
    flex-wrap: nowrap !important;
  }

  .btn {
    min-height: 44px;
    min-width: 44px;
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
  }

  .btn-small {
    min-height: 40px;
    padding: 10px 14px;
    font-size: 12px;
  }

  .image-analysis-btn,
  .motion-detect-btn,
  .tongue-detect-btn {
    min-height: 44px;
    min-width: 44px;
    width: 100%;
    padding: 12px 16px;
    font-size: 14px;
    margin: 0;
    touch-action: manipulation;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 6px 8px !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: 4px !important;
  }

  .nav-section {
    gap: 4px !important;
    flex: 1 !important;
    min-width: 0 !important;
    display: flex !important;
    align-items: center !important;
  }

  .header-controls {
    flex: 0 0 auto !important;
    display: flex !important;
    align-items: center !important;
  }

  .header-buttons {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: clamp(2px, 0.5vw, 4px) !important;
  }

  .title {
    font-size: clamp(0.8rem, 2vw, 1.1rem) !important;
    letter-spacing: clamp(0.5px, 0.1vw, 1px) !important;
    white-space: nowrap !important;
    text-overflow: ellipsis !important;
    overflow: hidden !important;
    max-width: clamp(120px, 30vw, 200px) !important;
  }

  .header-buttons .btn {
    padding: clamp(2px, 0.5vw, 4px) clamp(3px, 0.7vw, 6px) !important;
    font-size: clamp(0.4rem, 0.7vw, 0.5rem) !important;
    max-width: clamp(50px, 12vw, 70px) !important;
    white-space: nowrap !important;
  }

  .btn {
    min-height: 48px;
    padding: 14px 18px;
    font-size: 16px;
  }

  .btn-small {
    min-height: 44px;
    padding: 12px 16px;
    font-size: 14px;
  }

  .image-analysis-btn,
  .motion-detect-btn,
  .tongue-detect-btn {
    min-height: 48px;
    padding: 14px 18px;
    font-size: 16px;
    margin: 0;
  }
}

@media (max-width: 320px) {
  .header-buttons {
    gap: 4px;
  }

  .btn {
    padding: 12px 14px;
    font-size: 14px;
  }

  .btn-small {
    padding: 10px 12px;
    font-size: 12px;
  }
}
</style>

<script setup>
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

function goHome() {
  router.push('/');
}

function openImageAnalysis() {
  console.log('跳转到智能图片分析页面');
  router.push('/image-analysis');
}

function openMotionDialog() {
  router.push('/motion-analysis');
}

function openTongueDialog() {
  router.push('/tongue-analysis');
}

// 根据当前路由获取页面标题
const getPageTitle = () => {
  const routeTitleMap = {
    '/vision-system': '视觉系统控制中心',
    '/brain-system': '头部系统控制中心',
    '/robot-simulation': '机器人仿真画面',
    '/audio-system': '听觉系统控制中心',
    '/arm-system': '上肢系统控制中心',
    '/leg-system': '下肢系统控制中心',
    '/voice-system': '语音系统控制中心',
    '/management': '机器人综合管理中心',
    '/remote-interaction': '远程交互控制中心',
    '/multimodal-perception': '多模态感知中心',
    '/image-analysis': '智能图片分析中心',
    '/voice-recognition': '语音识别控制中心',
    '/activity-scenes': '活动场景管理中心',
    '/health-wellness': '健康养生管理中心',
    '/chat-interaction': '智能对话交互中心'
  }

  return routeTitleMap[route.path] || '机器人控制中心'
}
</script>

<style scoped>
/* 继承全局header样式，无需重复定义 .header、.btn、.btn-back、.btn-small、.title 等 */
/* 移除title样式覆盖，让全局渐变样式生效 */
.image-analysis-btn,
.motion-detect-btn,
.tongue-detect-btn {
  font-size: 1.1rem;
  font-weight: 600;
  color: #00ccff;
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.9));
  border: 2px solid rgba(0, 153, 255, 0.4);
  border-radius: 6px;
  padding: 10px 18px;
  margin: 0 8px;
  min-height: 44px;
  min-width: 44px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(0, 153, 255, 0.2);
  cursor: pointer;
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  touch-action: manipulation;
}

.image-analysis-btn::before,
.motion-detect-btn::before,
.tongue-detect-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 153, 255, 0.2), transparent);
  transition: left 0.5s;
}

.image-analysis-btn:hover,
.motion-detect-btn:hover,
.tongue-detect-btn:hover {
  background: linear-gradient(135deg, rgba(0, 153, 255, 0.1), rgba(77, 166, 255, 0.15));
  border-color: rgba(0, 153, 255, 0.6);
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 0 1px rgba(0, 153, 255, 0.4),
    0 0 20px rgba(0, 153, 255, 0.2);
  transform: translateY(-2px);
  color: #00ccff;
}

.image-analysis-btn:hover::before,
.motion-detect-btn:hover::before,
.tongue-detect-btn:hover::before {
  left: 100%;
}

.image-analysis-btn:active,
.motion-detect-btn:active,
.tongue-detect-btn:active {
  transform: translateY(0px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(0, 153, 255, 0.2);
}
</style>
