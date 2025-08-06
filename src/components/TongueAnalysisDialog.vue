<template>
  <div v-if="visible" class="dialog-mask">
    <div class="dialog-box large">
      <div class="dialog-header">
        <h2 class="dialog-title">舌苔检测分析</h2>
        <button class="dialog-close" @click="$emit('close')">×</button>
      </div>
      <div class="dialog-content dialog-flex">
        <!-- 视频流预览区域 -->
        <div class="dialog-preview">
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

          <!-- 拍照功能模块 -->
          <div class="capture-module">
            <div class="detection-instruction">
              <p>请在自然光下伸出舌头，保持3秒进行拍摄。建议设置倒计时以便调整姿势。</p>
            </div>
            <div class="divider"></div>

            <div class="tab-content">
              <!-- 手动拍照 -->
              <div class="photo-controls">
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
                <button class="btn btn-primary" @click="takePhoto" :disabled="isTimerPhotoActive">
                  {{ isTimerPhotoActive ? `倒计时 ${timerCountdown}秒` : '立即拍照' }}
                </button>
              </div>
              <div class="timer-info" v-if="isTimerPhotoActive">
                <span class="timer-status">倒计时: {{ timerCountdown }}秒</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-form">
          <!-- 照片库选择区域 -->
          <div class="form-group">
            <label class="form-label">选择照片：</label>
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
          </div>

          <div class="form-group">
            <label class="form-label">提示词：</label>
            <input v-model="prompt" placeholder="如：请分析舌苔健康状况" class="form-input" />
          </div>

          <button
            class="btn-submit"
            @click="analyze"
            :disabled="!selectedPhoto || !prompt || analysisLoading"
          >
            {{ analysisLoading ? '检测中...' : '提交检测' }}
          </button>

          <div v-if="result" class="analysis-result">
            <h4 class="result-title">检测结果：</h4>
            <div class="result-content">{{ result }}</div>
          </div>

          <div class="detection-results">
            <h4 class="result-title">检测结果：</h4>
            <textarea
              v-model="detectionOutput"
              class="detection-output"
              placeholder="舌苔检测开始...
检测到舌苔颜色：淡红色
舌苔厚度：适中
舌苔分布：均匀
舌苔质地：正常
建议：继续保持良好的口腔卫生习惯"
              readonly
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue';
import { cameraApi } from '../api/cameraApi';
import {
  getRecentPhotoData,
  analyzeTongueData,
  validateTongueInput,
  formatPhotoDataForDisplay,
  extractPhotoUrls,
  formatTongueAnalysisResult
} from '../api/tongueAnalysisApi';

const {
  getRawVideoFeed,
  getPhotoList,
  deletePhoto: apiDeletePhoto,
  takePhoto: apiTakePhoto
} = cameraApi;

const props = defineProps({
  visible: Boolean,
  videos: Array
});
const emit = defineEmits(['close']);
const selectedVideoIdx = ref(null);
const prompt = ref('');
const result = ref('');
const detectionOutput = ref('');

// 照片库相关
const photoData = ref([]);
const selectedPhoto = ref(null); // 改为单选
const timeRange = ref(30); // 默认30分钟
const photoLoading = ref(false);
const analysisLoading = ref(false);
const isPhotoDropdownOpen = ref(false);

// 暴露给模板使用的函数
const getVideoFeed = () => {
  const videoUrl = getRawVideoFeed();
  console.log('舌苔检测视频流URL:', videoUrl);
  return videoUrl;
};

// 摄像头相关
const cameraActive = ref(false);
const cameraStatus = ref('摄像头未连接');
const cameraInfo = ref(null);
const videoLoading = ref(true);

// 拍照相关
const photos = ref([]); // {filename, size, size_kb, date, url, download_url}
const photoInterval = ref(0); // 倒计时秒数，默认0秒
const isTimerPhotoActive = ref(false);
const timerCountdown = ref(0);
let countdownTimer = null;

// 计算属性：按时间倒序排列的照片数据
const sortedPhotoData = computed(() => {
  return [...photoData.value].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB - dateA; // 倒序排列，最新的在前
  });
});

watch(() => props.visible, v => {
  if (!v) {
    selectedVideoIdx.value = null;
    prompt.value = '';
    result.value = '';
    selectedPhoto.value = null;
    isPhotoDropdownOpen.value = false;
  }
});

// 生命周期
onMounted(() => {
  initializeCamera();
  loadPhotoList();
  loadPhotoData();

  // 添加点击外部关闭下拉框的事件监听
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  // 清理定时器（如果有的话）
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  // 移除事件监听
  document.removeEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  // 清理定时器（如果有的话）
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});

