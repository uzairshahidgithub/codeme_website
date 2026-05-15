import { AdminStub } from '@/components/admin/AdminStub'

// TODO: implement users management feature in next sprint
export default function AdminUsersPage() {
  return (
    <AdminStub
      eyebrow="users"
      title="User Management"
      description="Search, filter and manage users. Ban or unban via admin-ban-user; super_admins promote roles via admin-promote-user."
      todo="// TODO: implement users feature in next sprint"
    />
  )
}
