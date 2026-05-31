import syncdeskLogo from '@/assets/syncdesk.png'

export default function SyncDeskBrand() {
  return (
    <div className="p-5 flex items-center gap-3">
      <div className="h-14 w-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
        <img
          src={syncdeskLogo}
          alt="SyncDesk"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="min-w-0">
        <p className="text-white font-bold text-lg  tracking-wider leading-none">
          SyncDesk
        </p>
      </div>
    </div>
  )
}