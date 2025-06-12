import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Interface for a single bucket list item
interface BucketListItem {
  _id: Id<"bucketList">;
  title: string;
  category: string;
  targetDate?: string;
  isCompleted: boolean;
  links?: { flights?: string; airbnb?: string; maps?: string; tripadvisor?: string; website?: string; };
  notes?: string;
}

// Helper to get category-specific styles (emoji, class for color/icon)
const getCategoryStyle = (category: string): { emoji: string, className: string } => {
  switch (category) {
    case "adventure": return { emoji: "🏞️", className: "category-adventure" };
    case "travel": return { emoji: "✈️", className: "category-travel" };
    case "food": return { emoji: "🍕", className: "category-food" };
    case "milestone": return { emoji: "🏆", className: "category-milestone" };
    default: return { emoji: "💖", className: "category-other" };
  }
};

export default function BucketListSectionDesktop() {
  const firstInputRef = useRef<HTMLInputElement>(null);

  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  // State for filtering, sorting, and UI
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedItemId, setSelectedItemId] = useState<Id<"bucketList"> | null>(null);

  // Form states for adding and editing
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formState, setFormState] = useState({
      title: "", category: "adventure", targetDate: "",
      notes: "", website: "", maps: "", flights: "", airbnb: "", tripadvisor: ""
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<BucketListItem | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean; type: 'success' | 'error' }>({ message: "", visible: false, type: 'success' });

  // Memoized derived state
  const uniqueCategories = Array.from(new Set(bucketList.map(item => item.category)));
  
  const filteredList = bucketList.filter(item => {
      if (filterStatus !== "all" && (filterStatus === "completed") !== item.isCompleted) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
  }).sort((a, b) => new Date(b.targetDate || 0).getTime() - new Date(a.targetDate || 0).getTime());

  const selectedItem = filteredList.find(item => item._id === selectedItemId);

  // Effect to select the first item on load or when list changes
  useEffect(() => {
    if (!selectedItemId && filteredList.length > 0) {
      setSelectedItemId(filteredList[0]._id);
    }
  }, [filteredList, selectedItemId]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const resetForm = () => {
    setFormState({
        title: "", category: "adventure", targetDate: "",
        notes: "", website: "", maps: "", flights: "", airbnb: "", tripadvisor: ""
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setShowAddModal(true);
    setTimeout(() => firstInputRef.current?.focus(), 0);
  };

  const handleOpenEditMode = () => {
    if (!selectedItem) return;
    setFormState({
      title: selectedItem.title,
      category: selectedItem.category,
      targetDate: selectedItem.targetDate || "",
      notes: selectedItem.notes || "",
      website: selectedItem.links?.website || "",
      maps: selectedItem.links?.maps || "",
      flights: selectedItem.links?.flights || "",
      airbnb: selectedItem.links?.airbnb || "",
      tripadvisor: selectedItem.links?.tripadvisor || "",
    });
    setIsEditMode(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) {
      showToast("Every adventure needs a title!", 'error');
      return;
    }

    const payload = {
      title: formState.title,
      category: formState.category,
      targetDate: formState.targetDate || undefined,
      notes: formState.notes || undefined,
      links: {
        website: formState.website || undefined,
        maps: formState.maps || undefined,
        flights: formState.flights || undefined,
        airbnb: formState.airbnb || undefined,
        tripadvisor: formState.tripadvisor || undefined,
      }
    };

    try {
      if (isEditMode && selectedItem) {
        await updateItem({ id: selectedItem._id, ...payload });
        showToast("Adventure updated! 📜");
        setIsEditMode(false);
      } else {
        await addItem({ ...payload, isCompleted: false });
        showToast("New adventure charted! 🗺️");
        setShowAddModal(false);
      }
    } catch (error) {
      console.error(error);
      showToast("Couldn't save this adventure.", 'error');
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    try {
      await removeItem({ id: showDeleteConfirm._id });
      showToast("Adventure removed from the map.", 'success');
      if (selectedItemId === showDeleteConfirm._id) {
        setSelectedItemId(null);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error(error);
      showToast("This adventure is holding on tight!", 'error');
    }
  };

  return (
    <div className="bucket-list-artistic-layout">
      {/* Left Panel: Master List of Adventures */}
      <div className="quest-list-panel-artistic">
        <header className="quest-list-header-artistic">
          <h3>Adventure Almanac</h3>
          <button onClick={handleOpenAddModal} className="quest-list-add-btn-artistic" title="Add New Adventure">
            ✨
          </button>
        </header>

        <div className="quest-list-filters-artistic">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{getCategoryStyle(cat).emoji} {cat}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <ul className="quest-list-scroll-area-artistic">
          {filteredList.map(item => (
            <li key={item._id}>
              <button
                onClick={() => setSelectedItemId(item._id)}
                className={`quest-list-item-artistic ${selectedItemId === item._id ? 'active' : ''} ${item.isCompleted ? 'completed' : ''}`}
              >
                <span className="quest-item-icon-artistic">{getCategoryStyle(item.category).emoji}</span>
                <span className="quest-item-title-artistic">{item.title}</span>
                {item.isCompleted && <span className="quest-item-status-artistic">✔️</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Right Panel: Detail View of Selected Adventure */}
      <div className="quest-detail-view-artistic">
        {selectedItem ? (
          isEditMode ? (
            // EDIT MODE
            <form onSubmit={handleFormSubmit} className="quest-detail-form-artistic">
              <input ref={firstInputRef} type="text" value={formState.title} onChange={e => setFormState(p => ({...p, title: e.target.value}))} placeholder="Adventure Title" className="quest-form-input-artistic title" />
              <select value={formState.category} onChange={e => setFormState(p => ({...p, category: e.target.value}))} className="quest-form-input-artistic">
                {uniqueCategories.map(cat => <option key={cat} value={cat}>{getCategoryStyle(cat).emoji} {cat}</option>)}
              </select>
              <input type="date" value={formState.targetDate} onChange={e => setFormState(p => ({...p, targetDate: e.target.value}))} className="quest-form-input-artistic" />
              <textarea value={formState.notes} onChange={e => setFormState(p => ({...p, notes: e.target.value}))} placeholder="Secret plans and notes..." className="quest-form-textarea-artistic" />
              <div className="quest-form-links-grid-artistic">
                <input type="url" value={formState.website} onChange={e => setFormState(p => ({...p, website: e.target.value}))} placeholder="🌐 Website" />
                <input type="url" value={formState.maps} onChange={e => setFormState(p => ({...p, maps: e.target.value}))} placeholder="📍 Maps" />
                <input type="url" value={formState.flights} onChange={e => setFormState(p => ({...p, flights: e.target.value}))} placeholder="✈️ Flights" />
                <input type="url" value={formState.airbnb} onChange={e => setFormState(p => ({...p, airbnb: e.target.value}))} placeholder="🏠 Stays" />
              </div>
              <div className="quest-detail-actions-artistic">
                <button type="button" onClick={() => setIsEditMode(false)} className="quest-action-btn-artistic secondary">Cancel</button>
                <button type="submit" className="quest-action-btn-artistic primary">Save Changes</button>
              </div>
            </form>
          ) : (
            // VIEW MODE
            <div className="quest-detail-content-artistic">
              <header className="quest-detail-header-artistic">
                <span className="quest-detail-icon-artistic">{getCategoryStyle(selectedItem.category).emoji}</span>
                <div>
                  <h2>{selectedItem.title}</h2>
                  <p>{selectedItem.targetDate || "Whenever our hearts desire"}</p>
                </div>
              </header>
              {selectedItem.notes && (
                <div className="quest-detail-section-artistic">
                  <h4>Our Secret Plans 🤫</h4>
                  <p>{selectedItem.notes}</p>
                </div>
              )}
              {Object.values(selectedItem.links || {}).some(link => link) && (
                <div className="quest-detail-section-artistic">
                  <h4>Helpful Scrolls 📜</h4>
                  <div className="quest-detail-links-artistic">
                    {selectedItem.links?.website && <a href={selectedItem.links.website} target="_blank" rel="noopener noreferrer">🌐 Website</a>}
                    {selectedItem.links?.maps && <a href={selectedItem.links.maps} target="_blank" rel="noopener noreferrer">📍 Google Maps</a>}
                    {selectedItem.links?.flights && <a href={selectedItem.links.flights} target="_blank" rel="noopener noreferrer">✈️ Flights</a>}
                    {selectedItem.links?.airbnb && <a href={selectedItem.links.airbnb} target="_blank" rel="noopener noreferrer">🏠 Airbnb</a>}
                  </div>
                </div>
              )}
              <footer className="quest-detail-actions-artistic">
                 <button onClick={() => toggleItem({ id: selectedItem._id, isCompleted: !selectedItem.isCompleted })} className={`quest-action-btn-artistic ${selectedItem.isCompleted ? 'secondary' : 'primary'}`}>
                  {selectedItem.isCompleted ? 'Mark as Pending' : 'Mark Complete!'}
                </button>
                <button onClick={handleOpenEditMode} className="quest-action-btn-artistic">Edit</button>
                <button onClick={() => setShowDeleteConfirm(selectedItem)} className="quest-action-btn-artistic danger">Delete</button>
              </footer>
            </div>
          )
        ) : (
          <div className="quest-detail-empty-state-artistic">
            <span>🗺️</span>
            <h3>Select an Adventure</h3>
            <p>Pick a quest from the list to see the details, or add a new one!</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="quest-form-modal-overlay-artistic" onClick={() => setShowAddModal(false)}>
          <form onSubmit={handleFormSubmit} className="quest-form-modal-content-artistic" onClick={e => e.stopPropagation()}>
             <h3>Chart a New Adventure!</h3>
             <p>Let's add something new and exciting to our special list.</p>
             <div className="quest-modal-form-fields-artistic">
                <input ref={firstInputRef} type="text" value={formState.title} onChange={e => setFormState(p => ({...p, title: e.target.value}))} placeholder="What's the adventure?" required />
                <select value={formState.category} onChange={e => setFormState(p => ({...p, category: e.target.value}))}>
                  <option value="adventure">🏞️ Adventure</option>
                  <option value="travel">✈️ Travel</option>
                  <option value="food">🍕 Food</option>
                  <option value="milestone">🏆 Milestone</option>
                  <option value="other">💖 Other</option>
                </select>
                <input type="date" value={formState.targetDate} onChange={e => setFormState(p => ({...p, targetDate: e.target.value}))}/>
             </div>
             <div className="quest-modal-actions-artistic">
                <button type="button" onClick={() => setShowAddModal(false)} className="secondary">Cancel</button>
                <button type="submit" className="primary">Add to Map</button>
             </div>
          </form>
        </div>
      )}

       {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="quest-form-modal-overlay-artistic" onClick={() => setShowDeleteConfirm(null)}>
            <div className="quest-form-modal-content-artistic danger-confirm" onClick={e => e.stopPropagation()}>
                <h3>Erase this Adventure?</h3>
                <p>Are you sure you want to remove "{showDeleteConfirm.title}" from our almanac forever?</p>
                <div className="quest-modal-actions-artistic">
                    <button onClick={() => setShowDeleteConfirm(null)} className="secondary">No, Keep It</button>
                    <button onClick={handleDelete} className="danger">Yes, Erase</button>
                </div>
            </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && <div className={`bucket-toast-cute ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}