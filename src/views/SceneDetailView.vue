<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回场景</button>
        <h1 class="title">{{ currentScene?.title || '场景详情' }}</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn btn-small" @click="showCreateDialog">新建</button>
          <button class="btn btn-small" @click="toggleManageMode">{{ isManageMode ? '完成' : '管理' }}</button>
        </div>
      </div>
    </header>

    <main class="detail-main">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载场景内容...</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="error && !loading" class="error-container">
        <p>{{ error }}</p>
        <button class="btn btn-small" @click="loadSceneContent(parseInt(route.params.id))">重试</button>
      </div>

      <!-- 活动条目卡片网格 -->
      <div v-if="!loading && !error" class="items-grid">
        <div
          v-for="item in sceneItems"
          :key="item.id"
          class="item-card"
          @click="handleItemClick(item)"
        >
          <!-- 管理模式下的按钮组 -->
          <div v-if="isManageMode" class="manage-buttons">
            <button
              class="edit-btn"
              @click.stop="editItem(item)"
            >
              编辑
            </button>
            <button
              class="delete-btn"
              @click.stop="deleteItem(item.id)"
            >
              删除
            </button>
          </div>

          <div class="item-content">
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-description">{{ item.description }}</p>
            <div class="item-meta">
              <span class="item-type">{{ item.type }}</span>
              <span class="item-duration">{{ item.duration }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 新建条目对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ isEditMode ? '编辑活动条目' : '新建活动条目' }}</h3>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label for="item-title">标题</label>
            <input
              id="item-title"
              v-model="newItem.title"
              type="text"
              class="form-input"
              placeholder="请输入条目标题"
            />
          </div>
          <div class="form-group">
            <label for="item-description">描述</label>
            <textarea
              id="item-description"
              v-model="newItem.description"
              class="form-textarea"
              placeholder="请输入条目描述"
              rows="4"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="isEditMode ? updateItem() : createItem()">
            {{ isEditMode ? '保存' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { activityScenesApi } from '../api/activityScenesApi.js'

const router = useRouter()
const route = useRoute()

// 响应式数据
const sceneItems = ref([])
const isManageMode = ref(false)
const showDialog = ref(false)
const isEditMode = ref(false)
const editingItemId = ref(null)
const currentScene = ref(null)
const loading = ref(false)
const error = ref('')
const newItem = reactive({
  title: '',
  description: ''
})

// 默认条目数据已清空，完全依赖API
const getDefaultItems = (sceneId) => {
  return []
}

// 方法
const goBack = () => {
  router.push('/activity-scenes')
}

const handleItemClick = (item) => {
  if (!isManageMode.value) {
    // 使用条目ID作为路径参数跳转到管理页面
    console.log('🔗 跳转到管理页面，条目ID:', item.id, '条目标题:', item.title)
    router.push({
      path: `/management/${item.id}`,
      query: {
        fromScene: route.params.id,  // 保留场景ID用于返回定位
        sceneTitle: item.title       // 传递条目标题作为备用显示
      }
    })
  }
}

const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value
}

const showCreateDialog = () => {
  isEditMode.value = false
  editingItemId.value = null
  showDialog.value = true
  newItem.title = ''
  newItem.description = ''
}

const editItem = (item) => {
  isEditMode.value = true
  editingItemId.value = item.id
  showDialog.value = true
  newItem.title = item.title
  newItem.description = item.description
}

const closeDialog = () => {
  showDialog.value = false
  isEditMode.value = false
  editingItemId.value = null
}

const createItem = async () => {
  if (newItem.title.trim() && newItem.description.trim()) {
    try {
      console.log('📝 创建新场景条目:', newItem)

      const sceneData = {
        title: newItem.title.trim(),
        description: newItem.description.trim(),
        category_id: parseInt(route.params.id) // 确保是数字类型
      }

      const response = await activityScenesApi.createScene(sceneData)

      if (response && response.data) {
        console.log('✅ 场景条目创建成功:', response.data)

        // 重新加载场景内容以获取最新数据
        await loadSceneContent(route.params.id)

        closeDialog()
      }
    } catch (error) {
      console.error('❌ 场景条目创建失败:', error)
      alert(`创建失败: ${error.message}`)
    }
  }
}

const updateItem = async () => {
  if (newItem.title.trim() && newItem.description.trim()) {
    try {
      console.log('✏️ 更新场景条目:', editingItemId.value, newItem)

      const sceneData = {
        title: newItem.title.trim(),
        description: newItem.description.trim()
      }

      const response = await activityScenesApi.updateScene(editingItemId.value, sceneData)

      if (response && response.data) {
        console.log('✅ 场景条目更新成功:', response.data)

        // 重新加载场景内容以获取最新数据
        await loadSceneContent(route.params.id)

        closeDialog()
      }
    } catch (error) {
      console.error('❌ 场景条目更新失败:', error)
      alert(`更新失败: ${error.message}`)
    }
  }
}

const deleteItem = async (itemId) => {
  if (confirm('确定要删除这个条目吗？')) {
    try {
      console.log('🗑️ 删除场景条目:', itemId)

      const response = await activityScenesApi.deleteScene(itemId)

      console.log('✅ 场景条目删除成功:', response)

      // 重新加载场景内容以获取最新数据
      await loadSceneContent(route.params.id)

    } catch (error) {
      console.error('❌ 场景条目删除失败:', error)
      alert(`删除失败: ${error.message}`)
    }
  }
}

// 加载场景内容
const loadSceneContent = async (sceneId) => {
  try {
    loading.value = true
    error.value = ''
    console.log('📄 开始加载场景内容:', sceneId)

    // 使用 GET /scenes 获取指定分类的场景
    const response = await activityScenesApi.getScenes(sceneId)

    if (response && response.data) {
      console.log('✅ 场景列表加载成功:', response.data)

      // 处理API返回的数据格式
      let scenesData = null

      if (response.data.success && response.data.data) {
        scenesData = response.data.data
      } else if (Array.isArray(response.data)) {
        scenesData = response.data
      } else {
        scenesData = response.data
      }

      // 转换数据格式为前端格式
      if (Array.isArray(scenesData)) {
        sceneItems.value = scenesData.map(scene => ({
          id: scene.scene_id || scene.id,
          title: scene.title || scene.name,
          description: scene.description,
          type: scene.type || '活动',
          duration: scene.duration || '待定'
        }))
      } else if (scenesData && scenesData.scenes && Array.isArray(scenesData.scenes)) {
        sceneItems.value = scenesData.scenes.map(scene => ({
          id: scene.scene_id || scene.id,
          title: scene.title || scene.name,
          description: scene.description,
          type: scene.type || '活动',
          duration: scene.duration || '待定'
        }))
      } else {
        console.warn('⚠️ API返回的数据格式不符合预期:', scenesData)
        sceneItems.value = []
      }

      console.log('📊 转换后的场景数据:', sceneItems.value)
    }
  } catch (error) {
    console.error('❌ 场景内容加载失败:', error)
    error.value = `加载失败: ${error.message}`
    sceneItems.value = []
    console.log('📦 API失败，场景内容为空')
  } finally {
    loading.value = false
  }
}

// 初始化数据
onMounted(async () => {
  console.log('🚀 场景详情页面初始化...')
  const sceneId = parseInt(route.params.id)
  const categoryTitle = route.query.title || '场景详情'

  // 设置当前场景信息（使用传递的标题或默认标题）
  currentScene.value = { id: sceneId, title: categoryTitle }

  // 加载场景内容
  await loadSceneContent(sceneId)
})

// 使用导航守卫处理组件复用时的数据刷新
onBeforeRouteUpdate(async (to, from) => {
  // 仅当路由参数ID实际发生变化时才重新加载
  if (to.params.id !== from.params.id) {
    console.log(`🔄 导航守卫: 路由更新，从 ${from.params.id} 到 ${to.params.id}，重新加载内容...`);
    await loadSceneContent(parseInt(to.params.id));
  }
});
</script>

<style scoped>
@import '../assets/management.css';

.container {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 40, 0.98) 100%);
}

