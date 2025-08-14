<template>
  <div>
    <Navbar />
    <main class="main-content vision-system-main">
      <!-- 摄像头预览和功能控制区域 -->
      <section class="camera-control-section">
        <!-- 摄像头预览区域 -->
        <div class="camera-preview-section">
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
            <canvas ref="canvasRef" style="display: none;"></canvas>
          </div>
          <!-- <div class="camera-status">
            <span>{{ cameraStatus }}</span>
          </div> -->
        </div>

        <!-- 拍摄功能模块 -->
        <div class="function-module capture-module">
          <div class="module-header">
            <h3 class="module-title">

              拍摄模块
            </h3>
          </div>

          <!-- 拍照功能内容 -->
          <div class="tab-content">
            <!-- 手动拍照 -->
            <div class="photo-controls">
              <div class="photo-input-group">
                <label class="photo-label">
                  倒计时:
                  <input
                    type="number"
                    v-model.number="photoCountdown"
                    min="0"
                    max="60"
                    class="photo-input"
                    placeholder="0表示立即拍照"
                  /> 秒
                </label>
              </div>
              <button class="btn btn-primary" @click="takePhoto(photoCountdown || null)">
                {{ photoCountdown > 0 ? `倒计时${photoCountdown}秒拍照` : '立即拍照' }}
              </button>
            </div>

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
                    @click="startContinuousPhoto"
                    :disabled="isContinuousPhotoActive"
                  >
                    {{ isContinuousPhotoActive ? '拍摄中...' : '启动连续拍摄' }}
                  </button>
                  <button
                    class="btn btn-danger"
                    @click="stopContinuousPhoto"
                    :disabled="!isContinuousPhotoActive"
                  >
                    停止连续拍摄
                  </button>
                </div>
              </div>
              <div class="timer-info" v-if="isContinuousPhotoActive">
                <span class="timer-status">连续拍摄已启动，间隔: {{ photoInterval }}秒</span>
                <span class="photo-count">已拍摄: {{ continuousPhotoCount }}张</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 已拍摄照片列表 -->
      <section class="media-list-section">
        <div class="media-list photo-list">
          <h4 class="list-title">
            已拍摄照片 ({{ photos.length }})
          </h4>
          <div v-if="photos.length === 0" class="empty-tip">暂无照片</div>
          <div class="media-grid" v-else>
            <div v-for="(photo, idx) in photos" :key="'photo-' + photo.filename + '-' + idx" class="media-item">
              <div class="media-preview">
                <img :src="photo.url" :alt="photo.filename" class="preview-image" @error="handleImageError" @load="handleImageLoad" />
                <!-- 调试信息 -->
                <div class="debug-info" style="font-size: 10px; color: #666; margin-top: 5px;">
                  URL: {{ photo.url }}
                </div>
              </div>
              <div class="media-info">
                <span class="media-name">{{ photo.filename }}</span>
                <span class="media-size">{{ formatFileSize(photo.size) }}</span>
                <span class="media-date">{{ photo.date }}</span>
              </div>
              <div class="media-actions">
                <button class="btn btn-small btn-primary" @click="previewPhoto(photo)">
                  预览
                </button>
                <button class="btn btn-small btn-success" @click="downloadPhoto(photo)">
                  下载
                </button>
                <button class="btn btn-small btn-danger" @click="deletePhoto(idx)">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 注意：MotionAnalysisDialog 和 TongueAnalysisDialog 现在是独立的页面组件，通过路由访问 -->

      <!-- 预览弹窗 -->
      <div v-if="showPreview" class="preview-modal" @click="closePreview">
        <div class="preview-content" @click.stop>
          <button class="close-btn" @click="closePreview">&times;</button>
          <img :src="previewUrl" class="preview-media" />
        </div>
      </div>
    </main>
  </div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Navbar from '../components/Navbar.vue';
import { cameraApi } from '../api/cameraApi';

const {
  getRawVideoFeed,
  getPhotoList,
  deletePhoto: apiDeletePhoto,
  takePhoto: apiTakePhoto,
  startContinuousPhoto: apiStartContinuousPhoto,
  stopContinuousPhoto: apiStopContinuousPhoto,
  checkCameraStatus
} = cameraApi;

