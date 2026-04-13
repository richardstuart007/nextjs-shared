'use client'

export default function MyInput({ label, className = '', ...rest }) {
  return (
    <div className="flex items-center gap-2">
      {label && <label className="font-bold text-xs whitespace-nowrap w-16">{label}</label>}
      <input
        className={`h-6 px-2 text-xs font-normal border border-blue-500 rounded-md
          focus:outline-none focus:ring-1 focus:ring-blue-500
          hover:border-blue-600 flex-1 ${className}`}
        {...rest}
      />
    </div>
  )
}
