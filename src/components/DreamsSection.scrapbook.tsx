import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

const dreamCategories = [
  { id: "together", label: "Together", icon: "💑", color: "bg-pink-100" },
  { id: "travel", label: "Travel", icon: "🌍", color: "bg-blue-100" },
  { id: "home", label: "Home", icon: "🏡", color: "bg-green-100" },
  { id: "adventure", label: "Adventure", icon: "🎢", color: "bg-orange-100" },
  { id: "future", label: "Future", icon: "🔮", color: "bg-purple-100" },
];

const stickyColors = [
  "bg-yellow-200",
  "bg-pink-200",
  "bg-blue-200",
  "bg-green-200",
  "bg-orange-200",
  "bg-purple-200",
];

interface Dream {
  _id: Id<"dreams">;
  _creationTime: number;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
}

export default function DreamsSection() {
  const dreams = useQuery(api.dreams.list) || [];
  const addDream = useMutation(api.dreams.add);
  const removeDream = useMutation(api.dreams.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewingDream, setViewingDream] = useState<Dream | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("together");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("together");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addDream({ title, description: description || undefined, category });
    resetForm();
    setShowAddModal(false);
  };

  const filteredDreams = categoryFilter === "all" 
    ? dreams 
    : dreams.filter((d) => d.category === categoryFilter);

  const getCategoryInfo = (cat: string) => dreamCategories.find((c) => c.id === cat) || dreamCategories[0];

  return (
    <div className="space-y-6">
      {/* Header - Dreamy cloud style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 p-6 shadow-xl relative overflow-hidden"
        style={{ borderRadius: '20px 60px 20px 60px', transform: 'rotate(-0.5deg)' }}
      >
        {/* Decorative stars */}
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-4 right-8 text-2xl"
        >
          ⭐
        </motion.span>
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="absolute top-12 right-20 text-xl"
        >
          ✨
        </motion.span>
        <motion.span
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute bottom-4 right-4 text-3xl"
        >
          🌙
        </motion.span>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 
              className="text-3xl sm:text-4xl text-gray-800 flex items-center gap-3"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              <span className="text-4xl">🌙</span>
              Our Dreams
            </h2>
            <p 
              className="text-purple-700 mt-1"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Wishes whispered to the stars... ✨
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-400 to-indigo-400 text-white rounded-full shadow-lg self-start"
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', boxShadow: '0 4px 0 #6b21a8' }}
          >
            + Add Dream
          </motion.button>
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-4">
          <div 
            className="bg-white/60 px-4 py-2 rounded-full"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            🌟 {dreams.length} dreams and counting
          </div>
        </div>
      </motion.div>

      {/* Category Filter - Cloud tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`px-4 py-2 rounded-full transition-all ${
            categoryFilter === "all"
              ? "bg-white shadow-md border-2 border-purple-200"
              : "bg-white/50 hover:bg-white/80"
          }`}
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          ✨ All Dreams
        </button>
        {dreamCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-4 py-2 rounded-full transition-all ${
              categoryFilter === cat.id
                ? `${cat.color} shadow-md border-2 border-white`
                : "bg-white/50 hover:bg-white/80"
            }`}
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Dreams Grid - Sticky notes scattered */}
      {filteredDreams.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div 
            className="bg-purple-100 max-w-sm mx-auto p-8 shadow-lg"
            style={{ transform: 'rotate(2deg)' }}
          >
            <div className="text-5xl mb-4">🌙</div>
            <h3 
              className="text-2xl text-gray-700 mb-2"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Dream together...
            </h3>
            <p 
              className="text-gray-500 mb-4"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              What do you wish upon the stars?
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-400 text-white rounded-full"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Add First Dream ⭐
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
          <AnimatePresence>
            {filteredDreams.map((dream, index) => {
              const catInfo = getCategoryInfo(dream.category);
              const rotation = (index % 5 - 2) * 2;
              const stickyColor = stickyColors[index % stickyColors.length];

              return (
                <motion.div
                  key={dream._id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, rotate: rotation - 10 }}
                  animate={{ opacity: 1, scale: 1, rotate: rotation }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className={`${stickyColor} p-5 shadow-lg cursor-pointer relative group min-h-[180px]`}
                  style={{
                    boxShadow: '2px 2px 6px rgba(0,0,0,0.15), inset 0 -40px 40px -40px rgba(0,0,0,0.05)',
                  }}
                  onClick={() => setViewingDream(dream)}
                >
                  {/* Fold effect */}
                  <div 
                    className="absolute top-0 right-0 w-8 h-8"
                    style={{
                      background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.05) 50%)',
                    }}
                  />

                  {/* Category badge */}
                  <div 
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mb-3 ${catInfo.color}`}
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    {catInfo.icon} {catInfo.label}
                  </div>

                  <h3 
                    className="text-xl text-gray-800 mb-2 leading-tight"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    {dream.title}
                  </h3>

                  {dream.description && (
                    <p 
                      className="text-gray-600 text-sm line-clamp-3"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      {dream.description}
                    </p>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeDream({ id: dream._id }); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                  >
                    ×
                  </button>

                  {/* Decorative tape */}
                  <div 
                    className="absolute -top-2 left-1/4 w-12 h-4 bg-gradient-to-r from-yellow-300 to-yellow-200 opacity-70"
                    style={{ transform: 'rotate(-5deg)' }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gradient-to-br from-purple-100 to-pink-100 p-6 shadow-2xl relative"
              style={{ borderRadius: '20px 40px 20px 40px', transform: 'rotate(-1deg)' }}
            >
              {/* Stars decoration */}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-4 right-8 text-2xl"
              >
                ⭐
              </motion.span>

              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 
                  className="text-2xl text-gray-800 flex items-center gap-2"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  🌙 Share a Dream
                </h3>

                <div>
                  <label className="block text-purple-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    What do you dream of?
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="I wish we could..."
                    className="w-full px-4 py-3 bg-white/80 border-b-2 border-purple-200 focus:border-pink-400 outline-none rounded-lg"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-purple-700 text-sm mb-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dreamCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`px-3 py-2 rounded-full border-2 transition-all ${
                          category === cat.id
                            ? `${cat.color} border-white shadow-md`
                            : "bg-white/50 border-transparent"
                        }`}
                        style={{ fontFamily: "'Patrick Hand', cursive" }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-purple-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    Tell me more... (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your dream..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/80 border-2 border-dashed border-purple-200 focus:border-pink-300 outline-none rounded-lg resize-none"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '16px' }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 py-3 bg-white/50 text-gray-600 rounded-full"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-400 to-indigo-400 text-white rounded-full shadow-md"
                    style={{ fontFamily: "'Patrick Hand', cursive", boxShadow: '0 3px 0 #6b21a8' }}
                  >
                    Make a Wish ✨
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Dream Modal */}
      <AnimatePresence>
        {viewingDream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setViewingDream(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md ${stickyColors[dreams.indexOf(viewingDream) % stickyColors.length]} p-8 shadow-2xl relative`}
              style={{ transform: 'rotate(1deg)' }}
            >
              {/* Category */}
              <div 
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm mb-4 ${getCategoryInfo(viewingDream.category).color}`}
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                {getCategoryInfo(viewingDream.category).icon} {getCategoryInfo(viewingDream.category).label}
              </div>

              <h2 
                className="text-3xl text-gray-800 mb-4"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                {viewingDream.title}
              </h2>

              {viewingDream.description && (
                <p 
                  className="text-gray-700 mb-6"
                  style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px' }}
                >
                  {viewingDream.description}
                </p>
              )}

              <div className="flex justify-between items-center">
                <span 
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Dreamed on {new Date(viewingDream._creationTime).toLocaleDateString()}
                </span>
                <button
                  onClick={() => { removeDream({ id: viewingDream._id }); setViewingDream(null); }}
                  className="px-3 py-1 text-red-500 hover:bg-white/50 rounded-full text-sm"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Delete
                </button>
              </div>

              {/* Close */}
              <button
                onClick={() => setViewingDream(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                ×
              </button>

              {/* Decorative stars */}
              <span className="absolute -top-4 -right-4 text-3xl">⭐</span>
              <span className="absolute -bottom-2 -left-2 text-2xl">✨</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
      `}</style>
    </div>
  );
}