// 暴露给模板使用的函数
const getVideoFeed = () => {
  const videoUrl = getRawVideoFeed();
  console.log('视频流URL:', videoUrl);
  return videoUrl;
};

// DOM引用
const canvasRef = ref(null);

// 摄像头相关
const cameraActive = ref(false);
const cameraStatus = ref('摄像头未连接');
const cameraInfo = ref(null);
const videoLoading = ref(true);

// 拍照相关
const photos = ref([]); // {filename, size, size_kb, date, url, download_url}
const photoInterval = ref(5);
const photoCountdown = ref(0); // 倒计时秒数
const isContinuousPhotoActive = ref(false);
const continuousPhotoCount = ref(0);

// 连续拍照定时器
let photoCountTimer = null;
  // 照片列表刷新防重入锁
  let isRefreshingPhotos = false;
  // 连续拍照会话开始时的基准数量
  let sessionBaselinePhotoCount = 0;

// 预览相关
const showPreview = ref(false);
const previewUrl = ref('');

// 注意：运动检测和舌苔检测现在是独立页面，通过路由访问

// 生命周期
onMounted(() => {
  console.log('=== VisionSystemView 组件已挂载 ===');
  console.log('cameraApi:', cameraApi);
  console.log('apiTakePhoto:', apiTakePhoto);
  console.log('apiStartContinuousPhoto:', apiStartContinuousPhoto);

  // 运动检测和舌苔检测现在通过路由访问，不需要事件监听器
  initializeCamera();
  loadPhotoList();
});

onBeforeUnmount(() => {
  // 如果连续拍照还在运行，尝试停止它
  if (isContinuousPhotoActive.value) {
    stopContinuousPhoto();
  }

  // 清理定时器
  if (photoCountTimer) {
    clearInterval(photoCountTimer);
    photoCountTimer = null;
  }

  // 不再需要清理对话框事件监听器
});

// 摄像头控制
async function initializeCamera() {
  try {
    console.log('开始初始化摄像头...');
    console.log('摄像头API基础URL:', '/api-cam');
    videoLoading.value = true;

    // 调用API检查摄像头状态
    console.log('正在调用摄像头状态检查API...');
    const cameraStatusResult = await checkCameraStatus();
    console.log('摄像头状态API响应:', cameraStatusResult);

    if (cameraStatusResult && cameraStatusResult.success) {
      cameraActive.value = true;
      cameraStatus.value = cameraStatusResult.message || '摄像头已连接';
      cameraInfo.value = cameraStatusResult;
      console.log('摄像头初始化成功:', cameraStatusResult);
    } else {
      // 即使状态检查失败，也允许尝试拍照
      cameraActive.value = true;
      cameraStatus.value = '摄像头状态未知，但允许尝试拍照';
      console.warn('摄像头状态检查失败，但允许尝试拍照:', cameraStatusResult);
    }

    // 延迟一下再隐藏加载状态，给视频流一些时间加载
    setTimeout(() => {
      if (videoLoading.value) {
        videoLoading.value = false;
      }
    }, 2000);
  } catch (error) {
    console.error('初始化摄像头失败:', error);
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: error.config
    });

    // 即使初始化失败，也允许尝试拍照
    cameraActive.value = true;
    cameraStatus.value = '摄像头初始化失败，但允许尝试拍照';
    videoLoading.value = false;
  }
}

// 视频流错误处理
function handleVideoError() {
  console.error('视频流加载失败');
  // 只有在API检查失败时才更新状态
  if (!cameraActive.value) {
    cameraStatus.value = '视频流连接失败';
    videoLoading.value = false;
  }
}

// 视频流加载成功处理
function handleVideoLoad() {
  console.log('视频流加载成功');
  // 只有在API检查成功时才更新状态
  if (cameraActive.value) {
    videoLoading.value = false;
  }
}

