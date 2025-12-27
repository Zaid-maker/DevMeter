"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="dark"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-black group-[.toaster]:text-white group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:supports-[backdrop-filter]:bg-black/80",
                    description: "group-[.toast]:text-muted-foreground group-[.toast]:font-medium",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-black group-[.toast]:font-bold group-[.toast]:rounded-xl",
                    cancelButton: "group-[.toast]:bg-white/5 group-[.toast]:text-white group-[.toast]:rounded-xl",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
