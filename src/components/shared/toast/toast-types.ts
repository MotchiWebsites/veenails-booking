export type ToastVariant = "success" | "error" | "info" | "warning";

export type AppToast = {
    id: string;
    title?: string;
    message: string;
    code?: string;
    variant: ToastVariant;
    duration: number;
    paused: boolean;
};
