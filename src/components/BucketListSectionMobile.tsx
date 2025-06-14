import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "./ThemeContext";

/**
 * ADVANCED iOS BUCKET LIST COMPONENT - FIXED VERSION
 * 
 * Features:
 * - Native iOS design patterns and animations
 * - Swipe gestures for quick actions
 * - Advanced filtering and sorting
 * - Beautiful category-based design
 * - Statistics dashboard
 * - Native iOS modals and sheets
 * - Fixed spacing and layout issues
 * 
 * Compatible with your existing database schema
 */

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

// Enhanced category styles with iOS native feel
const getCategoryStyle = (category: string) => {
  const styles = {
    adventure: { 
      emoji: "🏔️", 
      color: "#FF6B35", 
      gradient: "linear-gradient(135deg, #FF6B35, #F7931E)",
      lightColor: "rgba(255, 107, 53, 0.15)",
      darkColor: "rgba(255, 107, 53, 0.8)"
    },
    travel: { 
      emoji: "✈️", 
      color: "#4A90E2", 
      gradient: "linear-gradient(135deg, #4A90E2, #7B68EE)",
      lightColor: "rgba(74, 144, 226, 0.15)",
      darkColor: "rgba(74, 144, 226, 0.8)"
    },
    food: { 
      emoji: "🍽️", 
      color: "#F5A623", 
      gradient: "linear-gradient(135deg, #F5A623, #FFD700)",
      lightColor: "rgba(245, 166, 35, 0.15)",
      darkColor: "rgba(245, 166, 35, 0.8)"
    },
    milestone: { 
      emoji: "🏆", 
      color: "#9013FE", 
      gradient: "linear-gradient(135deg, #9013FE, #E91E63)",
      lightColor: "rgba(144, 19, 254, 0.15)",
      darkColor: "rgba(144, 19, 254, 0.8)"
    },
    experience: { 
      emoji: "✨", 
      color: "#00C851", 
      gradient: "linear-gradient(135deg, #00C851, #00E676)",
      lightColor: "rgba(0, 200, 81, 0.15)",
      darkColor: "rgba(0, 200, 81, 0.8)"
    }
  };
  return styles[category as keyof typeof styles] || styles.experience;
};

