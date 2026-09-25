import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPostById, getPosts } from "@/lib/posts";

type Props = {
  params: Promise<{ id: string }>;
};

export const alt = "togami.dev blog article";
export const size = { width: 600, height: 600 };
export const contentType = "image/png";
export const dynamic = "force-static";

const font = readFile(
  join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff",
  ),
);

export async function generateStaticParams() {
  const { contents: posts } = await getPosts();
  return posts.map((post) => ({ id: post.id }));
}

export default async function TwitterImage({ params }: Props) {
  const { id } = await params;
  const [post, fontData] = await Promise.all([getPostById(id), font]);
  const seriesPart = post.title.match(/^Exploring the TypeScript Compiler Part (\d+):/);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "54px 56px 50px",
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "Noto Sans JP",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 64,
          height: 64,
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #fafafa",
          borderRadius: 12,
          fontSize: 26,
        }}
      >
        {seriesPart ? "TS" : "B"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {seriesPart ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 63,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            <div style={{ display: "flex" }}>TypeScript</div>
            <div style={{ display: "flex" }}>Compiler</div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 94 }}>Blog</div>
        )}
        {seriesPart && (
          <div style={{ display: "flex", fontSize: 34, color: "#b8b8b8" }}>
            Part {seriesPart[1]}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          paddingTop: 23,
          borderTop: "2px solid #383838",
          fontSize: 28,
        }}
      >
        togami.dev
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Noto Sans JP",
          data: Uint8Array.from(fontData).buffer,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
