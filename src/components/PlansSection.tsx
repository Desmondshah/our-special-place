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
    <div className="pixel-card pixel-fade-in" style={{ margin: '24px', padding: '32px' }}>
      {/* Pixel Art Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '32px',
        padding: '24px',
        background: 'linear-gradient(135deg, var(--pixel-bg-secondary), var(--pixel-bg-tertiary))',
        border: '4px solid var(--pixel-border-primary)',
        borderRadius: '16px',
        boxShadow: '6px 6px 0px var(--pixel-shadow-secondary)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Pixel background pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 10px 10px, var(--pixel-border-secondary) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.3,
          pointerEvents: 'none'
        }} />
        
        <h1 style={{ 
          fontFamily: 'var(--pixel-font-main)',
          fontSize: '48px',
          color: 'var(--pixel-primary)',
          textShadow: '4px 4px 0px var(--pixel-shadow-secondary)',
          margin: '0 0 16px 0',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          position: 'relative',
          zIndex: 1
        }} className="pixel-bounce">
          ⚡ Our Epic Adventures ⚡
        </h1>
        <p style={{ 
          fontFamily: 'var(--pixel-font-main)',
          fontSize: '20px',
          color: 'var(--pixel-text-secondary)',
          margin: '0',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          position: 'relative',
          zIndex: 1
        }}>
          Level up your love story, one quest at a time!
        </p>
        
        {/* Pixel Stats Dashboard */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          marginTop: '24px',
          position: 'relative',
          zIndex: 1
        }}>
          <div className="pixel-card-primary" style={{ 
            padding: '16px', 
            textAlign: 'center',
            border: '3px solid var(--pixel-border-primary)',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--pixel-bg-tertiary), rgba(255, 107, 107, 0.1))',
            boxShadow: '4px 4px 0px var(--pixel-shadow-primary)'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'var(--pixel-primary)',
              textShadow: '2px 2px 0px var(--pixel-shadow-secondary)',
              fontFamily: 'var(--pixel-font-main)'
            }} className="pixel-pulse">
              {stats.totalPlans}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--pixel-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: 'var(--pixel-font-main)'
            }}>
              Total Quests
            </div>
          </div>
          
          <div className="pixel-card-success" style={{ 
            padding: '16px', 
            textAlign: 'center',
            border: '3px solid var(--pixel-success)',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--pixel-bg-tertiary), rgba(150, 206, 180, 0.1))',
            boxShadow: '4px 4px 0px rgba(150, 206, 180, 0.4)'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'var(--pixel-success)',
              textShadow: '2px 2px 0px var(--pixel-shadow-secondary)',
              fontFamily: 'var(--pixel-font-main)'
            }} className="pixel-pulse">
              {stats.completedPlans}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--pixel-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: 'var(--pixel-font-main)'
            }}>
              Completed
            </div>
          </div>
          
          <div className="pixel-card-warning" style={{ 
            padding: '16px', 
            textAlign: 'center',
            border: '3px solid var(--pixel-warning)',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--pixel-bg-tertiary), rgba(255, 234, 167, 0.1))',
            boxShadow: '4px 4px 0px rgba(255, 234, 167, 0.4)'
          }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: 'var(--pixel-warning)',
              textShadow: '2px 2px 0px var(--pixel-shadow-secondary)',
              fontFamily: 'var(--pixel-font-main)'
            }} className="pixel-pulse">
              {stats.memoriesAdded}
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--pixel-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: 'var(--pixel-font-main)'
            }}>
              Memories
            </div>
          </div>
        </div>
      </div>

      {/* Pixel Navigation Controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div className="pixel-nav" style={{ 
          display: 'flex',
          gap: '8px',
          padding: '8px',
          background: 'var(--pixel-bg-secondary)',
          border: '3px solid var(--pixel-border-primary)',
          borderRadius: '16px',
          boxShadow: '4px 4px 0px var(--pixel-shadow-secondary)'
        }}>
          {(["all", "upcoming", "completed", "withMemories"] as const).map(filterKey => (
            <button 
              key={filterKey}
              onClick={() => setViewFilter(filterKey)}
              className={`pixel-tab ${viewFilter === filterKey ? "active" : ""}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                fontSize: '16px',
                fontFamily: 'var(--pixel-font-main)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              <span style={{ fontSize: '18px' }}>
                {filterKey === 'all' && '📋'}
                {filterKey === 'upcoming' && '⏳'}
                {filterKey === 'completed' && '✅'}
                {filterKey === 'withMemories' && '💖'}
              </span>
              <span>
                {filterKey.charAt(0).toUpperCase() + filterKey.slice(1).replace('With', 'With ')}
              </span>
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="pixel-btn-glow"
          style={{
            padding: '16px 24px',
            fontSize: '20px',
            fontFamily: 'var(--pixel-font-main)',
            background: 'linear-gradient(135deg, var(--pixel-primary), var(--pixel-secondary))',
            color: 'white',
            border: '3px solid var(--pixel-primary)',
            borderRadius: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            boxShadow: '4px 4px 0px var(--pixel-shadow-primary)',
            textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
          }}
        >
          {showAddForm ? "❌ Close Form" : "✨ New Quest"}
        </button>
      </div>

      {/* Pixel Add Form */}
      {showAddForm && (
        <div className="pixel-card-dotted pixel-slide-in" style={{ 
          marginBottom: '32px',
          padding: '24px',
          background: 'var(--pixel-bg-tertiary)',
          border: '4px solid var(--pixel-border-secondary)',
          borderRadius: '16px',
          boxShadow: '6px 6px 0px var(--pixel-shadow-secondary)',
          position: 'relative'
        }}>
          <h3 style={{ 
            fontFamily: 'var(--pixel-font-main)',
            fontSize: '28px',
            color: 'var(--pixel-primary)',
            textAlign: 'center',
            margin: '0 0 24px 0',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '2px 2px 0px var(--pixel-shadow-secondary)'
          }} className="pixel-wiggle">
            🎮 Create New Quest! 🎮
          </h3>
          
          <form onSubmit={handleAddPlan}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{ 
                  display: 'block',
                  fontFamily: 'var(--pixel-font-main)',
                  fontSize: '16px',
                  color: 'var(--pixel-text-primary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  🎯 Quest Name:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Our Epic Adventure..."
                  className="pixel-input"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '18px',
                    fontFamily: 'var(--pixel-font-main)',
                    border: '3px solid var(--pixel-border-primary)',
                    borderRadius: '8px',
                    background: 'var(--pixel-bg-tertiary)',
                    boxShadow: 'inset 2px 2px 0px var(--pixel-shadow-secondary)'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block',
                  fontFamily: 'var(--pixel-font-main)',
                  fontSize: '16px',
                  color: 'var(--pixel-text-primary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  📅 Quest Date:
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pixel-input"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '18px',
                    fontFamily: 'var(--pixel-font-main)',
                    border: '3px solid var(--pixel-border-primary)',
                    borderRadius: '8px',
                    background: 'var(--pixel-bg-tertiary)',
                    boxShadow: 'inset 2px 2px 0px var(--pixel-shadow-secondary)'
                  }}
                  required
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block',
                  fontFamily: 'var(--pixel-font-main)',
                  fontSize: '16px',
                  color: 'var(--pixel-text-primary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  🎲 Quest Type:
                </label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="pixel-input"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '18px',
                    fontFamily: 'var(--pixel-font-main)',
                    border: '3px solid var(--pixel-border-primary)',
                    borderRadius: '8px',
                    background: 'var(--pixel-bg-tertiary)',
                    boxShadow: 'inset 2px 2px 0px var(--pixel-shadow-secondary)'
                  }}
                >
                  <option value="date">💖 Romance Quest</option>
                  <option value="trip">✈️ Adventure Quest</option>
                  <option value="activity">🎉 Fun Quest</option>
                  <option value="celebration">🥳 Party Quest</option>
                  <option value="other">🌟 Special Quest</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block',
                  fontFamily: 'var(--pixel-font-main)',
                  fontSize: '16px',
                  color: 'var(--pixel-text-primary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  🌐 Website (Optional):
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="pixel-input"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '18px',
                    fontFamily: 'var(--pixel-font-main)',
                    border: '3px solid var(--pixel-border-primary)',
                    borderRadius: '8px',
                    background: 'var(--pixel-bg-tertiary)',
                    boxShadow: 'inset 2px 2px 0px var(--pixel-shadow-secondary)'
                  }}
                />
              </div>
              
              <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
                <label style={{ 
                  display: 'block',
                  fontFamily: 'var(--pixel-font-main)',
                  fontSize: '16px',
                  color: 'var(--pixel-text-primary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  📍 Maps Link (Optional):
                </label>
                <input
                  type="url"
                  value={mapsLink}
                  onChange={(e) => setMapsLink(e.target.value)}
                  placeholder="Google Maps link..."
                  className="pixel-input"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '18px',
                    fontFamily: 'var(--pixel-font-main)',
                    border: '3px solid var(--pixel-border-primary)',
                    borderRadius: '8px',
                    background: 'var(--pixel-bg-tertiary)',
                    boxShadow: 'inset 2px 2px 0px var(--pixel-shadow-secondary)'
                  }}
                />
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="pixel-btn-secondary"
                style={{
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontFamily: 'var(--pixel-font-main)',
                  background: 'var(--pixel-btn-secondary-bg)',
                  color: 'var(--pixel-btn-secondary-text)',
                  border: '3px solid var(--pixel-btn-secondary-border)',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px var(--pixel-shadow-secondary)'
                }}
              >
                ❌ Cancel
              </button>
              <button 
                type="submit" 
                className="pixel-btn-success"
                style={{
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontFamily: 'var(--pixel-font-main)',
                  background: 'var(--pixel-success)',
                  color: 'white',
                  border: '3px solid var(--pixel-success)',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px rgba(150, 206, 180, 0.4)',
                  textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                }}
              >
                ⚡ Start Quest!
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {sortedPlans.length === 0 && !showAddForm && (
        <div className="empty-state pixel-float" style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'var(--pixel-bg-tertiary)',
          border: '4px dashed var(--pixel-border-primary)',
          borderRadius: '16px',
          margin: '32px 0'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺️</div>
          <h3 style={{ 
            fontSize: '28px', 
            color: 'var(--pixel-text-primary)',
            margin: '0 0 8px 0',
            fontFamily: 'var(--pixel-font-main)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: '2px 2px 0px var(--pixel-shadow-secondary)'
          }}>
            Quest Log Empty!
          </h3>
          <p style={{ 
            color: 'var(--pixel-text-secondary)',
            marginBottom: '24px',
            fontSize: '18px',
            fontFamily: 'var(--pixel-font-main)'
          }}>
            Ready to start your love story adventure? Create your first quest!
          </p>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="pixel-btn-glow"
            style={{
              padding: '16px 32px',
              fontSize: '20px',
              fontFamily: 'var(--pixel-font-main)',
              background: 'linear-gradient(135deg, var(--pixel-primary), var(--pixel-secondary))',
              color: 'white',
              border: '3px solid var(--pixel-primary)',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '6px 6px 0px var(--pixel-shadow-primary)',
              textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
            }}
          >
            🚀 Begin Adventure!
          </button>
        </div>
      )}

      {/* Pixel Quest Cards by Month */}
      {Object.entries(plansByMonth).map(([monthYear, monthPlans]) => (
        <div key={monthYear} style={{ marginBottom: '48px' }}>
          <div style={{ 
            display: 'inline-block',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, var(--pixel-secondary), var(--pixel-accent))',
            color: 'white',
            border: '3px solid var(--pixel-secondary)',
            borderRadius: '12px',
            fontSize: '24px',
            fontFamily: 'var(--pixel-font-main)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '24px',
            boxShadow: '4px 4px 0px rgba(78, 205, 196, 0.4)',
            textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
          }} className="pixel-wiggle">
            📖 {monthYear}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {monthPlans.map((plan: Plan) => (
              <div 
                key={plan._id} 
                className={`pixel-card pixel-fade-in ${plan.memory ? 'pixel-card-primary' : ''}`}
                style={{ 
                  background: plan.isCompleted 
                    ? (plan.memory 
                        ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(150, 206, 180, 0.1))'
                        : 'linear-gradient(135deg, var(--pixel-bg-secondary), rgba(150, 206, 180, 0.1))')
                    : 'linear-gradient(135deg, var(--pixel-bg-secondary), var(--pixel-bg-tertiary))',
                  border: `4px solid ${plan.memory ? 'var(--pixel-primary)' : 'var(--pixel-border-primary)'}`,
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: `6px 6px 0px ${plan.memory ? 'var(--pixel-shadow-primary)' : 'var(--pixel-shadow-secondary)'}`,
                  position: 'relative',
                  opacity: plan.isCompleted ? '0.9' : '1'
                }}
              >
                {editingPlan === plan._id ? (
                  // Edit Form
                  <div className="pixel-slide-in">
                    <h3 style={{ 
                      fontFamily: 'var(--pixel-font-main)',
                      fontSize: '20px',
                      color: 'var(--pixel-primary)',
                      textAlign: 'center',
                      margin: '0 0 16px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      textShadow: '2px 2px 0px var(--pixel-shadow-secondary)'
                    }}>
                      ✏️ Edit Quest
                    </h3>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        className="pixel-input"
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '16px',
                          fontFamily: 'var(--pixel-font-main)',
                          border: '3px solid var(--pixel-border-primary)',
                          borderRadius: '8px',
                          background: 'var(--pixel-bg-tertiary)'
                        }}
                      />
                      <input 
                        type="date" 
                        value={editDate} 
                        onChange={(e) => setEditDate(e.target.value)} 
                        className="pixel-input"
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '16px',
                          fontFamily: 'var(--pixel-font-main)',
                          border: '3px solid var(--pixel-border-primary)',
                          borderRadius: '8px',
                          background: 'var(--pixel-bg-tertiary)'
                        }}
                      />
                      <select 
                        value={editType} 
                        onChange={(e) => setEditType(e.target.value)} 
                        className="pixel-input"
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '16px',
                          fontFamily: 'var(--pixel-font-main)',
                          border: '3px solid var(--pixel-border-primary)',
                          borderRadius: '8px',
                          background: 'var(--pixel-bg-tertiary)'
                        }}
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
                        className="pixel-input"
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '16px',
                          fontFamily: 'var(--pixel-font-main)',
                          border: '3px solid var(--pixel-border-primary)',
                          borderRadius: '8px',
                          background: 'var(--pixel-bg-tertiary)'
                        }}
                      />
                      <input 
                        type="url" 
                        value={editMapsLink} 
                        onChange={(e) => setEditMapsLink(e.target.value)} 
                        placeholder="Maps Link"
                        className="pixel-input"
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '16px',
                          fontFamily: 'var(--pixel-font-main)',
                          border: '3px solid var(--pixel-border-primary)',
                          borderRadius: '8px',
                          background: 'var(--pixel-bg-tertiary)'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => setEditingPlan(null)} 
                        className="pixel-btn-secondary"
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontFamily: 'var(--pixel-font-main)',
                          background: 'var(--pixel-btn-secondary-bg)',
                          color: 'var(--pixel-btn-secondary-text)',
                          border: '3px solid var(--pixel-btn-secondary-border)',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleSaveEdit(plan._id)} 
                        className="pixel-btn-success"
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontFamily: 'var(--pixel-font-main)',
                          background: 'var(--pixel-success)',
                          color: 'white',
                          border: '3px solid var(--pixel-success)',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal Card View
                  <>
                    {/* Card Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, var(--pixel-primary), var(--pixel-secondary))',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        minWidth: '60px',
                        border: '3px solid var(--pixel-primary)',
                        boxShadow: '3px 3px 0px var(--pixel-shadow-primary)',
                        fontFamily: 'var(--pixel-font-main)',
                        textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: '1' }}>
                          {formatDateBadge(plan.date).day}
                        </div>
                        <div style={{ fontSize: '12px', opacity: '0.9', textTransform: 'uppercase' }}>
                          {formatDateBadge(plan.date).month}
                        </div>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          fontSize: '20px',
                          fontFamily: 'var(--pixel-font-main)',
                          color: 'var(--pixel-text-primary)',
                          margin: '0 0 4px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textShadow: '1px 1px 0px var(--pixel-shadow-secondary)',
                          textDecoration: plan.isCompleted ? 'line-through' : 'none',
                          opacity: plan.isCompleted ? '0.7' : '1'
                        }}>
                          <span className="pixel-wiggle" style={{ fontSize: '24px' }}>
                            {getTypeEmoji(plan.type)}
                          </span>
                          {plan.title}
                        </h3>
                        {plan.isCompleted && (
                          <div className="pixel-badge-success" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontFamily: 'var(--pixel-font-main)',
                            background: 'var(--pixel-success)',
                            color: 'white',
                            border: '2px solid var(--pixel-success)',
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                          }}>
                            ✅ Completed
                          </div>
                        )}
                      </div>
                      
                      <div 
                        onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                        className="pixel-checkbox"
                        style={{ 
                          width: '32px',
                          height: '32px',
                          border: '3px solid var(--pixel-border-primary)',
                          borderRadius: '8px',
                          background: plan.isCompleted ? 'var(--pixel-success)' : 'var(--pixel-bg-tertiary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          color: 'white',
                          textShadow: '1px 1px 0px rgba(0,0,0,0.3)',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                        title={plan.isCompleted ? "Mark as not done" : "Mark as done!"}
                      >
                        {plan.isCompleted && '✓'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginBottom: '16px',
                      flexWrap: 'wrap'
                    }}>
                      {plan.website && (
                        <a 
                          href={plan.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="pixel-btn-secondary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 12px',
                            fontSize: '14px',
                            fontFamily: 'var(--pixel-font-main)',
                            background: 'var(--pixel-btn-secondary-bg)',
                            color: 'var(--pixel-btn-secondary-text)',
                            border: '3px solid var(--pixel-btn-secondary-border)',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0px var(--pixel-shadow-secondary)'
                          }}
                          title="Visit Website"
                        >
                          🌐 Site
                        </a>
                      )}
                      {plan.mapsLink && (
                        <a 
                          href={plan.mapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="pixel-btn-secondary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 12px',
                            fontSize: '14px',
                            fontFamily: 'var(--pixel-font-main)',
                            background: 'var(--pixel-btn-secondary-bg)',
                            color: 'var(--pixel-btn-secondary-text)',
                            border: '3px solid var(--pixel-btn-secondary-border)',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            boxShadow: '2px 2px 0px var(--pixel-shadow-secondary)'
                          }}
                          title="Open in Maps"
                        >
                          📍 Maps
                        </a>
                      )}
                      <button 
                        onClick={() => startEditing(plan)} 
                        className="pixel-btn-secondary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 12px',
                          fontSize: '14px',
                          fontFamily: 'var(--pixel-font-main)',
                          background: 'var(--pixel-btn-secondary-bg)',
                          color: 'var(--pixel-btn-secondary-text)',
                          border: '3px solid var(--pixel-btn-secondary-border)',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          boxShadow: '2px 2px 0px var(--pixel-shadow-secondary)'
                        }}
                        title="Edit Plan"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => removePlan({ id: plan._id })} 
                        className="pixel-btn-danger"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '8px 12px',
                          fontSize: '14px',
                          fontFamily: 'var(--pixel-font-main)',
                          background: 'var(--pixel-danger)',
                          color: 'white',
                          border: '3px solid var(--pixel-danger)',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          boxShadow: '2px 2px 0px rgba(214, 48, 49, 0.4)',
                          textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                        }}
                        title="Delete Plan"
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    {/* Memory Actions */}
                    {plan.isCompleted && (
                      <div style={{ 
                        marginBottom: '16px',
                        paddingTop: '16px',
                        borderTop: '2px dashed var(--pixel-border-secondary)'
                      }}>
                        {plan.memory ? (
                          <button 
                            onClick={() => editExistingMemory(plan)} 
                            className="pixel-btn-glow"
                            style={{
                              padding: '10px 16px',
                              fontSize: '16px',
                              fontFamily: 'var(--pixel-font-main)',
                              background: 'linear-gradient(135deg, var(--pixel-primary), var(--pixel-secondary))',
                              color: 'white',
                              border: '3px solid var(--pixel-primary)',
                              borderRadius: '8px',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              cursor: 'pointer',
                              boxShadow: '3px 3px 0px var(--pixel-shadow-primary)',
                              textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                            }}
                          >
                            💖 Edit Memory
                          </button>
                        ) : (
                          <button 
                            onClick={() => { 
                              setSelectedPlan(plan); 
                              setShowMemoryModal(true); 
                            }} 
                            className="pixel-btn-glow"
                            style={{
                              padding: '10px 16px',
                              fontSize: '16px',
                              fontFamily: 'var(--pixel-font-main)',
                              background: 'linear-gradient(135deg, var(--pixel-primary), var(--pixel-secondary))',
                              color: 'white',
                              border: '3px solid var(--pixel-primary)',
                              borderRadius: '8px',
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                              cursor: 'pointer',
                              boxShadow: '3px 3px 0px var(--pixel-shadow-primary)',
                              textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                            }}
                          >
                            ✨ Add Memory
                          </button>
                        )}
                      </div>
                    )}

                    {/* Memory Preview */}
                    {plan.memory && (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(175, 82, 222, 0.1))',
                        border: '3px solid var(--pixel-primary)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginTop: '16px'
                      }}>
                        <div style={{
                          fontSize: '18px',
                          fontFamily: 'var(--pixel-font-main)',
                          color: 'var(--pixel-primary)',
                          margin: '0 0 12px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textShadow: '1px 1px 0px var(--pixel-shadow-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px'
                        }}>
                          💖 Our Memory
                        </div>
                        
                        <div style={{ 
                          display: 'flex',
                          gap: '4px',
                          marginBottom: '12px',
                          justifyContent: 'center'
                        }}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} style={{ 
                              fontSize: '18px',
                              filter: 'drop-shadow(1px 1px 0px rgba(0,0,0,0.3))'
                            }}>
                              {i < plan.memory!.rating ? '💖' : '🤍'}
                            </span>
                          ))}
                        </div>
                        
                        {plan.memory.photos.length > 0 && (
                          <div style={{ 
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '12px',
                            overflowX: 'auto',
                            paddingBottom: '4px'
                          }}>
                            {plan.memory.photos.slice(0, 3).map((photo, index) => (
                              <img 
                                key={index} 
                                src={photo} 
                                alt={`Memory ${index + 1}`} 
                                onClick={() => openImageViewer(photo)}
                                style={{
                                  width: '64px',
                                  height: '64px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '3px solid var(--pixel-border-accent)',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  boxShadow: '2px 2px 0px var(--pixel-shadow-secondary)',
                                  imageRendering: 'pixelated'
                                }}
                              />
                            ))}
                            {plan.memory.photos.length > 3 && (
                              <div style={{ 
                                width: '64px',
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--pixel-bg-secondary)',
                                border: '3px dashed var(--pixel-border-primary)',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontFamily: 'var(--pixel-font-main)',
                                fontWeight: 'bold',
                                color: 'var(--pixel-text-secondary)',
                                flexShrink: 0
                              }}>
                                +{plan.memory.photos.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {plan.memory.notes.length > 0 && (
                          <div style={{
                            fontSize: '14px',
                            fontFamily: 'var(--pixel-font-main)',
                            color: 'var(--pixel-text-secondary)',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.5)',
                            padding: '8px',
                            borderRadius: '8px',
                            border: '2px solid var(--pixel-border-secondary)'
                          }}>
                            "{plan.memory.notes[0].substring(0, 100)}{plan.memory.notes[0].length > 100 ? "..." : ""}"
                          </div>
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

      {/* Pixel Memory Modal */}
      {showMemoryModal && selectedPlan && (
        <div className="pixel-modal-overlay">
          <div className="pixel-modal" style={{ maxWidth: '600px', width: '90%' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '3px solid var(--pixel-border-primary)'
            }}>
              <h2 style={{ 
                fontFamily: 'var(--pixel-font-main)',
                fontSize: '28px',
                color: 'var(--pixel-primary)',
                margin: '0',
                textShadow: '2px 2px 0px var(--pixel-shadow-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }} className="pixel-wiggle">
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
                className="pixel-modal-close"
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--pixel-danger)',
                  color: 'white',
                  border: '3px solid var(--pixel-danger)',
                  borderRadius: '50%',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--pixel-font-main)',
                  boxShadow: '3px 3px 0px rgba(214, 48, 49, 0.4)'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
              {/* Rating */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block',
                  fontFamily: 'var(--pixel-font-main)',
                  fontSize: '18px',
                  color: 'var(--pixel-text-primary)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  🌟 How Magical Was It?
                </label>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star} 
                      type="button" 
                      onClick={() => setMemoryRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '32px',
                        cursor: 'pointer',
                        opacity: star <= memoryRating ? 1 : 0.3,
                        transition: 'all 0.2s ease',
                        filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.3))',
                        transform: star <= memoryRating ? 'scale(1.1)' : 'scale(1)'
                      }}
                      className={star <= memoryRating ? 'pixel-pulse' : ''}
                    >
                      💖
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block',
                  fontFamily: 'var(--pixel-font-main)',
                  fontSize: '18px',
                  color: 'var(--pixel-text-primary)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  📸 Show Me The Pictures!
                </label>
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
                  className="pixel-btn-glow"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '18px',
                    fontFamily: 'var(--pixel-font-main)',
                    background: 'linear-gradient(135deg, var(--pixel-secondary), var(--pixel-accent))',
                    color: 'white',
                    border: '3px solid var(--pixel-secondary)',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    boxShadow: '4px 4px 0px rgba(78, 205, 196, 0.4)',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.3)',
                    opacity: isUploading ? 0.7 : 1
                  }}
                >
                  {isUploading ? `⏳ Uploading... ${uploadProgress}%` : "📸 Add Photo"}
                </button>
                
                {isUploading && (
                  <div className="pixel-progress" style={{ marginTop: '12px' }}>
                    <div className="pixel-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  {memoryPhotos.map((photo, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img 
                        src={photo} 
                        alt={`Preview ${index + 1}`} 
                        onClick={() => openImageViewer(photo)}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '3px solid var(--pixel-border-accent)',
                          cursor: 'pointer',
                          boxShadow: '3px 3px 0px var(--pixel-shadow-secondary)',
                          imageRendering: 'pixelated'
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemovePhoto(index)} 
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: 'var(--pixel-danger)',
                          color: 'white',
                          border: '2px solid white',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontFamily: 'var(--pixel-font-main)',
                          boxShadow: '2px 2px 0px rgba(214, 48, 49, 0.4)'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block',
                  fontFamily: 'var(--pixel-font-main)',
                  fontSize: '18px',
                  color: 'var(--pixel-text-primary)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  📝 What Made It Special?
                </label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <textarea 
                    value={newNote} 
                    onChange={(e) => setNewNote(e.target.value)} 
                    placeholder="Our favorite part was..." 
                    className="pixel-input"
                    style={{
                      flex: 1,
                      minHeight: '80px',
                      padding: '12px',
                      fontSize: '16px',
                      fontFamily: 'var(--pixel-font-main)',
                      border: '3px solid var(--pixel-border-primary)',
                      borderRadius: '8px',
                      background: 'var(--pixel-bg-tertiary)',
                      boxShadow: 'inset 2px 2px 0px var(--pixel-shadow-secondary)',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      type="button" 
                      onClick={handleAddNote} 
                      className="pixel-btn-primary"
                      style={{
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontFamily: 'var(--pixel-font-main)',
                        background: 'var(--pixel-primary)',
                        color: 'white',
                        border: '3px solid var(--pixel-primary)',
                        borderRadius: '8px',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        boxShadow: '3px 3px 0px var(--pixel-shadow-primary)',
                        textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                      }}
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
                        className="pixel-btn-secondary"
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontFamily: 'var(--pixel-font-main)',
                          background: 'var(--pixel-btn-secondary-bg)',
                          color: 'var(--pixel-btn-secondary-text)',
                          border: '3px solid var(--pixel-btn-secondary-border)',
                          borderRadius: '8px',
                          textTransform: 'uppercase',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {memoryNotes.map((note, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--pixel-bg-secondary)',
                      border: '3px solid var(--pixel-border-secondary)',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      boxShadow: '2px 2px 0px var(--pixel-shadow-secondary)'
                    }}>
                      <span style={{ 
                        flex: 1, 
                        fontSize: '14px',
                        fontFamily: 'var(--pixel-font-main)',
                        color: 'var(--pixel-text-primary)'
                      }}>
                        {note}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => handleEditNote(index)} 
                        style={{
                          background: 'var(--pixel-btn-secondary-bg)',
                          color: 'var(--pixel-btn-secondary-text)',
                          border: '2px solid var(--pixel-btn-secondary-border)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'var(--pixel-font-main)'
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveNote(index)} 
                        style={{
                          background: 'var(--pixel-danger)',
                          color: 'white',
                          border: '2px solid var(--pixel-danger)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontFamily: 'var(--pixel-font-main)',
                          textShadow: '1px 1px 0px rgba(0,0,0,0.3)'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex',
              gap: '16px',
              justifyContent: 'flex-end',
              paddingTop: '16px',
              borderTop: '3px solid var(--pixel-border-primary)'
            }}>
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
                className="pixel-btn-secondary"
                style={{
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontFamily: 'var(--pixel-font-main)',
                  background: 'var(--pixel-btn-secondary-bg)',
                  color: 'var(--pixel-btn-secondary-text)',
                  border: '3px solid var(--pixel-btn-secondary-border)',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px var(--pixel-shadow-secondary)'
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveMemory} 
                className="pixel-btn-glow"
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontFamily: 'var(--pixel-font-main)',
                  background: 'linear-gradient(135deg, var(--pixel-primary), var(--pixel-secondary))',
                  color: 'white',
                  border: '3px solid var(--pixel-primary)',
                  borderRadius: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '4px 4px 0px var(--pixel-shadow-primary)',
                  textShadow: '2px 2px 0px rgba(0,0,0,0.3)'
                }}
              >
                💕 Save Memory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pixel Image Viewer Modal */}
      {imageViewerOpen && (
        <div className="pixel-modal-overlay" onClick={closeImageViewer}>
          <div style={{ 
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            background: 'var(--pixel-bg-secondary)',
            border: '4px solid var(--pixel-border-primary)',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '8px 8px 0px var(--pixel-shadow-dark)'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={closeImageViewer} 
              style={{
                position: 'absolute',
                top: '-16px',
                right: '-16px',
                width: '40px',
                height: '40px',
                background: 'var(--pixel-danger)',
                color: 'white',
                border: '3px solid white',
                borderRadius: '50%',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--pixel-font-main)',
                boxShadow: '4px 4px 0px rgba(214, 48, 49, 0.4)',
                zIndex: 10
              }}
            >
              ✕
            </button>
            <img 
              src={currentImage} 
              alt="Memory Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '80vh', 
                objectFit: 'contain',
                borderRadius: '12px',
                imageRendering: 'pixelated'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}