// 摄像头控制
async function initializeCamera() {
  try {
    // 直接设置摄像头状态，因为视频流会自动连接
    cameraActive.value = true;
    cameraStatus.value = '摄像头已连接';
    videoLoading.value = true; // 开始加载视频流

    // 延迟一下再隐藏加载状态，给视频流一些时间加载
    setTimeout(() => {
      if (videoLoading.value) {
        videoLoading.value = false;
      }
    }, 2000);
  } catch (error) {
    console.error('初始化摄像头失败:', error);
    cameraStatus.value = '摄像头连接失败';
    videoLoading.value = false;
  }
}

// 视频流错误处理
function handleVideoError() {
  console.error('视频流加载失败');
  cameraStatus.value = '视频流连接失败';
  cameraActive.value = false;
  videoLoading.value = false;
}

// 视频流加载成功处理
function handleVideoLoad() {
  console.log('视频流加载成功');
  cameraStatus.value = '摄像头已连接';
  cameraActive.value = true;
  videoLoading.value = false;
}

// 加载照片列表
async function loadPhotoList() {
  try {
    const result = await getPhotoList();
    photos.value = result.photos || [];
    console.log('照片列表:', result);
    console.log('照片总数:', result.count);
  } catch (error) {
    console.error('加载照片列表失败:', error);
    photos.value = [];
  }
}

// 手动拍照功能
async function takePhoto() {
  if (!cameraActive.value) {
    alert('请先连接摄像头');
    return;
  }

  // 如果有倒计时设置，先进行倒计时
  if (photoInterval.value > 0) {
    isTimerPhotoActive.value = true;
    timerCountdown.value = photoInterval.value;

    // 开始倒计时
    countdownTimer = setInterval(() => {
      timerCountdown.value--;
      if (timerCountdown.value <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        isTimerPhotoActive.value = false;
        // 倒计时结束，执行拍照
        executePhoto();
      }
    }, 1000);
  } else {
    // 没有倒计时，直接拍照
    await executePhoto();
  }
}

// 执行拍照
async function executePhoto() {
  try {
    console.log('舌苔检测开始拍照...');
    const result = await apiTakePhoto();
    console.log('拍照结果:', result);

    if (result.success) {
      console.log('舌苔检测拍照成功:', result.filename);
      alert(`舌苔检测拍照成功！文件名: ${result.filename}`);

      // 拍照成功后刷新照片列表
      await loadPhotoList();
    } else {
      console.error('舌苔检测拍照失败:', result.message);
      alert(`舌苔检测拍照失败: ${result.message}`);
    }
  } catch (error) {
    console.error('拍照失败:', error);
    alert('拍照失败，请重试');
  }
}

// 加载照片库数据
async function loadPhotoData() {
  try {
    photoLoading.value = true;
    console.log('📥 开始加载照片库数据...');

    const result = await cameraApi.getPhotoList();

    if (result && result.data) {
      // 适配返回数据结构
      photoData.value = Array.isArray(result.data.photos) ? result.data.photos : result.data;
      console.log('✅ 照片库数据加载成功:', photoData.value.length, '张照片');
    } else {
      console.error('❌ 照片库数据加载失败: 返回数据格式异常');
      photoData.value = [];
    }
  } catch (error) {
    console.error('❌ 加载照片库数据时出错:', error);
    photoData.value = [];
  } finally {
    photoLoading.value = false;
  }
}

// 点击外部关闭下拉框
function handleClickOutside(event) {
  const dropdownContainer = event.target.closest('.photo-dropdown-container');
  if (!dropdownContainer && isPhotoDropdownOpen.value) {
    isPhotoDropdownOpen.value = false;
  }
}

// 切换照片下拉框
function togglePhotoDropdown() {
  isPhotoDropdownOpen.value = !isPhotoDropdownOpen.value;
}

// 选择照片
function selectPhoto(photo) {
  selectedPhoto.value = photo;
  isPhotoDropdownOpen.value = false; // 选择后关闭下拉框
  console.log('✅ 选择照片:', photo.filename);
}

// 获取选中照片的URL列表
function getSelectedPhotoUrls() {
  return selectedPhoto.value ? [selectedPhoto.value.url] : [];
}

