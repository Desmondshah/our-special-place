import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

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
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu"; // Replace with your cloud name
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads"; // Replace with your upload preset

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
  const [viewFilter, setViewFilter] = useState<string>("all"); // "all", "upcoming", "completed", "withMemories"
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
      // Reset memory form state
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
    document.body.style.overflow = 'hidden';
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    document.body.style.overflow = '';
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
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase()
    };
  };

  const getStats = () => {
    const totalPlans = plans.length;
    const completedPlans = plans.filter(p => p.isCompleted).length;
    const memoriesAdded = plans.filter(p => p.memory).length;
    return { totalPlans, completedPlans, memoriesAdded };
  };

  const stats = getStats();

  return (
    <div className="plans-container">
      <div className="plans-content">
        {/* Header */}
        <div className="plans-header">
          <div className="header-backdrop">
            <div className="header-content">
              <div className="header-main">
                <h1 className="section-title">
                  <span className="title-emoji">✨</span>
                  Our Love Adventures
                  <span className="title-emoji">✨</span>
                </h1>
                <p className="section-subtitle">
                  Creating magical memories together, one adventure at a time
                </p>
              </div>
              
              {/* Stats Dashboard */}
              <div className="stats-grid">
                <div className="stat-card stat-primary">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.totalPlans}</div>
                    <div className="stat-label">Adventures</div>
                  </div>
                </div>
                
                <div className="stat-card stat-success">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.completedPlans}</div>
                    <div className="stat-label">Completed</div>
                  </div>
                </div>
                
                <div className="stat-card stat-memory">
                  <div className="stat-icon">💝</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.memoriesAdded}</div>
                    <div className="stat-label">Memories</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="controls-section">
          <div className="filter-tabs">
            {(["all", "upcoming", "completed", "withMemories"] as const).map(filterKey => (
              <button 
                key={filterKey}
                onClick={() => setViewFilter(filterKey)}
                className={`filter-tab ${viewFilter === filterKey ? "active" : ""}`}
              >
                <span className="tab-icon">
                  {filterKey === 'all' && '📋'}
                  {filterKey === 'upcoming' && '⏳'}
                  {filterKey === 'completed' && '✅'}
                  {filterKey === 'withMemories' && '💖'}
                </span>
                <span className="tab-label">
                  {filterKey.charAt(0).toUpperCase() + filterKey.slice(1).replace('With', 'With ')}
                </span>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-button"
          >
            <span className="add-icon">{showAddForm ? '✕' : '+'}</span>
            <span>{showAddForm ? "Cancel" : "New Adventure"}</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="add-form-section">
            <div className="form-card">
              <div className="form-header">
                <h3 className="form-title">Create New Adventure</h3>
                <p className="form-subtitle">Plan your next magical moment together</p>
              </div>
              
              <form onSubmit={handleAddPlan} className="adventure-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label className="input-label">
                      <span className="label-icon">🎯</span>
                      Adventure Name
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Our magical adventure..."
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">
                      <span className="label-icon">📅</span>
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">
                      <span className="label-icon">🎲</span>
                      Adventure Type
                    </label>
                    <select 
                      value={type} 
                      onChange={(e) => setType(e.target.value)} 
                      className="form-select"
                    >
                      <option value="date">💖 Romance Quest</option>
                      <option value="trip">✈️ Adventure Quest</option>
                      <option value="activity">🎉 Fun Quest</option>
                      <option value="celebration">🥳 Party Quest</option>
                      <option value="other">🌟 Special Quest</option>
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">
                      <span className="label-icon">🌐</span>
                      Website (Optional)
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      className="form-input"
                    />
                  </div>
                  
                  <div className="input-group full-width">
                    <label className="input-label">
                      <span className="label-icon">📍</span>
                      Maps Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={mapsLink}
                      onChange={(e) => setMapsLink(e.target.value)}
                      placeholder="Google Maps link..."
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                  >
                    Create Adventure
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Empty State */}
        {sortedPlans.length === 0 && !showAddForm && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">🗺️</div>
              <h3 className="empty-title">No Adventures Yet!</h3>
              <p className="empty-description">
                Ready to start your love story adventure? Create your first magical moment!
              </p>
              <button 
                onClick={() => setShowAddForm(true)} 
                className="btn-primary"
              >
                Start Your Journey
              </button>
            </div>
          </div>
        )}

        {/* Adventure Cards by Month */}
        {Object.entries(plansByMonth).map(([monthYear, monthPlans]) => (
          <div key={monthYear} className="month-section">
            <div className="month-header">
              <h2 className="month-title">{monthYear}</h2>
              <div className="month-count">{monthPlans.length} adventures</div>
            </div>
            
            <div className="plans-grid">
              {monthPlans.map((plan: Plan) => (
                <div 
                  key={plan._id} 
                  className={`plan-card ${plan.isCompleted ? 'completed' : ''} ${plan.memory ? 'has-memory' : ''}`}
                >
                  {editingPlan === plan._id ? (
                    // Edit Form
                    <div className="edit-form">
                      <div className="edit-header">
                        <h4 className="edit-title">Edit Adventure</h4>
                      </div>
                      
                      <div className="edit-fields">
                        <input 
                          type="text" 
                          value={editTitle} 
                          onChange={(e) => setEditTitle(e.target.value)} 
                          className="form-input"
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
                          <option value="date">💖 Romance Quest</option>
                          <option value="trip">✈️ Adventure Quest</option>
                          <option value="activity">🎉 Fun Quest</option>
                          <option value="celebration">🥳 Party Quest</option>
                          <option value="other">🌟 Special Quest</option>
                        </select>
                        <input 
                          type="url" 
                          value={editWebsite} 
                          onChange={(e) => setEditWebsite(e.target.value)} 
                          placeholder="Website"
                          className="form-input"
                        />
                        <input 
                          type="url" 
                          value={editMapsLink} 
                          onChange={(e) => setEditMapsLink(e.target.value)} 
                          placeholder="Maps Link"
                          className="form-input"
                        />
                      </div>
                      
                      <div className="edit-actions">
                        <button 
                          onClick={() => setEditingPlan(null)} 
                          className="btn-secondary small"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleSaveEdit(plan._id)} 
                          className="btn-primary small"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal Card View
                    <>
                      {/* Card Header */}
                      <div className="card-header">
                        <div className="date-badge">
                          <div className="date-day">{formatDateBadge(plan.date).day}</div>
                          <div className="date-month">{formatDateBadge(plan.date).month}</div>
                        </div>
                        
                        <div className="plan-info">
                          <h3 className="plan-title">
                            <span className="plan-emoji">{getTypeEmoji(plan.type)}</span>
                            {plan.title}
                          </h3>
                          {plan.isCompleted && (
                            <div className="completion-badge">
                              <span className="badge-icon">✨</span>
                              Completed
                            </div>
                          )}
                        </div>
                        
                        <div className="card-actions">
                          <button
                            onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                            className={`toggle-btn ${plan.isCompleted ? 'completed' : ''}`}
                            title={plan.isCompleted ? "Mark as not done" : "Mark as done!"}
                          >
                            {plan.isCompleted ? '✓' : '○'}
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="plan-actions">
                        {plan.website && (
                          <a 
                            href={plan.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="action-btn"
                          >
                            <span className="btn-icon">🌐</span>
                            Website
                          </a>
                        )}
                        {plan.mapsLink && (
                          <a 
                            href={plan.mapsLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="action-btn"
                          >
                            <span className="btn-icon">📍</span>
                            Maps
                          </a>
                        )}
                        <button 
                          onClick={() => startEditing(plan)} 
                          className="action-btn"
                        >
                          <span className="btn-icon">✏️</span>
                          Edit
                        </button>
                        <button 
                          onClick={() => removePlan({ id: plan._id })} 
                          className="action-btn danger"
                        >
                          <span className="btn-icon">🗑️</span>
                          Delete
                        </button>
                      </div>

                      {/* Memory Section */}
                      {plan.isCompleted && (
                        <div className="memory-section">
                          {plan.memory ? (
                            <div className="memory-preview">
                              <div className="memory-header">
                                <h4 className="memory-title">💖 Our Memory</h4>
                                <button 
                                  onClick={() => editExistingMemory(plan)} 
                                  className="edit-memory-btn"
                                >
                                  Edit
                                </button>
                              </div>
                              
                              <div className="memory-rating">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <span key={i} className={`star ${i < plan.memory!.rating ? 'filled' : ''}`}>
                                    ★
                                  </span>
                                ))}
                              </div>
                              
                              {plan.memory.photos.length > 0 && (
                                <div className="memory-photos">
                                  {plan.memory.photos.slice(0, 3).map((photo, index) => (
                                    <img 
                                      key={index} 
                                      src={photo} 
                                      alt={`Memory ${index + 1}`} 
                                      onClick={() => openImageViewer(photo)}
                                      className="memory-photo"
                                    />
                                  ))}
                                  {plan.memory.photos.length > 3 && (
                                    <div className="photo-overflow">
                                      +{plan.memory.photos.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {plan.memory.notes.length > 0 && (
                                <div className="memory-note">
                                  "{plan.memory.notes[0].substring(0, 100)}{plan.memory.notes[0].length > 100 ? "..." : ""}"
                                </div>
                              )}
                            </div>
                          ) : (
                            <button 
                              onClick={() => { 
                                setSelectedPlan(plan); 
                                setShowMemoryModal(true); 
                              }} 
                              className="add-memory-btn"
                            >
                              <span className="btn-icon">✨</span>
                              Add Memory
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Memory Modal */}
        {showMemoryModal && selectedPlan && (
          <div className="modal-overlay" onClick={() => {
            setShowMemoryModal(false);
            setSelectedPlan(null);
            setMemoryPhotos([]);
            setMemoryRating(5);
            setMemoryNotes([]);
            setNewNote("");
            setEditingNoteIndex(-1);
          }}>
            <div className="memory-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">
                  {selectedPlan?.memory ? '💖 Edit Memory' : '✨ Create Memory'}
                </h2>
                <button 
                  onClick={() => {
                    setShowMemoryModal(false);
                    setSelectedPlan(null);
                    setMemoryPhotos([]);
                    setMemoryRating(5);
                    setMemoryNotes([]);
                    setNewNote("");
                    setEditingNoteIndex(-1);
                  }} 
                  className="modal-close"
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-content">
                {/* Rating */}
                <div className="rating-section">
                  <label className="section-label">How Magical Was It?</label>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star} 
                        type="button" 
                        onClick={() => setMemoryRating(star)}
                        className={`rating-star ${star <= memoryRating ? 'active' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photos */}
                <div className="photos-section">
                  <label className="section-label">Add Photos</label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    style={{ display: 'none' }}
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
                      <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                  
                  <div className="photo-preview-grid">
                    {memoryPhotos.map((photo, index) => (
                      <div key={index} className="photo-preview">
                        <img 
                          src={photo} 
                          alt={`Preview ${index + 1}`} 
                          onClick={() => openImageViewer(photo)}
                          className="preview-image"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemovePhoto(index)} 
                          className="remove-photo-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="notes-section">
                  <label className="section-label">What Made It Special?</label>
                  <div className="note-input-group">
                    <textarea 
                      value={newNote} 
                      onChange={(e) => setNewNote(e.target.value)} 
                      placeholder="Our favorite part was..." 
                      className="note-textarea"
                    />
                    <div className="note-actions">
                      <button 
                        type="button" 
                        onClick={handleAddNote} 
                        className="btn-primary small"
                      >
                        {editingNoteIndex >= 0 ? "Update" : "Add"}
                      </button>
                      {editingNoteIndex >= 0 && (
                        <button 
                          type="button" 
                          onClick={() => { 
                            setNewNote(""); 
                            setEditingNoteIndex(-1);
                          }} 
                          className="btn-secondary small"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="notes-list">
                    {memoryNotes.map((note, index) => (
                      <div key={index} className="note-item">
                        <span className="note-text">{note}</span>
                        <div className="note-item-actions">
                          <button 
                            type="button" 
                            onClick={() => handleEditNote(index)} 
                            className="note-action-btn"
                          >
                            ✏️
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveNote(index)} 
                            className="note-action-btn danger"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleSaveMemory} 
                  className="btn-primary"
                >
                  Save Memory
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Viewer Modal */}
        {imageViewerOpen && (
          <div className="image-viewer-overlay" onClick={closeImageViewer}>
            <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={closeImageViewer} 
                className="image-viewer-close"
              >
                ✕
              </button>
              <img 
                src={currentImage} 
                alt="Memory Preview" 
                className="viewer-image"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}