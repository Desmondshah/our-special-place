import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function DreamsSection() {
  const dreams = useQuery(api.dreams.list) || [];
  const addDream = useMutation(api.dreams.add);
  const removeDream = useMutation(api.dreams.remove);

  const [newDream, setNewDream] = useState({
    title: "",
    category: "travel",
    description: "",
    imageUrl: ""
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDream({
        title: newDream.title,
        category: newDream.category,
        description: newDream.description || undefined,
        imageUrl: newDream.imageUrl || undefined
      });
      setNewDream({
        title: "",
        category: "travel",
        description: "",
        imageUrl: ""
      });
    } catch (error) {
      console.error("Failed to add dream:", error);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={newDream.title}
          onChange={(e) => setNewDream({ ...newDream, title: e.target.value })}
          placeholder="What's your dream? ✨"
          className="w-full p-2 rounded border border-[#FFDAB9] bg-[#FFF1E6] placeholder-[#A1887F]"
          required
        />
        <select
          value={newDream.category}
          onChange={(e) => setNewDream({ ...newDream, category: e.target.value })}
          className="w-full p-2 rounded border border-[#FFDAB9] bg-[#FFF1E6]"
        >
          <option value="travel">Travel 🌎</option>
          <option value="home">Home 🏠</option>
          <option value="pets">Pets 🐾</option>
          <option value="activities">Activities 🎨</option>
          <option value="other">Other ⭐️</option>
        </select>
        <textarea
          value={newDream.description}
          onChange={(e) => setNewDream({ ...newDream, description: e.target.value })}
          placeholder="Describe your dream... 💭"
          className="w-full p-2 rounded border border-[#FFDAB9] bg-[#FFF1E6] placeholder-[#A1887F] min-h-[100px]"
        />
        <input
          type="url"
          value={newDream.imageUrl}
          onChange={(e) => setNewDream({ ...newDream, imageUrl: e.target.value })}
          placeholder="Image URL (optional) 🖼️"
          className="w-full p-2 rounded border border-[#FFDAB9] bg-[#FFF1E6] placeholder-[#A1887F]"
        />
        <button
          type="submit"
          className="w-full py-2 rounded bg-[#FFE0B2] text-[#5D4037] hover:bg-[#FFD180] transition-all duration-300 shadow-md hover:shadow-lg"
        >
          Add Dream ✨
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dreams.map((dream) => (
          <div key={dream._id} className="bg-white/90 p-4 rounded-lg shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#5D4037]">{dream.title}</h3>
              <button
                onClick={() => removeDream({ id: dream._id })}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-[#8D6E63]">Category: {dream.category}</p>
            {dream.imageUrl && (
              <img
                src={dream.imageUrl}
                alt={dream.title}
                className="w-full h-48 object-cover rounded-md"
              />
            )}
            {dream.description && (
              <p className="text-sm text-gray-600">{dream.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