// 加载照片列表
async function loadPhotoList() {
  try {
    const response = await getPhotoList();
    console.log('照片列表API响应:', response);

    // 从Axios响应对象中提取数据
    const result = response.data || response;
    console.log('提取的照片数据:', result);

    if (result && result.photos) {
      // 处理照片URL，确保使用正确的代理路径
      const processedPhotos = result.photos.map(photo => ({
        ...photo,
        // 将照片URL从 /api/photos/ 改为 /api-cam/photos/，使用摄像头代理
        url: photo.url.startsWith('/api/photos/')
          ? photo.url.replace('/api/photos/', '/api-cam/photos/')
          : photo.url,
        // 处理下载URL
        download_url: photo.download_url
          ? (photo.download_url.startsWith('/api/photos/')
              ? photo.download_url.replace('/api/photos/', '/api-cam/photos/')
              : photo.download_url)
          : photo.url.startsWith('/api/photos/')
            ? photo.url.replace('/api/photos/', '/api-cam/photos/')
            : photo.url
      }));

      photos.value = processedPhotos;
      console.log('照片列表:', result);
      console.log('处理后的照片列表:', processedPhotos);
      console.log('照片总数:', result.count);
      console.log('更新后的照片数组长度:', photos.value.length);
    } else {
      photos.value = [];
      console.log('照片列表为空');
    }
  } catch (error) {
    console.error('加载照片列表失败:', error);
    photos.value = [];
  }
}



// 手动拍照功能
async function takePhoto(seconds = null) {
  try {
    console.log('=== takePhoto函数被调用 ===');
    console.log('cameraActive.value:', cameraActive.value);
    console.log('cameraStatus.value:', cameraStatus.value);
    console.log('倒计时参数:', seconds);

    // 移除摄像头状态检查的阻止逻辑，允许尝试拍照
    console.log('开始拍照...');
    console.log('调用API: POST /photos/photo');
    console.log('摄像头状态:', cameraActive.value);
    console.log('API基础URL:', '/api-cam');

    // 根据是否有倒计时参数调用不同的API
    const response = seconds ? await apiTakePhoto(seconds) : await apiTakePhoto();
    console.log('拍照API响应:', response);
    const result = response.data || response;
    console.log('提取的拍照数据:', result);

    if (result && result.success) {
      console.log('拍照成功:', result.filename);
      alert(`拍照成功！文件名: ${result.filename}`);

      // 拍照成功后刷新照片列表
      await loadPhotoList();
    } else {
      const errorMsg = result?.message || '拍照失败，未知错误';
      console.error('拍照失败:', errorMsg);
      alert(`拍照失败: ${errorMsg}`);
    }
  } catch (error) {
    console.error('拍照API调用失败:', error);
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: error.config
    });

    let errorMessage = '拍照失败，请重试';
    if (error.response?.status === 404) {
      errorMessage = '拍照接口不存在，请检查后端服务';
    } else if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请稍后重试';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    alert(errorMessage);
  }
}

