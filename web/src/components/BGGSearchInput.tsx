import { useEffect, useRef, useState } from "react";

interface BGGSearchResult {
  id: number;
  name: string;
  year?: number;
  image?: string;
  rank?: number;
}

interface Props {
  onSelect: (result: BGGSearchResult) => void;
}

/**
 * Autocomplete search box that queries `/api/bgg/search?q=` and lets the user
 * pick a board-game.  Minimal styling – parent should style wrapper.
 */
export default function BGGSearchInput({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BGGSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // simple debounce via ref & timeout
  const debounce = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bgg/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json = (await res.json()) as BGGSearchResult[];
          setResults(json);
        }
      } catch (err) {
        console.error("BGG search failed", err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="enter board game name"
        className="w-full border rounded p-2"
      />
      {loading && <div className="absolute right-2 top-2 text-sm">…</div>}
      {results.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded w-full max-h-60 overflow-y-auto shadow">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => {
                onSelect(r);
                setQuery(r.name);
                setResults([]);
              }}
            >
              {r.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="thumb" className="w-10 h-10 object-cover rounded" />
              )}
              <div className="flex flex-col">
                <span>
                  {r.name} {r.year && <span className="text-gray-500">({r.year})</span>}
                </span>
                {r.rank && r.rank !== 999999 && (
                  <span className="text-xs text-gray-500">Rank: {r.rank}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
