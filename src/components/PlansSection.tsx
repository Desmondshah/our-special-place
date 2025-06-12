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
    setUploadProgress(0); // Reset progress
    
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
    const date = new Date(dateStr + 'T00:00:00'); // Ensure date is parsed in local timezone
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
      'date': '💖', // Sparkling Heart
      'trip': '✈️', // Airplane
      'activity': '🎉', // Party Popper
      'celebration': '🥳', // Partying Face
      'other': '🌟' // Glowing Star
    };
    return emojis[type] || '✨'; // Default: Sparkles
  };
  
  const formatDateBadge = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase()
    };
  };


  return (
    <div className="plans-section-cute">
      {/* Header with add button and filters */}
      <div className="plans-header-cute">
        <h2 className="plans-title-cute">Our Adventures & Memories 💖</h2>
        <div className="plans-controls-cute">
          <div className="plans-filter-tabs-cute">
            {(["all", "upcoming", "completed", "withMemories"] as const).map(filterKey => (
              <button 
                key={filterKey}
                onClick={() => setViewFilter(filterKey)}
                className={`plans-filter-tab-cute ${viewFilter === filterKey ? "active" : ""}`}
              >
                {filterKey.charAt(0).toUpperCase() + filterKey.slice(1).replace('With', 'With ')}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="plans-add-button-cute"
          >
            {showAddForm ? "Close Form 📖" : "New Plan! ✨"}
          </button>
        </div>
      </div>

      {/* Add Plan Form (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAddPlan} className="plans-add-form-cute">
          <h3 className="plans-form-title-cute">Plan a New Memory! 🎨</h3>
          <div className="plans-form-grid-cute">
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the adventure?" className="plans-input-cute" required
            />
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="plans-input-cute" required
            />
            <select value={type} onChange={(e) => setType(e.target.value)} className="plans-input-cute">
              <option value="date">Date Night 💖</option>
              <option value="trip">Awesome Trip ✈️</option>
              <option value="activity">Fun Activity 🎉</option>
              <option value="celebration">Big Celebration 🥳</option>
              <option value="other">Something Else 🌟</option>
            </select>
            <input
              type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
              placeholder="Website Link (Optional)" className="plans-input-cute"
            />
            <input
              type="url" value={mapsLink} onChange={(e) => setMapsLink(e.target.value)}
              placeholder="Google Maps Link (Optional)" className="plans-input-cute full-width"
            />
          </div>
          <div className="plans-form-actions-cute">
            <button type="button" onClick={() => setShowAddForm(false)} className="plans-button-cute cancel">
              Nevermind
            </button>
            <button type="submit" className="plans-button-cute save">
              Let's Do It! 💕
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {sortedPlans.length === 0 && !showAddForm && (
        <div className="plans-empty-state-cute">
          <span className="plans-empty-icon-cute">🗺️</span>
          <h3 className="plans-empty-title-cute">Our Adventure Book is Blank!</h3>
          <p className="plans-empty-text-cute">Let's fill it with wonderful plans and memories!</p>
          <button onClick={() => setShowAddForm(true)} className="plans-empty-button-cute">
            Plan Our First Adventure! ✨
          </button>
        </div>
      )}

      {/* Plans List */}
      <div className="plans-list-container-cute">
        {Object.entries(plansByMonth).map(([monthYear, monthPlans]) => (
          <div key={monthYear} className="plans-month-group-cute">
            <h3 className="plans-month-header-cute">{monthYear}</h3>
            <div className={`plans-grid-cute ${isMobile ? 'mobile' : ''}`}>
              {monthPlans.map((plan: Plan) => (
                <div 
                  key={plan._id} 
                  className={`plan-card-cute ${plan.isCompleted ? "completed" : "upcoming"} ${plan.memory ? "has-memory" : ""}`}
                >
                  {editingPlan === plan._id ? (
                    <div className="plan-edit-form-cute">
                      <h3 className="plan-edit-title-cute">Update Our Plan! ✏️</h3>
                       <div className="plans-form-grid-cute compact">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="plans-input-cute" />
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="plans-input-cute" />
                        <select value={editType} onChange={(e) => setEditType(e.target.value)} className="plans-input-cute">
                          <option value="date">Date Night 💖</option>
                          <option value="trip">Awesome Trip ✈️</option>
                          <option value="activity">Fun Activity 🎉</option>
                          <option value="celebration">Big Celebration 🥳</option>
                          <option value="other">Something Else 🌟</option>
                        </select>
                        <input type="url" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="Website" className="plans-input-cute" />
                        <input type="url" value={editMapsLink} onChange={(e) => setEditMapsLink(e.target.value)} placeholder="Maps Link" className="plans-input-cute full-width" />
                      </div>
                      <div className="plan-edit-actions-cute">
                        <button onClick={() => setEditingPlan(null)} className="plans-button-cute cancel small">Cancel</button>
                        <button onClick={() => handleSaveEdit(plan._id)} className="plans-button-cute save small">Save Changes</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="plan-card-header-cute">
                        <div className="plan-date-badge-cute">
                          <span className="day">{formatDateBadge(plan.date).day}</span>
                          <span className="month">{formatDateBadge(plan.date).month}</span>
                        </div>
                        <h3 className="plan-title-cute">
                          <span className="plan-type-emoji-cute">{getTypeEmoji(plan.type)}</span>
                          {plan.title}
                        </h3>
                        <div 
                            onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                            className={`plan-checkbox-cute ${plan.isCompleted ? "checked" : ""}`}
                            title={plan.isCompleted ? "Mark as not done" : "Mark as done!"}
                        >
                            {plan.isCompleted && '✔'}
                        </div>
                      </div>
                      
                      <div className="plan-card-actions-cute">
                        {plan.website && <a href={plan.website} target="_blank" rel="noopener noreferrer" className="plan-action-button-cute link" title="Visit Website">🌐</a>}
                        {plan.mapsLink && <a href={plan.mapsLink} target="_blank" rel="noopener noreferrer" className="plan-action-button-cute link" title="Open in Maps">📍</a>}
                        <button onClick={() => startEditing(plan)} className="plan-action-button-cute edit" title="Edit Plan">✏️</button>
                        <button onClick={() => removePlan({ id: plan._id })} className="plan-action-button-cute delete" title="Delete Plan">🗑️</button>
                      </div>

                      {plan.isCompleted && (
                        <div className="plan-memory-actions-cute">
                          {plan.memory ? (
                            <button onClick={() => editExistingMemory(plan)} className="plans-button-cute memory small">Edit Memory 💖</button>
                          ) : (
                            <button onClick={() => { setSelectedPlan(plan); setShowMemoryModal(true); }} className="plans-button-cute add-memory small">Add Memory ✨</button>
                          )}
                        </div>
                      )}

                      {plan.memory && (
                        <div className="plan-memory-preview-cute">
                          <h4 className="plan-memory-title-cute">Our Sweet Memory</h4>
                          <div className="plan-memory-rating-cute">
                            Rating: {'💖'.repeat(plan.memory.rating)}{'🤍'.repeat(5 - plan.memory.rating)}
                          </div>
                          {plan.memory.photos.length > 0 && (
                            <div className="plan-memory-photos-cute">
                              {plan.memory.photos.slice(0, isMobile ? 2 : 3).map((photo, index) => (
                                <img key={index} src={photo} alt={`Memory ${index + 1}`} onClick={() => openImageViewer(photo)} className="plan-memory-photo-thumb-cute"/>
                              ))}
                              {plan.memory.photos.length > (isMobile ? 2 : 3) && <div className="plan-memory-photo-more-cute">+{plan.memory.photos.length - (isMobile ? 2 : 3)}</div>}
                            </div>
                          )}
                           {plan.memory.notes.length > 0 && (
                             <p className="plan-memory-note-excerpt-cute">"{plan.memory.notes[0].substring(0, 50)}{plan.memory.notes[0].length > 50 ? "..." : ""}"</p>
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

      {/* Memory Modal */}
      {showMemoryModal && selectedPlan && (
        <div className="memory-modal-overlay-cute">
          <div className="memory-modal-cute">
            <h2 className="memory-modal-title-cute">
              {selectedPlan?.memory ? 'Relive This Moment 💖' : 'Capture This Moment! ✨'}
            </h2>
            
            <div className="memory-rating-input-cute">
              <label>How magical was it?</label>
              <div className="memory-stars-cute">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star} type="button" onClick={() => setMemoryRating(star)}
                    className={`memory-star-button-cute ${star <= memoryRating ? "selected" : ""}`}
                  >💖</button>
                ))}
              </div>
            </div>

            <div className="memory-photos-upload-cute">
              <label>Show me the pictures!</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="memory-file-input-cute" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="plans-button-cute upload">
                {isUploading ? `Uploading... ${uploadProgress}%` : "Add Photo 🖼️"}
              </button>
              {isUploading && <div className="memory-progress-bar-cute" style={{ width: `${uploadProgress}%` }}></div>}
              <div className="memory-photo-previews-cute">
                {memoryPhotos.map((photo, index) => (
                  <div key={index} className="memory-photo-preview-item-cute">
                    <img src={photo} alt={`Preview ${index + 1}`} onClick={() => openImageViewer(photo)}/>
                    <button type="button" onClick={() => handleRemovePhoto(index)} className="memory-remove-photo-button-cute">🗑️</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="memory-notes-input-cute">
              <label>What made it special?</label>
              <div className="memory-note-add-form-cute">
                <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Our favorite part was..." className="memory-textarea-cute"/>
                <button type="button" onClick={handleAddNote} className="plans-button-cute add-note">
                  {editingNoteIndex >= 0 ? "Update Note ✏️" : "Add Note 📝"}
                </button>
                {editingNoteIndex >= 0 && (
                    <button type="button" onClick={() => { setNewNote(""); setEditingNoteIndex(-1);}} className="plans-button-cute cancel-note small">
                        Cancel Edit
                    </button>
                )}
              </div>
              <div className="memory-notes-list-cute">
                {memoryNotes.map((note, index) => (
                  <div key={index} className="memory-note-item-cute">
                    <span>{note}</span>
                    <div className="memory-note-actions-cute">
                        <button type="button" onClick={() => handleEditNote(index)} className="memory-edit-note-button-cute">✏️</button>
                        <button type="button" onClick={() => handleRemoveNote(index)} className="memory-remove-note-button-cute">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="memory-modal-actions-cute">
              <button type="button" onClick={() => { setShowMemoryModal(false); setSelectedPlan(null); setMemoryPhotos([]); setMemoryRating(5); setMemoryNotes([]); setNewNote(""); setEditingNoteIndex(-1);}} className="plans-button-cute cancel">
                Close
              </button>
              <button type="button" onClick={handleSaveMemory} className="plans-button-cute save">
                Save Memory 💕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-size Image Viewer Modal */}
      {imageViewerOpen && (
        <div className="image-viewer-overlay-cute" onClick={closeImageViewer}>
          <div className="image-viewer-content-cute" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeImageViewer} className="image-viewer-close-button-cute">X</button>
            <img src={currentImage} alt="Memory Preview" className="image-viewer-image-cute"/>
          </div>
        </div>
      )}
    </div>
  );
}