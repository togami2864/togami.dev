import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPosts, getPostById } from "@/lib/posts";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

const BASE_URL = "https://togami.dev";

export async function generateStaticParams() {
  const { contents: posts } = await getPosts();
  return posts.map((post) => ({
    id: post.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  const url = `${BASE_URL}/blog/${id}`;

  return {
    title: post.title,
    description: post.title,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.title,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      ...(post.eyecatch && {
        images: [{ url: post.eyecatch, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.title,
      ...(post.eyecatch && { images: [post.eyecatch] }),
    },
  };
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Person",
      name: "togami",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "togami",
      url: BASE_URL,
    },
    url: `${BASE_URL}/blog/${id}`,
    ...(post.eyecatch && { image: post.eyecatch }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.main}>
        <article className={styles.article}>
        {post.eyecatch && (
          <Image
            src={post.eyecatch}
            alt=""
            width={1200}
            height={630}
            className={styles.eyecatch}
            priority
          />
        )}
        <header className={styles.header}>
          <time className={styles.date}>{formatDate(post.publishedAt ?? post.createdAt)}</time>
          <h1 className={styles.title}>{post.title}</h1>
        </header>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <footer className={styles.footer}>
          <Link href="/blog" className={styles.backLink}>
            ← Back to list
          </Link>
        </footer>
        </article>
      </main>
    </>
  );
}
