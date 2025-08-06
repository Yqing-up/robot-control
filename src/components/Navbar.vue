<template>
  <header class="header">
    <div class="nav-section">
      <button class="btn btn-back" @click="goHome">← 返回主页</button>
      <h1 class="title">视觉系统控制中心</h1>
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

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
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
</script>

<style scoped>
/* 继承全局header样式，无需重复定义 .header、.btn、.btn-back、.btn-small、.title 等 */
.title {
  color: #fff !important;
  background: none !important;
  -webkit-background-clip: unset !important;
  -webkit-text-fill-color: unset !important;
  background-clip: unset !important;
  text-shadow: 0 0 15px rgba(0, 153, 255, 0.2);
}
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