export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type TableOfContentsItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  eyecatch?: string;
  category?: Category;
  createdAt: string;
  updatedAt?: string;
  publishedAt: string;
  revisedAt?: string;
  tableOfContents: TableOfContentsItem[];
};
