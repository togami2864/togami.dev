import { getPosts } from "@/lib/posts";
import { links } from "@/data/links";

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

export async function GET() {
  const { contents: posts } = await getPosts();

  const internalItems: FeedItem[] = posts.map((post) => ({
    title: post.title,
    url: `${SITE_URL}/blog/${post.id}`,
    pubDate: post.publishedAt ?? post.createdAt,
  }));

  const externalItems: FeedItem[] = links.map((link) => ({
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
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ja</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