.detail-main {
  padding: 8px 1%;
  width: 98%;
  max-width: none;
  margin: 0 auto;
  margin-top: 80px;
  min-height: calc(100vh - 80px);
  overflow-y: auto;
  box-sizing: border-box;
}



.items-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px 0;
  max-width: 1600px;
  margin: 0 auto;
}

.item-card {
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 102, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 140px;
  display: flex;
  flex-direction: column;
}

.item-card:hover:not(.manage-mode) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 102, 255, 0.2);
  border-color: rgba(0, 102, 255, 0.5);
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-title {
  color: #4da6ff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.item-description {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 12px 0;
  flex: 1;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.item-type {
  background: rgba(0, 102, 255, 0.2);
  color: #4da6ff;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.item-duration {
  color: #cccccc;
  font-size: 12px;
}

.manage-buttons {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  color: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 50px;
}

.edit-btn {
  background: rgba(0, 150, 255, 0.8);
}

.edit-btn:hover {
  background: rgba(0, 150, 255, 1);
  transform: translateY(-1px);
}

.delete-btn {
  background: rgba(255, 60, 60, 0.8);
}

.delete-btn:hover {
  background: rgba(255, 60, 60, 1);
  transform: translateY(-1px);
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: #4da6ff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 6px;
  color: #ffffff;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(0, 102, 255, 0.6);
  background: rgba(0, 0, 0, 0.4);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .items-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .items-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px 0;
  }

  .item-card {
    min-height: 120px;
    padding: 20px;
  }

  .item-title {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .detail-main {
    padding: 4px 2%;
    width: 96%;
  }

  .items-grid {
    gap: 12px;
    padding: 12px 0;
  }

  .item-card {
    padding: 16px;
    min-height: 100px;
  }
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #ffffff;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #0066ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误提示样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #ff6b6b;
  text-align: center;
}

.error-container p {
  margin-bottom: 16px;
  font-size: 16px;
}
</style>
