import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Types
interface Memory {
  photos: string[];
  rating: number;
  notes: string[];
  createdAt: string;
}

interface Plan {
  _id: Id<"plans">;
  title: string;
  date: string;
  type: string;
  website?: string;
  mapsLink?: string;
  isCompleted: boolean;
  memory?: Memory;
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads";

// Plan type configurations
const planTypes = {
  date: { emoji: "💖", label: "Date Night", color: "rose" },
  trip: { emoji: "✈️", label: "Trip", color: "blue" },
  activity: { emoji: "🎉", label: "Activity", color: "amber" },
  celebration: { emoji: "🥳", label: "Celebration", color: "purple" },
  other: { emoji: "🌟", label: "Other", color: "teal" },
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

export default function PlansSectionModern() {
  const plans = useQuery(api.plans.list) || [];
  const addPlan = useMutation(api.plans.add);
  const updatePlan = useMutation(api.plans.update);
  const togglePlan = useMutation(api.plans.toggle);
  const removePlan = useMutation(api.plans.remove);
  const addMemory = useMutation(api.plans.addMemory);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getCurrentDate());
  const [type, setType] = useState("date");
  const [website, setWebsite] = useState("");
  const [mapsLink, setMapsLink] = useState("");

  // Edit states
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Memory states
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [memoryRating, setMemoryRating] = useState(5);
  const [memoryPhotos, setMemoryPhotos] = useState<string[]>([]);
  const [memoryNotes, setMemoryNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");

  // Filter/View states
  const [viewFilter, setViewFilter] = useState("all");
  const [imageViewer, setImageViewer] = useState<{ open: boolean; src: string }>({ open: false, src: "" });

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Filter and sort plans
  const filteredPlans = plans.filter(plan => {
    if (viewFilter === "all") return true;
    if (viewFilter === "upcoming") return !plan.isCompleted;
    if (viewFilter === "completed") return plan.isCompleted;
    if (viewFilter === "memories") return Boolean(plan.memory);
    return true;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Group by month
  const plansByMonth = sortedPlans.reduce((acc: Record<string, Plan[]>, plan) => {
    const monthYear = new Date(plan.date + 'T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(plan);
    return acc;
  }, {});

  // Handlers
  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    try {
      await addPlan({
        title,
        date,
        type,
        website: website || undefined,
        mapsLink: mapsLink || undefined,
        isCompleted: false
      });
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add plan:", error);
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan || !title.trim() || !date) return;

    try {
      await updatePlan({
        id: editingPlan._id,
        title,
        date,
        type,
        website: website || undefined,
        mapsLink: mapsLink || undefined,
      });
      resetForm();
      setEditingPlan(null);
    } catch (error) {
      console.error("Failed to update plan:", error);
    }
  };

  const handleToggle = async (plan: Plan) => {
    await togglePlan({ id: plan._id, isCompleted: !plan.isCompleted });
  };

  const handleDelete = async (plan: Plan) => {
    if (window.confirm(`Are you sure you want to delete "${plan.title}"?`)) {
      await removePlan({ id: plan._id });
    }
  };

  const startEditing = (plan: Plan) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setDate(plan.date);
    setType(plan.type);
    setWebsite(plan.website || "");
    setMapsLink(plan.mapsLink || "");
  };

  const resetForm = () => {
    setTitle("");
    setDate(getCurrentDate());
    setType("date");
    setWebsite("");
    setMapsLink("");
    setEditingPlan(null);
  };

  // Memory handlers
  const openMemoryModal = (plan: Plan) => {
    setSelectedPlan(plan);
    if (plan.memory) {
      setMemoryRating(plan.memory.rating);
      setMemoryPhotos([...plan.memory.photos]);
      setMemoryNotes([...plan.memory.notes]);
    } else {
      setMemoryRating(5);
      setMemoryPhotos([]);
      setMemoryNotes([]);
    }
    setShowMemoryModal(true);
  };

  const handleSaveMemory = async () => {
    if (!selectedPlan) return;

    try {
      await addMemory({
        planId: selectedPlan._id,
        memory: {
          photos: memoryPhotos,
          rating: memoryRating,
          notes: memoryNotes,
          createdAt: new Date().toISOString()
        }
      });
      setShowMemoryModal(false);
      setSelectedPlan(null);
      setMemoryPhotos([]);
      setMemoryRating(5);
      setMemoryNotes([]);
      setNewNote("");
    } catch (error) {
      console.error("Failed to save memory:", error);
    }
  };

  // Photo upload
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`);
      xhr.send(formData);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image too large! Max 5MB");
        return;
      }
      const url = await uploadToCloudinary(file);
      setMemoryPhotos(prev => [...prev, url]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      weekday: date.toLocaleString('default', { weekday: 'short' })
    };
  };

  const filters = [
    { id: "all", label: "All", icon: "🌈" },
    { id: "upcoming", label: "Upcoming", icon: "🗓️" },
    { id: "completed", label: "Done", icon: "✅" },
    { id: "memories", label: "Memories", icon: "💝" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
            Our Adventures 💕
          </h2>
          <p className="text-gray-500 text-sm mt-1">Plan our dreams, cherish our memories</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setShowAddForm(true); resetForm(); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all"
        >
          <span>✨</span>
          New Adventure
        </motion.button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(filter => (
          <motion.button
            key={filter.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setViewFilter(filter.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              viewFilter === filter.id
                ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-md"
                : "bg-white/80 text-gray-600 hover:bg-white border border-gray-100"
            }`}
          >
            <span>{filter.icon}</span>
            {filter.label}
          </motion.button>
        ))}
      </div>

      {/* Empty State */}
      {sortedPlans.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <span className="text-6xl block mb-4">🗺️</span>
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">
            Our adventure book is empty!
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Let's fill it with wonderful plans together
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-lg"
          >
            Plan Our First Adventure ✨
          </motion.button>
        </motion.div>
      )}

      {/* Plans by Month */}
      <AnimatePresence mode="wait">
        {Object.entries(plansByMonth).map(([month, monthPlans]) => (
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500" />
              {month}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {monthPlans.map((plan, index) => {
                const typeConfig = planTypes[plan.type as keyof typeof planTypes] || planTypes.other;
                const dateInfo = formatDate(plan.date);

                return (
                  <motion.div
                    key={plan._id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ delay: index * 0.05 }}
                    className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all overflow-hidden ${
                      plan.isCompleted
                        ? "bg-gradient-to-br from-emerald-50/50 to-green-50/50 border-emerald-100"
                        : "border-gray-100 hover:border-rose-100"
                    }`}
                  >
                    {/* Top gradient bar */}
                    <div className={`h-1 bg-gradient-to-r ${
                      plan.isCompleted
                        ? "from-emerald-400 to-green-400"
                        : "from-rose-400 to-pink-400"
                    }`} />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        {/* Date Badge */}
                        <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${
                          plan.isCompleted
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-rose-50 text-rose-500"
                        }`}>
                          <span className="text-xs font-medium">{dateInfo.month}</span>
                          <span className="text-lg font-bold leading-none">{dateInfo.day}</span>
                        </div>

                        {/* Title & Type */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{typeConfig.emoji}</span>
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              {typeConfig.label}
                            </span>
                          </div>
                          <h4 className={`font-semibold text-gray-800 truncate ${
                            plan.isCompleted ? "line-through opacity-70" : ""
                          }`}>
                            {plan.title}
                          </h4>
                        </div>

                        {/* Checkbox */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggle(plan)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                            plan.isCompleted
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-gray-300 hover:border-rose-400"
                          }`}
                        >
                          {plan.isCompleted && <span className="text-sm">✓</span>}
                        </motion.button>
                      </div>

                      {/* Links */}
                      {(plan.website || plan.mapsLink) && (
                        <div className="flex gap-2 mt-3">
                          {plan.website && (
                            <a
                              href={plan.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              🌐 Website
                            </a>
                          )}
                          {plan.mapsLink && (
                            <a
                              href={plan.mapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              📍 Maps
                            </a>
                          )}
                        </div>
                      )}

                      {/* Memory Preview */}
                      {plan.memory && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm">
                              {"💖".repeat(plan.memory.rating)}
                              {"🤍".repeat(5 - plan.memory.rating)}
                            </span>
                          </div>
                          {plan.memory.photos.length > 0 && (
                            <div className="flex gap-1 overflow-hidden rounded-lg">
                              {plan.memory.photos.slice(0, 3).map((photo, i) => (
                                <img
                                  key={i}
                                  src={photo}
                                  alt=""
                                  className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setImageViewer({ open: true, src: photo })}
                                />
                              ))}
                              {plan.memory.photos.length > 3 && (
                                <div className="w-12 h-12 bg-rose-100 rounded flex items-center justify-center text-xs font-medium text-rose-500">
                                  +{plan.memory.photos.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditing(plan)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(plan)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>

                        {plan.isCompleted && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openMemoryModal(plan)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              plan.memory
                                ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                                : "bg-rose-50 text-rose-500 hover:bg-rose-100"
                            }`}
                          >
                            {plan.memory ? "💝 View Memory" : "✨ Add Memory"}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {(showAddForm || editingPlan) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowAddForm(false); setEditingPlan(null); resetForm(); }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold text-gray-800">
                    {editingPlan ? "Edit Adventure ✏️" : "Plan New Adventure ✨"}
                  </h3>
                  <button
                    onClick={() => { setShowAddForm(false); setEditingPlan(null); resetForm(); }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={editingPlan ? (e) => { e.preventDefault(); handleUpdatePlan(); } : handleAddPlan} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    What's the adventure? 🌟
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Romantic dinner, beach trip..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      When? 📅
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Type
                    </label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all appearance-none"
                    >
                      {Object.entries(planTypes).map(([key, config]) => (
                        <option key={key} value={key}>{config.emoji} {config.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Website (optional) 🌐
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Maps Link (optional) 📍
                  </label>
                  <input
                    type="url"
                    value={mapsLink}
                    onChange={e => setMapsLink(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setEditingPlan(null); resetForm(); }}
                    className="flex-1 px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all"
                  >
                    {editingPlan ? "Save Changes 💫" : "Add Adventure 💕"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Modal */}
      <AnimatePresence>
        {showMemoryModal && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMemoryModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-gray-800">
                      {selectedPlan.memory ? "Our Memory 💝" : "Capture This Moment ✨"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedPlan.title}</p>
                  </div>
                  <button
                    onClick={() => setShowMemoryModal(false)}
                    className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">
                    How magical was it? 💫
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMemoryRating(star)}
                        className="text-2xl transition-all"
                      >
                        {star <= memoryRating ? "💖" : "🤍"}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">
                    Our Photos 📸
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full px-4 py-3 border-2 border-dashed border-rose-200 rounded-xl text-rose-500 font-medium hover:bg-rose-50 hover:border-rose-300 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? `Uploading... ${uploadProgress}%` : "Add Photo 🖼️"}
                  </motion.button>

                  {memoryPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {memoryPhotos.map((photo, i) => (
                        <div key={i} className="relative group aspect-square">
                          <img
                            src={photo}
                            alt=""
                            className="w-full h-full object-cover rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={() => setMemoryPhotos(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-3">
                    What made it special? 💕
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Our favorite part was..."
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-rose-300 transition-all"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newNote.trim()) {
                          e.preventDefault();
                          setMemoryNotes(prev => [...prev, newNote.trim()]);
                          setNewNote("");
                        }
                      }}
                    />
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (newNote.trim()) {
                          setMemoryNotes(prev => [...prev, newNote.trim()]);
                          setNewNote("");
                        }
                      }}
                      className="px-4 py-2.5 bg-rose-100 text-rose-600 font-medium rounded-xl hover:bg-rose-200 transition-colors"
                    >
                      Add
                    </motion.button>
                  </div>

                  {memoryNotes.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {memoryNotes.map((note, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl border border-rose-100"
                        >
                          <span className="text-sm text-gray-700">{note}</span>
                          <button
                            type="button"
                            onClick={() => setMemoryNotes(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMemoryModal(false)}
                  className="flex-1 px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSaveMemory}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all"
                >
                  Save Memory 💕
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
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setImageViewer({ open: false, src: "" })}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={imageViewer.src}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setImageViewer({ open: false, src: "" })}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
