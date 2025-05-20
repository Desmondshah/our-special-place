import { useState, useRef } from "react";
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
// IMPORTANT: Add your Cloudinary credentials here
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
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number>(-1);
  
  // View states
  const [viewFilter, setViewFilter] = useState<string>("all");
  const [expandedMemory, setExpandedMemory] = useState<Id<"plans"> | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string>("");
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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
    try {
      // FIX: Date issue by preserving the selected date without timezone conversion
      // Simply use the date string directly as it's already in YYYY-MM-DD format
      await addPlan({
        title,
        date, // Use date directly without conversion
        type,
        website,
        mapsLink,
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
    try {
      // FIX: Same as above, use the date string directly
      await updatePlan({
        id: planId,
        title: editTitle,
        date: editDate, // Use date directly without conversion
        type: editType,
        website: editWebsite,
        mapsLink: editMapsLink,
      });
      setEditingPlan(null);
    } catch (error) {
      console.error("Failed to update plan:", error);
    }
  };

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url); // Return the secure CDN URL
        } else {
          reject(new Error('Upload failed'));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error('Upload failed'));
      };
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, true);
      xhr.send(formData);
    });
  };

  // File validation
  const isFileSizeValid = (file: File, maxSizeMB: number = 5): boolean => {
    return file.size <= maxSizeMB * 1024 * 1024;
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Process only one file at a time
      const file = files[0];
      
      // Check file size
      if (!isFileSizeValid(file)) {
        alert("Image is too large! Please select an image under 5MB.");
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file);
      
      // Store the Cloudinary URL
      setMemoryPhotos([...memoryPhotos, cloudinaryUrl]);
      
      setUploadProgress(100);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to process file:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      // Short delay to show 100% before resetting
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleAddNote = () => {
    if (editingNoteIndex >= 0) {
      // Update existing note
      if (newNote.trim()) {
        const updatedNotes = [...memoryNotes];
        updatedNotes[editingNoteIndex] = newNote;
        setMemoryNotes(updatedNotes);
        setNewNote("");
        setEditingNoteIndex(-1);
      }
    } else {
      // Add new note
      if (newNote && !memoryNotes.includes(newNote)) {
        setMemoryNotes([...memoryNotes, newNote]);
        setNewNote("");
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = [...memoryPhotos];
    updatedPhotos.splice(index, 1);
    setMemoryPhotos(updatedPhotos);
  };

  const handleRemoveNote = (index: number) => {
    const updatedNotes = [...memoryNotes];
    updatedNotes.splice(index, 1);
    setMemoryNotes(updatedNotes);
  };
  
  const handleEditNote = (index: number) => {
    setNewNote(memoryNotes[index]);
    setEditingNoteIndex(index);
  };

  const handleSaveMemory = async () => {
    if (!selectedPlan) {
      console.error("No plan selected for memory");
      return;
    }

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
      setNewPhotoUrl("");
      setSelectedPlan(null);
    } catch (error) {
      console.error("Failed to save memory:", error);
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

  // Handle edit existing memory
  const editExistingMemory = (plan: Plan) => {
    if (!plan.memory) return;
    
    setSelectedPlan(plan);
    setMemoryRating(plan.memory.rating);
    setMemoryPhotos([...plan.memory.photos]);
    setMemoryNotes([...plan.memory.notes]);
    setShowMemoryModal(true);
  };

  // Filter plans based on viewFilter
  const filteredPlans = plans.filter(plan => {
    if (viewFilter === "all") return true;
    if (viewFilter === "upcoming") return !plan.isCompleted;
    if (viewFilter === "completed") return plan.isCompleted;
    if (viewFilter === "withMemories") return Boolean(plan.memory);
    return true;
  });

  // Sort plans: upcoming first, then completed with memories, then completed without memories
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    // First sort by completion status
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    
    // For completed plans, ones with memories come first
    if (a.isCompleted && b.isCompleted) {
      if ((a.memory && b.memory) || (!a.memory && !b.memory)) {
        // If both have memories or both don't, sort by date (most recent first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.memory ? -1 : 1;
    }
    
    // For upcoming plans, sort by date (closest first)
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Group plans by month for better organization
  const getMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
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

  // Get type emoji
  const getTypeEmoji = (type: string): string => {
    switch(type) {
      case 'date': return '💑';
      case 'trip': return '✈️';
      case 'activity': return '🎯';
      case 'celebration': return '🎉';
      default: return '✨';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with add button and filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl text-[#FF6B6B] font-bold pixel-title-small">Our Plans & Memories</h2>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* View filters */}
          <div className="flex justify-center bg-[#FFF1E6] rounded-full p-1 border-2 border-[#FFDAB9] w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setViewFilter("all")}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${viewFilter === "all" ? "bg-[#FFB6B6] text-white shadow-inner" : "text-[#8D6E63] hover:bg-[#FFE0B2]"}`}
            >
              All
            </button>
            <button 
              onClick={() => setViewFilter("upcoming")}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${viewFilter === "upcoming" ? "bg-[#FFB6B6] text-white shadow-inner" : "text-[#8D6E63] hover:bg-[#FFE0B2]"}`}
            >
              Upcoming
            </button>
            <button 
              onClick={() => setViewFilter("completed")}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${viewFilter === "completed" ? "bg-[#FFB6B6] text-white shadow-inner" : "text-[#8D6E63] hover:bg-[#FFE0B2]"}`}
            >
              Done
            </button>
            <button 
              onClick={() => setViewFilter("withMemories")}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-all whitespace-nowrap ${viewFilter === "withMemories" ? "bg-[#FFB6B6] text-white shadow-inner" : "text-[#8D6E63] hover:bg-[#FFE0B2]"}`}
            >
              Memories
            </button>
          </div>
          
          {/* Add plan button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20] text-sm px-4 py-2 flex items-center justify-center w-full sm:w-auto"
          >
            {showAddForm ? "Hide Form ▲" : "Add New Plan ▼"}
          </button>
        </div>
      </div>

      {/* Add Plan Form (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAddPlan} className="space-y-4 bg-[#FFF5EE] rounded-xl border-4 border-[#FFDAB9] p-4 shadow-lg transition-all duration-300 mb-6">
          <h3 className="text-xl text-[#FF6B6B] mb-4 text-center">New Adventure 💫</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#8D6E63] mb-1 text-sm">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the plan?"
                className="pixel-input w-full text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-[#8D6E63] mb-1 text-sm">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pixel-input w-full text-sm"
                required
              />
            </div>
            
            <div>
              <label className="block text-[#8D6E63] mb-1 text-sm">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="pixel-input w-full text-sm"
              >
                <option value="date">Date Night 💑</option>
                <option value="trip">Trip ✈️</option>
                <option value="activity">Activity 🎯</option>
                <option value="celebration">Celebration 🎉</option>
                <option value="other">Other ✨</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[#8D6E63] mb-1 text-sm">Website (optional)</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. restaurant website"
                className="pixel-input w-full text-sm"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-[#8D6E63] mb-1 text-sm">Google Maps Link (optional)</label>
              <input
                type="url"
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                placeholder="Location link"
                className="pixel-input w-full text-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C] px-4 py-2 text-sm w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20] px-4 py-2 text-sm w-full sm:w-auto"
            >
              Save Plan 💕
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {sortedPlans.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 bg-[#FFF5EE] rounded-xl border-4 border-dashed border-[#FFDAB9]">
          <span className="text-5xl mb-4">🌱</span>
          <h3 className="text-xl text-[#FF6B6B] mb-2">No Plans Yet</h3>
          <p className="text-[#8D6E63] text-center mb-4">Create your first adventure by clicking the "Add New Plan" button above!</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20] px-4 py-2 text-sm"
          >
            Add Your First Plan 💕
          </button>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-6">
        {Object.entries(plansByMonth).map(([monthYear, monthPlans]) => (
          <div key={monthYear} className="space-y-3">
            <h3 className="text-lg text-[#8D6E63] font-semibold mx-2 py-1 px-3 bg-[#FFE0B2] inline-block rounded-lg border-2 border-[#FFDAB9]">
              {monthYear}
            </h3>
            
            <div className="space-y-4">
              {monthPlans.map((plan: Plan) => (
                <div 
                  key={plan._id} 
                  className={`bg-[#FFF5EE] rounded-xl border-4 ${plan.isCompleted ? 'border-[#FFDAB9]' : 'border-[#FFB6B6]'} p-4 shadow-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl`}
                >
                  {editingPlan === plan._id ? (
                    <div className="space-y-3 w-full">
                      <h3 className="text-xl text-[#FF6B6B] mb-2 text-center">Edit Plan</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[#8D6E63] mb-1 text-xs">Title</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="pixel-input w-full text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[#8D6E63] mb-1 text-xs">Date</label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="pixel-input w-full text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[#8D6E63] mb-1 text-xs">Type</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="pixel-input w-full text-sm"
                          >
                            <option value="date">Date Night 💑</option>
                            <option value="trip">Trip ✈️</option>
                            <option value="activity">Activity 🎯</option>
                            <option value="celebration">Celebration 🎉</option>
                            <option value="other">Other ✨</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-[#8D6E63] mb-1 text-xs">Website</label>
                          <input
                            type="url"
                            value={editWebsite}
                            onChange={(e) => setEditWebsite(e.target.value)}
                            placeholder="Website link (optional)"
                            className="pixel-input w-full text-sm"
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-[#8D6E63] mb-1 text-xs">Maps Link</label>
                          <input
                            type="url"
                            value={editMapsLink}
                            onChange={(e) => setEditMapsLink(e.target.value)}
                            placeholder="Google Maps link (optional)"
                            className="pixel-input w-full text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 justify-end mt-3">
                        <button
                          onClick={() => setEditingPlan(null)}
                          className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C] px-3 py-1 text-sm w-full sm:w-auto"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(plan._id)}
                          className="pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20] px-3 py-1 text-sm w-full sm:w-auto"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <div 
                            onClick={() => togglePlan({ id: plan._id, isCompleted: !plan.isCompleted })}
                            className={`w-6 h-6 rounded-md border-2 cursor-pointer transition-all flex items-center justify-center 
                              ${plan.isCompleted 
                                ? 'bg-[#A5D6A7] border-[#81C784] text-[#1B5E20]' 
                                : 'bg-[#FFCCBC] border-[#FFAB91]'}`}
                          >
                            {plan.isCompleted && <span>✓</span>}
                          </div>
                          
                          {/* Title and date */}
                          <div>
                            <h3 className="text-lg sm:text-xl font-semibold text-[#5D4037] flex items-center gap-2">
                              <span className="mr-1">{getTypeEmoji(plan.type)}</span>
                              {plan.title}
                            </h3>
                            <p className="text-sm text-[#8D6E63]">
                              {new Date(plan.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {plan.website && (
                            <a
                              href={plan.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pixel-button bg-[#FFE0B2] text-xs px-2 py-1 flex items-center gap-1"
                              title="Visit Website"
                            >
                              <span>🌐</span>
                              <span className="hidden sm:inline">Website</span>
                            </a>
                          )}
                          
                          {plan.mapsLink && (
                            <a
                              href={plan.mapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pixel-button bg-[#FFE0B2] text-xs px-2 py-1 flex items-center gap-1"
                              title="Open in Maps"
                            >
                              <span>📍</span>
                              <span className="hidden sm:inline">Maps</span>
                            </a>
                          )}
                          
                          <button
                            onClick={() => startEditing(plan)}
                            className="pixel-button bg-[#FFE0B2] text-xs px-2 py-1 flex items-center gap-1"
                            title="Edit Plan"
                          >
                            <span>✏️</span>
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          
                          {plan.isCompleted && !plan.memory && (
                            <button
                              onClick={() => {
                                setSelectedPlan(plan);
                                setShowMemoryModal(true);
                              }}
                              className="pixel-button bg-[#FFE0B2] text-xs px-2 py-1 flex items-center gap-1"
                              title="Add Memory"
                            >
                              <span>💝</span>
                              <span className="hidden sm:inline">Add Memory</span>
                            </button>
                          )}
                          
                          {plan.isCompleted && plan.memory && (
                            <button
                              onClick={() => editExistingMemory(plan)}
                              className="pixel-button bg-[#FFE0B2] text-xs px-2 py-1 flex items-center gap-1"
                              title="Edit Memory"
                            >
                              <span>✨</span>
                              <span className="hidden sm:inline">Edit Memory</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => removePlan({ id: plan._id })}
                            className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C] text-xs px-2 py-1 flex items-center gap-1"
                            title="Delete Plan"
                          >
                            <span>✕</span>
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Memory display */}
                      {plan.memory && (
                        <div className="mt-4 p-4 bg-[#FFF1E6] rounded-lg border-2 border-[#FFDAB9]">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm sm:text-base font-semibold text-[#FF6B6B] flex items-center gap-2">
                              <span>💝</span> Our Memory
                            </h4>
                            <button
                              onClick={() => setExpandedMemory(expandedMemory === plan._id ? null : plan._id)}
                              className="text-xs text-[#8D6E63] hover:text-[#5D4037]"
                            >
                              {expandedMemory === plan._id ? "Show Less ▲" : "Show More ▼"}
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-1 mb-2">
                            <span className="text-xs text-[#8D6E63]">Rating: </span>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={star <= plan.memory!.rating ? "text-yellow-500" : "text-gray-300"}>
                                {star <= plan.memory!.rating ? "⭐" : "☆"}
                              </span>
                            ))}
                          </div>
                          
                          {/* Photo preview (always visible) */}
                          {plan.memory.photos.length > 0 && (
                            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                              {plan.memory.photos.slice(0, expandedMemory === plan._id ? plan.memory.photos.length : 3).map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Memory ${index + 1}`}
                                  onClick={() => openImageViewer(photo)}
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-[#FFDAB9] cursor-pointer photo-hover"
                                />
                              ))}
                              {plan.memory.photos.length > 3 && expandedMemory !== plan._id && (
                                <div 
                                  className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FFDAB9] bg-opacity-50 rounded-lg flex items-center justify-center cursor-pointer"
                                  onClick={() => setExpandedMemory(plan._id)}
                                >
                                  <span className="text-lg text-[#5D4037]">+{plan.memory.photos.length - 3}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Expanded content */}
                          {expandedMemory === plan._id && (
                            <div className="mt-2 space-y-2 animate-fade-in">
                              {plan.memory.notes.length > 0 && (
                                <div className="space-y-1 bg-white bg-opacity-50 p-2 rounded-lg">
                                  {plan.memory.notes.map((note, index) => (
                                    <p key={index} className="text-xs sm:text-sm text-[#5D4037] flex items-start justify-between">
                                      <span>
                                        <span className="text-[#FF6B6B] mr-1">•</span> {note}
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-[#8D6E63] italic">
                                Added on {new Date(plan.memory.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Memory Modal */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div 
            className="bg-[#FFF5EE] rounded-xl border-4 border-[#FFDAB9] p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl animate-fade-in"
            onClick={(e: React.MouseEvent) => {
              // Cancel note editing when clicking elsewhere in the modal
              if (editingNoteIndex >= 0) {
                const target = e.target as HTMLElement;
                if (!target.closest('.note-editing-form')) {
                  setNewNote("");
                  setEditingNoteIndex(-1);
                }
              }
            }}
          >
            <h2 className="text-xl sm:text-2xl mb-4 text-[#FF6B6B] text-center">
              {selectedPlan?.memory ? 'Edit Your Memory 💝' : 'Create Your Memory 💝'}
            </h2>
            
            {/* Rating */}
            <div className="mb-4 bg-[#FFF1E6] p-3 rounded-lg">
              <label className="block mb-2 text-sm text-[#5D4037] font-semibold">How would you rate this experience?</label>
              <div className="flex justify-center space-x-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setMemoryRating(star)}
                    className={`text-2xl transition-all transform hover:scale-110 ${
                      star <= memoryRating ? "text-yellow-500" : "text-gray-300"
                    }`}
                  >
                    {star <= memoryRating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos */}
            <div className="mb-4 bg-[#FFF1E6] p-3 rounded-lg">
              <label className="block mb-2 text-sm text-[#5D4037] font-semibold">Add Photos</label>
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="pixel-button text-sm px-4 py-2 w-full sm:w-auto"
                  >
                    {isUploading 
                      ? `Uploading... ${uploadProgress}%` 
                      : isMobile 
                        ? "📸 Take Photo" 
                        : "📷 Choose Image"
                    }
                  </button>
                </div>
                
                {isUploading && (
                  <div className="w-full bg-[#FFF1E6] rounded-full h-4 mt-4">
                    <div 
                      className="bg-[#FF6B6B] h-4 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                
                {memoryPhotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                    {memoryPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Memory ${index + 1}`}
                          className="w-full h-16 sm:h-20 object-cover rounded-lg border-2 border-[#FFDAB9]"
                          onClick={() => openImageViewer(photo)}
                        />
                        <button 
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute top-1 right-1 bg-[#FFCCBC] text-[#BF360C] w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-4 bg-[#FFF1E6] p-3 rounded-lg">
              <label className="block mb-2 text-sm text-[#5D4037] font-semibold">Add Notes</label>
              <div className="flex flex-col space-y-2">
                <div className="flex gap-2 note-editing-form">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={editingNoteIndex >= 0 ? "Edit your note..." : "Write a sweet note..."}
                    className={`pixel-input text-sm flex-1 ${editingNoteIndex >= 0 ? 'editing-note' : ''}`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddNote();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    className={`pixel-button text-xs px-3 ${editingNoteIndex >= 0 ? 'update-button' : ''}`}
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
                      className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C] text-xs px-3"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                
                {memoryNotes.length > 0 && (
                  <div className="space-y-1 mt-2 bg-white bg-opacity-50 p-2 rounded-lg">
                    {memoryNotes.map((note, index) => (
                      <div key={index} className="flex justify-between items-center group note-item">
                        <p className="text-xs sm:text-sm text-[#5D4037] flex items-start">
                          <span className="text-[#FF6B6B] mr-1">•</span> {note}
                        </p>
                        <div className="edit-button-container flex">
                          <button 
                            onClick={() => handleEditNote(index)}
                            className="edit-button text-[#1B5E20] mr-2"
                            title="Edit note"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleRemoveNote(index)}
                            className="edit-button text-[#BF360C]"
                            title="Remove note"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {memoryNotes.length === 0 && (
                  <div className="empty-notes">
                    Add notes to remember special moments...
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowMemoryModal(false);
                  setMemoryPhotos([]);
                  setMemoryRating(5);
                  setMemoryNotes([]);
                  setNewNote("");
                  setNewPhotoUrl("");
                  setSelectedPlan(null);
                  setEditingNoteIndex(-1);
                }}
                className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C] text-sm px-4 py-2 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMemory}
                className="pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20] text-sm px-4 py-2 w-full sm:w-auto"
              >
                Save Memory 💝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-size Image Viewer Modal */}
      {imageViewerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={closeImageViewer}
        >
          <div 
            className="relative max-w-4xl w-full max-h-[90vh] animate-fade-in"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button
              onClick={closeImageViewer}
              className="absolute top-2 right-2 bg-[#FFF5EE] text-[#5D4037] w-10 h-10 rounded-full flex items-center justify-center z-10 border-2 border-[#FFDAB9]"
            >
              ✕
            </button>
            <img
              src={currentImage}
              alt="Memory preview"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}