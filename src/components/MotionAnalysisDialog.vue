<template>
  <div v-if="visible" class="dialog-mask">
    <div class="dialog-box large">
      <div class="dialog-header">
        <h2 class="dialog-title">运动检测分析 (带骨骼检测)</h2>
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
              :key="visible"
              class="camera-preview"
              @error="handleVideoError"
              @load="handleVideoLoad"
            />
          </div>


          <!-- 拍照功能模块 -->
          <div class="capture-module">
            <div class="detection-instruction">
              <p>请在摄像头前进行运动，系统将实时显示骨骼检测结果，并按设定间隔自动拍摄记录运动过程。</p>
            </div>

            <div class="tab-content">
              <!-- 定时拍照 -->
              <div class="timer-photo-section">
                <div class="timer-controls">
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
                  <div class="timer-buttons">
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
                </div>
                <div class="timer-info" v-if="isTimerPhotoActive">
                  <span class="timer-status">下次拍照倒计时: {{ timerCountdown }}秒</span>
                  <span class="photo-count">已拍摄: {{ timerPhotoCount }}张</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-form">
          <div class="form-group">
            <label class="form-label">选择视频：</label>
            <select v-model="selectedVideoIdx" class="form-select">
              <option value="" disabled>请选择视频</option>
              <option v-for="(video, idx) in videos" :key="idx" :value="idx">{{ video.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">提示词：</label>
            <input v-model="prompt" placeholder="如：这段运动需要注意什么" class="form-input" />
          </div>
          <button class="btn-submit" @click="analyze" :disabled="selectedVideoIdx===null || !prompt">
            提交分析
          </button>
          <div v-if="result" class="analysis-result">
            <h4 class="result-title">分析建议：</h4>
            <div class="result-content">{{ result }}</div>
          </div>
          <div class="detection-results">
            <h4 class="result-title">检测结果：</h4>
            <textarea v-model="detectionOutput" class="detection-output" placeholder="运动检测开始...
检测到关键点：头部、肩膀、肘部、手腕、髋部、膝盖、脚踝
姿态评估：整体姿态良好
运动轨迹：流畅连贯
建议：继续保持当前动作标准" readonly></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { cameraApi } from '../api/cameraApi';

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

const props = defineProps({
  visible: Boolean,
  videos: Array
});
const emit = defineEmits(['close']);
const selectedVideoIdx = ref(null);
const prompt = ref('');
const result = ref('');
const detectionOutput = ref('');

// 暴露给模板使用的函数
const getVideoFeed = () => {
  const videoUrl = getSkeletonVideoFeed();
  console.log('运动检测视频流URL:', videoUrl);
  return videoUrl;
};

// 摄像头相关
const cameraActive = ref(false);
const cameraStatus = ref('摄像头未连接');
const cameraInfo = ref(null);
const videoLoading = ref(true);

// 拍照相关
const photos = ref([]); // {filename, size, size_kb, date, url, download_url}
const photoInterval = ref(5);
const isTimerPhotoActive = ref(false);
const timerCountdown = ref(0);
const timerPhotoCount = ref(0);
let timerPhotoTimer = null;
let countdownTimer = null;

watch(() => props.visible, v => {
  if (!v) {
    selectedVideoIdx.value = null;
    prompt.value = '';
    result.value = '';
    detectionOutput.value = '';
  } else {

  }
});

// 生命周期
onMounted(() => {
  initializeCamera();
  loadPhotoList();
});

onBeforeUnmount(() => {
  stopTimerPhoto();
});

// 摄像头控制
async function initializeCamera() {
  try {
    // 检查摄像头状态
    const status = await checkCameraStatus();
    console.log('摄像头状态:', status);

    // 获取摄像头信息
    const info = await getCameraInfo();
    cameraInfo.value = info;
    console.log('摄像头信息:', info);

    // 设置摄像头状态
    cameraActive.value = true;
    cameraStatus.value = '摄像头已连接';
    videoLoading.value = true; // 开始加载视频流
    // 2秒后自动关闭 loading，和舌苔检测一致
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
    const photoList = await getPhotoList();
    photos.value = photoList;
    console.log('照片列表:', photoList);
  } catch (error) {
    console.error('加载照片列表失败:', error);
  }
}

// 手动拍照功能
async function takePhoto() {
  if (!cameraActive.value) {
    alert('请先连接摄像头');
    return;
  }

  try {
    // 这里可以调用拍照API，暂时使用模拟拍照
    // 实际项目中需要后端提供拍照接口
    console.log('运动检测拍照功能 - 需要后端提供拍照API');

    // 模拟拍照后刷新照片列表
    await loadPhotoList();
  } catch (error) {
    console.error('拍照失败:', error);
    alert('拍照失败，请重试');
  }
}

// 定时拍照功能
function startTimerPhoto() {
  if (!cameraActive.value) {
    alert('请先连接摄像头');
    return;
  }

  isTimerPhotoActive.value = true;
  timerPhotoCount.value = 0;
  timerCountdown.value = photoInterval.value;

  // 立即拍一张照片
  takePhoto();
  timerPhotoCount.value++;

  // 开始倒计时
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
  // mock大模型返回
  result.value = `分析结果：针对"${prompt.value}"，建议保持正确姿势，注意安全。`;

  // 模拟检测结果输出
  detectionOutput.value = `运动检测开始...
检测到关键点：头部、肩膀、肘部、手腕、髋部、膝盖、脚踝
姿态评估：整体姿态良好
运动轨迹：流畅连贯
建议：继续保持当前动作标准`;
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
  padding: 10px 15px;
  font-size: 0.9rem;
  font-weight: 500;
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
  padding: 15px;
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

.module-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #00ccff;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
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

.btn-success {
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.9));
  color: #4caf50;
  border: 2px solid rgba(76, 175, 80, 0.4);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(76, 175, 80, 0.2);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(102, 187, 106, 0.15));
  border-color: rgba(76, 175, 80, 0.6);
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 0 1px rgba(76, 175, 80, 0.4),
    0 0 20px rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
  color: #66bb6a;
}

.btn-success:hover::before {
  left: 100%;
}

.btn-success:active {
  transform: translateY(0px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(76, 175, 80, 0.2);
}

.btn-danger {
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.9));
  color: #f44336;
  border: 2px solid rgba(244, 67, 54, 0.4);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(244, 67, 54, 0.2);
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(255, 107, 107, 0.15));
  border-color: rgba(244, 67, 54, 0.6);
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 0 1px rgba(244, 67, 54, 0.4),
    0 0 20px rgba(244, 67, 54, 0.2);
  transform: translateY(-2px);
  color: #ff6b6b;
}

.btn-danger:hover::before {
  left: 100%;
}

.btn-danger:active {
  transform: translateY(0px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(244, 67, 54, 0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* 控制区域样式 */
.timer-photo-section {
  border-top: 1px solid rgba(0, 153, 255, 0.2);
  padding-top: 15px;
  margin-top: 15px;
}

.timer-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
  justify-content: center;
}

.timer-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
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
  gap: 20px;
  align-items: center;
  padding: 10px 15px;
  background: rgba(0, 153, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid #00ccff;
}

.timer-status, .photo-count {
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

/* 图标样式 */
.icon-capture::before { content: "📹"; }

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

  .timer-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
