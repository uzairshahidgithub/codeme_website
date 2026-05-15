import { AdminStub } from '@/components/admin/AdminStub'

// TODO: implement site settings editor feature in next sprint
export default function AdminSettingsPage() {
  return (
    <AdminStub
      eyebrow="settings"
      title="Site Settings"
      description="Edit site_content rows: founder message, site name, feature flags. Each save fires an admin Edge Function and writes an audit_log entry."
      todo="// TODO: implement settings editor in next sprint"
    />
  )
}
