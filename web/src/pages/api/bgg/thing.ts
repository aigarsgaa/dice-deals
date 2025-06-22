import type { NextApiRequest, NextApiResponse } from "next";
import { parseStringPromise } from "xml2js";
import { SimpleCache } from "@/lib/simpleCache";

const cache = new SimpleCache<any>(60 * 60 * 1000);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || "");
  if (!id) return res.status(400).json({ error: "Missing id" });

  const cached = cache.get(id);
  if (cached) return res.status(200).json(cached);

  try {
    const url = `https://api.geekdo.com/xmlapi2/thing?id=${id}&stats=1`;
    const xml = await (await fetch(url)).text();
    const json = await parseStringPromise(xml, { explicitArray: false, mergeAttrs: true });
    const item = json.items.item;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = Array.isArray(item.name) ? item.name : [item.name];
    const primary = names.find((n: any) => n.type === "primary") || names[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alternates = names.filter((n: any) => n.type !== "primary").map((n:any)=>n.value);
    const data = {
      id: Number(item.id),
      name: typeof primary === "string" ? primary : primary?.value,
      versions: alternates,
      description: item.description,
      year: item.yearpublished?.value ? Number(item.yearpublished.value) : undefined,
      minPlayers: Number(item.minplayers?.value ?? 0),
      maxPlayers: Number(item.maxplayers?.value ?? 0),
      playingTime: Number(item.playingtime?.value ?? 0),
      image: item.image,
      thumbnail: item.thumbnail,
      weight: Number(item.averageweight?.value ?? 0),
    };
    cache.set(id, data);
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch thing" });
  }
}
