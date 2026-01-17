export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
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
};
