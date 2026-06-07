import { Role } from "./Role"
import { Status } from "./Status"

export interface UserListItem {
  id: number
  email: string
  firstName: string
  lastName: string
  provider: string
  socialId: string | null
  userFunction: string | null
  role: Role
  status: Status
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}