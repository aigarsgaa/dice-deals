import { useState } from "react";
import { useRouter } from "next/router";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BGGSearchInput from "@/components/BGGSearchInput";

interface ListingFormState {
  title: string;
  description: string;
  price: string;
  condition: string;
  externalUrl: string;
  bggId?: number;
}

const initialState: ListingFormState = {
  title: "",
  description: "",
  price: "",
  condition: "new",
  externalUrl: "",
};

export default function AddListingPage() {
  const [form, setForm] = useState<ListingFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "listings"), {
        ...form,
        price: parseFloat(form.price),
        createdAt: Timestamp.now(),
      });
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
                  setForm((prev) => ({
                    ...prev,
                    title: data.name ?? g.name,
                    description: data.description ?? "",
                    bggId: g.id,
                  }));
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
          <label className="block mb-1 font-medium">External URL (optional)</label>
          <input
            name="externalUrl"
            value={form.externalUrl}
            onChange={handleChange}
            placeholder="https://example.com/item"
            className="w-full border rounded p-2"
          />
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
