export type Talk = {
  title: string;
  date: string;
  ja: boolean;
  url?: TalkUrl;
  eventName: string;
};

type TalkUrl = {
  link?: string;
  slide?: string;
};

export const talk2024: Talk[] = [
  {
    title: "サイボウズフロントエンド通信",
    date: "Dec 16 2023",
    eventName: "Podcast",
    url: {
      link: "https://nextwebconf.connpass.com/event/300174/",
    },
    ja: true,
  },
];

export const talk2023: Talk[] = [
  {
    title: "Discussion: Frontend Testing",
    date: "Dec 16 2023",
    eventName: "次世代webカンファレンス2023",
    url: {
      link: "https://nextwebconf.connpass.com/event/300174/",
    },
    ja: true,
  },
  {
    title: "本当は怖い@types/node",
    date: "Dec 14 2023",
    eventName: "nihonbashi.js #8",
    url: {
      link: "https://nihonbashi-js.connpass.com/event/301794/",
    },
    ja: true,
  },
];

export const talk2022: Talk[] = [
  {
    title: "JavaScript Testing Framework: Under the Hood",
    date: "Nov 21 2022",
    eventName: "JSConfJP2022",
    url: {
      link: "https://jsconf.jp/2022/talk/javascript-testing-framework-under-the-hood/",
    },
    ja: false,
  },
];
