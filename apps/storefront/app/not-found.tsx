import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center bg-canvas px-4 py-24 text-center">
      <span className="msym msym-filled text-[72px] text-pink/60" aria-hidden>
        redeem
      </span>
      <h1 className="mt-6 font-display text-display font-semibold text-ink">404</h1>
      <p className="mt-3 max-w-md text-body-lg text-muted">
        The page you&apos;re looking for has been gift-wrapped and misplaced.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-plum hover:shadow-none"
      >
        Back to home
      </Link>
    </div>
  )
}
