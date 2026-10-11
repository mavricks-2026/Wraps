'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/use-cart'
import { useCartUI } from '@/lib/cart-store'
import { SearchBar } from '@/components/layout/SearchBar'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
]

const MOBILE_EXTRA_LINKS = [
  { href: '/account', label: 'Account' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/sign-in', label: 'Sign in' },
]

export function Navbar() {
  const open = useCartUI((s) => s.open)
  const pathname = usePathname()
  const menuRef = useRef<HTMLDetailsElement>(null)
  const { data: cart } = useCart()
  const count = cart?.reduce((n, line) => n + line.quantity, 0) ?? 0

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && menuRef.current?.open) menuRef.current.open = false
    }
    function onClick(e: MouseEvent) {
      const el = menuRef.current
      if (el?.open && !el.contains(e.target as Node)) el.open = false
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
    }
  }, [])

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Mobile menu toggle */}
        <details ref={menuRef} className="group relative lg:hidden" id="mobile-nav">
          <summary
            className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full transition-colors hover:bg-pink-soft [&::-webkit-details-marker]:hidden"
            aria-label="Menu"
          >
            <span className="msym text-[24px] text-ink group-open:hidden" aria-hidden>
              menu
            </span>
            <span className="msym hidden text-[24px] text-ink group-open:inline" aria-hidden>
              close
            </span>
          </summary>
          <div
            className="fixed inset-0 top-20 z-30 hidden bg-ink/30 group-open:block lg:hidden"
            onClick={() => menuRef.current && (menuRef.current.open = false)}
            aria-hidden
          />
          <div className="fixed left-0 right-0 top-20 z-40 border-b border-line bg-white shadow-lift">
            <nav className="flex flex-col px-4 py-2" aria-label="Mobile menu">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => menuRef.current && (menuRef.current.open = false)}
                  className={`rounded-control px-4 py-3.5 font-display text-base font-semibold transition-colors ${
                    isActive(link.href) ? 'bg-pink-soft text-pink' : 'text-ink hover:bg-tint'
                  }`}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-line" />
              {MOBILE_EXTRA_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => menuRef.current && (menuRef.current.open = false)}
                  className="rounded-control px-4 py-3 text-sm text-muted transition-colors hover:bg-tint hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </details>

        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="WrapUrs home">
          <Image src="/logo-emblem.png" alt="" width={264} height={256} className="h-10 w-auto" priority />
          <Image
            src="/logo-wordmark.png"
            alt="WrapUrs"
            width={272}
            height={76}
            className="hidden h-6 w-auto sm:block"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 font-display text-sm font-semibold text-ink lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={
                isActive(link.href)
                  ? 'relative py-1 text-pink after:absolute after:bottom-[-2px] after:left-0 after:h-[2.5px] after:w-full after:rounded-full after:bg-pink'
                  : 'py-1 transition-colors hover:text-pink'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <SearchBar />
          <Link
            href="/search"
            aria-label="Search"
            className="inline-flex rounded-full p-2 text-ink transition-colors hover:bg-pink-soft hover:text-plum sm:hidden"
          >
            <span className="msym text-[22px]" aria-hidden>
              search
            </span>
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="hidden rounded-full p-2 text-ink transition-colors hover:bg-pink-soft hover:text-plum sm:inline-flex"
          >
            <span className="msym text-[22px]" aria-hidden>
              person_outline
            </span>
          </Link>
          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="relative inline-flex rounded-full p-2 text-ink transition-colors hover:bg-pink-soft hover:text-plum"
          >
            <span className="msym text-[22px]" aria-hidden>
              favorite_border
            </span>
          </Link>
          <button
            onClick={open}
            aria-label={count > 0 ? `Open cart, ${count} items` : 'Open cart'}
            className="relative inline-flex rounded-full p-2 text-ink transition-colors hover:bg-pink-soft hover:text-plum"
          >
            <span className="msym text-[22px]" aria-hidden>
              shopping_bag
            </span>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
