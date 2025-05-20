import { FormEvent, useState, useRef, ChangeEvent, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Constants for Cloudinary
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Cloudinary upload utilities
const uploadToCloudinary = async (
  dataUrl: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // If it's already a URL (from Cloudinary or elsewhere), don't re-upload
  if (dataUrl.startsWith('http')) {
    return dataUrl;
  }
  
  // Convert data URL to blob
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  const blob = new Blob([u8arr], { type: mime });
  
  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    const xhr = new XMLHttpRequest();
    
    // Setup progress monitoring
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded / e.total) * 100);
        onProgress(progress);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.secure_url);
      } else {
        reject(new Error('Upload failed'));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error'));
    };
    
    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
    xhr.send(formData);
  });
};

// Upload multiple images sequentially
const uploadMultiple = async (
  images: string[],
  onProgressUpdate: (index: number, progress: number, url: string) => void
): Promise<string[]> => {
  const urls: string[] = [];
  
  // Process images sequentially to avoid overwhelming the network
  for (let i = 0; i < images.length; i++) {
    try {
      // Skip upload if it's already a URL
      if (images[i].startsWith('http')) {
        urls.push(images[i]);
        if (onProgressUpdate) {
          onProgressUpdate(i, 100, images[i]);
        }
        continue;
      }
      
      // Upload to Cloudinary
      const url = await uploadToCloudinary(
        images[i],
        (progress) => {
          if (onProgressUpdate) {
            onProgressUpdate(i, progress, '');
          }
        }
      );
      
      urls.push(url);
      
      if (onProgressUpdate) {
        onProgressUpdate(i, 100, url);
      }
    } catch (error) {
      console.error(`Failed to upload image ${i + 1}:`, error);
      // Continue with other images even if one fails
    }
  }
  
  return urls;
};

// Define Milestone interface for type safety
interface Milestone {
  _id: Id<"milestones">;
  title: string;
  date: string;
  description?: string;
  category: string;
  photos: string[];
  icon: string;
}

