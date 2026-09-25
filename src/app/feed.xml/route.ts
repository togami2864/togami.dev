import { getPosts } from "@/lib/posts";
import { links } from "@/data/links";
import { isVisibleInLocale } from "@/lib/language";

export const dynamic = "force-static";

const SITE_URL = "https://togami.dev";
const SITE_TITLE = "togami.dev";
const SITE_DESCRIPTION = "togami's blog";

type FeedItem = {
  title: string;
  url: string;
  pubDate: string;
};

const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export async function makeFeed(locale: "ja" | "en") {
  const { contents: posts } = await getPosts(locale);
  const prefix = locale === "en" ? "/en" : "";

  const internalItems: FeedItem[] = posts.map((post) => ({
    title: post.title,
    url: `${SITE_URL}${prefix}/blog/${post.id}`,
    pubDate: post.publishedAt ?? post.createdAt,
  }));

  const externalItems: FeedItem[] = links.filter((link) => isVisibleInLocale(link.lang, locale)).map((link) => ({
    title: link.title,
    url: link.url,
    pubDate: link.publishedAt,
  }));

  const allItems = [...internalItems, ...externalItems].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  const rssItems = allItems
    .map((item) => {
      const pubDate = new Date(item.pubDate).toUTCString();
      return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}${prefix}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>${locale}</language>
    <atom:link href="${SITE_URL}${prefix}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

export async function GET() {
  return makeFeed("ja");
}
