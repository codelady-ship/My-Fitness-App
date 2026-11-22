const DAY = 24 * 60 * 60 * 1000;

/** ISO date (YYYY-MM-DD) `days` days before `now` (negative = in the future). */
export const daysAgo = (days: number, now = new Date()): string =>
  new Date(now.getTime() - days * DAY).toISOString().slice(0, 10);

/** ISO date-time `days` days and `hours` hours before now, without seconds. */
export const dateTimeAgo = (days: number, hour: number, now = new Date()): string => {
  const d = new Date(now.getTime() - days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

/** "12 Nov 2026" or "12 Nov 2026, 18:30" for display. Empty string for empty/invalid input. */
export const formatDate = (value: string, withTime = false): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

/** Whole days between an ISO date and now (positive = in the past). */
export const daysSince = (value: string, now = new Date()): number =>
  Math.floor((now.getTime() - new Date(value).getTime()) / DAY);

/**
 * Read an uploaded image and shrink it to a small square JPEG data URL,
 * so it fits comfortably in localStorage.
 */
export const fileToAvatar = (file: File, size = 240): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Not an image"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

export const DEFAULT_AVATAR = "/default-avatar.png";
