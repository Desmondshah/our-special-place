import { useState, useEffect, useRef, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "./ThemeContext"; // Import useTheme

interface BucketListItem {
  _id: Id<"bucketList">;
  title: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  links?: { flights?: string; airbnb?: string; maps?: string; tripadvisor?: string; website?: string; };
  notes?: string;
}

const getCategoryStyle = (category: string, theme: string): { emoji: string, className: string, iconName?: string } => {
  // For starry theme, we might want different emojis or rely more on CSS for visuals
  if (theme === 'starry') {
    switch (category) {
      case "adventure": return { emoji: "⛰️", className: "category-adventure-starry" }; // Mountain for adventure
      case "travel": return { emoji: "🌌", className: "category-travel-starry" }; // Milky Way for travel
      case "food": return { emoji: "🍇", className: "category-food-starry" }; // Grapes for food (celestial feast)
      case "milestone": return { emoji: "🌠", className: "category-milestone-starry" }; // Shooting star for milestone
      default: return { emoji: "✨", className: "category-other-starry" };
    }
  }
  // Pixel theme defaults
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
  const { theme } = useTheme(); // Get current theme

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
  
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("adventure");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newLinks, setNewLinks] = useState<{ website?: string; flights?: string; airbnb?: string; maps?: string; tripadvisor?: string }>({});
  const [newNotes, setNewNotes] = useState("");

  const [viewingItem, setViewingItem] = useState<BucketListItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editLinks, setEditLinks] = useState<{ website?: string; flights?: string; airbnb?: string; maps?: string; tripadvisor?: string }>({});
  const [editNotes, setEditNotes] = useState("");

  const [deleteConfirmItem, setDeleteConfirmItem] = useState<BucketListItem | null>(null);
  const [toast, setToast] = useState<{message: string, visible: boolean, type: 'success' | 'error'}>({ message: "", visible: false, type: 'success' });

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
    setNewLinks({}); setNewNotes("");
    setShowAddItemParchment(false);
  };

  const handleAddNewItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) { showToast("Each aspiration needs a name!", 'error'); return; }
    try {
      await addItem({ title: newTitle, category: newCategory, targetDate: newTargetDate||undefined, links: newLinks, notes: newNotes||undefined, isCompleted: false });
      resetNewItemForm();
      showToast(theme === 'starry' ? "New aspiration charted among the stars! ✨" : "New adventure added to our map! 🗺️");
    } catch (error) { console.error(error); showToast(theme === 'starry' ? "Couldn't chart this aspiration." : "Couldn't chart this adventure.", 'error'); }
  };
  
  const openItemDetailScroll = (item: BucketListItem) => {
    setViewingItem(item);
    setIsEditMode(false);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTargetDate(item.targetDate ? new Date(item.targetDate + 'T00:00:00').toISOString().split('T')[0] : "");
    setEditLinks(item.links || {});
    setEditNotes(item.notes || "");
  };

  const handleSaveEdit = async () => {
    if (!viewingItem || !editTitle.trim()) { showToast("Aspiration name can't be blank!", 'error'); return; }
    try {
      await updateItem({ id: viewingItem._id, title: editTitle, category: editCategory, targetDate: editTargetDate||undefined, links: editLinks, notes: editNotes||undefined });
      setViewingItem(null); 
      setIsEditMode(false);
      showToast(theme === 'starry' ? "Aspiration details updated! 🌠" : "Adventure details updated! 📜");
    } catch (error) { console.error(error); showToast(theme === 'starry' ? "Couldn't update this aspiration." : "Couldn't update this quest.", 'error'); }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      await removeItem({ id: deleteConfirmItem._id });
      setDeleteConfirmItem(null);
      setViewingItem(null); 
      showToast(theme === 'starry' ? "Aspiration faded from the stars. 💨" : "Adventure erased from the map. 💨");
    } catch (error) { console.error(error); showToast(theme === 'starry' ? "This aspiration is holding on tight!" : "This adventure is stubborn!", 'error'); }
  };
  
  const handleToggleCompleteFromDetail = async (item: BucketListItem) => {
    try {
      await toggleItem({ id: item._id, isCompleted: !item.isCompleted });
      if (viewingItem && viewingItem._id === item._id) {
        setViewingItem(prev => prev ? {...prev, isCompleted: !prev.isCompleted} : null);
      }
       showToast(item.isCompleted ? (theme === 'starry' ? "Marked as 'Yet to Reach'! ✨" : "Marked as 'To Do'! ✨") : (theme === 'starry' ? "Aspiration Achieved! 🎉" : "Adventure Complete! 🎉"));
    } catch (error) {
      console.error("Failed to toggle item status:", error);
      showToast("Status change failed.", "error");
    }
  };
  
  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return theme === 'starry' ? "Timeless Dream..." : "Sometime Soon...";
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const almanacSidebarClass = theme === 'starry' ? 'celestial-controls-starry' : 'almanac-sidebar-cute';
  const mainBoardClass = theme === 'starry' ? 'aspirations-map-starry' : 'quest-item-grid-cute';
  const itemCardClass = theme === 'starry' ? 'celestial-scroll-item-starry' : 'quest-item-badge-cute';
  const addFormOverlayClass = theme === 'starry' ? 'celestial-form-overlay-starry' : 'new-quest-parchment-overlay-cute';
  const addFormContentClass = theme === 'starry' ? 'celestial-form-content-starry' : 'new-quest-parchment-form-cute';
  const detailModalOverlayClass = theme === 'starry' ? 'celestial-form-overlay-starry' : 'quest-detail-scroll-overlay-cute'; // Re-use for detail
  const detailModalContentClass = theme === 'starry' ? 'celestial-form-content-starry' : 'quest-detail-scroll-content-cute'; // Re-use for detail
  const emptyStateClass = theme === 'starry' ? 'bucket-list-empty-starry' : 'quest-board-empty-state-cute';
  const buttonClass = theme === 'starry' ? 'celestial-button-starry' : 'bucket-button-cute'; // Generic button
  const inputClass = theme === 'starry' ? 'plans-input-cute' : 'bucket-input-cute'; // Assuming plans input is styled for starry

  return (
    <div className={theme === 'starry' ? 'bucket-layout-desktop-adventurer starry-desktop-layout' : 'bucket-layout-desktop-adventurer'}>
      <aside className={almanacSidebarClass}>
        <div className={theme === 'starry' ? 'celestial-aspirations-header' : 'almanac-header-cute'}>
          <h1 className={theme === 'starry' ? 'celestial-aspirations-title' : 'almanac-title-cute'}>
            {theme === 'starry' ? 'Celestial Aspirations ✨' : 'Our Adventure Almanac 📜'}
          </h1>
          <div className={theme === 'starry' ? 'celestial-progress-info-starry' : 'almanac-progress-cute'}>
            <div className={theme === 'starry' ? 'celestial-progress-bar-container-starry' : 'almanac-progress-bar-bg-cute'}>
              <div 
                className={theme === 'starry' ? 'celestial-progress-bar-fill-starry' : 'almanac-progress-bar-fill-cute'} 
                style={{ width: `${completionPercentage}%` }}
              >
                {theme !== 'starry' && completionPercentage > 10 && `${completionPercentage}%`}
              </div>
            </div>
            <p>{completedItemsCount} of {totalItems} Aspirations Fulfilled!</p>
          </div>
        </div>

        <div className={theme === 'starry' ? 'mb-6' : 'almanac-section-cute'}>
          <h3 className={theme === 'starry' ? 'text-sm uppercase tracking-wider text-text-secondary mb-2' : 'almanac-section-title-cute'}>Filter by Constellation</h3>
          <div className={theme === 'starry' ? 'flex flex-col gap-1' : 'almanac-category-filters-cute'}>
            <button onClick={() => setCategoryFilter("all")} className={`${buttonClass} text-left ${categoryFilter === "all" ? 'active-filter' : ''}`}>All Constellations 🌌</button>
            {uniqueCategories.map(cat => {
              const style = getCategoryStyle(cat, theme);
              return <button key={cat} onClick={() => setCategoryFilter(cat)} className={`${buttonClass} text-left ${style.className} ${categoryFilter === cat ? "active-filter" : ""}`}>{style.emoji} {cat}</button>;
            })}
          </div>
        </div>

        <div className={theme === 'starry' ? 'mb-6' : 'almanac-section-cute'}>
          <h3 className={theme === 'starry' ? 'text-sm uppercase tracking-wider text-text-secondary mb-2' : 'almanac-section-title-cute'}>Aspiration Status</h3>
          <div className={theme === 'starry' ? 'flex flex-col gap-1' : 'almanac-status-filters-cute'}>
            {(["all", "pending", "completed"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`${buttonClass} text-left ${filterStatus === s ? "active-filter" : ""}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>
        
        <div className={theme === 'starry' ? 'mb-6' : 'almanac-section-cute'}>
          <h3 className={theme === 'starry' ? 'text-sm uppercase tracking-wider text-text-secondary mb-2' : 'almanac-section-title-cute'}>Sort Aspirations By</h3>
          <div className={theme === 'starry' ? 'flex flex-col gap-1' : 'almanac-sort-options-cute'}>
             {(["date", "title", "category"] as const).map(s => (
                <button key={s} onClick={() => {
                    if (sortBy === s) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    else { setSortBy(s); setSortOrder('asc');}
                }} className={`${buttonClass} text-left ${sortBy === s ? 'active-filter' : ''}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)} {sortBy === s ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}
                </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => { setShowAddItemParchment(true); setTimeout(() => firstInputRef.current?.focus(),0);}} 
          className={`${buttonClass} ${theme === 'starry' ? 'add-aspiration w-full mt-auto' : 'almanac-add-quest-button-cute'}`}
        >
          {theme === 'starry' ? 'Chart New Aspiration ✨' : 'New Quest! ➕'}
        </button>
      </aside>

      <main className={theme === 'starry' ? 'quest-board-main-cute starry-main-board' : 'quest-board-main-cute'}>
        {filteredAndSortedList.length === 0 && !showAddItemParchment && (
          <div className={emptyStateClass}>
            <span className="icon">{theme === 'starry' ? '🔭' : '🗺️'}</span>
            <h2>{theme === 'starry' ? 'The Cosmos Awaits Our Dreams!' : 'The Map is Blank!'}</h2>
            <p>{theme === 'starry' ? 'Let\'s fill the sky with our aspirations.' : 'Let\'s add some grand adventures to our journal!'}</p>
            <button 
              onClick={() => setShowAddItemParchment(true)} 
              className={`${buttonClass} ${theme === 'starry' ? 'add-aspiration' : 'almanac-add-quest-button-cute'}`}
            >
              {theme === 'starry' ? 'Plot First Aspiration!' : 'Chart a New Course!'}
            </button>
          </div>
        )}

        <div className={mainBoardClass}>
          {filteredAndSortedList.map(item => {
            const style = getCategoryStyle(item.category, theme);
            return (
              <div 
                key={item._id} 
                className={`${itemCardClass} ${style.className} ${item.isCompleted ? "completed" : ""}`}
                onClick={() => openItemDetailScroll(item)}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openItemDetailScroll(item)}
              >
                {theme === 'starry' ? (
                  <>
                    <div className="scroll-header-content-starry">
                      <span className="scroll-category-icon-starry">{style.emoji}</span>
                      <h4 className="scroll-title-starry">{item.title}</h4>
                      <button 
                        className={`scroll-checkbox-starry ${item.isCompleted ? "checked" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleItem({ id: item._id, isCompleted: !item.isCompleted }); }}
                        aria-label={item.isCompleted ? "Mark as pending" : "Mark as completed"}
                      >
                        {item.isCompleted ? "✓" : ""}
                      </button>
                    </div>
                    {item.targetDate && <p className="scroll-details-starry"><strong>Target:</strong> {formatDateForDisplay(item.targetDate)}</p>}
                    {item.notes && <p className="scroll-notes-starry">"{item.notes.substring(0,100)}{item.notes.length > 100 ? '...' : ''}"</p>}
                    {item.links && Object.values(item.links).some(l => l) && (
                        <div className="scroll-links-starry">
                            {item.links.website && <a href={item.links.website} target="_blank" rel="noopener noreferrer" className="scroll-link-chip-starry" onClick={e=>e.stopPropagation()}>🌐 Website</a>}
                            {item.links.flights && <a href={item.links.flights} target="_blank" rel="noopener noreferrer" className="scroll-link-chip-starry" onClick={e=>e.stopPropagation()}>✈️ Flights</a>}
                            {item.links.airbnb && <a href={item.links.airbnb} target="_blank" rel="noopener noreferrer" className="scroll-link-chip-starry" onClick={e=>e.stopPropagation()}>🏠 Stay</a>}
                            {item.links.maps && <a href={item.links.maps} target="_blank" rel="noopener noreferrer" className="scroll-link-chip-starry" onClick={e=>e.stopPropagation()}>📍 Map</a>}
                            {item.links.tripadvisor && <a href={item.links.tripadvisor} target="_blank" rel="noopener noreferrer" className="scroll-link-chip-starry" onClick={e=>e.stopPropagation()}>⭐ Reviews</a>}
                        </div>
                    )}
                     <div className="scroll-actions-starry">
                        <button onClick={(e) => { e.stopPropagation(); openItemDetailScroll(item); }} className={`${buttonClass} scroll-action-button-starry`}>Details & Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmItem(item);}} className={`${buttonClass} scroll-action-button-starry delete`}>Remove</button>
                    </div>
                  </>
                ) : ( // Pixel theme card content
                  <>
                    <div className="quest-badge-icon-area-cute">
                      <span className="icon">{style.emoji}</span>
                      {item.isCompleted && <span className="completed-banner-cute">DONE!</span>}
                    </div>
                    <h4 className="quest-badge-title-cute">{item.title}</h4>
                    {item.targetDate && <p className="quest-badge-date-cute">{formatDateForDisplay(item.targetDate)}</p>}
                    {item.isCompleted && <div className="quest-badge-completed-overlay-cute"></div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {showAddItemParchment && (
        <div className={addFormOverlayClass} onClick={() => setShowAddItemParchment(false)}>
          <form className={addFormContentClass} onSubmit={handleAddNewItem} onClick={e => e.stopPropagation()}>
            <h3>{theme === 'starry' ? 'Chart a New Aspiration ✨' : 'Add a New Adventure! ✨'}</h3>
            <input ref={firstInputRef} type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={theme === 'starry' ? 'Name of your aspiration...' : 'Name of our grand quest...'} className={inputClass} />
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className={inputClass}>
              {Object.entries(getCategoryStyle("", theme)).map(([key, val]) => { // This needs to be fixed, should iterate over actual categories
                  const catDisplay = getCategoryStyle(key, theme); // Get display for current category
                  return <option key={key} value={key}>{catDisplay.emoji} {key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ")}</option>
              })}
            </select>
            <input type="date" value={newTargetDate} onChange={e => setNewTargetDate(e.target.value)} className={inputClass}/>
            <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder={theme === 'starry' ? 'Describe this celestial dream...' : 'Whisper your secret plans here...'} className={`${inputClass} min-h-[80px]`}/>
            {theme === 'starry' && <h4 className="form-section-title-cute">Guiding Stars (Links):</h4>}
            <input type="url" value={newLinks.website || ""} onChange={e => setNewLinks(prev => ({...prev, website: e.target.value}))} placeholder="🌐 Website..." className={inputClass}/>
            <input type="url" value={newLinks.flights || ""} onChange={e => setNewLinks(prev => ({...prev, flights: e.target.value}))} placeholder="✈️ Flights..." className={inputClass}/>
            <input type="url" value={newLinks.airbnb || ""} onChange={e => setNewLinks(prev => ({...prev, airbnb: e.target.value}))} placeholder="🏠 Stays..." className={inputClass}/>
            <input type="url" value={newLinks.maps || ""} onChange={e => setNewLinks(prev => ({...prev, maps: e.target.value}))} placeholder="📍 Maps..." className={inputClass}/>
            <input type="url" value={newLinks.tripadvisor || ""} onChange={e => setNewLinks(prev => ({...prev, tripadvisor: e.target.value}))} placeholder="⭐ Reviews..." className={inputClass}/>
            <div className={theme === 'starry' ? 'celestial-form-actions-starry' : 'form-actions-cute'}>
              <button type="button" onClick={resetNewItemForm} className={`${buttonClass} cancel`}>{theme === 'starry' ? 'Cancel Charting' : 'Discard Scroll'}</button>
              <button type="submit" className={`${buttonClass} ${theme === 'starry' ? 'save' : 'add'}`}>{theme === 'starry' ? 'Add to Cosmos!' : 'Add to Almanac!'}</button>
            </div>
          </form>
        </div>
      )}

      {viewingItem && (
        <div className={detailModalOverlayClass} onClick={() => { setViewingItem(null); setIsEditMode(false);}}>
          <div className={detailModalContentClass} onClick={e => e.stopPropagation()}>
            <button onClick={() => {setViewingItem(null); setIsEditMode(false);}} className={theme === 'starry' ? `${buttonClass} absolute top-4 right-4 p-2 leading-none` : 'close-scroll-button-cute'}>X</button>
            {!isEditMode ? (
              <>
                <div className={theme === 'starry' ? `scroll-header-content-starry items-center text-center flex-col ${getCategoryStyle(viewingItem.category, theme).className}` : `scroll-header-cute ${getCategoryStyle(viewingItem.category, theme).className}`}>
                  <span className={theme === 'starry' ? 'scroll-category-icon-starry text-4xl mb-2' : 'icon'}>{getCategoryStyle(viewingItem.category, theme).emoji}</span>
                  <h2 className={theme === 'starry' ? 'scroll-title-starry text-2xl' : ''}>{viewingItem.title}</h2>
                  {viewingItem.isCompleted && <span className={theme === 'starry' ? `${buttonClass} success text-xs py-1 px-2 mt-2` : 'completed-tag-cute'}>{theme === 'starry' ? 'FULFILLED! 🌠' : 'ACHIEVED! 🏆'}</span>}
                </div>
                <div className={theme === 'starry' ? 'p-4 space-y-3' : 'scroll-section-cute'}>
                  <p><strong>Target Date:</strong> {formatDateForDisplay(viewingItem.targetDate)}</p>
                  {viewingItem.notes && <div className={theme === 'starry' ? '' : 'notes'}><strong className="block mb-1">Notes:</strong> <p className="whitespace-pre-wrap opacity-90">{viewingItem.notes}</p></div>}
                  {Object.values(viewingItem.links || {}).some(l => l) && (
                    <div className={theme === 'starry' ? 'mt-3' : 'scroll-section-cute links'}>
                      <strong className="block mb-1">Helpful Links:</strong>
                      <div className="flex flex-wrap gap-2">
                        {viewingItem.links?.website && <a href={viewingItem.links.website} target="_blank" rel="noopener noreferrer" className={`${buttonClass} scroll-link-chip-starry`}>🌐 Website</a>}
                        {viewingItem.links?.flights && <a href={viewingItem.links.flights} target="_blank" rel="noopener noreferrer" className={`${buttonClass} scroll-link-chip-starry`}>✈️ Flights</a>}
                        {viewingItem.links?.airbnb && <a href={viewingItem.links.airbnb} target="_blank" rel="noopener noreferrer" className={`${buttonClass} scroll-link-chip-starry`}>🏠 Stay</a>}
                        {viewingItem.links?.maps && <a href={viewingItem.links.maps} target="_blank" rel="noopener noreferrer" className={`${buttonClass} scroll-link-chip-starry`}>📍 Map</a>}
                        {viewingItem.links?.tripadvisor && <a href={viewingItem.links.tripadvisor} target="_blank" rel="noopener noreferrer" className={`${buttonClass} scroll-link-chip-starry`}>⭐ Reviews</a>}
                      </div>
                    </div>
                  )}
                </div>
                <div className={theme === 'starry' ? 'celestial-form-actions-starry px-4 pb-4' : 'scroll-actions-cute'}>
                  <button onClick={() => handleToggleCompleteFromDetail(viewingItem)} className={`${buttonClass} ${theme === 'starry' ? '' : 'toggle-complete'}`}>
                    {viewingItem.isCompleted ? (theme === 'starry' ? "Mark Unfulfilled 🤔" : "Mark as Pending 🤔") : (theme === 'starry' ? "Mark Fulfilled! 🎉" : "Mark as Done! 🎉")}
                  </button>
                  <button onClick={() => setIsEditMode(true)} className={`${buttonClass} ${theme === 'starry' ? '' : 'edit'}`}>{theme === 'starry' ? 'Adjust Aspiration ✏️' : 'Edit Quest ✏️'}</button>
                  <button onClick={() => setDeleteConfirmItem(viewingItem)} className={`${buttonClass} ${theme === 'starry' ? 'delete' : 'delete'}`}>{theme === 'starry' ? 'Let Go 🗑️' : 'Abandon Quest 🗑️'}</button>
                </div>
              </>
            ) : (
              <form className={theme === 'starry' ? 'p-4 space-y-3' : 'edit-quest-form-in-scroll-cute'} onSubmit={(e) => {e.preventDefault(); handleSaveEdit();}}>
                <h3 className="text-center text-xl mb-3">{theme === 'starry' ? 'Refine This Aspiration ✏️' : 'Edit Adventure Details ✏️'}</h3>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Aspiration Name" className={inputClass}/>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className={inputClass}>
                    {Object.entries(getCategoryStyle("",theme)).map(([key, val]) => {
                         const catDisplay = getCategoryStyle(key, theme);
                        return <option key={key} value={key}>{catDisplay.emoji} {key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ")}</option>
                    })}
                </select>
                <input type="date" value={editTargetDate} onChange={e => setEditTargetDate(e.target.value)} className={inputClass}/>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Update your notes..." className={`${inputClass} min-h-[70px]`}/>
                <h4 className={theme === 'starry' ? 'form-section-title-cute' : 'form-section-title-cute'}>Update Links:</h4>
                <input type="url" value={editLinks.website || ""} onChange={e => setEditLinks(prev => ({...prev, website: e.target.value}))} placeholder="🌐 Website..." className={inputClass}/>
                <input type="url" value={editLinks.flights || ""} onChange={e => setEditLinks(prev => ({...prev, flights: e.target.value}))} placeholder="✈️ Flights..." className={inputClass}/>
                <input type="url" value={editLinks.airbnb || ""} onChange={e => setEditLinks(prev => ({...prev, airbnb: e.target.value}))} placeholder="🏠 Stays..." className={inputClass}/>
                <input type="url" value={editLinks.maps || ""} onChange={e => setEditLinks(prev => ({...prev, maps: e.target.value}))} placeholder="📍 Maps..." className={inputClass}/>
                <input type="url" value={editLinks.tripadvisor || ""} onChange={e => setEditLinks(prev => ({...prev, tripadvisor: e.target.value}))} placeholder="⭐ Reviews..." className={inputClass}/>
                <div className={theme === 'starry' ? 'celestial-form-actions-starry' : 'form-actions-cute'}>
                  <button type="button" onClick={() => setIsEditMode(false)} className={`${buttonClass} cancel`}>Cancel Edit</button>
                  <button type="submit" className={`${buttonClass} ${theme === 'starry' ? 'save' : 'save'}`}>Save Changes!</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {deleteConfirmItem && (
         <div className={theme === 'starry' ? 'celestial-form-overlay-starry' : 'bucket-modal-overlay-cute'} onClick={() => setDeleteConfirmItem(null)}>
            <div className={`${theme === 'starry' ? 'celestial-form-content-starry' : 'bucket-modal-content-cute'} confirm-delete text-center`} onClick={e => e.stopPropagation()}>
                <div className={theme === 'starry' ? 'text-4xl mb-4' : 'bucket-delete-icon-cute'}>🗑️</div>
                <h3 className={theme === 'starry' ? 'text-xl text-text-accent mb-2' : 'bucket-modal-title-cute'}>Remove "{deleteConfirmItem.title}"?</h3>
                <p className="mb-4 opacity-80">This aspiration will fade from our cosmic map!</p>
                <div className={theme === 'starry' ? 'celestial-form-actions-starry justify-center' : 'bucket-modal-actions-cute'}>
                <button onClick={() => setDeleteConfirmItem(null)} className={`${buttonClass} cancel`}>No, Keep It!</button>
                <button onClick={handleDeleteItem} className={`${buttonClass} delete`}>Yes, Let Go!</button>
                </div>
            </div>
        </div>
      )}

      {toast.visible && <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-sm z-[200] ${theme === 'starry' ? 'bucket-toast-cute starry-toast' : 'bucket-toast-cute'} ${toast.type === 'success' ? (theme === 'starry' ? 'bg-green-700 border-green-500 text-white' : 'bg-green-100 border-green-400 text-green-700') : (theme === 'starry' ? 'bg-red-700 border-red-500 text-white' : 'bg-red-100 border-red-400 text-red-700')}`}>{toast.message}</div>}
    </div>
  );
}

