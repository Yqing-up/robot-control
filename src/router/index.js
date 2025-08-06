import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/leg-system',
      name: 'leg-system',
      component: () => import('../views/LegSystemView.vue'),
    },
    {
      path: '/audio-system',
      name: 'audio-system',
      component: () => import('../views/AudioSystemView.vue'),
    },
    {
      path: '/brain-system',
      name: 'brain-system',
      component: () => import('../views/BrainSystemView.vue'),
    },
    {
      path: '/voice-system',
      name: 'voice-system',
      component: () => import('../views/VoiceSystemView.vue'),
    },
    {
      path: '/arm-system',
      name: 'arm-system',
      component: () => import('../views/ArmSystemView.vue'),
    },
    {
      path: '/vision-system',
      name: 'vision-system',
      component: () => import('../views/VisionSystemView.vue'),
    },
    {
      path: '/report',
      name: 'report',
      component: () => import('../views/ReportView.vue'),
    },
    {
      path: '/management',
      name: 'management',
      component: () => import('../views/ManagementView.vue'),
    },
    {
      path: '/image-analysis',
      name: 'image-analysis',
      component: () => import('../views/ImageAnalysisView.vue'),
    },
    {
      path: '/voice-recognition',
      name: 'voice-recognition',
      component: () => import('../views/VoiceRecognitionView.vue'),
    },
    {
      path: '/responsive-test',
      name: 'responsive-test',
      component: () => import('../views/ResponsiveTestView.vue'),
    },
  ],
})

export default router