// 连续拍照功能
async function startContinuousPhoto() {
  console.log('=== startContinuousPhoto函数被调用 ===');

  // 移除摄像头状态检查的阻止逻辑，允许尝试连续拍照

  try {
    console.log('开始连续拍照...');
    console.log('调用API: POST /photos/continuous');
    console.log('拍照间隔:', photoInterval.value);
    console.log('摄像头状态:', cameraActive.value);
    console.log('API基础URL:', '/api-cam');

    const response = await apiStartContinuousPhoto(photoInterval.value);
    console.log('连续拍照API响应:', response);
    const result = response.data || response;
    console.log('提取的连续拍照数据:', result);

    if (result && result.success) {
      console.log('连续拍照启动成功:', result.message);
      isContinuousPhotoActive.value = true;
      continuousPhotoCount.value = 0;

      // 立即刷新一次照片列表并记录会话基准数量
      await loadPhotoList();
      sessionBaselinePhotoCount = photos.value.length;
      continuousPhotoCount.value = 0;

      // 启动定时器，定期刷新照片列表来更新计数和显示（复用统一处理的 loadPhotoList）
      photoCountTimer = setInterval(async () => {
        if (isRefreshingPhotos) return;
        isRefreshingPhotos = true;
        try {
          console.log('连续拍照定时器触发，正在刷新照片列表...');
          const oldCount = photos.value.length;
          await loadPhotoList();
          const newCount = photos.value.length;
          continuousPhotoCount.value = Math.max(0, newCount - sessionBaselinePhotoCount);

          console.log(`连续拍照期间更新照片列表 - 旧数量: ${oldCount}, 新数量: ${newCount}`);
          // 如果有新照片，显示提示
          if (newCount > oldCount) {
            console.log(`发现 ${newCount - oldCount} 张新照片`);
            const newPhotos = photos.value.slice(oldCount);
            console.log('新增的照片:', newPhotos);
          }
        } catch (error) {
          console.error('更新照片列表失败:', error);
        } finally {
          isRefreshingPhotos = false;
        }
      }, 1000); // 每1秒更新一次，提高响应速度

      alert(`连续拍照已启动！间隔: ${photoInterval.value}秒`);
    } else {
      const errorMsg = result?.message || '启动连续拍照失败，未知错误';
      console.error('启动连续拍照失败:', errorMsg);
      alert(`启动连续拍照失败: ${errorMsg}`);
    }
  } catch (error) {
    console.error('启动连续拍照API调用失败:', error);
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: error.config
    });

    let errorMessage = '启动连续拍照失败，请重试';
    if (error.response?.status === 404) {
      errorMessage = '连续拍照接口不存在，请检查后端服务';
    } else if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请稍后重试';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    alert(errorMessage);
  }
}

async function stopContinuousPhoto() {
  try {
    console.log('停止连续拍照...');
    console.log('调用API: DELETE /photos/continuous');

    const response = await apiStopContinuousPhoto();
    console.log('停止连续拍照API响应:', response);
    const result = response.data || response;
    console.log('提取的停止连续拍照数据:', result);

    if (result && result.success) {
      console.log('连续拍照停止成功:', result.message);
      isContinuousPhotoActive.value = false;

      // 清理定时器
      if (photoCountTimer) {
        clearInterval(photoCountTimer);
        photoCountTimer = null;
      }

      alert('连续拍照已停止');

      // 停止后刷新照片列表
      await loadPhotoList();
    } else {
      const errorMsg = result?.message || '停止连续拍照失败，未知错误';
      console.error('停止连续拍照失败:', errorMsg);
      alert(`停止连续拍照失败: ${errorMsg}`);
    }
  } catch (error) {
    console.error('停止连续拍照API调用失败:', error);
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });

    let errorMessage = '停止连续拍照失败，请重试';
    if (error.response?.status === 404) {
      errorMessage = '连续拍照接口不存在，请检查后端服务';
    } else if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请稍后重试';
    } else if (error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }

    alert(errorMessage);
  }
}

// 预览功能
async function previewPhoto(photo) {
  try {
    // 直接使用照片的URL，避免额外的API调用
    previewUrl.value = photo.url;
    showPreview.value = true;
    console.log('预览照片:', photo.filename);
  } catch (error) {
    console.error('预览照片失败:', error);
    alert('预览失败，请重试');
  }
}

function closePreview() {
  showPreview.value = false;
  previewUrl.value = '';
}

// 下载功能
async function downloadPhoto(photo) {
  try {
    // 直接使用照片的下载URL，避免额外的API调用
    const a = document.createElement('a');
    a.href = photo.download_url || photo.url;
    a.download = photo.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log('下载照片:', photo.filename);
  } catch (error) {
    console.error('下载照片失败:', error);
    alert('下载失败，请重试');
  }
}

// 删除功能
async function deletePhoto(idx) {
  const photo = photos.value[idx];
  if (confirm(`确定要删除照片 "${photo.filename}" 吗？`)) {
    try {
      const response = await apiDeletePhoto(photo.filename);
      console.log('删除API响应:', response);
      const result = response.data || response;
      console.log('提取的删除数据:', result);

      if (result.success) {
        console.log('删除成功:', result.message);
        // 从列表中移除
        photos.value.splice(idx, 1);
      } else {
        console.error('删除失败:', result.message);
        alert(`删除失败: ${result.message}`);
      }
    } catch (error) {
      console.error('删除照片失败:', error);
      alert('删除失败，请重试');
    }
  }
}

