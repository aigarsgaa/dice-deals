import type { NextApiRequest, NextApiResponse } from "next";
import { parseStringPromise } from "xml2js";

interface BGGSearchItem {
  id: string;
  type: string;
  name: { value: string } | string;
  yearpublished?: { value: string };
}
import { SimpleCache } from "@/lib/simpleCache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// ^ allowed below in parsing untyped XML response
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
    const rawItems = json.items?.item ?? [];
    const raw: BGGSearchItem[] = Array.isArray(rawItems) ? rawItems : [rawItems];
    // ensure only base games (exclude expansions)
        const filtered = raw.filter((it) => it.type === "boardgame");
        const items = filtered.map((it) => ({
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
