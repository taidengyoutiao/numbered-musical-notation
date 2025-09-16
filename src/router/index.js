import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/Index.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Index',
      component: Index
    }
  ]
})

export default router
