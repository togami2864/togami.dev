import type { Metadata } from "next";
import { HomeContent } from "@/app/(ja)/page";

export const metadata: Metadata = {
  alternates: { canonical: "/en", languages: { ja: "/", en: "/en" } },
};

export default function EnglishHome() {
  return <HomeContent locale="en" />;
}
