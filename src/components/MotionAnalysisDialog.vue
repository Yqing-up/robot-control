<template>
  <div class="motion-analysis-view">
    <header class="page-header">
      <button class="btn btn-back" @click="goBack">← 返回</button>
      <h1 class="page-title">运动检测分析（带骨骼检测）</h1>
    </header>
    <main class="main-container motion-analysis-main">
      <div class="left-column">
        <section class="preview-section card-style">
          <div class="section-header">
            <h2 class="section-title">摄像头预览</h2>
          </div>
          <div class="camera-preview-box">
            <div v-if="videoLoading" class="video-loading">
              <div class="loading-spinner"></div>
              <span>正在连接摄像头...</span>
            </div>
            <img 
              v-else
              :src="getVideoFeed()" 
              class="camera-preview" 
              @error="handleVideoError"
              @load="handleVideoLoad"
            />
          </div>
        </section>
        <section class="operation-section card-style">
          <div class="section-header">
            <h2 class="section-title">操作区</h2>
          </div>
          <div class="operation-controls">
            <label class="timer-label">
              拍照间隔:
              <input
                type="number"
                v-model.number="photoInterval"
                min="1"
                max="60"
                class="timer-input"
              /> 秒
            </label>
            <div class="button-group">
              <button
                class="btn btn-success"
                @click="startTimerPhoto"
                :disabled="isTimerPhotoActive"
              >
                {{ isTimerPhotoActive ? '拍摄中...' : '启动拍摄' }}
              </button>
              <button
                class="btn btn-danger"
                @click="stopTimerPhoto"
                :disabled="!isTimerPhotoActive"
              >
                停止拍摄
              </button>
            </div>
            <div class="timer-info" v-if="isTimerPhotoActive">
              <span class="timer-status">下次拍照倒计时: {{ timerCountdown }}秒</span>
              <span class="photo-count">已拍摄: {{ timerPhotoCount }}张</span>
            </div>
          </div>
        </section>
      </div>
      <div class="right-column">
        <section class="card-style param-section">
          <div class="section-header">
            <h2 class="section-title">参数与分析</h2>
          </div>
          <div class="param-group">
            <label class="form-label">选择视频：</label>
            <select v-model="selectedVideoIdx" class="form-select">
              <option value="" disabled>请选择视频</option>
              <option v-for="(video, idx) in videos" :key="idx" :value="idx">{{ video.name }}</option>
            </select>
            <label class="form-label">提示词：</label>
            <input v-model="prompt" placeholder="如：这段运动需要注意什么" class="form-input" />
            <button class="btn-submit submit-btn" @click="analyze" :disabled="selectedVideoIdx===null || !prompt">
              提交分析
            </button>
          </div>
        </section>
        <section class="card-style result-section">
          <div class="section-header">
            <h2 class="section-title">分析与检测结果</h2>
          </div>
          <div v-if="result" class="analysis-result">
            <h4 class="result-title">分析建议：</h4>
            <div class="result-content">{{ result }}</div>
          </div>
          <div class="detection-results">
            <h4 class="result-title">检测结果：</h4>
            <textarea v-model="detectionOutput" class="detection-output" readonly></textarea>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { cameraApi } from '../api/cameraApi';

const router = useRouter();
const {
  checkCameraStatus,
  getCameraInfo,
  getRawVideoFeed,
  getSkeletonVideoFeed,
  getPhotoList,
  downloadPhoto: apiDownloadPhoto,
  getPhotoContent,
  deletePhoto: apiDeletePhoto
} = cameraApi;

const videos = ref([]); // 页面可根据需要加载视频列表
const selectedVideoIdx = ref(null);
const prompt = ref('');
const result = ref('');
const detectionOutput = ref('运动检测开始...\n检测到关键点：头部、肩膀、肘部、手腕、髋部、膝盖、脚踝\n姿态评估：整体姿态良好\n运动轨迹：流畅连贯\n建议：继续保持当前动作标准');

const getVideoFeed = () => {
  const videoUrl = getSkeletonVideoFeed();
  return videoUrl;
};

const cameraActive = ref(false);
const cameraStatus = ref('摄像头未连接');
const cameraInfo = ref(null);
const videoLoading = ref(true);