// 舌苔检测分析
async function analyze() {
  try {
    // 验证输入
    const validation = validateTongueInput(prompt.value, selectedPhoto.value ? [selectedPhoto.value] : []);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    analysisLoading.value = true;
    console.log('🎯 开始舌苔检测分析...');
    console.log('📝 提示词:', prompt.value);
    console.log('📷 选中照片:', selectedPhoto.value?.filename);

    // 获取选中照片的URL列表
    const photoUrls = getSelectedPhotoUrls();
    console.log('🔗 照片URLs:', photoUrls);

    // 调用舌苔检测API
    const result = await analyzeTongueData(photoUrls, prompt.value);

    if (result.success) {
      console.log('✅ 舌苔检测成功');
      const formattedResult = formatTongueAnalysisResult(result.data);
      detectionOutput.value = formattedResult;
      result.value = formattedResult;
    } else {
      console.error('❌ 舌苔检测失败:', result.message);
      detectionOutput.value = `检测失败: ${result.message}`;
      result.value = `检测失败: ${result.message}`;
    }
  } catch (error) {
    console.error('❌ 舌苔检测过程中出错:', error);
    detectionOutput.value = `检测出错: ${error.message}`;
    result.value = `检测出错: ${error.message}`;
  } finally {
    analysisLoading.value = false;
  }
}
</script>
<style scoped>
/* ...原样拷贝... */
.dialog-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-box {
  background: linear-gradient(135deg,
      rgba(26, 26, 26, 0.95) 0%,
      rgba(45, 45, 45, 0.9) 50%,
      rgba(26, 26, 26, 0.95) 100%);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 16px;
  min-width: 400px;
  padding: 0;
  position: relative;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(0, 153, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  color: #ffffff;
}
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px 0 32px;
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  margin-bottom: 24px;
}
.dialog-title {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00ccff, #0099ff, #ffffff);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
  margin: 0;
}
.dialog-close {
  position: absolute;
  right: 20px;
  top: 20px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #4da6ff;
  cursor: pointer;
  transition: color 0.3s ease;
}
.dialog-close:hover {
  color: #00ccff;
}
.dialog-content {
  padding: 0 32px 32px 32px;
}
.dialog-content.dialog-flex {
  display: flex;
  flex-direction: row;
  gap: 32px;
}
.dialog-preview {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  min-width: 320px;
  max-width: 700px;
  background: linear-gradient(135deg, rgba(0, 153, 255, 0.05), rgba(77, 166, 255, 0.05));
  border: 1px solid rgba(0, 153, 255, 0.2);
  border-radius: 12px;
  padding: 18px 12px;
  margin-right: 0;
}

/* 摄像头预览样式 */
.camera-preview-box {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}

