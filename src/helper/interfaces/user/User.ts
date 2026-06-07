import { Role } from '@/helper/interfaces/user/Role';
import { Status } from '@/helper/interfaces/user/Status';

export interface User {
  id: number;
  email: string;
  provider?: string;
  socialId?: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  role?: Role;
  userFunction?: string;
  status?: Status;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
