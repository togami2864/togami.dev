export type Talk = {
  id: string;
  title: string;
  event: string;
  eventUrl: string;
  slidesUrl?: string;
  presentedAt: string;
};

export const talks: Talk[] = [
  {
    id: "1",
    title: "制約と時代から読み解くTypeScriptコンパイラ設計史",
    event: "TSKaigi 2026",
    eventUrl: "https://2026.tskaigi.org/talks/38",
    slidesUrl: "https://www.docswell.com/s/6114195/K8NM12-2026-05-23-103822-tskaigi",
    presentedAt: "2026-05-23",
  },
];
