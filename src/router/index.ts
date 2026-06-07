import { h, resolveComponent } from 'vue'
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'

// Layouts
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  // ─────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────
  {
    path: '/auth',
    component: {
      render: () => h(resolveComponent('router-view')),
    },
    redirect: '/auth/login',
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPassword.vue'),
},
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────────────────────
  {
    path: '/admin',
    component: DefaultLayout,
    redirect: '/admin/users',
    children: [
      {
        path: 'users',
        name: 'Benutzerverwaltung',
        component: () => import('@/views/admin/Users.vue'),
      },
      {
        path: 'rooms',
        name: 'Raumverwaltung',
        component: () => import('@/views/admin/Rooms.vue'),
      },
      {
        path: 'settings',
        name: 'Einstellungen',
        component: () => import('@/views/admin/Settings.vue'),
      },
      {
        path: 'thermostats',
        name: 'Thermostate',
        component: () => import('@/views/admin/Thermostats.vue'),
      },
      {
        path: 'logs',
        name: 'Aktivitäten',
        component: () => import('@/views/admin/Logs.vue'),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // RESSOURCEN
  // ─────────────────────────────────────────────────────────────
  {
    path: '/ressourcen',
    //component: CalenderView,
    component: DefaultLayout,
    redirect: '/ressourcen/kalender',
    children: [
      {
        path: 'kalender',
        name: 'Ressourcen Kalender',
        component: () => import('@/views/ressourcen/Ressourcen.vue'),
      },
      {
        path: 'verwaltung',
        name: 'Ressourcenverwaltung',
        component: () =>
          import('@/views/ressourcen/Ressourcen-Verwaltung.vue'),
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // FALLBACK
  // ─────────────────────────────────────────────────────────────
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ─────────────────────────────────────────────────────────────
// AUTH GUARD
// ─────────────────────────────────────────────────────────────
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  const token = localStorage.getItem('access_token')

  if (token && !auth.user) {
    try {
      await auth.fetchUser()
    } catch (error) {
      console.error(error)
    } 
  }

  const isLoggedIn = auth.isAuthenticated
  const isAuthRoute = to.path.startsWith('/auth')

  // Nicht eingeloggt
  if (!isLoggedIn && !isAuthRoute) {
    return next('/auth/login')
  }

  // Bereits eingeloggt
  if (isLoggedIn && isAuthRoute) {
    return next('/dashboard')
  }

  next()
})

export default router