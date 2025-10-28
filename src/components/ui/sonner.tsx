
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
            "group toast group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-[#052240] group-[.toaster]:to-[#004b6b] group-[.toaster]:backdrop-blur-lg group-[.toaster]:text-foreground group-[.toaster]:border-2 group-[.toaster]:shadow-xl font-bold text-lg scale-100",
          description: "group-[.toast]:text-white group-[.toast]:font-medium group-[.toast]:text-base",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          title: "text-lg font-bold text-white",
          success: "group-[.toaster]:border-[#95deff] group-[.toaster]:shadow-[0_0_20px_rgba(149,222,255,0.6)]",
          error: "group-[.toaster]:border-[#fa1593] group-[.toaster]:shadow-[0_0_20px_rgba(250,21,147,0.6)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