export default function MilestonesSection() {
  const milestones = useQuery(api.milestones.list) || [];
  const addMilestone = useMutation(api.milestones.add);
  const updateMilestone = useMutation(api.milestones.update);
  const removeMilestone = useMutation(api.milestones.remove);
  
  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // State for new milestone
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    date: "",
    description: "",
    category: "first-date",
    photos: [] as string[],
    icon: "💑"
  });
  
  // State for temporary image storage before upload
  const [localPhotos, setLocalPhotos] = useState<string[]>([]);
  const [editLocalPhotos, setEditLocalPhotos] = useState<string[]>([]);
  
  // State for file uploads
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [editIsUploading, setEditIsUploading] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [editCurrentUploadIndex, setEditCurrentUploadIndex] = useState(0);

  // State for image viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [imageIndex, setImageIndex] = useState(0);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [zoomedImage, setZoomedImage] = useState(false);
  
  // New state for image viewer touch controls
  const [touchState, setTouchState] = useState({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    zoomed: false
  });

  // UI states
  const [isMobile, setIsMobile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "timeline">("list");
  const [groupedMilestones, setGroupedMilestones] = useState<Record<string, Milestone[]>>({});
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [showConfirmDelete, setShowConfirmDelete] = useState<Id<"milestones"> | null>(null);
  const [activeSheet, setActiveSheet] = useState<"none" | "add" | "edit" | "filter" | "view">("none");
  const [touchStartY, setTouchStartY] = useState(0);
  const [sheetPosition, setSheetPosition] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  // State for editing
  const [editingMilestone, setEditingMilestone] = useState<Id<"milestones"> | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    description: "",
    category: "",
    photos: [] as string[],
    icon: ""
  });

  const categoryIcons: Record<string, string> = {
    "first-date": "💑",
    "anniversary": "💝",
    "special-moment": "✨",
    "trip": "✈️",
    "celebration": "🎉"
  };

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Group milestones by year and month
  useEffect(() => {
    if (!milestones.length) return;
    
    // Filter milestones if filter is active
    let filteredMilestones = [...milestones];
    
    if (filter !== "all") {
      filteredMilestones = milestones.filter(m => m.category === filter);
    }
    
    // Sort milestones
    filteredMilestones.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });
    
    // Group by year and month
    const grouped: Record<string, Milestone[]> = {};
    
    filteredMilestones.forEach(milestone => {
      const date = new Date(milestone.date);
      const yearMonth = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!grouped[yearMonth]) {
        grouped[yearMonth] = [];
      }
      
      grouped[yearMonth].push(milestone);
    });
    
    setGroupedMilestones(grouped);
  }, [milestones, filter, sortOrder]);

  // Keyboard handler for image viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewerOpen) return;
      
      if (e.key === 'Escape') {
        closeImageViewer();
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      } else if (e.key === ' ' || e.key === 'Enter') {
        setZoomedImage(!zoomedImage);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewerOpen, zoomedImage, currentPhotos, imageIndex]);

  // Simulated pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY > 0) {
      const distance = e.touches[0].clientY - pullStartY;
      if (distance > 0 && distance < 100) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 40) {
      // Trigger refresh
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        setPullStartY(0);
      }, 1000);
    } else {
      setPullDistance(0);
      setPullStartY(0);
    }
  };

  // Bottom sheet touch handlers
  const handleSheetTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    
    if (diff > 0) { // Only allow dragging down
      setSheetPosition(diff);
    }
  };

  const handleSheetTouchEnd = () => {
    if (sheetPosition > 100) { // Threshold to close the sheet
      closeBottomSheet();
    } else {
      setSheetPosition(0); // Reset position
    }
  };

  const openBottomSheet = (type: "add" | "edit" | "filter" | "view") => {
    setActiveSheet(type);
    document.body.classList.add("body-no-scroll");
    
    if (type === "add") {
      setShowAddForm(true);
    } else if (type === "filter") {
      // No additional action needed
    } else if (type === "view") {
      // No additional action needed
    }
  };

  const closeBottomSheet = () => {
    setActiveSheet("none");
    setSheetPosition(0);
    document.body.classList.remove("body-no-scroll");
    
    if (activeSheet === "add") {
      setShowAddForm(false);
    } else if (activeSheet === "edit") {
      setEditingMilestone(null);
    } else if (activeSheet === "view") {
      closeImageViewer();
    }
  };

  // Handle form submission for new milestone
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isUploading) {
      alert("Please wait for images to finish uploading.");
      return;
    }
    
    try {
      // Validation
      if (!newMilestone.title.trim() || !newMilestone.date) {
        alert("Title and date are required!");
        return;
      }
      
      setIsUploading(true);
      
      // Upload all images to Cloudinary first
      let cloudinaryUrls: string[] = [];
      
      if (localPhotos.length > 0) {
        cloudinaryUrls = await uploadMultiple(
          localPhotos,
          (index, progress, url) => {
            setCurrentUploadIndex(index);
            setUploadProgress(progress);
          }
        );
        
        // Verify we have URLs for all images
        if (cloudinaryUrls.length !== localPhotos.length) {
          throw new Error("Some images failed to upload");
        }
      }
      
      // Now add to database with Cloudinary URLs
      await addMilestone({
        title: newMilestone.title,
        date: newMilestone.date,
        description: newMilestone.description || undefined,
        category: newMilestone.category,
        photos: cloudinaryUrls, // Only URLs go to the database
        icon: categoryIcons[newMilestone.category] || "💫"
      });
      
      // Reset form after successful submission
      setNewMilestone({
        title: "",
        date: "",
        description: "",
        category: "first-date",
        photos: [],
        icon: "💑"
      });
      
      setLocalPhotos([]);
      
      // Close form after submission on mobile
      if (isMobile) {
        closeBottomSheet();
      }
      
      // Show success animation
      playSuccessAnimation();
    } catch (error) {
      console.error("Failed to add milestone:", error);
      alert("Failed to add milestone: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
    }
  };

  // Handle starting edit mode
  const startEditing = (milestone: Milestone) => {
    setEditingMilestone(milestone._id);
    setEditForm({
      title: milestone.title,
      date: milestone.date,
      description: milestone.description || "",
      category: milestone.category,
      photos: [],  // We'll keep the original photos separate
      icon: milestone.icon
    });
    
    // Use the existing Cloudinary URLs as our local photos
    setEditLocalPhotos([...milestone.photos]);
    
    if (isMobile) {
      openBottomSheet("edit");
    }
  };

  // Handle saving edits
  const handleSaveEdit = async () => {
    if (!editingMilestone) return;
    
    if (editIsUploading) {
      alert("Please wait for images to finish uploading.");
      return;
    }
    
    try {
      // Validation
      if (!editForm.title.trim() || !editForm.date) {
        alert("Title and date are required!");
        return;
      }
      
      setEditIsUploading(true);
      
      // Upload all images to Cloudinary first
      let cloudinaryUrls: string[] = [];
      
      if (editLocalPhotos.length > 0) {
        cloudinaryUrls = await uploadMultiple(
          editLocalPhotos,
          (index, progress, url) => {
            setEditCurrentUploadIndex(index);
            setEditUploadProgress(progress);
          }
        );
        
        // Verify we have URLs for all images
        if (cloudinaryUrls.length !== editLocalPhotos.length) {
          throw new Error("Some images failed to upload");
        }
      }
      
      // Update milestone with Cloudinary URLs
      await updateMilestone({
        id: editingMilestone,
        title: editForm.title,
        date: editForm.date,
        description: editForm.description || undefined,
        category: editForm.category,
        icon: editForm.icon,
        photos: cloudinaryUrls // Only URLs go to the database
      });
      
      // Success - close editing mode
      if (isMobile) {
        closeBottomSheet();
      } else {
        setEditingMilestone(null);
      }
      
      setEditLocalPhotos([]);
      
      playSuccessAnimation();
    } catch (error) {
      console.error("Failed to update milestone:", error);
      
      // Show helpful error message
      alert("Failed to update milestone: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setEditIsUploading(false);
      setEditUploadProgress(0);
      setEditCurrentUploadIndex(0);
    }
  };

  // Handle canceling edits
  const cancelEditing = () => {
    if (isMobile) {
      closeBottomSheet();
    } else {
      setEditingMilestone(null);
    }
    
    setEditUploadProgress(0);
    setEditIsUploading(false);
    setEditLocalPhotos([]);
  };

  // Handle milestone deletion
  const handleDeleteMilestone = async (id: Id<"milestones">) => {
    try {
      await removeMilestone({ id });
      setShowConfirmDelete(null);
      
      // Show success animation
      playSuccessAnimation("delete");
    } catch (error) {
      console.error("Failed to delete milestone:", error);
      alert("Failed to delete milestone. Please try again.");
    }
  };

  // Handle removing a photo from new milestone
  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = [...localPhotos];
    updatedPhotos.splice(index, 1);
    setLocalPhotos(updatedPhotos);
  };

  // Handle removing a photo from edited milestone
  const handleRemoveEditPhoto = (index: number) => {
    if (!editingMilestone) return;
    
    // Update local state
    const updatedPhotos = [...editLocalPhotos];
    updatedPhotos.splice(index, 1);
    setEditLocalPhotos(updatedPhotos);
  };
  
  // Handle image touch start for viewer
  const handleImageTouchStart = (e: React.TouchEvent) => {
    // Record starting position and time for swipe detection
    setTouchState({
      ...touchState,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startTime: Date.now()
    });
  };

  // Handle image touch end for viewer
  const handleImageTouchEnd = (e: React.TouchEvent) => {
    // Get end position and calculate the time and distance of the touch
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchDuration = Date.now() - touchState.startTime;
    const diffX = touchEndX - touchState.startX;
    const diffY = touchEndY - touchState.startY;
    
    // Check for double tap (for zooming)
    const currentTime = Date.now();
    const tapTimeDiff = currentTime - touchState.lastTapTime;
    
    if (tapTimeDiff < 300) {
      // Double-tap detected - toggle zoom
      setZoomedImage(!zoomedImage);
      setTouchState({
        ...touchState,
        zoomed: !touchState.zoomed,
        lastTapTime: 0 // Reset tap timer
      });
      return;
    }
    
    // Update last tap time for double-tap detection
    setTouchState({
      ...touchState,
      lastTapTime: currentTime
    });
    
    // Handle horizontal swipe for navigation (if swipe is mostly horizontal)
    if (Math.abs(diffX) > Math.abs(diffY) * 2 && Math.abs(diffX) > 50 && touchDuration < 300) {
      if (diffX > 0) {
        // Swipe right -> previous image
        navigateImage('prev');
      } else {
        // Swipe left -> next image
        navigateImage('next');
      }
    }
    
    // Handle vertical swipe to close (if swipe is mostly vertical and downward)
    if (diffY > 100 && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
      closeImageViewer();
    }
  };
  
  // Open image viewer
  const openImageViewer = (imageSrc: string, photos: string[], index: number) => {
    setCurrentImage(imageSrc);
    setCurrentPhotos(photos);
    setImageIndex(index);
    setViewerOpen(true);
    setZoomedImage(false);
    
    // Reset zoom state when opening viewer
    setTouchState({
      ...touchState,
      zoomed: false,
      lastTapTime: 0
    });
    
    // Prevent body scrolling when modal is open
    document.body.classList.add("body-no-scroll");
    
    // For mobile, open in bottom sheet view mode
    if (isMobile) {
      openBottomSheet("view");
    }
  };
  
  // Close image viewer
  const closeImageViewer = () => {
    setViewerOpen(false);
    setCurrentImage("");
    setCurrentPhotos([]);
    setZoomedImage(false);
    
    // Re-enable body scrolling
    document.body.classList.remove("body-no-scroll");
  };

  // Navigate between images in viewer
  const navigateImage = (direction: 'prev' | 'next') => {
    if (currentPhotos.length <= 1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = (imageIndex - 1 + currentPhotos.length) % currentPhotos.length;
    } else {
      newIndex = (imageIndex + 1) % currentPhotos.length;
    }
    
    setImageIndex(newIndex);
    setCurrentImage(currentPhotos[newIndex]);
    
    // Reset zoom when changing images
    setZoomedImage(false);
    setTouchState({
      ...touchState,
      zoomed: false
    });
  };
  
  // Handle file input change for new milestone
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // Process only one file at a time to avoid memory issues
      const file = files[0];
      
      // Check file size
      if (file.size > 5000000) { // 5MB limit
        alert("Image is too large! Please select an image under 5MB.");
        return;
      }
      
      // Convert file to data URL for preview
      const dataUrl = await readFileAsDataURL(file);
      
      // Add to local photos for display
      setLocalPhotos([...localPhotos, dataUrl]);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to process file:", error);
      alert("Failed to process image. Please try again.");
    }
  };
  
  // Handle file input change for edit milestone
  const handleEditFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // Process only one file at a time to avoid memory issues
      const file = files[0];
      
      // Check file size
      if (file.size > 5000000) { // 5MB limit
        alert("Image is too large! Please select an image under 5MB.");
        return;
      }
      
      // Convert file to data URL for preview
      const dataUrl = await readFileAsDataURL(file);
      
      // Add to local photos for display
      setEditLocalPhotos([...editLocalPhotos, dataUrl]);
      
      // Reset the file input
      if (editFileInputRef.current) {
        editFileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to process file:", error);
      alert("Failed to process image. Please try again.");
    }
  };
  
  // Helper function to read a file as a data URL
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(event) {
        if (event.target && event.target.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      
      reader.onerror = function() {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsDataURL(file);
    });
  };

  // Play success animation
  const playSuccessAnimation = (type: "save" | "delete" = "save") => {
    const color = type === "save" ? "rgba(165, 214, 167, 0.9)" : "rgba(255, 171, 145, 0.9)";
    const icon = type === "save" ? "✓" : "🗑️";
    
    // Create and add animation element
    const element = document.createElement('div');
    element.className = 'pixel-success-animation';
    element.style.backgroundColor = color;
    element.textContent = icon;
    document.body.appendChild(element);
    
    setTimeout(() => {
      element.remove();
    }, 1500);
  };

  // Format date in a human-readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get formatted month name
  const getMonthName = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Get day of month
  const getDayOfMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate();
  };

  return (
    <div 
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator (mobile only) */}
      {isMobile && pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 w-full flex justify-center z-10 pointer-events-none"
          style={{ transform: `translateY(${pullDistance / 2}px)` }}
        >
          <div className="bg-[#FFE0B2] rounded-full p-2 shadow-md">
            <div className="animate-spin text-xl">🔄</div>
          </div>
        </div>
      )}
      
      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur">
          <div className="bg-[#FFF5EE] p-4 rounded-lg shadow-lg animate-pulse">
            <div className="text-2xl animate-spin mb-2">✨</div>
            <div className="text-[#5D4037]">Refreshing...</div>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-2xl text-[#FF6B6B] pixel-title-small">
          Our Milestones <span className="heart-icon">💫</span>
        </h2>
        
        <div className="flex flex-wrap gap-2">
          {/* View Mode Toggle - Desktop only */}
          {!isMobile && (
            <div className="view-toggle-container">
              <button
                onClick={() => setViewMode("list")}
                className={`view-toggle-button ${viewMode === "list" ? "view-toggle-button-active" : ""}`}
                aria-label="List view"
              >
                <span className="inline-flex items-center">📋 List</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`view-toggle-button ${viewMode === "grid" ? "view-toggle-button-active" : ""}`}
                aria-label="Grid view"
              >
                <span className="inline-flex items-center">🖼️ Grid</span>
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`view-toggle-button ${viewMode === "timeline" ? "view-toggle-button-active" : ""}`}
                aria-label="Timeline view"
              >
                <span className="inline-flex items-center">⏳ Timeline</span>
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="pixel-button text-xs px-3 py-1 flex items-center"
            aria-label={sortOrder === "newest" ? "Showing newest first. Tap to show oldest first." : "Showing oldest first. Tap to show newest first."}
          >
            {sortOrder === "newest" ? "↓ New" : "↑ Old"}
          </button>
          
          {!isMobile && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="pixel-button text-xs px-3 py-1"
            >
              {showAddForm ? "Hide" : "Add New"}
            </button>
          )}
          
          {isMobile && (
            <button 
              onClick={() => openBottomSheet("filter")}
              className="pixel-button text-xs px-3 py-1 relative"
              aria-label="Filter milestones"
            >
              <span>Filter</span>
              {filter !== "all" && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF6B6B] rounded-full filter-dot-active"></span>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Filter tabs for desktop */}
      {!isMobile && (
        <div className="overflow-x-auto pb-2 mobile-tab-filter scrollbar-hide mb-4">
          <div className="tab-filter inline-flex whitespace-nowrap">
            <button
              onClick={() => setFilter("all")}
              className={`tab-filter-button ${filter === "all" ? "tab-filter-button-active" : ""}`}
            >
              All Moments
            </button>
            <button
              onClick={() => setFilter("first-date")}
              className={`tab-filter-button ${filter === "first-date" ? "tab-filter-button-active" : ""}`}
            >
              First Dates 💑
            </button>
            <button
              onClick={() => setFilter("anniversary")}
              className={`tab-filter-button ${filter === "anniversary" ? "tab-filter-button-active" : ""}`}
            >
              Anniversaries 💝
            </button>
            <button
              onClick={() => setFilter("special-moment")}
              className={`tab-filter-button ${filter === "special-moment" ? "tab-filter-button-active" : ""}`}
            >
              Special ✨
            </button>
            <button
              onClick={() => setFilter("trip")}
              className={`tab-filter-button ${filter === "trip" ? "tab-filter-button-active" : ""}`}
            >
              Trips ✈️
            </button>
            <button
              onClick={() => setFilter("celebration")}
              className={`tab-filter-button ${filter === "celebration" ? "tab-filter-button-active" : ""}`}
            >
              Celebrations 🎉
            </button>
          </div>
        </div>
      )}

      {/* Form for adding new milestone - desktop version */}
      {(!isMobile && showAddForm) && (
        <form onSubmit={handleSubmit} className="pixel-card p-4 mb-4">
          <h3 className="text-xl text-[#FF6B6B] mb-4 flex items-center gap-2">
            <span className="animate-pulse">✨</span>
            Add New Milestone
            <span className="animate-pulse">✨</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#5D4037]">Title:</label>
              <input
                type="text"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="What's the special moment?"
                className="pixel-input w-full"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#5D4037]">Date:</label>
              <input
                type="date"
                value={newMilestone.date}
                onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                className="pixel-input w-full"
                required
              />
            </div>
            
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-[#5D4037]">Category:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(categoryIcons).map(([category, icon]) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setNewMilestone({ 
                      ...newMilestone, 
                      category: category,
                      icon: icon
                    })}
                    className={`pixel-button text-sm p-2 flex flex-col items-center justify-center ${
                      newMilestone.category === category 
                        ? "bg-[#FFB6B6] transform -translate-y-1 border-[#FF6B6B]" 
                        : "bg-[#FFE0B2]"
                    }`}
                  >
                    <span className="text-xl mb-1">{icon}</span>
                    <span>{category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-sm font-medium text-[#5D4037]">Description:</label>
              <textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Share the story behind this moment..."
                className="pixel-input w-full min-h-[80px]"
              />
            </div>
          </div>
          
          {/* Photo upload section */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center text-sm font-medium text-[#5D4037]">
              <span className="mr-2">Photos</span>
              {isUploading && (
                <span className="text-xs text-[#FF6B6B]">(Uploading...)</span>
              )}
            </label>
            
            <div className="flex gap-2">
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
                className="pixel-button text-sm px-3 py-2 flex items-center"
              >
                <span className="mr-2">📷</span>
                Add Photo
              </button>
              
              {localPhotos.length > 0 && (
                <div className="text-sm text-[#5D4037] flex items-center">
                  {localPhotos.length} {localPhotos.length === 1 ? 'photo' : 'photos'} added
                </div>
              )}
            </div>
            
            {/* Upload progress for adding */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#5D4037]">
                  <span>Uploading image {currentUploadIndex + 1} of {localPhotos.length}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#FFF1E6] rounded-full h-4">
                  <div 
                    className="bg-[#FF6B6B] h-4 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Preview of added photos */}
            {localPhotos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {localPhotos.map((photo, index) => (
                  <div key={index} className="relative group aspect-square">
                    <div 
                      className="w-full h-full overflow-hidden rounded-lg border-2 border-[#FFDAB9] cursor-pointer photo-hover"
                      onClick={() => openImageViewer(photo, localPhotos, index)}
                    >
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                      className="absolute top-1 right-1 bg-[#FF6B6B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <button 
              type="submit" 
              className="pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20] hover:bg-[#81C784]"
              disabled={isUploading}
            >
              ✅ Save Milestone
            </button>
            
            {(localPhotos.length > 0) && (
              <button 
                type="button"
                onClick={() => {
                  setNewMilestone({
                    title: "",
                    date: "",
                    description: "",
                    category: "first-date",
                    photos: [],
                    icon: "💑"
                  });
                  setLocalPhotos([]);
                }}
                className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C]"
              >
                Clear Form
              </button>
            )}
          </div>
        </form>
      )}

      {/* List of milestones - RENDER BASED ON VIEW MODE */}
      {viewMode === "list" && (
        <div className="space-y-6">
          {Object.keys(groupedMilestones).length > 0 ? (
            Object.entries(groupedMilestones).map(([yearMonth, milestones]) => (
              <div key={yearMonth} className="space-y-3">
                {/* Month heading */}
                <h3 className="month-heading">
                  {yearMonth}
                </h3>
                
                {/* Milestones in this month */}
                <div className="space-y-3">
                  {milestones.map((milestone: Milestone) => (
                    <div 
                      key={milestone._id} 
                      className="pixel-card p-4 plan-card-hover relative"
                    >
                      {!isMobile && editingMilestone === milestone._id ? (
                        // Edit mode for desktop
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-[#5D4037]">Title:</label>
                              <input
                                type="text"
                                value={editForm.title}
                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                className="pixel-input w-full"
                                required
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-[#5D4037]">Date:</label>
                              <input
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                className="pixel-input w-full"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-[#5D4037]">Category:</label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {Object.entries(categoryIcons).map(([category, icon]) => (
                                <button
                                  key={category}
                                  type="button"
                                  onClick={() => setEditForm({ 
                                    ...editForm, 
                                    category: category,
                                    icon: icon
                                  })}
                                  className={`pixel-button text-sm p-2 flex flex-col items-center justify-center ${
                                    editForm.category === category 
                                      ? "bg-[#FFB6B6] transform -translate-y-1 border-[#FF6B6B]" 
                                      : "bg-[#FFE0B2]"
                                  }`}
                                >
                                  <span className="text-xl mb-1">{icon}</span>
                                  <span>{category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-[#5D4037]">Description:</label>
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="pixel-input w-full min-h-[80px]"
                            />
                          </div>
                          
                          {/* Photo upload section for edit mode */}
                          <div className="space-y-2">
                            <label className="flex items-center text-sm font-medium text-[#5D4037]">
                              <span className="mr-2">Photos</span>
                              {editIsUploading && (
                                <span className="text-xs text-[#FF6B6B]">(Uploading...)</span>
                              )}
                            </label>
                            
                            <div className="flex gap-2">
                              <input
                                type="file"
                                ref={editFileInputRef}
                                onChange={handleEditFileChange}
                                accept="image/*"
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => editFileInputRef.current?.click()}
                                disabled={editIsUploading}
                                className="pixel-button text-sm px-3 py-2 flex items-center"
                              >
                                <span className="mr-2">📷</span>
                                Add Photo
                              </button>
                              
                              {editLocalPhotos.length > 0 && (
                                <div className="text-sm text-[#5D4037] flex items-center">
                                  {editLocalPhotos.length} {editLocalPhotos.length === 1 ? 'photo' : 'photos'} added
                                </div>
                              )}
                            </div>
                            
                            {/* Upload progress for editing */}
                            {editIsUploading && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs text-[#5D4037]">
                                  <span>Uploading image {editCurrentUploadIndex + 1} of {editLocalPhotos.length}</span>
                                  <span>{editUploadProgress}%</span>
                                </div>
                                <div className="w-full bg-[#FFF1E6] rounded-full h-4">
                                  <div 
                                    className="bg-[#FF6B6B] h-4 rounded-full transition-all duration-300"
                                    style={{ width: `${editUploadProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            
                            {/* Preview of edited photos */}
                            {editLocalPhotos.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                                {editLocalPhotos.map((photo, index) => (
                                  <div key={index} className="relative group aspect-square">
                                    <div 
                                      className="w-full h-full overflow-hidden rounded-lg border-2 border-[#FFDAB9] cursor-pointer photo-hover"
                                      onClick={() => openImageViewer(photo, editLocalPhotos, index)}
                                    >
                                      <img
                                        src={photo}
                                        alt={`Photo ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveEditPhoto(index);
                                      }}
                                      className="absolute top-1 right-1 bg-[#FF6B6B] text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={editIsUploading}
                              className="pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20] hover:bg-[#81C784]"
                            >
                              ✅ Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{milestone.icon}</span>
                              <h3 className="text-lg font-semibold text-[#5D4037]">{milestone.title}</h3>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditing(milestone)}
                                className="pixel-button text-xs sm:text-sm w-8 h-8 sm:w-9 sm:h-9 p-0 flex items-center justify-center"
                                aria-label="Edit milestone"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => setShowConfirmDelete(milestone._id)}
                                className="pixel-button bg-[#FFCCBC] hover:bg-[#FFAB91] text-xs sm:text-sm w-8 h-8 sm:w-9 sm:h-9 p-0 flex items-center justify-center"
                                aria-label="Delete milestone"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          {/* Date and category */}
                          <div className="flex items-center mt-2 text-sm text-[#8D6E63]">
                            <span className="mr-2">📅</span>
                            {formatDate(milestone.date)}
                            <span className="mx-2">•</span>
                            <span className="capitalize">{milestone.category.replace(/-/g, ' ')}</span>
                          </div>
                          
                          {/* Description */}
                          {milestone.description && (
                            <div className="mt-3 relative">
                              <div className="bg-[#FFF8F5] p-3 rounded-lg border-l-4 border-[#FFB6B6] italic text-[#5D4037] text-sm">
                                "{milestone.description}"
                              </div>
                            </div>
                          )}
                          
                          {/* Photos - IMPROVED LAYOUT */}
                          {milestone.photos && milestone.photos.length > 0 && (
                            <div className="mt-3">
                              {milestone.photos.length === 1 ? (
                                // Single photo - centered, max 50% width
                                <div className="flex justify-center my-3">
                                  <div 
                                    className="max-w-xs overflow-hidden rounded-lg border-2 border-[#FFDAB9] cursor-pointer photo-hover"
                                    onClick={() => openImageViewer(milestone.photos[0], milestone.photos, 0)}
                                  >
                                    <img
                                      src={milestone.photos[0]}
                                      alt={`Memory from ${milestone.title}`}
                                      className="w-full h-auto object-contain"
                                    />
                                  </div>
                                </div>
                              ) : (
                                // Multiple photos - grid layout
                                <div className={`grid ${milestone.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
                                  {milestone.photos.map((photo, index) => (
                                    <div 
                                      key={index} 
                                      className="aspect-square overflow-hidden rounded-lg border-2 border-[#FFDAB9] cursor-pointer photo-hover"
                                      onClick={() => openImageViewer(photo, milestone.photos, index)}
                                    >
                                      <img
                                        src={photo}
                                        alt={`Memory ${index + 1} from ${milestone.title}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
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
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">✨</div>
              <h3 className="empty-state-title">No Milestones Yet</h3>
              <p className="empty-state-desc">
                {filter === "all" 
                  ? "Start capturing your special moments!" 
                  : `No ${filter.replace(/-/g, ' ')} milestones found. Try another category or add a new one!`}
              </p>
              {!showAddForm && (
                <button 
                  className="pixel-button mt-4"
                  onClick={() => isMobile ? openBottomSheet("add") : setShowAddForm(true)}
                >
                  Add Your First Memory
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid view mode */}
      {viewMode === "grid" && (
        <div className="space-y-6">
          {Object.keys(groupedMilestones).length > 0 ? (
            Object.entries(groupedMilestones).map(([yearMonth, milestones]) => (
              <div key={yearMonth} className="space-y-3">
                {/* Month heading */}
                <h3 className="month-heading">
                  {yearMonth}
                </h3>
                
                {/* Grid layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {milestones.map((milestone: Milestone) => (
                    <div 
                      key={milestone._id} 
                      className="pixel-card overflow-hidden plan-card-hover"
                    >
                      {/* Card header with image or icon */}
                      <div className="relative h-48 bg-gradient-to-r from-[#FFB6B6] to-[#FFDAB9]">
                        {milestone.photos && milestone.photos.length > 0 ? (
                          <img 
                            src={milestone.photos[0]} 
                            alt={milestone.title}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openImageViewer(milestone.photos[0], milestone.photos, 0)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-5xl">{milestone.icon}</span>
                          </div>
                        )}
                        
                        {/* Photo count badge */}
                        {milestone.photos && milestone.photos.length > 1 && (
                          <div 
                            className="absolute bottom-2 right-2 bg-[#5D4037] bg-opacity-70 text-white px-2 py-1 rounded-md text-xs cursor-pointer"
                            onClick={() => openImageViewer(milestone.photos[0], milestone.photos, 0)}
                          >
                            +{milestone.photos.length - 1} more
                          </div>
                        )}
                        
                        {/* Date badge */}
                        <div className="absolute top-2 left-2 bg-white bg-opacity-90 text-[#5D4037] px-2 py-1 rounded-md text-xs font-bold">
                          {formatDate(milestone.date)}
                        </div>
                      </div>
                      
                      {/* Card content */}
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-[#5D4037] flex items-center gap-1">
                            <span className="text-xl">{milestone.icon}</span>
                            {milestone.title}
                          </h3>
                          
                          <div className="flex space-x-1">
                            <button
                              onClick={() => startEditing(milestone)}
                              className="pixel-button text-xs w-7 h-7 p-0 flex items-center justify-center"
                              aria-label="Edit milestone"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setShowConfirmDelete(milestone._id)}
                              className="pixel-button bg-[#FFCCBC] text-xs w-7 h-7 p-0 flex items-center justify-center"
                              aria-label="Delete milestone"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        {/* Description preview */}
                        {milestone.description && (
                          <div className="text-sm text-[#8D6E63] italic line-clamp-2 mb-2">
                            "{milestone.description}"
                          </div>
                        )}
                        
                        {/* Category tag */}
                        <div className="mt-2">
                          <span className="inline-block bg-[#FFE0B2] text-[#5D4037] rounded-full px-2 py-1 text-xs">
                            {milestone.category.replace(/-/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">✨</div>
              <h3 className="empty-state-title">No Milestones Yet</h3>
              <p className="empty-state-desc">
                {filter === "all" 
                  ? "Start capturing your special moments!" 
                  : `No ${filter.replace(/-/g, ' ')} milestones found. Try another category or add a new one!`}
              </p>
              {!showAddForm && (
                <button 
                  className="pixel-button mt-4"
                  onClick={() => isMobile ? openBottomSheet("add") : setShowAddForm(true)}
                >
                  Add Your First Memory
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timeline view mode */}
      {viewMode === "timeline" && (
        <div className="timeline-container relative pb-10">
          {/* Vertical timeline line */}
          <div className="timeline-line"></div>
          
          {Object.keys(groupedMilestones).length > 0 ? (
            <>
              {Object.entries(groupedMilestones).map(([yearMonth, milestones]) => (
                <div key={yearMonth} className="mb-6">
                  {/* Year/Month marker */}
                  <div className="relative z-10 ml-12 mb-4">
                    <div className="inline-block bg-[#FF6B6B] text-white px-4 py-1 rounded-lg shadow-md">
                      {yearMonth}
                    </div>
                  </div>
                  
                  {/* Timeline items */}
                  {milestones.map((milestone: Milestone) => (
                    <div key={milestone._id} className="timeline-item mb-8">
                      <div className="pixel-card p-4 plan-card-hover">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{milestone.icon}</span>
                            <h3 className="text-lg font-semibold text-[#5D4037]">{milestone.title}</h3>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => startEditing(milestone)}
                              className="pixel-button text-xs w-7 h-7 p-0 flex items-center justify-center"
                              aria-label="Edit milestone"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setShowConfirmDelete(milestone._id)}
                              className="pixel-button bg-[#FFCCBC] text-xs w-7 h-7 p-0 flex items-center justify-center"
                              aria-label="Delete milestone"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        {/* Date badge */}
                        <div className="inline-block bg-[#FFE0B2] text-[#5D4037] px-2 py-1 rounded-md text-xs mt-2">
                          {formatDate(milestone.date)}
                        </div>
                        
                        {/* Description */}
                        {milestone.description && (
                          <div className="mt-3">
                            <div className="bg-[#FFF8F5] p-3 rounded-lg border-l-4 border-[#FFB6B6] italic text-[#5D4037] text-sm">
                              "{milestone.description}"
                            </div>
                          </div>
                        )}
                        
                        {/* Photos - Improved compact layout for timeline */}
                        {milestone.photos && milestone.photos.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-2">
                              {milestone.photos.slice(0, 3).map((photo, index) => (
                                <div 
                                  key={index} 
                                  className="w-20 h-20 overflow-hidden rounded-lg border-2 border-[#FFDAB9] cursor-pointer photo-hover"
                                  onClick={() => openImageViewer(photo, milestone.photos, index)}
                                >
                                  <img
                                    src={photo}
                                    alt={`Memory ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {milestone.photos.length > 3 && (
                                <div 
                                  className="w-20 h-20 flex items-center justify-center bg-[#FFE0B2] rounded-lg border-2 border-[#FFDAB9] cursor-pointer"
                                  onClick={() => openImageViewer(milestone.photos[0], milestone.photos, 0)}
                                >
                                  <span className="text-[#5D4037] font-bold">+{milestone.photos.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state ml-12">
              <div className="empty-state-icon">✨</div>
              <h3 className="empty-state-title">No Milestones Yet</h3>
              <p className="empty-state-desc">
                {filter === "all" 
                  ? "Start capturing your special moments!" 
                  : `No ${filter.replace(/-/g, ' ')} milestones found. Try another category or add a new one!`}
              </p>
              {!showAddForm && (
                <button 
                  className="pixel-button mt-4"
                  onClick={() => isMobile ? openBottomSheet("add") : setShowAddForm(true)}
                >
                  Add Your First Memory
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal for delete */}
      {showConfirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur">
          <div className="pixel-card p-4 w-5/6 max-w-sm animate-fade-in">
            <h4 className="text-lg text-[#FF6B6B] mb-3">Delete Milestone</h4>
            <p className="text-[#5D4037] mb-4">
              Are you sure you want to delete this milestone? This cannot be undone.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => handleDeleteMilestone(showConfirmDelete)}
                className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C] text-sm px-4 py-2"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="pixel-button text-sm px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile add button - fixed at bottom */}
      {isMobile && activeSheet === "none" && (
        <button
          onClick={() => openBottomSheet("add")}
          className="fixed bottom-4 right-4 z-10 w-14 h-14 rounded-full bg-[#FF6B6B] text-white text-2xl flex items-center justify-center shadow-lg border-4 border-[#FFDAB9]"
          aria-label="Add new milestone"
        >
          +
        </button>
      )}

      {/* Bottom sheets for mobile */}
      {isMobile && (
        <>
          {/* Add new milestone bottom sheet */}
          {activeSheet === "add" && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur"
              onClick={closeBottomSheet}
            >
              <div 
                className="fixed bottom-0 left-0 right-0 bg-[#FFF5EE] rounded-t-3xl shadow-lg z-50 animate-slide-up max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
                onTouchStart={handleSheetTouchStart}
                onTouchMove={handleSheetTouchMove}
                onTouchEnd={handleSheetTouchEnd}
                style={{ transform: `translateY(${sheetPosition}px)` }}
              >
                <div className="drag-indicator my-2"></div>
                
                <div className="p-4">
                  <h3 className="mobile-section-title">
                    <span className="animate-pulse">✨</span>
                    Add New Milestone
                    <span className="animate-pulse">✨</span>
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Title:</label>
                      <input
                        type="text"
                        value={newMilestone.title}
                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        placeholder="What's the special moment?"
                        className="pixel-input w-full text-base"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Date:</label>
                      <input
                        type="date"
                        value={newMilestone.date}
                        onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                        className="pixel-input w-full text-base"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Category:</label>
                      <div className="flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 scrollbar-hide">
                        {Object.entries(categoryIcons).map(([category, icon]) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setNewMilestone({ 
                              ...newMilestone, 
                              category: category,
                              icon: icon
                            })}
                            className={`pixel-button whitespace-nowrap flex-shrink-0 p-2 flex flex-col items-center justify-center ${
                              newMilestone.category === category 
                                ? "bg-[#FFB6B6] transform -translate-y-1 border-[#FF6B6B]" 
                                : "bg-[#FFE0B2]"
                            }`}
                          >
                            <span className="text-xl mb-1">{icon}</span>
                            <span>{category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Description:</label>
                      <textarea
                        value={newMilestone.description}
                        onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                        placeholder="Share the story behind this moment..."
                        className="pixel-input w-full min-h-[80px] text-base"
                      />
                    </div>
                    
                    {/* Photo upload section */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-[#5D4037]">
                        <span className="mr-2">Photos</span>
                        {isUploading && (
                          <span className="text-xs text-[#FF6B6B]">(Uploading...)</span>
                        )}
                      </label>
                      
                      <div className="flex gap-2">
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
                          className="pixel-button text-sm px-3 py-2 flex-1 flex items-center justify-center"
                        >
                          <span className="mr-2">📷</span>
                          Add Photo
                        </button>
                        
                        {localPhotos.length > 0 && (
                          <div className="text-sm text-[#5D4037] flex items-center">
                            {localPhotos.length} {localPhotos.length === 1 ? 'photo' : 'photos'}
                          </div>
                        )}
                      </div>
                      
                      {/* Upload progress for mobile adding */}
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-[#5D4037]">
                            <span>Uploading image {currentUploadIndex + 1} of {localPhotos.length}</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-[#FFF1E6] rounded-full h-4">
                            <div 
                              className="bg-[#FF6B6B] h-4 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Preview of added photos */}
                      {localPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {localPhotos.map((photo, index) => (
                            <div key={index} className="relative group aspect-square">
                              <div 
                                className="w-full h-full overflow-hidden rounded-lg border-2 border-[#FFDAB9] cursor-pointer"
                                onClick={() => openImageViewer(photo, localPhotos, index)}
                              >
                                <img
                                  src={photo}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePhoto(index);
                                }}
                                className="absolute top-1 right-1 bg-[#FF6B6B] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        type="submit" 
                        className="mobile-action-button pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20]"
                        disabled={isUploading}
                      >
                        ✅ Save
                      </button>
                      
                      <button 
                        type="button"
                        onClick={closeBottomSheet}
                        className="mobile-action-button pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          
          {/* Edit milestone bottom sheet */}
          {activeSheet === "edit" && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur"
              onClick={closeBottomSheet}
            >
              <div 
                className="fixed bottom-0 left-0 right-0 bg-[#FFF5EE] rounded-t-3xl shadow-lg z-50 animate-slide-up max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
                onTouchStart={handleSheetTouchStart}
                onTouchMove={handleSheetTouchMove}
                onTouchEnd={handleSheetTouchEnd}
                style={{ transform: `translateY(${sheetPosition}px)` }}
              >
                <div className="drag-indicator my-2"></div>
                
                <div className="p-4">
                  <h3 className="mobile-section-title">
                    <span className="animate-pulse">✏️</span>
                    Edit Milestone
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Title:</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="pixel-input w-full text-base"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Date:</label>
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="pixel-input w-full text-base"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Category:</label>
                      <div className="flex overflow-x-auto gap-2 pb-2 -mx-1 px-1 scrollbar-hide">
                        {Object.entries(categoryIcons).map(([category, icon]) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setEditForm({ 
                              ...editForm, 
                              category: category,
                              icon: icon
                            })}
                            className={`pixel-button whitespace-nowrap flex-shrink-0 p-2 flex flex-col items-center justify-center ${
                              editForm.category === category 
                                ? "bg-[#FFB6B6] transform -translate-y-1 border-[#FF6B6B]" 
                                : "bg-[#FFE0B2]"
                            }`}
                          >
                            <span className="text-xl mb-1">{icon}</span>
                            <span>{category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Description:</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="pixel-input w-full min-h-[80px] text-base"
                      />
                    </div>
                    
                    {/* Photo upload section */}
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-[#5D4037]">
                        <span className="mr-2">Photos</span>
                        {editIsUploading && (
                          <span className="text-xs text-[#FF6B6B]">(Uploading...)</span>
                        )}
                      </label>
                      
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={editFileInputRef}
                          onChange={handleEditFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={editIsUploading}
                          className="pixel-button text-sm px-3 py-2 flex-1 flex items-center justify-center"
                        >
                          <span className="mr-2">📷</span>
                          Add Photo
                        </button>
                        
                        {editLocalPhotos.length > 0 && (
                          <div className="text-sm text-[#5D4037] flex items-center">
                            {editLocalPhotos.length} {editLocalPhotos.length === 1 ? 'photo' : 'photos'}
                          </div>
                        )}
                      </div>
                      
                      {/* Upload progress for mobile editing */}
                      {editIsUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-[#5D4037]">
                            <span>Uploading image {editCurrentUploadIndex + 1} of {editLocalPhotos.filter(url => !url.startsWith('http')).length}</span>
                            <span>{editUploadProgress}%</span>
                          </div>
                          <div className="w-full bg-[#FFF1E6] rounded-full h-4">
                            <div 
                              className="bg-[#FF6B6B] h-4 rounded-full transition-all duration-300"
                              style={{ width: `${editUploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Preview of edited photos */}
                      {editLocalPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {editLocalPhotos.map((photo, index) => (
                            <div key={index} className="relative group aspect-square">
                              <div 
                                className="w-full h-full overflow-hidden rounded-lg border-2 border-[#FFDAB9] cursor-pointer"
                                onClick={() => openImageViewer(photo, editLocalPhotos, index)}
                              >
                                <img
                                  src={photo}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveEditPhoto(index);
                                }}
                                className="absolute top-1 right-1 bg-[#FF6B6B] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={handleSaveEdit}
                        className="mobile-action-button pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20]"
                        disabled={editIsUploading}
                      >
                        ✅ Save
                      </button>
                      
                      <button 
                        type="button"
                        onClick={cancelEditing}
                        className="mobile-action-button pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Filter bottom sheet */}
          {activeSheet === "filter" && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur"
              onClick={closeBottomSheet}
            >
              <div 
                className="fixed bottom-0 left-0 right-0 bg-[#FFF5EE] rounded-t-3xl shadow-lg z-50 animate-slide-up"
                onClick={e => e.stopPropagation()}
                onTouchStart={handleSheetTouchStart}
                onTouchMove={handleSheetTouchMove}
                onTouchEnd={handleSheetTouchEnd}
                style={{ transform: `translateY(${sheetPosition}px)` }}
              >
                <div className="drag-indicator my-2"></div>
                
                <div className="p-4">
                  <h3 className="mobile-section-title">
                    Filter Milestones
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setFilter("all");
                        closeBottomSheet();
                      }}
                      className={`mobile-action-button pixel-button ${filter === "all" ? "bg-[#FFB6B6] border-[#FF6B6B]" : ""}`}
                    >
                      All Moments
                    </button>
                    
                    <button
                      onClick={() => {
                        setFilter("first-date");
                        closeBottomSheet();
                      }}
                      className={`mobile-action-button pixel-button ${filter === "first-date" ? "bg-[#FFB6B6] border-[#FF6B6B]" : ""}`}
                    >
                      First Dates 💑
                    </button>
                    
                    <button
                      onClick={() => {
                        setFilter("anniversary");
                        closeBottomSheet();
                      }}
                      className={`mobile-action-button pixel-button ${filter === "anniversary" ? "bg-[#FFB6B6] border-[#FF6B6B]" : ""}`}
                    >
                      Anniversaries 💝
                    </button>
                    
                    <button
                      onClick={() => {
                        setFilter("special-moment");
                        closeBottomSheet();
                      }}
                      className={`mobile-action-button pixel-button ${filter === "special-moment" ? "bg-[#FFB6B6] border-[#FF6B6B]" : ""}`}
                    >
                      Special Moments ✨
                    </button>
                    
                    <button
                      onClick={() => {
                        setFilter("trip");
                        closeBottomSheet();
                      }}
                      className={`mobile-action-button pixel-button ${filter === "trip" ? "bg-[#FFB6B6] border-[#FF6B6B]" : ""}`}
                    >
                      Trips ✈️
                    </button>
                    
                    <button
                      onClick={() => {
                        setFilter("celebration");
                        closeBottomSheet();
                      }}
                      className={`mobile-action-button pixel-button ${filter === "celebration" ? "bg-[#FFB6B6] border-[#FF6B6B]" : ""}`}
                    >
                      Celebrations 🎉
                    </button>
                    
                    <button
                      onClick={() => {
                        closeBottomSheet();
                      }}
                      className="mobile-action-button pixel-button mt-4"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Image viewer as bottom sheet for mobile */}
          {isMobile && activeSheet === "view" && viewerOpen && (
  <div 
    className="fixed inset-0 bg-black/80 z-40"
    onClick={closeBottomSheet}
  >
    <div 
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFF5EE] rounded-lg border-4 border-[#FFDAB9] shadow-xl w-[90%] max-h-[80%] z-50 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center p-2 bg-[#FFDAB9]">
        <div className="text-[#5D4037] text-sm">
          {currentPhotos.length > 1 ? `${imageIndex + 1} / ${currentPhotos.length}` : ""}
        </div>
        <button
          onClick={closeBottomSheet}
          className="w-8 h-8 bg-[#FF6B6B] rounded flex items-center justify-center text-white"
        >
          ×
        </button>
      </div>
      
      {/* Image container */}
      <div 
        className="relative p-4 flex justify-center"
        onTouchStart={handleImageTouchStart}
        onTouchEnd={handleImageTouchEnd}
      >
        <img
          src={currentImage}
          alt="Image view"
          className={`max-w-full max-h-[50vh] object-contain transition-transform duration-300 ${zoomedImage ? 'scale-125' : ''}`}
        />
      </div>
      
      {/* Bottom navigation */}
      {currentPhotos.length > 1 && (
        <div className="p-2 flex justify-center gap-4 bg-[#FFEAE6]">
          <button
            onClick={() => navigateImage('prev')}
            className="w-10 h-10 rounded-full bg-[#FFF5EE] border-2 border-[#FFDAB9] flex items-center justify-center text-[#5D4037]"
          >
            ←
          </button>
          <button
            onClick={() => navigateImage('next')}
            className="w-10 h-10 rounded-full bg-[#FFF5EE] border-2 border-[#FFDAB9] flex items-center justify-center text-[#5D4037]"
          >
                      →
                    </button>
                  </div>
                )}
                
                {/* Help text */}
                <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="bg-black/50 text-white px-4 py-2 rounded-full text-xs">
                    Double-tap to zoom • Swipe for next/prev
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

{!isMobile && viewerOpen && (
  <div 
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    onClick={closeImageViewer}
  >
    <div 
      className="bg-[#FFF5EE] rounded-lg border-4 border-[#FFDAB9] shadow-xl max-w-[80%] max-h-[80%] overflow-hidden relative animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Image container with reasonable dimensions */}
      <div className="relative p-2 flex justify-center">
        <img
          src={currentImage}
          alt="View"
          className="max-w-full max-h-[70vh] object-contain rounded"
        />
        
        {/* Navigation buttons overlaid on image container, but not taking full screen */}
        {currentPhotos.length > 1 && (
          <div className="absolute inset-x-0 top-1/2 flex justify-between px-4 -translate-y-1/2 pointer-events-none">
            <button
              className="pixel-button bg-white/90 w-10 h-10 text-xl flex items-center justify-center pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('prev');
              }}
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              className="pixel-button bg-white/90 w-10 h-10 text-xl flex items-center justify-center pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                navigateImage('next');
              }}
              aria-label="Next image"
            >
              →
            </button>
          </div>
        )}
      </div>
      
      {/* Image controls */}
      <div className="p-3 bg-[#FFDAB9] flex justify-between items-center">
        <div className="text-[#5D4037]">
          {currentPhotos.length > 1 ? `${imageIndex + 1} / ${currentPhotos.length}` : ""}
        </div>
        <button
          className="pixel-button bg-[#FF6B6B] text-white h-8 w-8 flex items-center justify-center"
          onClick={closeImageViewer}
        >
          ×
        </button>
      </div>
    </div>
  </div>
)}

      {/* Custom CSS for animations and styling */}
      <style>
        {`
        @keyframes success-animation {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        
        .pixel-success-animation {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          background-color: rgba(165, 214, 167, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: success-animation 1.5s forwards;
          font-size: 40px;
          pointer-events: none;
        }
        
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
        
        /* Image viewer enhancements */
        .drag-indicator {
          width: 40px;
          height: 5px;
          background-color: #FFDAB9;
          border-radius: 5px;
          margin: 8px auto;
        }
        
        /* Hide scrollbar */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .body-no-scroll {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
        }
        
        .month-heading {
          font-size: 1.25rem;
          color: #FF6B6B;
          margin-top: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px dashed #FFDAB9;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          background-color: #FFF8F5;
          border-radius: 12px;
          border: 2px dashed #FFDAB9;
        }
        
        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite ease-in-out;
        }
        
        .empty-state-title {
          font-size: 1.5rem;
          color: #FF6B6B;
          margin-bottom: 0.5rem;
        }
        
        .empty-state-desc {
          color: #8D6E63;
          margin-bottom: 1rem;
        }
        
        /* Tab filter styling */
        .tab-filter-button {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          background-color: #FFF5EE;
          border: 2px solid #FFDAB9;
          border-radius: 0.5rem;
          color: #8D6E63;
          margin-right: 0.5rem;
          transition: all 0.3s;
        }
        
        .tab-filter-button-active {
          background-color: #FFB6B6;
          color: #5D4037;
          transform: translateY(-2px);
          box-shadow: 0 4px 0 #FFDAB9;
        }
        
        /* View toggle styling */
        .view-toggle-container {
          display: flex;
          background-color: #FFF1E6;
          border-radius: 20px;
          border: 2px solid #FFDAB9;
          padding: 3px;
          overflow: hidden;
        }
        
        .view-toggle-button {
          padding: 8px 12px;
          font-size: 14px;
          border-radius: 16px;
          transition: all 0.3s ease;
          color: #8D6E63;
          flex: 1;
          text-align: center;
        }
        
        .view-toggle-button:hover {
          background-color: #FFE0B2;
        }
        
        .view-toggle-button-active {
          background-color: #FFB6B6;
          color: white;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Mobile specific styles */
        .mobile-section-title {
          font-size: 1.25rem;
          text-align: center;
          color: #FF6B6B;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .mobile-action-button {
          padding: 0.75rem;
          font-size: 1rem;
        }
        
        .filter-dot-active {
          box-shadow: 0 0 0 2px #FFF5EE;
        }
        
        /* Timeline specific styles */
        .timeline-container {
          position: relative;
        }
        
        .timeline-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 20px;
          width: 4px;
          background: linear-gradient(to bottom, #FFB6B6, #FFDAB9);
          border-radius: 2px;
          z-index: 0;
        }
        
        .timeline-item {
          position: relative;
          padding-left: 40px;
          margin-bottom: 20px;
        }
        
        .timeline-item::before {
          content: '';
          position: absolute;
          left: 12px;
          top: 15px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FFF1E6;
          border: 4px solid #FFB6B6;
          z-index: 1;
        }
        
        /* Photo hover effect */
        .photo-hover {
          transition: transform 0.3s ease;
        }
        
        .photo-hover:hover {
          transform: scale(1.05);
        }
        
        /* Card hover effect */
        .plan-card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .plan-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(255, 218, 185, 0.4);
        }
        `}
      </style>
    </div>
  );
}

// Help function for keyboard handling
function useKeyPress(targetKey: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === targetKey) {
        callback();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [targetKey, callback]);
}