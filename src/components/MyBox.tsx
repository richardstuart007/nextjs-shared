'use client'

interface Props {
  title?: string
  children: React.ReactNode
  className?: string
  titleClass?: string
}

export default function MyBox({ title, children, className = '', titleClass = 'text-xs font-bold mb-2' }: Props) {
  return (
    <div className={`border border-gray-300 rounded-lg p-3 mb-3 ${className}`}>
      {title && <h3 className={titleClass}>{title}</h3>}
      {children}
    </div>
  )
}
