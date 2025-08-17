<template>
  <div class="container">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="nav-section">
        <button class="btn btn-back" @click="goBack">← 返回主页</button>
        <h1 class="title">活动场景</h1>
      </div>
      <div class="header-controls">
        <div class="header-buttons">
          <button class="btn btn-small" @click="showCreateDialog">新建</button>
          <button class="btn btn-small" @click="toggleManageMode">{{ isManageMode ? '完成' : '管理' }}</button>
        </div>
      </div>
    </header>

    <main class="scenes-main">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在加载场景...</p>
      </div>

      <!-- 错误提示 -->
      <div v-if="error && !loading" class="error-container">
        <p>{{ error }}</p>
        <button class="btn btn-small" @click="loadCategories">重试</button>
      </div>

      <!-- 场景卡片网格 -->
      <div v-if="!loading && !error" class="scenes-grid">
        <div
          v-for="scene in scenes"
          :key="scene.id"
          class="scene-card"
          @click="handleSceneClick(scene)"
        >
          <!-- 管理模式下的按钮组 -->
          <div v-if="isManageMode" class="manage-buttons">
            <button
              class="edit-btn"
              @click.stop="editScene(scene)"
            >
              编辑
            </button>
            <button
              class="delete-btn"
              @click.stop="deleteScene(scene.id)"
            >
              删除
            </button>
          </div>

          <div class="scene-content" @click="!isManageMode && viewSceneDetail(scene)">
            <h3 class="scene-title">{{ scene.title }}</h3>
            <p class="scene-description">{{ scene.content }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- 新建场景对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ isEditMode ? '编辑活动场景' : '新建活动场景' }}</h3>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label for="scene-title">标题</label>
            <input
              id="scene-title"
              v-model="newScene.title"
              type="text"
              class="form-input"
              placeholder="请输入场景标题"
            />
          </div>
          <div class="form-group">
            <label for="scene-content">活动内容</label>
            <textarea
              id="scene-content"
              v-model="newScene.content"
              class="form-textarea"
              placeholder="请输入活动内容描述"
              rows="4"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="isEditMode ? updateScene() : createScene()">
            {{ isEditMode ? '保存' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { activityScenesApi } from '../api/activityScenesApi.js'

const router = useRouter()

// 响应式数据
const scenes = ref([])
const isManageMode = ref(false)
const showDialog = ref(false)
const isEditMode = ref(false)
const editingSceneId = ref(null)
const loading = ref(false)
const error = ref('')
const newScene = reactive({
  title: '',
  content: ''
})

// 默认场景数据已清空，完全依赖API
const defaultScenes = []

// 方法
const goBack = () => {
  router.push('/')
}

const handleSceneClick = (scene) => {
  if (!isManageMode.value) {
    viewSceneDetail(scene)
  }
}

const toggleManageMode = () => {
  isManageMode.value = !isManageMode.value
}

const showCreateDialog = () => {
  isEditMode.value = false
  editingSceneId.value = null
  showDialog.value = true
  newScene.title = ''
  newScene.content = ''
}

const editScene = (scene) => {
  isEditMode.value = true
  editingSceneId.value = scene.id
  showDialog.value = true
  newScene.title = scene.title
  newScene.content = scene.content
}

const closeDialog = () => {
  showDialog.value = false
  isEditMode.value = false
  editingSceneId.value = null
}

const createScene = async () => {
  if (!newScene.title.trim() || !newScene.content.trim()) {
    alert('请填写完整的标题和内容')
    return
  }

  try {
    loading.value = true
    console.log('📝 创建新分类:', newScene)

    const categoryData = {
      title: newScene.title.trim(),
      description: newScene.content.trim()
    }

    const response = await activityScenesApi.createCategory(categoryData)

    if (response && response.data) {
      console.log('✅ 分类创建成功:', response.data)
      // 重新加载分类列表
      await loadCategories()
      closeDialog()
    }
  } catch (error) {
    console.error('❌ 分类创建失败:', error)
    error.value = `创建失败: ${error.message}`
    alert(`创建失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const updateScene = async () => {
  if (!newScene.title.trim() || !newScene.content.trim()) {
    alert('请填写完整的标题和内容')
    return
  }

  try {
    loading.value = true
    console.log('✏️ 更新分类:', editingSceneId.value, newScene)

    const categoryData = {
      title: newScene.title.trim(),
      description: newScene.content.trim()
    }

    const response = await activityScenesApi.updateCategory(editingSceneId.value, categoryData)

    if (response && response.data) {
      console.log('✅ 分类更新成功:', response.data)
      // 重新加载分类列表
      await loadCategories()
      closeDialog()
    }
  } catch (error) {
    console.error('❌ 分类更新失败:', error)
    error.value = `更新失败: ${error.message}`
    alert(`更新失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

const deleteScene = async (sceneId) => {
  if (!confirm('确定要删除这个分类吗？')) {
    return
  }

  try {
    loading.value = true
    console.log('🗑️ 删除分类:', sceneId)

    const response = await activityScenesApi.deleteCategory(sceneId)

    console.log('✅ 分类删除成功:', response)
    // 重新加载分类列表
    await loadCategories()
  } catch (error) {
    console.error('❌ 分类删除失败:', error)
    error.value = `删除失败: ${error.message}`
    alert(`删除失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 加载分类列表
const loadCategories = async () => {
  try {
    loading.value = true
    error.value = ''
    console.log('📋 开始加载分类列表...')

    const response = await activityScenesApi.getCategories()

    if (response && response.data) {
      console.log('✅ 分类列表加载成功:', response.data)

      // 处理API返回的数据格式
      let categoriesData = null

      if (response.data.success && response.data.data) {
        // 格式: { success: true, message: "...", data: {...} }
        categoriesData = response.data.data
        console.log('📦 提取的分类数据:', categoriesData)
      } else if (Array.isArray(response.data)) {
        // 格式: [...]
        categoriesData = response.data
      } else {
        categoriesData = response.data
      }

      // 转换数据格式为前端格式
      if (Array.isArray(categoriesData)) {
        scenes.value = categoriesData.map(category => ({
          id: category.id || category.category_id,
          title: category.name || category.title,
          content: category.description || category.content
        }))
      } else if (categoriesData && categoriesData.categories && Array.isArray(categoriesData.categories)) {
        scenes.value = categoriesData.categories.map(category => ({
          id: category.id || category.category_id,
          title: category.name || category.title,
          content: category.description || category.content
        }))
      } else {
        console.warn('⚠️ API返回的数据格式不符合预期:', categoriesData)
        scenes.value = []
      }

      console.log('📊 转换后的分类数据:', scenes.value)
    }
  } catch (error) {
    console.error('❌ 分类列表加载失败:', error)
    error.value = `加载失败: ${error.message}`
    scenes.value = []
    console.log('📦 API失败，分类列表为空')
  } finally {
    loading.value = false
  }
}

// 跳转到场景详细页面
const viewSceneDetail = (scene) => {
  console.log('🔍 查看场景详情:', scene)
  router.push({
    path: `/scene-detail/${scene.id}`,
    query: { title: scene.title }
  })
}

// 初始化数据
onMounted(async () => {
  console.log('🚀 活动场景页面初始化...')

  // 先检查服务器状态
  console.log('🔍 检查API服务器状态...')
  const serverStatus = await activityScenesApi.checkServerStatus()
  console.log('📊 服务器状态检查结果:', serverStatus)

  if (serverStatus.available) {
    console.log(`✅ 服务器可用，使用端点: ${serverStatus.endpoint}`)
    await loadCategories()
  } else {
    console.warn('❌ API服务器不可用，显示提示信息')
    error.value = '后端服务暂时不可用，请稍后重试或联系管理员'
    scenes.value = []
  }
})
</script>

<style scoped>
@import '../assets/management.css';

.container {
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 20, 40, 0.98) 100%);
}

.scenes-main {
  padding: 8px 1%;
  width: 98%;
  max-width: none;
  margin: 0 auto;
  margin-top: 80px;
  min-height: calc(100vh - 80px);
  overflow-y: auto;
  box-sizing: border-box;
}

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px 0;
  max-width: 1600px;
  margin: 0 auto;
}

.scene-card {
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 102, 255, 0.3);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 102, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 160px;
  display: flex;
  flex-direction: column;
}

.scene-card:hover:not(.manage-mode) {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 102, 255, 0.2);
  border-color: rgba(0, 102, 255, 0.5);
}

.scene-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.scene-title {
  color: #4da6ff;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.scene-description {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  flex: 1;
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

/* 对话框样式继承自management.css */
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
  .scenes-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .scenes-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .scenes-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px 0;
  }

  .scene-card {
    min-height: 140px;
    padding: 20px;
  }

  .scene-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .scenes-main {
    padding: 4px 2%;
    width: 96%;
  }

  .scenes-grid {
    gap: 12px;
    padding: 12px 0;
  }

  .scene-card {
    padding: 16px;
    min-height: 120px;
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
