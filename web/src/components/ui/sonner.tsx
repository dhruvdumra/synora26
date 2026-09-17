import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, SpinnerIcon } from "@phosphor-icons/react"
import { useTheme } from "@/providers/theme-provider"

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolved } = useTheme()

  return (
    <Sonner
      theme={resolved}
      className="toaster group"
      icons={{
        success: (
          <CheckCircleIcon weight="bold" className="size-4" />
        ),
        info: (
          <InfoIcon weight="bold" className="size-4" />
        ),
        warning: (
          <WarningIcon weight="bold" className="size-4" />
        ),
        error: (
          <XCircleIcon weight="bold" className="size-4" />
        ),
        loading: (
          <SpinnerIcon weight="bold" className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-lg)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
