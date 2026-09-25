import type { Metadata } from "next";
import { BlogContent } from "@/app/(ja)/blog/page";

export const metadata: Metadata = {
  title: "Blog",
  alternates: { canonical: "/en/blog", languages: { ja: "/blog", en: "/en/blog" } },
  openGraph: { url: "/en/blog", locale: "en_US" },
};

export default function EnglishBlog() {
  return <BlogContent locale="en" />;
}
