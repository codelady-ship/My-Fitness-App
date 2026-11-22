import { toast } from "sonner";

/** Success toast (shadcn's sonner). Plain text only: callers pass user-entered names. */
export const notifySuccess = (title: string, duration = 1600) => toast.success(title, { duration });
