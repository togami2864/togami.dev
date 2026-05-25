import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { links } from "@/data/links";
import { ArticleIcon } from "@/components/icons/ArticleIcon";
import { ExternalIcon } from "@/components/icons/ExternalIcon";
import { FileIcon } from "@/components/icons/FileIcon";
import styles from "./page.module.css";

type Article = {
  id: string;
  title: string;
  publishedAt: string;
  type: "internal" | "external";
  url?: string;
  platform?: "zenn" | "other";
};

const getDomain = (url: string): string => {
  try {
    const { hostname } = new URL(url);
    return hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

const groupByYear = (articles: Article[]): Map<number, Article[]> => {
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const grouped = new Map<number, Article[]>();
  for (const article of sorted) {
    const year = new Date(article.publishedAt).getFullYear();
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year)!.push(article);
  }
  return grouped;
};

export default async function BlogPage() {
  const { contents: posts } = await getPosts();

  const allArticles: Article[] = [
    ...posts.map((post) => ({
      id: post.id,
      title: post.title,
      publishedAt: post.publishedAt ?? post.createdAt,
      type: "internal" as const,
    })),
    ...links.map((link) => ({
      id: link.id,
      title: link.title,
      publishedAt: link.publishedAt,
      type: "external" as const,
      url: link.url,
      platform: link.platform,
    })),
  ];

  const articlesByYear = groupByYear(allArticles);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Blog</h1>
        {Array.from(articlesByYear.entries()).map(([year, yearArticles]) => (
          <section key={year} className={styles.yearSection}>
            <h2 className={styles.yearTitle}>{year}</h2>
            <ul className={styles.postList}>
              {yearArticles.map((article) => (
                <li key={article.id} className={styles.postItem}>
                  {article.type === "internal" ? (
                    <Link href={`/blog/${article.id}`} className={styles.postLink}>
                      <span className={styles.postTitleWithIcon}>
                        <span className={styles.icon}>
                          <ArticleIcon size={18} />
                        </span>
                        <span className={styles.postTitle}>{article.title}</span>
                      </span>
                      <time className={styles.postDate}>
                        {formatDate(article.publishedAt)}
                      </time>
                    </Link>
                  ) : (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.postLink}
                    >
                      <span className={styles.postContent}>
                        <span className={styles.icon}>
                          <FileIcon size={18} />
                        </span>
                        <span className={styles.postInfo}>
                          <span className={styles.postTitle}>{article.title}</span>
                          <span className={styles.domainWithIcon}>
                            <ExternalIcon size={12} />
                            <span className={styles.domain}>{getDomain(article.url!)}</span>
                          </span>
                        </span>
                      </span>
                      <time className={styles.postDate}>
                        {formatDate(article.publishedAt)}
                      </time>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
