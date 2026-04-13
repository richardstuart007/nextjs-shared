'use client'

const variants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  success: 'bg-green-500 text-white hover:bg-green-600',
  default: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
}

export default function MyButton({ variant = 'default', className = '', children, ...rest }) {
  return (
    <button
      className={`h-6 px-3 text-xs font-medium rounded-md whitespace-nowrap
        ${variants[variant] || variants.default} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
