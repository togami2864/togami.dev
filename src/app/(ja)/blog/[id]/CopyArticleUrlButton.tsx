"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type Props = {
  url: string;
};

export default function CopyArticleUrlButton({ url }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messages = {
    idle: "Copy link",
    copied: "Copied",
    error: "Could not copy link",
  };

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function copyUrl() {
    if (resetTimer.current) clearTimeout(resetTimer.current);

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      resetTimer.current = setTimeout(() => {
        setStatus("idle");
        resetTimer.current = null;
      }, 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <button type="button" className={styles.copyButton} onClick={copyUrl}>
      <svg
        className={styles.copyIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <span aria-live="polite">
        {messages[status]}
      </span>
    </button>
  );
}
