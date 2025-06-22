import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Listing extends DocumentData {
  id: string;
  title: string;
  price: number;
  createdAt?: { seconds: number };
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const snapshot = await getDocs(collection(db, "listings"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Listing[];
      setListings(data);
      setLoading(false);
    };
    fetchListings();
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Listings</h1>
        <Link href="/listings/add" className="bg-blue-600 text-white px-3 py-1 rounded">
          Add Listing
        </Link>
      </div>
      {listings.length === 0 ? (
        <p>No listings yet.</p>
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => (
            <li key={l.id} className="border rounded p-3">
              <div className="flex justify-between">
                <span className="font-medium">{l.title}</span>
                <span>€{l.price.toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
