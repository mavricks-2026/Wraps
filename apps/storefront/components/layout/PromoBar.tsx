const messages = [
  'FREE WAFFLE POUCH ON ORDERS ABOVE ₹2499 — USE CODE CUBE',
  'FREE WAFFLE TOTE ON ORDERS ABOVE ₹4999 — USE CODE TOTE',
  'FREE GIFT WRAPPING ON EVERY ORDER',
  'COD AVAILABLE · FREE SHIPPING ACROSS INDIA',
]

export function PromoBar() {
  // Duplicate the list so the marquee loops seamlessly with -50% translation.
  const loop = [...messages, ...messages]
  return (
    <div className="overflow-hidden bg-plum py-1.5 text-[11px] font-medium tracking-wider text-blush">
      <div className="flex w-max animate-marquee gap-12 px-6 whitespace-nowrap">
        {loop.map((m, i) => (
          <span key={i} className="flex items-center gap-3">
            <span aria-hidden>♥</span>
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
