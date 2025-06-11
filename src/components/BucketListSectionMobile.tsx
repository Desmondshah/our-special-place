import { useState, useEffect, useRef, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "./ThemeContext";

interface BucketListItem {
  _id: Id<"bucketList">;
  title: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  links?: { flights?: string; airbnb?: string; maps?: string; tripadvisor?: string; website?: string; };
  notes?: string;
}

const getCategoryStyleMobile = (category: string, theme: string): { emoji: string, className: string } => {
  if (theme === 'starry') {
    switch (category) {
      case "adventure": return { emoji: "⛰️", className: "category-adventure-starry-mobile" };
      case "travel": return { emoji: "🌌", className: "category-travel-starry-mobile" };
      case "food": return { emoji: "🍇", className: "category-food-starry-mobile" };
      case "milestone": return { emoji: "🌠", className: "category-milestone-starry-mobile" };
      default: return { emoji: "✨", className: "category-other-starry-mobile" };
    }
  }
  // Pixel theme defaults
  switch (category) {
    case "adventure": return { emoji: "🏞️", className: "category-adventure" };
    case "travel": return { emoji: "✈️", className: "category-travel" };
    case "food": return { emoji: "🍕", className: "category-food" };
    case "milestone": return { emoji: "🏆", className: "category-milestone" };
    default: return { emoji: "💖", className: "category-other" };
  }
};


export default function BucketListSectionMobile() {
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme(); 

  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeSheet, setActiveSheet] = useState<'none' | 'add' | 'edit' | 'actions' | 'filters'>('none');
  
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("adventure");
  const [newItemTargetDate, setNewItemTargetDate] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [newItemLinks, setNewItemLinks] = useState<{ website?: string }>({});


  const [selectedItemForAction, setSelectedItemForAction] = useState<BucketListItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("adventure");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLinks, setEditLinks] = useState<{ website?: string }>({});


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
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      const dateA = a.targetDate ? new Date(a.targetDate + 'T00:00:00').getTime() : Infinity;
      const dateB = b.targetDate ? new Date(b.targetDate + 'T00:00:00').getTime() : Infinity;
      return dateA - dateB;
    });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };
  
  const resetNewItemForm = () => {
    setNewItemTitle(""); setNewItemCategory("adventure"); setNewItemTargetDate(""); setNewItemNotes(""); setNewItemLinks({});
  };

  const handleAddNewItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) { showToast("Aspiration needs a name!", 'error'); return; }
    try {
      await addItem({ title: newItemTitle, category: newItemCategory, targetDate: newItemTargetDate||undefined, notes: newItemNotes||undefined, links: newItemLinks, isCompleted: false });
      resetNewItemForm();
      setActiveSheet('none');
      showToast(theme === 'starry' ? "New aspiration added to your cosmos! ✨" : "New page added to diary! 📖");
    } catch (error) { console.error(error); showToast("Couldn't add new aspiration.", 'error'); }
  };

  const openEditSheet = (item: BucketListItem) => {
    setSelectedItemForAction(item); 
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTargetDate(item.targetDate ? new Date(item.targetDate + 'T00:00:00').toISOString().split('T')[0] : "");
    setEditNotes(item.notes || "");
    setEditLinks({ website: item.links?.website || item.links?.maps || item.links?.flights || item.links?.airbnb || item.links?.tripadvisor || "" });
    setActiveSheet('edit');
  };

  const handleSaveEdit = async () => {
    if (!selectedItemForAction || !editTitle.trim()) { showToast("Aspiration name can't be blank!", 'error'); return; }
    try {
      await updateItem({ id: selectedItemForAction._id, title: editTitle, category: editCategory, targetDate: editTargetDate||undefined, notes: editNotes||undefined, links: editLinks });
      setActiveSheet('none');
      setSelectedItemForAction(null);
      showToast(theme === 'starry' ? "Aspiration updated! 🌠" : "Diary page updated! ✍️");
    } catch (error) { console.error(error); showToast("Couldn't update aspiration.", 'error'); }
  };
  
  const openActionSheet = (item: BucketListItem) => {
    setSelectedItemForAction(item);
    setActiveSheet('actions');
  };

  const handleDeleteItem = async () => { 
    if (!deleteConfirmItem) return;
    try {
      await removeItem({ id: deleteConfirmItem._id });
      setDeleteConfirmItem(null);
      setActiveSheet('none'); 
      showToast(theme === 'starry' ? "Aspiration removed from the cosmos. 💨" : "Page torn from diary. 💨");
    } catch (error) { console.error(error); showToast("Couldn't remove aspiration.", 'error');}
  };
  
  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return theme === 'starry' ? "Anytime ✨" : "Anytime ✨";
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bottomSheetRef.current && !bottomSheetRef.current.contains(event.target as Node)) {
        if (activeSheet !== 'none' && !deleteConfirmItem) { 
            setActiveSheet('none');
            setSelectedItemForAction(null); 
        }
      }
    };
    if (activeSheet !== 'none') {
      document.body.classList.add('overflow-hidden-cute');
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.body.classList.remove('overflow-hidden-cute');
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.classList.remove('overflow-hidden-cute');
    };
  }, [activeSheet, deleteConfirmItem]);

  // Define dynamic classes based on theme
  const baseMobileLayoutClass = theme === 'starry' ? 'bucket-layout-mobile-adventurer starry-mobile' : 'bucket-layout-mobile-adventurer';
  const headerClass = theme === 'starry' ? 'pocket-diary-header-cute starry-mobile' : 'pocket-diary-header-cute';
  const progressClass = theme === 'starry' ? 'pocket-diary-progress-cute starry-mobile' : 'pocket-diary-progress-cute';
  const filterBtnClass = theme === 'starry' ? 'pocket-diary-filter-btn-cute starry-mobile' : 'pocket-diary-filter-btn-cute';
  const emptyStateClass = theme === 'starry' ? 'bucket-list-empty-starry' : 'pocket-diary-empty-state-cute';
  const listClass = theme === 'starry' ? 'aspirations-map-starry mobile-grid' : 'pocket-diary-list-cute';
  const itemCardBaseClass = theme === 'starry' ? 'celestial-scroll-item-starry' : 'diary-page-card-cute';
  const fabClass = theme === 'starry' ? 'pocket-diary-fab-cute starry-mobile' : 'pocket-diary-fab-cute';
  const bottomSheetBaseClass = theme === 'starry' ? 'bucket-bottom-sheet-cute adventurer starry-mobile' : 'bucket-bottom-sheet-cute adventurer';
  const toastBaseClass = theme === 'starry' ? 'bucket-toast-cute starry-toast mobile' : 'bucket-toast-cute mobile';
  const buttonClass = theme === 'starry' ? 'celestial-button-starry' : 'bucket-button-cute'; // Corrected definition
  const inputClass = theme === 'starry' ? 'plans-input-cute' : 'bucket-input-cute sheet'; // Assuming plans-input-cute is styled for starry


  return (
    <div className={baseMobileLayoutClass}>
      <header className={headerClass}>
        <h2>{theme === 'starry' ? 'Our Cosmic Aspirations ✨' : 'Our Adventures 💖'}</h2>
        <div className={progressClass}>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{width: `${completionPercentage}%`}}></div>
          </div>
          <span>{completedItemsCount}/{totalItems} Done!</span>
        </div>
        <button onClick={() => setActiveSheet('filters')} className={filterBtnClass}>
            <span role="img" aria-label="filter">{theme === 'starry' ? '🔭' : '🎨'}</span> Filters
            {(filterStatus !== 'all' || categoryFilter !== 'all') && <span className="filter-dot filter-dot-active"></span>}
        </button>
      </header>

      {filteredAndSortedList.length === 0 && activeSheet === 'none' && (
          <div className={emptyStateClass}>
            <span className="icon">{theme === 'starry' ? '🌌' : '📖'}</span>
            <p>{theme === 'starry' ? 'The universe of our dreams awaits charting!' : 'Our diary is waiting for new adventures!'}</p>
          </div>
      )}

      <main className={listClass}>
        {filteredAndSortedList.map(item => {
          const style = getCategoryStyleMobile(item.category, theme);
          const currentItemCardClass = `${itemCardBaseClass} ${theme === 'starry' ? 'starry-mobile-card' : ''} ${style.className} ${item.isCompleted ? "completed" : ""}`;
          return (
            <div 
              key={item._id} 
              className={currentItemCardClass}
              onClick={() => openActionSheet(item)}
            >
              <div className={theme === 'starry' ? 'scroll-header-content-starry' : "card-top-row"}>
                <span className={theme === 'starry' ? 'scroll-category-icon-starry' : "card-emoji"}>{style.emoji}</span>
                <h3 className={theme === 'starry' ? 'scroll-title-starry' : "card-title"}>{item.title}</h3>
                <button 
                    className={`${theme === 'starry' ? 'scroll-checkbox-starry' : 'card-checkbox'} ${item.isCompleted ? "checked" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleItem({ id: item._id, isCompleted: !item.isCompleted}); }}
                    aria-label={item.isCompleted ? "Mark as pending" : "Mark as completed"}
                >
                    {item.isCompleted ? "✓" : ""}
                </button>
              </div>
              <p className={theme === 'starry' ? 'scroll-details-starry text-xs opacity-80' : "card-date"}>{formatDateForDisplay(item.targetDate)}</p>
              {item.notes && <p className={theme === 'starry' ? 'scroll-notes-starry text-xs' : "card-notes-preview"}>"{item.notes.substring(0, 40)}{item.notes.length > 40 ? '...' : ''}"</p>}
              {item.isCompleted && <div className={theme === 'starry' ? `${buttonClass} success text-xs py-0 px-2 mt-2 inline-block` : "card-completed-ribbon-cute"}>{theme === 'starry' ? 'Fulfilled! 🌠' : 'Done!'}</div>}
            </div>
          );
        })}
      </main>

      <button onClick={() => { resetNewItemForm(); setActiveSheet('add'); }} className={fabClass}>
        {theme === 'starry' ? '🌟' : '✏️'}
      </button>

      {activeSheet !== 'none' && (
        <div className="bucket-bottom-sheet-overlay-cute" onClick={() => { if (!deleteConfirmItem) { setActiveSheet('none'); setSelectedItemForAction(null);}}}>
          <div ref={bottomSheetRef} className={bottomSheetBaseClass} onClick={e => e.stopPropagation()}>
            <div className="bucket-bottom-sheet-handle-cute"></div>

            {activeSheet === 'add' && (
              <>
                <h3 className="bucket-sheet-title-cute">{theme === 'starry' ? 'New Cosmic Aspiration ✨' : 'New Diary Page ✨'}</h3>
                <form onSubmit={handleAddNewItem} className="bucket-sheet-form-cute compact">
                  <input type="text" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} placeholder="Aspiration Title..." className={inputClass}/>
                  <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className={inputClass}>
                    {Object.keys(getCategoryStyleMobile("", theme)).map(catKey => { // Use Object.keys on the result of getCategoryStyleMobile
                        const catDisplay = getCategoryStyleMobile(catKey, theme);
                        // Ensure catKey is a valid category string before using it.
                        // This part might need adjustment based on how categories are defined/stored.
                        // For now, assuming catKey directly maps to a category.
                        return <option key={catKey} value={catKey}>{catDisplay.emoji} {catKey.charAt(0).toUpperCase() + catKey.slice(1)}</option>;
                    })}
                  </select>
                  <input type="date" value={newItemTargetDate} onChange={e => setNewItemTargetDate(e.target.value)} className={inputClass}/>
                  <textarea value={newItemNotes} onChange={e => setNewItemNotes(e.target.value)} placeholder="A few notes..." className={`${inputClass} min-h-[60px]`} rows={2}/>
                  <input type="url" value={newItemLinks.website || ""} onChange={e => setNewItemLinks(prev => ({...prev, website: e.target.value}))} placeholder="🔗 Link (Optional)" className={inputClass}/>
                  <div className="bucket-sheet-actions-cute">
                    <button type="button" onClick={() => setActiveSheet('none')} className={`${buttonClass} cancel sheet`}>Cancel</button>
                    <button type="submit" className={`${buttonClass} add sheet`}>Add Aspiration</button>
                  </div>
                </form>
              </>
            )}

            {activeSheet === 'edit' && selectedItemForAction && (
               <>
                <h3 className="bucket-sheet-title-cute">{theme === 'starry' ? 'Adjust Aspiration ✏️' : 'Edit Page ✏️'}</h3>
                <form onSubmit={(e) => {e.preventDefault(); handleSaveEdit();}} className="bucket-sheet-form-cute compact">
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inputClass}/>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className={inputClass}>
                     {Object.keys(getCategoryStyleMobile("", theme)).map(catKey => {
                        const catDisplay = getCategoryStyleMobile(catKey, theme);
                        return <option key={catKey} value={catKey}>{catDisplay.emoji} {catKey.charAt(0).toUpperCase() + catKey.slice(1)}</option>;
                    })}
                  </select>
                  <input type="date" value={editTargetDate} onChange={e => setEditTargetDate(e.target.value)} className={inputClass}/>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes..." className={`${inputClass} min-h-[60px]`} rows={2}/>
                  <input type="url" value={editLinks.website || ""} onChange={e => setEditLinks(prev => ({...prev, website: e.target.value}))} placeholder="🔗 Link (Optional)" className={inputClass}/>
                  <div className="bucket-sheet-actions-cute">
                    <button type="button" onClick={() => {setActiveSheet('actions');}} className={`${buttonClass} cancel sheet`}>Back</button>
                    <button type="submit" className={`${buttonClass} save sheet`}>Save</button>
                  </div>
                </form>
              </>
            )}
            
            {activeSheet === 'actions' && selectedItemForAction && (
                <>
                    <h3 className="bucket-sheet-title-cute compact">{selectedItemForAction.title}</h3>
                    <div className="bucket-sheet-action-list-cute">
                        <button onClick={() => { toggleItem({ id: selectedItemForAction._id, isCompleted: !selectedItemForAction.isCompleted }); setActiveSheet('none'); setSelectedItemForAction(null);}} className="bucket-action-list-item-cute">
                            {selectedItemForAction.isCompleted ? (theme === 'starry' ? "🌠 Mark Unfulfilled" : "✔️ Mark Pending") : (theme === 'starry' ? "✨ Mark Fulfilled" : "◻️ Mark Done")}
                        </button>
                        <button onClick={() => openEditSheet(selectedItemForAction)} className="bucket-action-list-item-cute">✏️ Edit Aspiration</button>
                        {(selectedItemForAction.links?.website || selectedItemForAction.links?.maps || selectedItemForAction.links?.flights) && 
                          <a 
                            href={selectedItemForAction.links?.website || selectedItemForAction.links?.maps || selectedItemForAction.links?.flights || "#"} 
                            target="_blank" rel="noopener noreferrer" 
                            className="bucket-action-list-item-cute link"
                            onClick={(e) => e.stopPropagation()} 
                          >🔗 View Link
                          </a>
                        }
                        <button onClick={() => setDeleteConfirmItem(selectedItemForAction)} className="bucket-action-list-item-cute delete">🗑️ Remove Aspiration</button>
                    </div>
                    <button onClick={() => setActiveSheet('none')} className={`${buttonClass} cancel sheet full-width mt-2`}>Close</button>
                </>
            )}

            {activeSheet === 'filters' && (
                <>
                    <h3 className="bucket-sheet-title-cute">{theme === 'starry' ? 'Filter Your Cosmos 🔭' : 'Filter Adventures 🧭'}</h3>
                    <div className="bucket-sheet-form-cute compact">
                        <label className={theme === 'starry' ? 'text-text-secondary' : ''}>Status:</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className={inputClass}>
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Fulfilled</option>
                        </select>
                        <label className={theme === 'starry' ? 'text-text-secondary mt-2' : ''}>Constellation (Category):</label>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={inputClass}>
                            <option value="all">All Constellations</option>
                            {uniqueCategories.map(cat => {
                                const catDisplay = getCategoryStyleMobile(cat, theme);
                                return <option key={cat} value={cat}>{catDisplay.emoji} {cat.charAt(0).toUpperCase() + cat.slice(1)}</option>;
                            })}
                        </select>
                    </div>
                     <button onClick={() => setActiveSheet('none')} className={`${buttonClass} save sheet full-width mt-2`}>Apply Filters</button>
                </>
            )}

            {deleteConfirmItem && ( 
                <div className="bucket-delete-confirm-sheet-cute">
                    <h4>Remove "{deleteConfirmItem.title}"?</h4>
                    <p>This aspiration will fade from the cosmos!</p>
                    <div className="bucket-sheet-actions-cute">
                        <button onClick={() => setDeleteConfirmItem(null)} className={`${buttonClass} cancel sheet`}>No, Keep It!</button>
                        <button onClick={handleDeleteItem} className={`${buttonClass} delete sheet`}>Yes, Let Go!</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {toast.visible && <div className={`${toastBaseClass} ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
