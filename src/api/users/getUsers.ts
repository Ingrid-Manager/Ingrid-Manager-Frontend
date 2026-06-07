import http from '@/api/http';

import type { UserListItem } from '@/helper/interfaces/user/UserListItem';

interface UsersResponse { data: UserListItem[] }

export async function getUsers() {
  const response = await http.get<UsersResponse>('/users', 
    {
      params: {
        limit: 9999,
        page: 1,
        filters: JSON.stringify({
          statuses: [1,2,3]
        })
      }
    }
  );
  return response.data.data;
}