import { defineCommand, runMain } from "citty";
import fs from "node:fs";

const IMAGE_ROOT_PATH = "./src/assets/posts";
const POSTS_ROOT_PATH = "./src/content/posts";

function createPostURL(date: string, title: string): string {
  const urlSafeTitle = title
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .trim()
    .replace(/\s+/g, "-");

  const url = `${date}-${urlSafeTitle}`;
  return url;
}

function genFormattedDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  const formattedDay = day < 10 ? `0${day}` : `${day}`;

  const formattedDate = `${year}-${formattedMonth}-${formattedDay}`;

  return formattedDate;
}

const main = defineCommand({
  meta: {
    name: "genPost",
    version: "1.0.0",
    description: "Generate a new post",
  },
  args: {
    title: {
      type: "positional",
      description: "Post title",
      required: true,
    },
  },
  run({ args }) {
    const date = genFormattedDate();

    const templateMDXString = `
---
title: "${args.title}"
date: ${date}
description: ""
image:
  src: "@/assets/posts/${date}/"
  alt: ""
---
`;

    const IMAGE_FOLDER_PATH = `${IMAGE_ROOT_PATH}/${date}`;

    const postURL = createPostURL(date, args.title);
    const POST_PATH = `${POSTS_ROOT_PATH}/${postURL}.mdx`;

    fs.mkdirSync(IMAGE_FOLDER_PATH, { recursive: true });
    fs.writeFileSync(POST_PATH, templateMDXString);
  },
});

runMain(main);
