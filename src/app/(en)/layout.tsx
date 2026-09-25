import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "remark-github-blockquote-alert/alert.css";
import "../globals.css";

const BASE_URL = "https://togami.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "togami.dev",
    template: "%s | togami.dev",
  },
  description: "togami's personal website",
  alternates: {
    canonical: `${BASE_URL}/en`,
    languages: { ja: BASE_URL, en: `${BASE_URL}/en` },
    types: { "application/rss+xml": `${BASE_URL}/en/feed.xml` },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${BASE_URL}/en`,
    siteName: "togami.dev",
    title: "togami.dev",
    description: "togami's personal website",
  },
  twitter: {
    card: "summary_large_image",
    title: "togami.dev",
    description: "togami's personal website",
  },
};

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header locale="en" />
        {children}
      </body>
    </html>
  );
}
