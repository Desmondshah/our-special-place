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

  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'date': 'pixel-pink',
      'trip': 'pixel-blue',
      'activity': 'pixel-orange',
      'celebration': 'pixel-purple',
      'other': 'pixel-teal'
    };
    return colors[type] || 'pixel-pink';
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleString('default', { weekday: 'short' }).toUpperCase(),
      year: date.getFullYear()
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

  // Get stats for header
  const totalPlans = plans.length;
  const completedPlans = plans.filter(p => p.isCompleted).length;
  const upcomingPlans = plans.filter(p => !p.isCompleted).length;
  const withMemories = plans.filter(p => p.memory).length;

  return (
    <div className="pixel-plans-container">
      {/* Pixel Art Header */}
      <div className="pixel-header-main">
        <div className="pixel-header-bg"></div>
        <div className="pixel-header-content">
          <div className="pixel-title-container">
            <div className="pixel-title-decoration"></div>
            <h2 className="pixel-title-main">Our Pixel Adventures</h2>
            <div className="pixel-title-subtitle">✨ Collecting Memories in 8-bit ✨</div>
          </div>
          
          {/* Pixel Stats Grid */}
          <div className="pixel-stats-grid">
            <div className="pixel-stat-card total">
              <div className="pixel-stat-icon">📊</div>
              <div className="pixel-stat-number">{totalPlans}</div>
              <div className="pixel-stat-label">Total</div>
            </div>
            <div className="pixel-stat-card upcoming">
              <div className="pixel-stat-icon">🎯</div>
              <div className="pixel-stat-number">{upcomingPlans}</div>
              <div className="pixel-stat-label">Upcoming</div>
            </div>
            <div className="pixel-stat-card completed">
              <div className="pixel-stat-icon">✅</div>
              <div className="pixel-stat-number">{completedPlans}</div>
              <div className="pixel-stat-label">Done</div>
            </div>
            <div className="pixel-stat-card memories">
              <div className="pixel-stat-icon">💭</div>
              <div className="pixel-stat-number">{withMemories}</div>
              <div className="pixel-stat-label">Memories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pixel Filter Tabs */}
      <div className="pixel-filter-section">
        <div className="pixel-filter-container">
          {(["all", "upcoming", "completed", "withMemories"] as const).map((filterKey, index) => (
            <button 
              key={filterKey}
              onClick={() => setViewFilter(filterKey)}
              className={`pixel-filter-btn ${viewFilter === filterKey ? "active" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="pixel-filter-icon">
                {filterKey === "all" && "🌟"}
                {filterKey === "upcoming" && "🎯"}
                {filterKey === "completed" && "✅"}
                {filterKey === "withMemories" && "💭"}
              </div>
              <div className="pixel-filter-text">
                {filterKey === "withMemories" ? "Memories" : filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pixel Add Button */}
      <div className="pixel-add-section">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`pixel-add-btn ${showAddForm ? "active" : ""}`}
        >
          <div className="pixel-add-icon">{showAddForm ? "✕" : "+"}</div>
          <div className="pixel-add-text">
            {showAddForm ? "Cancel" : "New Adventure"}
          </div>
          <div className="pixel-add-sparkle">✨</div>
        </button>
      </div>

      {/* Pixel Add Form */}
      {showAddForm && (
        <div className="pixel-form-container">
          <div className="pixel-form-header">
            <div className="pixel-form-icon">🎨</div>
            <h3 className="pixel-form-title">Create New Adventure</h3>
            <div className="pixel-form-decoration"></div>
          </div>
          
          <form onSubmit={handleAddPlan} className="pixel-form">
            <div className="pixel-input-group">
              <label className="pixel-label">
                <span className="pixel-label-icon">💫</span>
                Adventure Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the adventure?"
                className="pixel-input"
                required
              />
            </div>
            
            <div className="pixel-input-group">
              <label className="pixel-label">
                <span className="pixel-label-icon">📅</span>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pixel-input"
                required
              />
            </div>
            
            <div className="pixel-input-group">
              <label className="pixel-label">
                <span className="pixel-label-icon">🎭</span>
                Adventure Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="pixel-select"
              >
                <option value="date">💖 Date Night</option>
                <option value="trip">✈️ Epic Trip</option>
                <option value="activity">🎉 Fun Activity</option>
                <option value="celebration">🥳 Celebration</option>
                <option value="other">🌟 Something Special</option>
              </select>
            </div>
            
            <div className="pixel-input-group">
              <label className="pixel-label">
                <span className="pixel-label-icon">🌐</span>
                Website <span className="pixel-optional">(Optional)</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://awesome-place.com"
                className="pixel-input"
              />
            </div>
            
            <div className="pixel-input-group">
              <label className="pixel-label">
                <span className="pixel-label-icon">📍</span>
                Maps Link <span className="pixel-optional">(Optional)</span>
              </label>
              <input
                type="url"
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                placeholder="Google Maps link"
                className="pixel-input"
              />
            </div>
            
            <div className="pixel-form-actions">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="pixel-btn secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="pixel-btn primary"
              >
                <span>Create Adventure</span>
                <span className="pixel-btn-sparkle">✨</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {sortedPlans.length === 0 && !showAddForm && (
        <div className="pixel-empty-state">
          <div className="pixel-empty-bg"></div>
          <div className="pixel-empty-content">
            <div className="pixel-empty-icon">🗺️</div>
            <h3 className="pixel-empty-title">Adventure Book Empty!</h3>
            <p className="pixel-empty-desc">Let's fill it with pixel-perfect memories!</p>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="pixel-btn primary"
            >
              <span>Start Our Journey</span>
              <span className="pixel-btn-sparkle">🚀</span>
            </button>
          </div>
        </div>
      )}

      {/* Pixel Plans List */}
      <div className="pixel-plans-list">
        {Object.entries(plansByMonth).map(([monthYear, monthPlans], monthIndex) => (
          <div key={monthYear} className="pixel-month-section" style={{ animationDelay: `${monthIndex * 0.1}s` }}>
            <div className="pixel-month-header">
              <div className="pixel-month-decoration"></div>
              <h3 className="pixel-month-title">{monthYear}</h3>
              <div className="pixel-month-count">{monthPlans.length} plans</div>
            </div>
            
            <div className="pixel-month-grid">
              {monthPlans.map((plan: Plan, planIndex) => (
                <div 
                  key={plan._id} 
                  className={`pixel-plan-card ${plan.isCompleted ? "completed" : ""} ${getTypeColor(plan.type)}`}
                  style={{ animationDelay: `${(monthIndex * 0.2) + (planIndex * 0.1)}s` }}
                >
                  {editingPlan === plan._id ? (
                    <div className="pixel-edit-form">
                      <div className="pixel-edit-header">
                        <div className="pixel-edit-icon">✏️</div>
                        <span>Editing Adventure</span>
                      </div>
                      
                      <div className="pixel-input-group">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="pixel-input small"
                          placeholder="Plan title"
                        />
                      </div>
                      
                      <div className="pixel-input-group">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="pixel-input small"
                        />
                      </div>
                      
                      <div className="pixel-input-group">
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="pixel-select small"
                        >
                          <option value="date">💖 Date Night</option>
                          <option value="trip">✈️ Epic Trip</option>
                          <option value="activity">🎉 Fun Activity</option>
                          <option value="celebration">🥳 Celebration</option>
                          <option value="other">🌟 Something Special</option>
                        </select>
                      </div>
                      
                      <div className="pixel-edit-actions">
                        <button
                          onClick={() => setEditingPlan(null)}
                          className="pixel-btn small secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(plan._id)}
                          className="pixel-btn small primary"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="pixel-plan-header">
                        <div className="pixel-plan-date">
                          <div className="pixel-date-day">{formatDateForDisplay(plan.date).day}</div>
                          <div className="pixel-date-month">{formatDateForDisplay(plan.date).month}</div>
                        </div>
                        
                        <div className="pixel-plan-type">
                          <div className="pixel-type-icon">{getTypeEmoji(plan.type)}</div>
                        </div>
                        
                        <button
                          onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                          className={`pixel-checkbox ${plan.isCompleted ? "checked" : ""}`}
                        >
                          <div className="pixel-checkbox-inner"></div>
                        </button>
                      </div>
                      
                      <div className="pixel-plan-content">
                        <h4 className={`pixel-plan-title ${plan.isCompleted ? "completed" : ""}`}>
                          {plan.title}
                        </h4>
                        <div className="pixel-plan-meta">
                          <span className="pixel-weekday">{formatDateForDisplay(plan.date).weekday}</span>
                          {plan.memory && (
                            <div className="pixel-memory-badge">
                              <span>💭</span>
                              <span>Memory</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="pixel-plan-actions">
                        {plan.website && (
                          <a 
                            href={plan.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="pixel-action-btn website"
                          >
                            <span className="pixel-action-icon">🌐</span>
                            <span>Visit</span>
                          </a>
                        )}
                        {plan.mapsLink && (
                          <a 
                            href={plan.mapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="pixel-action-btn maps"
                          >
                            <span className="pixel-action-icon">📍</span>
                            <span>Maps</span>
                          </a>
                        )}
                        <button 
                          onClick={() => startEditing(plan)} 
                          className="pixel-action-btn edit"
                        >
                          <span className="pixel-action-icon">✏️</span>
                          <span>Edit</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Delete this adventure? This cannot be undone!')) {
                              removePlan({ id: plan._id });
                            }
                          }}
                          className="pixel-action-btn delete"
                        >
                          <span className="pixel-action-icon">🗑️</span>
                          <span>Delete</span>
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