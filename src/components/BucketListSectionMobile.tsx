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

const getCategoryStyle = (category: string): { emoji: string, className: string } => {
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

  const [selectedItemForAction, setSelectedItemForAction] = useState<BucketListItem | null>(null);
  // Edit form states (used within bottom sheet)
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("adventure");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  // Simplified links for mobile edit:
  const [editLinkGeneral, setEditLinkGeneral] = useState("");


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
    .sort((a, b) => { // Simplified sort for mobile: pending first, then by date
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
    setNewItemTitle(""); setNewItemCategory("adventure"); setNewItemTargetDate(""); setNewItemNotes("");
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) { showToast("Adventure needs a name!", 'error'); return; }
    try {
      await addItem({ title: newItemTitle, category: newItemCategory, targetDate: newItemTargetDate||undefined, notes: newItemNotes||undefined, isCompleted: false });
      resetNewItemForm();
      setActiveSheet('none');
      showToast("New page added to diary! 📖");
    } catch (error) { console.error(error); showToast("Couldn't add new page.", 'error'); }
  };

  const openEditSheet = (item: BucketListItem) => {
    setSelectedItemForAction(item); // Use selectedItemForAction for edit context
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTargetDate(item.targetDate ? new Date(item.targetDate + 'T00:00:00').toISOString().split('T')[0] : "");
    setEditNotes(item.notes || "");
    // For mobile, maybe just one general link field for simplicity or pick the most common one
    setEditLinkGeneral(item.links?.website || item.links?.maps || item.links?.flights || "");
    setActiveSheet('edit');
  };

  const handleSaveEdit = async () => {
    if (!selectedItemForAction || !editTitle.trim()) { showToast("Adventure name can't be blank!", 'error'); return; }
    try {
        // Simplified links for mobile: assuming a primary link or website
      const links = editLinkGeneral ? { website: editLinkGeneral } : undefined;
      await updateItem({ id: selectedItemForAction._id, title: editTitle, category: editCategory, targetDate: editTargetDate||undefined, notes: editNotes||undefined, links });
      setActiveSheet('none');
      setSelectedItemForAction(null);
      showToast("Diary page updated! ✍️");
    } catch (error) { console.error(error); showToast("Couldn't update page.", 'error'); }
  };
  
  const openActionSheet = (item: BucketListItem) => {
    setSelectedItemForAction(item);
    setActiveSheet('actions');
  };

  const handleDeleteItem = async (_id: Id<"bucketList">) => {
    if (!deleteConfirmItem) return;
    try {
      await removeItem({ id: deleteConfirmItem._id });
      setDeleteConfirmItem(null);
      setActiveSheet('none'); 
      showToast("Page torn from diary. 💨");
    } catch (error) { console.error(error); showToast("Couldn't remove page.", 'error');}
  };
  
  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return "Anytime ✨";
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
    if (activeSheet !== 'none') document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSheet, deleteConfirmItem]);

  return (
    <div className="bucket-layout-mobile-adventurer">
      <header className="pocket-diary-header-cute">
        <h2>Our Adventures 💖</h2>
        <div className="pocket-diary-progress-cute">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{width: `${completionPercentage}%`}}></div>
          </div>
          <span>{completedItemsCount}/{totalItems} Done!</span>
        </div>
        <button onClick={() => setActiveSheet('filters')} className="pocket-diary-filter-btn-cute">
            <span role="img" aria-label="filter">🎨</span> Filters
        </button>
      </header>

      {filteredAndSortedList.length === 0 && activeSheet === 'none' && (
          <div className="pocket-diary-empty-state-cute">
            <span>📖</span>
            <p>Our diary is waiting for new adventures!</p>
          </div>
      )}

      <main className="pocket-diary-list-cute">
        {filteredAndSortedList.map(item => {
          const style = getCategoryStyle(item.category);
          return (
            <div 
              key={item._id} 
              className={`diary-page-card-cute ${style.className} ${item.isCompleted ? "completed" : ""}`}
              onClick={() => openActionSheet(item)}
            >
              <div className="card-top-row">
                <span className="card-emoji">{style.emoji}</span>
                <h3 className="card-title">{item.title}</h3>
                <button 
                    className={`card-checkbox ${item.isCompleted ? "checked" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleItem({ id: item._id, isCompleted: !item.isCompleted}); }}
                >
                    {item.isCompleted ? "✔" : ""}
                </button>
              </div>
              <p className="card-date">{formatDateForDisplay(item.targetDate)}</p>
              {item.notes && <p className="card-notes-preview">"{item.notes.substring(0, 40)}..."</p>}
              {item.isCompleted && <div className="card-completed-ribbon-cute">Done!</div>}
            </div>
          );
        })}
      </main>

      <button onClick={() => { resetNewItemForm(); setActiveSheet('add'); }} className="pocket-diary-fab-cute">✏️</button>

      {/* --- Bottom Sheets --- */}
      {activeSheet !== 'none' && (
        <div className="bucket-bottom-sheet-overlay-cute" onClick={() => { if (!deleteConfirmItem) { setActiveSheet('none'); setSelectedItemForAction(null);}}}>
          <div ref={bottomSheetRef} className="bucket-bottom-sheet-cute adventurer" onClick={e => e.stopPropagation()}>
            <div className="bucket-bottom-sheet-handle-cute"></div>

            {activeSheet === 'add' && (
              <>
                <h3 className="bucket-sheet-title-cute">New Diary Page ✨</h3>
                <form onSubmit={handleAddNewItem} className="bucket-sheet-form-cute compact">
                  <input type="text" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} placeholder="Adventure Title..." className="bucket-input-cute sheet"/>
                  <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="bucket-input-cute sheet">
                    {uniqueCategories.length === 0 && <option value="adventure">🏞️ Adventure</option> /* Default if no cats yet */}
                    {uniqueCategories.map(cat => <option key={cat} value={cat}>{getCategoryStyle(cat).emoji} {cat}</option>)}
                  </select>
                  <input type="date" value={newItemTargetDate} onChange={e => setNewItemTargetDate(e.target.value)} className="bucket-input-cute sheet"/>
                  <textarea value={newItemNotes} onChange={e => setNewItemNotes(e.target.value)} placeholder="A few notes..." className="bucket-textarea-cute sheet" rows={2}/>
                  <div className="bucket-sheet-actions-cute">
                    <button type="button" onClick={() => setActiveSheet('none')} className="bucket-button-cute cancel sheet">Cancel</button>
                    <button type="submit" className="bucket-button-cute add sheet">Add Page</button>
                  </div>
                </form>
              </>
            )}

            {activeSheet === 'edit' && selectedItemForAction && (
               <>
                <h3 className="bucket-sheet-title-cute">Edit Page ✏️</h3>
                <form onSubmit={(e) => {e.preventDefault(); handleSaveEdit();}} className="bucket-sheet-form-cute compact">
                  <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bucket-input-cute sheet"/>
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="bucket-input-cute sheet">
                     {uniqueCategories.map(cat => <option key={cat} value={cat}>{getCategoryStyle(cat).emoji} {cat}</option>)}
                  </select>
                  <input type="date" value={editTargetDate} onChange={e => setEditTargetDate(e.target.value)} className="bucket-input-cute sheet"/>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="bucket-textarea-cute sheet" rows={2}/>
                  <input type="url" value={editLinkGeneral} onChange={e => setEditLinkGeneral(e.target.value)} placeholder="🔗 Primary Link (Optional)" className="bucket-input-cute sheet"/>
                  <div className="bucket-sheet-actions-cute">
                    <button type="button" onClick={() => {setActiveSheet('actions'); /* Go back to actions */}} className="bucket-button-cute cancel sheet">Back</button>
                    <button type="submit" className="bucket-button-cute save sheet">Save</button>
                  </div>
                </form>
              </>
            )}
            
            {activeSheet === 'actions' && selectedItemForAction && (
                <>
                    <h3 className="bucket-sheet-title-cute compact">{selectedItemForAction.title}</h3>
                    <div className="bucket-sheet-action-list-cute">
                        <button onClick={() => { toggleItem({ id: selectedItemForAction._id, isCompleted: !selectedItemForAction.isCompleted }); setActiveSheet('none'); setSelectedItemForAction(null);}} className="bucket-action-list-item-cute">
                            {selectedItemForAction.isCompleted ? "✔️ Mark Pending" : "◻️ Mark Done"}
                        </button>
                        <button onClick={() => openEditSheet(selectedItemForAction)} className="bucket-action-list-item-cute">✏️ Edit Entry</button>
                         {/* Simplified link display for mobile actions */}
                        {selectedItemForAction.links?.website && <a href={selectedItemForAction.links.website} target="_blank" rel="noopener noreferrer" className="bucket-action-list-item-cute link">🔗 View Link</a>}
                        {!selectedItemForAction.links?.website && selectedItemForAction.links?.maps && <a href={selectedItemForAction.links.maps} target="_blank" rel="noopener noreferrer" className="bucket-action-list-item-cute link">📍 View Map</a>}
                        
                        <button onClick={() => setDeleteConfirmItem(selectedItemForAction)} className="bucket-action-list-item-cute delete">🗑️ Remove Entry</button>
                    </div>
                    <button onClick={() => setActiveSheet('none')} className="bucket-button-cute cancel sheet full-width mt-2">Close</button>
                </>
            )}

            {activeSheet === 'filters' && (
                <>
                    <h3 className="bucket-sheet-title-cute">Filter Adventures 🧭</h3>
                    <div className="bucket-sheet-form-cute compact">
                        <label>Status:</label>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="bucket-input-cute sheet">
                            <option value="all">All</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                        <label>Category:</label>
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bucket-input-cute sheet">
                            <option value="all">All Categories</option>
                            {uniqueCategories.map(cat => <option key={cat} value={cat}>{getCategoryStyle(cat).emoji} {cat}</option>)}
                        </select>
                    </div>
                     <button onClick={() => setActiveSheet('none')} className="bucket-button-cute save sheet full-width mt-2">Apply Filters</button>
                </>
            )}


            {deleteConfirmItem && selectedItemForAction && ( // Ensure selectedItemForAction is used for context
                <div className="bucket-delete-confirm-sheet-cute">
                    <h4>Remove "{selectedItemForAction.title}"?</h4>
                    <p>This page will be torn from our diary!</p>
                    <div className="bucket-sheet-actions-cute">
                        <button onClick={() => setDeleteConfirmItem(null)} className="bucket-button-cute cancel sheet">No, Keep!</button>
                        <button onClick={() => handleDeleteItem(selectedItemForAction._id)} className="bucket-button-cute delete sheet">Yes, Remove!</button>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {toast.visible && <div className={`bucket-toast-cute mobile ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}