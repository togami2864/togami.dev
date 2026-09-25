import type { MetadataRoute } from "next";
import { getBilingualPostIds, getPosts } from "@/lib/posts";

export const dynamic = "force-static";

const BASE_URL = "https://togami.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { contents: posts } = await getPosts();
  const bilingualIds = new Set(getBilingualPostIds());

  const blogPosts = posts.map((post) => ({
    url: `${BASE_URL}${post.lang === "en" ? "/en" : ""}/blog/${post.id}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
    ...(bilingualIds.has(post.id) && {
      alternates: {
        languages: {
          ja: `${BASE_URL}/blog/${post.id}`,
          en: `${BASE_URL}/en/blog/${post.id}`,
        },
      },
    }),
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { ja: BASE_URL, en: `${BASE_URL}/en` } },
    },
    {
      url: `${BASE_URL}/en`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: { languages: { ja: BASE_URL, en: `${BASE_URL}/en` } },
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { ja: `${BASE_URL}/blog`, en: `${BASE_URL}/en/blog` } },
    },
    {
      url: `${BASE_URL}/en/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { ja: `${BASE_URL}/blog`, en: `${BASE_URL}/en/blog` } },
    },
    {
      url: `${BASE_URL}/talks`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: { languages: { ja: `${BASE_URL}/talks`, en: `${BASE_URL}/en/talks` } },
    },
    {
      url: `${BASE_URL}/en/talks`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: { languages: { ja: `${BASE_URL}/talks`, en: `${BASE_URL}/en/talks` } },
    },
    ...blogPosts,
  ];
}
