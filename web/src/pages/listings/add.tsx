import { useState } from "react";
import { useRouter } from "next/router";
import { collection, addDoc, Timestamp, doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import BGGSearchInput from "@/components/BGGSearchInput";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";

interface ListingFormState {
  title: string;
  description: string;
  price: string;
  condition: string;
  externalUrl: string;
  deliveryPickup: boolean;
  deliveryParcel: boolean;
  bggId?: number;
  version?: string;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
}

const initialState: ListingFormState = {
  title: "",
  description: "",
  price: "",
  condition: "new",
  externalUrl: "",
  deliveryPickup: true,
  deliveryParcel: false,
};

export default function AddListingPage() {
  const [form, setForm] = useState<ListingFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [gameVersions, setGameVersions] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [gameStats, setGameStats] = useState<{ minPlayers?: number; maxPlayers?: number; playingTime?: number }>({});
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "listings"), {
        ...form,
        ownerUid: user?.uid,
        price: parseFloat(form.price),
        deliveryPickup: form.deliveryPickup,
        deliveryParcel: form.deliveryParcel,
        minPlayers: gameStats.minPlayers,
        maxPlayers: gameStats.maxPlayers,
        playingTime: gameStats.playingTime,
        createdAt: Timestamp.now(),
      });
      if (imageFile) {
        const path = `listings/${docRef.id}/${imageFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, "listings", docRef.id), { image: url });
      }
      router.push("/");
    } catch (err) {
      console.error("Failed to add listing", err);
      alert("Failed to add listing. See console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Search Game</label>
          <BGGSearchInput
            onSelect={async (g) => {
              // fetch details
              try {
                const res = await fetch(`/api/bgg/thing?id=${g.id}`);
                if (res.ok) {
                  const data = await res.json();
                  const versions: string[] = data.versions ?? [];
                  setGameStats({
                    minPlayers: data.minPlayers,
                    maxPlayers: data.maxPlayers,
                    playingTime: data.playingTime,
                  });                  setForm((prev) => ({
                    ...prev,
                    title: data.name ?? g.name,
                    description: data.description ?? "",
                    bggId: g.id,
                    version: versions[0] ?? "base", // default
                  }));
                  setGameVersions(versions);
                }
              } catch (err) {
                console.error("thing fetch failed", err);
              }
            }}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
          />
        </div>
        {gameVersions.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Version</label>
            <select
              name="version"
              value={form.version}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              {gameVersions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            className="w-full border rounded p-2"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Price (€)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Condition</label>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="new">New</option>
              <option value="like new">Like New</option>
              <option value="used">Used</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setImageFile(f || null);
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          {preview && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="mt-2 w-32 h-32 object-cover rounded" />
            </>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium">External URL (optional)</label>
          <input
            name="externalUrl"
            value={form.externalUrl}
            onChange={handleChange}
            placeholder="https://example.com/item"
            className="w-full border rounded p-2"
          />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="deliveryPickup"
              checked={form.deliveryPickup}
              onChange={handleChange}
            />
            Local pickup
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="deliveryParcel"
              checked={form.deliveryParcel}
              onChange={handleChange}
            />
            Parcel machine
          </label>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Listing"}
        </button>
      </form>
    </div>
  );
}
