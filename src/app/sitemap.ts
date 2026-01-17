import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-static";

const BASE_URL = "https://togami.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { contents: posts } = await getPosts();

  const blogPosts = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.id}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts,
  ];
}
