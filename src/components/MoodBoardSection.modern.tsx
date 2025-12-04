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
  getEmbedThumbnail,
} from "../../convex/MoodBoardUtils";
import SocialEmbed from "./SocialEmbed";
import { motion, AnimatePresence } from "framer-motion";

// Modern color palette for mood board items
const modernColors = [
  "#FEF3E7", // Warm cream
  "#FFF1F2", // Rose tint
  "#F0FDF4", // Mint
  "#EFF6FF", // Sky blue
  "#FEF9C3", // Soft yellow
  "#F3E8FF", // Lavender
  "#ECFDF5", // Emerald tint
  "#FFF7ED", // Peach
];

export default function MoodBoardSection() {
  const moodItems = useQuery(api.moodboard.getAll) || [];
  const addMoodItem = useMutation(api.moodboard.add);
  const updateMoodItem = useMutation(api.moodboard.update);
  const removeMoodItem = useMutation(api.moodboard.remove);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const [newMoodItem, setNewMoodItem] = useState<MoodItemForm>({ ...emptyMoodItemForm });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editIsUploading, setEditIsUploading] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);

  const [socialUrl, setSocialUrl] = useState("");
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [urlProcessingProgress, setUrlProcessingProgress] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [filteredItems, setFilteredItems] = useState<MoodItem[]>([]);
  const [allTagsFromItems, setAllTagsFromItems] = useState<string[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<MoodItem | null>(null);
  const [layout, setLayout] = useState<"masonry" | "grid">("masonry");

  const [newTag, setNewTag] = useState("");
  const [editNewTag, setEditNewTag] = useState("");

  const [editingItem, setEditingItem] = useState<MoodItem | null>(null);
  const [editForm, setEditForm] = useState<MoodItemForm>({ ...emptyMoodItemForm });

  const [lightboxItem, setLightboxItem] = useState<MoodItem | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; visible: boolean; type: "success" | "error" }>({
    message: "",
    visible: false,
    type: "success",
  });

  useEffect(() => {
    setFilteredItems(filterMoodItems(moodItems, searchQuery, activeTag));
    setAllTagsFromItems(getAllTags(moodItems));
  }, [moodItems, searchQuery, activeTag]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const resetNewItemForm = () => {
    setNewMoodItem({ ...emptyMoodItemForm });
    setSocialUrl("");
    setIsProcessingUrl(false);
    setUrlProcessingProgress(0);
    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setNewTag("");
  };

  const resetEditForm = () => {
    setEditingItem(null);
    setEditForm({ ...emptyMoodItemForm });
    setEditIsUploading(false);
    setEditUploadProgress(0);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setEditNewTag("");
  };

  const handleSocialUrlChange = async (e: React.ChangeEvent<HTMLInputElement>, targetForm: "new" | "edit") => {
    const url = e.target.value;
    const setItemForm = targetForm === "new" ? setNewMoodItem : setEditForm;

    if (targetForm === "new") setSocialUrl(url);
    else setItemForm((prev) => ({ ...prev, embedUrl: url, imageUrl: "" }));

    const { isValid, type } = checkSocialMediaUrl(url);

    if (isValid && type) {
      try {
        setIsProcessingUrl(true);
        setUrlProcessingProgress(20);
        const embedData = await fetchEmbedData(url);
        setUrlProcessingProgress(60);

        const title = getEmbedTitle(embedData);
        const description = getEmbedDescription(embedData);
        const thumbnail = getEmbedThumbnail(embedData);
        setUrlProcessingProgress(80);

        setItemForm((prev) => ({
          ...prev,
          title: title || (targetForm === "edit" && editingItem?.title ? editingItem.title : "Social Post"),
          description: description || (targetForm === "edit" && editingItem?.description ? editingItem.description : ""),
          imageUrl: thumbnail || "",
          embedUrl: url,
          embedType: type,
          embedData: embedData,
        }));
        setUrlProcessingProgress(100);

        setTimeout(() => {
          if (targetForm === "new") setSocialUrl("");
          setIsProcessingUrl(false);
          setUrlProcessingProgress(0);
        }, 500);
      } catch (error) {
        console.error("Error processing social media URL:", error);
        showToast("Couldn't process that link", "error");
        setIsProcessingUrl(false);
        setUrlProcessingProgress(0);
      }
    } else if (url === "") {
      setItemForm((prev) => ({
        ...prev,
        embedUrl: undefined,
        embedType: undefined,
        embedData: null,
      }));
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, targetForm: "new" | "edit") => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const setUploading = targetForm === "new" ? setIsUploading : setEditIsUploading;
    const setProgress = targetForm === "new" ? setUploadProgress : setEditUploadProgress;
    const setItemForm = targetForm === "new" ? setNewMoodItem : setEditForm;
    const inputRef = targetForm === "new" ? fileInputRef : editFileInputRef;

    setUploading(true);
    setProgress(10);
    try {
      const file = files[0];
      if (!isFileSizeValid(file)) {
        showToast("Image is too large! (Max 5MB)", "error");
        setUploading(false);
        setProgress(0);
        return;
      }
      const dataUrl = await readFileAsDataURL(file);
      setProgress(80);
      setItemForm((prev) => ({ ...prev, imageUrl: dataUrl, embedUrl: undefined, embedType: undefined, embedData: null }));
      setProgress(100);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      console.error("File error:", error);
      showToast("Couldn't process image", "error");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isUploading || isProcessingUrl) {
      showToast("Please wait, still processing...", "error");
      return;
    }
    if (!newMoodItem.title.trim() || (!newMoodItem.imageUrl && !newMoodItem.embedUrl)) {
      showToast("Add a title and image or link!", "error");
      return;
    }
    try {
      await addMoodItem({
        imageUrl: newMoodItem.imageUrl,
        title: newMoodItem.title,
        description: newMoodItem.description || undefined,
        tags: newMoodItem.tags,
        color: newMoodItem.color || undefined,
        embedUrl: newMoodItem.embedUrl || undefined,
        embedType: newMoodItem.embedType || undefined,
        embedData: newMoodItem.embedData,
      });
      playSuccessAnimation();
      resetNewItemForm();
      setShowAddModal(false);
      showToast("Inspiration pinned! ✨");
    } catch (error) {
      console.error(error);
      showToast("Couldn't add inspiration", "error");
    }
  };

  const handleStartEdit = (item: MoodItem) => {
    setEditingItem(item);
    setEditForm({
      imageUrl: item.imageUrl || "",
      title: item.title,
      description: item.description || "",
      tags: [...item.tags],
      color: item.color || modernColors[0],
      embedUrl: item.embedUrl,
      embedType: item.embedType,
      embedData: item.embedData,
    });
    setShowAddModal(true);
    setLightboxItem(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (editIsUploading) {
      showToast("Image still uploading...", "error");
      return;
    }
    if (!editForm.title.trim() || (!editForm.imageUrl && !editForm.embedUrl)) {
      showToast("Title and image/link required!", "error");
      return;
    }
    try {
      await updateMoodItem({
        id: editingItem._id,
        imageUrl: editForm.imageUrl || undefined,
        title: editForm.title,
        description: editForm.description || undefined,
        tags: editForm.tags,
        color: editForm.color || undefined,
        embedUrl: editForm.embedUrl || undefined,
        embedType: editForm.embedType || undefined,
        embedData: editForm.embedData,
      });
      playSuccessAnimation();
      resetEditForm();
      setShowAddModal(false);
      showToast("Updated! 📝");
    } catch (error) {
      console.error(error);
      showToast("Couldn't update", "error");
    }
  };

  const handleDeleteItem = async () => {
    if (!showConfirmDelete) return;
    try {
      await removeMoodItem({ id: showConfirmDelete._id });
      playSuccessAnimation("delete");
      showToast("Removed from board 💨");
    } catch (error) {
      console.error(error);
      showToast("Couldn't remove", "error");
    } finally {
      setShowConfirmDelete(null);
    }
  };

  const handleAddTag = (formType: "new" | "edit") => {
    const tagVal = formType === "new" ? newTag : editNewTag;
    const setItemForm = formType === "new" ? setNewMoodItem : setEditForm;
    const setTagInput = formType === "new" ? setNewTag : setEditNewTag;

    if (tagVal.trim() === "") return;

    setItemForm((prev) => {
      if (!prev.tags.includes(tagVal.trim())) {
        return { ...prev, tags: [...prev.tags, tagVal.trim()] };
      }
      return prev;
    });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string, formType: "new" | "edit") => {
    const setItemForm = formType === "new" ? setNewMoodItem : setEditForm;
    setItemForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tagToRemove) }));
  };

  // Form component for reuse
  const FormFields = ({
    formState,
    onFormChange,
    formType,
    currentSocialUrl,
    onSocialUrlChange,
    onFileChange,
    inputRef,
    isCurrentUploading,
    uploadProg,
    tagInput,
    onTagInputChange,
    onAddTag,
    onRemoveTag,
  }: {
    formState: MoodItemForm;
    onFormChange: React.Dispatch<React.SetStateAction<MoodItemForm>>;
    formType: "new" | "edit";
    currentSocialUrl: string;
    onSocialUrlChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    inputRef: React.RefObject<HTMLInputElement | null>;
    isCurrentUploading: boolean;
    uploadProg: number;
    tagInput: string;
    onTagInputChange: (value: string) => void;
    onAddTag: () => void;
    onRemoveTag: (tag: string) => void;
  }) => (
    <div className="space-y-4">
      {/* Image/Link Section */}
      {formState.imageUrl ? (
        <div className="relative">
          <img
            src={formState.imageUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-2xl"
          />
          <button
            type="button"
            onClick={() => onFormChange((prev) => ({ ...prev, imageUrl: "" }))}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
      ) : formState.embedUrl ? (
        <div className="relative p-4 bg-gray-50 rounded-2xl">
          <SocialEmbed url={formState.embedUrl} embedType={formState.embedType || "link"} />
          <button
            type="button"
            onClick={() => onFormChange((prev) => ({ ...prev, embedUrl: undefined, embedType: undefined, embedData: null }))}
            className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste a Link (Pinterest, Twitter, Instagram)
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentSocialUrl}
                onChange={onSocialUrlChange}
                placeholder="https://..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                disabled={isProcessingUrl}
              />
              {isProcessingUrl && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                    style={{ width: `${urlProcessingProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* File Upload */}
          <div>
            <input
              type="file"
              ref={inputRef}
              onChange={onFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isCurrentUploading}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-rose-400 hover:text-rose-500 transition-colors flex flex-col items-center gap-2"
            >
              <span className="text-2xl">📷</span>
              <span className="text-sm font-medium">
                {isCurrentUploading ? `Uploading... ${uploadProg}%` : "Upload an Image"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={formState.title}
          onChange={(e) => onFormChange((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Give it a name..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <textarea
          value={formState.description}
          onChange={(e) => onFormChange((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="What inspires you about this?"
          rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
        <div className="flex flex-wrap gap-2">
          {modernColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onFormChange((prev) => ({ ...prev, color }))}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                formState.color === color ? "border-rose-500 scale-110" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        {formState.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {formState.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="w-4 h-4 flex items-center justify-center hover:bg-rose-200 rounded-full transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            placeholder="Add a tag..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all text-sm"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddTag();
              }
            }}
          />
          <button
            type="button"
            onClick={onAddTag}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-rose-100/50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                Our Inspiration Board
              </h1>
              <p className="text-sm text-gray-500 mt-1">Ideas & dreams we're collecting together 💭</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Add Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  resetNewItemForm();
                  setEditingItem(null);
                  setShowAddModal(true);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium shadow-lg shadow-rose-200 hover:shadow-xl transition-all flex items-center gap-2"
              >
                <span>📌</span>
                <span>Pin New Idea</span>
              </motion.button>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-40 sm:w-48 px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white/80"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>

              {/* Tag Filter */}
              <select
                value={activeTag}
                onChange={(e) => setActiveTag(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all bg-white/80"
              >
                <option value="">All Tags</option>
                {allTagsFromItems.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>

              {/* Layout Toggle */}
              <div className="flex items-center bg-white/80 border border-gray-200 rounded-xl p-1">
                <button
                  onClick={() => setLayout("masonry")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    layout === "masonry" ? "bg-rose-500 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  ▣
                </button>
                <button
                  onClick={() => setLayout("grid")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    layout === "grid" ? "bg-rose-500 text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  ▦
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Empty State */}
        {filteredItems.length === 0 && !showAddModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎨</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Start your inspiration collection!</h2>
            <p className="text-gray-500 mb-6">Pin ideas, images, and links that inspire you both</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetNewItemForm();
                setEditingItem(null);
                setShowAddModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              ✨ Add First Inspiration
            </motion.button>
          </motion.div>
        )}

        {/* Masonry/Grid Layout */}
        <div
          className={`${
            layout === "masonry"
              ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          }`}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                className={`${layout === "masonry" ? "break-inside-avoid" : ""} group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer`}
                style={{ backgroundColor: item.color || "#FEF3E7" }}
                onClick={() => setLightboxItem(item)}
              >
                {/* Decorative tape */}
                <div className="absolute -top-1 left-1/4 w-8 h-4 bg-gradient-to-r from-amber-200/80 to-yellow-200/80 rounded-b-sm transform -rotate-6 z-10 shadow-sm" />
                <div className="absolute -top-1 right-1/4 w-8 h-4 bg-gradient-to-r from-rose-200/80 to-pink-200/80 rounded-b-sm transform rotate-6 z-10 shadow-sm" />

                {/* Image/Embed */}
                {item.embedUrl && item.embedType ? (
                  <div className="p-3">
                    <SocialEmbed url={item.embedUrl} embedType={item.embedType} />
                  </div>
                ) : item.imageUrl ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      style={{ maxHeight: layout === "masonry" ? "400px" : "200px" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-4xl">📝</div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">{item.title}</h4>
                  {item.description && <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.description}</p>}

                  {/* Tags */}
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTag(tag);
                          }}
                          className="px-2 py-0.5 bg-white/60 text-gray-600 rounded-full text-xs hover:bg-white transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-white/40 text-gray-500 rounded-full text-xs">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-400">{formatDate(item.addedAt)}</p>
                </div>

                {/* Actions (visible on hover) */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(item);
                    }}
                    className="w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center text-sm transition-all"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirmDelete(item);
                    }}
                    className="w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-md flex items-center justify-center text-sm transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              resetNewItemForm();
              resetEditForm();
            }}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={editingItem ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-500 to-purple-500 px-6 py-4">
                <h3 className="text-xl font-semibold text-white">
                  {editingItem ? "✏️ Edit Inspiration" : "✨ Pin New Idea"}
                </h3>
                <p className="text-rose-100 text-sm">
                  {editingItem ? "Update your saved inspiration" : "Add something that inspires you both"}
                </p>
              </div>

              <div className="p-6">
                <FormFields
                  formState={editingItem ? editForm : newMoodItem}
                  onFormChange={editingItem ? setEditForm : setNewMoodItem}
                  formType={editingItem ? "edit" : "new"}
                  currentSocialUrl={editingItem ? (editForm.embedUrl || "") : socialUrl}
                  onSocialUrlChange={(e) => handleSocialUrlChange(e, editingItem ? "edit" : "new")}
                  onFileChange={(e) => handleFileChange(e, editingItem ? "edit" : "new")}
                  inputRef={editingItem ? editFileInputRef : fileInputRef}
                  isCurrentUploading={editingItem ? editIsUploading : isUploading}
                  uploadProg={editingItem ? editUploadProgress : uploadProgress}
                  tagInput={editingItem ? editNewTag : newTag}
                  onTagInputChange={editingItem ? setEditNewTag : setNewTag}
                  onAddTag={() => handleAddTag(editingItem ? "edit" : "new")}
                  onRemoveTag={(tag) => handleRemoveTag(tag, editingItem ? "edit" : "new")}
                />
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetNewItemForm();
                    resetEditForm();
                  }}
                  className="flex-1 px-4 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  {editingItem ? "Save Changes" : "Pin to Board ✨"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setLightboxItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: lightboxItem.color || "#FEF3E7" }}
            >
              {/* Close button */}
              <button
                onClick={() => setLightboxItem(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              >
                ✕
              </button>

              {/* Image/Embed */}
              {lightboxItem.embedUrl && lightboxItem.embedType ? (
                <div className="p-6">
                  <SocialEmbed url={lightboxItem.embedUrl} embedType={lightboxItem.embedType} />
                </div>
              ) : lightboxItem.imageUrl ? (
                <img
                  src={lightboxItem.imageUrl}
                  alt={lightboxItem.title}
                  className="w-full max-h-[60vh] object-contain"
                />
              ) : null}

              {/* Content */}
              <div className="p-6">
                <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">{lightboxItem.title}</h2>
                {lightboxItem.description && <p className="text-gray-600 mb-4">{lightboxItem.description}</p>}

                {/* Tags */}
                {lightboxItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {lightboxItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-white/60 text-gray-700 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-500 mb-4">Added {formatDate(lightboxItem.addedAt)}</p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStartEdit(lightboxItem)}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => {
                      setLightboxItem(null);
                      setShowConfirmDelete(lightboxItem);
                    }}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🗑️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Remove from Board?</h3>
                <p className="text-gray-600 mb-6">
                  Unpin "{showConfirmDelete.title}" from your inspiration board?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmDelete(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Keep It
                  </button>
                  <button
                    onClick={handleDeleteItem}
                    className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-full shadow-lg font-medium ${
              toast.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
