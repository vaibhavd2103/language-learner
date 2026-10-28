/** Per-request keys sent from the Settings modal; server env vars are the fallback. */
export const hdr = (req: Request, name: string) => req.headers.get(name)?.trim() || undefined;
