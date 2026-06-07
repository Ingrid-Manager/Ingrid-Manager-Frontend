<script setup lang="ts">
import {
  ref,
  onMounted,
} from 'vue';

import {
  cilPencil,
} from '@coreui/icons';

import EditUserModal
  from '@/components/modals/EditUserModal.vue';

import { getUsers }
  from '@/api/users/getUsers';

import { updateUser }
  from '@/api/users/updateUser';

import type {
  UserListItem,
} from '@/helper/interfaces/user/UserListItem';

import { useAuthStore } from '@/stores/auth.store';
const auth = useAuthStore();

function isSelf(user: UserListItem): boolean {
  return auth.user?.id === user.id;
}

const users =
  ref<UserListItem[]>([]);

const editModalVisible =
  ref(false);

const targetUser =
  ref<UserListItem | null>(null);

const roleMap: Record<string, number> = {
  admin: 1,
  user: 2,
  verwaltung: 3,
  guest: 4
}

async function loadUsers() {

  try {

    users.value =
      await getUsers();

  } catch (err) {

    console.error(
      'Fehler beim Laden der Benutzer:',
      err,
    );
  }
}

onMounted(() => {
  loadUsers();
});

function statusColor(
  status: {
    id: number
    name: string
  },
) {

  switch (
    status.name.toLowerCase()
  ) {

    case 'active':
      return 'success';

    case 'pending':
      return 'warning';

    case 'inactive':
      return 'secondary';

    default:
      return 'secondary';
  }
}

function roleLabel( role?: string) {
  switch (role?.toLowerCase()) {
    case 'guest':
      return 'Gast';
    case 'user':
      return 'Benutzer';
    case 'verwaltung':
      return 'Verwaltung';
    case 'admin':
      return 'Admin';
    default:
      return role || '-';
  }
}

async function setRole(
  user: UserListItem,
  roleName: string,
) {
  try {
    await updateUser(
      user.id,
      {
        role: {
          id:
            roleMap[
              roleName
            ],
        },
      }      
    );

    // Liste neu laden
    await loadUsers();

  } catch (err) {

    console.error(
      'Fehler beim Rollenwechsel:',
      err,
    );
  }
}

function openEditModal(
  user: UserListItem,
) {

  targetUser.value = user;

  editModalVisible.value =
    true;
}

function onCancel() {

  editModalVisible.value =
    false;

  targetUser.value = null;
}

async function onSave(
  payload: any,
) {

  if (!targetUser.value) {
    return;
  }

  try {

    await updateUser(
      targetUser.value.id,
      payload,
    );

    await loadUsers();

    onCancel();

  } catch (err) {

    console.error(
      'Fehler beim Speichern:',
      err,
    );
  }
}

function onDelete(user: UserListItem) {
  setRole(user, 'Blocked');
}

function onResetPassword() {

  console.log(
    'Reset Passwort aktuell noch nicht implementiert',
  );
}
</script>

<template>
  <div class="flex-grow-1 d-flex flex-column align-items-center pt-3 pb-4">
    <div class="w-100 d-flex flex-column flex-grow-1" style="max-width: 1200px">
      <CCard class="flex-grow-1 d-flex flex-column overflow-hidden">
        <!-- ── Header ───────────────────────────────────────────────────── -->
        <CCardHeader class="d-flex justify-content-between align-items-center">
          <strong>Benutzerverwaltung</strong>
        </CCardHeader>

        <!-- ── Table ────────────────────────────────────────────────────── -->
        <CCardBody class="flex-grow-1 d-flex flex-column p-0 overflow-hidden">
          <div class="flex-grow-1 overflow-auto">
            <CTable hover class="mb-0">
              <CTableHead>
                <CTableRow>

                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Email</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Berechtigungen</CTableHeaderCell>
                  <CTableHeaderCell class="text-end">Aktionen</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow v-for="user in users" :key="user.id">

                  <CTableDataCell
                    >{{ user.firstName }} {{ user.lastName }}</CTableDataCell
                  >

                  <CTableDataCell>{{ user.email }}</CTableDataCell>

                  <CTableDataCell>
                    <CBadge :color="statusColor(user.status)">
                      {{ user.status.name }}
                    </CBadge>
                  </CTableDataCell>

                  <CTableDataCell>
<CDropdown :disabled="isSelf(user)">
  <CDropdownToggle color="secondary" size="sm" :disabled="isSelf(user)">
    {{ roleLabel(user.role?.name) }}
  </CDropdownToggle>
                      <CDropdownMenu alignment="end" :teleport="true">
                        <CDropdownItem @click="setRole(user, 'guest')"
                          >Gast</CDropdownItem
                        >
                        <CDropdownItem @click="setRole(user, 'user')"
                          >Benutzer</CDropdownItem
                        >
                        <CDropdownItem @click="setRole(user, 'verwaltung')"
                          >Verwaltung</CDropdownItem
                        >
                        <CDropdownItem @click="setRole(user, 'admin')"
                          >Admin</CDropdownItem
                        >
                      </CDropdownMenu>
                    </CDropdown>
                  </CTableDataCell>

                  <CTableDataCell class="text-end">
              <CButton
               color="primary"
              size="sm"
              :disabled="isSelf(user)"
              @click="openEditModal(user)"
>
                      <CIcon :icon="cilPencil" class="me-1" />
                      Bearbeiten
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>
    </div>

    <!-- ── EditUserModal ─────────────────────────────────────────────────── -->
    <EditUserModal
      :visible="editModalVisible"
      :user="targetUser"
      @save="onSave"
      @cancel="onCancel"
      @delete="onDelete"
      @reset-password="onResetPassword"
    />
  </div>
</template>
