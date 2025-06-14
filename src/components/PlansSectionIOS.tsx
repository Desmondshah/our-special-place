import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Define TypeScript interfaces for our data structures
interface Memory {
  photos: string[];
  rating: number;
  notes: string[];
  createdAt: string;
}

interface Plan {
  _id: Id<"plans">;
  title: string;
  date: string;
  type: string;
  website?: string;
  mapsLink?: string;
  isCompleted: boolean;
  memory?: Memory;
}

export default function PlansSectionIOS() {
  const plans = useQuery(api.plans.list) || [] as Plan[];
  const addPlan = useMutation(api.plans.add);
  const updatePlan = useMutation(api.plans.update);
  const togglePlan = useMutation(api.plans.toggle);
  const removePlan = useMutation(api.plans.remove);
  const addMemory = useMutation(api.plans.addMemory);

  // State for filters
  const [viewFilter, setViewFilter] = useState<string>("all");
  
  // State for new plan
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [type, setType] = useState<string>("date");
  const [website, setWebsite] = useState<string>("");
  const [mapsLink, setMapsLink] = useState<string>("");

  // State for editing
  const [editingPlan, setEditingPlan] = useState<Id<"plans"> | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editType, setEditType] = useState<string>("");
  const [editWebsite, setEditWebsite] = useState<string>("");
  const [editMapsLink, setEditMapsLink] = useState<string>("");

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize with current date if empty
  useEffect(() => {
    if (!date) setDate(getCurrentDate());
  }, [date]);

  const getTypeEmoji = (type: string): string => {
    const emojis: { [key: string]: string } = {
      'date': '💖',
      'trip': '✈️',
      'activity': '🎉',
      'celebration': '🥳',
      'other': '🌟'
    };
    return emojis[type] || '✨';
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleString('default', { weekday: 'short' }).toUpperCase()
    };
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      alert("Title and Date are required!");
      return;
    }
    try {
      await addPlan({
        title,
        date, 
        type,
        website: website || undefined,
        mapsLink: mapsLink || undefined,
        isCompleted: false
      });
      setTitle("");
      setDate(getCurrentDate());
      setType("date");
      setWebsite("");
      setMapsLink("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add plan:", error);
      alert("Error adding plan. Please try again.");
    }
  };

  const startEditing = (plan: Plan) => {
    setEditingPlan(plan._id);
    setEditTitle(plan.title);
    setEditDate(plan.date);
    setEditType(plan.type);
    setEditWebsite(plan.website || "");
    setEditMapsLink(plan.mapsLink || "");
  };

  const handleSaveEdit = async (planId: Id<"plans">) => {
    if (!editTitle.trim() || !editDate) {
      alert("Title and Date are required!");
      return;
    }
    try {
      await updatePlan({
        id: planId,
        title: editTitle,
        date: editDate, 
        type: editType,
        website: editWebsite || undefined,
        mapsLink: editMapsLink || undefined,
      });
      setEditingPlan(null);
    } catch (error) {
      console.error("Failed to update plan:", error);
      alert("Error updating plan. Please try again.");
    }
  };

  const filteredPlans = plans.filter(plan => {
    if (viewFilter === "all") return true;
    if (viewFilter === "upcoming") return !plan.isCompleted;
    if (viewFilter === "completed") return plan.isCompleted;
    if (viewFilter === "withMemories") return Boolean(plan.memory);
    return true;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    if (a.isCompleted && b.isCompleted) {
      if ((a.memory && b.memory) || (!a.memory && !b.memory)) {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.memory ? -1 : 1;
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const getMonthYear = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
  };

  const plansByMonth: Record<string, Plan[]> = sortedPlans.reduce((acc: Record<string, Plan[]>, plan) => {
    const monthYear = getMonthYear(plan.date);
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(plan);
    return acc;
  }, {});

  return (
    <div className="plans-section-ios">
      {/* Header */}
      <div className="plans-header-ios">
        <h2 className="plans-title-ios">Our Adventures 💖</h2>
        <div className="plans-controls-ios">
          <div className="plans-filter-tabs-ios">
            {(["all", "upcoming", "completed", "withMemories"] as const).map(filterKey => (
              <button 
                key={filterKey}
                onClick={() => setViewFilter(filterKey)}
                className={`plans-filter-tab-ios ${viewFilter === filterKey ? "active" : ""}`}
              >
                {filterKey === "withMemories" ? "Memories" : filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="plans-add-button-ios ios-haptic"
          >
            {showAddForm ? "Cancel ✕" : "New Plan ✨"}
          </button>
        </div>
      </div>

      {/* Add Plan Form */}
      {showAddForm && (
        <div className="ios-form-container ios-animate-scale">
          <h3 className="ios-form-title">Plan a New Adventure! 🎨</h3>
          <form onSubmit={handleAddPlan}>
            <div className="ios-form-group">
              <label className="ios-form-label">Adventure Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the adventure?"
                className="ios-form-input"
                required
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-form-label">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="ios-form-input"
                required
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-form-label">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="ios-form-select"
              >
                <option value="date">Date Night 💖</option>
                <option value="trip">Awesome Trip ✈️</option>
                <option value="activity">Fun Activity 🎉</option>
                <option value="celebration">Big Celebration 🥳</option>
                <option value="other">Something Else 🌟</option>
              </select>
            </div>
            
            <div className="ios-form-group">
              <label className="ios-form-label">Website (Optional)</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="ios-form-input"
              />
            </div>
            
            <div className="ios-form-group">
              <label className="ios-form-label">Maps Link (Optional)</label>
              <input
                type="url"
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                placeholder="Google Maps link"
                className="ios-form-input"
              />
            </div>
            
            <div className="ios-form-actions">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="ios-form-button secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ios-form-button"
              >
                Create Plan! 💕
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {sortedPlans.length === 0 && !showAddForm && (
        <div className="empty-state">
          <div className="empty-state-icon">🗺️</div>
          <h3 className="empty-state-title">Our Adventure Book is Empty!</h3>
          <p className="empty-state-desc">Let's fill it with wonderful plans and memories!</p>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="ios-form-button"
          >
            Plan Our First Adventure! ✨
          </button>
        </div>
      )}

      {/* Plans List */}
      <div className="plans-list-ios">
        {Object.entries(plansByMonth).map(([monthYear, monthPlans]) => (
          <div key={monthYear} className="plans-month-group-ios">
            <h3 className="month-heading">{monthYear}</h3>
            <div className="plans-month-list-ios">
              {monthPlans.map((plan: Plan) => (
                <div 
                  key={plan._id} 
                  className={`plan-card-ios ${plan.isCompleted ? "completed" : ""} touchable ios-animate-in`}
                  style={{ animationDelay: `${monthPlans.indexOf(plan) * 0.1}s` }}
                >
                  {editingPlan === plan._id ? (
                    <div className="edit-form-ios">
                      <div className="ios-form-group">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="ios-form-input"
                          placeholder="Plan title"
                        />
                      </div>
                      <div className="ios-form-group">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="ios-form-input"
                        />
                      </div>
                      <div className="ios-form-group">
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="ios-form-select"
                        >
                          <option value="date">Date Night 💖</option>
                          <option value="trip">Awesome Trip ✈️</option>
                          <option value="activity">Fun Activity 🎉</option>
                          <option value="celebration">Big Celebration 🥳</option>
                          <option value="other">Something Else 🌟</option>
                        </select>
                      </div>
                      <div className="ios-form-actions">
                        <button
                          onClick={() => setEditingPlan(null)}
                          className="ios-form-button secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(plan._id)}
                          className="ios-form-button"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="plan-card-header-ios">
                        <div className="plan-date-badge-ios">
                          <div className="plan-date-day-ios">{formatDateForDisplay(plan.date).day}</div>
                          <div className="plan-date-month-ios">{formatDateForDisplay(plan.date).month}</div>
                        </div>
                        <div className="plan-content-ios">
                          <div className="plan-title-ios">
                            <span className="plan-type-emoji">{getTypeEmoji(plan.type)}</span>
                            <span className={plan.isCompleted ? "completed" : ""}>{plan.title}</span>
                          </div>
                          <div className="plan-meta-ios">
                            <span className="plan-weekday">{formatDateForDisplay(plan.date).weekday}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                          className={`plan-checkbox-ios ${plan.isCompleted ? "checked" : ""} touchable-scale`}
                        />
                      </div>
                      
                      {plan.memory && (
                        <div className="plan-memory-indicator-ios" />
                      )}
                      
                      <div className="plan-actions-ios">
                        {plan.website && (
                          <a 
                            href={plan.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="plan-action-ios touchable-fade"
                          >
                            🌐 Website
                          </a>
                        )}
                        {plan.mapsLink && (
                          <a 
                            href={plan.mapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="plan-action-ios touchable-fade"
                          >
                            📍 Maps
                          </a>
                        )}
                        <button 
                          onClick={() => startEditing(plan)} 
                          className="plan-action-ios touchable-fade"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this plan?')) {
                              removePlan({ id: plan._id });
                            }
                          }}
                          className="plan-action-ios touchable-fade"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}