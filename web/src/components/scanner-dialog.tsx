import { Scanner, type IDetectedBarcode, type IScannerError } from '@yudiel/react-qr-scanner'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { parseScannedCode, type ScannedCode } from '@/lib/codes'

interface ScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  /** Return true to close the dialog after a scan, false to keep scanning. */
  onCode: (code: ScannedCode) => boolean | void
}

export function ScannerDialog({ open, onOpenChange, title, description, onCode }: ScannerDialogProps) {
  const [error, setError] = useState<string | null>(null)

  function handleScan(codes: IDetectedBarcode[]) {
    const raw = codes[0]?.rawValue
    if (!raw) return
    const shouldClose = onCode(parseScannedCode(raw))
    if (shouldClose !== false) onOpenChange(false)
  }

  function handleError(scannerError: IScannerError) {
    const messages: Partial<Record<IScannerError['kind'], string>> = {
      'permission-denied': 'Camera access was blocked. Allow the camera in your browser settings, or type the number instead.',
      'no-camera': 'No camera was found on this device. Type the number instead.',
      'in-use': 'Another app is using the camera. Close it and try again.',
      'insecure-context': 'The camera only works over HTTPS. Open the secure link and try again.',
    }
    setError(messages[scannerError.kind] ?? 'The camera could not start on this device. Type the number instead.')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null)
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && !error && (
          <div className="overflow-hidden rounded-lg bg-muted">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              formats={['qr_code']}
              scanDelay={1200}
              sound={false}
              styles={{ container: { aspectRatio: '1 / 1' } }}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
