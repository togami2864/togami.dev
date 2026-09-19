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

const SHIKI_LANGUAGES = [
  "bash",
  "csharp",
  "go",
  "javascript",
  "lua",
  "python",
  "rust",
  "typescript",
  "vue",
] as const;

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

function getDescendantLinks(node: Element): Element[] {
  const links: Element[] = [];

  visit(node, "element", (child: Element) => {
    if (child.tagName === "a") links.push(child);
  });

  return links;
}

function rehypeArticleSeries(currentPostId: string) {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "ul") return;

      const items = node.children.filter(
        (child): child is Element =>
          child.type === "element" && child.tagName === "li",
      );
      if (items.length < 3) return;

      const links = items.map((item) => getDescendantLinks(item));
      const isArticleSeries = links.every((itemLinks) => {
        if (itemLinks.length !== 1) return false;
        const href = itemLinks[0].properties.href;
        return typeof href === "string" && href.startsWith("/blog/");
      });
      if (!isArticleSeries) return;

      node.properties = node.properties || {};
      node.properties.className = [
        ...((node.properties.className as string[] | undefined) ?? []),
        "article-series",
      ];
      node.properties.ariaLabel = "Series navigation";

      for (const [link] of links) {
        if (link.properties.href === `/blog/${currentPostId}`) {
          link.properties.ariaCurrent = "page";
        }
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

function parseGitHubUrl(value: unknown): URL | undefined {
  if (typeof value !== "string") return;

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");
    const segments = url.pathname.split("/").filter(Boolean);

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      hostname !== "github.com" ||
      segments.length < 2
    ) {
      return;
    }

    return url;
  } catch {
    return;
  }
}

function rehypeGitHubCards() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "p" || node.children.length !== 1) return;

      const link = node.children[0];
      if (link.type !== "element" || link.tagName !== "a") return;

      const githubUrl = parseGitHubUrl(link.properties.href);
      if (!githubUrl) return;

      const linkText = link.children
        .filter((child) => child.type === "text")
        .map((child) => child.value)
        .join("");
      const path = decodeURIComponent(githubUrl.pathname.slice(1));
      const [owner, repository] = path.split("/");
      const title = linkText.startsWith("http")
        ? `${owner}/${repository}`
        : linkText;

      node.tagName = "a";
      node.properties = {
        className: ["github-card"],
        href: githubUrl.toString(),
      };
      node.children = [
        {
          type: "element",
          tagName: "svg",
          properties: {
            className: ["github-card-icon"],
            viewBox: "0 0 24 24",
            ariaHidden: "true",
          },
          children: [
            {
              type: "element",
              tagName: "path",
              properties: {
                d: "M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z",
              },
              children: [],
            },
          ],
        },
        {
          type: "element",
          tagName: "span",
          properties: { className: ["github-card-body"] },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["github-card-title"] },
              children: [{ type: "text", value: title }],
            },
            {
              type: "element",
              tagName: "span",
              properties: { className: ["github-card-path"] },
              children: [{ type: "text", value: `github.com/${path}` }],
            },
          ],
        },
        {
          type: "element",
          tagName: "span",
          properties: {
            className: ["github-card-arrow"],
            ariaHidden: "true",
          },
          children: [{ type: "text", value: "↗" }],
        },
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

async function markdownToHtml(
  markdown: string,
  currentPostId: string,
): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkColumn)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeShiki, {
      theme: "github-dark",
      langs: [...SHIKI_LANGUAGES],
    })
    .use(rehypeArticleSeries, currentPostId)
    .use(rehypeImageAttrs)
    .use(rehypeYouTubeEmbeds)
    .use(rehypeGitHubCards)
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
  const { frontmatter, content } = findPostById(id);
  const htmlContent = await markdownToHtml(content, id);

  return createPost(id, frontmatter, htmlContent);
}

export function getPostMetadataById(id: string): Post {
  const { frontmatter } = findPostById(id);

  return createPost(id, frontmatter, "");
}

function findPostById(id: string): {
  frontmatter: PostFrontmatter;
  content: string;
} {
  const files = getPostFiles();
  const filename = files.find((file) => {
    const { frontmatter } = parsePost(file);
    const slug = frontmatter.slug || file.replace(/\.md$/, "");
    return slug === id;
  });

  if (!filename) {
    throw new Error(`Post not found: ${id}`);
  }

  return parsePost(filename);
}

function createPost(
  id: string,
  frontmatter: PostFrontmatter,
  content: string,
): Post {
  return {
    id,
    title: frontmatter.title,
    content,
    publishedAt: frontmatter.publishedAt,
    createdAt: frontmatter.publishedAt,
    eyecatch: frontmatter.eyecatch,
    category: frontmatter.category
      ? { id: frontmatter.category, name: frontmatter.category, createdAt: "", updatedAt: "", publishedAt: "", revisedAt: "" }
      : undefined,
  };
}
