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
 * Desktop-optimized version of MoodBoardSection
 */
export default function MoodBoardSectionDesktop() {
    const moodItems = useQuery(api.moodboard.getAll) || [];
    const addMoodItem = useMutation(api.moodboard.add);
    const updateMoodItem = useMutation(api.moodboard.update);
    const removeMoodItem = useMutation(api.moodboard.remove);
  
  // File input ref
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

  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [filteredItems, setFilteredItems] = useState<MoodItem[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<Id<"moodboard"> | null>(null);
  const [layout, setLayout] = useState<"grid" | "masonry">("grid");
  const [fadeIn, setFadeIn] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
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
      alert("Please wait for image to finish uploading.");
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
      
      // Show success animation
      playSuccessAnimation();
      
      // Close form after submission
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add mood item:", error);
      alert("Failed to add mood item. Please try again.");
    }
  };

  const startEditing = (item: MoodItem) => {
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
      setEditingItem(null);
      playSuccessAnimation();
    } catch (error) {
      console.error("Failed to update mood item:", error);
      alert("Failed to update mood item. Please try again.");
    }
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditUploadProgress(0);
    setEditIsUploading(false);
  };

  const handleDeleteItem = async (id: Id<"moodboard">) => {
    try {
      await removeMoodItem({ id });
      setShowConfirmDelete(null);
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
        tags: editForm.tags.filter((t: string) => t !== tag)
      });
    } else {
      setNewMoodItem({
        ...newMoodItem,
        tags: newMoodItem.tags.filter((t: string) => t !== tag)
      });
    }
  };
  
  const openItemModal = (item: MoodItem) => {
    setCurrentItem(item);
    setShowModal(true);
  };
  
  const closeItemModal = () => {
    setShowModal(false);
    setCurrentItem(null);
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
    <div className={`space-y-6 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      {/* Header section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl text-[#FF6B6B] pixel-title-small mb-0">
          Our Mood Board <span className="heart-icon">💭</span>
        </h2>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setLayout(layout === "grid" ? "masonry" : "grid")}
            className="pixel-button text-xs px-3 py-1 flex items-center gap-1"
            title={layout === "grid" ? "Switch to masonry layout" : "Switch to grid layout"}
          >
            {layout === "grid" ? "Grid View" : "Masonry View"}
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="pixel-button text-xs px-3 py-1 flex items-center gap-1"
          >
            {showAddForm ? "Hide Form" : "Add New"}
          </button>
        </div>
      </div>
      
      {/* Search and filter section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-2/3">
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
        
        <div className="flex flex-wrap gap-2 w-full sm:w-1/3 justify-end">
          {activeTag && (
            <button
              onClick={() => setActiveTag("")}
              className="pixel-button text-xs px-3 py-1 bg-[#FFB6B6] text-[#5D4037] flex items-center gap-1"
            >
              Clear Filter: "{activeTag}" ✕
            </button>
          )}
        </div>
      </div>
      
      {/* Tags filter */}
      {allTags.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex space-x-2 whitespace-nowrap">
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

      {/* Form for adding new mood item */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="pixel-card p-4 mb-4">
          <h3 className="text-xl text-[#FF6B6B] mb-4 flex items-center gap-2">
            <span className="animate-pulse">💭</span>
            Add New Mood Item
            <span className="animate-pulse">💭</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#5D4037]">Title:</label>
                <input
                  type="text"
                  value={newMoodItem.title}
                  onChange={(e) => setNewMoodItem({ ...newMoodItem, title: e.target.value })}
                  placeholder="Give your mood item a name"
                  className="pixel-input w-full"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#5D4037]">Description:</label>
                <textarea
                  value={newMoodItem.description}
                  onChange={(e) => setNewMoodItem({ ...newMoodItem, description: e.target.value })}
                  placeholder="Add a short description..."
                  className="pixel-input w-full min-h-[80px]"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#5D4037]">
                  Social Media URL (Pinterest, Twitter, or Instagram):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={socialUrl}
                    onChange={handleSocialUrlChange}
                    placeholder="Paste Pinterest, Twitter, or Instagram URL..."
                    className="pixel-input w-full"
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
                  Paste a link to automatically create a mood item with an embed.
                </p>
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-[#5D4037]">Background Color:</label>
                <div className="flex flex-wrap gap-2">
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
              
              <div className="space-y-1">
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
                  
                  {!showTagInput && (
                    <button
                      type="button"
                      onClick={() => setShowTagInput(true)}
                      className="bg-[#FFF5EE] text-[#5D4037] px-2 py-1 rounded-md text-sm border border-dashed border-[#FFDAB9] hover:border-[#FF6B6B]"
                    >
                      + Add Tag
                    </button>
                  )}
                </div>
                
                {showTagInput && (
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
            </div>
            
            <div className="space-y-3">
              {/* Preview embed if available */}
              {newMoodItem.embedUrl && newMoodItem.embedType ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#5D4037]">Social Media Embed:</label>
                  <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-[#FFDAB9] h-56">
                    <SocialEmbed
                      url={newMoodItem.embedUrl}
                      embedType={newMoodItem.embedType}
                      className="w-full h-full"
                    />
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
                    <div className="border-2 border-dashed border-[#FFDAB9] rounded-lg p-8 text-center h-56 flex flex-col items-center justify-center">
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
                      <p className="text-sm text-[#8D6E63]">
                        Select an image (JPG, PNG, GIF)
                      </p>
                      
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
                    <div className="relative rounded-lg overflow-hidden h-56 group">
                      <img
                        src={newMoodItem.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setNewMoodItem({ ...newMoodItem, imageUrl: "" })}
                          className="bg-[#FF6B6B] text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              type="submit" 
              className="pixel-button bg-[#A5D6A7] border-[#81C784] text-[#1B5E20] hover:bg-[#81C784]"
              disabled={isUploading || isProcessingUrl || (!newMoodItem.imageUrl && !newMoodItem.embedUrl) || !newMoodItem.title}
            >
              ✅ Save Mood Item
            </button>
            
            <button 
              type="button"
              onClick={() => setShowAddForm(false)}
              className="pixel-button bg-[#FFCCBC] border-[#FFAB91] text-[#BF360C]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Mood board gallery */}
      <div className={`${layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" : "columns-1 sm:columns-2 md:columns-3 gap-4"}`}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={item._id} 
              className={`overflow-hidden ${layout === "grid" ? "" : "mb-4 break-inside-avoid"}`}
            >
              {editingItem === item._id ? (
                // Edit mode
                <div className="pixel-card p-4 h-full">
                  <h3 className="text-xl text-[#FF6B6B] mb-4">Edit Mood Item</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Title:</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="pixel-input w-full"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Description:</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="pixel-input w-full h-20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#5D4037]">Background Color:</label>
                      <div className="flex flex-wrap gap-2">
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
                        {editForm.tags.map((tag: string) => (
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
                        
                        {!showTagInput && (
                          <button
                            type="button"
                            onClick={() => setShowTagInput(true)}
                            className="bg-[#FFF5EE] text-[#5D4037] px-2 py-1 rounded-md text-sm border border-dashed border-[#FFDAB9] hover:border-[#FF6B6B]"
                          >
                            + Add Tag
                          </button>
                        )}
                      </div>
                      
                      {showTagInput && (
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
                    
                    {/* Display embed if available, otherwise allow image editing */}
                    {editForm.embedUrl && editForm.embedType ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#5D4037]">Social Media Embed:</label>
                        <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-[#FFDAB9] h-40">
                          <SocialEmbed
                            url={editForm.embedUrl}
                            embedType={editForm.embedType}
                            className="w-full h-full"
                          />
                        </div>
                        <p className="text-xs text-[#8D6E63] italic">
                          You cannot edit the embed, but you can delete and add a new one.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#5D4037]">Image:</label>
                        <div className="relative rounded-lg overflow-hidden h-40 group">
                          <img
                            src={editForm.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
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
                              className="bg-white text-[#5D4037] rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              📷
                            </button>
                          </div>
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
                    
                    <div className="flex justify-between mt-4">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={editIsUploading || (!editForm.imageUrl && !editForm.embedUrl) || !editForm.title}
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
                </div>
              ) : (
                // View mode
                <div 
                  className="pixel-card overflow-hidden plan-card-hover cursor-pointer" 
                  style={{ backgroundColor: item.color || defaultColors[0] }}
                  onClick={() => openItemModal(item)}
                >
                  <div className="relative group">
                    {item.embedUrl && item.embedType ? (
                      <div className="w-full h-48 overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-[#FFEAE6] z-0">
                          <div className="text-center p-2">
                            <div className="text-3xl mb-1">
                              {item.embedType === 'pinterest' && '📌'}
                              {item.embedType === 'twitter' && '🐦'}
                              {item.embedType === 'instagram' && '📷'}
                            </div>
                            <div className="text-sm text-[#5D4037]">
                              {item.embedType.charAt(0).toUpperCase() + item.embedType.slice(1)} Post
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 z-20">
                          <div className={`embed-badge embed-badge-${item.embedType}`}>
                            {item.embedType.charAt(0).toUpperCase() + item.embedType.slice(1)}
                          </div>
                        </div>
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover opacity-90"
                          />
                        )}
                      </div>
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(item);
                        }}
                        className="pixel-button bg-white bg-opacity-70 hover:bg-opacity-100 w-8 h-8 p-0 flex items-center justify-center"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDelete(item._id);
                        }}
                        className="pixel-button bg-white bg-opacity-70 hover:bg-opacity-100 w-8 h-8 p-0 flex items-center justify-center"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50"></div>
                  </div>
                  
                  <div className="p-3">
                    <h3 className="text-lg font-medium text-[#5D4037] mb-1">{item.title}</h3>
                    
                    {item.description && (
                      <p className="text-sm text-[#8D6E63] mb-2 line-clamp-2">{item.description}</p>
                    )}
                    
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.map((tag: string) => (
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
                      </div>
                    )}
                    
                    <div className="text-xs text-[#8D6E63] mt-2">
                      Added {formatDate(item.addedAt)}
                    </div>
                  </div>
                  
                  {/* Confirmation modal for delete */}
                  {showConfirmDelete === item._id && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur">
                      <div className="pixel-card p-4 w-5/6 max-w-sm animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h4 className="text-lg text-[#FF6B6B] mb-3">Delete Mood Item</h4>
                        <p className="text-[#5D4037] mb-4">
                          Are you sure you want to delete "{item.title}"? This cannot be undone.
                        </p>
                        <div className="flex justify-between">
                          <button
                            onClick={() => handleDeleteItem(item._id)}
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
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state col-span-3">
            <div className="empty-state-icon">💭</div>
            <h3 className="empty-state-title">No Mood Items Yet</h3>
            <p className="empty-state-desc">
              {searchQuery || activeTag
                ? "No items match your search. Try changing your filters."
                : "Start adding images, colors, and inspiration to your mood board!"}
            </p>
            {!showAddForm && (
              <button 
                className="pixel-button mt-4"
                onClick={() => setShowAddForm(true)}
              >
                Add Your First Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Item detail modal */}
      {showModal && currentItem && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/75 z-50 animate-fade-in"
          onClick={closeItemModal}
        >
          <div 
            className="w-11/12 max-w-3xl bg-white rounded-lg shadow-2xl overflow-hidden animate-fade-in" 
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: currentItem.color || defaultColors[0] }}
          >
            {currentItem.embedUrl && currentItem.embedType ? (
              <div className="w-full h-auto max-h-[60vh]">
                <SocialEmbed 
                  url={currentItem.embedUrl} 
                  embedType={currentItem.embedType}
                  className="w-full h-full min-h-[300px]"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={currentItem.imageUrl}
                  alt={currentItem.title}
                  className="w-full h-auto max-h-[70vh] object-contain bg-[#FFEAE6]"
                />
              </div>
            )}
            
            <button
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-opacity-70 transition-colors"
              onClick={closeItemModal}
            >
              ×
            </button>
            
            <div className="p-5">
              <h2 className="text-2xl font-medium text-[#5D4037] mb-2">{currentItem.title}</h2>
              
              {currentItem.description && (
                <p className="text-[#8D6E63] mb-4">{currentItem.description}</p>
              )}
              
              {currentItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentItem.tags.map((tag: string) => (
                    <span 
                      key={tag} 
                      className="bg-[#FFE0B2] text-[#5D4037] px-2 py-1 rounded-md text-sm"
                      onClick={() => {
                        setActiveTag(tag);
                        closeItemModal();
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-[#8D6E63]">
                  Added {formatDate(currentItem.addedAt)}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      startEditing(currentItem);
                      closeItemModal();
                    }}
                    className="pixel-button text-sm px-3 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmDelete(currentItem._id);
                      closeItemModal();
                    }}
                    className="pixel-button bg-[#FFCCBC] text-sm px-3 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
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
          pointer-events: none;
        }
        
        .pixel-success-animation:before {
          content: '✓';
          font-size: 60px;
          color: #1B5E20;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
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
          transform: translateY(-1px);
        }
        
        .tag-button-active {
          background-color: #FFB6B6;
          border-color: #FF6B6B;
          transform: translateY(-1px);
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* For the masonry layout */
        .columns-1 {
          columns: 1;
        }
        
        @media (min-width: 640px) {
          .sm\\:columns-2 {
            columns: 2;
          }
        }
        
        @media (min-width: 768px) {
          .md\\:columns-3 {
            columns: 3;
          }
        }
        
        .break-inside-avoid {
          break-inside: avoid;
        }

        /* Social embed styling */
        .social-embed {
          position: relative;
          background-color: #FFF5EE;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .social-embed:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(255, 218, 185, 0.3);
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

        /* Badge styling for embeds in gallery view */
        .embed-badge {
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
          color: white;
          z-index: 10;
        }

        .embed-badge-pinterest {
          background-color: #E60023;
        }

        .embed-badge-twitter {
          background-color: #1DA1F2;
        }

        .embed-badge-instagram {
          background-color: #C13584;
        }
      `}</style>
    </div>
  );
}
