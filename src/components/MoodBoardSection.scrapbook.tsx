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
import { motion, AnimatePresence } from "framer-motion";

const pinColors = [
  "from-red-400 to-red-600",
  "from-pink-400 to-pink-600",
  "from-amber-400 to-amber-600",
  "from-teal-400 to-teal-600",
  "from-purple-400 to-purple-600",
];

const tapeRotations = [-8, -3, 2, 5, -5, 4, -2, 7];
const cardRotations = [-3, 2, -2, 3, -1, 2, -4, 1];

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
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<MoodItem | null>(null);

  const [newTag, setNewTag] = useState("");
  const [editNewTag, setEditNewTag] = useState("");

  const [editingItem, setEditingItem] = useState<MoodItem | null>(null);
  const [editForm, setEditForm] = useState<MoodItemForm>({ ...emptyMoodItemForm });
  const [viewingItem, setViewingItem] = useState<MoodItem | null>(null);

  useEffect(() => {
    setFilteredItems(filterMoodItems(moodItems, searchQuery, activeTag));
    setAllTags(getAllTags(moodItems));
  }, [moodItems, searchQuery, activeTag]);

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

  const handleSocialUrlChange = async (e: React.ChangeEvent<HTMLInputElement>, targetForm: 'new' | 'edit') => {
    const url = e.target.value;
    const setItemForm = targetForm === 'new' ? setNewMoodItem : setEditForm;

    if (targetForm === 'new') setSocialUrl(url);
    else setItemForm(prev => ({ ...prev, embedUrl: url, imageUrl: "" }));

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

        setItemForm(prev => ({
          ...prev,
          title: title || "Social Post",
          description: description || "",
          imageUrl: thumbnail || "",
          embedUrl: url,
          embedType: type,
          embedData: embedData,
        }));
        setUrlProcessingProgress(100);

        setTimeout(() => {
          if (targetForm === 'new') setSocialUrl("");
          setIsProcessingUrl(false);
          setUrlProcessingProgress(0);
        }, 500);
      } catch (error) {
        console.error('Error processing URL:', error);
        setIsProcessingUrl(false);
        setUrlProcessingProgress(0);
      }
    } else if (url === "") {
      setItemForm(prev => ({
        ...prev,
        embedUrl: undefined,
        embedType: undefined,
        embedData: null,
      }));
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, targetForm: 'new' | 'edit') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const setUploading = targetForm === 'new' ? setIsUploading : setEditIsUploading;
    const setProgress = targetForm === 'new' ? setUploadProgress : setEditUploadProgress;
    const setItemForm = targetForm === 'new' ? setNewMoodItem : setEditForm;
    const inputRef = targetForm === 'new' ? fileInputRef : editFileInputRef;

    setUploading(true);
    setProgress(10);
    try {
      const file = files[0];
      if (!isFileSizeValid(file)) {
        alert("Image too large! Max 5MB");
        setUploading(false);
        setProgress(0);
        return;
      }
      const dataUrl = await readFileAsDataURL(file);
      setProgress(80);
      setItemForm(prev => ({ ...prev, imageUrl: dataUrl, embedUrl: undefined, embedType: undefined, embedData: null }));
      setProgress(100);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      console.error("File error:", error);
      alert("Couldn't load that image!");
    } finally {
      setTimeout(() => { setUploading(false); setProgress(0); }, 500);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isUploading || isProcessingUrl) return;
    if (!newMoodItem.title.trim() || (!newMoodItem.imageUrl && !newMoodItem.embedUrl)) {
      alert("Need a title and an image or link!");
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
    } catch (error) {
      console.error(error);
      alert("Couldn't add that item!");
    }
  };

  const handleStartEdit = (item: MoodItem) => {
    setEditingItem(item);
    setEditForm({
      imageUrl: item.imageUrl || "",
      title: item.title,
      description: item.description || "",
      tags: [...item.tags],
      color: item.color || defaultColors[0],
      embedUrl: item.embedUrl,
      embedType: item.embedType,
      embedData: item.embedData
    });
    setViewingItem(null);
    setShowAddModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || editIsUploading) return;
    if (!editForm.title.trim() || (!editForm.imageUrl && !editForm.embedUrl)) {
      alert("Need a title and an image or link!");
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
        embedData: editForm.embedData
      });
      playSuccessAnimation();
      resetEditForm();
      setShowAddModal(false);
    } catch (error) {
      console.error(error);
      alert("Couldn't update that item!");
    }
  };

  const handleDeleteItem = async () => {
    if (!showDeleteConfirm) return;
    try {
      await removeMoodItem({ id: showDeleteConfirm._id });
      playSuccessAnimation("delete");
    } catch (error) {
      console.error(error);
      alert("Couldn't delete that item!");
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleAddTag = (formType: 'new' | 'edit') => {
    const tagVal = formType === 'new' ? newTag : editNewTag;
    const setItemForm = formType === 'new' ? setNewMoodItem : setEditForm;
    const setTagInput = formType === 'new' ? setNewTag : setEditNewTag;

    if (tagVal.trim() === "") return;
    setItemForm(prev => {
      if (!prev.tags.includes(tagVal.trim())) {
        return { ...prev, tags: [...prev.tags, tagVal.trim()] };
      }
      return prev;
    });
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string, formType: 'new' | 'edit') => {
    const setItemForm = formType === 'new' ? setNewMoodItem : setEditForm;
    setItemForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  return (
    <div className="space-y-6">
      {/* Header - Corkboard style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#fdf6e3] p-6 shadow-xl relative overflow-hidden"
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        {/* Decorative tape */}
        <div className="absolute -top-2 left-12 w-24 h-6 bg-gradient-to-r from-teal-300 to-teal-200 opacity-80" style={{ transform: 'rotate(-5deg)' }} />
        <div className="absolute -top-2 right-16 w-20 h-6 bg-gradient-to-r from-pink-200 to-rose-200 opacity-80" style={{ transform: 'rotate(8deg)' }} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 
              className="text-3xl sm:text-4xl text-gray-800 flex items-center gap-3"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              <span className="text-4xl">📌</span>
              Our Inspiration Board
            </h2>
            <p 
              className="text-amber-700 mt-1"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Pinning dreams, ideas & things we love 💕
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { resetNewItemForm(); setEditingItem(null); setShowAddModal(true); }}
            className="px-6 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-white rounded-full shadow-lg self-start"
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', boxShadow: '0 4px 0 #0d9488' }}
          >
            📌 Pin Something
          </motion.button>
        </div>

        {/* Search and filter */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search our pins..."
              className="w-full px-4 py-2 bg-white/80 border-2 border-dashed border-amber-200 rounded-lg outline-none focus:border-teal-300"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setActiveTag("")}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  activeTag === "" 
                    ? 'bg-amber-400 text-white shadow' 
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                All
              </button>
              {allTags.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    activeTag === tag 
                      ? 'bg-teal-400 text-white shadow' 
                      : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                  }`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item count */}
        <div className="mt-3">
          <span 
            className="inline-block bg-amber-100 px-4 py-2 rounded-full shadow-sm"
            style={{ fontFamily: "'Patrick Hand', cursive", transform: 'rotate(-1deg)' }}
          >
            📌 {filteredItems.length} pins on our board
          </span>
        </div>
      </motion.div>

      {/* Corkboard */}
      {filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div 
            className="bg-white p-8 max-w-sm mx-auto shadow-lg relative"
            style={{ transform: 'rotate(-2deg)' }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-md border-2 border-red-300" />
            </div>
            <span className="text-6xl block mb-4">✨</span>
            <p 
              className="text-gray-600 text-lg"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              Our board is waiting for its first pin!
            </p>
            <button
              onClick={() => { resetNewItemForm(); setEditingItem(null); setShowAddModal(true); }}
              className="mt-4 px-6 py-2 bg-teal-400 text-white rounded-full"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Add First Pin 📌
            </button>
          </div>
        </motion.div>
      ) : (
        <div 
          className="p-6 rounded-lg min-h-[400px]"
          style={{ 
            background: '#8b7355',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%239C8B75\' fill-opacity=\'0.5\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")'
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, scale: 0.8, rotate: cardRotations[index % cardRotations.length] }}
                animate={{ opacity: 1, scale: 1, rotate: cardRotations[index % cardRotations.length] }}
                whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setViewingItem(item)}
                className="cursor-pointer relative group"
              >
                {/* Pushpin */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${pinColors[index % pinColors.length]} shadow-md border-2 border-white/50`} />
                  <div className="w-1 h-2 bg-gray-400 mx-auto -mt-1" />
                </div>

                {/* Card */}
                <div 
                  className="bg-white p-2 shadow-lg"
                  style={{ backgroundColor: item.color || '#fff' }}
                >
                  {/* Image/Content */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {item.embedUrl && item.embedType ? (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                        <span className="text-3xl">🔗</span>
                      </div>
                    ) : item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-pink-50">
                        <span className="text-3xl">📝</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="mt-2">
                    <p 
                      className="text-sm text-gray-800 line-clamp-2"
                      style={{ fontFamily: "'Caveat', cursive", fontSize: '16px' }}
                    >
                      {item.title}
                    </p>
                    {item.tags.length > 0 && (
                      <p className="text-xs text-teal-600 mt-1">
                        #{item.tags[0]}
                        {item.tags.length > 1 && ` +${item.tags.length - 1}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 top-4 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-2xl">👁️</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
            onClick={() => { setShowAddModal(false); resetNewItemForm(); resetEditForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: -1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#fdf6e3] p-6 shadow-2xl relative my-8"
            >
              {/* Washi tape */}
              <div className="absolute -top-3 left-12 w-20 h-5 bg-gradient-to-r from-teal-300 to-teal-200 opacity-80" style={{ transform: 'rotate(-3deg)' }} />
              <div className="absolute -top-3 right-12 w-16 h-5 bg-gradient-to-r from-pink-300 to-rose-200 opacity-80" style={{ transform: 'rotate(5deg)' }} />

              <form onSubmit={editingItem ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleSubmit}>
                <h3 
                  className="text-2xl text-gray-800 mb-6"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {editingItem ? "✏️ Edit This Pin" : "📌 Pin Something New"}
                </h3>

                {/* Image/Link Section */}
                {!(editingItem ? editForm : newMoodItem).imageUrl && (
                  <div className="mb-4">
                    <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                      🔗 Paste a link (Pinterest, Twitter, etc.)
                    </label>
                    <input
                      type="text"
                      value={editingItem ? (editForm.embedUrl || "") : socialUrl}
                      onChange={(e) => handleSocialUrlChange(e, editingItem ? 'edit' : 'new')}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-white/80 border-2 border-dashed border-amber-200 rounded-lg outline-none focus:border-teal-300"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                      disabled={isProcessingUrl}
                    />
                    {isProcessingUrl && (
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-400 transition-all" style={{ width: `${urlProcessingProgress}%` }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Preview */}
                {(editingItem ? editForm : newMoodItem).embedUrl && !(editingItem ? editForm : newMoodItem).imageUrl ? (
                  <div className="mb-4 p-3 bg-white rounded-lg">
                    <SocialEmbed url={(editingItem ? editForm : newMoodItem).embedUrl!} embedType={(editingItem ? editForm : newMoodItem).embedType || "link"} />
                    <button
                      type="button"
                      onClick={() => (editingItem ? setEditForm : setNewMoodItem)(prev => ({ ...prev, embedUrl: undefined, embedType: undefined, embedData: null }))}
                      className="mt-2 text-red-500 text-sm"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      × Clear link
                    </button>
                  </div>
                ) : (editingItem ? editForm : newMoodItem).imageUrl ? (
                  <div className="mb-4 p-3 bg-white rounded-lg">
                    <img src={(editingItem ? editForm : newMoodItem).imageUrl} alt="Preview" className="max-h-48 mx-auto rounded" />
                    <button
                      type="button"
                      onClick={() => (editingItem ? setEditForm : setNewMoodItem)(prev => ({ ...prev, imageUrl: "" }))}
                      className="mt-2 text-red-500 text-sm block mx-auto"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      × Clear image
                    </button>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                      🖼️ Or upload an image
                    </label>
                    <input
                      type="file"
                      ref={editingItem ? editFileInputRef : fileInputRef}
                      onChange={(e) => handleFileChange(e, editingItem ? 'edit' : 'new')}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => (editingItem ? editFileInputRef : fileInputRef).current?.click()}
                      disabled={isUploading || editIsUploading}
                      className="w-full py-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      {(editingItem ? editIsUploading : isUploading) 
                        ? `Uploading... ${(editingItem ? editUploadProgress : uploadProgress)}%` 
                        : "Choose Image"}
                    </button>
                  </div>
                )}

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    🏷️ Title
                  </label>
                  <input
                    type="text"
                    value={(editingItem ? editForm : newMoodItem).title}
                    onChange={(e) => (editingItem ? setEditForm : setNewMoodItem)(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What's this about?"
                    className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 outline-none focus:border-teal-400"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    📝 Notes (optional)
                  </label>
                  <textarea
                    value={(editingItem ? editForm : newMoodItem).description}
                    onChange={(e) => (editingItem ? setEditForm : setNewMoodItem)(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Why do we love this?"
                    rows={2}
                    className="w-full px-4 py-3 bg-white/80 border-2 border-dashed border-amber-200 rounded-lg outline-none focus:border-teal-300 resize-none"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  />
                </div>

                {/* Color */}
                <div className="mb-4">
                  <label className="block text-amber-700 text-sm mb-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    🎨 Card color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => (editingItem ? setEditForm : setNewMoodItem)(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          (editingItem ? editForm : newMoodItem).color === color 
                            ? 'border-gray-800 scale-110' 
                            : 'border-white'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-6">
                  <label className="block text-amber-700 text-sm mb-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                    🔖 Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingItem ? editForm : newMoodItem).tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm flex items-center gap-1"
                        style={{ fontFamily: "'Patrick Hand', cursive" }}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag, editingItem ? 'edit' : 'new')}
                          className="text-teal-500 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingItem ? editNewTag : newTag}
                      onChange={(e) => (editingItem ? setEditNewTag : setNewTag)(e.target.value)}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-2 bg-white/80 border-b border-amber-200 outline-none text-sm"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(editingItem ? 'edit' : 'new');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(editingItem ? 'edit' : 'new')}
                      className="px-4 py-2 bg-teal-100 text-teal-700 rounded-lg text-sm"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetNewItemForm(); resetEditForm(); }}
                    className="flex-1 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-white rounded-lg shadow-md"
                    style={{ fontFamily: "'Patrick Hand', cursive", boxShadow: '0 3px 0 #0d9488' }}
                  >
                    {editingItem ? "Save Changes" : "Pin It! 📌"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Item Modal */}
      <AnimatePresence>
        {viewingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setViewingItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white shadow-2xl relative overflow-hidden"
              style={{ backgroundColor: viewingItem.color || '#fff' }}
            >
              {/* Pushpin */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-md border-2 border-red-300" />
                <div className="w-1.5 h-3 bg-gray-400 mx-auto -mt-1" />
              </div>

              {/* Content */}
              <div className="p-4 pt-8">
                {viewingItem.embedUrl && viewingItem.embedType ? (
                  <div className="mb-4">
                    <SocialEmbed url={viewingItem.embedUrl} embedType={viewingItem.embedType} />
                  </div>
                ) : viewingItem.imageUrl ? (
                  <img
                    src={viewingItem.imageUrl}
                    alt={viewingItem.title}
                    className="w-full max-h-80 object-contain mb-4"
                  />
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-amber-50 to-pink-50 flex items-center justify-center mb-4">
                    <span className="text-6xl">📝</span>
                  </div>
                )}

                <h2 
                  className="text-2xl text-gray-800 mb-2"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {viewingItem.title}
                </h2>

                {viewingItem.description && (
                  <p 
                    className="text-gray-600 mb-4"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    {viewingItem.description}
                  </p>
                )}

                {viewingItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {viewingItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
                        style={{ fontFamily: "'Patrick Hand', cursive" }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <p 
                  className="text-gray-400 text-sm mb-4"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Pinned on {formatDate(viewingItem.addedAt)}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleStartEdit(viewingItem)}
                    className="flex-1 py-2 bg-amber-100 text-amber-700 rounded-lg"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(viewingItem); setViewingItem(null); }}
                    className="flex-1 py-2 bg-red-100 text-red-600 rounded-lg"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setViewingItem(null)}
                className="absolute top-8 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow text-gray-500 hover:text-gray-700"
              >
                ×
              </button>

              {/* Decorative */}
              <span className="absolute bottom-2 right-4 text-2xl">✨</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#fdf6e3] p-6 shadow-2xl"
              style={{ transform: 'rotate(-1deg)' }}
            >
              <h3 
                className="text-xl text-gray-800 mb-4"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                Unpin "{showDeleteConfirm.title}"?
              </h3>
              <p 
                className="text-gray-600 mb-6"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                This will remove it from our board forever 😢
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Keep It
                </button>
                <button
                  onClick={handleDeleteItem}
                  className="flex-1 py-2 bg-red-400 text-white rounded-lg"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
      `}</style>
    </div>
  );
}
