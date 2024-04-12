import { z, defineCollection } from "astro:content";

const postsCollection = defineCollection({
  type: "content",
  schema: () =>
    z.object({
      title: z.string(),
      date: z.date().transform((date) => new Date(date)),
      description: z.string(),
    }),
});

export const collections = {
  posts: postsCollection,
};
