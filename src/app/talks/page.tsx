import { talks } from "@/data/talks";
import { ExternalIcon } from "@/components/icons/ExternalIcon";
import { FileIcon } from "@/components/icons/FileIcon";
import styles from "./page.module.css";

export const metadata = {
  title: "Talks",
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

const groupByYear = <T extends { presentedAt: string }>(items: T[]): Map<number, T[]> => {
  const sorted = [...items].sort(
    (a, b) => new Date(b.presentedAt).getTime() - new Date(a.presentedAt).getTime(),
  );
  const grouped = new Map<number, T[]>();
  for (const item of sorted) {
    const year = new Date(item.presentedAt).getFullYear();
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year)!.push(item);
  }
  return grouped;
};

export default function TalksPage() {
  const talksByYear = groupByYear(talks);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Talks</h1>
        {Array.from(talksByYear.entries()).map(([year, yearTalks]) => (
          <section key={year} className={styles.yearSection}>
            <h2 className={styles.yearTitle}>{year}</h2>
            <ul className={styles.postList}>
              {yearTalks.map((talk) => (
                <li key={talk.id} className={styles.postItem}>
                  <div className={styles.postLink}>
                    <span className={styles.postContent}>
                      <span className={styles.icon}>
                        <FileIcon size={14} />
                      </span>
                      <span className={styles.postInfo}>
                        <a
                          href={talk.slidesUrl ?? talk.eventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.postTitle}
                        >
                          {talk.title}
                        </a>
                        <a
                          href={talk.eventUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.domainWithIcon}
                        >
                          <ExternalIcon size={12} />
                          <span className={styles.domain}>{talk.event}</span>
                        </a>
                      </span>
                    </span>
                    <time className={styles.postDate}>
                      {formatDate(talk.presentedAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
