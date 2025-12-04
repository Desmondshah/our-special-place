import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  { id: "travel", label: "Travel", icon: "✈️", color: "bg-blue-100", border: "border-blue-300" },
  { id: "adventure", label: "Adventure", icon: "🏔️", color: "bg-green-100", border: "border-green-300" },
  { id: "food", label: "Food", icon: "🍕", color: "bg-orange-100", border: "border-orange-300" },
  { id: "milestone", label: "Milestone", icon: "🏆", color: "bg-yellow-100", border: "border-yellow-300" },
  { id: "other", label: "Other", icon: "💫", color: "bg-purple-100", border: "border-purple-300" },
];

const stickerDecorations = ["⭐", "✨", "💕", "🌸", "🎀", "💖", "🌈", "🦋"];

interface BucketItem {
  _id: Id<"bucketList">;
  title: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  notes?: string;
}

export default function BucketListSection() {
  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("adventure");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setTitle("");
    setCategory("adventure");
    setTargetDate("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    await addItem({
      title,
      category,
      targetDate: targetDate || undefined,
      notes: notes || undefined,
      isCompleted: false,
    });
    resetForm();
    setShowAddModal(false);
  };

  const filteredItems = bucketList.filter((item) => {
    if (filter === "pending" && item.isCompleted) return false;
    if (filter === "completed" && !item.isCompleted) return false;
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    return true;
  });

  const completedCount = bucketList.filter((i) => i.isCompleted).length;
  const totalCount = bucketList.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getCategoryInfo = (cat: string) => categories.find((c) => c.id === cat) || categories[4];

  return (
    <div className="space-y-6">
      {/* Header - Cork board pin style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#fdf6e3] p-6 shadow-xl relative"
        style={{ transform: 'rotate(0.5deg)' }}
      >
        {/* Push pins */}
        <div className="absolute -top-2 left-8">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-md" />
        </div>
        <div className="absolute -top-2 right-8">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-md" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 
              className="text-3xl sm:text-4xl text-gray-800 flex items-center gap-3"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              <span className="text-4xl">✨</span>
              Our Bucket List
            </h2>
            <p 
              className="text-amber-700 mt-1"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Dreams we're chasing together 💫
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-full shadow-lg self-start"
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', boxShadow: '0 4px 0 #9c27b0' }}
          >
            + Add Dream
          </motion.button>
        </div>

        {/* Progress - Hand-drawn style */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "'Patrick Hand', cursive" }} className="text-gray-600">
              Progress: {completedCount} of {totalCount} dreams achieved!
            </span>
            <span 
              className="text-2xl font-bold text-pink-500"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              {progressPercent}%
            </span>
          </div>
          <div className="h-4 bg-white/80 rounded-full border-2 border-dashed border-amber-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full"
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Filters - Washi tape style tabs */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex gap-1">
          {[
            { id: "all", label: "All", icon: "📋" },
            { id: "pending", label: "To Do", icon: "🎯" },
            { id: "completed", label: "Done!", icon: "🎉" },
          ].map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === tab.id
                  ? "bg-yellow-200 shadow-md"
                  : "bg-white/60 hover:bg-white/80"
              }`}
              style={{ fontFamily: "'Patrick Hand', cursive", transform: `rotate(${i - 1}deg)` }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1 rounded-full transition-all ${
              categoryFilter === "all" ? "bg-gray-200 shadow" : "bg-white/60"
            }`}
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-full transition-all ${
                categoryFilter === cat.id ? `${cat.color} shadow` : "bg-white/60"
              }`}
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Bucket List Items - Checklist style */}
      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div 
            className="bg-yellow-100 max-w-sm mx-auto p-8 shadow-lg"
            style={{ transform: 'rotate(-2deg)' }}
          >
            <div className="text-5xl mb-4">💭</div>
            <h3 
              className="text-2xl text-gray-700 mb-2"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Start dreaming!
            </h3>
            <p 
              className="text-gray-500 mb-4"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Add your first bucket list item...
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-400 text-white rounded-full"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Add First Dream ✨
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredItems.map((item, index) => {
              const catInfo = getCategoryInfo(item.category);
              return (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white p-4 shadow-md border-l-4 ${catInfo.border} relative group`}
                  style={{ transform: `rotate(${(index % 3 - 1) * 0.3}deg)` }}
                >
                  {/* Checkbox area */}
                  <div className="flex items-start gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleItem({ id: item._id, isCompleted: !item.isCompleted })}
                      className={`w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center shrink-0 transition-colors ${
                        item.isCompleted
                          ? "bg-green-100 border-green-400 text-green-600"
                          : "border-gray-300 hover:border-pink-400"
                      }`}
                    >
                      {item.isCompleted && <span className="text-lg">✓</span>}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl">{catInfo.icon}</span>
                        <h3 
                          className={`text-xl text-gray-800 ${item.isCompleted ? 'line-through text-gray-400' : ''}`}
                          style={{ fontFamily: "'Caveat', cursive" }}
                        >
                          {item.title}
                        </h3>
                        <span 
                          className={`px-2 py-0.5 rounded text-xs ${catInfo.color}`}
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          {catInfo.label}
                        </span>
                      </div>

                      {item.targetDate && (
                        <p 
                          className="text-sm text-gray-500 mt-1"
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          🗓️ Target: {new Date(item.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      )}

                      {item.notes && (
                        <p 
                          className="text-sm text-gray-500 mt-1 italic"
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeItem({ id: item._id })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 text-red-400 hover:text-red-600 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>

                  {/* Completed stamp */}
                  {item.isCompleted && (
                    <div 
                      className="absolute top-2 right-2 px-2 py-1 border-2 border-dashed border-green-500 text-green-600 text-xs font-bold"
                      style={{ fontFamily: "'Patrick Hand', cursive", transform: 'rotate(8deg)' }}
                    >
                      ✓ DONE!
                    </div>
                  )}

                  {/* Decorative sticker */}
                  <span className="absolute -right-2 -bottom-2 text-lg opacity-40">
                    {stickerDecorations[index % stickerDecorations.length]}
                  </span>
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
              className="w-full max-w-md bg-[#fdf6e3] p-6 shadow-2xl relative"
              style={{ transform: 'rotate(-1deg)' }}
            >
              {/* Washi tape */}
              <div className="absolute -top-3 left-1/4 w-24 h-6 bg-gradient-to-r from-purple-300 to-pink-300 opacity-80" style={{ transform: 'rotate(-3deg)' }} />

              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 
                  className="text-2xl text-gray-800 flex items-center gap-2"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  ✨ Add a New Dream
                </h3>

                <div>
                  <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    What's the dream?
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Watch the Northern Lights..."
                    className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-amber-700 text-sm mb-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`px-3 py-2 rounded-lg border-2 transition-all ${
                          category === cat.id
                            ? `${cat.color} ${cat.border} shadow-md`
                            : "bg-white border-gray-200"
                        }`}
                        style={{ fontFamily: "'Patrick Hand', cursive" }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    Target Date (optional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  />
                </div>

                <div>
                  <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any details..."
                    rows={2}
                    className="w-full px-4 py-2 bg-white/80 border-2 border-dashed border-amber-200 focus:border-pink-300 outline-none resize-none"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '16px' }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg shadow-md"
                    style={{ fontFamily: "'Patrick Hand', cursive", boxShadow: '0 3px 0 #9c27b0' }}
                  >
                    Add Dream 💫
                  </button>
                </div>
              </form>
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
