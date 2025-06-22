import { useEffect, useRef, useState } from "react";

interface BGGSearchResult {
  id: number;
  name: string;
  year?: number;
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
        placeholder="Search BoardGameGeek..."
        className="w-full border rounded p-2"
      />
      {loading && <div className="absolute right-2 top-2 text-sm">…</div>}
      {results.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded w-full max-h-60 overflow-y-auto shadow">
          {results.map((r) => (
            <li
              key={r.id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => {
                onSelect(r);
                setQuery(r.name);
                setResults([]);
              }}
            >
              {r.name} {r.year && <span className="text-gray-500">({r.year})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
