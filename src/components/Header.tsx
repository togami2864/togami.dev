"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon } from "./icons/HomeIcon";
import { BlogIcon } from "./icons/BlogIcon";
import { TalkIcon } from "./icons/TalkIcon";
import { RssIcon } from "./icons/RssIcon";
import styles from "./Header.module.css";

export const Header = ({ locale, translatedPostIds }: { locale: "ja" | "en"; translatedPostIds: string[] }) => {
  const pathname = usePathname();
  const prefix = locale === "en" ? "/en" : "";
  const section = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  const articleId = section.startsWith("/blog/") ? section.slice("/blog/".length) : null;
  const hasTranslation = articleId !== null && translatedPostIds.includes(articleId);
  const switchPath = locale === "en"
    ? articleId ? hasTranslation ? `/blog/${articleId}` : "/blog" : section
    : articleId ? hasTranslation ? `/en/blog/${articleId}` : "/en/blog" : `/en${section === "/" ? "" : section}`;
  const saveLanguage = (language: "ja" | "en") => {
    document.cookie = `site_lang=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
  };

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link
          href={prefix || "/"}
          className={`${styles.navLink} ${section === "/" ? styles.active : ""}`}
        >
          <HomeIcon size={16} />
          <span>Home</span>
        </Link>
        <Link
          href={`${prefix}/blog`}
          className={`${styles.navLink} ${section === "/blog" || section.startsWith("/blog/") ? styles.active : ""}`}
        >
          <BlogIcon size={16} />
          <span>Blog</span>
        </Link>
        <Link
          href={`${prefix}/talks`}
          className={`${styles.navLink} ${section === "/talks" || section.startsWith("/talks/") ? styles.active : ""}`}
        >
          <TalkIcon size={16} />
          <span>Talks</span>
        </Link>
        <a
          href={`${prefix}/feed.xml`}
          className={styles.navLink}
        >
          <RssIcon size={16} />
          <span>RSS</span>
        </a>
        <div className={styles.languageSwitch} aria-label="Language">
          {locale === "ja" ? (
            <span className={styles.languageActive} lang="ja">JA</span>
          ) : (
            <Link href={switchPath} onClick={() => saveLanguage("ja")} className={styles.languageLink} lang="ja" hrefLang="ja">JA</Link>
          )}
          <span className={styles.languageSeparator} aria-hidden="true">/</span>
          {locale === "en" ? (
            <span className={styles.languageActive} lang="en">EN</span>
          ) : (
            <Link href={switchPath} onClick={() => saveLanguage("en")} className={styles.languageLink} lang="en" hrefLang="en">EN</Link>
          )}
        </div>
      </nav>
    </header>
  );
};
