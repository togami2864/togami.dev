type PagesContext = {
  request: Request;
  next: () => Promise<Response>;
};

export async function onRequestGet({ request, next }: PagesContext): Promise<Response> {
  const preference = request.headers.get("Cookie")?.match(/(?:^|;\s*)site_lang=(ja|en)(?:;|$)/)?.[1];
  const accepted = request.headers.get("Accept-Language") ?? "";
  const preferredLanguage = accepted
    .split(",")
    .map((part) => {
      const [tag, quality] = part.trim().split(/;q=/);
      return { lang: tag.toLowerCase().split("-")[0], q: quality ? Number(quality) : 1 };
    })
    .filter(({ lang, q }) => (lang === "ja" || lang === "en") && q > 0)
    .sort((a, b) => b.q - a.q)[0]?.lang;

  if ((preference ?? preferredLanguage) === "en") {
    const target = new URL(request.url);
    target.pathname = "/en";
    return new Response(null, {
      status: 302,
      headers: { Location: target.toString(), "Cache-Control": "private, no-store" },
    });
  }

  return next();
}
