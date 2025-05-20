import { FormEvent, useState, useRef, ChangeEvent, useEffect, SetStateAction } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu"; // Replace with your cloud name
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads"; // Replace with your upload preset
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Cloudinary upload utilities
const uploadToCloudinary = async (
  dataUrl: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (dataUrl.startsWith('http')) return dataUrl; // Already a URL

  const arr = dataUrl.split(',');
  if (arr.length < 2) throw new Error('Invalid data URL');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (parseError) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
      }
    };
    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };
    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
    xhr.send(formData);
  });
};

const uploadMultiple = async (
  images: string[], 
  onProgressUpdate: (photoIndex: number, progressOfCurrentPhoto: number, overallProgress: number, uploadedUrl?: string) => void
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  const totalPhotosToUpload = images.filter(img => !img.startsWith('http')).length;
  let uploadedCount = images.filter(img => img.startsWith('http')).length;


  for (let i = 0; i < images.length; i++) {
    if (images[i].startsWith('http')) { 
      uploadedUrls.push(images[i]);
      // Consider already uploaded as 100% for this specific image's progress contribution
      const overallProgress = Math.round(((uploadedCount + i - images.filter(img => img.startsWith('http')).length) * 100 + 100) / (totalPhotosToUpload * 100)) * 100;
      onProgressUpdate(i, 100, Math.min(100, overallProgress) , images[i]);
      continue;
    }
    try {
      // The index for progress should be based on photos actually being uploaded
      const currentUploadablePhotoIndex = i - images.filter(img => img.startsWith('http') && images.indexOf(img) < i).length;

      const url = await uploadToCloudinary(images[i], (progressOfCurrentPhoto) => {
        // Calculate overall progress based on photos that need uploading
        const baseProgress = uploadedCount * 100;
        const currentBatchProgress = currentUploadablePhotoIndex * 100 + progressOfCurrentPhoto;
        const totalPossibleProgress = totalPhotosToUpload * 100;
        const overallProgress = totalPossibleProgress > 0 ? Math.round(((baseProgress + currentBatchProgress) / ( (images.filter(img => img.startsWith('http')).length + totalPhotosToUpload) *100)) * 100 * totalPhotosToUpload ) : 100;

        onProgressUpdate(currentUploadablePhotoIndex, progressOfCurrentPhoto, Math.min(100, overallProgress) );
      });
      uploadedUrls.push(url);
      // Final update for this photo
      const finalOverallProgress = Math.round(((uploadedCount + currentUploadablePhotoIndex + 1) / totalPhotosToUpload) * 100);
      onProgressUpdate(currentUploadablePhotoIndex, 100, Math.min(100, finalOverallProgress), url);

    } catch (error) {
      console.error(`Failed to upload image ${i + 1}:`, error);
    }
  }
  return uploadedUrls;
};


interface Milestone {
  _id: Id<"milestones">;
  title: string;
  date: string;
  description?: string;
  category: string;
  photos: string[];
  icon: string;
}

// Type for the form data state (for both add and edit)
interface MilestoneFormData {
  title: string;
  date: string;
  description: string;
  category: string;
  icon: string;
}

