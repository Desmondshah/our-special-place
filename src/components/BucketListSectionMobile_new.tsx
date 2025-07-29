import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import "./BucketListSection.brutal-pixel.css";

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

const getCategoryStyle = (
  category: string,
): { emoji: string; className: string } => {
  switch (category) {
    case "adventure":
      return { emoji: "🏞️", className: "category-adventure" };
    case "travel":
      return { emoji: "✈️", className: "category-travel" };
    case "food":
      return { emoji: "🍕", className: "category-food" };
    case "milestone":
      return { emoji: "🏆", className: "category-milestone" };
    default:
      return { emoji: "💖", className: "category-other" };
  }
};

export default function BucketListSectionMobile() {
  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeSheet, setActiveSheet] = useState<"none" | "add" | "edit" | "actions">("none");
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("adventure");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newFlightLink, setNewFlightLink] = useState("");
  const [newAirbnbLink, setNewAirbnbLink] = useState("");
  const [newMapsLink, setNewMapsLink] = useState("");
  const [newTripAdvisorLink, setNewTripAdvisorLink] = useState("");
  const [newWebsiteLink, setNewWebsiteLink] = useState("");

  // Edit states
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editFlightLink, setEditFlightLink] = useState("");
  const [editAirbnbLink, setEditAirbnbLink] = useState("");
  const [editMapsLink, setEditMapsLink] = useState("");
  const [editTripAdvisorLink, setEditTripAdvisorLink] = useState("");
  const [editWebsiteLink, setEditWebsiteLink] = useState("");

  const [selectedItemForAction, setSelectedItemForAction] = useState<BucketListItem | null>(null);

  // Computed values
  const totalItems = bucketList.length;
  const completedItemsCount = bucketList.filter(item => item.isCompleted).length;
  const completionPercentage = totalItems > 0 ? Math.round((completedItemsCount / totalItems) * 100) : 0;

  const uniqueCategories = Array.from(new Set(bucketList.map(item => item.category)));

  // Filtering and sorting
  const filteredAndSortedList = bucketList
    .filter(item => {
      if (filterStatus === "completed") return item.isCompleted;
      if (filterStatus === "pending") return !item.isCompleted;
      return true;
    })
    .filter(item => {
      if (categoryFilter === "all") return true;
      return item.category === categoryFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === "category") {
        comparison = a.category.localeCompare(b.category);
      } else if (sortBy === "date") {
        const dateA = a.targetDate ? new Date(a.targetDate).getTime() : 0;
        const dateB = b.targetDate ? new Date(b.targetDate).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Helper functions
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const resetAddForm = () => {
    setNewTitle("");
    setNewCategory("adventure");
    setNewTargetDate("");
    setNewNotes("");
    setNewFlightLink("");
    setNewAirbnbLink("");
    setNewMapsLink("");
    setNewTripAdvisorLink("");
    setNewWebsiteLink("");
  };

  const resetEditForm = () => {
    setEditingItem(null);
    setEditTitle("");
    setEditCategory("");
    setEditTargetDate("");
    setEditNotes("");
    setEditFlightLink("");
    setEditAirbnbLink("");
    setEditMapsLink("");
    setEditTripAdvisorLink("");
    setEditWebsiteLink("");
  };

  // Actions
  const handleAddItem = async () => {
    if (!newTitle.trim()) return;

    const links: any = {};
    if (newFlightLink) links.flights = newFlightLink;
    if (newAirbnbLink) links.airbnb = newAirbnbLink;
    if (newMapsLink) links.maps = newMapsLink;
    if (newTripAdvisorLink) links.tripadvisor = newTripAdvisorLink;
    if (newWebsiteLink) links.website = newWebsiteLink;

    await addItem({
      title: newTitle.trim(),
      category: newCategory,
      isCompleted: false,
      targetDate: newTargetDate || undefined,
      notes: newNotes || undefined,
      links: Object.keys(links).length > 0 ? links : undefined,
    });

    resetAddForm();
    setActiveSheet("none");
  };

  const handleEditItem = async () => {
    if (!editingItem || !editTitle.trim()) return;

    const links: any = {};
    if (editFlightLink) links.flights = editFlightLink;
    if (editAirbnbLink) links.airbnb = editAirbnbLink;
    if (editMapsLink) links.maps = editMapsLink;
    if (editTripAdvisorLink) links.tripadvisor = editTripAdvisorLink;
    if (editWebsiteLink) links.website = editWebsiteLink;

    await updateItem({
      id: editingItem._id,
      title: editTitle.trim(),
      category: editCategory,
      targetDate: editTargetDate || undefined,
      notes: editNotes || undefined,
      links: Object.keys(links).length > 0 ? links : undefined,
    });

    resetEditForm();
    setActiveSheet("none");
  };

  const handleToggleComplete = async (item: BucketListItem) => {
    await toggleItem({ id: item._id, isCompleted: !item.isCompleted });
  };

  const handleDeleteItem = async (item: BucketListItem) => {
    await removeItem({ id: item._id });
    setSelectedItemForAction(null);
    setActiveSheet("none");
  };

  const openItemActions = (item: BucketListItem) => {
    setSelectedItemForAction(item);
    setActiveSheet("actions");
  };

  const openEditSheet = (item: BucketListItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTargetDate(item.targetDate || "");
    setEditNotes(item.notes || "");
    setEditFlightLink(item.links?.flights || "");
    setEditAirbnbLink(item.links?.airbnb || "");
    setEditMapsLink(item.links?.maps || "");
    setEditTripAdvisorLink(item.links?.tripadvisor || "");
    setEditWebsiteLink(item.links?.website || "");
    setActiveSheet("edit");
  };

  return (
    <div className="bucket-mobile-layout-brutal">
      {/* MOBILE HEADER - REVAMPED */}
      <header className="mobile-header-brutal">
        <div className="mobile-header-content">
          <h1 className="mobile-header-title">🗡️ QUEST ARCHIVE</h1>
          <div className="mobile-progress-bar">
            <div
              className="mobile-progress-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="mobile-stats-row">
            <div className="mobile-stat-chip">
              ⚔️ {completedItemsCount}/{totalItems}
            </div>
            <div className="mobile-stat-chip">
              🔥 {completionPercentage}%
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE FILTER BAR - HORIZONTAL SCROLL */}
      <section className="mobile-filters-brutal">
        <div className="mobile-filters-scroll">
          <button
            onClick={() => setFilterStatus("all")}
            className={`mobile-filter-chip ${filterStatus === "all" ? "active" : ""}`}
          >
            🌍 ALL
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`mobile-filter-chip ${filterStatus === "pending" ? "active" : ""}`}
          >
            🔥 ACTIVE
          </button>
          <button
            onClick={() => setFilterStatus("completed")}
            className={`mobile-filter-chip ${filterStatus === "completed" ? "active" : ""}`}
          >
            ✅ DONE
          </button>
          <div style={{ width: "2px", background: "var(--brutal-black)", margin: "0 8px" }} />
          <button
            onClick={() => setCategoryFilter("all")}
            className={`mobile-filter-chip ${categoryFilter === "all" ? "active" : ""}`}
          >
            🎯 ALL TYPES
          </button>
          {uniqueCategories.map(cat => {
            const style = getCategoryStyle(cat);
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`mobile-filter-chip ${categoryFilter === cat ? "active" : ""}`}
              >
                {style.emoji} {cat.toUpperCase()}
              </button>
            );
          })}
        </div>
      </section>

      {/* MOBILE CONTENT - VERTICAL STACK */}
      <main className="mobile-content-brutal">
        {filteredAndSortedList.length === 0 ? (
          <div className="mobile-empty-state-brutal">
            <span className="icon">🗺️</span>
            <h2>ARCHIVE IS EMPTY!</h2>
            <p>⚔️ Time to start your legend! ⚔️</p>
            <button 
              onClick={() => setActiveSheet("add")}
              className="mobile-empty-cta-brutal"
            >
              ✨ CREATE FIRST QUEST ✨
            </button>
          </div>
        ) : (
          <div className="mobile-quest-grid-brutal">
            {filteredAndSortedList.map((item) => {
              const style = getCategoryStyle(item.category);
              return (
                <div
                  key={item._id}
                  className={`mobile-quest-card-brutal ${style.className} ${item.isCompleted ? "completed" : ""}`}
                  onClick={() => openItemActions(item)}
                >
                  {item.isCompleted && (
                    <div className="mobile-quest-completed-badge-brutal">⚔️ DONE!</div>
                  )}
                  <div className="mobile-quest-header-brutal">
                    <div className="mobile-quest-icon-brutal">
                      <span>{style.emoji}</span>
                    </div>
                    <h3 className="mobile-quest-title-brutal">{item.title}</h3>
                  </div>
                  {item.targetDate && (
                    <div className="mobile-quest-date-brutal">
                      📅 {formatDateForDisplay(item.targetDate)}
                    </div>
                  )}
                  {item.notes && (
                    <div className="mobile-quest-notes-brutal">
                      📝 {item.notes.substring(0, 50)}{item.notes.length > 50 ? "..." : ""}
                    </div>
                  )}
                  <div className="mobile-quest-category-brutal">
                    {item.category.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING ACTION BUTTON */}
      <div className="mobile-fab-area">
        <button
          onClick={() => setActiveSheet("add")}
          className="mobile-fab-brutal"
        >
          ⚡ NEW QUEST
        </button>
      </div>

      {/* BOTTOM SHEETS */}
      {activeSheet !== "none" && (
        <div className="mobile-sheet-overlay-brutal" onClick={() => setActiveSheet("none")}>
          <div className="mobile-sheet-brutal" onClick={(e) => e.stopPropagation()}>
            
            {/* ADD SHEET */}
            {activeSheet === "add" && (
              <div className="mobile-sheet-content-brutal">
                <div className="mobile-sheet-header-brutal">
                  <h2>✨ CREATE NEW QUEST</h2>
                  <button onClick={() => setActiveSheet("none")} className="mobile-sheet-close-brutal">✕</button>
                </div>
                <div className="mobile-sheet-body-brutal">
                  <div className="mobile-form-group-brutal">
                    <label>Quest Title:</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Enter your epic quest..."
                      className="mobile-form-input-brutal"
                    />
                  </div>
                  <div className="mobile-form-group-brutal">
                    <label>Category:</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="mobile-form-select-brutal"
                    >
                      <option value="adventure">🏞️ Adventure</option>
                      <option value="travel">✈️ Travel</option>
                      <option value="food">🍕 Food</option>
                      <option value="milestone">🏆 Milestone</option>
                    </select>
                  </div>
                  <div className="mobile-form-group-brutal">
                    <label>Target Date:</label>
                    <input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="mobile-form-input-brutal"
                    />
                  </div>
                  <div className="mobile-form-group-brutal">
                    <label>Notes:</label>
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Add some details..."
                      className="mobile-form-textarea-brutal"
                    />
                  </div>
                  <div className="mobile-form-actions-brutal">
                    <button onClick={handleAddItem} className="mobile-form-submit-brutal">
                      ⚡ CREATE QUEST
                    </button>
                    <button onClick={() => setActiveSheet("none")} className="mobile-form-cancel-brutal">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT SHEET */}
            {activeSheet === "edit" && editingItem && (
              <div className="mobile-sheet-content-brutal">
                <div className="mobile-sheet-header-brutal">
                  <h2>✏️ EDIT QUEST</h2>
                  <button onClick={() => setActiveSheet("none")} className="mobile-sheet-close-brutal">✕</button>
                </div>
                <div className="mobile-sheet-body-brutal">
                  <div className="mobile-form-group-brutal">
                    <label>Quest Title:</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mobile-form-input-brutal"
                    />
                  </div>
                  <div className="mobile-form-group-brutal">
                    <label>Category:</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="mobile-form-select-brutal"
                    >
                      <option value="adventure">🏞️ Adventure</option>
                      <option value="travel">✈️ Travel</option>
                      <option value="food">🍕 Food</option>
                      <option value="milestone">🏆 Milestone</option>
                    </select>
                  </div>
                  <div className="mobile-form-group-brutal">
                    <label>Target Date:</label>
                    <input
                      type="date"
                      value={editTargetDate}
                      onChange={(e) => setEditTargetDate(e.target.value)}
                      className="mobile-form-input-brutal"
                    />
                  </div>
                  <div className="mobile-form-group-brutal">
                    <label>Notes:</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="mobile-form-textarea-brutal"
                    />
                  </div>
                  <div className="mobile-form-actions-brutal">
                    <button onClick={handleEditItem} className="mobile-form-submit-brutal">
                      💾 SAVE CHANGES
                    </button>
                    <button onClick={() => setActiveSheet("none")} className="mobile-form-cancel-brutal">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIONS SHEET */}
            {activeSheet === "actions" && selectedItemForAction && (
              <div className="mobile-sheet-content-brutal">
                <div className="mobile-sheet-header-brutal">
                  <h2>⚡ QUEST ACTIONS</h2>
                  <button onClick={() => setActiveSheet("none")} className="mobile-sheet-close-brutal">✕</button>
                </div>
                <div className="mobile-sheet-body-brutal">
                  <div className="mobile-quest-preview-brutal">
                    <div className={`mobile-preview-icon-brutal ${getCategoryStyle(selectedItemForAction.category).className}`}>
                      {getCategoryStyle(selectedItemForAction.category).emoji}
                    </div>
                    <h3>{selectedItemForAction.title}</h3>
                  </div>
                  <div className="mobile-actions-grid-brutal">
                    <button
                      onClick={() => handleToggleComplete(selectedItemForAction)}
                      className={`mobile-action-btn-brutal ${selectedItemForAction.isCompleted ? "uncomplete" : "complete"}`}
                    >
                      {selectedItemForAction.isCompleted ? "🔄 MARK PENDING" : "✅ MARK DONE"}
                    </button>
                    <button
                      onClick={() => openEditSheet(selectedItemForAction)}
                      className="mobile-action-btn-brutal edit"
                    >
                      ✏️ EDIT QUEST
                    </button>
                    <button
                      onClick={() => handleDeleteItem(selectedItemForAction)}
                      className="mobile-action-btn-brutal delete"
                    >
                      🗑️ DELETE QUEST
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
