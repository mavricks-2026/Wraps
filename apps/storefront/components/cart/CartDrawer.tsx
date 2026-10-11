'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from '@/components/ui'
import { formatINR, cn } from '@goodsly/utils'
import { useCart } from '@/lib/use-cart'
import { useCartUI } from '@/lib/cart-store'
import { useSession } from '@/lib/use-session'
import { CartLine } from './CartLine'

export function CartDrawer() {
  const isOpen = useCartUI((s) => s.isOpen)
  const close = useCartUI((s) => s.close)
  const { user, loading: authLoading } = useSession()
  const { data: cart, isLoading: cartLoading } = useCart()

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const subtotal = cart?.reduce((sum, l) => sum + l.quantity * l.product_variants.price, 0) ?? 0
  const itemCount = cart?.reduce((n, l) => n + l.quantity, 0) ?? 0

  return (
    <>
      <div
        onClick={close}
        className={cn(
          'fixed inset-0 bg-plum-ink/40 z-40 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col rounded-l-card border-l border-line bg-surface shadow-lift transition-transform duration-300 sm:w-[420px]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <h2 className="font-display text-h3 font-semibold">
            Cart {itemCount > 0 && <span className="text-base font-medium text-muted">({itemCount})</span>}
          </h2>
          <button
            onClick={close}
            aria-label="Close cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-tint"
          >
            <span className="msym text-[22px]" aria-hidden>
              close
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {authLoading || cartLoading ? (
            <p className="px-6 py-8 text-sm text-muted">Loading…</p>
          ) : !user ? (
            <div className="px-6 py-14 text-center space-y-4">
              <span className="msym msym-filled mx-auto block text-[40px] text-pink" aria-hidden>
                favorite
              </span>
              <p className="text-body text-muted">Sign in to view and manage your cart.</p>
              <Link href="/sign-in" onClick={close}>
                <Button variant="primary">Sign in</Button>
              </Link>
            </div>
          ) : !cart || cart.length === 0 ? (
            <div className="px-6 py-14 text-center space-y-4">
              <span className="msym msym-filled mx-auto block text-[40px] text-pink" aria-hidden>
                favorite
              </span>
              <p className="font-display text-h3 font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted">Beautiful gifts are waiting for you.</p>
              <Link href="/collections/bags" onClick={close}>
                <Button variant="outline">Start shopping</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cart.map((line) => (
                <CartLine key={line.id} line={line} />
              ))}
            </ul>
          )}
        </div>

        {user && cart && cart.length > 0 && (
          <div className="space-y-4 border-t border-line bg-canvas px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-display text-base font-semibold text-plum">{formatINR(subtotal)}</span>
            </div>
            <p className="text-xs text-muted">
              Free shipping · Free gift wrapping · Taxes calculated at checkout
            </p>
            <Link href="/checkout" onClick={close} className="block">
              <Button className="w-full">Proceed to checkout</Button>
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
