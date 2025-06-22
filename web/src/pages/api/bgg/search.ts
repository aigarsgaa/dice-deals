import type { NextApiRequest, NextApiResponse } from "next";
import { parseStringPromise } from "xml2js";
import { SimpleCache } from "@/lib/simpleCache";

const cache = new SimpleCache(60 * 60 * 1000); // 1 hour

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = String(req.query.q || "").trim();
  if (!query) {
    return res.status(400).json({ error: "Missing q parameter" });
  }

  const cached = cache.get(query);
  if (cached) return res.status(200).json(cached);

  try {
    const url = `https://api.geekdo.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;
    const xml = await (await fetch(url)).text();
    const json = await parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (json.items?.item ?? []).map((it: any) => ({
      id: Number(it.id),
      name: typeof it.name === "string" ? it.name : it.name?.value,
      year: it.yearpublished?.value ? Number(it.yearpublished.value) : undefined,
    }));
    cache.set(query, items);
    res.status(200).json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch from BGG" });
  }
}
