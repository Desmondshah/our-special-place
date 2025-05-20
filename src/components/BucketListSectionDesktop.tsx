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
  // References for keyboard navigation and outside click handling
  const modalRef = useRef<HTMLDivElement>(null);
  const addFormRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Data queries and mutations
  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  // State for filtering and sorting
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // State for form visibility
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"full" | "compact">("compact");

  // State for new item
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("adventure");
  const [targetDate, setTargetDate] = useState("");
  const [flightLink, setFlightLink] = useState("");
  const [airbnbLink, setAirbnbLink] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [tripAdvisorLink, setTripAdvisorLink] = useState("");
  const [notes, setNotes] = useState("");

  // State for editing and deleting
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

  // State for hover effects and focus management
  const [hoveredItem, setHoveredItem] = useState<Id<"bucketList"> | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Set keyboard user flag for focus styles
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
      
      // Escape key to close modals
      if (e.key === 'Escape') {
        closeModals();
      }
      
      // Add new item with Alt+N
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        setShowForm(true);
        setTimeout(() => {
          firstInputRef.current?.focus();
        }, 100);
      }
      
      // Toggle between grid and list view with Alt+V
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        setViewMode(viewMode === 'grid' ? 'list' : 'grid');
      }
    };
    
    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Close modals when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModals();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle body scroll lock
  useEffect(() => {
    if (isEditModalOpen || deleteConfirmOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isEditModalOpen, deleteConfirmOpen]);

  // Calculation for stats
  const totalItems = bucketList.length;
  const completedItems = bucketList.filter(item => item.isCompleted).length;
  const pendingItems = totalItems - completedItems;
  const completionPercentage = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;
  
  // Category counts and stats
  const categoryCounts = bucketList.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count items with target dates
  const itemsWithDates = bucketList.filter(item => item.targetDate).length;
  const itemsWithLinks = bucketList.filter(item => 
    item.links?.flights || item.links?.airbnb || item.links?.maps || item.links?.tripadvisor
  ).length;
  
  // Advanced calculated stats for desktop analytics section
  const nearestUpcoming = bucketList
    .filter(item => !item.isCompleted && item.targetDate)
    .sort((a, b) => {
      if (!a.targetDate || !b.targetDate) return 0;
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    })[0];
    
  // Default to grid view but allow toggle
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter the list based on current filters
  const filteredList = bucketList.filter((item: BucketListItem) => {
    // Status filter
    if (filter === "completed" && !item.isCompleted) return false;
    if (filter === "pending" && item.isCompleted) return false;
    
    // Category filter
    if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
    
    return true;
  });
  
  // Sort the filtered list based on current sort settings
  const sortedList = [...filteredList].sort((a, b) => {
    const direction = sortOrder === "asc" ? 1 : -1;
    
    switch(sortBy) {
      case "date":
        // Handle cases where one or both items don't have dates
        if (!a.targetDate && !b.targetDate) return 0;
        if (!a.targetDate) return direction;
        if (!b.targetDate) return -direction;
        return direction * (new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
        
      case "title":
        return direction * a.title.localeCompare(b.title);
        
      case "category":
        return direction * a.category.localeCompare(b.category);
        
      default:
        return 0;
    }
  });

  const closeModals = () => {
    setIsEditModalOpen(false);
    setDeleteConfirmOpen(null);
    setEditingItem(null);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };
  
  const handleSortChange = (newSortBy: "date" | "title" | "category") => {
    if (sortBy === newSortBy) {
      toggleSortOrder();
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
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
      resetForm();
      
      // Show success toast
      showToast("Item added successfully! ✅");
    } catch (error) {
      console.error("Failed to add item:", error);
      alert("Failed to add item. Please try again.");
    }
  };
  
  // Toast notification system
  const [toast, setToast] = useState<{message: string, visible: boolean}>({
    message: "",
    visible: false
  });
  
  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const resetForm = () => {
    setTitle("");
    setCategory("adventure");
    setTargetDate("");
    setFlightLink("");
    setAirbnbLink("");
    setMapsLink("");
    setTripAdvisorLink("");
    setNotes("");
  };

  const startEditing = (item: BucketListItem) => {
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
    
    // Focus the first input after modal opens
    setTimeout(() => {
      const titleInput = document.getElementById("editTitle");
      if (titleInput) {
        (titleInput as HTMLInputElement).focus();
      }
    }, 100);
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
      
      // Show success toast
      showToast("Item updated successfully! 🔄");
    } catch (error) {
      console.error("Failed to update item:", error);
      alert("Failed to update item. Please try again.");
    }
  };

  const confirmDelete = (id: Id<"bucketList">) => {
    setDeleteConfirmOpen(id);
  };

  const handleDelete = async (id: Id<"bucketList">) => {
    try {
      await removeItem({ id });
      closeModals();
      showToast("Item deleted successfully! 🗑️");
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item. Please try again.");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, itemId: Id<"bucketList">) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = bucketList.find(i => i._id === itemId);
      if (item) {
        startEditing(item);
      }
    }
  };

  // Format date for display
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Check if date is coming soon (within 30 days)
  const isDateSoon = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const timeDiff = date.getTime() - today.getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    return dayDiff >= 0 && dayDiff <= 30;
  };
  
  const isDatePast = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return date < today;
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
  
  // Get category hover color for enhanced interactivity
  const getCategoryHoverColorClass = (category: string) => {
    switch (category) {
      case "adventure": return "hover:bg-[#FF9494]";
      case "travel": return "hover:bg-[#94CAFF]";
      case "food": return "hover:bg-[#FFCD8C]";
      case "milestone": return "hover:bg-[#B394FF]";
      default: return "hover:bg-[#94FFB8]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Desktop Analytics Panel */}
      <div className="bg-[#FFF5EE] rounded-xl border-2 border-[#FFDAB9] shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          {/* Left column: Stats */}
          <div className="flex flex-col justify-between">
            <h2 className="text-2xl font-bold text-[#FF6B6B] mb-2">Our Bucket List <span className="heart-icon">❤️</span></h2>
            
            {/* Progress information */}
            <div className="space-y-3">
              {/* Circular progress indicator */}
              <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#FFF1E6"
                      strokeWidth="10"
                    />
                    {/* Progress circle with stroke-dasharray animation */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#FFB6B6"
                      strokeWidth="10"
                      strokeDasharray={`${completionPercentage * 2.83} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                      className="transition-all duration-1000"
                    />
                    {/* Percentage text */}
                    <text x="50" y="55" textAnchor="middle" fontSize="20" fill="#5D4037" fontWeight="bold">
                      {completionPercentage}%
                    </text>
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-[#5D4037]">
                  <span className="font-bold text-lg">{completedItems}</span> of <span className="font-bold text-lg">{totalItems}</span> items completed
                </p>
                <p className="text-[#8D6E63] text-sm mt-1">
                  {pendingItems} {pendingItems === 1 ? 'item' : 'items'} pending
                </p>
              </div>
            </div>
            
            {/* Add Item Button - Desktop */}
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (!showForm) {
                  setTimeout(() => firstInputRef.current?.focus(), 100);
                }
              }}
              className="fancy-button mt-3 group transition-all"
              title={showForm ? "Hide Form (Alt+N)" : "Add New Item (Alt+N)"}
            >
              <span className="button-icon transform group-hover:scale-110 transition-transform">
                {showForm ? "📝" : "➕"}
              </span>
              {showForm ? "Hide Form" : "Add New Dream"}
            </button>
          </div>
          
          {/* Middle column: Categories */}
          <div className="bg-white bg-opacity-40 rounded-lg p-3">
            <h3 className="section-title text-sm font-bold mb-3">Categories</h3>
            <div className="space-y-2">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div 
                  key={cat}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all
                              ${categoryFilter === cat ? 'bg-opacity-100' : 'bg-opacity-70'}
                              ${getCategoryColorClass(cat)} ${getCategoryHoverColorClass(cat)}
                              ${hoveredCategory === cat ? 'transform -translate-y-1 shadow-md' : ''}`}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCategoryFilter(categoryFilter === cat ? "all" : cat);
                    }
                  }}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getCategoryEmoji(cat)}</span>
                    <span className="font-medium capitalize">{cat}</span>
                  </div>
                  <div className="bg-white text-[#5D4037] text-xs rounded-full px-2 py-1">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right column: Insights */}
          <div className="bg-white bg-opacity-40 rounded-lg p-3">
            <h3 className="section-title text-sm font-bold mb-3">Quick Insights</h3>
            <div className="space-y-3">
              {nearestUpcoming && (
                <div className="bg-[#E3F2FD] rounded-lg p-2 border border-[#BBDEFB]">
                  <div className="text-xs font-medium text-[#1976D2]">Next Upcoming</div>
                  <div className="text-sm font-bold text-[#0D47A1] truncate">{nearestUpcoming.title}</div>
                  <div className="text-xs text-[#1565C0]">
                    {formatDateForDisplay(nearestUpcoming.targetDate)}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#E8F5E9] rounded-lg p-2 text-center border border-[#C8E6C9]">
                  <div className="text-lg font-bold text-[#2E7D32]">{itemsWithDates}</div>
                  <div className="text-xs text-[#388E3C]">With Date</div>
                </div>
                <div className="bg-[#FFF3E0] rounded-lg p-2 text-center border border-[#FFE0B2]">
                  <div className="text-lg font-bold text-[#F57C00]">{itemsWithLinks}</div>
                  <div className="text-xs text-[#EF6C00]">With Links</div>
                </div>
              </div>
              
              {/* View toggle */}
              <div className="flex justify-center mt-2">
                <div className="bg-[#FFF1E6] border-2 border-[#FFDAB9] rounded-full p-1 flex">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-full px-3 py-1 text-sm transition-all ${
                      viewMode === 'grid'
                        ? 'bg-[#FFB6B6] text-white'
                        : 'text-[#5D4037] hover:bg-[#FFE0B2]'
                    }`}
                    title="Grid View (Alt+V)"
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-full px-3 py-1 text-sm transition-all ${
                      viewMode === 'list'
                        ? 'bg-[#FFB6B6] text-white'
                        : 'text-[#5D4037] hover:bg-[#FFE0B2]'
                    }`}
                    title="List View (Alt+V)"
                  >
                    List
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Control Panel with advanced filtering and sorting */}
      <div className="flex flex-wrap gap-3 justify-between items-center p-4 bg-[#FFF1E6] rounded-xl border-2 border-[#FFDAB9] shadow-md">
        {/* Left: Status filter */}
        <div className="tab-filter">
          <button
            onClick={() => setFilter("all")}
            className={`tab-filter-button ${filter === "all" ? "tab-filter-button-active" : ""} ${isKeyboardUser ? 'focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none' : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`tab-filter-button ${filter === "pending" ? "tab-filter-button-active" : ""} ${isKeyboardUser ? 'focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none' : ''}`}
          >
            Pending ({pendingItems})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`tab-filter-button ${filter === "completed" ? "tab-filter-button-active" : ""} ${isKeyboardUser ? 'focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none' : ''}`}
          >
            Completed ({completedItems})
          </button>
        </div>
        
        {/* Right: Sorting controls */}
        <div className="flex items-center space-x-2">
          <span className="text-[#5D4037] text-sm">Sort by:</span>
          <div className="tab-filter">
            <button
              onClick={() => handleSortChange("date")}
              className={`tab-filter-button ${sortBy === "date" ? "tab-filter-button-active" : ""} ${isKeyboardUser ? 'focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none' : ''}`}
              title={`Date (${sortOrder === 'asc' ? 'Oldest first' : 'Newest first'})`}
            >
              Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              onClick={() => handleSortChange("title")}
              className={`tab-filter-button ${sortBy === "title" ? "tab-filter-button-active" : ""} ${isKeyboardUser ? 'focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none' : ''}`}
              title={`Title (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`}
            >
              Title {sortBy === "title" && (sortOrder === "asc" ? "A→Z" : "Z→A")}
            </button>
            <button
              onClick={() => handleSortChange("category")}
              className={`tab-filter-button ${sortBy === "category" ? "tab-filter-button-active" : ""} ${isKeyboardUser ? 'focus:ring-2 focus:ring-[#FF6B6B] focus:outline-none' : ''}`}
              title={`Category (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`}
            >
              Category {sortBy === "category" && (sortOrder === "asc" ? "A→Z" : "Z→A")}
            </button>
          </div>
        </div>
      </div>
      
      {/* Add Item Form - Collapsible with keyboard support */}
      <div className={`collapsible ${showForm ? "open" : ""}`}>
        <form 
          ref={addFormRef}
          onSubmit={handleAddItem} 
          className="space-y-4 bg-[#FFF5EE] rounded-xl border-2 border-[#FFDAB9] p-4 shadow-md transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title text-lg">Add New Bucket List Item</h3>
            
            {/* Toggle form mode button */}
            <button
              type="button"
              onClick={() => setFormMode(formMode === "compact" ? "full" : "compact")}
              className="pixel-button text-xs px-3 py-1 flex items-center gap-1"
            >
              {formMode === "compact" ? "Show All Fields" : "Compact Mode"}
              <span>{formMode === "compact" ? "▼" : "▲"}</span>
            </button>
          </div>
          
          {/* Main info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                ref={firstInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your bucket list?"
                className={`pixel-input w-full transition-all ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                required
              />
            </div>
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`pixel-input w-full transition-all ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
              >
                <option value="adventure">Adventure 🎯</option>
                <option value="travel">Travel ✈️</option>
                <option value="food">Food 🍽️</option>
                <option value="milestone">Milestone 🎉</option>
                <option value="other">Other ✨</option>
              </select>
            </div>
          </div>
          
          {/* Date input with calendar enhancement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="flex items-center mb-1">
                <span className="text-[#5D4037] mr-2">📅</span>
                <label htmlFor="targetDate" className="text-[#5D4037] text-sm">Target Date</label>
              </div>
              <input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={`pixel-input w-full transition-all ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
              />
            </div>
            
            {/* Extended fields - only shown in full mode */}
            {formMode === "full" && (
              <>
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-[#5D4037] mr-2">✈️</span>
                    <label htmlFor="flightLink" className="text-[#5D4037] text-sm">Flight Link</label>
                  </div>
                  <input
                    id="flightLink"
                    type="url"
                    value={flightLink}
                    onChange={(e) => setFlightLink(e.target.value)}
                    placeholder="https://..."
                    className={`pixel-input w-full transition-all ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                  />
                </div>
                
                <div>
                  <div className="flex items-center mb-1">
                    <span className="text-[#5D4037] mr-2">🏠</span>
                    <label htmlFor="airbnbLink" className="text-[#5D4037] text-sm">Accommodation Link</label>
                  </div>
                  <input
                    id="airbnbLink"
                    type="url"
                    value={airbnbLink}
                    onChange={(e) => setAirbnbLink(e.target.value)}
                    placeholder="https://..."
                    className={`pixel-input w-full transition-all ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Second row of extended fields - only shown in full mode */}
          {formMode === "full" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center mb-1">
                  <span className="text-[#5D4037] mr-2">📍</span>
                  <label htmlFor="mapsLink" className="text-[#5D4037] text-sm">Maps Link</label>
                </div>
                <input
                  id="mapsLink"
                  type="url"
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  placeholder="https://..."
                  className={`pixel-input w-full transition-all ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                />
              </div>
              
              <div>
                <div className="flex items-center mb-1">
                  <span className="text-[#5D4037] mr-2">⭐</span>
                  <label htmlFor="tripAdvisorLink" className="text-[#5D4037] text-sm">Review/Info Link</label>
                </div>
                <input
                  id="tripAdvisorLink"
                  type="url"
                  value={tripAdvisorLink}
                  onChange={(e) => setTripAdvisorLink(e.target.value)}
                  placeholder="https://..."
                  className={`pixel-input w-full transition-all ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                />
              </div>
            </div>
          )}
          
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
              className={`pixel-input w-full h-20 resize-none transition-all ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
            />
          </div>
          
          <div className="flex justify-between">
            <button
              type="submit"
              className="pixel-button px-8 transition-all hover:bg-[#FFB6B6] hover:transform hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="button-icon">✨</span> Add to Bucket List
            </button>
            
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="pixel-button bg-[#F5F5F5] hover:bg-[#E0E0E0] transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      
      {/* Empty state with enhanced animations */}
      {sortedList.length === 0 && (
        <div className="empty-state animate-fade-in">
          <div className="empty-state-icon animate-bounce">🎯</div>
          <h3 className="empty-state-title">No items found</h3>
          <p className="empty-state-desc">
            {bucketList.length === 0 
              ? "Add your first bucket list item to get started!" 
              : "Try changing your filters to see more items."}
          </p>
          {bucketList.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="pixel-button"
                >
                  Show All Statuses
                </button>
              )}
              {categoryFilter !== "all" && (
                <button
                  onClick={() => setCategoryFilter("all")}
                  className="pixel-button"
                >
                  Show All Categories
                </button>
              )}
              <button
                onClick={() => {
                  setFilter("all");
                  setCategoryFilter("all");
                }}
                className="pixel-button"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bucket List - Grid View or List View based on preference */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedList.map((item: BucketListItem) => (
            <div 
              key={item._id} 
              className={`relative rounded-xl p-4 border-2 border-[#FFDAB9] shadow-md transition-all duration-300
                        ${item.isCompleted ? "bg-[#F5F5F5] opacity-80" : "bg-[#FFF5EE]"}
                        ${hoveredItem === item._id ? "transform -translate-y-2 shadow-xl" : ""}
                        ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6] focus:outline-none' : ''}`}
              onMouseEnter={() => setHoveredItem(item._id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => startEditing(item)}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, item._id)}
              aria-label={`${item.title} - ${item.category} - ${formatDateForDisplay(item.targetDate)}`}
            >
              {/* Top bar with category badge and completion checkbox */}
              <div className="flex justify-between items-start mb-3">
                <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getCategoryColorClass(item.category)} shadow-sm`}>
                  {getCategoryEmoji(item.category)} {item.category}
                </div>
                
                <div 
                  className="flex items-center" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem({ id: item._id, isCompleted: !item.isCompleted });
                  }}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isCompleted}
                      onChange={() => {}}
                      className="styled-checkbox"
                    />
                    <span className="ml-1 text-sm">{item.isCompleted ? "Done!" : "Pending"}</span>
                  </label>
                </div>
              </div>
              
              {/* Title and date with enhanced styling */}
              <div className="mb-3">
                <h3 className={`text-xl font-bold text-[#5D4037] ${item.isCompleted ? "line-through opacity-70" : ""}`}>
                  {item.title}
                </h3>
                <p className={`text-sm mt-1 ${
                  isDateSoon(item.targetDate) 
                    ? "text-[#D32F2F] font-medium" 
                    : isDatePast(item.targetDate)
                      ? "text-[#9E9E9E]"
                      : "text-[#8D6E63]"
                }`}>
                  <span className="inline-block mr-1">📅</span>
                  {formatDateForDisplay(item.targetDate)}
                  {isDateSoon(item.targetDate) && !item.isCompleted && !isDatePast(item.targetDate) && (
                    <span className="ml-2 text-xs bg-[#FFEBEE] text-[#D32F2F] px-1 py-0.5 rounded-sm border border-[#FFCDD2]">
                      Soon!
                    </span>
                  )}
                  {isDatePast(item.targetDate) && !item.isCompleted && (
                    <span className="ml-2 text-xs bg-[#EEEEEE] text-[#757575] px-1 py-0.5 rounded-sm border border-[#E0E0E0]">
                      Past due
                    </span>
                  )}
                </p>
              </div>
              
              {/* Notes if any */}
              {item.notes && (
                <div className="mb-3 bg-white bg-opacity-50 p-2 rounded-lg border border-[#FFDAB9]">
                  <p className="text-sm text-[#5D4037] italic line-clamp-3">
                    <span className="inline-block mr-1">💭</span>
                    {item.notes}
                  </p>
                </div>
              )}
              
              {/* Links as cute buttons with tooltips */}
              <div className="flex flex-wrap gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                {item.links?.flights && (
                  <a
                    href={item.links.flights}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative pixel-button text-xs px-2 py-1 bg-[#FFE0B2] hover:bg-[#FFDAB9]"
                    title="View Flight Information"
                  >
                    <span>✈️</span>
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      View Flights
                    </span>
                  </a>
                )}
                {item.links?.airbnb && (
                  <a
                    href={item.links.airbnb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative pixel-button text-xs px-2 py-1 bg-[#FFE0B2] hover:bg-[#FFDAB9]"
                    title="View Accommodation"
                  >
                    <span>🏠</span>
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      View Accommodation
                    </span>
                  </a>
                )}
                {item.links?.maps && (
                  <a
                    href={item.links.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative pixel-button text-xs px-2 py-1 bg-[#FFE0B2] hover:bg-[#FFDAB9]"
                    title="View on Map"
                  >
                    <span>📍</span>
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      View on Map
                    </span>
                  </a>
                )}
                {item.links?.tripadvisor && (
                  <a
                    href={item.links.tripadvisor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative pixel-button text-xs px-2 py-1 bg-[#FFE0B2] hover:bg-[#FFDAB9]"
                    title="View Reviews"
                  >
                    <span>⭐</span>
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      View Reviews
                    </span>
                  </a>
                )}
              </div>
              
              {/* Quick actions - only visible on hover */}
              <div 
                className={`absolute right-2 top-12 flex flex-col gap-2 transition-opacity ${
                  hoveredItem === item._id ? "opacity-100" : "opacity-0"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(item);
                  }}
                  className="pixel-button text-xs w-8 h-8 flex items-center justify-center bg-[#B6DCFF] hover:bg-[#91C9FF]"
                  title="Edit Item"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(item._id);
                  }}
                  className="pixel-button text-xs w-8 h-8 flex items-center justify-center bg-[#FFCCBC] hover:bg-[#FFAB91]"
                  title="Delete Item"
                >
                  🗑️
                </button>
              </div>
              
              {/* Completed badge with enhanced animation */}
              {item.isCompleted && (
                <div className="absolute -rotate-12 top-3 right-3 bg-[#A5D6A7] px-3 py-1 rounded-lg border-2 border-[#81C784] text-[#1B5E20] text-sm font-bold shadow-md animate-pulse">
                  Completed! 🎉
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          <div className="bg-[#FFF5EE] rounded-xl border-2 border-[#FFDAB9] overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#FFDAB9] text-[#5D4037]">
                <tr>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedList.map((item: BucketListItem) => (
                  <tr 
                    key={item._id}
                    className={`border-b border-[#FFDAB9] last:border-none hover:bg-[#FFF1E6] transition-colors
                              ${item.isCompleted ? "bg-[#F5F5F5] bg-opacity-50" : ""}`}
                    onMouseEnter={() => setHoveredItem(item._id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <td className="px-4 py-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => toggleItem({ id: item._id, isCompleted: !item.isCompleted })}
                          className="styled-checkbox"
                        />
                      </label>
                    </td>
                    <td 
                      className={`px-4 py-3 ${item.isCompleted ? "line-through opacity-70" : ""} font-medium cursor-pointer`}
                      onClick={() => startEditing(item)}
                    >
                      {item.title}
                      {item.notes && (
                        <div className="text-xs text-[#8D6E63] truncate max-w-xs">
                          <span className="mr-1">💭</span>
                          {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColorClass(item.category)}`}>
                        {getCategoryEmoji(item.category)} {item.category}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm ${
                      isDateSoon(item.targetDate) && !item.isCompleted
                        ? "text-[#D32F2F] font-medium" 
                        : isDatePast(item.targetDate) && !item.isCompleted
                          ? "text-[#9E9E9E]"
                          : "text-[#8D6E63]"
                    }`}>
                      {formatDateForDisplay(item.targetDate)}
                      {isDateSoon(item.targetDate) && !item.isCompleted && !isDatePast(item.targetDate) && (
                        <span className="ml-2 text-xs bg-[#FFEBEE] text-[#D32F2F] px-1 py-0.5 rounded-sm">
                          Soon!
                        </span>
                      )}
                      {isDatePast(item.targetDate) && !item.isCompleted && (
                        <span className="ml-2 text-xs bg-[#EEEEEE] text-[#757575] px-1 py-0.5 rounded-sm">
                          Past due
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {item.links?.flights && (
                          <a
                            href={item.links.flights}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pixel-button text-xs px-1.5 py-0.5"
                            title="View Flight Information"
                          >
                            ✈️
                          </a>
                        )}
                        {item.links?.airbnb && (
                          <a
                            href={item.links.airbnb}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pixel-button text-xs px-1.5 py-0.5"
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
                            className="pixel-button text-xs px-1.5 py-0.5"
                            title="View on Map"
                          >
                            📍
                          </a>
                        )}
                        {item.links?.tripadvisor && (
                          <a
                            href={item.links.tripadvisor}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pixel-button text-xs px-1.5 py-0.5"
                            title="View Reviews"
                          >
                            ⭐
                          </a>
                        )}
                        <button
                          onClick={() => startEditing(item)}
                          className="pixel-button text-xs px-1.5 py-0.5 bg-[#B6DCFF]"
                          title="Edit Item"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => confirmDelete(item._id)}
                          className="pixel-button text-xs px-1.5 py-0.5 bg-[#FFCCBC]"
                          title="Delete Item"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Edit Modal - Centered with enhanced UI */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="bg-[#FFF5EE] border-2 border-[#FFDAB9] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in shadow-2xl"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl text-[#5D4037] font-bold">
                  <span className="mr-2">✏️</span>
                  Edit Bucket List Item
                </h3>
                <button
                  onClick={closeModals}
                  className="text-[#8D6E63] text-xl hover:text-[#5D4037] transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Title and category */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-3">
                    <label htmlFor="editTitle" className="text-sm text-[#5D4037] font-medium block mb-1">Title</label>
                    <input
                      id="editTitle"
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={`pixel-input w-full ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                      placeholder="Title"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="editCategory" className="text-sm text-[#5D4037] font-medium block mb-1">Category</label>
                    <select
                      id="editCategory"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className={`pixel-input w-full ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
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
                  <label htmlFor="editTargetDate" className="text-sm text-[#5D4037] font-medium block mb-1">Target Date</label>
                  <input
                    id="editTargetDate"
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className={`pixel-input w-full ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                  />
                </div>
                
                {/* Links - in a nice grid */}
                <div>
                  <h4 className="text-sm text-[#5D4037] font-medium mb-2">Helpful Links</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-lg mr-1">✈️</span>
                        <label htmlFor="editFlightLink" className="text-xs text-[#8D6E63]">Flight Link</label>
                      </div>
                      <input
                        id="editFlightLink"
                        type="url"
                        value={editFlightLink}
                        onChange={(e) => setEditFlightLink(e.target.value)}
                        placeholder="https://..."
                        className={`pixel-input w-full text-sm ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-lg mr-1">🏠</span>
                        <label htmlFor="editAirbnbLink" className="text-xs text-[#8D6E63]">Accommodation Link</label>
                      </div>
                      <input
                        id="editAirbnbLink"
                        type="url"
                        value={editAirbnbLink}
                        onChange={(e) => setEditAirbnbLink(e.target.value)}
                        placeholder="https://..."
                        className={`pixel-input w-full text-sm ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-lg mr-1">📍</span>
                        <label htmlFor="editMapsLink" className="text-xs text-[#8D6E63]">Maps Link</label>
                      </div>
                      <input
                        id="editMapsLink"
                        type="url"
                        value={editMapsLink}
                        onChange={(e) => setEditMapsLink(e.target.value)}
                        placeholder="https://..."
                        className={`pixel-input w-full text-sm ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-lg mr-1">⭐</span>
                        <label htmlFor="editTripAdvisorLink" className="text-xs text-[#8D6E63]">Review/Info Link</label>
                      </div>
                      <input
                        id="editTripAdvisorLink"
                        type="url"
                        value={editTripAdvisorLink}
                        onChange={(e) => setEditTripAdvisorLink(e.target.value)}
                        placeholder="https://..."
                        className={`pixel-input w-full text-sm ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <label htmlFor="editNotes" className="text-sm text-[#5D4037] font-medium block mb-1">Notes</label>
                  <textarea
                    id="editNotes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Any special details..."
                    className={`pixel-input w-full h-28 resize-none ${isKeyboardUser ? 'focus:ring-4 focus:ring-[#FFB6B6]' : ''}`}
                  />
                </div>
                
                {/* Completion toggle */}
                <div className="flex items-center space-x-2 my-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.isCompleted}
                      onChange={() => toggleItem({ id: editingItem._id, isCompleted: !editingItem.isCompleted })}
                      className="styled-checkbox"
                    />
                    <span className="ml-2 text-[#5D4037]">
                      Mark as {editingItem.isCompleted ? "pending" : "completed"}
                    </span>
                  </label>
                </div>
                
                {/* Buttons with enhanced styling */}
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="pixel-button flex-1 bg-[#A5D6A7] hover:bg-[#81C784] text-[#1B5E20] transition-all hover:transform hover:-translate-y-1"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={closeModals}
                    className="pixel-button flex-1 bg-[#FFCCBC] hover:bg-[#FFAB91] text-[#BF360C] transition-all hover:transform hover:-translate-y-1"
                  >
                    Cancel
                  </button>
                </div>
                
                {/* Delete option at bottom */}
                <div className="border-t border-[#FFDAB9] pt-4 mt-2">
                  <button
                    onClick={() => {
                      closeModals();
                      confirmDelete(editingItem._id);
                    }}
                    className="text-[#D32F2F] text-sm hover:text-[#B71C1C] transition-colors flex items-center"
                  >
                    <span className="mr-1">🗑️</span> Delete this item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal - Enhanced with animations */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFF5EE] border-2 border-[#FFDAB9] rounded-xl max-w-sm w-full text-center p-6 animate-fade-in shadow-2xl">
            <div className="text-5xl mb-4 animate-bounce">🗑️</div>
            <h3 className="text-xl text-[#5D4037] mb-2 font-bold">
              Delete Item?
            </h3>
            <p className="text-[#8D6E63] mb-6">Are you sure you want to delete this bucket list item? This action cannot be undone.</p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(deleteConfirmOpen)}
                className="pixel-button flex-1 bg-[#FFCCBC] hover:bg-[#FFAB91] text-[#BF360C] transition-all hover:transform hover:-translate-y-1"
              >
                Yes, Delete It
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(null)}
                className="pixel-button flex-1 bg-[#C5CAE9] hover:bg-[#9FA8DA] text-[#3949AB] transition-all hover:transform hover:-translate-y-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast notification system */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 bg-[#5D4037] text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in z-50">
          {toast.message}
        </div>
      )}
      
      {/* Keyboard shortcuts helper - shown only for keyboard users */}
      {isKeyboardUser && (
        <div className="fixed bottom-4 left-4 bg-[#FFF5EE] border border-[#FFDAB9] rounded-lg shadow-lg p-3 text-xs text-[#5D4037] max-w-xs animate-fade-in z-40">
          <div className="font-bold mb-1">Keyboard Shortcuts:</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Alt + N</div>
            <div>Add new item</div>
            <div>Alt + V</div>
            <div>Toggle view mode</div>
            <div>Esc</div>
            <div>Close dialogs</div>
            <div>Tab</div>
            <div>Navigate elements</div>
            <div>Enter</div>
            <div>Select/activate</div>
          </div>
        </div>
      )}
    </div>
  );
}
