interface Props {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="border-b border-stone-200 bg-white px-8 py-6 flex items-center justify-between">
      <div>
        <h1 className="font-serif text-3xl text-stone-900">{title}</h1>
        {description && <p className="text-sm text-stone-600 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
