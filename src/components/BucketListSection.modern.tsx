import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface BucketListItem {
  _id: Id<"bucketList">;
  title: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  links?: { flights?: string; airbnb?: string; maps?: string; tripadvisor?: string; website?: string };
  notes?: string;
}

// Category configuration with modern styling
const categoryConfig: Record<string, { emoji: string; gradient: string; lightBg: string }> = {
  adventure: { 
    emoji: "🏔️", 
    gradient: "from-emerald-500 to-teal-500", 
    lightBg: "bg-emerald-50" 
  },
  travel: { 
    emoji: "✈️", 
    gradient: "from-blue-500 to-indigo-500", 
    lightBg: "bg-blue-50" 
  },
  food: { 
    emoji: "🍽️", 
    gradient: "from-orange-500 to-amber-500", 
    lightBg: "bg-orange-50" 
  },
  milestone: { 
    emoji: "🏆", 
    gradient: "from-yellow-500 to-amber-500", 
    lightBg: "bg-yellow-50" 
  },
  other: { 
    emoji: "💫", 
    gradient: "from-rose-500 to-pink-500", 
    lightBg: "bg-rose-50" 
  },
};

const getCategoryConfig = (category: string) => {
  return categoryConfig[category] || categoryConfig.other;
};

export default function BucketListSection() {
  const firstInputRef = useRef<HTMLInputElement>(null);

  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  // Filter and sort states
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<BucketListItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<BucketListItem | null>(null);

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("adventure");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newFlightLink, setNewFlightLink] = useState("");
  const [newAirbnbLink, setNewAirbnbLink] = useState("");
  const [newMapsLink, setNewMapsLink] = useState("");
  const [newTripAdvisorLink, setNewTripAdvisorLink] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editFlightLink, setEditFlightLink] = useState("");
  const [editAirbnbLink, setEditAirbnbLink] = useState("");
  const [editMapsLink, setEditMapsLink] = useState("");
  const [editTripAdvisorLink, setEditTripAdvisorLink] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean; type: "success" | "error" }>({
    message: "",
    visible: false,
    type: "success",
  });

  // Statistics
  const totalItems = bucketList.length;
  const completedItemsCount = bucketList.filter((item) => item.isCompleted).length;
  const completionPercentage = totalItems ? Math.round((completedItemsCount / totalItems) * 100) : 0;
  const uniqueCategories = Array.from(new Set(bucketList.map((item) => item.category)));

  // Filtered and sorted list
  const filteredAndSortedList = bucketList
    .filter((item) => {
      if (filterStatus === "completed" && !item.isCompleted) return false;
      if (filterStatus === "pending" && item.isCompleted) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "date":
          const dateA = a.targetDate ? new Date(a.targetDate + "T00:00:00").getTime() : sortOrder === "asc" ? Infinity : -Infinity;
          const dateB = b.targetDate ? new Date(b.targetDate + "T00:00:00").getTime() : sortOrder === "asc" ? Infinity : -Infinity;
          return (dateA - dateB) * direction;
        case "title":
          return a.title.localeCompare(b.title) * direction;
        case "category":
          return a.category.localeCompare(b.category) * direction;
        default:
          return 0;
      }
    });

  // Focus input when modal opens
  useEffect(() => {
    if (showAddModal && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [showAddModal]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const resetNewItemForm = () => {
    setNewTitle("");
    setNewCategory("adventure");
    setNewTargetDate("");
    setNewFlightLink("");
    setNewAirbnbLink("");
    setNewMapsLink("");
    setNewTripAdvisorLink("");
    setNewNotes("");
    setShowAddModal(false);
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Give your adventure a name! 💕", "error");
      return;
    }
    try {
      const links = {
        flights: newFlightLink || undefined,
        airbnb: newAirbnbLink || undefined,
        maps: newMapsLink || undefined,
        tripadvisor: newTripAdvisorLink || undefined,
      };
      await addItem({
        title: newTitle,
        category: newCategory,
        targetDate: newTargetDate || undefined,
        links,
        notes: newNotes || undefined,
        isCompleted: false,
      });
      resetNewItemForm();
      showToast("New adventure added to your list! ✨");
    } catch (error) {
      console.error(error);
      showToast("Couldn't add this adventure", "error");
    }
  };

  const openItemDetail = (item: BucketListItem) => {
    setViewingItem(item);
    setIsEditMode(false);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTargetDate(item.targetDate ? new Date(item.targetDate + "T00:00:00").toISOString().split("T")[0] : "");
    setEditFlightLink(item.links?.flights || "");
    setEditAirbnbLink(item.links?.airbnb || "");
    setEditMapsLink(item.links?.maps || "");
    setEditTripAdvisorLink(item.links?.tripadvisor || "");
    setEditNotes(item.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!viewingItem || !editTitle.trim()) {
      showToast("Adventure name can't be empty!", "error");
      return;
    }
    try {
      const links = {
        flights: editFlightLink || undefined,
        airbnb: editAirbnbLink || undefined,
        maps: editMapsLink || undefined,
        tripadvisor: editTripAdvisorLink || undefined,
      };
      await updateItem({
        id: viewingItem._id,
        title: editTitle,
        category: editCategory,
        targetDate: editTargetDate || undefined,
        links,
        notes: editNotes || undefined,
      });
      setViewingItem(null);
      setIsEditMode(false);
      showToast("Adventure updated! 📝");
    } catch (error) {
      console.error(error);
      showToast("Couldn't update this adventure", "error");
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      await removeItem({ id: deleteConfirmItem._id });
      setDeleteConfirmItem(null);
      setViewingItem(null);
      showToast("Adventure removed from list 💨");
    } catch (error) {
      console.error(error);
      showToast("Couldn't remove this adventure", "error");
    }
  };

  const handleToggleComplete = async (item: BucketListItem) => {
    try {
      await toggleItem({ id: item._id, isCompleted: !item.isCompleted });
      if (viewingItem && viewingItem._id === item._id) {
        setViewingItem((prev) => (prev ? { ...prev, isCompleted: !prev.isCompleted } : null));
      }
      showToast(item.isCompleted ? "Back on the list! ✨" : "Adventure complete! 🎉");
    } catch (error) {
      console.error(error);
      showToast("Couldn't update status", "error");
    }
  };

  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return "Someday...";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Header Section */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-rose-100/50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Our Adventure List
              </h1>
              <p className="text-sm text-gray-500 mt-1">Dreams we're chasing together 💕</p>
            </div>
            
            {/* Stats Pills */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full">
                <span className="text-rose-600 font-medium text-sm">
                  {completedItemsCount}/{totalItems} Done
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="text-amber-700 font-medium text-sm">{completionPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Controls Section */}
      <section className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Add Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-medium shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transition-all duration-300 flex items-center gap-2"
          >
            <span className="text-lg">✨</span>
            <span>Add New Adventure</span>
          </motion.button>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-xl p-1 shadow-sm border border-gray-100">
              {(["all", "pending", "completed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filterStatus === s
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {s === "all" ? "All" : s === "pending" ? "Active" : "Done"}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-xl p-1 shadow-sm border border-gray-100">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  categoryFilter === "all"
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                🌍 All
              </button>
              {uniqueCategories.map((cat) => {
                const config = getCategoryConfig(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      categoryFilter === cat
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {config.emoji}
                  </button>
                );
              })}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-xl p-1 shadow-sm border border-gray-100">
              {(["date", "title", "category"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (sortBy === s) setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                    else {
                      setSortBy(s);
                      setSortOrder("asc");
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1 ${
                    sortBy === s
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {s === "date" ? "Date" : s === "title" ? "Name" : "Type"}
                  {sortBy === s && <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8 sm:px-6 lg:px-8">
        {/* Empty State */}
        {filteredAndSortedList.length === 0 && !showAddModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🗺️</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Your adventure list awaits!</h2>
            <p className="text-gray-500 mb-6">Start dreaming together and add your first adventure</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              ✨ Create First Adventure
            </motion.button>
          </motion.div>
        )}

        {/* Quest Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedList.map((item, index) => {
              const config = getCategoryConfig(item.category);
              return (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => openItemDetail(item)}
                  className={`relative cursor-pointer group ${config.lightBg} rounded-2xl p-5 border border-white/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
                >
                  {/* Decorative gradient */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />
                  
                  {/* Completed overlay */}
                  {item.isCompleted && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                      <div className="bg-green-500 text-white px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2">
                        <span>✓</span>
                        <span>Complete!</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Category Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-md mb-4`}>
                    {config.emoji}
                  </div>
                  
                  {/* Title */}
                  <h4 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {item.title}
                  </h4>
                  
                  {/* Date */}
                  {item.targetDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>📅</span>
                      <span>{formatDateForDisplay(item.targetDate)}</span>
                    </div>
                  )}
                  
                  {/* Notes preview */}
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.notes}</p>
                  )}
                  
                  {/* Links indicator */}
                  {(item.links?.flights || item.links?.airbnb || item.links?.maps || item.links?.tripadvisor) && (
                    <div className="flex items-center gap-1 mt-3">
                      {item.links.flights && <span className="text-xs">✈️</span>}
                      {item.links.airbnb && <span className="text-xs">🏠</span>}
                      {item.links.maps && <span className="text-xs">📍</span>}
                      {item.links.tripadvisor && <span className="text-xs">⭐</span>}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleAddNewItem}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4">
                <h3 className="text-xl font-semibold text-white">✨ New Adventure</h3>
                <p className="text-rose-100 text-sm">Add something magical to your list</p>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adventure Name</label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="What's the dream?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  >
                    <option value="adventure">🏔️ Adventure</option>
                    <option value="travel">✈️ Travel</option>
                    <option value="food">🍽️ Food Experience</option>
                    <option value="milestone">🏆 Milestone</option>
                    <option value="other">💫 Other</option>
                  </select>
                </div>
                
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date (Optional)</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                </div>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Any special plans or ideas..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                
                {/* Links */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Helpful Links (Optional)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={newFlightLink}
                      onChange={(e) => setNewFlightLink(e.target.value)}
                      placeholder="✈️ Flights"
                      className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="url"
                      value={newAirbnbLink}
                      onChange={(e) => setNewAirbnbLink(e.target.value)}
                      placeholder="🏠 Stay"
                      className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="url"
                      value={newMapsLink}
                      onChange={(e) => setNewMapsLink(e.target.value)}
                      placeholder="📍 Maps"
                      className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="url"
                      value={newTripAdvisorLink}
                      onChange={(e) => setNewTripAdvisorLink(e.target.value)}
                      placeholder="⭐ Reviews"
                      className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 flex gap-3">
                <button
                  type="button"
                  onClick={resetNewItemForm}
                  className="flex-1 px-4 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  Add Adventure ✨
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setViewingItem(null);
              setIsEditMode(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {!isEditMode ? (
                // View Mode
                <>
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${getCategoryConfig(viewingItem.category).gradient} px-6 py-5 relative`}>
                    <button
                      onClick={() => {
                        setViewingItem(null);
                        setIsEditMode(false);
                      }}
                      className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      ✕
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">
                        {getCategoryConfig(viewingItem.category).emoji}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{viewingItem.title}</h2>
                        {viewingItem.isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-white text-sm mt-1">
                            <span>✓</span> Completed!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Date */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-xl">📅</span>
                      <div>
                        <p className="text-sm text-gray-500">Target Date</p>
                        <p className="font-medium text-gray-800">{formatDateForDisplay(viewingItem.targetDate)}</p>
                      </div>
                    </div>
                    
                    {/* Notes */}
                    {viewingItem.notes && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Notes</p>
                        <p className="text-gray-800">{viewingItem.notes}</p>
                      </div>
                    )}
                    
                    {/* Links */}
                    {(viewingItem.links?.flights || viewingItem.links?.airbnb || viewingItem.links?.maps || viewingItem.links?.tripadvisor) && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-2">Helpful Links</p>
                        <div className="flex flex-wrap gap-2">
                          {viewingItem.links?.flights && (
                            <a
                              href={viewingItem.links.flights}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                            >
                              ✈️ Flights
                            </a>
                          )}
                          {viewingItem.links?.airbnb && (
                            <a
                              href={viewingItem.links.airbnb}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors"
                            >
                              🏠 Stay
                            </a>
                          )}
                          {viewingItem.links?.maps && (
                            <a
                              href={viewingItem.links.maps}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                              📍 Map
                            </a>
                          )}
                          {viewingItem.links?.tripadvisor && (
                            <a
                              href={viewingItem.links.tripadvisor}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                            >
                              ⭐ Reviews
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={() => handleToggleComplete(viewingItem)}
                        className={`w-full py-3 rounded-xl font-medium transition-all ${
                          viewingItem.isCompleted
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg"
                        }`}
                      >
                        {viewingItem.isCompleted ? "↩️ Mark as Not Done" : "✓ Mark as Complete!"}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditMode(true)}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(viewingItem)}
                          className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Edit Mode
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEdit();
                  }}
                >
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                    <h3 className="text-xl font-semibold text-white">✏️ Edit Adventure</h3>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adventure Name</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      >
                        <option value="adventure">🏔️ Adventure</option>
                        <option value="travel">✈️ Travel</option>
                        <option value="food">🍽️ Food Experience</option>
                        <option value="milestone">🏆 Milestone</option>
                        <option value="other">💫 Other</option>
                      </select>
                    </div>
                    
                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                      <input
                        type="date"
                        value={editTargetDate}
                        onChange={(e) => setEditTargetDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                    
                    {/* Links */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Links</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="url"
                          value={editFlightLink}
                          onChange={(e) => setEditFlightLink(e.target.value)}
                          placeholder="✈️ Flights"
                          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        />
                        <input
                          type="url"
                          value={editAirbnbLink}
                          onChange={(e) => setEditAirbnbLink(e.target.value)}
                          placeholder="🏠 Stay"
                          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        />
                        <input
                          type="url"
                          value={editMapsLink}
                          onChange={(e) => setEditMapsLink(e.target.value)}
                          placeholder="📍 Maps"
                          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        />
                        <input
                          type="url"
                          value={editTripAdvisorLink}
                          onChange={(e) => setEditTripAdvisorLink(e.target.value)}
                          placeholder="⭐ Reviews"
                          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="px-6 py-4 bg-gray-50 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="flex-1 px-4 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirmItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🗑️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Remove Adventure?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove "{deleteConfirmItem.title}" from your list?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmItem(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Keep It
                  </button>
                  <button
                    onClick={handleDeleteItem}
                    className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-full shadow-lg font-medium ${
              toast.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