export default function MilestonesSection() {
  const milestones = useQuery(api.milestones.list) || [];
  const addMilestoneMutation = useMutation(api.milestones.add);
  const updateMilestoneMutation = useMutation(api.milestones.update);
  const removeMilestoneMutation = useMutation(api.milestones.remove);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  
  const initialFormData: MilestoneFormData = {
    title: "", date: "", description: "", category: "special-moment", icon: "✨"
  };

  const [newMilestoneData, setNewMilestoneData] = useState<MilestoneFormData>(initialFormData);
  const [newMilestoneLocalPhotos, setNewMilestoneLocalPhotos] = useState<string[]>([]);

  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editForm, setEditForm] = useState<MilestoneFormData>(initialFormData);
  const [editMilestoneLocalPhotos, setEditMilestoneLocalPhotos] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [currentPhotoUploadProgress, setCurrentPhotoUploadProgress] = useState(0);
  const [overallUploadProgress, setOverallUploadProgress] = useState(0);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState(0);

  const [imageViewer, setImageViewer] = useState<{ open: boolean, photos: string[], currentIndex: number }>({ open: false, photos: [], currentIndex: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'timeline' | 'album'>("timeline");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showConfirmDelete, setShowConfirmDelete] = useState<Milestone | null>(null);

  const categoryStyles: Record<string, { emoji: string, colorClass: string, borderColor: string }> = {
    "first-date": { emoji: "💑", colorClass: "category-bg-first-date", borderColor: "border-first-date" },
    "anniversary": { emoji: "💝", colorClass: "category-bg-anniversary", borderColor: "border-anniversary" },
    "special-moment": { emoji: "✨", colorClass: "category-bg-special", borderColor: "border-special" },
    "trip": { emoji: "✈️", colorClass: "category-bg-trip", borderColor: "border-trip" },
    "celebration": { emoji: "🎉", colorClass: "category-bg-celebration", borderColor: "border-celebration" }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredAndSortedMilestones = [...milestones]
    .filter(m => filter === "all" || m.category === filter)
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const resetFormStates = () => {
    setNewMilestoneData(initialFormData);
    setNewMilestoneLocalPhotos([]);
    setEditForm(initialFormData);
    setEditMilestoneLocalPhotos([]);
    setEditingMilestone(null);
    setShowAddEditModal(false);
    setIsUploading(false);
    setOverallUploadProgress(0);
    setCurrentPhotoUploadProgress(0);
    setUploadingPhotoIndex(0);
  };

  const handleProgressUpdate = (photoIndex: number, progressOfCurrent: number, overall: number) => {
    setUploadingPhotoIndex(photoIndex);
    setCurrentPhotoUploadProgress(progressOfCurrent);
    setOverallUploadProgress(overall);
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setOverallUploadProgress(0); // Reset for new submission

    if (editingMilestone) { 
      if (!editForm.title.trim() || !editForm.date) {
        alert("Every memory chapter needs a title and date!"); setIsUploading(false); return;
      }
      const existingPhotoUrls = editMilestoneLocalPhotos.filter(p => p.startsWith('http'));
      const newPhotoDataUrls = editMilestoneLocalPhotos.filter(p => !p.startsWith('http'));
      
      try {
        const newlyUploadedUrls = newPhotoDataUrls.length > 0 
          ? await uploadMultiple(newPhotoDataUrls, handleProgressUpdate)
          : [];

        await updateMilestoneMutation({
          id: editingMilestone._id,
          title: editForm.title,
          date: editForm.date,
          description: editForm.description || undefined,
          category: editForm.category,
          photos: [...existingPhotoUrls, ...newlyUploadedUrls],
          icon: categoryStyles[editForm.category]?.emoji || "✨"
        });
        resetFormStates();
      } catch (error) { console.error("Update story page error:", error); alert("Oops! Couldn't rewrite this memory chapter."); }
      
    } else { 
      if (!newMilestoneData.title.trim() || !newMilestoneData.date) {
        alert("Title and date are must-haves for our storybook!"); setIsUploading(false); return;
      }
      try {
        const uploadedPhotoUrls = newMilestoneLocalPhotos.length > 0 
          ? await uploadMultiple(newMilestoneLocalPhotos, handleProgressUpdate)
          : [];
        
        await addMilestoneMutation({
          ...newMilestoneData,
          photos: uploadedPhotoUrls,
          icon: categoryStyles[newMilestoneData.category]?.emoji || "✨"
        });
        resetFormStates();
      } catch (error) { console.error("Add story page error:", error); alert("Oops! Couldn't write this new memory chapter."); }
    }
    setIsUploading(false);
  };
  
  const handleOpenAddModal = () => {
    resetFormStates(); 
    setEditingMilestone(null); 
    setShowAddEditModal(true);
  };

  const handleStartEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setEditForm({ 
      title: milestone.title,
      date: milestone.date,
      description: milestone.description || "",
      category: milestone.category,
      icon: milestone.icon,
    });
    setEditMilestoneLocalPhotos([...milestone.photos]); 
    setShowAddEditModal(true);
  };

  const handleDeleteMilestone = async () => {
    if (!showConfirmDelete) return;
    try {
      await removeMilestoneMutation({ id: showConfirmDelete._id });
    } catch (error) { console.error("Delete error:", error); alert("This memory is too precious to erase!");
    } finally { setShowConfirmDelete(null); }
  };

  const handleFileChangeInternal = async (e: ChangeEvent<HTMLInputElement>, isEditContext: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentLocalPhotos = isEditContext ? editMilestoneLocalPhotos : newMilestoneLocalPhotos;
    const localPhotoSetter = isEditContext ? setEditMilestoneLocalPhotos : setNewMilestoneLocalPhotos;

    const dataUrlPromises = Array.from(files).map(file => {
        if (file.size > 5 * 1024 * 1024) { 
            alert(`${file.name} is too big! Max 5MB, please.`); return null; 
        }
        return readFileAsDataURL(file);
    }).filter(p => p !== null) as Promise<string>[];
    
    try {
        const dataUrls = await Promise.all(dataUrlPromises);
        localPhotoSetter(prev => [...prev, ...dataUrls]); // Use functional update
    } catch (error) { alert("Error reading some files. Please try again.");}

    if (e.target) e.target.value = ""; 
  };

  const readFileAsDataURL = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleRemoveLocalPhoto = (index: number, isEditContext: boolean) => {
    const localPhotoSetter = isEditContext ? setEditMilestoneLocalPhotos : setNewMilestoneLocalPhotos;
    localPhotoSetter(prev => prev.filter((_, i) => i !== index));
  };

  const openPhotoViewer = (photos: string[], startIndex: number) => {
    setImageViewer({ open: true, photos, currentIndex: startIndex });
    document.body.classList.add('overflow-hidden-cute');
  };
  const closePhotoViewer = () => {
    setImageViewer({ open: false, photos: [], currentIndex: 0 });
    document.body.classList.remove('overflow-hidden-cute');
  };
  const navigatePhotoViewer = (direction: 'next' | 'prev') => {
    setImageViewer(prev => {
      let newIndex = prev.currentIndex + (direction === 'next' ? 1 : -1);
      if (newIndex < 0) newIndex = prev.photos.length - 1;
      if (newIndex >= prev.photos.length) newIndex = 0;
      return { ...prev, currentIndex: newIndex };
    });
  };

  // Props for MilestoneFormFields
  interface MilestoneFormFieldsProps {
    data: MilestoneFormData;
    onDataChange: (updater: (prevData: MilestoneFormData) => MilestoneFormData) => void;
    localPhotos: string[];
    onLocalPhotosChange: React.Dispatch<React.SetStateAction<string[]>>;
    onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
    inputRef: React.RefObject<HTMLInputElement | null >;
    isCurrentlyUploading: boolean;
    currentUploadingIndex: number;
    currentPhotoUploadProg: number;
    overallPhotoUploadProg: number;
  }
  
  // Reusable form fields component
  const MilestoneFormFields: React.FC<MilestoneFormFieldsProps> = ({
    data, 
    onDataChange, 
    localPhotos, 
    onLocalPhotosChange,
    onFileSelect,
    inputRef,
    isCurrentlyUploading,
    currentUploadingIndex, // Renamed from uploadingPhotoIndex to avoid conflict
    currentPhotoUploadProg,
    overallPhotoUploadProg
  }) => (
    <>
      <input type="text" placeholder="Title of Our Memory ✨" value={data.title} 
             onChange={e => onDataChange((d: MilestoneFormData) => ({ ...d, title: e.target.value }))} 
             className="milestone-input-cute" required />
      <input type="date" value={data.date} 
             onChange={e => onDataChange((d: MilestoneFormData) => ({ ...d, date: e.target.value }))} 
             className="milestone-input-cute" required />
      <select 
        value={data.category} 
        onChange={e => onDataChange((d: MilestoneFormData) => ({ ...d, category: e.target.value, icon: categoryStyles[e.target.value]?.emoji || "✨" }))} 
        className="milestone-input-cute"
      >
        {Object.entries(categoryStyles).map(([key, { emoji }]) => (
          <option key={key} value={key}>{emoji} {key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
        ))}
      </select>
      <textarea placeholder="What made this moment special? 💕" value={data.description} 
                onChange={e => onDataChange((d: MilestoneFormData) => ({ ...d, description: e.target.value }))} 
                className="milestone-textarea-cute" />
      
      <div className="milestone-photo-upload-cute">
        <label>Memory Snapshots 📸:</label>
        <input type="file" multiple accept="image/*" onChange={onFileSelect} ref={inputRef} className="milestone-file-input-cute" />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={isCurrentlyUploading} className="milestone-button-cute add-photo">
          {isCurrentlyUploading 
            ? `Uploading ${currentUploadingIndex + 1}/${localPhotos.filter(p => !p.startsWith('http')).length || localPhotos.length} (${currentPhotoUploadProg}%)` 
            : "Add Photos"}
        </button>
        {isCurrentlyUploading && overallPhotoUploadProg > 0 && (
            <div className="milestone-overall-progress-cute">
                <div style={{width: `${overallPhotoUploadProg}%`}}></div>
            </div>
        )}
      </div>

      {localPhotos.length > 0 && (
        <div className="milestone-photo-previews-cute">
          {localPhotos.map((photoSrc, index) => (
            <div key={photoSrc + index} className="milestone-photo-preview-item-cute">
              <img src={photoSrc} alt={`preview ${index + 1}`} onClick={() => openPhotoViewer(localPhotos, index)} />
              <button 
                type="button" 
                onClick={() => onLocalPhotosChange(prev => prev.filter((_, i) => i !== index))} 
                className="milestone-remove-photo-btn-cute"
              >X</button>
            </div>
          ))}
        </div>
      )}
    </>
  );


  return (
    <div className="milestones-section-storybook">
      <header className="storybook-header-cute">
        <h1>Our Storybook of Memories 📖💖</h1>
        <div className="storybook-controls-cute">
          <button onClick={handleOpenAddModal} className="storybook-button-cute add-chapter">
            Pen New Memory 🖋️
          </button>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="storybook-select-cute">
            <option value="all">All Chapters</option>
            {Object.entries(categoryStyles).map(([key, { emoji }]) => ( <option key={key} value={key}>{emoji} {key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option> ))}
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value as "newest" | "oldest")} className="storybook-select-cute">
            <option value="newest">Newest First ⏳</option>
            <option value="oldest">Oldest First 📜</option>
          </select>
           <button onClick={() => setViewMode(v => v === 'timeline' ? 'album' : 'timeline')} className="storybook-button-cute view-toggle">
            {viewMode === 'timeline' ? 'View Album 🖼️' : 'View Memory Path 🗺️'}
          </button>
        </div>
      </header>

      {showAddEditModal && (
        <div className="storybook-modal-overlay-cute" onClick={resetFormStates}>
          <form 
            className="storybook-page-form-cute" 
            onSubmit={handleSubmitForm}
            onClick={e => e.stopPropagation()}
          >
            <h2>{editingMilestone ? "Edit This Chapter ✏️" : "A New Chapter Begins... ✨"}</h2>
            <MilestoneFormFields
                data={editingMilestone ? editForm : newMilestoneData}
                onDataChange={editingMilestone ? setEditForm : setNewMilestoneData}
                localPhotos={editingMilestone ? editMilestoneLocalPhotos : newMilestoneLocalPhotos}
                onLocalPhotosChange={editingMilestone ? setEditMilestoneLocalPhotos : setNewMilestoneLocalPhotos}
                onFileSelect={(e) => handleFileChangeInternal(e, !!editingMilestone)}
                inputRef={editingMilestone ? editFileInputRef : fileInputRef}
                isCurrentlyUploading={isUploading}
                currentUploadingIndex={uploadingPhotoIndex}
                currentPhotoUploadProg={currentPhotoUploadProgress}
                overallPhotoUploadProg={overallUploadProgress}
            />
            <div className="storybook-form-actions-cute">
              <button type="button" onClick={resetFormStates} className="storybook-button-cute cancel">Close Book</button>
              <button type="submit" disabled={isUploading} className="storybook-button-cute save">
                {isUploading ? `Saving...(${overallUploadProgress}%)` : (editingMilestone ? "Update Story" : "Add to Storybook")}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {filteredAndSortedMilestones.length === 0 && !showAddEditModal && (
         <div className="storybook-empty-state-cute">
            <span>📚</span>
            <p>Our storybook is waiting for its first magical memory!</p>
        </div>
      )}

      {viewMode === 'timeline' ? (
        <div className={`memory-path-cute ${isMobile ? 'mobile' : ''}`}>
          {filteredAndSortedMilestones.map((milestone, index) => {
            const style = categoryStyles[milestone.category] || categoryStyles['special-moment'];
            return (
              <div 
                key={milestone._id} 
                className={`memory-orb-cute ${style.borderColor} ${isMobile && index % 2 !== 0 ? 'right' : ''}`}
                style={{ "--animation-order": index } as React.CSSProperties} 
              >
                <div className={`orb-content-cute ${style.colorClass}`} onClick={() => handleStartEdit(milestone)}>
                  <span className="orb-icon-cute">{milestone.icon}</span>
                  <h3 className="orb-title-cute">{milestone.title}</h3>
                  <p className="orb-date-cute">{new Date(milestone.date + 'T00:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'})}</p>
                  {milestone.photos.length > 0 && 
                    <div className="orb-photo-preview-container-cute">
                        <img src={milestone.photos[0]} alt="preview" className="orb-photo-preview-cute" />
                    </div>
                  }
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(milestone);}} className="orb-delete-btn-cute">🗑️</button>
              </div>
            );
          })}
        </div>
      ) : ( 
        <div className="memory-album-grid-cute">
          {filteredAndSortedMilestones.map(milestone => {
            const style = categoryStyles[milestone.category] || categoryStyles['special-moment'];
            return (
              <div key={milestone._id} className={`album-photo-frame-cute ${style.borderColor}`} onClick={() => handleStartEdit(milestone)}>
                {milestone.photos.length > 0 ? (
                  <img src={milestone.photos[0]} alt={milestone.title} className="album-photo-cute" />
                ) : (
                  <div className={`album-placeholder-cute ${style.colorClass}`}><span>{milestone.icon}</span></div>
                )}
                <div className="album-photo-caption-cute">
                  <h4>{milestone.title}</h4>
                  <p>{new Date(milestone.date + 'T00:00:00').toLocaleDateString()}</p>
                </div>
                 <button onClick={(e) => {e.stopPropagation(); setShowConfirmDelete(milestone)}} className="album-delete-btn-cute">🗑️</button>
              </div>
            );
          })}
        </div>
      )}

      {showConfirmDelete && (
        <div className="storybook-modal-overlay-cute" onClick={() => setShowConfirmDelete(null)}>
          <div className="storybook-page-form-cute confirm-delete" onClick={e => e.stopPropagation()}>
            <h2>Erase This Page? 📜💨</h2>
            <p>Are you sure you want to remove the memory: "{showConfirmDelete.title}"?</p>
            <div className="storybook-form-actions-cute">
              <button onClick={() => setShowConfirmDelete(null)} className="storybook-button-cute cancel">No, Keep It!</button>
              <button onClick={handleDeleteMilestone} className="storybook-button-cute delete">Yes, Erase.</button>
            </div>
          </div>
        </div>
      )}

      {imageViewer.open && (
        <div className="image-viewer-overlay-cute" onClick={closePhotoViewer}>
          <button className="viewer-nav-button-cute prev" onClick={(e) => {e.stopPropagation(); navigatePhotoViewer('prev');}}>‹</button>
          <img 
            src={imageViewer.photos[imageViewer.currentIndex]} 
            alt="Full Memory" 
            className="image-viewer-full-photo-cute" 
            onClick={e => e.stopPropagation()}
          />
          <button className="viewer-nav-button-cute next" onClick={(e) => {e.stopPropagation(); navigatePhotoViewer('next');}}>›</button>
          <button className="image-viewer-close-button-cute" onClick={closePhotoViewer}>X</button>
        </div>
      )}
    </div>
  );
}