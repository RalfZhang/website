/** Fill {name} placeholders in a message. Unknown names are left as they are. */
export const fmt = (message: string, values: Record<string, string | number>) =>
  message.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