.camera-preview {
  width: 100%;
  max-width: 480px;
  height: 360px;
  background: #101c2c;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid rgba(0, 153, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

.camera-preview:hover {
  border-color: rgba(0, 153, 255, 0.5);
  box-shadow: 0 12px 40px rgba(0, 153, 255, 0.2);
}

/* 视频加载状态样式 */
.video-loading {
  width: 100%;
  max-width: 480px;
  height: 360px;
  background: #101c2c;
  border-radius: 16px;
  border: 2px solid rgba(0, 153, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #42a5f5;
  font-size: 1.1rem;
  font-weight: 500;
  gap: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 153, 255, 0.2);
  border-top: 3px solid #00ccff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.camera-status {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #42a5f5;
  font-size: 1rem;
  font-weight: 500;
  padding: 8px 16px;
  background: rgba(0, 153, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 153, 255, 0.2);
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.camera-status:hover {
  background: rgba(0, 153, 255, 0.15);
  border-color: rgba(0, 153, 255, 0.3);
}

/* 拍照功能模块样式 */
.capture-module {
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
  width: 600px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.capture-module:hover {
  border-color: rgba(0, 153, 255, 0.5);
  box-shadow: 0 12px 40px rgba(0, 153, 255, 0.1);
}

.detection-instruction {
  text-align: center;
}

.detection-instruction p {
  color: #e0e0e0;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 153, 255, 0.3), transparent);
  margin: 20px 0;
  border-radius: 1px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 按钮样式 */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.btn-primary {
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.9));
  color: #00ccff;
  border: 2px solid rgba(0, 153, 255, 0.4);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(0, 153, 255, 0.2);
}

.btn-primary:hover:not(:disabled) {
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

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:active {
  transform: translateY(0px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(0, 153, 255, 0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* 控制区域样式 */
.photo-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.timer-label {
  color: #e0e0e0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.timer-input {
  width: 60px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 153, 255, 0.3);
  background: rgba(16, 28, 44, 0.8);
  color: #e0e0e0;
  font-size: 0.9rem;
  text-align: center;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.timer-input:focus {
  outline: none;
  border-color: #00ccff;
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
}

/* 状态信息样式 */
.timer-info {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 15px;
  background: rgba(0, 153, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid #00ccff;
}

.timer-status {
  color: #e0e0e0;
  font-weight: 500;
  font-size: 0.85rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.video-player {
  width: 100%;
  max-height: 340px;
  border-radius: 12px;
  background: #101c2c;
}
.video-name {
  margin-top: 10px;
  text-align: center;
  color: #4da6ff;
  font-weight: 500;
  font-size: 0.9rem;
}
.preview-placeholder {
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  font-size: 1.1rem;
  background: rgba(0, 153, 255, 0.05);
  border: 2px dashed rgba(0, 153, 255, 0.2);
  border-radius: 8px;
}
.dialog-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  min-width: 260px;
  max-width: 400px;
  gap: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-label {
  color: #e0e0e0;
  font-weight: 500;
  font-size: 0.9rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}
.form-select,
.form-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 153, 255, 0.3);
  background: rgba(26, 26, 26, 0.7);
  color: #e0e0e0;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}
.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #0099ff;
  box-shadow: 0 0 10px rgba(0, 153, 255, 0.2);
}
.btn-submit {
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, rgba(0, 153, 255, 0.2), rgba(77, 166, 255, 0.3));
  color: #4da6ff;
  border: 1px solid rgba(0, 153, 255, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(0, 153, 255, 0.3), rgba(77, 166, 255, 0.4));
  border-color: rgba(0, 153, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 153, 255, 0.3);
}
.btn-submit:disabled {
  background: rgba(100, 100, 100, 0.2);
  color: #666;
  cursor: not-allowed;
  border-color: rgba(100, 100, 100, 0.3);
}
.analysis-result,
.detection-results {
  border: 1px solid rgba(0, 153, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  background: rgba(0, 153, 255, 0.05);
}
.result-title {
  color: #e0e0e0;
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 12px 0;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}
.result-content {
  color: #e0e0e0;
  font-size: 0.9rem;
  line-height: 1.5;
  background: rgba(26, 26, 26, 0.5);
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid #0099ff;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}
.detection-output {
  width: 100%;
  height: 200px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid rgba(0, 153, 255, 0.2);
  background: rgba(26, 26, 26, 0.7);
  color: #e0e0e0;
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  resize: vertical;
  line-height: 1.4;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}
.detection-output:focus {
  outline: none;
  border-color: #0099ff;
  box-shadow: 0 0 10px rgba(0, 153, 255, 0.2);
}

/* 照片选择器样式 */
.photo-selector {
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.photo-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.time-range-select {
  flex: 1;
  max-width: 150px;
}

.btn-refresh {
  padding: 8px 16px;
  border: 1px solid rgba(0, 153, 255, 0.4);
  border-radius: 6px;
  background: rgba(0, 153, 255, 0.1);
  color: #4da6ff;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: rgba(0, 153, 255, 0.2);
  border-color: rgba(0, 153, 255, 0.6);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.photo-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #42a5f5;
  font-size: 1rem;
  gap: 16px;
}

.photo-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #888;
  font-size: 1rem;
  border: 2px dashed rgba(0, 153, 255, 0.2);
  border-radius: 8px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(16, 28, 44, 0.3);
  border-radius: 8px;
}

.photo-item {
  position: relative;
  border: 2px solid rgba(0, 153, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(26, 26, 26, 0.8);
}

.photo-item:hover {
  border-color: rgba(0, 153, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 153, 255, 0.2);
}

.photo-item.selected {
  border-color: #00ccff;
  box-shadow: 0 0 15px rgba(0, 204, 255, 0.4);
}

.photo-item.selected::after {
  content: '✓';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #00ccff;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.photo-thumbnail {
  width: 100%;
  height: 80px;
  object-fit: cover;
  display: block;
}

.photo-info {
  padding: 8px;
  background: rgba(16, 28, 44, 0.8);
}

.photo-name {
  display: block;
  font-size: 0.75rem;
  color: #e0e0e0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.photo-date {
  display: block;
  font-size: 0.7rem;
  color: #888;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-photos {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(0, 153, 255, 0.1);
  border-radius: 6px;
  border-left: 3px solid #00ccff;
}

.selected-count {
  color: #e0e0e0;
  font-size: 0.85rem;
  font-weight: 500;
}

/* 照片下拉框样式 */
.photo-dropdown-container {
  position: relative;
}

.photo-dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(16, 28, 44, 0.8);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 60px;
}

.photo-dropdown-trigger:hover {
  border-color: rgba(0, 153, 255, 0.5);
  background: rgba(16, 28, 44, 0.9);
}

.photo-dropdown-trigger.active {
  border-color: #00ccff;
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
}

.selected-photo-display {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.selected-photo-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(0, 153, 255, 0.3);
}

.selected-photo-name {
  color: #e0e0e0;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 2px;
}

.selected-photo-date {
  color: #888;
  font-size: 0.75rem;
}

.placeholder-text {
  color: #888;
  font-size: 0.9rem;
  font-style: italic;
}

.dropdown-arrow {
  color: #4da6ff;
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.photo-dropdown-trigger.active .dropdown-arrow {
  transform: rotate(180deg);
}

.photo-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(26, 26, 26, 0.98);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 8px;
  margin-top: 4px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.photo-dropdown-list {
  padding: 8px;
}

.photo-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 4px;
}

.photo-dropdown-item:hover {
  background: rgba(0, 153, 255, 0.1);
  border: 1px solid rgba(0, 153, 255, 0.2);
}

.photo-dropdown-item.selected {
  background: rgba(0, 153, 255, 0.2);
  border: 1px solid rgba(0, 153, 255, 0.4);
}

.photo-dropdown-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid rgba(0, 153, 255, 0.3);
}

.photo-dropdown-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.photo-dropdown-name {
  color: #e0e0e0;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-dropdown-date {
  color: #888;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dialog-box.large {
  min-width: 900px;
  width: 85vw;
  max-width: 1200px;
  min-height: 500px;
}
@keyframes statusPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 10px rgba(0, 153, 255, 0.6);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2);
    box-shadow: 0 0 20px rgba(0, 153, 255, 0.8);
  }
}

@media (max-width: 1024px) {
  .dialog-box.large {
    min-width: 700px;
    width: 90vw;
  }
  .dialog-content.dialog-flex {
    flex-direction: column;
    gap: 20px;
  }
  .dialog-preview,
  .dialog-form {
    max-width: none;
  }
}
@media (max-width: 768px) {
  .dialog-box.large {
    min-width: 300px;
    width: 95vw;
    min-height: auto;
    max-height: 90vh;
    overflow-y: auto;
  }

  .dialog-content.dialog-flex {
    flex-direction: column;
    gap: 12px;
  }

  .dialog-preview,
  .dialog-form {
    width: 100%;
    max-width: none;
    min-width: auto;
  }

  .camera-preview-box {
    height: 200px;
  }

  .btn,
  .btn-submit,
  .form-select,
  .form-input {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 16px;
    font-size: 14px;
    touch-action: manipulation;
  }

  .form-select,
  .form-input {
    font-size: 16px; /* 防止iOS缩放 */
  }

  .dialog-close {
    min-height: 44px;
    min-width: 44px;
    padding: 12px;
    font-size: 18px;
    touch-action: manipulation;
  }

  .capture-controls {
    flex-direction: column;
    gap: 10px;
  }

  .capture-controls .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .dialog-box.large {
    width: 98vw;
    max-height: 95vh;
    padding: 12px;
  }

  .camera-preview-box {
    height: 150px;
  }

  .btn,
  .btn-submit {
    min-height: 48px;
    padding: 14px 18px;
    font-size: 16px;
  }

  .form-select,
  .form-input {
    min-height: 48px;
    padding: 14px 16px;
    font-size: 16px;
  }

  .dialog-close {
    min-height: 48px;
    min-width: 48px;
    padding: 14px;
    font-size: 20px;
  }

  .detection-instruction p {
    font-size: 14px;
  }

  .form-label {
    font-size: 14px;
  }

  .dialog-header {
    padding: 15px 20px 0 20px;
  }
  .dialog-content {
    padding: 0 20px 20px 20px;
  }
  .dialog-title {
    font-size: 1.2rem;
  }

  .camera-preview {
    height: 240px;
  }

  .video-loading {
    height: 240px;
  }

  .photo-controls {
    flex-direction: column;
  }

  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    max-height: 200px;
  }

  .photo-selector-header {
    flex-direction: column;
    gap: 8px;
  }

  .time-range-select {
    max-width: none;
  }

  .photo-dropdown-trigger {
    min-height: 50px;
  }

  .selected-photo-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .photo-dropdown-item {
    padding: 8px;
  }

  .photo-dropdown-thumbnail {
    width: 40px;
    height: 40px;
  }
}
</style>
