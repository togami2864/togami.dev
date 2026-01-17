import Image from "next/image";
import Link from "next/link";
import { getPosts, getPostById } from "@/lib/posts";
import styles from "./page.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const { contents: posts } = await getPosts();
  return posts.map((post) => ({
    id: post.id,
  }));
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export default async function BlogPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);

  return (
    <main className={styles.main}>
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
          <time className={styles.date}>{formatDate(post.publishedAt ?? post.createdAt)}</time>
          <h1 className={styles.title}>{post.title}</h1>
        </header>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <footer className={styles.footer}>
          <Link href="/blog" className={styles.backLink}>
            ← Back to list
          </Link>
        </footer>
      </article>
    </main>
  );
}
