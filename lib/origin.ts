export function validOrigin(
  origin: string | null,
  host: string | null,
  url: string,
  configured?: string,
) {
  if (!origin) return false;
  if (configured) return origin === configured;
  try {
    const parsed = new URL(origin);
    // Next can normalize request.url to localhost; Host retains the browser's destination.
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.origin === origin &&
      parsed.host === (host || new URL(url).host)
    );
  } catch {
    return false;
  }
}
