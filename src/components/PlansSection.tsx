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

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads";

export default function PlansSection() {
  const plans = useQuery(api.plans.list) || [] as Plan[];
  const addPlan = useMutation(api.plans.add);
  const updatePlan = useMutation(api.plans.update);
  const togglePlan = useMutation(api.plans.toggle);
  const removePlan = useMutation(api.plans.remove);
  const addMemory = useMutation(api.plans.addMemory);

  // State for new plan
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [type, setType] = useState<string>("date");
  const [website, setWebsite] = useState<string>("");
  const [mapsLink, setMapsLink] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // State for editing
  const [editingPlan, setEditingPlan] = useState<Id<"plans"> | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editType, setEditType] = useState<string>("");
  const [editWebsite, setEditWebsite] = useState<string>("");
  const [editMapsLink, setEditMapsLink] = useState<string>("");

  // Memory states
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [memoryRating, setMemoryRating] = useState<number>(5);
  const [memoryPhotos, setMemoryPhotos] = useState<string[]>([]);
  const [memoryNotes, setMemoryNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState<string>("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number>(-1);
  
  // View states
  const [viewFilter, setViewFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [imageViewerOpen, setImageViewerOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Initialize with current date if empty
  useState(() => {
    if (!date) setDate(getCurrentDate());
  });

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

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          console.error("Cloudinary Upload Error:", xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, true);
      xhr.send(formData);
    });
  };

  const isFileSizeValid = (file: File, maxSizeMB: number = 5): boolean => {
    return file.size <= maxSizeMB * 1024 * 1024;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const file = files[0];
      
      if (!isFileSizeValid(file)) {
        alert("Image is too large! Max 5MB.");
        setIsUploading(false);
        return;
      }
      
      const cloudinaryUrl = await uploadToCloudinary(file);
      setMemoryPhotos(prevPhotos => [...prevPhotos, cloudinaryUrl]);
      
    } catch (error) {
      console.error("Failed to upload file:", error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      if (editingNoteIndex >= 0) {
        const updatedNotes = [...memoryNotes];
        updatedNotes[editingNoteIndex] = newNote.trim();
        setMemoryNotes(updatedNotes);
        setEditingNoteIndex(-1);
      } else {
        setMemoryNotes(prevNotes => [...prevNotes, newNote.trim()]);
      }
      setNewNote("");
    }
  };

  const handleRemovePhoto = (index: number) => {
    setMemoryPhotos(prevPhotos => prevPhotos.filter((_, i) => i !== index));
  };

  const handleRemoveNote = (index: number) => {
    setMemoryNotes(prevNotes => prevNotes.filter((_, i) => i !== index));
    if (editingNoteIndex === index) {
        setNewNote("");
        setEditingNoteIndex(-1);
    }
  };
  
  const handleEditNote = (index: number) => {
    setNewNote(memoryNotes[index]);
    setEditingNoteIndex(index);
  };

  const handleSaveMemory = async () => {
    if (!selectedPlan) return;

    try {
      await addMemory({
        planId: selectedPlan._id,
        memory: {
          photos: memoryPhotos,
          rating: memoryRating,
          notes: memoryNotes,
          createdAt: new Date().toISOString()
        }
      });
      setShowMemoryModal(false);
      setMemoryPhotos([]);
      setMemoryRating(5);
      setMemoryNotes([]);
      setNewNote("");
      setSelectedPlan(null);
      setEditingNoteIndex(-1);
    } catch (error) {
      console.error("Failed to save memory:", error);
      alert("Error saving memory. Please try again.");
    }
  };

  const openImageViewer = (url: string) => {
    setCurrentImage(url);
    setImageViewerOpen(true);
    document.body.classList.add('body-no-scroll');
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    document.body.classList.remove('body-no-scroll');
  };

  const editExistingMemory = (plan: Plan) => {
    if (!plan.memory) return;
    setSelectedPlan(plan);
    setMemoryRating(plan.memory.rating);
    setMemoryPhotos([...plan.memory.photos]);
    setMemoryNotes([...plan.memory.notes]);
    setShowMemoryModal(true);
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
  
  const formatDateBadge = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      weekday: date.toLocaleString('default', { weekday: 'short' }).toUpperCase()
    };
  };

  const totalPlans = plans.length;
  const completedPlans = plans.filter(plan => plan.isCompleted).length;
  const completionPercentage = totalPlans ? Math.round((completedPlans / totalPlans) * 100) : 0;

  return (
    <div className="plans-section-pastel">
      {/* Sidebar - macOS Style */}
      <div className="plans-sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Our Journey</h1>
          <p className="sidebar-subtitle">Beautiful memories together</p>
        </div>

        <div className="sidebar-stats">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{totalPlans}</div>
              <div className="stat-label">Adventures</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{completedPlans}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          
          <div className="sidebar-progress">
            <div className="progress-label">Progress</div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="progress-text">
              {completionPercentage}% Complete
            </div>
          </div>
        </div>

        <div className="sidebar-filters">
          <div className="filter-section-title">Filter Adventures</div>
          <div className="filter-buttons">
            {(["all", "upcoming", "completed", "withMemories"] as const).map(filterKey => (
              <button 
                key={filterKey}
                onClick={() => setViewFilter(filterKey)}
                className={`filter-button ${viewFilter === filterKey ? "active" : ""}`}
              >
                <span className="filter-emoji">
                  {filterKey === "all" && "🌸"}
                  {filterKey === "upcoming" && "🌱"}
                  {filterKey === "completed" && "🌺"}
                  {filterKey === "withMemories" && "💝"}
                </span>
                <span>
                  {filterKey.charAt(0).toUpperCase() + filterKey.slice(1).replace('With', 'With ')}
                </span>
              </button>
            ))}
          </div>

          <div className="filter-section-title">View Mode</div>
          <div className="view-mode-toggles">
            <button
              onClick={() => setViewMode("timeline")}
              className={`view-toggle ${viewMode === "timeline" ? "active" : ""}`}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`view-toggle ${viewMode === "grid" ? "active" : ""}`}
            >
              Grid
            </button>
          </div>
        </div>

        <div className="sidebar-actions">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-plan-button"
          >
            <span>✨</span>
            <span>New Adventure</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="plans-main-content">
        <div className="main-content-header">
          <div className="content-header-top">
            <h2 className="content-title">
              {viewFilter === "all" && "All Adventures"}
              {viewFilter === "upcoming" && "Upcoming Adventures"}
              {viewFilter === "completed" && "Completed Adventures"}
              {viewFilter === "withMemories" && "Adventures with Memories"}
            </h2>
            <div className="header-actions">
              <div className="quick-add-button" onClick={() => setShowAddForm(!showAddForm)}>
                <span>✨</span>
                <span>Quick Add</span>
              </div>
            </div>
          </div>
        </div>

        <div className="plans-content-area">
          {/* Add Plan Form */}
          {showAddForm && (
            <div className="plans-add-form-container">
              <form onSubmit={handleAddPlan} className="plans-add-form">
                <div className="form-header">
                  <h3>✨ Plan a New Memory</h3>
                  <p>Every great adventure starts with a beautiful plan</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Adventure Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="What magical experience awaits?"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Adventure Type</label>
                    <select value={type} onChange={(e) => setType(e.target.value)} className="form-select">
                      <option value="date">💖 Romantic Date</option>
                      <option value="trip">✈️ Amazing Trip</option>
                      <option value="activity">🎉 Fun Activity</option>
                      <option value="celebration">🥳 Celebration</option>
                      <option value="other">🌟 Something Special</option>
                    </select>
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Website Link</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label>Location (Maps)</label>
                    <input
                      type="url"
                      value={mapsLink}
                      onChange={(e) => setMapsLink(e.target.value)}
                      placeholder="Google Maps link"
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <span>✨</span>
                    Create Adventure
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Plans Content */}
          {sortedPlans.length === 0 && !showAddForm ? (
            <div className="plans-empty-state">
              <div className="empty-icon">🌸</div>
              <h3>Your Journey Awaits</h3>
              <p>Start creating beautiful memories together by planning your first adventure!</p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                <span>✨</span>
                Plan Our First Adventure
              </button>
            </div>
          ) : (
            <div className={`plans-content ${viewMode}`}>
              {viewMode === "timeline" ? (
                // Timeline View
                <div className="plans-timeline">
                  {Object.entries(plansByMonth).map(([monthYear, monthPlans]) => (
                    <div key={monthYear} className="timeline-month">
                      <div className="timeline-month-header">
                        <h3 className="month-title">{monthYear}</h3>
                        <div className="month-divider"></div>
                        <div className="month-count">
                          {monthPlans.length} adventure{monthPlans.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="timeline-plans">
                        {monthPlans.map((plan, index) => (
                          <div key={plan._id} className={`timeline-plan ${plan.isCompleted ? 'completed' : ''}`}>
                            {editingPlan === plan._id ? (
                              // Edit Mode
                              <div className="plan-edit-form">
                                <div className="edit-header">
                                  <h4>✏️ Editing Adventure</h4>
                                </div>
                                <div className="edit-grid">
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="form-input"
                                    placeholder="Adventure title"
                                  />
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={(e) => setEditDate(e.target.value)}
                                    className="form-input"
                                  />
                                  <select
                                    value={editType}
                                    onChange={(e) => setEditType(e.target.value)}
                                    className="form-select"
                                  >
                                    <option value="date">💖 Romantic Date</option>
                                    <option value="trip">✈️ Amazing Trip</option>
                                    <option value="activity">🎉 Fun Activity</option>
                                    <option value="celebration">🥳 Celebration</option>
                                    <option value="other">🌟 Something Special</option>
                                  </select>
                                  <input
                                    type="url"
                                    value={editWebsite}
                                    onChange={(e) => setEditWebsite(e.target.value)}
                                    placeholder="Website link"
                                    className="form-input"
                                  />
                                  <input
                                    type="url"
                                    value={editMapsLink}
                                    onChange={(e) => setEditMapsLink(e.target.value)}
                                    placeholder="Maps link"
                                    className="form-input full-width"
                                  />
                                </div>
                                <div className="edit-actions">
                                  <button onClick={() => setEditingPlan(null)} className="btn-secondary small">
                                    Cancel
                                  </button>
                                  <button onClick={() => handleSaveEdit(plan._id)} className="btn-primary small">
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <>
                                <div className="plan-date-badge">
                                  <div className="date-day">{formatDateBadge(plan.date).day}</div>
                                  <div className="date-month">{formatDateBadge(plan.date).month}</div>
                                  <div className="date-weekday">{formatDateBadge(plan.date).weekday}</div>
                                </div>
                                
                                <div className="plan-content">
                                  <div className="plan-header">
                                    <div className="plan-title-row">
                                      <span className="plan-emoji">{getTypeEmoji(plan.type)}</span>
                                      <h4 className="plan-title">{plan.title}</h4>
                                    </div>
                                    
                                    <div className="plan-actions">
                                      <button
                                        onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                                        className={`completion-toggle ${plan.isCompleted ? 'completed' : ''}`}
                                        title={plan.isCompleted ? "Mark as not done" : "Mark as complete"}
                                      >
                                        {plan.isCompleted ? '✅' : '○'}
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="plan-meta">
                                    {plan.website && (
                                      <a href={plan.website} target="_blank" rel="noopener noreferrer" className="plan-link">
                                        🌐 Website
                                      </a>
                                    )}
                                    {plan.mapsLink && (
                                      <a href={plan.mapsLink} target="_blank" rel="noopener noreferrer" className="plan-link">
                                        📍 Location
                                      </a>
                                    )}
                                    <button onClick={() => startEditing(plan)} className="plan-action-btn">
                                      ✏️ Edit
                                    </button>
                                    <button onClick={() => removePlan({ id: plan._id })} className="plan-action-btn delete">
                                      🗑️ Delete
                                    </button>
                                  </div>
                                  
                                  {plan.isCompleted && (
                                    <div className="memory-section">
                                      {plan.memory ? (
                                        <div className="memory-preview">
                                          <div className="memory-header">
                                            <h5>💖 Beautiful Memory</h5>
                                            <button onClick={() => editExistingMemory(plan)} className="btn-memory">
                                              Edit Memory
                                            </button>
                                          </div>
                                          <div className="memory-rating">
                                            {'⭐'.repeat(plan.memory.rating)}
                                          </div>
                                          {plan.memory.photos && plan.memory.photos.length > 0 && (
                                            <div className="memory-photos">
                                              {plan.memory.photos.slice(0, 3).map((photo, idx) => (
                                                <img
                                                  key={idx}
                                                  src={photo}
                                                  alt={`Memory ${idx + 1}`}
                                                  onClick={() => openImageViewer(photo)}
                                                  className="memory-photo"
                                                />
                                              ))}
                                              {plan.memory.photos.length > 3 && (
                                                <div className="memory-photo-more">
                                                  +{plan.memory.photos.length - 3}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          {plan.memory.notes && plan.memory.notes.length > 0 && (
                                            <div className="memory-note">
                                              "{plan.memory.notes[0].substring(0, 100)}..."
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => { setSelectedPlan(plan); setShowMemoryModal(true); }}
                                          className="btn-add-memory"
                                        >
                                          <span>📸</span>
                                          Capture This Memory
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Grid View
                <div className="plans-grid">
                  {sortedPlans.map((plan) => (
                    <div key={plan._id} className={`plan-card ${plan.isCompleted ? 'completed' : ''} ${plan.memory ? 'has-memory' : ''}`}>
                      <div className="card-header">
                        <div className="card-date">
                          <div className="date-day">{formatDateBadge(plan.date).day}</div>
                          <div className="date-month">{formatDateBadge(plan.date).month}</div>
                        </div>
                        <div className="card-status">
                          <button
                            onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                            className={`completion-toggle ${plan.isCompleted ? 'completed' : ''}`}
                          >
                            {plan.isCompleted ? '✅' : '○'}
                          </button>
                        </div>
                      </div>
                      
                      <div className="card-content">
                        <div className="card-title">
                          <span className="plan-emoji">{getTypeEmoji(plan.type)}</span>
                          <h4>{plan.title}</h4>
                        </div>
                        
                        <div className="card-actions">
                          {plan.website && (
                            <a href={plan.website} target="_blank" rel="noopener noreferrer" className="action-link">
                              🌐
                            </a>
                          )}
                          {plan.mapsLink && (
                            <a href={plan.mapsLink} target="_blank" rel="noopener noreferrer" className="action-link">
                              📍
                            </a>
                          )}
                          <button onClick={() => startEditing(plan)} className="action-btn">✏️</button>
                          <button onClick={() => removePlan({ id: plan._id })} className="action-btn delete">🗑️</button>
                        </div>
                      </div>
                      
                      {plan.memory && (
                        <div className="card-memory">
                          <div className="memory-indicator">💖 Memory Captured</div>
                          {plan.memory.photos && plan.memory.photos.length > 0 && (
                            <img
                              src={plan.memory.photos[0]}
                              alt="Memory"
                              className="memory-thumbnail"
                              onClick={() => openImageViewer(plan.memory!.photos[0])}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Memory Modal */}
      {showMemoryModal && selectedPlan && (
        <div className="memory-modal-overlay">
          <div className="memory-modal">
            <div className="modal-header">
              <h2>✨ Capture This Beautiful Memory</h2>
              <p>Tell us about your wonderful experience with "{selectedPlan?.title || 'this adventure'}"</p>
            </div>
            
            <div className="memory-form">
              <div className="rating-section">
                <label>How magical was it?</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setMemoryRating(star)}
                      className={`star-btn ${star <= memoryRating ? "active" : ""}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div className="photos-section">
                <label>Share your beautiful photos</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="upload-btn"
                >
                  {isUploading ? `Uploading... ${uploadProgress}%` : "📸 Add Photo"}
                </button>
                
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
                
                {memoryPhotos.length > 0 && (
                  <div className="photo-previews">
                    {memoryPhotos.map((photo, index) => (
                      <div key={index} className="photo-preview">
                        <img src={photo} alt={`Preview ${index + 1}`} onClick={() => openImageViewer(photo)} />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="remove-photo"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="notes-section">
                <label>What made it special?</label>
                <div className="note-input">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Share your favorite moments and feelings..."
                    className="note-textarea"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className="add-note-btn"
                  >
                    {editingNoteIndex >= 0 ? "Update Note" : "Add Note"}
                  </button>
                </div>
                
                {editingNoteIndex >= 0 && (
                  <button
                    type="button"
                    onClick={() => { setNewNote(""); setEditingNoteIndex(-1); }}
                    className="cancel-edit-btn"
                  >
                    Cancel Edit
                  </button>
                )}
                
                {memoryNotes.length > 0 && (
                  <div className="notes-list">
                    {memoryNotes.map((note, index) => (
                      <div key={index} className="note-item">
                        <span className="note-text">{note}</span>
                        <div className="note-actions">
                          <button onClick={() => handleEditNote(index)} className="edit-note">✏️</button>
                          <button onClick={() => handleRemoveNote(index)} className="remove-note">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowMemoryModal(false);
                  setSelectedPlan(null);
                  setMemoryPhotos([]);
                  setMemoryRating(5);
                  setMemoryNotes([]);
                  setNewNote("");
                  setEditingNoteIndex(-1);
                }}
                className="btn-secondary"
              >
                Close
              </button>
              <button type="button" onClick={handleSaveMemory} className="btn-primary">
                <span>💖</span>
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {imageViewerOpen && (
        <div className="image-viewer-overlay" onClick={closeImageViewer}>
          <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeImageViewer} className="close-viewer">×</button>
            <img src={currentImage} alt="Memory" className="viewer-image" />
          </div>
        </div>
      )}
    </div>
  );
}