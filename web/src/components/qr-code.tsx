import { QRCodeSVG } from 'qrcode.react'
import { cn } from 'cn'

/** QR codes keep a white quiet zone in both themes so every phone camera can read them. */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={cn('inline-flex rounded-lg bg-white p-3 ring-1 ring-border', className)}>
      <QRCodeSVG value={value} size={176} level="M" fgColor="#151514" bgColor="#ffffff" title={label} />
    </div>
  )
}
