"use client";

import { useState } from "react";
import Link from "next/link";
import { isVisibleInLocale, type ContentLanguage, type Locale } from "@/lib/language";
import { ArticleIcon } from "@/components/icons/ArticleIcon";
import { ExternalIcon } from "@/components/icons/ExternalIcon";
import { FileIcon } from "@/components/icons/FileIcon";
import styles from "./page.module.css";

export type Article = {
  id: string;
  lang: ContentLanguage;
  title: string;
  publishedAt: string;
  type: "internal" | "external";
  url?: string;
};

type Filter = Locale | "all";

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

const groupByYear = (articles: Article[]): Map<number, Article[]> => {
  const grouped = new Map<number, Article[]>();
  for (const article of [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )) {
    const year = new Date(article.publishedAt).getFullYear();
    if (!grouped.has(year)) grouped.set(year, []);
    grouped.get(year)!.push(article);
  }
  return grouped;
};

export function BlogList({ articles, locale }: { articles: Article[]; locale: Locale }) {
  const [filter, setFilter] = useState<Filter>(locale);
  const visible = articles.filter((article) => filter === "all" || isVisibleInLocale(article.lang, filter));
  const articlesByYear = groupByYear(visible);

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Filter posts by language">
        {(["all", "ja", "en"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.filterButton} ${filter === option ? styles.filterActive : ""}`}
            aria-pressed={filter === option}
            onClick={() => setFilter(option)}
          >
            {option === "all" ? "All" : option.toUpperCase()}
          </button>
        ))}
      </div>
      {Array.from(articlesByYear.entries()).map(([year, yearArticles]) => (
        <section key={year} className={styles.yearSection}>
          <h2 className={styles.yearTitle}>{year}</h2>
          <ul className={styles.postList}>
            {yearArticles.map((article) => (
              <li key={`${article.type}-${article.lang}-${article.id}`} className={styles.postItem}>
                {article.type === "internal" ? (
                  <Link href={`${article.lang === "en" ? "/en" : ""}/blog/${article.id}`} className={styles.postLink}>
                    <span className={styles.postTitleWithIcon}>
                      <span className={styles.icon}><ArticleIcon size={18} /></span>
                      <span className={styles.postTitle}>{article.title}</span>
                    </span>
                    <time className={styles.postDate} dateTime={article.publishedAt}>
                      {formatDate(article.publishedAt)}
                    </time>
                  </Link>
                ) : (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className={styles.postLink}>
                    <span className={styles.postContent}>
                      <span className={styles.icon}><FileIcon size={18} /></span>
                      <span className={styles.postInfo}>
                        <span className={styles.postTitle}>{article.title}</span>
                        <span className={styles.domainWithIcon}>
                          <ExternalIcon size={12} />
                          <span className={styles.domain}>{getDomain(article.url!)}</span>
                        </span>
                      </span>
                    </span>
                    <time className={styles.postDate} dateTime={article.publishedAt}>
                      {formatDate(article.publishedAt)}
                    </time>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