// 工具函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 图片加载处理函数
function handleImageLoad(event) {
  console.log('图片加载成功:', event.target.src);
}

function handleImageError(event) {
  console.error('图片加载失败:', event.target.src);
  // 可以在这里设置默认图片
  // event.target.src = '/path/to/default-image.jpg';
}
</script>
<style scoped>
/* 主容器样式 */
.vision-system-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #181818 100%);
  color: #ffffff;
}

/* 摄像头预览和功能控制区域 */
.camera-control-section {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  justify-content: center;
  align-items: flex-end;
}

/* 摄像头预览区域 */
.camera-preview-section {
  background: rgba(10, 20, 40, 0.95);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 153, 255, 0.15);
  padding: 30px;
  border: 1px solid rgba(0, 153, 255, 0.2);
  position: relative;
}

.camera-preview-box {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.camera-preview {
  width: 640px;
  height: 480px;
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
  width: 640px;
  height: 480px;
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
}

.camera-status:hover {
  background: rgba(0, 153, 255, 0.15);
  border-color: rgba(0, 153, 255, 0.3);
}

.function-module {
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 16px;
  padding: 25px;
  width: 400px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.function-module:hover {
  border-color: rgba(0, 153, 255, 0.5);
  box-shadow: 0 12px 40px rgba(0, 153, 255, 0.1);
}

.module-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  padding-bottom: 15px;
}

.module-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #00ccff;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  text-align: center;
}

.tab-selector {
  display: flex;
  gap: 10px;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 6px;
  background: rgba(16, 28, 44, 0.8);
  color: #42a5f5;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  background: rgba(0, 153, 255, 0.1);
  border-color: rgba(0, 153, 255, 0.5);
}

.tab-btn.active {
  background: linear-gradient(135deg, #0099ff, #00ccff);
  color: white;
  border-color: rgba(0, 153, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 153, 255, 0.3);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 按钮样式 */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
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

.btn-secondary {
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.9));
  color: #888;
  border: 2px solid rgba(136, 136, 136, 0.4);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(136, 136, 136, 0.2);
}

.btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(136, 136, 136, 0.1), rgba(153, 153, 153, 0.15));
  border-color: rgba(136, 136, 136, 0.6);
  box-shadow:
    0 6px 12px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 0 1px rgba(136, 136, 136, 0.4);
  transform: translateY(-2px);
  color: #aaa;
}

.btn-secondary:hover::before {
  left: 100%;
}

.btn-secondary:active {
  transform: translateY(0px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(136, 136, 136, 0.2);
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
.photo-controls {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.photo-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.photo-label {
  color: #42a5f5;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.photo-input {
  width: 60px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 153, 255, 0.3);
  background: rgba(16, 28, 44, 0.8);
  color: #42a5f5;
  font-size: 1rem;
  text-align: center;
}

.photo-input:focus {
  outline: none;
  border-color: #00ccff;
  box-shadow: 0 0 10px rgba(0, 204, 255, 0.3);
}

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
}

.timer-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.timer-label {
  color: #42a5f5;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timer-input {
  width: 60px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 153, 255, 0.3);
  background: rgba(16, 28, 44, 0.8);
  color: #42a5f5;
  font-size: 1rem;
  text-align: center;
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
  color: #00ccff;
  font-weight: 600;
}

/* 媒体列表区域 */
.media-list-section {
  width: 100%;
  max-width: 1200px;
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.media-list {
  flex: 1;
  min-width: 500px;
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(20px);
}

.list-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #00ccff;
  font-size: 1.2rem;
  font-weight: 600;
  border-bottom: 1px solid rgba(0, 153, 255, 0.2);
  padding-bottom: 10px;
}

