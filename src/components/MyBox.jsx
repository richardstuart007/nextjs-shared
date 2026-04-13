'use client'

export default function MyBox({ title, children, className = '' }) {
  return (
    <div className={`border border-gray-300 rounded-lg p-3 mb-3 ${className}`}>
      {title && <h3 className="text-xs font-bold mb-2">{title}</h3>}
      {children}
    </div>
  )
}
