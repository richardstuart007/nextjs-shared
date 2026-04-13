'use client'

export default function MySelect({ label, options = [], className = '', ...rest }) {
  return (
    <div className="flex items-center gap-2">
      {label && <label className="font-bold text-xs whitespace-nowrap">{label}</label>}
      <select
        className={`h-6 px-1 text-xs border border-blue-500 rounded-md
          focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        {...rest}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
