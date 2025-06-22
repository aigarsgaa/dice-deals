import React from "react";
import { doc, getDoc } from "firebase/firestore";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { db } from "@/lib/firebase";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  bggId?: number;
}

interface BggThing {
  id: number;
  name: string;
  image?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  weight?: number;
}

interface Props {
  listing: Listing;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.params?.id || "");
  const snap = await getDoc(doc(db, "listings", id));
  if (!snap.exists()) {
    return { notFound: true };
  }
  const listing = { id: snap.id, ...(snap.data() as Omit<Listing, "id">) } as Listing;
  return { props: { listing } };
};

export default function ListingDetail({ listing }: Props) {
  // lazy-load BGG details client-side for freshness
  const [bgg, setBgg] = React.useState<BggThing | null>(null);
  React.useEffect(() => {
    if (listing?.bggId) {
      fetch(`/api/bgg/thing?id=${listing.bggId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setBgg)
        .catch(console.error);
    }
  }, [listing?.bggId]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Head>
        <title>{listing.title} – Dice Deals</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">{listing.title}</h1>
      {bgg?.image && (
        <Image src={bgg.image} alt={listing.title} width={400} height={400} />
      )}
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
        {listing.description}
      </p>
      {bgg && (
        <div className="mt-4 text-sm">
          <p>
            Players: {bgg.minPlayers}–{bgg.maxPlayers} • {bgg.playingTime} min •
            Weight {bgg.weight !== undefined ? bgg.weight.toFixed(1) : "-"}
          </p>
          <a
            href={`https://boardgamegeek.com/boardgame/${bgg.id}`}
            target="_blank"
            className="text-blue-600 underline"
          >
            View on BGG
          </a>
        </div>
      )}
      <div className="mt-6 border-t pt-4 text-sm">
        <p>
          Price: <span className="font-medium">€{listing.price.toFixed(2)}</span>
        </p>
        <p>Condition: {listing.condition}</p>
      </div>
    </div>
  );
}
