import Image from "next/image";
import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { links } from "@/data/links";
import { talks } from "@/data/talks";
import { GitHubIcon } from "@/components/icons/GitHubIcon";
import { BlueskyIcon } from "@/components/icons/BlueskyIcon";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { XIcon } from "@/components/icons/XIcon";
import { ArticleIcon } from "@/components/icons/ArticleIcon";
import { ExternalIcon } from "@/components/icons/ExternalIcon";
import { FileIcon } from "@/components/icons/FileIcon";
import { TalkIcon } from "@/components/icons/TalkIcon";
import styles from "./page.module.css";

const socialLinks = [
  { href: "https://github.com/togami2864", label: "GitHub", icon: GitHubIcon },
  { href: "https://x.com/togami2864", label: "X", icon: XIcon },
  { href: "https://bsky.app/profile/togami-dev.bsky.social", label: "Bluesky", icon: BlueskyIcon },
  { href: "https://linkedin.com/in/togami2864", label: "LinkedIn", icon: LinkedInIcon },
];

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

type RecentPost = {
  id: string;
  title: string;
  publishedAt: string;
  isExternal: boolean;
  url?: string;
  domain?: string;
};

const getDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
};

export default async function Home() {
  const { contents: posts } = await getPosts();

  const internalPosts: RecentPost[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    publishedAt: post.publishedAt ?? post.createdAt,
    isExternal: false,
  }));

  const externalPosts: RecentPost[] = links.map((link) => ({
    id: link.id,
    title: link.title,
    publishedAt: link.publishedAt,
    isExternal: true,
    url: link.url,
    domain: getDomain(link.url),
  }));

  const recentPosts = [...internalPosts, ...externalPosts]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  const recentTalks = [...talks].sort(
    (a, b) => new Date(b.presentedAt).getTime() - new Date(a.presentedAt).getTime(),
  );

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.intro}>
          <div className={styles.introContent}>
            <div className={styles.introText}>
              <h1 className={styles.greeting}>Hello 👋</h1>
              <p className={styles.bio}>I'm togami, a software engineer based in Tokyo.</p>
              <div className={styles.social}>
                {socialLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label={link.label}
                  >
                    <link.icon size={24} />
                  </a>
                ))}
              </div>
            </div>
            <Image
              src="https://github.com/togami2864.png"
              alt="togami"
              width={120}
              height={120}
              className={styles.avatar}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Posts</h2>
          <ul className={styles.postList}>
            {recentPosts.map((post) => (
              <li key={post.id} className={styles.postItem}>
                {post.isExternal ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.postLink}
                  >
                    <span className={styles.postContent}>
                      <span className={styles.icon}>
                        <FileIcon size={18} />
                      </span>
                      <span className={styles.postInfo}>
                        <span className={styles.postTitle}>{post.title}</span>
                        <span className={styles.domainWithIcon}>
                          <ExternalIcon size={12} />
                          <span className={styles.domain}>{post.domain}</span>
                        </span>
                      </span>
                    </span>
                    <time className={styles.postDate}>
                      {formatDate(post.publishedAt)}
                    </time>
                  </a>
                ) : (
                  <Link href={`/blog/${post.id}`} className={styles.postLink}>
                    <span className={styles.postTitleWithIcon}>
                      <span className={styles.icon}>
                        <ArticleIcon size={18} />
                      </span>
                      <span className={styles.postTitle}>{post.title}</span>
                    </span>
                    <time className={styles.postDate}>
                      {formatDate(post.publishedAt)}
                    </time>
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <Link href="/blog" className={styles.viewAll}>
            View all posts →
          </Link>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Talks</h2>
          <ul className={styles.postList}>
            {recentTalks.map((talk) => (
              <li key={talk.id} className={styles.postItem}>
                <div className={styles.postLink}>
                  <span className={styles.postContent}>
                    <span className={styles.icon}>
                      <TalkIcon size={18} />
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
      </div>
    </main>
  );
}
