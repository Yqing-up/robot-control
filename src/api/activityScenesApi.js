import axios from 'axios'

// 使用代理路径避免CORS问题，代理到机器人综合管理中心
const API_BASE_URL = '/api-activity'
// 场景详细页面使用相同的代理路径
const SCENES_API_BASE_URL = '/api-scenes'

// 创建axios实例
const activityAxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
})

// 创建场景API的axios实例
const scenesAxiosInstance = axios.create({
  baseURL: SCENES_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
})

// 请求拦截器
activityAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('🚀 活动场景API请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data
    })
    return config
  },
  (error) => {
    console.error('❌ 活动场景API请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
activityAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ 活动场景API响应:', {
      status: response.status,
      url: response.config.url,
      fullURL: `${response.config.baseURL}${response.config.url}`,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ 活动场景API响应错误:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      requestData: error.config?.data,
      responseData: error.response?.data,
      headers: error.response?.headers
    })
    return Promise.reject(error)
  }
)

// 场景API请求拦截器
scenesAxiosInstance.interceptors.request.use(
  (config) => {
    console.log('🚀 场景API请求:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      data: config.data,
      params: config.params
    })
    return config
  },
  (error) => {
    console.error('❌ 场景API请求错误:', error)
    return Promise.reject(error)
  }
)

// 场景API响应拦截器
scenesAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ 场景API响应:', {
      status: response.status,
      url: response.config.url,
      fullURL: `${response.config.baseURL}${response.config.url}`,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ 场景API响应错误:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      requestData: error.config?.data,
      responseData: error.response?.data,
      headers: error.response?.headers
    })
    return Promise.reject(error)
  }
)

// 活动场景接口的http方法
const activityHttp = {
  get: (url, params = {}, config = {}) => activityAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => activityAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => activityAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => activityAxiosInstance.delete(url, config),
}

// 场景接口的http方法
const scenesHttp = {
  get: (url, params = {}, config = {}) => scenesAxiosInstance.get(url, { params, ...config }),
  post: (url, data = {}, config = {}) => scenesAxiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => scenesAxiosInstance.put(url, data, config),
  delete: (url, config = {}) => scenesAxiosInstance.delete(url, config),
}

export const activityScenesApi = {
  // 分类管理接口

  // 获取分类列表
  getCategories: () => {
    console.log('📋 获取分类列表')
    return activityHttp.get('/categories')
  },

  // 创建新分类
  createCategory: (categoryData) => {
    console.log('📝 创建新分类:', categoryData)
    return activityHttp.post('/categories', categoryData)
  },

  // 更新分类
  updateCategory: (categoryId, categoryData) => {
    console.log('✏️ 更新分类:', categoryId, categoryData)
    return activityHttp.put(`/categories/${categoryId}`, categoryData)
  },

  // 删除分类
  deleteCategory: (categoryId) => {
    console.log('🗑️ 删除分类:', categoryId)
    return activityHttp.delete(`/categories/${categoryId}`)
  },

  // 场景管理接口

  // 获取场景列表
  getScenes: (categoryId) => {
    console.log('📋 获取场景列表，分类ID:', categoryId)
    // 根据分类ID获取该分类下的所有场景
    const params = categoryId ? { category_id: categoryId } : {}
    return scenesHttp.get('/scenes', params)
  },

  // 创建新场景
  createScene: (sceneData) => {
    console.log('📝 创建新场景:', sceneData)
    return scenesHttp.post('/scenes', sceneData)
  },

  // 更新场景
  updateScene: (sceneId, sceneData) => {
    console.log('✏️ 更新场景:', sceneId, sceneData)
    return scenesHttp.put(`/scenes/${sceneId}`, sceneData)
  },

  // 删除场景
  deleteScene: (sceneId) => {
    console.log('🗑️ 删除场景:', sceneId)
    return scenesHttp.delete(`/scenes/${sceneId}`)
  },

  // 获取单个场景详情
  getSceneDetail: (sceneId) => {
    console.log('🔍 获取场景详情:', sceneId)
    return scenesHttp.get(`/scenes/${sceneId}`)
  },

  // 工具方法

  // 检查服务器连接状态
  checkServerStatus: async () => {
    try {
      console.log('🔍 检查活动场景服务器状态...')

      // 直接测试 /categories 端点
      const response = await activityHttp.get('/categories')
      console.log('✅ /categories 端点可用')
      return { available: true, response, endpoint: '/categories' }
    } catch (error) {
      console.warn('❌ /categories 端点不可用:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
      return { available: false, error }
    }
  }
}

export default activityScenesApi
