import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import type { Post } from "@/types";

const postsDirectory = path.join(process.cwd(), "content/posts");

type PostFrontmatter = {
  title: string;
  slug: string;
  publishedAt: string;
  category?: string;
  eyecatch?: string;
};

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeShiki, {
      theme: "github-dark",
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(result);
}

function getPostFiles(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith(".md"));
}

function parsePost(filename: string): {
  frontmatter: PostFrontmatter;
  content: string;
} {
  const filePath = path.join(postsDirectory, filename);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    frontmatter: data as PostFrontmatter,
    content,
  };
}

export async function getPosts(): Promise<{ contents: Post[] }> {
  const files = getPostFiles();

  const posts: Post[] = files.map((filename) => {
    const { frontmatter } = parsePost(filename);
    const slug = frontmatter.slug || filename.replace(/\.md$/, "");

    return {
      id: slug,
      title: frontmatter.title,
      content: "",
      publishedAt: frontmatter.publishedAt,
      createdAt: frontmatter.publishedAt,
      eyecatch: frontmatter.eyecatch,
      category: frontmatter.category
        ? { id: frontmatter.category, name: frontmatter.category, createdAt: "", updatedAt: "", publishedAt: "", revisedAt: "" }
        : undefined,
    };
  });

  posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return { contents: posts };
}

export async function getPostById(id: string): Promise<Post> {
  const files = getPostFiles();
  const filename = files.find((file) => {
    const { frontmatter } = parsePost(file);
    const slug = frontmatter.slug || file.replace(/\.md$/, "");
    return slug === id;
  });

  if (!filename) {
    throw new Error(`Post not found: ${id}`);
  }

  const { frontmatter, content } = parsePost(filename);
  const htmlContent = await markdownToHtml(content);

  return {
    id,
    title: frontmatter.title,
    content: htmlContent,
    publishedAt: frontmatter.publishedAt,
    createdAt: frontmatter.publishedAt,
    eyecatch: frontmatter.eyecatch,
    category: frontmatter.category
      ? { id: frontmatter.category, name: frontmatter.category, createdAt: "", updatedAt: "", publishedAt: "", revisedAt: "" }
      : undefined,
  };
}
