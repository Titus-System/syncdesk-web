export default function NotificationBadge({ count }) {
  if (!count) {
    return null
  }

  const label = count > 99 ? '99+' : String(count)

  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black leading-none text-white shadow-sm ring-1 ring-white/20">
      {label}
    </span>
  )
}