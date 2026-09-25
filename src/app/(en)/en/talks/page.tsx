import type { Metadata } from "next";
import { TalksContent } from "@/app/(ja)/talks/page";

export const metadata: Metadata = {
  title: "Talks",
  alternates: { canonical: "/en/talks", languages: { ja: "/talks", en: "/en/talks" } },
};

export default function EnglishTalks() {
  return <TalksContent locale="en" />;
}
