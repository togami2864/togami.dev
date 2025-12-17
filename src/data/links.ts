export type Link = {
  id: string;
  title: string;
  url: string;
  platform: "zenn" | "other";
  publishedAt: string;
};

export const links: Link[] = [
  {
    id: "1",
    title: "次世代のブラウザテスト自動化プロトコルWeb Driver BiDi",
    url: "https://zenn.dev/togami2864/articles/65af759b4a34f6",
    platform: "zenn",
    publishedAt: "2024-01-15",
  },
  {
    id: "2",
    title: "WYSIWYGウェブページビルダーを支える技術とSever Driven UIへの拡張",
    url: "https://engineering.mercari.com/blog/entry/20241210-f7c478382a/",
    platform: "other",
    publishedAt: "2024-12-10",
  },
  {
    id: "3",
    title: "Rust製TypeScriptコンパイラstcの現状と今後",
    url: "https://engineering.mercari.com/blog/entry/20230606-b059cd98c3/",
    platform: "other",
    publishedAt: "2023-06-07",
  },
  {
    id: "4",
    title: "次世代 Web カンファレンス 2023 Testing",
    url: "https://nextwebconf.connpass.com/event/300174/",
    platform: "other",
    publishedAt: "2023-12-16",
  },
  {
    "id": "5",
    title: "TypeScript Compiler が型チェックをするまでを追う",
    url: "https://zenn.dev/togami2864/articles/5b6c80cf913b7a",
    platform: "zenn",
    publishedAt: "2025-12-18",
  }
];
