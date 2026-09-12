import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import remarkDirective from "remark-directive";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import { visit } from "unist-util-visit";
import type { Root, Element } from "hast";
import type { Post } from "@/types";

type DirectiveNode = {
  type: string;
  name: string;
  children: Array<{ data?: { directiveLabel?: boolean; hName?: string } }>;
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

function remarkColumn() {
  return (tree: Root) => {
    visit(tree, (node) => {
      const n = node as unknown as DirectiveNode;
      if (n.type !== "containerDirective" || n.name !== "column") return;

      n.data = n.data ?? {};
      n.data.hName = "details";
      n.data.hProperties = { className: ["column"] };

      const label = n.children.find((c) => c.data?.directiveLabel);
      if (label) {
        label.data = label.data ?? {};
        label.data.hName = "summary";
      } else {
        n.children.unshift({
          type: "paragraph",
          data: { hName: "summary" },
          children: [{ type: "text", value: "" }],
        } as unknown as DirectiveNode["children"][number]);
      }
    });
  };
}

function rehypeImageAttrs() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "img") {
        node.properties = node.properties || {};
        node.properties.loading = "eager";
        node.properties.decoding = "sync";
      }
    });
  };
}

function parseYouTubeUrl(value: unknown): URL | undefined {
  if (typeof value !== "string") return;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");
    let videoId: string | null = null;

    if (hostname === "youtube.com" && url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (hostname === "youtu.be") {
      videoId = url.pathname.slice(1).split("/")[0];
    }

    if (!videoId || !/^[\w-]{11}$/.test(videoId)) return;

    const embedUrl = new URL(
      `https://www.youtube-nocookie.com/embed/${videoId}`,
    );
    const start = parseYouTubeStartTime(
      url.searchParams.get("t") ?? url.searchParams.get("start"),
    );
    if (start !== undefined) embedUrl.searchParams.set("start", String(start));

    return embedUrl;
  } catch {
    return;
  }
}

function parseYouTubeStartTime(value: string | null): number | undefined {
  if (!value) return;
  if (/^\d+$/.test(value)) return Number(value);

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match || !match.slice(1).some(Boolean)) return;

  return (
    Number(match[1] ?? 0) * 3600 +
    Number(match[2] ?? 0) * 60 +
    Number(match[3] ?? 0)
  );
}

function rehypeYouTubeEmbeds() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "p" || node.children.length !== 1) return;

      const link = node.children[0];
      if (link.type !== "element" || link.tagName !== "a") return;

      const embedUrl = parseYouTubeUrl(link.properties.href);
      if (!embedUrl) return;

      const linkText = link.children
        .filter((child) => child.type === "text")
        .map((child) => child.value)
        .join("");
      const caption = linkText.startsWith("http") ? undefined : linkText;

      node.tagName = "figure";
      node.properties = { className: ["youtube-embed"] };
      node.children = [
        {
          type: "element",
          tagName: "iframe",
          properties: {
            src: embedUrl.toString(),
            title: caption || "YouTube video player",
            loading: "lazy",
            referrerPolicy: "strict-origin-when-cross-origin",
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            allowFullScreen: true,
          },
          children: [],
        },
        ...(caption
          ? [
              {
                type: "element" as const,
                tagName: "figcaption",
                properties: {},
                children: [link],
              },
            ]
          : []),
      ];
    });
  };
}

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
    .use(remarkDirective)
    .use(remarkColumn)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeShiki, {
      theme: "github-dark",
    })
    .use(rehypeImageAttrs)
    .use(rehypeYouTubeEmbeds)
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
