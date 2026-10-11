'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@goodsly/utils'

interface NavItem {
  href: string
  label: string
}

const NAV: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/orders', label: 'Orders' },
  { href: '/customers', label: 'Customers' },
  { href: '/products', label: 'Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/coupons', label: 'Coupons' },
  { href: '/promotions', label: 'Promotions' },
  { href: '/reviews', label: 'Reviews' },
]

export function Sidebar({
  email,
  role,
}: {
  email: string
  role: 'admin' | 'staff'
}) {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-white border-r border-stone-200 flex flex-col">
      <div className="px-6 py-6 border-b border-stone-200">
        <p className="font-serif text-xl tracking-wider text-stone-900">GOODSLY</p>
        <p className="text-xs uppercase tracking-wider text-stone-500 mt-0.5">Admin</p>
      </div>

      <nav className="flex-1 py-4">
        {NAV.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-6 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-stone-900 text-white font-medium'
                  : 'text-stone-700 hover:bg-stone-100',
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-stone-200 text-xs">
        <p className="font-medium text-stone-900 truncate" title={email}>
          {email}
        </p>
        <p className="text-stone-500 uppercase tracking-wider mt-0.5">{role}</p>
      </div>
    </aside>
  )
}
