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
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const article = asideRef.current?.parentElement?.querySelector("article");
    if (!article) return;

    const itemIds = new Set(items.map((item) => item.id));
    const headings = Array.from(
      article.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
    ).filter((heading) => itemIds.has(heading.id));
    let frame = 0;

    const updateActive = () => {
      let currentId: string | null = null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > 96) break;
        currentId = heading.id;
      }
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
      ) {
        currentId = headings.at(-1)?.id ?? null;
      }
      setActiveId(currentId);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateActive();
      });
    };

    updateActive();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.cancelAnimationFrame(frame);
    };
  }, [items]);

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
              <a
                className={styles.tocLink}
                href={`#${item.id}`}
                aria-current={activeId === item.id ? "location" : undefined}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  );
}
