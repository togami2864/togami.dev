import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

const BASE_URL = "https://togami.dev";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "togami.dev",
    template: "%s | togami.dev",
  },
  description: "togami's personal website",
  alternates: {
    types: {
      "application/rss+xml": `${BASE_URL}/feed.xml`,
    },
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: BASE_URL,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
