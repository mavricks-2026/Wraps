import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="mt-24 bg-plum text-white shadow-rise">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image src="/logo-emblem-white.png" alt="" width={264} height={256} className="h-8 w-auto" />
            <Image src="/logo-wordmark-white.png" alt="WrapUrs" width={272} height={76} className="h-5 w-auto" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-blush/80">
            Thoughtfully crafted gifts, personalized with love — made by hand, delivered with care across India.
          </p>
          <div className="flex gap-3">
            {[
              { label: 'Instagram', icon: 'photo_camera' },
              { label: 'YouTube', icon: 'smart_display' },
              { label: 'WhatsApp', icon: 'chat' },
            ].map((s) => (
              <span
                key={s.label}
                aria-label={s.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <span className="msym text-[18px]" aria-hidden>
                  {s.icon}
                </span>
              </span>
            ))}
          </div>
        </div>
        <FooterCol title="Shop">
          <FooterLink href="/collections/bags">Bags</FooterLink>
          <FooterLink href="/collections/organisers">Organisers</FooterLink>
          <FooterLink href="/collections/wellness">Wellness</FooterLink>
          <FooterLink href="/collections/gifting">Gifting</FooterLink>
        </FooterCol>
        <FooterCol title="Help">
          <FooterLink href="/shipping">Shipping</FooterLink>
          <FooterLink href="/returns">Returns</FooterLink>
          <FooterLink href="/faq">FAQ</FooterLink>
          <FooterLink href="/contact">Contact</FooterLink>
        </FooterCol>
        <FooterCol title="About">
          <FooterLink href="/about">Our Story</FooterLink>
          <FooterLink href="/sustainability">Sustainability</FooterLink>
          <FooterLink href="/press">Press</FooterLink>
        </FooterCol>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-blush/70 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} WrapUrs. All rights reserved.</p>
          <div className="flex gap-2">
            {['UPI', 'COD', 'Cards'].map((p) => (
              <span key={p} className="rounded-full bg-white/10 px-3 py-1 font-medium tracking-wide text-blush/90">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 font-display text-sm font-semibold tracking-wide text-white">{title}</h4>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-blush/80 transition-colors hover:text-white">
        {children}
      </Link>
    </li>
  )
}
