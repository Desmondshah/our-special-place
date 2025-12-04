import { FormEvent, useState, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Dream {
  _id: Id<"dreams">;
  title: string;
  category: string;
  description?: string;
  imageUrl?: string;
}

const dreamCategories = {
  travel: { emoji: "✈️", label: "Travel", gradient: "from-sky-400 to-blue-500", bg: "bg-sky-50" },
  home: { emoji: "🏡", label: "Home", gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50" },
  pets: { emoji: "🐾", label: "Pets", gradient: "from-emerald-400 to-green-500", bg: "bg-emerald-50" },
  activities: { emoji: "🎨", label: "Activities", gradient: "from-pink-400 to-rose-500", bg: "bg-pink-50" },
  other: { emoji: "🌟", label: "Other", gradient: "from-purple-400 to-violet-500", bg: "bg-purple-50" },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

export default function DreamsSectionModern() {
  const dreams = useQuery(api.dreams.list) || [];
  const addDream = useMutation(api.dreams.add);
  const removeDream = useMutation(api.dreams.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Dream | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [newDream, setNewDream] = useState({
    title: "",
    category: "travel",
    description: "",
    imageUrl: ""
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDream(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setNewDream({ title: "", category: "travel", description: "", imageUrl: "" });
    setShowAddModal(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDream.title.trim()) return;

    setIsSubmitting(true);
    try {
      await addDream({
        title: newDream.title,
        category: newDream.category,
        description: newDream.description || undefined,
        imageUrl: newDream.imageUrl || undefined
      });
      resetForm();
    } catch (error) {
      console.error("Failed to add dream:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await removeDream({ id: showDeleteConfirm._id });
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete dream:", error);
    }
  };

  const filteredDreams = selectedCategory
    ? dreams.filter(d => d.category === selectedCategory)
    : dreams;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 to-violet-500 bg-clip-text text-transparent">
            Our Dreamscape 🌌
          </h2>
          <p className="text-gray-500 text-sm mt-1">All the beautiful dreams we share together</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-400 to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all"
        >
          <span>🌠</span>
          Catch a Dream
        </motion.button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === null
              ? "bg-gradient-to-r from-purple-400 to-violet-500 text-white shadow-md"
              : "bg-white/80 text-gray-600 hover:bg-white border border-gray-100"
          }`}
        >
          🌈 All Dreams
        </motion.button>
        {Object.entries(dreamCategories).map(([key, config]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === key
                ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                : "bg-white/80 text-gray-600 hover:bg-white border border-gray-100"
            }`}
          >
            {config.emoji} {config.label}
          </motion.button>
        ))}
      </div>

      {/* Empty State */}
      {dreams.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <motion.span
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl block mb-6"
          >
            💭
          </motion.span>
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">
            The night sky is clear...
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Let's fill it with our beautiful dreams and wishes together
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-violet-500 text-white font-semibold rounded-xl shadow-lg"
          >
            Make a Wish 🌠
          </motion.button>
        </motion.div>
      )}

      {/* Dreams Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filteredDreams.map((dream) => {
            const config = dreamCategories[dream.category as keyof typeof dreamCategories] || dreamCategories.other;

            return (
              <motion.div
                key={dream._id}
                variants={cardVariants}
                exit="exit"
                layout
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-lg hover:shadow-2xl transition-shadow overflow-hidden"
              >
                {/* Gradient Top Bar */}
                <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />

                {/* Delete Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                  onClick={() => setShowDeleteConfirm(dream)}
                >
                  ✕
                </motion.button>

                {/* Image */}
                {dream.imageUrl && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={dream.imageUrl}
                      alt={dream.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center text-lg`}>
                      {config.emoji}
                    </span>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {config.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                    {dream.title}
                  </h3>

                  {/* Description */}
                  {dream.description && (
                    <p className="text-gray-500 text-sm line-clamp-3">
                      {dream.description}
                    </p>
                  )}

                  {/* Decorative Stars */}
                  <div className="flex gap-1 mt-4 opacity-40">
                    {[...Array(5)].map((_, i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                        className="text-xs text-purple-400"
                      >
                        ✦
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Add Dream Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-gray-800">
                      Whisper a Dream ✨
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">What do we dream of together?</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    What are we dreaming of? 🌟
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newDream.title}
                    onChange={handleInputChange}
                    placeholder="Visit Paris together..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Category
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(dreamCategories).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNewDream(prev => ({ ...prev, category: key }))}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          newDream.category === key
                            ? `${config.bg} border-current shadow-sm`
                            : "bg-gray-50 border-transparent hover:border-gray-200"
                        }`}
                      >
                        <span className="text-xl block text-center">{config.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Tell me more (optional) 💭
                  </label>
                  <textarea
                    name="description"
                    value={newDream.description}
                    onChange={handleInputChange}
                    placeholder="Describe this lovely dream..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    A picture for our dream? (optional) 🖼️
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={newDream.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-400 to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-200/50 hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Adding..." : "Add to Our Sky! 🌟"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <span className="text-5xl block mb-4">🌙</span>
              <h3 className="font-display text-xl font-semibold text-gray-800 mb-2">
                Let this dream fade?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to remove "{showDeleteConfirm.title}" from our dreamscape?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Keep Dreaming
                </button>
                <motion.button
                  onClick={handleDelete}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-red-400 to-rose-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Let It Go 💨
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
