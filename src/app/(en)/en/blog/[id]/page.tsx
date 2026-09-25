import type { Metadata } from "next";
import { getPosts } from "@/lib/posts";
import { BlogPostContent, getArticleMetadata } from "@/app/(ja)/blog/[id]/page";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const { contents: posts } = await getPosts("en");
  return posts.map((post) => ({ id: post.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getArticleMetadata(id, "en");
}

export default async function EnglishBlogPost({ params }: Props) {
  const { id } = await params;
  return <BlogPostContent id={id} locale="en" />;
}
