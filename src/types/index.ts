import type { MicroCMSImage, MicroCMSListContent } from "microcms-js-sdk";

export type Category = {
  name: string;
} & MicroCMSListContent;

export type Post = {
  title: string;
  content: string;
  eyecatch?: MicroCMSImage;
  category?: Category;
} & MicroCMSListContent;
