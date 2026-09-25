import { getPosts } from "@/lib/posts";
import renderImage from "@/app/(ja)/blog/[id]/opengraph-image";

export const alt = "togami.dev blog article";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default renderImage;

export async function generateStaticParams() {
  const { contents: posts } = await getPosts("en");
  return posts.map((post) => ({ id: post.id }));
}
