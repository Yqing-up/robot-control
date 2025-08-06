<template>
  <div class="tongue-analysis-view">
    <header class="page-header">
      <button class="btn btn-back" @click="goBack">← 返回</button>
      <h1 class="page-title">舌苔检测分析</h1>
    </header>
    <main class="main-container tongue-analysis-main">
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
              倒计时:
              <input
                type="number"
                v-model.number="photoInterval"
                min="0"
                max="60"
                class="timer-input"
              /> 秒
            </label>
            <div class="button-group">
              <button class="btn btn-success" @click="takePhoto" :disabled="isTimerPhotoActive">
                {{ isTimerPhotoActive ? `倒计时 ${timerCountdown}秒` : '立即拍照' }}
              </button>
            </div>
            <div class="timer-info" v-if="isTimerPhotoActive">
              <span class="timer-status">倒计时: {{ timerCountdown }}秒</span>
            </div>
          </div>
        </section>
      </div>
      <div class="right-column">
        <section class="card-style param-section">
          <div class="section-header">
            <h2 class="section-title">检测参数</h2>
          </div>
          <div class="param-group">
            <div class="photo-selector">
              <div class="photo-dropdown-container">
                <div 
                  class="photo-dropdown-trigger"
                  @click="togglePhotoDropdown"
                  :class="{ 'active': isPhotoDropdownOpen }"
                >
                  <div v-if="selectedPhoto" class="selected-photo-display">
                    <img :src="selectedPhoto.url" :alt="selectedPhoto.filename" class="selected-photo-thumbnail" />
                    <span class="selected-photo-name">{{ selectedPhoto.filename }}</span>
                    <span class="selected-photo-date">{{ new Date(selectedPhoto.date).toLocaleString() }}</span>
                  </div>
                  <div v-else class="placeholder-text">
                    请选择一张舌苔照片
                  </div>
                  <span class="dropdown-arrow">▼</span>
                </div>
                <div v-if="isPhotoDropdownOpen" class="photo-dropdown">
                  <div v-if="photoLoading" class="photo-loading">
                    <div class="loading-spinner"></div>
                    <span>正在加载照片...</span>
                  </div>
                  <div v-else-if="photoData.length === 0" class="photo-empty">
                    <span>暂无照片数据</span>
                  </div>
                  <div v-else class="photo-dropdown-list">
                    <div 
                      v-for="(photo, index) in sortedPhotoData" 
                      :key="index"
                      class="photo-dropdown-item"
                      :class="{ 'selected': selectedPhoto && selectedPhoto.url === photo.url }"
                      @click="selectPhoto(photo)"
                    >
                      <img :src="photo.url" :alt="photo.filename" class="photo-dropdown-thumbnail" />
                      <div class="photo-dropdown-info">
                        <span class="photo-dropdown-name">{{ photo.filename }}</span>
                        <span class="photo-dropdown-date">{{ new Date(photo.date).toLocaleString() }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <input v-model="prompt" placeholder="如：请分析舌苔健康状况" class="form-input" />
            <button 
              class="btn-submit submit-btn" 
              @click="analyze" 
              :disabled="!selectedPhoto || !prompt || analysisLoading"
            >
              {{ analysisLoading ? '检测中...' : '提交检测' }}
            </button>
          </div>
        </section>
        <section class="card-style result-section">
          <div class="section-header">
            <h2 class="section-title">分析与检测结果</h2>
          </div>
          <div v-if="result" class="analysis-result">
            <h4 class="result-title">检测结果：</h4>
            <div class="result-content">{{ result }}</div>
          </div>
          <div class="detection-results">
            <h4 class="result-title">检测结果：</h4>
            <textarea 
              v-model="detectionOutput" 
              class="detection-output" 
              readonly
            ></textarea>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { cameraApi } from '../api/cameraApi';
import { 
  getRecentPhotoData, 
  analyzeTongueData, 
  validateTongueInput, 
  formatPhotoDataForDisplay,
  extractPhotoUrls,
  formatTongueAnalysisResult
} from '../api/tongueAnalysisApi';

const router = useRouter();
const getVideoFeed = () => {
  const videoUrl = cameraApi.getRawVideoFeed();
  return videoUrl;
};
const goBack = () => {
  router.back();
};
const videoLoading = ref(true);
const cameraActive = ref(false);
const cameraStatus = ref('摄像头未连接');
const cameraInfo = ref(null);
const photos = ref([]);
const photoInterval = ref(0);
const isTimerPhotoActive = ref(false);
const timerCountdown = ref(0);
let countdownTimer = null;
const photoData = ref([]);
const selectedPhoto = ref(null);
const photoLoading = ref(false);
const analysisLoading = ref(false);
const isPhotoDropdownOpen = ref(false);
const prompt = ref('');
const result = ref('');
const detectionOutput = ref('舌苔检测开始...\n检测到舌苔颜色：淡红色\n舌苔厚度：适中\n舌苔分布：均匀\n舌苔质地：正常\n建议：继续保持良好的口腔卫生习惯');
const sortedPhotoData = computed(() => {
  return [...photoData.value].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA;
  });
});

