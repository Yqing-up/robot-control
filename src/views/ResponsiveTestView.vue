<template>
  <div class="responsive-test-main">
    <div class="container-responsive">
      <h1 class="text-responsive-large">响应式设计测试页面</h1>
      
      <!-- 按钮测试区域 -->
      <div class="card-responsive">
        <h2 class="text-responsive">按钮触屏测试</h2>
        <div class="button-group-responsive">
          <button class="btn btn-primary touch-target">标准按钮</button>
          <button class="btn btn-secondary touch-target">次要按钮</button>
          <button class="btn btn-danger touch-target">危险按钮</button>
          <button class="btn btn-success touch-target">成功按钮</button>
        </div>
        
        <div class="button-group-responsive">
          <button class="btn btn-small touch-target">小按钮</button>
          <button class="btn touch-target-large">大触屏按钮</button>
        </div>
      </div>

      <!-- 表单控件测试 -->
      <div class="card-responsive">
        <h2 class="text-responsive">表单控件测试</h2>
        <div class="flex-responsive">
          <input type="text" class="form-control-responsive" placeholder="文本输入框">
          <select class="form-control-responsive">
            <option>选择选项</option>
            <option>选项1</option>
            <option>选项2</option>
          </select>
        </div>
        
        <div class="spacing-responsive">
          <input type="range" class="form-control-responsive" min="0" max="100" value="50">
          <label class="text-responsive-small">滑块控件</label>
        </div>
      </div>

      <!-- 网格布局测试 */
      <div class="card-responsive">
        <h2 class="text-responsive">网格布局测试</h2>
        <div class="grid-responsive">
          <div class="card-responsive">
            <h3 class="text-responsive">卡片1</h3>
            <p class="text-responsive-small">这是一个响应式卡片</p>
            <button class="btn btn-primary touch-target">操作按钮</button>
          </div>
          <div class="card-responsive">
            <h3 class="text-responsive">卡片2</h3>
            <p class="text-responsive-small">这是另一个响应式卡片</p>
            <button class="btn btn-secondary touch-target">操作按钮</button>
          </div>
          <div class="card-responsive">
            <h3 class="text-responsive">卡片3</h3>
            <p class="text-responsive-small">第三个响应式卡片</p>
            <button class="btn btn-success touch-target">操作按钮</button>
          </div>
        </div>
      </div>

      <!-- 小网格测试 -->
      <div class="card-responsive">
        <h2 class="text-responsive">小网格测试</h2>
        <div class="grid-responsive-small">
          <button class="btn btn-primary touch-target">按钮1</button>
          <button class="btn btn-secondary touch-target">按钮2</button>
          <button class="btn btn-danger touch-target">按钮3</button>
          <button class="btn btn-success touch-target">按钮4</button>
          <button class="btn btn-primary touch-target">按钮5</button>
          <button class="btn btn-secondary touch-target">按钮6</button>
        </div>
      </div>

      <!-- 媒体测试 -->
      <div class="card-responsive">
        <h2 class="text-responsive">媒体响应式测试</h2>
        <div class="video-responsive" style="background: rgba(0,102,255,0.2); height: 200px; display: flex; align-items: center; justify-content: center;">
          <span class="text-responsive">视频区域占位符</span>
        </div>
      </div>

      <!-- 移动端显示/隐藏测试 -->
      <div class="card-responsive">
        <h2 class="text-responsive">显示/隐藏测试</h2>
        <div class="mobile-hidden">
          <p class="text-responsive">这段文字在移动端会隐藏</p>
          <button class="btn btn-primary touch-target">桌面端按钮</button>
        </div>
        <div class="mobile-only">
          <p class="text-responsive">这段文字只在移动端显示</p>
          <button class="btn btn-secondary touch-target">移动端专用按钮</button>
        </div>
      </div>

      <!-- 滚动测试 -->
      <div class="card-responsive">
        <h2 class="text-responsive">滚动优化测试</h2>
        <div class="scroll-responsive" style="height: 150px; background: rgba(0,0,0,0.2); padding: 16px;">
          <p class="text-responsive-small">这是一个可滚动的区域。</p>
          <p class="text-responsive-small">内容会超出容器高度。</p>
          <p class="text-responsive-small">滚动条已经过优化。</p>
          <p class="text-responsive-small">支持触屏滚动。</p>
          <p class="text-responsive-small">在移动设备上体验更好。</p>
          <p class="text-responsive-small">这是最后一行内容。</p>
        </div>
      </div>

      <!-- 设备信息显示 -->
      <div class="card-responsive">
        <h2 class="text-responsive">当前设备信息</h2>
        <div class="gap-responsive">
          <p class="text-responsive-small">屏幕宽度: <span id="screen-width">{{ screenWidth }}px</span></p>
          <p class="text-responsive-small">视口宽度: <span id="viewport-width">{{ viewportWidth }}px</span></p>
          <p class="text-responsive-small">设备类型: <span id="device-type">{{ deviceType }}</span></p>
          <p class="text-responsive-small">触屏支持: <span id="touch-support">{{ touchSupport ? '是' : '否' }}</span></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const screenWidth = ref(0)
const viewportWidth = ref(0)
const deviceType = ref('')
const touchSupport = ref(false)

const updateDeviceInfo = () => {
  screenWidth.value = window.screen.width
  viewportWidth.value = window.innerWidth
  touchSupport.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  if (viewportWidth.value >= 1024) {
    deviceType.value = '桌面端'
  } else if (viewportWidth.value >= 768) {
    deviceType.value = '平板端'
  } else {
    deviceType.value = '移动端'
  }
}

onMounted(() => {
  updateDeviceInfo()
  window.addEventListener('resize', updateDeviceInfo)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateDeviceInfo)
})
</script>

<style scoped>
.responsive-test-main {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  padding: 20px 0;
}

/* 测试页面特殊样式 */
.card-responsive {
  margin-bottom: 24px;
}

#screen-width,
#viewport-width,
#device-type,
#touch-support {
  color: #00ccff;
  font-weight: bold;
}

/* 确保按钮有基础样式 */
.btn {
  background: linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(0, 20, 40, 0.6) 100%);
  border: 1px solid rgba(0, 102, 255, 0.4);
  border-radius: 6px;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:hover {
  background: linear-gradient(135deg, rgba(0, 102, 255, 0.4) 0%, rgba(0, 20, 40, 0.8) 100%);
  border-color: rgba(0, 102, 255, 0.6);
  transform: translateY(-1px);
}

.btn-primary {
  border-color: rgba(0, 102, 255, 0.6);
}

.btn-secondary {
  border-color: rgba(108, 117, 125, 0.6);
}

.btn-danger {
  border-color: rgba(220, 53, 69, 0.6);
}

.btn-success {
  border-color: rgba(40, 167, 69, 0.6);
}
</style>
