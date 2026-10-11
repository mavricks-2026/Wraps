interface Props {
  label: string
  value: string
  hint?: string
}

export function KpiCard({ label, value, hint }: Props) {
  return (
    <div className="bg-white border border-stone-200 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
      <p className="font-serif text-3xl text-stone-900 mt-2 tabular">{value}</p>
      {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
    </div>
  )
}
