import { requireAdmin } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin()
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)

  return (
    <div className="flex min-h-screen">
      <Sidebar email={session.email} role={session.role} />
      <div className="flex-1 flex flex-col">
        {!hasServiceRole && <ServiceRoleBanner />}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

function ServiceRoleBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-8 py-3 text-sm text-amber-900">
      <strong>Setup required:</strong> Add{' '}
      <code className="bg-amber-100 px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> to{' '}
      <code className="bg-amber-100 px-1.5 py-0.5">apps/admin/.env.local</code> and restart the dev
      server. Most admin pages won't render until then. Get it from Supabase Dashboard → Project
      Settings → API → service_role.
    </div>
  )
}