onMounted(() => {
  initializeCamera();
  loadPhotoList();
  loadPhotoData();
  document.addEventListener('click', handleClickOutside);
});
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  document.removeEventListener('click', handleClickOutside);
});
async function initializeCamera() {
  try {
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
    const result = await cameraApi.getPhotoList();
    photos.value = result.photos || [];
  } catch (error) {
    photos.value = [];
  }
}
async function takePhoto() {
  if (!cameraActive.value) {
    alert('请先连接摄像头');
    return;
  }
  if (photoInterval.value > 0) {
    isTimerPhotoActive.value = true;
    timerCountdown.value = photoInterval.value;
    countdownTimer = setInterval(() => {
      timerCountdown.value--;
      if (timerCountdown.value <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        isTimerPhotoActive.value = false;
        executePhoto();
      }
    }, 1000);
  } else {
    await executePhoto();
  }
}
async function executePhoto() {
  try {
    const result = await cameraApi.takePhoto();
    if (result.success) {
      alert(`舌苔检测拍照成功！文件名: ${result.filename}`);
      await loadPhotoList();
    } else {
      alert(`舌苔检测拍照失败: ${result.message}`);
    }
  } catch (error) {
    alert('拍照失败，请重试');
  }
}
async function loadPhotoData() {
  try {
    photoLoading.value = true;
    const result = await cameraApi.getPhotoList();
    if (result && result.data) {
      photoData.value = Array.isArray(result.data.photos) ? result.data.photos : result.data;
    } else {
      photoData.value = [];
    }
  } catch (error) {
    photoData.value = [];
  } finally {
    photoLoading.value = false;
  }
}
function handleClickOutside(event) {
  const dropdownContainer = event.target.closest('.photo-dropdown-container');
  if (!dropdownContainer && isPhotoDropdownOpen.value) {
    isPhotoDropdownOpen.value = false;
  }
}
function togglePhotoDropdown() {
  isPhotoDropdownOpen.value = !isPhotoDropdownOpen.value;
}
function selectPhoto(photo) {
  selectedPhoto.value = photo;
  isPhotoDropdownOpen.value = false;
}
function getSelectedPhotoUrls() {
  return selectedPhoto.value ? [selectedPhoto.value.url] : [];
}
async function analyze() {
  try {
    const validation = validateTongueInput(prompt.value, selectedPhoto.value ? [selectedPhoto.value] : []);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }
    analysisLoading.value = true;
    const photoUrls = getSelectedPhotoUrls();
    const resultData = await analyzeTongueData(photoUrls, prompt.value);
    if (resultData.success) {
      const formattedResult = formatTongueAnalysisResult(resultData.data);
      detectionOutput.value = formattedResult;
      result.value = formattedResult;
    } else {
      detectionOutput.value = `检测失败: ${resultData.message}`;
      result.value = `检测失败: ${resultData.message}`;
    }
  } catch (error) {
    detectionOutput.value = `检测出错: ${error.message}`;
    result.value = `检测出错: ${error.message}`;
  } finally {
    analysisLoading.value = false;
  }
}
</script>
<style scoped>
@import '../assets/imageAnalysis.css';
.tongue-analysis-main {
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
  font-family: 'Segoe UI', 'Microsoft YaHei', Arial, sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: none;
}
.btn-success:disabled {
  background: #6c757d;
  cursor: not-allowed;
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
.form-input {
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
.form-input:focus {
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