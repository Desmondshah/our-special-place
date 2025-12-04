import { FormEvent, useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Cloudinary config
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads";

interface Milestone {
  _id: Id<"milestones">;
  title: string;
  date: string;
  description?: string;
  category: string;
  photos: string[];
  icon: string;
}

const categories = {
  "first-date": { emoji: "💑", label: "First Date", gradient: "from-pink-400 to-rose-500", bg: "bg-pink-50", border: "border-pink-200" },
  "anniversary": { emoji: "💝", label: "Anniversary", gradient: "from-red-400 to-rose-500", bg: "bg-red-50", border: "border-red-200" },
  "special-moment": { emoji: "✨", label: "Special Moment", gradient: "from-amber-400 to-orange-500", bg: "bg-amber-50", border: "border-amber-200" },
  "trip": { emoji: "✈️", label: "Trip", gradient: "from-sky-400 to-blue-500", bg: "bg-sky-50", border: "border-sky-200" },
  "celebration": { emoji: "🎉", label: "Celebration", gradient: "from-purple-400 to-violet-500", bg: "bg-purple-50", border: "border-purple-200" },
};

export default function MilestonesSectionModern() {
  const milestones = useQuery(api.milestones.list) || [];
  const addMilestone = useMutation(api.milestones.add);
  const updateMilestone = useMutation(api.milestones.update);
  const removeMilestone = useMutation(api.milestones.remove);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Milestone | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [imageViewer, setImageViewer] = useState<{ open: boolean; photos: string[]; index: number }>({ open: false, photos: [], index: 0 });

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("special-moment");
  const [photos, setPhotos] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [viewMode, setViewMode] = useState<"timeline" | "gallery">("timeline");

  // Sort and filter
  const filteredMilestones = milestones
    .filter(m => filter === "all" || m.category === filter)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const resetForm = () => {
    setTitle("");
    setDate("");
    setDescription("");
    setCategory("special-moment");
    setPhotos([]);
    setEditingMilestone(null);
    setShowModal(false);
  };

  const startEditing = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setDate(milestone.date);
    setDescription(milestone.description || "");
    setCategory(milestone.category);
    setPhotos([...milestone.photos]);
    setShowModal(true);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else reject(new Error('Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`);
      xhr.send(formData);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large! Max 5MB`);
          continue;
        }
        const url = await uploadToCloudinary(file);
        setPhotos(prev => [...prev, url]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    const catConfig = categories[category as keyof typeof categories];
    
    try {
      if (editingMilestone) {
        await updateMilestone({
          id: editingMilestone._id,
          title,
          date,
          description: description || undefined,
          category,
          photos,
          icon: catConfig.emoji
        });
      } else {
        await addMilestone({
          title,
          date,
          description: description || undefined,
          category,
          photos,
          icon: catConfig.emoji
        });
      }
      resetForm();
    } catch (error) {
      console.error("Failed to save milestone:", error);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    await removeMilestone({ id: showDeleteConfirm._id });
    setShowDeleteConfirm(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      year: date.getFullYear(),
      full: date.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            Our Storybook 📖💕
          </h2>
          <p className="text-gray-500 text-sm mt-1">Every moment we've cherished together</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-pink-200/50 hover:shadow-xl transition-all"
        >
          <span>🖋️</span>
          Add Memory
        </motion.button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap flex-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === "all"
                ? "bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            All
          </motion.button>
          {Object.entries(categories).map(([key, config]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === key
                  ? `bg-gradient-to-r ${config.gradient} text-white shadow-sm`
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {config.emoji}
            </motion.button>
          ))}
        </div>

        {/* Sort & View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {sortOrder === "newest" ? "⏳ Newest" : "📜 Oldest"}
          </button>
          <button
            onClick={() => setViewMode(v => v === "timeline" ? "gallery" : "timeline")}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {viewMode === "timeline" ? "🖼️ Gallery" : "📅 Timeline"}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {milestones.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <span className="text-7xl block mb-6">📚</span>
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">
            Our storybook awaits...
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Start documenting our beautiful moments together
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-semibold rounded-xl shadow-lg"
          >
            Write First Chapter ✨
          </motion.button>
        </motion.div>
      )}

      {/* Timeline View */}
      {viewMode === "timeline" && filteredMilestones.length > 0 && (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-rose-300 to-purple-300 transform md:-translate-x-1/2" />

          <div className="space-y-8">
            {filteredMilestones.map((milestone, index) => {
              const config = categories[milestone.category as keyof typeof categories] || categories["special-moment"];
              const dateInfo = formatDate(milestone.date);
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={milestone._id}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex items-center gap-4 md:gap-8 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full bg-white border-4 border-pink-400 transform -translate-x-1/2 z-10 shadow-sm" />

                  {/* Date Badge (Desktop) */}
                  <div className={`hidden md:block w-[calc(50%-2rem)] text-${isEven ? "right" : "left"}`}>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm text-gray-500 shadow-sm border border-gray-100">
                      {milestone.icon} {dateInfo.full}
                    </span>
                  </div>

                  {/* Card */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className={`ml-12 md:ml-0 md:w-[calc(50%-2rem)] bg-white rounded-2xl border ${config.border} shadow-md hover:shadow-xl transition-all overflow-hidden`}
                  >
                    {/* Photos */}
                    {milestone.photos.length > 0 && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={milestone.photos[0]}
                          alt=""
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
                          onClick={() => setImageViewer({ open: true, photos: milestone.photos, index: 0 })}
                        />
                        {milestone.photos.length > 1 && (
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
                            +{milestone.photos.length - 1} more
                          </div>
                        )}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
                      </div>
                    )}

                    <div className="p-4">
                      {/* Mobile Date */}
                      <div className="md:hidden flex items-center gap-2 text-sm text-gray-400 mb-2">
                        {milestone.icon} {dateInfo.full}
                      </div>

                      {/* Category Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${config.bg} rounded-lg text-xs font-medium mb-2`}>
                        {config.emoji} {config.label}
                      </span>

                      {/* Title */}
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        {milestone.title}
                      </h3>

                      {/* Description */}
                      {milestone.description && (
                        <p className="text-gray-500 text-sm line-clamp-2 mb-3">
                          {milestone.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(milestone)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(milestone)}
                          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gallery View */}
      {viewMode === "gallery" && filteredMilestones.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMilestones.map((milestone, index) => {
            const config = categories[milestone.category as keyof typeof categories] || categories["special-moment"];
            const dateInfo = formatDate(milestone.date);

            return (
              <motion.div
                key={milestone._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                className={`bg-white rounded-2xl border ${config.border} shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer`}
                onClick={() => milestone.photos.length > 0 && setImageViewer({ open: true, photos: milestone.photos, index: 0 })}
              >
                {milestone.photos.length > 0 ? (
                  <div className="relative h-40">
                    <img src={milestone.photos[0]} alt="" className="w-full h-full object-cover" />
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
                  </div>
                ) : (
                  <div className={`h-32 ${config.bg} flex items-center justify-center`}>
                    <span className="text-4xl">{config.emoji}</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${config.bg} rounded text-xs font-medium`}>
                      {config.emoji} {config.label}
                    </span>
                    <span className="text-xs text-gray-400">{dateInfo.month} {dateInfo.day}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 line-clamp-1">{milestone.title}</h4>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold text-gray-800">
                    {editingMilestone ? "Edit Memory ✏️" : "New Chapter ✨"}
                  </h3>
                  <button onClick={resetForm} className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500">
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Title ✨</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Our first kiss..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">When? 📅</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all appearance-none"
                    >
                      {Object.entries(categories).map(([key, config]) => (
                        <option key={key} value={key}>{config.emoji} {config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">What made it special? 💕</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe this beautiful moment..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Photos 📸</label>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full px-4 py-3 border-2 border-dashed border-pink-200 rounded-xl text-pink-500 font-medium hover:bg-pink-50 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? `Uploading... ${uploadProgress}%` : "Add Photos 🖼️"}
                  </button>
                  {photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {photos.map((photo, i) => (
                        <div key={i} className="relative aspect-square group">
                          <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-pink-400 to-rose-500 text-white font-semibold rounded-xl shadow-lg shadow-pink-200/50 hover:shadow-xl transition-all"
                  >
                    {editingMilestone ? "Save Changes 💫" : "Add to Story 💕"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
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
              <span className="text-5xl block mb-4">📜💨</span>
              <h3 className="font-display text-xl font-semibold text-gray-800 mb-2">
                Erase this page?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                "{showDeleteConfirm.title}" will be removed from our storybook.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                  Keep It
                </button>
                <motion.button
                  onClick={handleDelete}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-red-400 to-rose-500 text-white font-semibold rounded-xl"
                >
                  Erase 🗑️
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer */}
      <AnimatePresence>
        {imageViewer.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setImageViewer({ open: false, photos: [], index: 0 })}
          >
            <button
              onClick={() => setImageViewer(prev => ({ ...prev, index: Math.max(0, prev.index - 1) }))}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-sm transition-colors"
            >
              ‹
            </button>

            <motion.img
              key={imageViewer.index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={imageViewer.photos[imageViewer.index]}
              alt=""
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={e => e.stopPropagation()}
            />

            <button
              onClick={() => setImageViewer(prev => ({ ...prev, index: Math.min(prev.photos.length - 1, prev.index + 1) }))}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-sm transition-colors"
            >
              ›
            </button>

            <button
              onClick={() => setImageViewer({ open: false, photos: [], index: 0 })}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors"
            >
              ✕
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
              {imageViewer.index + 1} / {imageViewer.photos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