export default function BucketListSectionMobile() {
  const { theme } = useTheme();
  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BucketListItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [swipedItem, setSwipedItem] = useState<Id<"bucketList"> | null>(null);

  // Form states
  const [newItem, setNewItem] = useState({
    title: "",
    category: "adventure",
    targetDate: "",
    notes: "",
    links: {
      flights: "",
      airbnb: "",
      maps: "",
      tripadvisor: "",
      website: ""
    }
  });

  // Touch handling for swipe gestures
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number; time: number } | null>(null);

  // Categories for filtering
  const categories = [
    { id: "all", label: "All", emoji: "🌟" },
    { id: "adventure", label: "Adventure", emoji: "🏔️" },
    { id: "travel", label: "Travel", emoji: "✈️" },
    { id: "food", label: "Food", emoji: "🍽️" },
    { id: "milestone", label: "Milestone", emoji: "🏆" },
    { id: "experience", label: "Experience", emoji: "✨" }
  ];

  // Statistics
  const stats = {
    total: bucketList.length,
    completed: bucketList.filter(item => item.isCompleted).length,
    pending: bucketList.filter(item => !item.isCompleted).length,
    withNotes: bucketList.filter(item => item.notes && item.notes.trim().length > 0).length
  };

  // Filtered and sorted items
  const filteredItems = bucketList
    .filter(item => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch = searchQuery === "" || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          if (!a.targetDate && !b.targetDate) return 0;
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  // Handle viewport height issues on iOS
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Reset swipe and scroll when filters change
  useEffect(() => {
    setSwipedItem(null);
    
    // Scroll to top smoothly when filters change
    const container = document.querySelector('.bucket-items-container-ios');
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Fix initial scroll position on mount and ensure proper scroll behavior
  useEffect(() => {
    // Get the main scroll container
    const scrollContainer = document.querySelector('.ios-scroll-container');
    
    // Ensure we start at the top
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    
    // Small delay to ensure DOM is ready and force scroll to top
    const resetScroll = () => {
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
        // Force a smooth scroll to top
        scrollContainer.scrollTo({
          top: 0,
          behavior: 'auto' // Use auto for immediate positioning
        });
      }
    };
    
    resetScroll();
    setTimeout(resetScroll, 50);
    setTimeout(resetScroll, 200);
    
    // Also reset on window focus (when returning to app)
    const handleFocus = () => {
      if (scrollContainer && scrollContainer.scrollTop < 50) {
        scrollContainer.scrollTop = 0;
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Enhanced scroll reset when filters change
  useEffect(() => {
    setSwipedItem(null);
    
    // Scroll to top smoothly when filters change
    const scrollContainer = document.querySelector('.ios-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Handle touch gestures for swipe actions
  const handleTouchStart = useCallback((e: React.TouchEvent, itemId: Id<"bucketList">) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent, itemId: Id<"bucketList">) => {
    if (!touchStart.current) return;
    
    touchEnd.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now()
    };

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = Math.abs(touchEnd.current.y - touchStart.current.y);
    const deltaTime = touchEnd.current.time - touchStart.current.time;

    // Swipe detection: horizontal swipe, minimal vertical movement, quick gesture
    if (Math.abs(deltaX) > 80 && deltaY < 50 && deltaTime < 300) {
      if (deltaX > 0) {
        // Swipe right - mark as complete
        const item = bucketList.find(i => i._id === itemId);
        if (item && !item.isCompleted) {
          toggleItem({ id: itemId, isCompleted: true });
          // Haptic feedback
          if ('vibrate' in navigator) navigator.vibrate(50);
        }
      } else {
        // Swipe left - show actions
        setSwipedItem(itemId);
        setTimeout(() => setSwipedItem(null), 3000); // Auto-hide after 3s
      }
    }
  }, [bucketList, toggleItem]);

  // Add new item
  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;

    try {
      const links = Object.fromEntries(
        Object.entries(newItem.links).filter(([_, value]) => value.trim() !== "")
      );

      await addItem({
        title: newItem.title,
        category: newItem.category,
        targetDate: newItem.targetDate || undefined,
        notes: newItem.notes || undefined,
        links: Object.keys(links).length > 0 ? links : undefined,
        isCompleted: false
      });

      // Reset form
      setNewItem({
        title: "",
        category: "adventure",
        targetDate: "",
        notes: "",
        links: { flights: "", airbnb: "", maps: "", tripadvisor: "", website: "" }
      });
      setShowAddModal(false);

      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: Id<"bucketList">) => {
    try {
      await removeItem({ id: itemId });
      setSwipedItem(null);
      if ('vibrate' in navigator) navigator.vibrate(200);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  // Format date display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Someday";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bucket-list-ios-container">
      {/* Header with stats */}
      <div className="bucket-header-ios">
        <div className="bucket-stats-grid-ios">
          <div className="bucket-stat-card-ios total">
            <div className="bucket-stat-number-ios">{stats.total}</div>
            <div className="bucket-stat-label-ios">Total Dreams</div>
          </div>
          <div className="bucket-stat-card-ios completed">
            <div className="bucket-stat-number-ios">{stats.completed}</div>
            <div className="bucket-stat-label-ios">Achieved</div>
          </div>
          <div className="bucket-stat-card-ios pending">
            <div className="bucket-stat-number-ios">{stats.pending}</div>
            <div className="bucket-stat-label-ios">Pending</div>
          </div>
          <div className="bucket-stat-card-ios notes">
            <div className="bucket-stat-number-ios">{stats.withNotes}</div>
            <div className="bucket-stat-label-ios">With Notes</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bucket-progress-container-ios">
          <div className="bucket-progress-label-ios">
            Progress: {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </div>
          <div className="bucket-progress-bar-ios">
            <div 
              className="bucket-progress-fill-ios"
              style={{ 
                width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div className="bucket-category-filter-ios">
        <div className="bucket-category-scroll-ios">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`bucket-category-chip-ios ${selectedCategory === category.id ? 'active' : ''}`}
            >
              <span className="bucket-category-emoji-ios">{category.emoji}</span>
              <span className="bucket-category-label-ios">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bucket-controls-ios">
        <div className="bucket-search-container-ios">
          <div className="bucket-search-icon-ios">🔍</div>
          <input
            type="text"
            placeholder="Search dreams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bucket-search-input-ios"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="bucket-search-clear-ios"
            >
              ✕
            </button>
          )}
        </div>

        <div className="bucket-control-buttons-ios">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`bucket-control-btn-ios ${showFilters ? 'active' : ''}`}
          >
            <span>⚙️</span>
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="bucket-control-btn-ios"
          >
            <span>{viewMode === 'list' ? '⊞' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Filter options */}
      {showFilters && (
        <div className="bucket-filters-panel-ios">
          <div className="bucket-filter-section-ios">
            <label className="bucket-filter-label-ios">Sort by:</label>
            <div className="bucket-filter-options-ios">
              {[
                { id: 'date', label: 'Date', emoji: '📅' },
                { id: 'title', label: 'Title', emoji: '📝' },
                { id: 'category', label: 'Category', emoji: '📂' }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id as any)}
                  className={`bucket-filter-btn-ios ${sortBy === option.id ? 'active' : ''}`}
                >
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Items list - FIXED VERSION */}
      <div className={`bucket-items-container-ios ${viewMode}`}>
        {filteredItems.length === 0 ? (
          <div className="bucket-empty-state-ios">
            <div className="bucket-empty-icon-ios">🌟</div>
            <h3 className="bucket-empty-title-ios">No Dreams Yet</h3>
            <p className="bucket-empty-text-ios">
              {searchQuery ? "No dreams match your search" : "Start building your dream list!"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bucket-empty-action-ios"
              >
                Add Your First Dream
              </button>
            )}
          </div>
        ) : (
          <>
            {filteredItems.map((item, index) => {
              const categoryStyle = getCategoryStyle(item.category);
              const isOverdue = item.targetDate && new Date(item.targetDate) < new Date() && !item.isCompleted;
              const isSwipedItem = swipedItem === item._id;

              return (
                <div
                  key={item._id}
                  className={`bucket-item-card-ios ${item.isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} ${isSwipedItem ? 'swiped' : ''}`}
                  style={{ 
                    animationDelay: `${Math.min(index * 0.05, 0.35)}s`,
                    '--category-color': categoryStyle.color,
                    '--category-gradient': categoryStyle.gradient,
                    '--category-light': categoryStyle.lightColor
                  } as React.CSSProperties}
                  onTouchStart={(e) => handleTouchStart(e, item._id)}
                  onTouchEnd={(e) => handleTouchEnd(e, item._id)}
                  onClick={() => {
                    if (!isSwipedItem) {
                      setSelectedItem(item);
                      setShowDetailModal(true);
                    }
                  }}
                >
                  {/* Swipe actions */}
                  {isSwipedItem && (
                    <div className="bucket-swipe-actions-ios">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem({ id: item._id, isCompleted: !item.isCompleted });
                          setSwipedItem(null);
                        }}
                        className="bucket-swipe-action-ios complete"
                      >
                        {item.isCompleted ? '↩️' : '✅'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item._id);
                        }}
                        className="bucket-swipe-action-ios delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}

                  {/* Card content */}
                  <div className="bucket-card-header-ios">
                    <div 
                      className="bucket-card-category-ios"
                      style={{ background: categoryStyle.lightColor }}
                    >
                      <span className="bucket-category-emoji-ios">{categoryStyle.emoji}</span>
                    </div>
                    {item.isCompleted && (
                      <div className="bucket-completed-badge-ios">✅</div>
                    )}
                  </div>

                  <div className="bucket-card-content-ios">
                    <h3 className="bucket-card-title-ios">{item.title}</h3>
                    
                    {item.notes && (
                      <p className="bucket-card-notes-ios">{item.notes}</p>
                    )}

                    <div className="bucket-card-meta-ios">
                      <div className="bucket-card-date-ios">
                        <span className="bucket-date-icon-ios">📅</span>
                        <span className="bucket-date-text-ios">{formatDate(item.targetDate)}</span>
                      </div>
                    </div>

                    {item.links && Object.values(item.links).some(link => link) && (
                      <div className="bucket-card-links-ios">
                        <span className="bucket-links-icon-ios">🔗</span>
                        <span className="bucket-links-count-ios">
                          {Object.values(item.links).filter(link => link).length} links
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bucket-card-progress-ios">
                    <div 
                      className="bucket-progress-indicator-ios"
                      style={{ background: categoryStyle.gradient }}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="bucket-add-fab-ios"
      >
        <span className="bucket-fab-icon-ios">+</span>
      </button>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="bucket-modal-overlay-ios" onClick={() => setShowAddModal(false)}>
          <div className="bucket-modal-ios add-modal" onClick={e => e.stopPropagation()}>
            <div className="bucket-modal-header-ios">
              <button
                onClick={() => setShowAddModal(false)}
                className="bucket-modal-close-ios"
              >
                ✕
              </button>
              <h2 className="bucket-modal-title-ios">Add New Dream</h2>
              <button
                onClick={handleAddItem}
                className="bucket-modal-save-ios"
                disabled={!newItem.title.trim()}
              >
                Save
              </button>
            </div>

            <div className="bucket-modal-content-ios">
              <div className="bucket-form-section-ios">
                <label className="bucket-form-label-ios">Dream Title</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What's your dream?"
                  className="bucket-form-input-ios"
                />
              </div>

              <div className="bucket-form-section-ios">
                <label className="bucket-form-label-ios">Category</label>
                <div className="bucket-category-selector-ios">
                  {categories.slice(1).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setNewItem(prev => ({ ...prev, category: category.id }))}
                      className={`bucket-category-option-ios ${newItem.category === category.id ? 'active' : ''}`}
                    >
                      <span>{category.emoji}</span>
                      <span>{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bucket-form-section-ios">
                <label className="bucket-form-label-ios">Target Date</label>
                <input
                  type="date"
                  value={newItem.targetDate}
                  onChange={(e) => setNewItem(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="bucket-form-input-ios"
                />
              </div>

              <div className="bucket-form-section-ios">
                <label className="bucket-form-label-ios">Notes</label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details..."
                  className="bucket-form-textarea-ios"
                  rows={3}
                />
              </div>

              <div className="bucket-form-section-ios">
                <label className="bucket-form-label-ios">Helpful Links</label>
                <div className="bucket-links-inputs-ios">
                  {Object.entries(newItem.links).map(([key, value]) => (
                    <input
                      key={key}
                      type="url"
                      value={value}
                      onChange={(e) => setNewItem(prev => ({
                        ...prev,
                        links: { ...prev.links, [key]: e.target.value }
                      }))}
                      placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} URL`}
                      className="bucket-form-input-ios small"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="bucket-modal-overlay-ios" onClick={() => setShowDetailModal(false)}>
          <div className="bucket-modal-ios detail-modal" onClick={e => e.stopPropagation()}>
            <div className="bucket-modal-header-ios">
              <button
                onClick={() => setShowDetailModal(false)}
                className="bucket-modal-close-ios"
              >
                ✕
              </button>
              <h2 className="bucket-modal-title-ios">Dream Details</h2>
              <button
                onClick={() => {
                  toggleItem({ id: selectedItem._id, isCompleted: !selectedItem.isCompleted });
                  setShowDetailModal(false);
                }}
                className={`bucket-modal-action-ios ${selectedItem.isCompleted ? 'uncomplete' : 'complete'}`}
              >
                {selectedItem.isCompleted ? 'Undo' : 'Done'}
              </button>
            </div>

            <div className="bucket-modal-content-ios">
              <div className="bucket-detail-header-ios">
                <div className="bucket-detail-category-ios">
                  <span>{getCategoryStyle(selectedItem.category).emoji}</span>
                  <span>{selectedItem.category}</span>
                </div>
              </div>

              <h1 className="bucket-detail-title-ios">{selectedItem.title}</h1>

              {selectedItem.notes && (
                <div className="bucket-detail-section-ios">
                  <h3 className="bucket-detail-section-title-ios">Notes</h3>
                  <p className="bucket-detail-notes-ios">{selectedItem.notes}</p>
                </div>
              )}

              <div className="bucket-detail-info-ios">
                <div className="bucket-detail-info-item-ios">
                  <span className="bucket-detail-info-label-ios">Target Date</span>
                  <span className="bucket-detail-info-value-ios">{formatDate(selectedItem.targetDate)}</span>
                </div>

                <div className="bucket-detail-info-item-ios">
                  <span className="bucket-detail-info-label-ios">Category</span>
                  <span className="bucket-detail-info-value-ios">{selectedItem.category}</span>
                </div>

                {selectedItem.isCompleted && (
                  <div className="bucket-detail-info-item-ios">
                    <span className="bucket-detail-info-label-ios">Status</span>
                    <span className="bucket-detail-info-value-ios">✅ Completed</span>
                  </div>
                )}
              </div>

              {selectedItem.links && Object.values(selectedItem.links).some(link => link) && (
                <div className="bucket-detail-section-ios">
                  <h3 className="bucket-detail-section-title-ios">Links</h3>
                  <div className="bucket-detail-links-ios">
                    {Object.entries(selectedItem.links).map(([key, url]) => {
                      if (!url) return null;
                      const linkEmojis: {[key: string]: string} = {
                        flights: '✈️',
                        airbnb: '🏠',
                        maps: '📍',
                        tripadvisor: '⭐',
                        website: '🌐'
                      };

                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bucket-detail-link-ios"
                        >
                          <span>{linkEmojis[key] || '🔗'}</span>
                          <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}