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
          <div class="form-group">
            <label class="form-label">选择照片：</label>
            <select v-model="selectedVideoIdx" class="form-select">
              <option value="" disabled>请选择舌苔照片</option>
              <option v-for="(video, idx) in videos" :key="idx" :value="idx">{{ video.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">提示词：</label>
            <input v-model="prompt" placeholder="如：请分析舌苔健康状况" class="form-input" />
          </div>
          <button class="btn-submit" @click="analyze" :disabled="selectedVideoIdx===null || !prompt">
            提交检测
          </button>
          <div v-if="result" class="analysis-result">
            <h4 class="result-title">检测结果：</h4>
            <div class="result-content">{{ result }}</div>
          </div>
          <div class="detection-results">
            <h4 class="result-title">检测结果：</h4>
            <textarea v-model="detectionOutput" class="detection-output" placeholder="舌苔检测开始...
检测到舌苔颜色：淡红色
舌苔厚度：适中
舌苔分布：均匀
舌苔质地：正常
建议：继续保持良好的口腔卫生习惯" readonly></textarea>
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

watch(() => props.visible, v => {
  if (!v) {
    selectedVideoIdx.value = null;
    prompt.value = '';
    result.value = '';
  }
});

// 生命周期
onMounted(() => {
  initializeCamera();
  loadPhotoList();
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

function analyze() {
  // mock大模型返回
  result.value = `检测结果：针对"${prompt.value}"，舌苔健康状况良好。`;
  
  // 模拟检测结果输出
  detectionOutput.value = `舌苔检测开始...
检测到舌苔颜色：淡红色
舌苔厚度：适中
舌苔分布：均匀
舌苔质地：正常
建议：继续保持良好的口腔卫生习惯`;
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
}
</style> 