const photos = ref([]);
const photoInterval = ref(5);
const isTimerPhotoActive = ref(false);
const timerCountdown = ref(0);
const timerPhotoCount = ref(0);
let countdownTimer = null;

const goBack = () => {
  router.back();
};

onMounted(() => {
  initializeCamera();
  loadPhotoList();
});
onBeforeUnmount(() => {
  stopTimerPhoto();
});

async function initializeCamera() {
  try {
    const status = await checkCameraStatus();
    const info = await getCameraInfo();
    cameraInfo.value = info;
    cameraActive.value = true;
    cameraStatus.value = '摄像头已连接';
    videoLoading.value = true;
    setTimeout(() => {
      if (videoLoading.value) {
        videoLoading.value = false;
      }
    }, 2000);
  } catch (error) {
    cameraStatus.value = '摄像头连接失败';
    videoLoading.value = false;
  }
}
function handleVideoError() {
  cameraStatus.value = '视频流连接失败';
  cameraActive.value = false;
  videoLoading.value = false;
}
function handleVideoLoad() {
  cameraStatus.value = '摄像头已连接';
  cameraActive.value = true;
  videoLoading.value = false;
}
async function loadPhotoList() {
  try {
    const photoList = await getPhotoList();
    photos.value = photoList;
  } catch (error) {}
}
async function takePhoto() {
  if (!cameraActive.value) {
    alert('请先连接摄像头');
    return;
  }
  // 这里可调用拍照API
    await loadPhotoList();
}
function startTimerPhoto() {
  if (!cameraActive.value) {
    alert('请先连接摄像头');
    return;
  }
  isTimerPhotoActive.value = true;
  timerPhotoCount.value = 0;
  timerCountdown.value = photoInterval.value;
  takePhoto();
  timerPhotoCount.value++;
  countdownTimer = setInterval(async () => {
    timerCountdown.value--;
    if (timerCountdown.value <= 0) {
      await takePhoto();
      timerPhotoCount.value++;
      timerCountdown.value = photoInterval.value;
    }
  }, 1000);
}
function stopTimerPhoto() {
  isTimerPhotoActive.value = false;
  timerCountdown.value = 0;
  timerPhotoCount.value = 0;
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}
function analyze() {
  result.value = `分析结果：针对"${prompt.value}"，建议保持正确姿势，注意安全。`;
  detectionOutput.value = `运动检测开始...
检测到关键点：头部、肩膀、肘部、手腕、髋部、膝盖、脚踝
姿态评估：整体姿态良好
运动轨迹：流畅连贯
建议：继续保持当前动作标准`;
}
</script>
<style scoped>
@import '../assets/imageAnalysis.css';
.motion-analysis-main {
  align-items: flex-start;
  font-family: 'Segoe UI', 'Microsoft YaHei', Arial, sans-serif;
  gap: 14px;
}
.card-style {
  background: rgba(26, 31, 46, 0.95);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  padding: 18px;
  margin-bottom: 14px;
}
.camera-preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  background: #0a1622;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  overflow: hidden;
}
.camera-preview {
  width: 100%;
  max-width: 480px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(74,144,226,0.15);
}
.operation-controls {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  justify-content: center;
}
.button-group {
  display: flex;
  gap: 16px;
}
.btn-success {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-success:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
.btn-danger {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}
.btn-danger:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
.btn-success, .btn-danger {
  font-family: 'Segoe UI', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: none;
}
.submit-btn {
  width: 100%;
  margin-top: 18px;
}
.param-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.param-section, .result-section {
  margin-bottom: 18px;
}
.form-select, .form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #4a90e2;
  background: #101a28;
  color: #fff;
  font-size: 16px;
  margin-top: 10px;
  margin-bottom: 4px;
}
.form-select:focus, .form-input:focus {
  outline: none;
  border-color: #64b5f6;
  box-shadow: 0 0 8px #4a90e2;
}
.detection-output {
  width: 100%;
  min-height: 120px;
  background: #101a28;
  color: #fff;
  border-radius: 8px;
  border: 1px solid #4a90e2;
  padding: 12px;
  margin-top: 8px;
  font-size: 15px;
  resize: vertical;
}
</style> 