.empty-tip {
  color: #888;
  font-size: 1rem;
  text-align: center;
  padding: 40px 20px;
  font-style: italic;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.media-item {
  background: rgba(16, 28, 44, 0.8);
  border: 1px solid rgba(0, 153, 255, 0.2);
  border-radius: 12px;
  padding: 15px;
  transition: all 0.3s ease;
}

.media-item:hover {
  border-color: rgba(0, 153, 255, 0.5);
  box-shadow: 0 4px 20px rgba(0, 153, 255, 0.1);
  transform: translateY(-2px);
}

.media-preview {
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-video {
  width: 100%;
  height: 150px;
  object-fit: cover;
  background: #000;
}

.preview-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  background: #000;
}

.media-info {
  margin-bottom: 10px;
}

.media-name {
  display: block;
  color: #e0e0e0;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 4px;
  word-break: break-all;
}

.media-size {
  display: block;
  color: #888;
  font-size: 0.8rem;
}

.media-date {
  display: block;
  color: #666;
  font-size: 0.75rem;
  margin-top: 2px;
}

.media-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.8rem;
  min-width: auto;
}

/* 预览弹窗样式 */
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: rgba(26, 26, 26, 0.95);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(0, 153, 255, 0.3);
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.preview-media {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

/* 图标样式 */
.icon-capture::before { content: "📹"; }
.icon-video::before { content: "🎥"; }
.icon-camera::before { content: "📷"; }
.icon-record::before { content: "⏺"; }
.icon-stop::before { content: "⏹"; }
.icon-timer::before { content: "⏰"; }
.icon-camera-capture::before { content: "📸"; }
.icon-video-list::before { content: "🎬"; }
.icon-eye::before { content: "👁"; }
.icon-download::before { content: "⬇"; }
.icon-delete::before { content: "🗑"; }

/* 全局字体统一 */
.vision-system-main,
.function-module,
.module-header,
.module-title,
.tab-btn,
.btn,
.camera-status,
.timer-label,
.media-name,
.media-size,
.media-date,
.list-title {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
}



/* 若弹窗内有标题，也可用如下样式 */
.motion-detect-title,
.tongue-detect-title {
  font-size: 1.4rem;
  font-weight: bold;
  color: #00ccff;
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .vision-system-main {
    padding: 80px 10px 20px;
  }

  .camera-control-section {
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }

  .camera-preview-section {
    width: 100%;
    max-width: none;
    padding: 20px;
  }

  .camera-preview-box {
    width: 100%;
    height: auto;
    min-height: 300px;
  }

  .camera-preview {
    width: 100%;
    max-width: 100%;
    height: auto;
    aspect-ratio: 16/9;
    min-height: 300px;
  }

  .video-loading {
    width: 100%;
    height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .function-module {
    width: 100%;
    max-width: none;
  }

  .module-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .tab-selector {
    width: 100%;
    justify-content: space-between;
  }

  .media-list-section {
    flex-direction: column;
  }

  .media-list {
    min-width: auto;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }

  .timer-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .photo-controls {
    flex-direction: column;
  }
}

/* 手机端优化 */
@media (max-width: 480px) {
  .vision-system-main {
    padding: 8px 4px;
    margin-top: 70px;
    min-height: calc(100vh - 70px);
    height: auto;
    overflow-y: auto;
  }

  .camera-control-section {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }

  .camera-preview-section {
    width: 100%;
    padding: 15px;
    margin-bottom: 15px;
  }

  .camera-preview-box {
    width: 100%;
    height: auto;
    min-height: 250px;
  }

  .camera-preview {
    width: 100%;
    max-width: 100%;
    height: auto;
    aspect-ratio: 16/9;
    min-height: 250px;
  }

  .video-loading {
    width: 100%;
    height: 250px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .function-module {
    width: 100%;
    padding: 15px;
    margin-bottom: 15px;
  }

  .module-title {
    font-size: 1.1rem;
  }

  .btn {
    min-height: 48px;
    font-size: 16px;
    padding: 14px 18px;
  }

  .capture-controls {
    flex-direction: column;
    gap: 10px;
  }

  .capture-controls .btn {
    width: 100%;
  }

  .module-header {
    margin-bottom: 12px;
  }

  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .media-list-section {
    width: 100%;
  }
}
</style>
