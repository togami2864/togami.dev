import type { ContentLanguage } from "@/lib/language";

export type Link = {
  id: string;
  lang: ContentLanguage;
  title: string;
  url: string;
  platform: "zenn" | "other";
  publishedAt: string;
};

export const links: Link[] = [
  {
    id: "1",
    lang: "ja",
    title: "次世代のブラウザテスト自動化プロトコルWeb Driver BiDi",
    url: "https://zenn.dev/togami2864/articles/65af759b4a34f6",
    platform: "zenn",
    publishedAt: "2024-01-15",
  },
  {
    id: "1-en",
    lang: "en",
    title: "WebDriver BiDi: The Next-Generation Browser Test Automation Protocol",
    url: "https://zenn.dev/togami2864/articles/65af759b4a34f6?locale=en",
    platform: "zenn",
    publishedAt: "2024-01-15",
  },
  {
    id: "2",
    lang: "ja",
    title: "WYSIWYGウェブページビルダーを支える技術とSever Driven UIへの拡張",
    url: "https://engineering.mercari.com/blog/entry/20241210-f7c478382a/",
    platform: "other",
    publishedAt: "2024-12-10",
  },
  {
    id: "3",
    lang: "ja",
    title: "Rust製TypeScriptコンパイラstcの現状と今後",
    url: "https://engineering.mercari.com/blog/entry/20230606-b059cd98c3/",
    platform: "other",
    publishedAt: "2023-06-07",
  },
  {
    id: "4",
    lang: "ja",
    title: "次世代 Web カンファレンス 2023 Testing",
    url: "https://nextwebconf.connpass.com/event/300174/",
    platform: "other",
    publishedAt: "2023-12-16",
  },
  {
    id: "5",
    lang: "ja",
    title: "TypeScript Compiler が型チェックをするまでを追う",
    url: "https://zenn.dev/togami2864/articles/5b6c80cf913b7a",
    platform: "zenn",
    publishedAt: "2025-12-18",
  },
  {
    id: "6",
    lang: "both",
    title: "JavaScript Testing Framework: Under the Hood (JSConf JP 2022)",
    url: "https://www.youtube.com/watch?v=qBcucQqUYS4",
    platform: "other",
    publishedAt: "2022-11-26",
  },
];
