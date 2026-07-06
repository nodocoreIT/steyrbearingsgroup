interface ProductSpecsProps {
  specs: unknown
}

export function ProductSpecs({ specs }: ProductSpecsProps) {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return null

  const entries = Object.entries(specs as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  )

  if (entries.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, value], i) => (
            <tr
              key={key}
              className={i % 2 === 0 ? 'bg-muted/30' : 'bg-transparent'}
            >
              <td className="px-3 py-2 font-medium text-muted-foreground w-1/3 capitalize">
                {key}
              </td>
              <td className="px-3 py-2">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
