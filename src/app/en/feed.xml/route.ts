import { makeFeed } from "@/app/feed.xml/route";

export const dynamic = "force-static";

export async function GET() {
  return makeFeed("en");
}
