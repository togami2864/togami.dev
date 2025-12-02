import { createClient } from "microcms-js-sdk";
import type { MicroCMSQueries } from "microcms-js-sdk";
import type { Post } from "@/types";
import { highlightCode } from "./highlight";

if (!process.env.MICROCMS_SERVICE_DOMAIN) {
  throw new Error("MICROCMS_SERVICE_DOMAIN is required");
}

if (!process.env.MICROCMS_API_KEY) {
  throw new Error("MICROCMS_API_KEY is required");
}

export const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

export const getPosts = async (queries?: MicroCMSQueries) => {
  return await client.getList<Post>({
    endpoint: "blogs",
    queries,
  });
};

export const getPostById = async (id: string) => {
  const post = await client.getListDetail<Post>({
    endpoint: "blogs",
    contentId: id,
  });

  return {
    ...post,
    content: await highlightCode(post.content),
  };
};
