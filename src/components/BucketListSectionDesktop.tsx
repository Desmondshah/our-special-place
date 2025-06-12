import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface BucketListItem {
  _id: Id<"bucketList">;
  title: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  links?: { flights?: string; airbnb?: string; maps?: string; tripadvisor?: string; website?: string; };
  notes?: string;
}

// Helper to get category specific styles (emoji, class for color/icon)
const getCategoryStyle = (category: string): { emoji: string, className: string, iconName?: string } => {
  switch (category) {
    case "adventure": return { emoji: "🏞️", className: "category-adventure", iconName: "mountain" };
    case "travel": return { emoji: "✈️", className: "category-travel", iconName: "airplane" };
    case "food": return { emoji: "🍕", className: "category-food", iconName: "pizza" };
    case "milestone": return { emoji: "🏆", className: "category-milestone", iconName: "trophy" };
    default: return { emoji: "💖", className: "category-other", iconName: "sparkle-heart" };
  }
};

export default function BucketListSectionDesktop() {
  const firstInputRef = useRef<HTMLInputElement>(null);

  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [showAddItemParchment, setShowAddItemParchment] = useState(false);
  
  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("adventure");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newFlightLink, setNewFlightLink] = useState("");
  const [newAirbnbLink, setNewAirbnbLink] = useState("");
  const [newMapsLink, setNewMapsLink] = useState("");
  const [newTripAdvisorLink, setNewTripAdvisorLink] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Edit/View Modal ("Quest Detail Scroll") state
  const [viewingItem, setViewingItem] = useState<BucketListItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  // Edit form state (inside modal)
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editFlightLink, setEditFlightLink] = useState("");
  const [editAirbnbLink, setEditAirbnbLink] = useState("");
  const [editMapsLink, setEditMapsLink] = useState("");
  const [editTripAdvisorLink, setEditTripAdvisorLink] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<BucketListItem | null>(null);
  const [toast, setToast] = useState<{message: string, visible: boolean, type: 'success' | 'error'}>({ message: "", visible: false, type: 'success' });

  // Derived state for display
  const totalItems = bucketList.length;
  const completedItemsCount = bucketList.filter(item => item.isCompleted).length;
  const completionPercentage = totalItems ? Math.round((completedItemsCount / totalItems) * 100) : 0;
  const uniqueCategories = Array.from(new Set(bucketList.map(item => item.category)));

  const filteredAndSortedList = bucketList
    .filter(item => {
      if (filterStatus === "completed" && !item.isCompleted) return false;
      if (filterStatus === "pending" && item.isCompleted) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "date":
          const dateA = a.targetDate ? new Date(a.targetDate + 'T00:00:00').getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
          const dateB = b.targetDate ? new Date(b.targetDate + 'T00:00:00').getTime() : (sortOrder === 'asc' ? Infinity : -Infinity);
          return (dateA - dateB) * direction;
        case "title": return a.title.localeCompare(b.title) * direction;
        case "category": return a.category.localeCompare(b.category) * direction;
        default: return 0;
      }
    });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const resetNewItemForm = () => {
    setNewTitle(""); setNewCategory("adventure"); setNewTargetDate("");
    setNewFlightLink(""); setNewAirbnbLink(""); setNewMapsLink(""); setNewTripAdvisorLink(""); setNewNotes("");
    setShowAddItemParchment(false);
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) { showToast("Adventure needs a name!", 'error'); return; }
    try {
      const links = { flights: newFlightLink||undefined, airbnb: newAirbnbLink||undefined, maps: newMapsLink||undefined, tripadvisor: newTripAdvisorLink||undefined };
      await addItem({ title: newTitle, category: newCategory, targetDate: newTargetDate||undefined, links, notes: newNotes||undefined, isCompleted: false });
      resetNewItemForm();
      showToast("New adventure added to our map! 🗺️");
    } catch (error) { console.error(error); showToast("Couldn't chart this adventure.", 'error'); }
  };
  
  const openItemDetailScroll = (item: BucketListItem) => {
    setViewingItem(item);
    setIsEditMode(false); // Default to view mode
    // Populate edit fields in case user clicks edit
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTargetDate(item.targetDate ? new Date(item.targetDate + 'T00:00:00').toISOString().split('T')[0] : "");
    setEditFlightLink(item.links?.flights || ""); setEditAirbnbLink(item.links?.airbnb || "");
    setEditMapsLink(item.links?.maps || ""); setEditTripAdvisorLink(item.links?.tripadvisor || "");
    setEditNotes(item.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!viewingItem || !editTitle.trim()) { showToast("Adventure name can't be blank!", 'error'); return; }
    try {
      const links = { flights: editFlightLink||undefined, airbnb: editAirbnbLink||undefined, maps: editMapsLink||undefined, tripadvisor: editTripAdvisorLink||undefined };
      await updateItem({ id: viewingItem._id, title: editTitle, category: editCategory, targetDate: editTargetDate||undefined, links, notes: editNotes||undefined });
      setViewingItem(null); // Close modal
      setIsEditMode(false);
      showToast("Adventure details updated! 📜");
    } catch (error) { console.error(error); showToast("Couldn't update this quest.", 'error'); }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      await removeItem({ id: deleteConfirmItem._id });
      setDeleteConfirmItem(null);
      setViewingItem(null); // Close detail view if it was the one being deleted
      showToast("Adventure erased from the map. 💨");
    } catch (error) { console.error(error); showToast("This adventure is stubborn!", 'error'); }
  };
  
  const handleToggleCompleteFromDetail = async (item: BucketListItem) => {
    try {
      await toggleItem({ id: item._id, isCompleted: !item.isCompleted });
      // Optimistically update viewing item if it's the one being toggled
      if (viewingItem && viewingItem._id === item._id) {
        setViewingItem(prev => prev ? {...prev, isCompleted: !prev.isCompleted} : null);
      }
       showToast(item.isCompleted ? "Marked as 'To Do'! ✨" : "Adventure Complete! 🎉");
    } catch (error) {
      console.error("Failed to toggle item status:", error);
      showToast("Status change failed.", "error");
    }
  };
  
  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return "Sometime Soon...";
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };


  return (
    <div className="bucket-layout-desktop-adventurer">
      {/* --- Side Panel: Adventurer's Almanac --- */}
      <aside className="almanac-sidebar-cute">
        <div className="almanac-header-cute">
          <h1 className="almanac-title-cute">Our Adventure Almanac 📜</h1>
          <div className="almanac-progress-cute">
            <div className="almanac-progress-bar-bg-cute">
              <div className="almanac-progress-bar-fill-cute" style={{ width: `${completionPercentage}%` }}>
                {completionPercentage > 10 && `${completionPercentage}%`}
              </div>
            </div>
            <p>{completedItemsCount} of {totalItems} Adventures Conquered!</p>
          </div>
        </div>

        <div className="almanac-section-cute">
          <h3 className="almanac-section-title-cute">Filter by Chapter</h3>
          <div className="almanac-category-filters-cute">
            <button onClick={() => setCategoryFilter("all")} className={categoryFilter === "all" ? "active" : ""}>All Chapters 🌍</button>
            {uniqueCategories.map(cat => {
              const style = getCategoryStyle(cat);
              return <button key={cat} onClick={() => setCategoryFilter(cat)} className={`${style.className} ${categoryFilter === cat ? "active" : ""}`}>{style.emoji} {cat}</button>;
            })}
          </div>
        </div>

        <div className="almanac-section-cute">
          <h3 className="almanac-section-title-cute">Quest Status</h3>
          <div className="almanac-status-filters-cute">
            {(["all", "pending", "completed"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={filterStatus === s ? "active" : ""}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
        
        <div className="almanac-section-cute">
          <h3 className="almanac-section-title-cute">Sort Journal By</h3>
          <div className="almanac-sort-options-cute">
             {(["date", "title", "category"] as const).map(s => (
                <button key={s} onClick={() => {
                    if (sortBy === s) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    else { setSortBy(s); setSortOrder('asc');}
                }} className={sortBy === s ? 'active' : ''}>
                    {s.charAt(0).toUpperCase() + s.slice(1)} {sortBy === s ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}
                </button>
            ))}
          </div>
        </div>

        <button onClick={() => { setShowAddItemParchment(true); setTimeout(() => firstInputRef.current?.focus(),0);}} className="almanac-add-quest-button-cute">
          New Quest! ➕
        </button>
      </aside>

      {/* --- Main Content: Quest Board / Map --- */}
      <main className="quest-board-main-cute">
        {filteredAndSortedList.length === 0 && !showAddItemParchment && (
          <div className="quest-board-empty-state-cute">
            <span className="icon">🗺️</span>
            <h2>The Map is Blank!</h2>
            <p>Let's add some grand adventures to our journal!</p>
            <button onClick={() => setShowAddItemParchment(true)} className="almanac-add-quest-button-cute">Chart a New Course!</button>
          </div>
        )}

        <div className="quest-item-grid-cute">
          {filteredAndSortedList.map(item => {
            const style = getCategoryStyle(item.category);
            return (
              <div 
                key={item._id} 
                className={`quest-item-badge-cute ${style.className} ${item.isCompleted ? "completed" : ""}`}
                onClick={() => openItemDetailScroll(item)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openItemDetailScroll(item)}
              >
                <div className="quest-badge-icon-area-cute">
                  <span className="icon">{style.emoji}</span>
                  {item.isCompleted && <span className="completed-banner-cute">DONE!</span>}
                </div>
                <h4 className="quest-badge-title-cute">{item.title}</h4>
                {item.targetDate && <p className="quest-badge-date-cute">{formatDateForDisplay(item.targetDate)}</p>}
                {item.isCompleted && <div className="quest-badge-completed-overlay-cute"></div>}
              </div>
            );
          })}
        </div>
      </main>

      {/* --- Add Item Parchment (Modal-like overlay) --- */}
      {showAddItemParchment && (
        <div className="new-quest-parchment-overlay-cute" onClick={() => setShowAddItemParchment(false)}>
          <form className="new-quest-parchment-form-cute" onSubmit={handleAddNewItem} onClick={e => e.stopPropagation()}>
            <h3>Add a New Adventure! ✨</h3>
            <input ref={firstInputRef} type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Name of our grand quest..." />
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
              <option value="adventure">🏞️ Adventure</option>
              <option value="travel">✈️ Travel</option>
              <option value="food">🍕 Food Quest</option>
              <option value="milestone">🏆 Milestone</option>
              <option value="other">💖 Other Fun</option>
            </select>
            <input type="date" value={newTargetDate} onChange={e => setNewTargetDate(e.target.value)} />
            <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Whisper your secret plans here..."/>
            <p className="form-section-title-cute">Helpful Scrolls (Links):</p>
            <input type="url" value={newFlightLink} onChange={e => setNewFlightLink(e.target.value)} placeholder="✈️ Flights..." />
            <input type="url" value={newAirbnbLink} onChange={e => setNewAirbnbLink(e.target.value)} placeholder="🏠 Stays..." />
            <input type="url" value={newMapsLink} onChange={e => setNewMapsLink(e.target.value)} placeholder="📍 Maps..." />
            <input type="url" value={newTripAdvisorLink} onChange={e => setNewTripAdvisorLink(e.target.value)} placeholder="⭐ Reviews..." />
            <div className="form-actions-cute">
              <button type="button" onClick={resetNewItemForm} className="cancel">Discard Scroll</button>
              <button type="submit" className="add">Add to Almanac!</button>
            </div>
          </form>
        </div>
      )}

      {/* --- Item Detail Scroll Modal --- */}
      {viewingItem && (
        <div className="quest-detail-scroll-overlay-cute" onClick={() => { setViewingItem(null); setIsEditMode(false);}}>
          <div className="quest-detail-scroll-content-cute" onClick={e => e.stopPropagation()}>
            <button onClick={() => {setViewingItem(null); setIsEditMode(false);}} className="close-scroll-button-cute">X</button>
            {!isEditMode ? (
              <>
                <div className={`scroll-header-cute ${getCategoryStyle(viewingItem.category).className}`}>
                  <span className="icon">{getCategoryStyle(viewingItem.category).emoji}</span>
                  <h2>{viewingItem.title}</h2>
                  {viewingItem.isCompleted && <span className="completed-tag-cute">ACHIEVED! 🏆</span>}
                </div>
                <div className="scroll-section-cute">
                  <strong>Target Date:</strong> {formatDateForDisplay(viewingItem.targetDate)}
                </div>
                {viewingItem.notes && <div className="scroll-section-cute notes"><strong>Notes:</strong> <p>{viewingItem.notes}</p></div>}
                {(viewingItem.links?.flights || viewingItem.links?.airbnb || viewingItem.links?.maps || viewingItem.links?.tripadvisor) && (
                  <div className="scroll-section-cute links">
                    <strong>Helpful Scrolls:</strong>
                    {viewingItem.links?.flights && <a href={viewingItem.links.flights} target="_blank" rel="noopener noreferrer">✈️ Flights</a>}
                    {viewingItem.links?.airbnb && <a href={viewingItem.links.airbnb} target="_blank" rel="noopener noreferrer">🏠 Stay</a>}
                    {viewingItem.links?.maps && <a href={viewingItem.links.maps} target="_blank" rel="noopener noreferrer">📍 Map</a>}
                    {viewingItem.links?.tripadvisor && <a href={viewingItem.links.tripadvisor} target="_blank" rel="noopener noreferrer">⭐ Reviews</a>}
                  </div>
                )}
                <div className="scroll-actions-cute">
                  <button onClick={() => handleToggleCompleteFromDetail(viewingItem)} className="toggle-complete">
                    {viewingItem.isCompleted ? "Mark as Pending 🤔" : "Mark as Done! 🎉"}
                  </button>
                  <button onClick={() => setIsEditMode(true)} className="edit">Edit Quest ✏️</button>
                  <button onClick={() => setDeleteConfirmItem(viewingItem)} className="delete">Abandon Quest 🗑️</button>
                </div>
              </>
            ) : (
              /* Edit Mode within Scroll */
              <form className="edit-quest-form-in-scroll-cute" onSubmit={(e) => {e.preventDefault(); handleSaveEdit();}}>
                <h3>Edit Adventure Details ✏️</h3>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Adventure Name" />
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                  <option value="adventure">🏞️ Adventure</option>
                  <option value="travel">✈️ Travel</option>
                  <option value="food">🍕 Food Quest</option>
                  <option value="milestone">🏆 Milestone</option>
                  <option value="other">💖 Other Fun</option>
                </select>
                <input type="date" value={editTargetDate} onChange={e => setEditTargetDate(e.target.value)} />
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Update your secret plans..."/>
                <p className="form-section-title-cute">Update Links:</p>
                <input type="url" value={editFlightLink} onChange={e => setEditFlightLink(e.target.value)} placeholder="✈️ Flights..." />
                <input type="url" value={editAirbnbLink} onChange={e => setEditAirbnbLink(e.target.value)} placeholder="🏠 Stays..." />
                <input type="url" value={editMapsLink} onChange={e => setEditMapsLink(e.target.value)} placeholder="📍 Maps..." />
                <input type="url" value={editTripAdvisorLink} onChange={e => setEditTripAdvisorLink(e.target.value)} placeholder="⭐ Reviews..." />
                <div className="form-actions-cute">
                  <button type="button" onClick={() => setIsEditMode(false)} className="cancel">Cancel Edit</button>
                  <button type="submit" className="save">Save Changes!</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
         <div className="bucket-modal-overlay-cute" onClick={() => setDeleteConfirmItem(null)}>
            <div className="bucket-modal-content-cute confirm-delete" onClick={e => e.stopPropagation()}>
                <div className="bucket-delete-icon-cute">🗑️</div>
                <h3 className="bucket-modal-title-cute">Abandon "{deleteConfirmItem.title}"?</h3>
                <p>This adventure will be removed from our almanac!</p>
                <div className="bucket-modal-actions-cute">
                <button onClick={() => setDeleteConfirmItem(null)} className="bucket-button-cute cancel">No, Keep It!</button>
                <button onClick={handleDeleteItem} className="bucket-button-cute delete">Yes, Abandon!</button>
                </div>
            </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && <div className={`bucket-toast-cute ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}