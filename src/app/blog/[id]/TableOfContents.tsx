"use client";

import { useEffect, useRef, useState } from "react";
import type { TableOfContentsItem } from "@/types";
import styles from "./page.module.css";

export default function TableOfContents({
  items,
}: {
  items: TableOfContentsItem[];
}) {
  const asideRef = useRef<HTMLElement>(null);
  const [hiddenForFigure, setHiddenForFigure] = useState(false);

  useEffect(() => {
    const article = asideRef.current?.parentElement?.querySelector("article");
    if (!article || !("IntersectionObserver" in window)) return;

    const figures = article.querySelectorAll(
      "figure.figure-wide, figure.figure-extra-wide, figure.embed-image-wide",
    );
    const visibleFigures = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleFigures.add(entry.target);
          } else {
            visibleFigures.delete(entry.target);
          }
        }
        setHiddenForFigure(visibleFigures.size > 0);
      },
      { rootMargin: "-64px 0px 0px 0px" },
    );

    figures.forEach((figure) => observer.observe(figure));
    return () => observer.disconnect();
  }, []);

  return (
    <aside
      ref={asideRef}
      className={`${styles.toc} ${hiddenForFigure ? styles.tocHidden : ""}`}
      inert={hiddenForFigure}
    >
      <nav className={styles.tocNav} aria-label="目次">
        <p className={styles.tocTitle}>Contents</p>
        <ol className={styles.tocList}>
          {items.map((item) => (
            <li
              key={item.id}
              className={`${styles.tocItem} ${
                item.level === 3 ? styles.tocItemNested : ""
              }`}
            >
              <a className={styles.tocLink} href={`#${item.id}`}>
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
