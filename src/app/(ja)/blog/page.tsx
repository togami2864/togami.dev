import type { Metadata } from "next";
import { getPosts } from "@/lib/posts";
import { links } from "@/data/links";
import { BlogList, type Article } from "./BlogList";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Blog",
  alternates: { canonical: "/blog", languages: { ja: "/blog", en: "/en/blog" } },
  openGraph: { url: "/blog", locale: "ja_JP" },
};

export async function BlogContent({ locale }: { locale: "ja" | "en" }) {
  const { contents: posts } = await getPosts();

  const allArticles: Article[] = [
    ...posts.map((post) => ({
      id: post.id,
      lang: post.lang,
      title: post.title,
      publishedAt: post.publishedAt ?? post.createdAt,
      type: "internal" as const,
    })),
    ...links.map((link) => ({
      id: link.id,
      lang: link.lang,
      title: link.title,
      publishedAt: link.publishedAt,
      type: "external" as const,
      url: link.url,
    })),
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Blog</h1>
        <BlogList articles={allArticles} locale={locale} />
      </div>
    </main>
  );
}

export default function BlogPage() {
  return <BlogContent locale="ja" />;
}
