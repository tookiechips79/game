
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      expand={true}
      closeButton={true}
      richColors={true}
      offset="80px" // Add offset to avoid overlapping with user widget
      gap={8} // Increase gap between toasts
      duration={3500} // Increased default duration for all toasts
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-gray-900/80 group-[.toaster]:to-gray-800/80 group-[.toaster]:backdrop-blur-lg group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:border-[#00FFFF]/50 group-[.toaster]:shadow-xl group-[.toaster]:shadow-[#00FFFF]/20 font-bold text-lg scale-100",
          description: "group-[.toast]:text-white group-[.toast]:font-medium group-[.toast]:text-base",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          title: "text-lg font-bold text-[#00FFFF]",
          success: "group-[.toaster]:border-green-500/30 group-[.toaster]:shadow-green-500/20",
          error: "group-[.toaster]:border-red-500/30 group-[.toaster]:shadow-red-500/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
