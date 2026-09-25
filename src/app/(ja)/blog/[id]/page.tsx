import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPosts, getPostById, getPostMetadataById, getPostLanguagesById } from "@/lib/posts";
import TableOfContents from "./TableOfContents";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

const BASE_URL = "https://togami.dev";

export async function generateStaticParams() {
  const { contents: posts } = await getPosts("ja");
  return posts.map((post) => ({
    id: post.id,
  }));
}

export function getArticleMetadata(id: string, locale: "ja" | "en"): Metadata {
  const post = getPostMetadataById(id, locale);
  const url = `${BASE_URL}${locale === "en" ? "/en" : ""}/blog/${id}`;
  const languages = getPostLanguagesById(id);

  return {
    title: post.title,
    description: post.title,
    alternates: {
      canonical: url,
      ...(languages.includes("ja") && languages.includes("en") && {
        languages: {
          ja: `${BASE_URL}/blog/${id}`,
          en: `${BASE_URL}/en/blog/${id}`,
        },
      }),
    },
    openGraph: {
      type: "article",
      url,
      locale: locale === "en" ? "en_US" : "ja_JP",
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return getArticleMetadata(id, "ja");
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export async function BlogPostContent({ id, locale }: { id: string; locale: "ja" | "en" }) {
  const post = await getPostById(id, locale);
  if (post.lang !== locale) throw new Error(`Wrong language for post: ${id}`);
  const prefix = locale === "en" ? "/en" : "";

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
    url: `${BASE_URL}${prefix}/blog/${id}`,
    inLanguage: locale,
    ...(post.eyecatch && { image: post.eyecatch }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className={styles.main}>
        <div className={styles.layout}>
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
              <time className={styles.date}>
                {formatDate(post.publishedAt ?? post.createdAt)}
              </time>
              <h1 className={styles.title}>{post.title}</h1>
            </header>
            <div
              className={styles.content}
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            <footer className={styles.footer}>
              <Link href={`${prefix}/blog`} className={styles.backLink}>
                ← Back to list
              </Link>
            </footer>
          </article>
          {post.tableOfContents.length > 0 && (
            <TableOfContents items={post.tableOfContents} />
          )}
        </div>
      </main>
    </>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  return <BlogPostContent id={id} locale="ja" />;
}
