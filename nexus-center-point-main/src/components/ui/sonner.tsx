import { Toaster as Sonner } from "sonner";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-primary/20 group-[.toaster]:shadow-[0_0_15px_rgba(163,230,53,0.1)] group-[.toaster]:rounded-xl group-[.toaster]:border",
          description: "group-[.toast]:text-muted",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-secondary group-[.toast]:text-muted",
          success: "group-[.toast]:text-primary",
          error: "group-[.toast]:text-red-500",
        },
      }}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-primary" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-400" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
