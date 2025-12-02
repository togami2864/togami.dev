import { codeToHtml } from "shiki";
import * as cheerio from "cheerio";

const EXT_TO_LANG: Record<string, string> = {
  ".vue": "vue",
  ".ts": "typescript",
  ".tsx": "tsx",
  ".js": "javascript",
  ".jsx": "jsx",
  ".json": "json",
  ".css": "css",
  ".scss": "scss",
  ".html": "html",
  ".md": "markdown",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".sh": "bash",
  ".rs": "rust",
  ".go": "go",
  ".py": "python",
};

function getLangFromFilename(filename: string): string | null {
  const ext = filename.slice(filename.lastIndexOf("."));
  return EXT_TO_LANG[ext] || null;
}

export async function highlightCode(html: string): Promise<string> {
  const $ = cheerio.load(html, null, false);
  const codeBlocks = $("pre code");

  for (const el of codeBlocks.toArray()) {
    const $el = $(el);
    const $pre = $el.parent();
    const $wrapper = $pre.parent();
    const code = $el.text();
    const langClass = $el.attr("class") || "";
    const filename = $wrapper.attr("data-filename");
    const lang =
      (filename && getLangFromFilename(filename)) ||
      langClass.replace("language-", "") ||
      "text";

    try {
      const highlighted = await codeToHtml(code, {
        lang,
        theme: "github-dark",
      });

      if (filename) {
        const wrapped = `<div class="code-block"><div class="code-filename">${filename}</div>${highlighted}</div>`;
        $wrapper.replaceWith(wrapped);
      } else {
        $pre.replaceWith(highlighted);
      }
    } catch {
      continue;
    }
  }

  return $.html();
}
