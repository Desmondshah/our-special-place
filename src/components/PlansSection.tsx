import { useState, useRef, useEffect }

/* Add these enhanced iOS-inspired styles to your src/index.css file */ from "react";
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
    <div className="ios-plans-container">
      {/* Professional Header Section */}
      <div className="ios-header-section">
        <div className="ios-header-backdrop"></div>
        <div className="ios-header-content">
          <div className="ios-title-section">
            <h1 className="ios-main-title">Our Epic Adventures</h1>
            <p className="ios-subtitle">Creating memories, one quest at a time</p>
          </div>
          
          {/* Enhanced Stats Dashboard */}
          <div className="ios-stats-grid">
            <div className="ios-stat-card stat-primary">
              <div className="ios-stat-icon">🎯</div>
              <div className="ios-stat-content">
                <div className="ios-stat-number">{stats.totalPlans}</div>
                <div className="ios-stat-label">Total Quests</div>
              </div>
            </div>
            
            <div className="ios-stat-card stat-success">
              <div className="ios-stat-icon">✅</div>
              <div className="ios-stat-content">
                <div className="ios-stat-number">{stats.completedPlans}</div>
                <div className="ios-stat-label">Completed</div>
              </div>
            </div>
            
            <div className="ios-stat-card stat-memories">
              <div className="ios-stat-icon">💖</div>
              <div className="ios-stat-content">
                <div className="ios-stat-number">{stats.memoriesAdded}</div>
                <div className="ios-stat-label">Memories</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="ios-main-content">
        {/* Navigation Controls */}
        <div className="ios-controls-section">
          <div className="ios-filter-tabs">
            {(["all", "upcoming", "completed", "withMemories"] as const).map(filterKey => (
              <button 
                key={filterKey}
                onClick={() => setViewFilter(filterKey)}
                className={`ios-filter-tab ${viewFilter === filterKey ? "active" : ""}`}
              >
                <span className="ios-tab-icon">
                  {filterKey === 'all' && '📋'}
                  {filterKey === 'upcoming' && '⏳'}
                  {filterKey === 'completed' && '✅'}
                  {filterKey === 'withMemories' && '💖'}
                </span>
                <span className="ios-tab-label">
                  {filterKey.charAt(0).toUpperCase() + filterKey.slice(1).replace('With', 'With ')}
                </span>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="ios-add-button"
          >
            <span className="ios-add-icon">{showAddForm ? '✕' : '+'}</span>
            <span className="ios-add-label">{showAddForm ? 'Cancel' : 'New Quest'}</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="ios-form-container">
            <div className="ios-form-header">
              <h3 className="ios-form-title">Create New Quest</h3>
              <p className="ios-form-subtitle">Plan your next adventure together</p>
            </div>
            
            <form onSubmit={handleAddPlan} className="ios-form">
              <div className="ios-form-grid">
                <div className="ios-input-group">
                  <label className="ios-label">Quest Name</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Our Epic Adventure..."
                    className="ios-input"
                    required
                  />
                </div>
                
                <div className="ios-input-group">
                  <label className="ios-label">Quest Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="ios-input"
                    required
                  />
                </div>
                
                <div className="ios-input-group">
                  <label className="ios-label">Quest Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)} 
                    className="ios-input ios-select"
                  >
                    <option value="date">💖 Romance Quest</option>
                    <option value="trip">✈️ Adventure Quest</option>
                    <option value="activity">🎉 Fun Quest</option>
                    <option value="celebration">🥳 Party Quest</option>
                    <option value="other">🌟 Special Quest</option>
                  </select>
                </div>
                
                <div className="ios-input-group">
                  <label className="ios-label">Website (Optional)</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="ios-input"
                  />
                </div>
                
                <div className="ios-input-group full-width">
                  <label className="ios-label">Maps Link (Optional)</label>
                  <input
                    type="url"
                    value={mapsLink}
                    onChange={(e) => setMapsLink(e.target.value)}
                    placeholder="Google Maps link..."
                    className="ios-input"
                  />
                </div>
              </div>
              
              <div className="ios-form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="ios-button secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="ios-button primary"
                >
                  Create Quest
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State */}
        {sortedPlans.length === 0 && !showAddForm && (
          <div className="ios-empty-state">
            <div className="ios-empty-icon">🗺️</div>
            <h3 className="ios-empty-title">Quest Log Empty!</h3>
            <p className="ios-empty-description">
              Ready to start your love story adventure? Create your first quest!
            </p>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="ios-button primary large"
            >
              Begin Adventure
            </button>
          </div>
        )}

        {/* Quest Cards by Month */}
        <div className="ios-plans-timeline">
          {Object.entries(plansByMonth).map(([monthYear, monthPlans]) => (
            <div key={monthYear} className="ios-month-section">
              <div className="ios-month-header">
                <div className="ios-month-badge">
                  <span className="ios-month-text">{monthYear}</span>
                </div>
                <div className="ios-month-line"></div>
              </div>
              
              <div className="ios-plans-grid">
                {monthPlans.map((plan: Plan) => (
                  <div 
                    key={plan._id} 
                    className={`ios-plan-card ${plan.isCompleted ? 'completed' : 'upcoming'} ${plan.memory ? 'has-memory' : ''}`}
                  >
                    {editingPlan === plan._id ? (
                      // Edit Form
                      <div className="ios-edit-form">
                        <h4 className="ios-edit-title">Edit Quest</h4>
                        
                        <div className="ios-edit-inputs">
                          <input 
                            type="text" 
                            value={editTitle} 
                            onChange={(e) => setEditTitle(e.target.value)} 
                            className="ios-input"
                            placeholder="Quest name..."
                          />
                          <input 
                            type="date" 
                            value={editDate} 
                            onChange={(e) => setEditDate(e.target.value)} 
                            className="ios-input"
                          />
                          <select 
                            value={editType} 
                            onChange={(e) => setEditType(e.target.value)} 
                            className="ios-input ios-select"
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
                            className="ios-input"
                          />
                          <input 
                            type="url" 
                            value={editMapsLink} 
                            onChange={(e) => setEditMapsLink(e.target.value)} 
                            placeholder="Maps Link"
                            className="ios-input"
                          />
                        </div>
                        
                        <div className="ios-edit-actions">
                          <button 
                            onClick={() => setEditingPlan(null)} 
                            className="ios-button secondary small"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleSaveEdit(plan._id)} 
                            className="ios-button primary small"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal Card View
                      <>
                        {/* Card Header */}
                        <div className="ios-card-header">
                          <div className="ios-date-badge">
                            <div className="ios-date-day">{formatDateBadge(plan.date).day}</div>
                            <div className="ios-date-month">{formatDateBadge(plan.date).month}</div>
                          </div>
                          
                          <div className="ios-plan-info">
                            <h3 className="ios-plan-title">
                              <span className="ios-plan-emoji">{getTypeEmoji(plan.type)}</span>
                              {plan.title}
                            </h3>
                            {plan.isCompleted && (
                              <div className="ios-completed-badge">
                                <span className="ios-badge-icon">✅</span>
                                <span className="ios-badge-text">Completed</span>
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                            className="ios-checkbox"
                            title={plan.isCompleted ? "Mark as not done" : "Mark as done!"}
                          >
                            {plan.isCompleted && <span className="ios-check">✓</span>}
                          </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="ios-action-row">
                          {plan.website && (
                            <a 
                              href={plan.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="ios-action-button"
                              title="Visit Website"
                            >
                              <span className="ios-action-icon">🌐</span>
                              <span className="ios-action-text">Website</span>
                            </a>
                          )}
                          {plan.mapsLink && (
                            <a 
                              href={plan.mapsLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="ios-action-button"
                              title="Open in Maps"
                            >
                              <span className="ios-action-icon">📍</span>
                              <span className="ios-action-text">Maps</span>
                            </a>
                          )}
                          <button 
                            onClick={() => startEditing(plan)} 
                            className="ios-action-button"
                            title="Edit Plan"
                          >
                            <span className="ios-action-icon">✏️</span>
                            <span className="ios-action-text">Edit</span>
                          </button>
                          <button 
                            onClick={() => removePlan({ id: plan._id })} 
                            className="ios-action-button danger"
                            title="Delete Plan"
                          >
                            <span className="ios-action-icon">🗑️</span>
                            <span className="ios-action-text">Delete</span>
                          </button>
                        </div>

                        {/* Memory Section */}
                        {plan.isCompleted && (
                          <div className="ios-memory-section">
                            {plan.memory ? (
                              <div className="ios-memory-preview">
                                <div className="ios-memory-header">
                                  <span className="ios-memory-title">💖 Our Memory</span>
                                  <button 
                                    onClick={() => editExistingMemory(plan)} 
                                    className="ios-memory-edit"
                                  >
                                    Edit
                                  </button>
                                </div>
                                
                                <div className="ios-memory-rating">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <span key={i} className="ios-star">
                                      {i < plan.memory!.rating ? '💖' : '🤍'}
                                    </span>
                                  ))}
                                </div>
                                
                                {plan.memory.photos.length > 0 && (
                                  <div className="ios-memory-photos">
                                    {plan.memory.photos.slice(0, 3).map((photo, index) => (
                                      <img 
                                        key={index} 
                                        src={photo} 
                                        alt={`Memory ${index + 1}`} 
                                        onClick={() => openImageViewer(photo)}
                                        className="ios-memory-photo"
                                      />
                                    ))}
                                    {plan.memory.photos.length > 3 && (
                                      <div className="ios-memory-more">
                                        +{plan.memory.photos.length - 3}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {plan.memory.notes.length > 0 && (
                                  <div className="ios-memory-note">
                                    "{plan.memory.notes[0].substring(0, 80)}{plan.memory.notes[0].length > 80 ? "..." : ""}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => { 
                                  setSelectedPlan(plan); 
                                  setShowMemoryModal(true); 
                                }} 
                                className="ios-add-memory-button"
                              >
                                <span className="ios-memory-icon">✨</span>
                                <span className="ios-memory-text">Add Memory</span>
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
        </div>
      </div>

      {/* Enhanced Memory Modal */}
      {showMemoryModal && selectedPlan && (
        <div className="ios-modal-overlay">
          <div className="ios-modal">
            <div className="ios-modal-header">
              <h2 className="ios-modal-title">
                {selectedPlan?.memory ? '💖 Edit Memory' : '✨ New Memory'}
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
                className="ios-modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="ios-modal-content">
              {/* Rating */}
              <div className="ios-rating-section">
                <label className="ios-label">How Magical Was It?</label>
                <div className="ios-rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star} 
                      type="button" 
                      onClick={() => setMemoryRating(star)}
                      className={`ios-star-button ${star <= memoryRating ? 'active' : ''}`}
                    >
                      💖
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div className="ios-photo-section">
                <label className="ios-label">Photos</label>
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
                  className="ios-upload-button"
                >
                  {isUploading ? `Uploading... ${uploadProgress}%` : "📸 Add Photo"}
                </button>
                
                {isUploading && (
                  <div className="ios-progress-bar">
                    <div className="ios-progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
                
                <div className="ios-photo-grid">
                  {memoryPhotos.map((photo, index) => (
                    <div key={index} className="ios-photo-item">
                      <img 
                        src={photo} 
                        alt={`Preview ${index + 1}`} 
                        onClick={() => openImageViewer(photo)}
                        className="ios-photo-preview"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemovePhoto(index)} 
                        className="ios-photo-remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="ios-notes-section">
                <label className="ios-label">What Made It Special?</label>
                <div className="ios-note-input-row">
                  <textarea 
                    value={newNote} 
                    onChange={(e) => setNewNote(e.target.value)} 
                    placeholder="Our favorite part was..." 
                    className="ios-textarea"
                  />
                  <div className="ios-note-actions">
                    <button 
                      type="button" 
                      onClick={handleAddNote} 
                      className="ios-button primary small"
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
                        className="ios-button secondary small"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="ios-notes-list">
                  {memoryNotes.map((note, index) => (
                    <div key={index} className="ios-note-item">
                      <span className="ios-note-text">{note}</span>
                      <div className="ios-note-item-actions">
                        <button 
                          type="button" 
                          onClick={() => handleEditNote(index)} 
                          className="ios-note-action"
                        >
                          ✏️
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveNote(index)} 
                          className="ios-note-action danger"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="ios-modal-footer">
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
                className="ios-button secondary"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveMemory} 
                className="ios-button primary"
              >
                💕 Save Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Image Viewer Modal */}
      {imageViewerOpen && (
        <div className="ios-image-viewer-overlay" onClick={closeImageViewer}>
          <div className="ios-image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={closeImageViewer} 
              className="ios-image-viewer-close"
            >
              ✕
            </button>
            <img 
              src={currentImage} 
              alt="Memory Preview" 
              className="ios-image-viewer-image"
            />
          </div>
        </div>
      )}
    </div>
  );
}