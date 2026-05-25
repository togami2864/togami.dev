"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon } from "./icons/HomeIcon";
import { BlogIcon } from "./icons/BlogIcon";
import { TalkIcon } from "./icons/TalkIcon";
import { RssIcon } from "./icons/RssIcon";
import styles from "./Header.module.css";

export const Header = () => {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link
          href="/"
          className={`${styles.navLink} ${pathname === "/" ? styles.active : ""}`}
        >
          <HomeIcon size={16} />
          <span>Home</span>
        </Link>
        <Link
          href="/blog"
          className={`${styles.navLink} ${pathname === "/blog" || pathname.startsWith("/blog/") ? styles.active : ""}`}
        >
          <BlogIcon size={16} />
          <span>Blog</span>
        </Link>
        <Link
          href="/talks"
          className={`${styles.navLink} ${pathname === "/talks" || pathname.startsWith("/talks/") ? styles.active : ""}`}
        >
          <TalkIcon size={16} />
          <span>Talks</span>
        </Link>
        <a
          href="/feed.xml"
          className={styles.navLink}
        >
          <RssIcon size={16} />
          <span>RSS</span>
        </a>
      </nav>
    </header>
  );
};
