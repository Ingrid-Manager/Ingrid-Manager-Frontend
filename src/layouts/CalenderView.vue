<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
console.log('✅ CalenderView geladen'); // Debug – danach entfernen
</script>

<template>
  <div class="d-flex flex-column min-vh-100">
    <AppHeader />
    <div class="flex-grow-1 d-flex flex-column w-100 p-0">
      <router-view />
      <!-- ✅ router-view gehört hier rein -->
    </div>
  </div>
</template>
