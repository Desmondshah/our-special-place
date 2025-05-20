import { FormEvent, useState, useRef, ChangeEvent, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MoodItem, MoodItemForm, emptyMoodItemForm, defaultColors } from "../../convex/MoodBoardTypes";
import { 
  readFileAsDataURL, 
  isFileSizeValid, 
  playSuccessAnimation, 
  filterMoodItems, 
  getAllTags, 
  formatDate,
  checkSocialMediaUrl,
  fetchEmbedData,
  getEmbedTitle,
  getEmbedDescription,
  getEmbedThumbnail
} from "../../convex/MoodBoardUtils";
import SocialEmbed from "./SocialEmbed";

/**
 * Mobile-optimized version of MoodBoardSection
 */
export default function MoodBoardSectionMobile() {
    const moodItems = useQuery(api.moodboard.getAll) || [];
    const addMoodItem = useMutation(api.moodboard.add);
    const updateMoodItem = useMutation(api.moodboard.update);
    const removeMoodItem = useMutation(api.moodboard.remove);
  
  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // State for new mood item
  const [newMoodItem, setNewMoodItem] = useState<MoodItemForm>({...emptyMoodItemForm});
  
  // State for file uploads
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editIsUploading, setEditIsUploading] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);

  // State for social media URLs
  const [socialUrl, setSocialUrl] = useState("");
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [urlProcessingProgress, setUrlProcessingProgress] = useState(0);

  // Mobile-specific UI states
  const [activeSheet, setActiveSheet] = useState<"none" | "add" | "edit" | "filter" | "details">("none");
  const [touchStartY, setTouchStartY] = useState(0);
  const [sheetPosition, setSheetPosition] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [filteredItems, setFilteredItems] = useState<MoodItem[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<Id<"moodboard"> | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [currentItem, setCurrentItem] = useState<MoodItem | null>(null);

  // State for editing
  const [editingItem, setEditingItem] = useState<Id<"moodboard"> | null>(null);
  const [editForm, setEditForm] = useState<MoodItemForm>({...emptyMoodItemForm});

  // Fade in animation
  useEffect(() => {
    setFadeIn(true);
  }, []);

  // Filter items and extract tags when data changes
  useEffect(() => {
    setFilteredItems(filterMoodItems(moodItems, searchQuery, activeTag));
    setAllTags(getAllTags(moodItems));
  }, [moodItems, searchQuery, activeTag]);

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

  const openBottomSheet = (type: "add" | "edit" | "filter" | "details", item?: MoodItem) => {
    setActiveSheet(type);
    document.body.classList.add("body-no-scroll");
    
    if (type === "details" && item) {
      setCurrentItem(item);
    } else if (type === "edit" && item) {
      setEditingItem(item._id);
      setEditForm({
        imageUrl: item.imageUrl,
        title: item.title,
        description: item.description || "",
        tags: [...item.tags],
        color: item.color || defaultColors[0],
        embedUrl: item.embedUrl,
        embedType: item.embedType,
        embedData: item.embedData
      });
    }
  };

  const closeBottomSheet = () => {
    setActiveSheet("none");
    setSheetPosition(0);
    document.body.classList.remove("body-no-scroll");
    
    if (activeSheet === "edit") {
      setEditingItem(null);
    } else if (activeSheet === "details") {
      setCurrentItem(null);
    }
  };

  // Handle social media URL pasting
  const handleSocialUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setSocialUrl(url);
    
    // Check if it's a valid social media URL
    const { isValid, type } = checkSocialMediaUrl(url);
    
    if (isValid && type) {
      try {
        setIsProcessingUrl(true);
        setUrlProcessingProgress(20);
        
        // Fetch the embed data
        const embedData = await fetchEmbedData(url);
        setUrlProcessingProgress(60);
        
        // Extract useful information from the embed data
        const title = getEmbedTitle(embedData) || 'Social Media Post';
        const description = getEmbedDescription(embedData) || '';
        const thumbnail = getEmbedThumbnail(embedData) || '';
        
        setUrlProcessingProgress(80);
        
        // Update the newMoodItem with the embed information
        setNewMoodItem({
          ...newMoodItem,
          title: title,
          description: description,
          imageUrl: thumbnail || newMoodItem.imageUrl, // Use thumbnail if available
          embedUrl: url,
          embedType: type,
          embedData: embedData
        });
        
        setUrlProcessingProgress(100);
        
        // Clear the input after processing
        setTimeout(() => {
          setSocialUrl("");
          setIsProcessingUrl(false);
          setUrlProcessingProgress(0);
        }, 500);
        
      } catch (error) {
        console.error('Error processing social media URL:', error);
        alert('Failed to process social media URL. Please try again or use a different URL.');
        setIsProcessingUrl(false);
        setUrlProcessingProgress(0);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (isUploading || isProcessingUrl) {
      alert("Please wait for upload to complete.");
      return;
    }
    
    // Validation
    if (!newMoodItem.title.trim() || (!newMoodItem.imageUrl && !newMoodItem.embedUrl)) {
      alert("Title and either an image or social media embed are required!");
      return;
    }
    
    try {
      await addMoodItem({
        imageUrl: newMoodItem.imageUrl,
        title: newMoodItem.title,
        description: newMoodItem.description || undefined,
        tags: newMoodItem.tags,
        color: newMoodItem.color || undefined,
        embedUrl: newMoodItem.embedUrl,
        embedType: newMoodItem.embedType,
        embedData: newMoodItem.embedData,
      });
      
      // Reset form after successful submission
      setNewMoodItem({...emptyMoodItemForm});
      
      // Close form after submission
      closeBottomSheet();
      
      // Show success animation
      playSuccessAnimation();
    } catch (error) {
      console.error("Failed to add mood item:", error);
      alert("Failed to add mood item. Please try again.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    if (editIsUploading) {
      alert("Please wait for image to finish uploading.");
      return;
    }
    
    try {
      // Validation
      if (!editForm.title.trim() || (!editForm.imageUrl && !editForm.embedUrl)) {
        alert("Title and either an image or social media embed are required!");
        return;
      }
      
      await updateMoodItem({
        id: editingItem,
        imageUrl: editForm.imageUrl,
        title: editForm.title,
        description: editForm.description || undefined,
        tags: editForm.tags,
        color: editForm.color || undefined,
        embedUrl: editForm.embedUrl,
        embedType: editForm.embedType,
        embedData: editForm.embedData,
      });
      
      // Update successful, close edit mode
      closeBottomSheet();
      playSuccessAnimation();
    } catch (error) {
      console.error("Failed to update mood item:", error);
      alert("Failed to update mood item. Please try again.");
    }
  };

  const handleDeleteItem = async (id: Id<"moodboard">) => {
    try {
      await removeMoodItem({ id });
      setShowConfirmDelete(null);
      closeBottomSheet();
      playSuccessAnimation("delete");
    } catch (error) {
      console.error("Failed to delete mood item:", error);
      alert("Failed to delete mood item. Please try again.");
    }
  };

  const addTag = () => {
    if (newTag.trim() === "") return;
    
    if (editingItem) {
      // Add tag to edit form
      setEditForm({
        ...editForm,
        tags: [...editForm.tags, newTag.trim()]
      });
    } else {
      // Add tag to new item form
      setNewMoodItem({
        ...newMoodItem,
        tags: [...newMoodItem.tags, newTag.trim()]
      });
    }
    
    setNewTag("");
    setShowTagInput(false);
  };

  const removeTag = (tag: string, isEditMode: boolean = false) => {
    if (isEditMode) {
      setEditForm({
        ...editForm,
        tags: editForm.tags.filter(t => t !== tag)
      });
    } else {
      setNewMoodItem({
        ...newMoodItem,
        tags: newMoodItem.tags.filter(t => t !== tag)
      });
    }
  };
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
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
      
      // Convert file to data URL for direct display in img tags
      const dataUrl = await readFileAsDataURL(file);
      
      // Update progress
      setUploadProgress(80);
      
      // Store the data URL
      setNewMoodItem({
        ...newMoodItem,
        imageUrl: dataUrl
      });
      
      setUploadProgress(100);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to process file:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      // Short delay to show 100% before resetting
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };
  
  const handleEditFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setEditIsUploading(true);
    setEditUploadProgress(10);
    
    try {
      // Process only one file at a time
      const file = files[0];
      
      // Check file size
      if (!isFileSizeValid(file)) {
        alert("Image is too large! Please select an image under 5MB.");
        setEditIsUploading(false);
        setEditUploadProgress(0);
        return;
      }
      
      // Convert file to data URL for direct display in img tags
      const dataUrl = await readFileAsDataURL(file);
      
      // Update progress
      setEditUploadProgress(80);
      
      // Store the data URL
      setEditForm({
        ...editForm,
        imageUrl: dataUrl
      });
      
      setEditUploadProgress(100);
      
      // Reset the file input
      if (editFileInputRef.current) {
        editFileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to process file:", error);
      alert("Failed to process image. Please try again.");
    } finally {
      // Short delay to show 100% before resetting
      setTimeout(() => {
        setEditIsUploading(false);
        setEditUploadProgress(0);
      }, 500);
    }
  };

  return (
    <div 
      className={`relative transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl text-[#FF6B6B] pixel-title-small mb-0">
          Our Mood Board <span className="heart-icon">💭</span>
        </h2>
        
        <button 
          onClick={() => openBottomSheet("filter")}
          className="pixel-button text-xs px-3 py-1 relative"
          aria-label="Filter mood items"
        >
          <span>Filter</span>
          {(activeTag || searchQuery) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF6B6B] rounded-full filter-dot-active"></span>
          )}
        </button>
      </div>
      
      {/* Search input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, description or tag..."
          className="pixel-input w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8D6E63] hover:text-[#5D4037]"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Tags filter - horizontal scrolling */}
      {allTags.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hide mb-4">
          <div className="flex space-x-2 whitespace-nowrap">
            {activeTag && (
              <button
                onClick={() => setActiveTag("")}
                className="tag-button tag-button-active mr-2"
              >
                Clear: #{activeTag} ✕
              </button>
            )}
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                className={`tag-button ${activeTag === tag ? "tag-button-active" : ""}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mood board gallery - grid layout for mobile */}
      <div className="grid grid-cols-2 gap-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item._id} 
              className="overflow-hidden"
              onClick={() => openBottomSheet("details", item)}
            >
              <div 
                className="pixel-card overflow-hidden plan-card-hover cursor-pointer h-full" 
                style={{ backgroundColor: item.color || defaultColors[0] }}
              >
                <div className="relative">
                  {item.embedUrl && item.embedType ? (
                    <div className="h-40 overflow-hidden bg-[#FFEAE6] flex items-center justify-center">
                      <div className="text-center p-2">
                        <div className="text-xl mb-1">
                          {item.embedType === 'pinterest' && '📌'}
                          {item.embedType === 'twitter' && '🐦'}
                          {item.embedType === 'instagram' && '📷'}
                        </div>
                        <div className="text-xs text-[#5D4037]">
                          {item.embedType.charAt(0).toUpperCase() + item.embedType.slice(1)} Post
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  {item.embedUrl && (
                    <div className="absolute top-2 right-2 bg-[#FFE0B2] rounded-full h-6 w-6 flex items-center justify-center text-xs shadow-md border border-[#FFDAB9]">
                      💌
                    </div>
                  )}
                </div>
                
                <div className="p-2">
                  <h3 className="text-base font-medium text-[#5D4037] mb-1 line-clamp-1">{item.title}</h3>
                  
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {item.tags.slice(0, 2).map(tag => (
                        <span 
                          key={tag} 
                          className="bg-[#FFE0B2] bg-opacity-50 text-[#5D4037] px-1.5 py-0.5 rounded text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTag(tag);
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="bg-[#FFE0B2] bg-opacity-50 text-[#5D4037] px-1.5 py-0.5 rounded text-xs">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state col-span-2">
            <div className="empty-state-icon">💭</div>
            <h3 className="empty-state-title">No Mood Items Yet</h3>
            <p className="empty-state-desc">
              {searchQuery || activeTag
                ? "No items match your search. Try changing your filters."
                : "Start adding images, colors, and inspiration to your mood board!"}
            </p>
            <button 
              className="pixel-button mt-4"
              onClick={() => openBottomSheet("add")}
            >
              Add Your First Item
            </button>
          </div>
        )}
      </div>

      {/* Mobile add button - fixed at bottom */}
      {activeSheet === "none" && (
        <button
          onClick={() => openBottomSheet("add")}
          className="fixed bottom-4 right-4 z-10 w-14 h-14 rounded-full bg-[#FF6B6B] text-white text-2xl flex items-center justify-center shadow-lg border-4 border-[#FFDAB9]"
          aria-label="Add new mood item"
        >
          +
        </button>
      )}

      {/* Bottom sheets for mobile */}
      {/* Add new mood item bottom sheet */}
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
                <span className="animate-pulse">💭</span>
                Add New Mood Item
                <span className="animate-pulse">💭</span>
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Social media URL field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5D4037]">
                    Social Media URL:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={socialUrl}
                      onChange={handleSocialUrlChange}
                      placeholder="Paste Pinterest, Twitter, or Instagram URL..."
                      className="pixel-input w-full text-base"
                      disabled={isProcessingUrl}
                    />
                    {isProcessingUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-md">
                        <div className="text-sm text-[#5D4037]">
                          Processing... {urlProcessingProgress}%
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#8D6E63] italic">
                    Add Pinterest, Twitter, or Instagram posts with just a URL!
                  </p>
                </div>

                {/* Preview embed if available */}
                {newMoodItem.embedUrl && newMoodItem.embedType ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#5D4037]">Social Media Embed:</label>
                    <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-[#FFDAB9] h-40">
                      <div className="flex items-center justify-center h-full bg-[#FFF5EE] p-3">
                        <div className="text-center">
                          <div className="text-3xl mb-2">
                            {newMoodItem.embedType === 'pinterest' && '📌'}
                            {newMoodItem.embedType === 'twitter' && '🐦'}
                            {newMoodItem.embedType === 'instagram' && '📷'}
                          </div>
                          <div className="text-sm font-bold text-[#5D4037] mb-1">
                            {newMoodItem.embedType.charAt(0).toUpperCase() + newMoodItem.embedType.slice(1)} Post
                          </div>
                          <div className="text-xs text-[#8D6E63] line-clamp-2">
                            {newMoodItem.title}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewMoodItem({ 
                          ...newMoodItem, 
                          embedUrl: undefined,
                          embedType: undefined,
                          embedData: undefined
                        })}
                        className="absolute top-2 right-2 bg-[#FF6B6B] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md z-10"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-xs text-[#8D6E63] italic">
                      {newMoodItem.embedType.charAt(0).toUpperCase() + newMoodItem.embedType.slice(1)} post will be embedded in your mood board.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#5D4037]">Image:</label>
                    
                    {!newMoodItem.imageUrl ? (
                      <div className="border-2 border-dashed border-[#FFDAB9] rounded-lg p-8 text-center h-40 flex flex-col items-center justify-center">
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
                          className="pixel-button text-sm px-4 py-2 mb-2"
                        >
                          {isUploading ? `Uploading... ${uploadProgress}%` : "Choose Image"}
                        </button>
                        
                        {isUploading && (
                          <div className="w-full bg-[#FFF1E6] rounded-full h-4 mt-4">
                            <div 
                              className="bg-[#FF6B6B] h-4 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden h-40">
                        <img
                          src={newMoodItem.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewMoodItem({ ...newMoodItem, imageUrl: "" })}
                          className="absolute top-2 right-2 bg-[#FF6B6B] text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5D4037]">Title:</label>
                  <input
                    type="text"
                    value={newMoodItem.title}
                    onChange={(e) => setNewMoodItem({ ...newMoodItem, title: e.target.value })}
                    placeholder="Give your mood item a name"
                    className="pixel-input w-full text-base"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5D4037]">Description:</label>
                  <textarea
                    value={newMoodItem.description}
                    onChange={(e) => setNewMoodItem({ ...newMoodItem, description: e.target.value })}
                    placeholder="Add a short description..."
                    className="pixel-input w-full min-h-[80px] text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5D4037]">Background Color:</label>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {defaultColors.map((color: string) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewMoodItem({ ...newMoodItem, color })}
                        className={`w-8 h-8 rounded-full border-2 ${newMoodItem.color === color ? 'border-[#5D4037] transform scale-110' : 'border-[#FFDAB9]'}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5D4037] mb-2">Tags:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newMoodItem.tags.map((tag: string) => (
                      <span 
                        key={tag} 
                        className="bg-[#FFE0B2] text-[#5D4037] px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        #{tag}
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag)}
                          className="text-[#5D4037] hover:text-[#FF6B6B] ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  {!showTagInput ? (
                    <button
                      type="button"
                      onClick={() => setShowTagInput(true)}
                      className="w-full bg-[#FFF5EE] text-[#5D4037] py-2 rounded-md text-sm border border-dashed border-[#FFDAB9] hover:border-[#FF6B6B]"
                    >
                      + Add Tag
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Enter tag name"
                        className="pixel-input w-full"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="pixel-button text-xs px-3 py-1"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTagInput(false);
                          setNewTag("");
                        }}
                        className="pixel-button text-xs px-3 py-1 bg-[#FFCCBC]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    type="submit" 
                    className="mobile-action-button pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20]"
                    disabled={isUploading || isProcessingUrl || (!newMoodItem.imageUrl && !newMoodItem.embedUrl) || !newMoodItem.title}
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
      
      {/* Edit mood item bottom sheet */}
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
                Edit Mood Item
              </h3>
              
              <div className="space-y-4">
                {/* Display embed if available, otherwise allow image editing */}
                {editForm.embedUrl && editForm.embedType ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#5D4037]">Social Media Embed:</label>
                    <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-[#FFDAB9] h-40">
                      <div className="flex items-center justify-center h-full bg-[#FFF5EE] p-3">
                        <div className="text-center">
                          <div className="text-3xl mb-2">
                            {editForm.embedType === 'pinterest' && '📌'}
                            {editForm.embedType === 'twitter' && '🐦'}
                            {editForm.embedType === 'instagram' && '📷'}
                          </div>
                          <div className="text-sm font-bold text-[#5D4037] mb-1">
                            {editForm.embedType.charAt(0).toUpperCase() + editForm.embedType.slice(1)} Post
                          </div>
                          <div className="text-xs text-[#8D6E63] line-clamp-2">
                            {editForm.embedUrl}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#8D6E63] italic">
                      You cannot edit the embed, but you can delete this item and create a new one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#5D4037]">Image:</label>
                    <div className="relative rounded-lg overflow-hidden h-40">
                      <img
                        src={editForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
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
                        className="absolute bottom-2 right-2 bg-white text-[#5D4037] rounded-full w-10 h-10 flex items-center justify-center shadow-md"
                      >
                        📷
                      </button>
                    </div>
                    
                    {editIsUploading && (
                      <div className="w-full bg-[#FFF1E6] rounded-full h-4">
                        <div 
                          className="bg-[#FF6B6B] h-4 rounded-full transition-all duration-300"
                          style={{ width: `${editUploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}
                
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
                  <label className="block text-sm font-medium text-[#5D4037]">Description:</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="pixel-input w-full min-h-[80px] text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5D4037]">Background Color:</label>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {defaultColors.map((color: string) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, color })}
                        className={`w-8 h-8 rounded-full border-2 ${editForm.color === color ? 'border-[#5D4037] transform scale-110' : 'border-[#FFDAB9]'}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5D4037]">Tags:</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editForm.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-[#FFE0B2] text-[#5D4037] px-2 py-1 rounded-md text-sm flex items-center gap-1"
                      >
                        #{tag}
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag, true)}
                          className="text-[#5D4037] hover:text-[#FF6B6B] ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  {!showTagInput ? (
                    <button
                      type="button"
                      onClick={() => setShowTagInput(true)}
                      className="w-full bg-[#FFF5EE] text-[#5D4037] py-2 rounded-md text-sm border border-dashed border-[#FFDAB9] hover:border-[#FF6B6B]"
                    >
                      + Add Tag
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Enter tag name"
                        className="pixel-input w-full"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="pixel-button text-xs px-3 py-1"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTagInput(false);
                          setNewTag("");
                        }}
                        className="pixel-button text-xs px-3 py-1 bg-[#FFCCBC]"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={handleSaveEdit}
                    className="mobile-action-button pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20]"
                    disabled={editIsUploading || (!editForm.imageUrl && !editForm.embedUrl) || !editForm.title}
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
                Filter Mood Board
              </h3>
              
              <div className="space-y-3 mt-4">
                <label className="block text-sm font-medium text-[#5D4037]">Search:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title or description"
                    className="pixel-input w-full"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8D6E63] hover:text-[#5D4037]"
                    >
                      ✕
                    </button>
                  )}
                </div>
                
                <label className="block text-sm font-medium text-[#5D4037] mt-4">Filter by tag:</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setActiveTag("");
                      closeBottomSheet();
                    }}
                    className={`mobile-action-button pixel-button ${activeTag === "" ? "bg-[#FFB6B6] border-[#FF6B6B]" : ""}`}
                  >
                    All Items
                  </button>
                  
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveTag(tag);
                        closeBottomSheet();
                      }}
                      className={`mobile-action-button pixel-button ${activeTag === tag ? "bg-[#FFB6B6] border-[#FF6B6B]" : ""}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTag("");
                    closeBottomSheet();
                  }}
                  className="mobile-action-button pixel-button bg-[#FFCCBC] mt-4"
                >
                  Clear Filters
                </button>
                
                <button
                  onClick={closeBottomSheet}
                  className="mobile-action-button pixel-button mt-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Details bottom sheet */}
      {activeSheet === "details" && currentItem && (
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
            style={{ 
              transform: `translateY(${sheetPosition}px)`,
              backgroundColor: currentItem.color || defaultColors[0]
            }}
          >
            <div className="drag-indicator my-2"></div>
            
            <div className="p-0">
              <div className="relative">
                {currentItem.embedUrl && currentItem.embedType ? (
                  <div className="w-full h-auto">
                    <SocialEmbed 
                      url={currentItem.embedUrl} 
                      embedType={currentItem.embedType}
                      className="w-full min-h-[200px] max-h-[40vh]"
                    />
                  </div>
                ) : (
                  <img
                    src={currentItem.imageUrl}
                    alt={currentItem.title}
                    className="w-full h-auto max-h-[40vh] object-contain bg-[#FFEAE6]"
                  />
                )}
              </div>
              
              <div className="p-4">
                <h2 className="text-xl font-medium text-[#5D4037] mb-2">{currentItem.title}</h2>
                
                {currentItem.description && (
                  <p className="text-[#8D6E63] mb-4">{currentItem.description}</p>
                )}
                
                {currentItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentItem.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-[#FFE0B2] text-[#5D4037] px-2 py-1 rounded-md text-sm"
                        onClick={() => {
                          setActiveTag(tag);
                          closeBottomSheet();
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="text-sm text-[#8D6E63] mb-4">
                  Added {formatDate(currentItem.addedAt)}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {!currentItem.embedUrl && (
                    <button
                      onClick={() => {
                        openBottomSheet("edit", currentItem);
                      }}
                      className="mobile-action-button pixel-button"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button
                    onClick={() => setShowConfirmDelete(currentItem._id)}
                    className={`mobile-action-button pixel-button bg-[#FFCCBC] ${!currentItem.embedUrl ? "" : "col-span-2"}`}
                  >
                    🗑️ Delete
                  </button>
                </div>
                
                {currentItem.embedUrl && (
                  <div className="mt-4 p-3 bg-[#FFF1E6] rounded-lg text-xs text-[#8D6E63]">
                    <p>⚠️ Note: Embedded social media posts cannot be edited. To change the content, delete this item and create a new one.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal for delete */}
      {showConfirmDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur">
          <div className="pixel-card p-4 w-5/6 max-w-sm animate-fade-in">
            <h4 className="text-lg text-[#FF6B6B] mb-3">Delete Mood Item</h4>
            <p className="text-[#5D4037] mb-4">
              Are you sure you want to delete this item? This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDeleteItem(showConfirmDelete)}
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

      {/* Custom CSS for animations */}
      <style>{`
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
        
        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
        
        .filter-dot-active {
          animation: pulse-dot 1.5s infinite;
        }
        
        .tag-button {
          padding: 0.25rem 0.75rem;
          background-color: #FFE0B2;
          color: #5D4037;
          border-radius: 9999px;
          font-size: 0.875rem;
          transition: all 0.2s;
          border: 2px solid transparent;
        }
        
        .tag-button:hover {
          background-color: #FFDAB9;
        }
        
        .tag-button-active {
          background-color: #FFB6B6;
          border-color: #FF6B6B;
        }
        
        .drag-indicator {
          width: 48px;
          height: 4px;
          background-color: #FFDAB9;
          border-radius: 2px;
          margin: 0 auto 16px;
        }
        
        .mobile-action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          width: 100%;
          font-size: 16px;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
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

        /* Social embed styling for mobile */
        .social-embed {
          position: relative;
          background-color: #FFF5EE;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        /* Platform-specific styling */
        .pinterest-embed {
          border-left: 4px solid #E60023; /* Pinterest red */
        }

        .twitter-embed {
          border-left: 4px solid #1DA1F2; /* Twitter blue */
        }

        .instagram-embed {
          border-left: 4px solid #C13584; /* Instagram purple */
        }

        /* Fix for iframe rendering in mobile */
        iframe {
          display: block;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
