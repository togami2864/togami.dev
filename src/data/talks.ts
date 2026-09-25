import type { ContentLanguage } from "@/lib/language";

export type Talk = {
  id: string;
  lang: ContentLanguage;
  title: string;
  event: string;
  eventUrl: string;
  slidesUrl?: string;
  presentedAt: string;
};

export const talks: Talk[] = [
  {
    id: "1",
    lang: "ja",
    title: "制約と時代から読み解くTypeScriptコンパイラ設計史",
    event: "TSKaigi 2026",
    eventUrl: "https://2026.tskaigi.org/talks/38",
    slidesUrl: "https://www.docswell.com/s/6114195/K8NM12-2026-05-23-103822-tskaigi",
    presentedAt: "2026-05-23",
  },
  {
    id: "2",
    lang: "both",
    title: "JavaScript Testing Framework: Under the Hood",
    event: "JSConf JP 2022",
    eventUrl: "https://jsconf.jp/2022/schedule/",
    slidesUrl: "https://speakerdeck.com/toooog/javascript-testing-framework-under-the-hood-jsconfjp2022",
    presentedAt: "2022-11-26",
  },
];
