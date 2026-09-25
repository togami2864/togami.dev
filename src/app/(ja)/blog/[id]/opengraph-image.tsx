import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPostById, getPosts } from "@/lib/posts";

type Props = {
  params: Promise<{ id: string }>;
};

export const alt = "togami.dev blog article";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const dynamic = "force-static";

const fontDirectory = join(
  process.cwd(),
  "node_modules/@fontsource/noto-sans-jp/files",
);
const regularFont = readFile(
  join(fontDirectory, "noto-sans-jp-japanese-400-normal.woff"),
);
const boldFont = readFile(
  join(fontDirectory, "noto-sans-jp-japanese-700-normal.woff"),
);

export async function generateStaticParams() {
  const { contents: posts } = await getPosts("ja");

  return posts.map((post) => ({ id: post.id }));
}

const formatDate = (dateString: string): string =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${dateString}T00:00:00Z`));

export async function renderPostImage(id: string, locale: "ja" | "en") {
  const [post, regularFontData, boldFontData] = await Promise.all([
    getPostById(id, locale),
    regularFont,
    boldFont,
  ]);
  const imageTitle = post.title
    .replace(/\p{Extended_Pictographic}/gu, "")
    .trim();
  const titleSize = imageTitle.length > 52 ? 56 : 64;

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "Noto Sans JP",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage:
            "radial-gradient(circle at 84% 18%, rgba(255,255,255,0.10), transparent 27%), radial-gradient(circle at 8% 94%, rgba(255,255,255,0.06), transparent 30%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 8,
          display: "flex",
          background: "#fafafa",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "68px 76px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: "#a0a0a0",
            fontSize: 24,
            letterSpacing: "0.08em",
          }}
        >
          <span>{formatDate(post.publishedAt)}</span>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 1040,
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.18,
            letterSpacing: "-0.035em",
          }}
        >
          {imageTitle}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid #2b2b2b",
          }}
        >
          <span style={{ fontSize: 29, fontWeight: 700 }}>togami.dev</span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: Uint8Array.from(regularFontData).buffer,
          style: "normal",
          weight: 400,
        },
        {
          name: "Noto Sans JP",
          data: Uint8Array.from(boldFontData).buffer,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}

export default async function OpenGraphImage({ params }: Props) {
  const { id } = await params;
  return renderPostImage(id, "ja");
}
