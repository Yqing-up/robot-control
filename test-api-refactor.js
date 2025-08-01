/**
 * API重构验证测试
 * 验证新的API模块是否正确导出和工作
 */

// 测试下肢系统API
console.log('🔍 测试下肢系统API导入...')
try {
  const legSystemApi = require('./src/api/legSystemApi.js')
  console.log('✅ 下肢系统API导入成功')
  console.log('📋 导出的API:', Object.keys(legSystemApi))
  
  // 验证必要的导出
  const requiredExports = ['movementApi', 'cameraApi', 'systemUtils', 'API_CONFIG']
  const missingExports = requiredExports.filter(exp => !legSystemApi[exp])
  
  if (missingExports.length === 0) {
    console.log('✅ 下肢系统API所有必要导出都存在')
  } else {
    console.log('❌ 下肢系统API缺少导出:', missingExports)
  }
} catch (error) {
  console.log('❌ 下肢系统API导入失败:', error.message)
}

// 测试听觉系统API
console.log('\n🔍 测试听觉系统API导入...')
try {
  const audioSystemApi = require('./src/api/audioSystemApi.js')
  console.log('✅ 听觉系统API导入成功')
  console.log('📋 导出的API:', Object.keys(audioSystemApi))
  
  // 验证必要的导出
  const requiredExports = ['recordingApi', 'transcriptionApi', 'connectionApi', 'systemUtils', 'API_CONFIG']
  const missingExports = requiredExports.filter(exp => !audioSystemApi[exp])
  
  if (missingExports.length === 0) {
    console.log('✅ 听觉系统API所有必要导出都存在')
  } else {
    console.log('❌ 听觉系统API缺少导出:', missingExports)
  }
} catch (error) {
  console.log('❌ 听觉系统API导入失败:', error.message)
}

// 测试语音系统API
console.log('\n🔍 测试语音系统API导入...')
try {
  const voiceSystemApi = require('./src/api/voiceSystemApi.js')
  console.log('✅ 语音系统API导入成功')
  console.log('📋 导出的API:', Object.keys(voiceSystemApi))
  
  // 验证必要的导出
  const requiredExports = ['historyApi', 'voicesApi', 'voiceTextApi', 'synthesisApi', 'systemUtils', 'API_CONFIG']
  const missingExports = requiredExports.filter(exp => !voiceSystemApi[exp])
  
  if (missingExports.length === 0) {
    console.log('✅ 语音系统API所有必要导出都存在')
  } else {
    console.log('❌ 语音系统API缺少导出:', missingExports)
  }
} catch (error) {
  console.log('❌ 语音系统API导入失败:', error.message)
}

console.log('\n🎉 API重构验证测试完成!')
