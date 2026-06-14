<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useColorModes } from '@coreui/vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import type { Ref } from 'vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const headerClassNames = ref<string>('mb-4 p-0');

type ColorMode = 'light' | 'dark' | 'auto';

const { colorMode, setColorMode } = useColorModes(
  'coreui-free-vue-admin-template-theme',
) as {
  colorMode: Ref<ColorMode | undefined>;
  setColorMode: (mode: ColorMode) => void;
};

async function handleLogout() {
  await auth.logout();
  await router.push('/auth/login');
}

// Ressourcen-Button ist aktiv wenn Route mit /ressourcen beginnt
const isOnDashboard = computed(() => route.path.startsWith('/dashboard') || route.path === '/')

const mobileNavLabel = computed(() => isOnDashboard.value ? 'Ressourcen' : 'Kalender')
const mobileNavHref = computed(() => isOnDashboard.value ? '/ressourcen' : '/dashboard')

onMounted(() => {
  document.addEventListener('scroll', () => {
    headerClassNames.value =
      document.documentElement.scrollTop > 0
        ? 'mb-4 p-0 shadow-sm'
        : 'mb-4 p-0';
  });
});


</script>

<template>
  <CHeader position="sticky" :class="headerClassNames">
    <CContainer class="border-bottom px-4" fluid>

      <!-- ── Desktop Nav (Links) ──────────────────────────────────────────── -->
      <CHeaderNav class="d-none d-md-flex">
        <CNavItem>
          <CNavLink href="/dashboard"> Kalender </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink href="/ressourcen">Ressourcen</CNavLink>
        </CNavItem>
        <CDropdown variant="nav-item" :popper="false">
          <CDropdownToggle>Administration</CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem href="/admin/users"
            >Benutzerverwaltung</CDropdownItem
            >
            <CDropdownItem href="/admin/rooms">Raumverwaltung</CDropdownItem>
            <CDropdownItem href="/ressourcen/verwaltung"
            >Ressourcenverwaltung</CDropdownItem
            >
            <CDropdownItem href="/admin/settings"
            >Anwendungseinstellungen</CDropdownItem
            >
            <CDropdownItem href="/admin/thermostats">Thermostate</CDropdownItem>
            <CDropdownItem href="/admin/logs">Aktivitäten</CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
      </CHeaderNav>

      <!-- ── Mobile Nav (< md) ─────────────────────────────────────────── -->
<CHeaderNav class="d-flex d-md-none">
  <CNavItem>
    <CNavLink :href="mobileNavHref">
      {{ mobileNavLabel }}
    </CNavLink>
  </CNavItem>
</CHeaderNav>

      <!-- ── Rechte Seite: Theme + User (immer sichtbar) ───────────────── -->
      <CHeaderNav class="ms-auto">
  <!-- Zahnrad nur auf Mobile -->
  <CDropdown variant="nav-item" :popper="false" class="d-flex d-md-none">
    <CDropdownToggle :caret="false">
      <CIcon icon="cil-settings" size="lg" />
    </CDropdownToggle>
    <CDropdownMenu>
      <CDropdownItem href="/admin/users">Benutzerverwaltung</CDropdownItem>
      <CDropdownItem href="/admin/rooms">Raumverwaltung</CDropdownItem>
      <CDropdownItem href="/ressourcen/verwaltung">Ressourcenverwaltung</CDropdownItem>
      <CDropdownItem href="/admin/settings">Anwendungseinstellungen</CDropdownItem>
      <CDropdownItem href="/admin/thermostats">Thermostate</CDropdownItem>
      <CDropdownItem href="/admin/logs">Aktivitäten</CDropdownItem>
    </CDropdownMenu>
  </CDropdown>
</CHeaderNav>

      <CHeaderNav>
        <li class="nav-item py-1">
          <div class="vr h-100 mx-2 text-body text-opacity-75"></div>
        </li>

        <!-- Theme-Switcher -->
        <CDropdown variant="nav-item" placement="bottom-end">
          <CDropdownToggle :caret="false">
            <CIcon v-if="colorMode === 'dark'" icon="cil-moon" size="lg" />
            <CIcon v-else-if="colorMode === 'light'" icon="cil-sun" size="lg" />
            <CIcon v-else icon="cil-contrast" size="lg" />
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem
              :active="colorMode === 'light'"
              class="d-flex align-items-center"
              component="button"
              type="button"
              @click="setColorMode('light')"
            >
              <CIcon class="me-2" icon="cil-sun" size="lg" /> Light
            </CDropdownItem>
            <CDropdownItem
              :active="colorMode === 'dark'"
              class="d-flex align-items-center"
              component="button"
              type="button"
              @click="setColorMode('dark')"
            >
              <CIcon class="me-2" icon="cil-moon" size="lg" /> Dark
            </CDropdownItem>
            <CDropdownItem
              :active="colorMode === 'auto'"
              class="d-flex align-items-center"
              component="button"
              type="button"
              @click="setColorMode('auto')"
            >
              <CIcon class="me-2" icon="cil-contrast" size="lg" /> Auto
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>

        <li class="nav-item py-1">
          <div class="vr h-100 mx-2 text-body text-opacity-75"></div>
        </li>

        <!-- User-Dropdown -->
        <CDropdown variant="nav-item">
          <CDropdownToggle :caret="false">
            <CIcon icon="cil-user" size="lg" />
          </CDropdownToggle>
          <CDropdownMenu class="pt-0">
            <CDropdownHeader
              component="h6"
              class="bg-body-secondary text-body-secondary fw-semibold mb-2 rounded-top"
            >
              Profil
            </CDropdownHeader>
            <!--
            <CDropdownItem>
              <CIcon icon="cil-settings" /> Einstellungen
            </CDropdownItem>
          -->
            <CDropdownDivider />
            <CDropdownItem @click="handleLogout">
              <CIcon icon="cil-lock-locked" /> Abmelden
            </CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
      </CHeaderNav>

    </CContainer>
  </CHeader>
</template>