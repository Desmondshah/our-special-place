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
  const bottomSheetRef = useRef<HTMLDivElement>(null);

  const bucketList = useQuery(api.bucketList.list) || [];
  const addItem = useMutation(api.bucketList.add);
  const updateItem = useMutation(api.bucketList.update);
  const toggleItem = useMutation(api.bucketList.toggle);
  const removeItem = useMutation(api.bucketList.remove);

  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "pending"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeSheet, setActiveSheet] = useState<
    "none" | "add" | "edit" | "actions" | "filters"
  >("none");

  
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("adventure");
  const [newItemTargetDate, setNewItemTargetDate] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");

  const [selectedItemForAction, setSelectedItemForAction] =
    useState<BucketListItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("adventure");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLinkGeneral, setEditLinkGeneral] = useState("");

  const [deleteConfirmItem, setDeleteConfirmItem] =
    useState<BucketListItem | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    type: "success" | "error";
  }>({
    message: "",
    visible: false,
    type: "success",
  });

  const totalItems = bucketList.length;
  const completedItemsCount = bucketList.filter(
    (item) => item.isCompleted,
  ).length;
  const completionPercentage = totalItems
    ? Math.round((completedItemsCount / totalItems) * 100)
    : 0;
  const uniqueCategories = Array.from(
    new Set(bucketList.map((item) => item.category)),
  );

  const filteredAndSortedList = bucketList
    .filter((item) => {
      if (filterStatus === "completed" && !item.isCompleted) return false;
      if (filterStatus === "pending" && item.isCompleted) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter)
        return false;
      return true;
    })
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      const dateA = a.targetDate
        ? new Date(a.targetDate + "T00:00:00").getTime()
        : Infinity;
      const dateB = b.targetDate
        ? new Date(b.targetDate + "T00:00:00").getTime()
        : Infinity;
      return dateA - dateB;
    });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const resetNewItemForm = () => {
    setNewItemTitle("");
    setNewItemCategory("adventure");
    setNewItemTargetDate("");
    setNewItemNotes("");
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) {
      showToast("Adventure needs a name!", "error");
      return;
    }
    try {
      await addItem({
        title: newItemTitle,
        category: newItemCategory,
        targetDate: newItemTargetDate || undefined,
        notes: newItemNotes || undefined,
        isCompleted: false,
      });
      resetNewItemForm();
      setActiveSheet("none");
      showToast("Adventure added! 🎯");
    } catch (error) {
      console.error(error);
      showToast("Couldn't add adventure.", "error");
    }
  };

  const openEditSheet = (item: BucketListItem) => {
    setSelectedItemForAction(item);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditTargetDate(
      item.targetDate
        ? new Date(item.targetDate + "T00:00:00").toISOString().split("T")[0]
        : "",
    );
    setEditNotes(item.notes || "");
    setEditLinkGeneral(
      item.links?.website || item.links?.maps || item.links?.flights || "",
    );
    setActiveSheet("edit");
  };

  const handleSaveEdit = async () => {
    if (!selectedItemForAction || !editTitle.trim()) {
      showToast("Adventure name can't be blank!", "error");
      return;
    }
    try {
      const links = editLinkGeneral ? { website: editLinkGeneral } : undefined;
      await updateItem({
        id: selectedItemForAction._id,
        title: editTitle,
        category: editCategory,
        targetDate: editTargetDate || undefined,
        notes: editNotes || undefined,
        links,
      });
      setActiveSheet("none");
      setSelectedItemForAction(null);
      showToast("Adventure updated! ✨");
    } catch (error) {
      console.error(error);
      showToast("Couldn't update adventure.", "error");
    }
  };

  const openActionSheet = (item: BucketListItem) => {
    setSelectedItemForAction(item);
    setActiveSheet("actions");
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return;
    try {
      await removeItem({ id: deleteConfirmItem._id });
      setDeleteConfirmItem(null);
      setActiveSheet("none");
      showToast("Adventure removed! 💨");
    } catch (error) {
      console.error(error);
      showToast("Couldn't remove adventure.", "error");
    }
  };

  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return "Anytime";
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterStatus !== "all") count++;
    if (categoryFilter !== "all") count++;
    return count;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
       if (
        bottomSheetRef.current &&
        !bottomSheetRef.current.contains(event.target as Node)
      ) {
        if (
          activeSheet !== "none" &&
          activeSheet !== "filters" &&
          !deleteConfirmItem
        ) {
          setActiveSheet("none");
          setSelectedItemForAction(null);
        }
      }
    };
    if (activeSheet !== "none" && activeSheet !== "filters")
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeSheet, deleteConfirmItem]);

  return (
    <div className="mobile-bucket-list-pixel">
      {/* Header */}
      <div className="mobile-bucket-header">
        <div className="header-top">
          <h1 className="bucket-title-pixel">Adventure List</h1>
          <button
            onClick={() => setActiveSheet("filters")}
            className="filter-button-pixel"
          >
            <span className="filter-icon">⚡</span>
            {getActiveFiltersCount() > 0 && (
              <span className="filter-badge">{getActiveFiltersCount()}</span>
            )}
          </button>
        </div>

        <div className="progress-section">
          <div className="progress-stats">
            <span className="progress-text">
              {completedItemsCount}/{totalItems} Complete
            </span>
            <span className="progress-percentage">{completionPercentage}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Adventure List */}
      <div className="adventure-list-container">
        {filteredAndSortedList.length === 0 ? (
          <div className="empty-state-pixel">
            <div className="empty-icon">🎯</div>
            <h3>No Adventures Yet!</h3>
            <p>Start your pixel adventure by adding your first goal</p>
          </div>
        ) : (
          <div className="adventure-list">
            {filteredAndSortedList.map((item, index) => {
              const style = getCategoryStyle(item.category);
              return (
                <div
                  key={item._id}
                  className={`adventure-card-pixel ${style.className} ${item.isCompleted ? "completed" : ""}`}
                  onClick={() => openActionSheet(item)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="card-header">
                    <div className="card-icon">{style.emoji}</div>
                    <div className="card-content">
                      <h3 className="card-title">{item.title}</h3>
                      <div className="card-meta">
                        <span className="card-date">
                          {formatDateForDisplay(item.targetDate)}
                        </span>
                        <span className="card-category">{item.category}</span>
                      </div>
                    </div>
                    <button
                      className={`completion-toggle ${item.isCompleted ? "completed" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItem({
                          id: item._id,
                          isCompleted: !item.isCompleted,
                        });
                      }}
                    >
                      {item.isCompleted ? "✓" : ""}
                    </button>
                  </div>

                  {item.notes && (
                    <div className="card-notes">
                      {item.notes.substring(0, 60)}...
                    </div>
                  )}

                  {item.isCompleted && (
                    <div className="completed-badge">DONE</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        onClick={() => {
          resetNewItemForm();
          setActiveSheet("add");
        }}
        className="add-fab-pixel"
      >
        +
      </button>

      {/* Filter Modal */}
      {activeSheet === "filters" && (
        <div
          className="filter-modal-overlay"
          onClick={() => setActiveSheet("none")}
        >
          <div
            className="filter-modal-pixel modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="sheet-title">Filter Adventures</h3>
            <div className="filter-section">
              <h4 className="filter-label">Status</h4>
              <div className="filter-group">
                {(["all", "pending", "completed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`filter-chip ${filterStatus === status ? "active" : ""}`}
                  >
                    {status === "all"
                      ? "All"
                      : status === "pending"
                        ? "Pending"
                        : "Completed"}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4 className="filter-label">Category</h4>
              <div className="filter-group">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`filter-chip ${categoryFilter === "all" ? "active" : ""}`}
                >
                  All Categories
                </button>
                {uniqueCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`filter-chip ${categoryFilter === cat ? "active" : ""}`}
                  >
                    {getCategoryStyle(cat).emoji} {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveSheet("none")}
              className="button-pixel primary full-width apply-filters-btn"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheets */}
      {activeSheet !== "none" && activeSheet !== "filters" && (
        <div
          className="bottom-sheet-overlay"
          onClick={() => {
            if (!deleteConfirmItem) {
              setActiveSheet("none");
              setSelectedItemForAction(null);
            }
          }}
        >
          <div
            ref={bottomSheetRef}
            className="bottom-sheet-pixel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle"></div>

            {/* Add Adventure Sheet */}
            {activeSheet === "add" && (
              <div className="sheet-content">
                <h3 className="sheet-title">New Adventure</h3>
                <form onSubmit={handleAddNewItem} className="adventure-form">
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Adventure title..."
                    className="form-input-pixel"
                  />
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="form-select-pixel"
                  >
                    <option value="adventure">🏞️ Adventure</option>
                    <option value="travel">✈️ Travel</option>
                    <option value="food">🍕 Food</option>
                    <option value="milestone">🏆 Milestone</option>
                  </select>
                  <input
                    type="date"
                    value={newItemTargetDate}
                    onChange={(e) => setNewItemTargetDate(e.target.value)}
                    className="form-input-pixel"
                  />
                  <textarea
                    value={newItemNotes}
                    onChange={(e) => setNewItemNotes(e.target.value)}
                    placeholder="Notes (optional)..."
                    className="form-textarea-pixel"
                    rows={3}
                  />
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setActiveSheet("none")}
                      className="button-pixel secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="button-pixel primary">
                      Add Adventure
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Adventure Sheet */}
            {activeSheet === "edit" && selectedItemForAction && (
              <div className="sheet-content">
                <h3 className="sheet-title">Edit Adventure</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEdit();
                  }}
                  className="adventure-form"
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="form-input-pixel"
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="form-select-pixel"
                  >
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {getCategoryStyle(cat).emoji} {cat}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="form-input-pixel"
                  />
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="form-textarea-pixel"
                    rows={3}
                    placeholder="Notes..."
                  />
                  <input
                    type="url"
                    value={editLinkGeneral}
                    onChange={(e) => setEditLinkGeneral(e.target.value)}
                    placeholder="Link (optional)"
                    className="form-input-pixel"
                  />
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => setActiveSheet("actions")}
                      className="button-pixel secondary"
                    >
                      Back
                    </button>
                    <button type="submit" className="button-pixel primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Actions Sheet */}
            {activeSheet === "actions" && selectedItemForAction && (
              <div className="sheet-content">
                <h3 className="sheet-title">{selectedItemForAction.title}</h3>
                <div className="action-list">
                  <button
                    onClick={() => {
                      toggleItem({
                        id: selectedItemForAction._id,
                        isCompleted: !selectedItemForAction.isCompleted,
                      });
                      setActiveSheet("none");
                      setSelectedItemForAction(null);
                    }}
                    className="action-button-pixel"
                  >
                    <span className="action-icon">
                      {selectedItemForAction.isCompleted ? "↺" : "✓"}
                    </span>
                    <span className="action-text">
                      {selectedItemForAction.isCompleted
                        ? "Mark Pending"
                        : "Mark Complete"}
                    </span>
                  </button>

                  <button
                    onClick={() => openEditSheet(selectedItemForAction)}
                    className="action-button-pixel"
                  >
                    <span className="action-icon">✏️</span>
                    <span className="action-text">Edit Adventure</span>
                  </button>

                  {selectedItemForAction.links?.website && (
                    <a
                      href={selectedItemForAction.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-button-pixel link"
                    >
                      <span className="action-icon">🔗</span>
                      <span className="action-text">Open Link</span>
                    </a>
                  )}

                  <button
                    onClick={() => setDeleteConfirmItem(selectedItemForAction)}
                    className="action-button-pixel danger"
                  >
                    <span className="action-icon">🗑️</span>
                    <span className="action-text">Delete Adventure</span>
                  </button>
                </div>

                <button
                  onClick={() => setActiveSheet("none")}
                  className="button-pixel secondary full-width"
                >
                  Close
                </button>
              </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirmItem && (
              <div className="sheet-content">
                <h3 className="sheet-title danger">Delete Adventure?</h3>
                <p className="delete-warning">
                  Are you sure you want to delete "{deleteConfirmItem.title}"?
                  This cannot be undone.
                </p>
                <div className="form-actions">
                  <button
                    onClick={() => setDeleteConfirmItem(null)}
                    className="button-pixel secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteItem}
                    className="button-pixel danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`toast-pixel ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}