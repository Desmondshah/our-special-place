import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Define TypeScript interface for bucket list item
interface BucketListItem {
  _id: Id<"bucketList">;
  title: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  links?: {
    flights?: string;
    airbnb?: string;
    maps?: string;
    tripadvisor?: string;
    website?: string;
  };
  notes?: string;
}

export default function BucketListSection() {
  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  // Refs for handling mobile interactions
  const modalRef = useRef<HTMLDivElement>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);

  // State for filtering
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  // State for showing form
  const [showForm, setShowForm] = useState(false);
  
  // State for mobile UI
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // State for new item
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("adventure");
  const [targetDate, setTargetDate] = useState("");
  const [flightLink, setFlightLink] = useState("");
  const [airbnbLink, setAirbnbLink] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [tripAdvisorLink, setTripAdvisorLink] = useState("");
  const [notes, setNotes] = useState("");

  // State for editing - using bottom sheet approach for mobile
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<Id<"bucketList"> | null>(null);
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editFlightLink, setEditFlightLink] = useState("");
  const [editAirbnbLink, setEditAirbnbLink] = useState("");
  const [editMapsLink, setEditMapsLink] = useState("");
  const [editTripAdvisorLink, setEditTripAdvisorLink] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // A simpler bottom sheet for quick actions on mobile
  const [quickActionItem, setQuickActionItem] = useState<BucketListItem | null>(null);

  // Stats calculation
  const totalItems = bucketList.length;
  const completedItems = bucketList.filter(item => item.isCompleted).length;
  const pendingItems = totalItems - completedItems;
  
  // Category counts for the visual indicators
  const categoryCounts = bucketList.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter the list based on current filters
  const filteredList = bucketList.filter((item: BucketListItem) => {
    // Status filter
    if (filter === "completed" && !item.isCompleted) return false;
    if (filter === "pending" && item.isCompleted) return false;
    
    // Category filter
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    
    return true;
  });
  
  // Sort the list: pending first, then by target date
  const sortedList = [...filteredList].sort((a, b) => {
    // First by completion status
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    
    // Then by target date (if available)
    if (a.targetDate && b.targetDate) {
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    }
    
    // Items with target dates come before those without
    if (a.targetDate && !b.targetDate) return -1;
    if (!a.targetDate && b.targetDate) return 1;
    
    return 0;
  });

  // Close bottom sheet when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current && 
        !modalRef.current.contains(event.target as Node) &&
        (!bottomSheetRef.current || !bottomSheetRef.current.contains(event.target as Node))
      ) {
        closeModals();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle body scroll lock
  useEffect(() => {
    if (isEditModalOpen || deleteConfirmOpen || quickActionItem) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isEditModalOpen, deleteConfirmOpen, quickActionItem]);

  const closeModals = () => {
    setIsEditModalOpen(false);
    setDeleteConfirmOpen(null);
    setQuickActionItem(null);
    setEditingItem(null);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title for your bucket list item");
      return;
    }
    
    try {
      // Create a links object if any links are provided
      const links = (flightLink || airbnbLink || mapsLink || tripAdvisorLink) 
        ? {
            flights: flightLink || undefined,
            airbnb: airbnbLink || undefined,
            maps: mapsLink || undefined,
            tripadvisor: tripAdvisorLink || undefined
          } 
        : undefined;
      
      // Calculate next day to fix date display issue
      let fixedDate = targetDate;
      if (targetDate) {
        const date = new Date(targetDate);
        date.setDate(date.getDate() + 1);
        fixedDate = date.toISOString().split('T')[0];
      }
      
      await addItem({
        title,
        category,
        targetDate: fixedDate || undefined,
        links,
        notes: notes || undefined,
        isCompleted: false
      });
      
      // Clear form after successful submission
      setTitle("");
      setCategory("adventure");
      setTargetDate("");
      setFlightLink("");
      setAirbnbLink("");
      setMapsLink("");
      setTripAdvisorLink("");
      setNotes("");
      
      // Hide form after submission
      setShowForm(false);
    } catch (error) {
      console.error("Failed to add item:", error);
      alert("Failed to add item. Please try again.");
    }
  };

  const startEditing = (item: BucketListItem) => {
    setQuickActionItem(null); // Close quick action sheet first
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    
    // Handle date display for editing
    if (item.targetDate) {
      // Adjust date display to account for timezone
      const date = new Date(item.targetDate);
      setEditTargetDate(date.toISOString().split('T')[0]);
    } else {
      setEditTargetDate("");
    }
    
    // Extract links from the nested structure
    setEditFlightLink(item.links?.flights || "");
    setEditAirbnbLink(item.links?.airbnb || "");
    setEditMapsLink(item.links?.maps || "");
    setEditTripAdvisorLink(item.links?.tripadvisor || "");
    setEditNotes(item.notes || "");
    
    // Open modal
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    try {
      // Create a links object if any links are provided
      const links = (editFlightLink || editAirbnbLink || editMapsLink || editTripAdvisorLink) 
        ? {
            flights: editFlightLink || undefined,
            airbnb: editAirbnbLink || undefined,
            maps: editMapsLink || undefined,
            tripadvisor: editTripAdvisorLink || undefined
          } 
        : undefined;
      
      // Calculate next day to fix date display issue
      let fixedDate = editTargetDate;
      if (editTargetDate) {
        const date = new Date(editTargetDate);
        date.setDate(date.getDate() + 1);
        fixedDate = date.toISOString().split('T')[0];
      }
      
      await updateItem({
        id: editingItem._id,
        title: editTitle,
        category: editCategory,
        targetDate: fixedDate || undefined,
        links,
        notes: editNotes || undefined
      });
      
      // Close modal after saving
      closeModals();
    } catch (error) {
      console.error("Failed to update item:", error);
      alert("Failed to update item. Please try again.");
    }
  };

  const showQuickActions = (item: BucketListItem) => {
    setQuickActionItem(item);
  };

  const confirmDelete = (id: Id<"bucketList">) => {
    setQuickActionItem(null);
    setDeleteConfirmOpen(id);
  };

  const handleDelete = async (id: Id<"bucketList">) => {
    try {
      await removeItem({ id });
      closeModals();
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get category emoji
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case "adventure": return "🎯";
      case "travel": return "✈️";
      case "food": return "🍽️";
      case "milestone": return "🎉";
      default: return "✨";
    }
  };

  // Get category color class
  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case "adventure": return "bg-[#FFB6B6]";
      case "travel": return "bg-[#B6DCFF]";
      case "food": return "bg-[#FFE0B2]";
      case "milestone": return "bg-[#C9B6FF]";
      default: return "bg-[#B6FFD8]";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex flex-col items-center space-y-3">
        <h2 className="text-center text-2xl sm:text-3xl text-[#FF6B6B] font-bold">
          Our Bucket List <span className="heart-icon">❤️</span>
        </h2>
        
        {/* Progress bar */}
        <div className="w-full max-w-md bg-[#FFF1E6] h-4 sm:h-6 rounded-full border-2 border-[#FFDAB9] overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FFB6B6] to-[#FF6B6B] transition-all duration-500"
            style={{ width: `${totalItems ? (completedItems / totalItems) * 100 : 0}%` }}
          ></div>
        </div>
        
        <div className="text-center text-sm sm:text-base text-[#5D4037]">
          <span className="font-bold">{completedItems}</span> of <span className="font-bold">{totalItems}</span> items completed
          {totalItems > 0 && (
            <span className="ml-2 text-xs">
              ({Math.round((completedItems / totalItems) * 100)}%)
            </span>
          )}
        </div>
      </div>
      
      {/* Mobile-optimized control panel - floating action button and compact filters */}
      <div className="relative">
        {/* Filter toggle button for mobile */}
        <div className="sm:hidden flex justify-between items-center mb-2">
          <button
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className="pixel-button text-sm px-3 py-1 flex items-center gap-1"
          >
            <span>{isFilterMenuOpen ? "✕" : "🔍"}</span>
            <span>Filters</span>
            <span className="bg-[#FFB6B6] text-white text-xs px-1.5 rounded-full">
              {filter !== "all" || categoryFilter !== "all" ? "!" : ""}
            </span>
          </button>
          
          {/* Toggle form button - mobile */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="pixel-button text-sm px-3 py-1 flex items-center gap-1"
          >
            {showForm ? "Close" : "Add New"}
            <span>{showForm ? "✕" : "+"}</span>
          </button>
        </div>
        
        {/* Collapsible filter menu for mobile */}
        <div className={`sm:hidden ${isFilterMenuOpen ? 'block' : 'hidden'} mb-4 py-3 px-4 bg-[#FFF1E6] border-2 border-[#FFDAB9] rounded-xl shadow-md animate-fade-in`}>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-[#5D4037] block mb-1 font-medium">Status</label>
              <div className="tab-filter">
                <button
                  onClick={() => setFilter("all")}
                  className={`tab-filter-button ${filter === "all" ? "tab-filter-button-active" : ""}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={`tab-filter-button ${filter === "pending" ? "tab-filter-button-active" : ""}`}
                >
                  Pending ({pendingItems})
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`tab-filter-button ${filter === "completed" ? "tab-filter-button-active" : ""}`}
                >
                  Done ({completedItems})
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-sm text-[#5D4037] block mb-1 font-medium">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pixel-input text-sm h-10 w-full"
              >
                <option value="all">All Categories</option>
                <option value="adventure">Adventure 🎯</option>
                <option value="travel">Travel ✈️</option>
                <option value="food">Food 🍽️</option>
                <option value="milestone">Milestone 🎉</option>
                <option value="other">Other ✨</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Desktop filter controls */}
        <div className="hidden sm:flex sm:flex-row gap-4 justify-between items-center p-4 bg-[#FFF1E6] rounded-xl border-2 border-[#FFDAB9] shadow-md">
          <div className="flex sm:flex-row gap-2">
            {/* Status filter */}
            <div className="tab-filter">
              <button
                onClick={() => setFilter("all")}
                className={`tab-filter-button ${filter === "all" ? "tab-filter-button-active" : ""}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`tab-filter-button ${filter === "pending" ? "tab-filter-button-active" : ""}`}
              >
                Pending ({pendingItems})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`tab-filter-button ${filter === "completed" ? "tab-filter-button-active" : ""}`}
              >
                Completed ({completedItems})
              </button>
            </div>
            
            {/* Desktop category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pixel-input text-sm h-10 sm:w-32 w-full"
            >
              <option value="all">All Categories</option>
              <option value="adventure">Adventure 🎯</option>
              <option value="travel">Travel ✈️</option>
              <option value="food">Food 🍽️</option>
              <option value="milestone">Milestone 🎉</option>
              <option value="other">Other ✨</option>
            </select>
          </div>
          
          {/* Desktop add button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="fancy-button hidden sm:flex transition-all hover:bg-[#FFB6B6]"
          >
            <span className="button-icon">{showForm ? "📝" : "➕"}</span>
            {showForm ? "Hide Form" : "Add New Dream"}
          </button>
        </div>
      </div>
      
      {/* Add Item Form - Collapsible, optimized for mobile */}
      <div className={`collapsible ${showForm ? "open" : ""}`}>
        <form onSubmit={handleAddItem} className="space-y-4 bg-[#FFF5EE] rounded-xl border-2 border-[#FFDAB9] p-4 shadow-md">
          <h3 className="section-title text-lg mb-3">Add New Bucket List Item</h3>
          
          {/* Main info - simplified for mobile */}
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your bucket list?"
              className="pixel-input w-full text-base"
              required
            />
            
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pixel-input w-full text-base"
            >
              <option value="adventure">Adventure 🎯</option>
              <option value="travel">Travel ✈️</option>
              <option value="food">Food 🍽️</option>
              <option value="milestone">Milestone 🎉</option>
              <option value="other">Other ✨</option>
            </select>
            
            {/* Date picker - mobile friendly */}
            <div>
              <div className="flex items-center mb-1">
                <span className="text-[#5D4037] mr-2">📅</span>
                <label htmlFor="targetDate" className="text-[#5D4037] text-sm">Target Date</label>
              </div>
              <input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="pixel-input w-full text-base"
              />
            </div>
          </div>
          
          {/* Collapsible advanced options for mobile */}
          <details className="group">
            <summary className="flex items-center list-none cursor-pointer mb-2">
              <span className="pixel-button text-xs sm:text-sm px-3 py-1 flex items-center gap-1">
                <span>📎</span>
                <span>Links & Notes</span>
                <span className="transform group-open:rotate-180 transition-transform">▼</span>
              </span>
            </summary>
            
            <div className="pt-2 pb-1 space-y-3 animate-fade-in">
              {/* Links section */}
              <div className="flex items-center">
                <span className="text-[#5D4037] mr-2">🔗</span>
                <h4 className="text-[#5D4037] text-sm">Helpful Links (Optional)</h4>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">✈️</span>
                  <input
                    type="url"
                    value={flightLink}
                    onChange={(e) => setFlightLink(e.target.value)}
                    placeholder="Flight booking link"
                    className="pixel-input w-full text-sm"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🏠</span>
                  <input
                    type="url"
                    value={airbnbLink}
                    onChange={(e) => setAirbnbLink(e.target.value)}
                    placeholder="Airbnb link"
                    className="pixel-input w-full text-sm"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📍</span>
                  <input
                    type="url"
                    value={mapsLink}
                    onChange={(e) => setMapsLink(e.target.value)}
                    placeholder="Google Maps link"
                    className="pixel-input w-full text-sm"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-lg">⭐</span>
                  <input
                    type="url"
                    value={tripAdvisorLink}
                    onChange={(e) => setTripAdvisorLink(e.target.value)}
                    placeholder="TripAdvisor link"
                    className="pixel-input w-full text-sm"
                  />
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <div className="flex items-center mb-1">
                  <span className="text-[#5D4037] mr-2">📝</span>
                  <label htmlFor="notes" className="text-[#5D4037] text-sm">Notes (Optional)</label>
                </div>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special details about this dream..."
                  className="pixel-input w-full h-20 resize-none text-sm"
                />
              </div>
            </div>
          </details>
          
          <div className="flex justify-center">
            <button
              type="submit"
              className="pixel-button w-full transition-all hover:bg-[#FFB6B6]"
            >
              <span className="button-icon">✨</span> Add to Bucket List
            </button>
          </div>
        </form>
      </div>
      
      {/* Category chips - scrollable on mobile */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="overflow-x-auto py-2 px-1 -mx-1 flex sm:flex-wrap sm:justify-center scrollbar-hide">
          <div className="flex gap-2 flex-nowrap">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <div
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full border-2 border-[#FFDAB9] shadow-sm cursor-pointer transition-all hover:transform hover:scale-105 flex-shrink-0 ${
                  categoryFilter === cat ? "bg-[#FFB6B6] text-white" : "bg-[#FFF1E6]"
                }`}
              >
                <span>{getCategoryEmoji(cat)}</span>
                <span className="font-medium text-sm whitespace-nowrap">{cat}</span>
                <span className="bg-white text-[#5D4037] text-xs rounded-full px-2 py-0.5 ml-1">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {sortedList.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <h3 className="empty-state-title">No items found</h3>
          <p className="empty-state-desc">
            {bucketList.length === 0 
              ? "Add your first bucket list item to get started!" 
              : "Try changing your filters to see more items."}
          </p>
          {bucketList.length > 0 && categoryFilter !== "all" && (
            <button
              onClick={() => setCategoryFilter("all")}
              className="pixel-button mt-4"
            >
              Show All Categories
            </button>
          )}
        </div>
      )}

      {/* Bucket List - now optimized for mobile with single column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedList.map((item: BucketListItem) => (
          <div 
            key={item._id} 
            className={`relative rounded-xl p-3 sm:p-4 border-2 border-[#FFDAB9] shadow-md transition-all ${
              item.isCompleted ? "bg-[#F5F5F5] opacity-80" : "bg-[#FFF5EE]"
            } plan-card-hover`}
            onClick={() => showQuickActions(item)}
          >
            {/* Category badge and completion checkbox */}
            <div className="flex justify-between items-start mb-2">
              <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColorClass(item.category)} opacity-90`}>
                {getCategoryEmoji(item.category)} {item.category}
              </div>
              
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => toggleItem({ id: item._id, isCompleted: !item.isCompleted })}
                    className="styled-checkbox"
                  />
                  <span className="ml-1 text-xs sm:text-sm">{item.isCompleted ? "Done!" : "Pending"}</span>
                </label>
              </div>
            </div>
            
            {/* Title and date */}
            <div className="mb-3">
              <h3 className={`text-lg sm:text-xl font-bold text-[#5D4037] ${item.isCompleted ? "line-through opacity-70" : ""}`}>
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#8D6E63] mt-1">
                <span className="inline-block mr-1">📅</span>
                {formatDateForDisplay(item.targetDate)}
              </p>
            </div>
            
            {/* Only show notes on desktop or if they're short */}
            {item.notes && (item.notes.length < 100 || window.innerWidth > 640) && (
              <div className="mb-3 bg-white bg-opacity-50 p-2 rounded-lg border border-[#FFDAB9]">
                <p className="text-xs sm:text-sm text-[#5D4037] italic line-clamp-2 sm:line-clamp-none">
                  <span className="inline-block mr-1">💭</span>
                  {item.notes}
                </p>
              </div>
            )}
            
            {/* Links row - simplified for mobile */}
            {(item.links?.flights || item.links?.airbnb || item.links?.maps || item.links?.tripadvisor) && (
              <div className="flex flex-wrap gap-2 mt-1 mb-2" onClick={(e) => e.stopPropagation()}>
                {item.links?.flights && (
                  <a
                    href={item.links.flights}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-button text-xs px-2 py-1 bg-[#FFE0B2] hover:bg-[#FFDAB9]"
                    title="View Flight"
                  >
                    ✈️
                  </a>
                )}
                {item.links?.airbnb && (
                  <a
                    href={item.links.airbnb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-button text-xs px-2 py-1 bg-[#FFE0B2] hover:bg-[#FFDAB9]"
                    title="View Accommodation"
                  >
                    🏠
                  </a>
                )}
                {item.links?.maps && (
                  <a
                    href={item.links.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-button text-xs px-2 py-1 bg-[#FFE0B2] hover:bg-[#FFDAB9]"
                    title="View Map"
                  >
                    📍
                  </a>
                )}
                {item.links?.tripadvisor && (
                  <a
                    href={item.links.tripadvisor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pixel-button text-xs px-2 py-1 bg-[#FFE0B2] hover:bg-[#FFDAB9]"
                    title="View Reviews"
                  >
                    ⭐
                  </a>
                )}
              </div>
            )}
            
            {/* Mobile indicator to tap for more actions */}
            <div className="absolute bottom-2 right-2 text-xs text-[#8D6E63] sm:hidden">
              <span className="animate-pulse">Tap for actions</span>
            </div>
            
            {/* Desktop-only edit and delete buttons */}
            <div className="hidden sm:flex gap-2 mt-2 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(item);
                }}
                className="pixel-button text-xs px-2 py-1 bg-[#B6DCFF] hover:bg-[#91C9FF]"
                title="Edit Item"
              >
                ✏️
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(item._id);
                }}
                className="pixel-button text-xs px-2 py-1 bg-[#FFCCBC] hover:bg-[#FFAB91]"
                title="Delete Item"
              >
                🗑️
              </button>
            </div>
            
            {/* Completed badge */}
            {item.isCompleted && (
              <div className="absolute -rotate-12 top-3 right-3 bg-[#A5D6A7] px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border-2 border-[#81C784] text-[#1B5E20] text-xs sm:text-sm font-bold shadow-md">
                Done! 🎉
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Quick Action Bottom Sheet - Mobile Only */}
      {quickActionItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-end sm:hidden">
          <div 
            ref={bottomSheetRef}
            className="w-full bg-[#FFF5EE] border-t-4 border-[#FFDAB9] rounded-t-xl p-4 shadow-lg animate-slide-up max-h-[80vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-[#FFDAB9] rounded-full mx-auto mb-4"></div>
            
            <h3 className="text-xl text-center text-[#5D4037] mb-3 font-bold line-clamp-1">
              {quickActionItem.title}
            </h3>
            
            {/* Notes in bottom sheet */}
            {quickActionItem.notes && (
              <div className="mb-4 bg-white bg-opacity-70 p-3 rounded-lg border border-[#FFDAB9]">
                <p className="text-sm text-[#5D4037] italic">
                  <span className="inline-block mr-1">💭</span>
                  {quickActionItem.notes}
                </p>
              </div>
            )}
            
            {/* Toggle completion status - larger button for mobile */}
            <button
              onClick={() => {
                toggleItem({ 
                  id: quickActionItem._id, 
                  isCompleted: !quickActionItem.isCompleted 
                });
                setQuickActionItem(null);
              }}
              className={`w-full pixel-button mb-3 flex items-center justify-center gap-2 ${
                quickActionItem.isCompleted 
                  ? "bg-[#FFCCBC] hover:bg-[#FFAB91] text-[#BF360C]" 
                  : "bg-[#A5D6A7] hover:bg-[#81C784] text-[#1B5E20]"
              }`}
            >
              <span className="text-lg">
                {quickActionItem.isCompleted ? "↩️" : "✓"}
              </span>
              <span className="font-medium">
                {quickActionItem.isCompleted ? "Mark as Pending" : "Mark as Completed"}
              </span>
            </button>
            
            {/* Links section - large touch targets */}
            {(quickActionItem.links?.flights || quickActionItem.links?.airbnb || 
              quickActionItem.links?.maps || quickActionItem.links?.tripadvisor) && (
              <div className="mb-4">
                <h4 className="text-sm text-[#5D4037] mb-2 font-medium">Open Links:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickActionItem.links?.flights && (
                    <a
                      href={quickActionItem.links.flights}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pixel-button h-12 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">✈️</span>
                      <span>Flights</span>
                    </a>
                  )}
                  {quickActionItem.links?.airbnb && (
                    <a
                      href={quickActionItem.links.airbnb}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pixel-button h-12 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">🏠</span>
                      <span>Airbnb</span>
                    </a>
                  )}
                  {quickActionItem.links?.maps && (
                    <a
                      href={quickActionItem.links.maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pixel-button h-12 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">📍</span>
                      <span>Maps</span>
                    </a>
                  )}
                  {quickActionItem.links?.tripadvisor && (
                    <a
                      href={quickActionItem.links.tripadvisor}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pixel-button h-12 flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">⭐</span>
                      <span>Reviews</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Edit and delete - full width for easy tapping */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => startEditing(quickActionItem)}
                className="pixel-button py-3 flex items-center justify-center gap-2 bg-[#B6DCFF] hover:bg-[#91C9FF]"
              >
                <span className="text-lg">✏️</span>
                <span>Edit</span>
              </button>
              <button
                onClick={() => confirmDelete(quickActionItem._id)}
                className="pixel-button py-3 flex items-center justify-center gap-2 bg-[#FFCCBC] hover:bg-[#FFAB91]"
              >
                <span className="text-lg">🗑️</span>
                <span>Delete</span>
              </button>
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setQuickActionItem(null)}
              className="w-full pixel-button mt-3 bg-[#F5F5F5] hover:bg-[#E0E0E0]"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Edit Modal - Bottom Sheet on Mobile, Center Modal on Desktop */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex sm:items-center justify-center sm:p-4">
          <div 
            ref={modalRef}
            className={`bg-[#FFF5EE] border-2 border-[#FFDAB9] shadow-lg
                       sm:rounded-xl sm:max-w-md w-full max-h-[90vh] overflow-y-auto
                       ${window.innerWidth < 640 
                         ? 'rounded-t-xl mt-auto animate-slide-up border-t-4' 
                         : 'rounded-xl animate-fade-in'}`}
          >
            {/* Mobile drag indicator */}
            {window.innerWidth < 640 && (
              <div className="w-12 h-1 bg-[#FFDAB9] rounded-full mx-auto my-2"></div>
            )}
            
            <div className="p-4">
              <h3 className="text-center text-xl text-[#5D4037] mb-4">
                <span className="mr-2">✏️</span>
                Edit Bucket List Item
              </h3>
              
              <div className="space-y-4">
                {/* Title and category */}
                <div className="space-y-3">
                  <div>
                    <label htmlFor="editTitle" className="text-sm text-[#5D4037] block mb-1">Title</label>
                    <input
                      id="editTitle"
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="pixel-input w-full"
                      placeholder="Title"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="editCategory" className="text-sm text-[#5D4037] block mb-1">Category</label>
                    <select
                      id="editCategory"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="pixel-input w-full"
                    >
                      <option value="adventure">Adventure 🎯</option>
                      <option value="travel">Travel ✈️</option>
                      <option value="food">Food 🍽️</option>
                      <option value="milestone">Milestone 🎉</option>
                      <option value="other">Other ✨</option>
                    </select>
                  </div>
                </div>
                
                {/* Target date */}
                <div>
                  <label htmlFor="editTargetDate" className="text-sm text-[#5D4037] block mb-1">Target Date</label>
                  <input
                    id="editTargetDate"
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="pixel-input w-full"
                  />
                </div>
                
                {/* Mobile: Collapsible Links Section */}
                <details className={`group ${window.innerWidth < 640 ? 'block' : 'hidden'}`}>
                  <summary className="flex items-center list-none cursor-pointer mb-2">
                    <span className="pixel-button text-xs sm:text-sm px-3 py-1 flex items-center gap-1">
                      <span>🔗</span>
                      <span>Links</span>
                      <span className="transform group-open:rotate-180 transition-transform">▼</span>
                    </span>
                  </summary>
                  
                  <div className="pt-2 pb-1 space-y-3 animate-fade-in">
                    <div className="flex items-center space-x-2 mb-2">
                      <span>✈️</span>
                      <input
                        type="url"
                        value={editFlightLink}
                        onChange={(e) => setEditFlightLink(e.target.value)}
                        placeholder="Flight booking link"
                        className="pixel-input w-full"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span>🏠</span>
                      <input
                        type="url"
                        value={editAirbnbLink}
                        onChange={(e) => setEditAirbnbLink(e.target.value)}
                        placeholder="Airbnb link"
                        className="pixel-input w-full"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <span>📍</span>
                      <input
                        type="url"
                        value={editMapsLink}
                        onChange={(e) => setEditMapsLink(e.target.value)}
                        placeholder="Google Maps link"
                        className="pixel-input w-full"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span>⭐</span>
                      <input
                        type="url"
                        value={editTripAdvisorLink}
                        onChange={(e) => setEditTripAdvisorLink(e.target.value)}
                        placeholder="TripAdvisor link"
                        className="pixel-input w-full"
                      />
                    </div>
                  </div>
                </details>
                
                {/* Desktop: Always visible Links */}
                <div className={`space-y-3 ${window.innerWidth < 640 ? 'hidden' : 'block'}`}>
                  <h4 className="text-sm text-[#5D4037]">Helpful Links</h4>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span>✈️</span>
                    <input
                      type="url"
                      value={editFlightLink}
                      onChange={(e) => setEditFlightLink(e.target.value)}
                      placeholder="Flight booking link"
                      className="pixel-input w-full"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span>🏠</span>
                    <input
                      type="url"
                      value={editAirbnbLink}
                      onChange={(e) => setEditAirbnbLink(e.target.value)}
                      placeholder="Airbnb link"
                      className="pixel-input w-full"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span>📍</span>
                    <input
                      type="url"
                      value={editMapsLink}
                      onChange={(e) => setEditMapsLink(e.target.value)}
                      placeholder="Google Maps link"
                      className="pixel-input w-full"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span>⭐</span>
                    <input
                      type="url"
                      value={editTripAdvisorLink}
                      onChange={(e) => setEditTripAdvisorLink(e.target.value)}
                      placeholder="TripAdvisor link"
                      className="pixel-input w-full"
                    />
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <label htmlFor="editNotes" className="text-sm text-[#5D4037] block mb-1">Notes</label>
                  <textarea
                    id="editNotes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Any special details..."
                    className="pixel-input w-full h-20 resize-none"
                  />
                </div>
                
                {/* Buttons - stack vertically on mobile */}
                <div className={`flex ${window.innerWidth < 640 ? 'flex-col space-y-3' : 'space-x-3'} mt-4`}>
                  <button
                    onClick={handleSaveEdit}
                    className={`pixel-button ${window.innerWidth < 640 ? 'py-3' : ''} bg-[#A5D6A7] hover:bg-[#81C784] text-[#1B5E20] ${window.innerWidth < 640 ? 'w-full' : 'flex-1'}`}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={closeModals}
                    className={`pixel-button ${window.innerWidth < 640 ? 'py-3' : ''} bg-[#FFCCBC] hover:bg-[#FFAB91] text-[#BF360C] ${window.innerWidth < 640 ? 'w-full' : 'flex-1'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal - Adapted for Mobile */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`bg-[#FFF5EE] border-2 border-[#FFDAB9] shadow-lg
                         rounded-xl w-full max-w-sm text-center p-5 animate-fade-in`}>
            <h3 className="text-xl text-[#5D4037] mb-4">
              <span className="mr-2">🗑️</span>
              Delete Item?
            </h3>
            <p className="text-[#8D6E63] mb-6">Are you sure you want to delete this bucket list item? This action cannot be undone.</p>
            
            <div className={`flex ${window.innerWidth < 640 ? 'flex-col space-y-3' : 'space-x-3'}`}>
              <button
                onClick={() => handleDelete(deleteConfirmOpen)}
                className={`pixel-button ${window.innerWidth < 640 ? 'py-3 w-full' : 'flex-1'} bg-[#FFCCBC] hover:bg-[#FFAB91] text-[#BF360C]`}
              >
                Yes, Delete It
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(null)}
                className={`pixel-button ${window.innerWidth < 640 ? 'py-3 w-full' : 'flex-1'} bg-[#C5CAE9] hover:bg-[#9FA8DA] text-[#3949AB]`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
