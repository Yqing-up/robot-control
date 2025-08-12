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
    {
      path: '/motion-analysis',
      name: 'motion-analysis',
      component: () => import('../components/MotionAnalysisDialog.vue'),
    },
    {
      path: '/tongue-analysis',
      name: 'tongue-analysis',
      component: () => import('../components/TongueAnalysisDialog.vue'),
    },
    {
      path: '/remote-interaction',
      name: 'remote-interaction',
      component: () => import('../views/RemoteInteractionView.vue'),
    },
    {
      path: '/multimodal-perception',
      name: 'multimodal-perception',
      component: () => import('../views/MultimodalPerceptionView.vue'),
    },
    {
      path: '/chat-interaction',
      name: 'chat-interaction',
      component: () => import('../views/ChatInteractionView.vue'),
    },
    {
      path: '/health-wellness',
      name: 'health-wellness',
      component: () => import('../views/HealthWellnessView.vue'),
    },
    {
      path: '/health-wellness',
      name: 'health-wellness',
      component: () => import('../views/HealthWellnessView.vue'),
    },
  ],
})

export default router
