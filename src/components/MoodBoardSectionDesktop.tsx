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

// Props interface for renderFormFields for better type checking
interface RenderFormFieldsProps {
  formState: MoodItemForm;
  onFormChange: React.Dispatch<React.SetStateAction<MoodItemForm>>;
  onFileChangeHandler: (e: ChangeEvent<HTMLInputElement>) => void;
  onSocialUrlChangeHandler: (e: ChangeEvent<HTMLInputElement>) => void;
  currentFileInputRef: React.RefObject<HTMLInputElement | null>; // Corrected type
  currentSocialUrl: string;
  isCurrentUploading: boolean;
  currentUploadProg: number;
  isCurrentProcessingUrl: boolean;
  currentUrlProg: number;
  formType: 'new' | 'edit';
  // Added for tag handling consistency
  newTagState: string;
  onNewTagChange: (value: string) => void;
  onAddTagHandler: () => void;
  onRemoveTagHandler: (tagToRemove: string) => void;
}


export default function MoodBoardSectionDesktop() {
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

  const [socialUrl, setSocialUrl] = useState(""); // For new item social URL input
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [urlProcessingProgress, setUrlProcessingProgress] = useState(0);

  const [showAddFormModal, setShowAddFormModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [filteredItems, setFilteredItems] = useState<MoodItem[]>([]);
  const [allTagsFromItems, setAllTagsFromItems] = useState<string[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<MoodItem | null>(null);
  const [layout, setLayout] = useState<"grid" | "masonry">("masonry");
  
  const [newTag, setNewTag] = useState(""); // Tag input for new item form
  const [editNewTag, setEditNewTag] = useState(""); // Tag input for edit form

  const [editingItem, setEditingItem] = useState<MoodItem | null>(null);
  const [editForm, setEditForm] = useState<MoodItemForm>({ ...emptyMoodItemForm });

  const [hoveredItem, setHoveredItem] = useState<Id<"moodboard"> | null>(null); // Added missing state


  useEffect(() => {
    setFilteredItems(filterMoodItems(moodItems, searchQuery, activeTag));
    setAllTagsFromItems(getAllTags(moodItems));
  }, [moodItems, searchQuery, activeTag]);

  const resetNewItemForm = () => {
    setNewMoodItem({ ...emptyMoodItemForm });
    setSocialUrl("");
    setIsProcessingUrl(false); setUrlProcessingProgress(0);
    setIsUploading(false); setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setNewTag("");
  }

  const resetEditForm = () => {
    setEditingItem(null);
    setEditForm({ ...emptyMoodItemForm });
    setEditIsUploading(false); setEditUploadProgress(0);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
    setEditNewTag("");
  }

  const handleSocialUrlChange = async (e: React.ChangeEvent<HTMLInputElement>, targetForm: 'new' | 'edit') => {
    const url = e.target.value;
    const setItemForm = targetForm === 'new' ? setNewMoodItem : setEditForm;
    const setIsProcessing = targetForm === 'new' ? setIsProcessingUrl : () => {}; 
    const setProcessingProgress = targetForm === 'new' ? setUrlProcessingProgress : () => {};

    if (targetForm === 'new') setSocialUrl(url);
    else setItemForm(prev => ({ ...prev, embedUrl: url, imageUrl: "" })); // Clear image if URL is typed for edit

    const { isValid, type } = checkSocialMediaUrl(url);

    if (isValid && type) {
      try {
        setIsProcessing(true); setProcessingProgress(20);
        const embedData = await fetchEmbedData(url);
        setProcessingProgress(60);

        const title = getEmbedTitle(embedData);
        const description = getEmbedDescription(embedData);
        const thumbnail = getEmbedThumbnail(embedData);
        setProcessingProgress(80);

        setItemForm(prev => ({
          ...prev,
          title: title || (targetForm === 'edit' && editingItem?.title ? editingItem.title : "Social Post"),
          description: description || (targetForm === 'edit' && editingItem?.description ? editingItem.description : ""),
          imageUrl: thumbnail || "", // Prefer thumbnail, clear if not available
          embedUrl: url,
          embedType: type,
          embedData: embedData,
        }));
        setProcessingProgress(100);

        setTimeout(() => {
          if (targetForm === 'new') setSocialUrl(""); // Clear input only for new form after processing
          setIsProcessing(false); setProcessingProgress(0);
        }, 500);
      } catch (error) {
        console.error('Error processing social media URL:', error);
        alert('Failed to process that link. Maybe try another one?');
        setIsProcessing(false); setProcessingProgress(0);
      }
    } else if (url === "") { // If URL is cleared
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

    setUploading(true); setProgress(10);
    try {
      const file = files[0];
      if (!isFileSizeValid(file)) {
        alert("That picture is a bit too chunky! (Max 5MB)");
        setUploading(false); setProgress(0); return;
      }
      const dataUrl = await readFileAsDataURL(file);
      setProgress(80);
      setItemForm(prev => ({ ...prev, imageUrl: dataUrl, embedUrl: undefined, embedType: undefined, embedData: null }));
      setProgress(100);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      console.error("File error:", error); alert("Couldn't grab that image!");
    } finally { setTimeout(() => { setUploading(false); setProgress(0); }, 500); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isUploading || isProcessingUrl) { alert("Hold your horses! Still working on the current item."); return; }
    if (!newMoodItem.title.trim() || (!newMoodItem.imageUrl && !newMoodItem.embedUrl)) {
      alert("Every masterpiece needs a title and a picture (or a link)!"); return;
    }
    try {
      // Corrected: Remove addedAt, server will handle it
      await addMoodItem({
        imageUrl: newMoodItem.imageUrl, // This will be empty if embedUrl is used, or dataUrl if image uploaded
        title: newMoodItem.title,
        description: newMoodItem.description || undefined,
        tags: newMoodItem.tags,
        color: newMoodItem.color || undefined,
        embedUrl: newMoodItem.embedUrl || undefined,
        embedType: newMoodItem.embedType || undefined,
        embedData: newMoodItem.embedData,
        // addedAt: Date.now() // REMOVED
      });
      playSuccessAnimation();
      resetNewItemForm();
      setShowAddFormModal(false);
    } catch (error) { console.error(error); alert("Oh no! Couldn't pin that to the board."); }
  };

  const handleStartEdit = (item: MoodItem) => {
    setEditingItem(item);
    setEditForm({
      imageUrl: item.imageUrl || "", // Ensure imageUrl is always string
      title: item.title,
      description: item.description || "",
      tags: [...item.tags],
      color: item.color || defaultColors[0],
      embedUrl: item.embedUrl,
      embedType: item.embedType,
      embedData: item.embedData
    });
    setShowAddFormModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (editIsUploading) { alert("Image still uploading for this edit!"); return; }
    if (!editForm.title.trim() || (!editForm.imageUrl && !editForm.embedUrl)) {
      alert("Title and an image/link are needed, even for edits!"); return;
    }
    try {
      await updateMoodItem({ 
        id: editingItem._id, 
        imageUrl: editForm.imageUrl || undefined, // Ensure it's optional if empty
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
      setShowAddFormModal(false);
    } catch (error) { console.error(error); alert("Couldn't update this lovely scrap!"); }
  };

  const handleDeleteItem = async () => {
    if (!showConfirmDelete) return;
    try {
      await removeMoodItem({ id: showConfirmDelete._id });
      playSuccessAnimation("delete");
    } catch (error) { console.error(error); alert("This scrap is stuck! Couldn't delete.");
    } finally { setShowConfirmDelete(null); }
  };

  const handleAddTagForForm = (formType: 'new' | 'edit') => {
    const tagVal = formType === 'new' ? newTag : editNewTag;
    const setItemForm = formType === 'new' ? setNewMoodItem : setEditForm;
    const setTagInput = formType === 'new' ? setNewTag : setEditNewTag;

    if (tagVal.trim() === "") return;
    
    setItemForm(prev => {
        if (!prev.tags.includes(tagVal.trim())) {
            return {...prev, tags: [...prev.tags, tagVal.trim()]};
        }
        return prev;
    });
    setTagInput("");
  };

  const handleRemoveTagFromForm = (tagToRemove: string, formType: 'new' | 'edit') => {
    const setItemForm = formType === 'new' ? setNewMoodItem : setEditForm;
    setItemForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };


  const RenderFormFields: React.FC<RenderFormFieldsProps> = ({
    formState, onFormChange, onFileChangeHandler, onSocialUrlChangeHandler,
    currentFileInputRef, currentSocialUrl, isCurrentUploading, currentUploadProg,
    isCurrentProcessingUrl, currentUrlProg, formType,
    newTagState, onNewTagChange, onAddTagHandler, onRemoveTagHandler
  }) => (
    <>
      {!formState.imageUrl && (
        <div className="moodboard-form-field-cute">
          <label htmlFor={`${formType}SocialUrl`}>🔗 Paste a Link (Pinterest, Twitter, Instagram):</label>
          <input
            id={`${formType}SocialUrl`} type="text"
            value={formType === 'new' ? currentSocialUrl : formState.embedUrl || ""}
            onChange={onSocialUrlChangeHandler}
            placeholder="e.g., https://pinterest.com/pin/..."
            className="moodboard-input-cute"
            disabled={isCurrentProcessingUrl || !!formState.imageUrl}
          />
          {isCurrentProcessingUrl && <div className="moodboard-progress-bar-cute" style={{ width: `${currentUrlProg}%` }} />}
        </div>
      )}

      {formState.embedUrl && !formState.imageUrl ? (
        <div className="moodboard-form-field-cute moodboard-embed-preview-cute">
          <label>🔗 Link Preview:</label>
          <SocialEmbed url={formState.embedUrl} embedType={formState.embedType || "link"} />
          <button type="button" onClick={() => onFormChange(prev => ({ ...prev, embedUrl: undefined, embedType: undefined, embedData: null, title: (formType === 'edit' && editingItem?.title) || "", description: (formType === 'edit' && editingItem?.description) || "" }))} className="moodboard-remove-item-btn-cute">X Clear Link</button>
        </div>
      ) : formState.imageUrl ? (
        <div className="moodboard-form-field-cute moodboard-image-preview-cute">
          <label>🖼️ Image Preview:</label>
          <img src={formState.imageUrl} alt="Preview" />
          <button type="button" onClick={() => onFormChange(prev => ({ ...prev, imageUrl: "", title: (formType === 'edit' && editingItem?.title) || "", description: (formType === 'edit' && editingItem?.description) || "" }))} className="moodboard-remove-item-btn-cute">X Clear Image</button>
        </div>
      ) : (
        <div className="moodboard-form-field-cute">
          <label htmlFor={`${formType}FileInput`}>🖼️ Or Upload an Image:</label>
          <input id={`${formType}FileInput`} type="file" ref={currentFileInputRef} onChange={onFileChangeHandler} accept="image/*" className="moodboard-file-input-cute" />
          <button type="button" onClick={() => currentFileInputRef.current?.click()} disabled={isCurrentUploading} className="moodboard-button-cute choose-file">
            {isCurrentUploading ? `Uploading... ${currentUploadProg}%` : "Choose Image"}
          </button>
          {isCurrentUploading && <div className="moodboard-progress-bar-cute" style={{ width: `${currentUploadProg}%` }} />}
        </div>
      )}

      <div className="moodboard-form-field-cute">
        <label htmlFor={`${formType}Title`}>🏷️ Title:</label>
        <input id={`${formType}Title`} type="text" value={formState.title} onChange={e => onFormChange(prev => ({ ...prev, title: e.target.value }))} placeholder="My Awesome Idea" className="moodboard-input-cute" required />
      </div>
      <div className="moodboard-form-field-cute">
        <label htmlFor={`${formType}Description`}>📝 Description (Optional):</label>
        <textarea id={`${formType}Description`} value={formState.description} onChange={e => onFormChange(prev => ({ ...prev, description: e.target.value }))} placeholder="A little note about this..." className="moodboard-textarea-cute" rows={3} />
      </div>
      <div className="moodboard-form-field-cute">
        <label>🎨 Background Color:</label>
        <div className="moodboard-color-palette-cute">
          {defaultColors.map(color => (
            <button key={color} type="button" onClick={() => onFormChange(prev => ({ ...prev, color }))}
              className={`moodboard-color-swatch-cute ${formState.color === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }} title={color} />
          ))}
        </div>
      </div>
      <div className="moodboard-form-field-cute">
        <label>🔖 Tags:</label>
        <div className="moodboard-tags-display-cute">
          {formState.tags.map(tag => (
            <span key={tag} className="moodboard-tag-item-cute">{tag} <button type="button" onClick={() => onRemoveTagHandler(tag)}>x</button></span>
          ))}
        </div>
        <div className="moodboard-tag-input-area-cute">
          <input type="text" value={newTagState} onChange={e => onNewTagChange(e.target.value)} placeholder="Add a tag"
            className="moodboard-input-cute small"
            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddTagHandler(); } }} />
          <button type="button" onClick={onAddTagHandler} className="moodboard-button-cute add-tag small">Add Tag</button>
        </div>
      </div>
    </>
  );


  return (
    <div className="moodboard-section-desktop-scrapbook">
      <header className="moodboard-toolbar-cute">
        <h2>Our Inspiration Nook 💭💖</h2>
        <div className="moodboard-toolbar-actions-cute">
          <button onClick={() => { resetNewItemForm(); setEditingItem(null); setShowAddFormModal(true); }} className="moodboard-button-cute add-scrap">
            📌 Add New Scrap
          </button>
          <div className="moodboard-filter-group-cute">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Search scraps..." className="moodboard-input-cute search" />
            <select onChange={e => setActiveTag(e.target.value)} value={activeTag} className="moodboard-select-cute">
              <option value="">All Tags</option>
              {allTagsFromItems.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
            </select>
          </div>
          <div className="moodboard-layout-toggle-cute">
            <span>Layout:</span>
            <button onClick={() => setLayout("masonry")} className={layout === "masonry" ? "active" : ""}>Overlap</button>
            <button onClick={() => setLayout("grid")} className={layout === "grid" ? "active" : ""}>Grid Type</button>
          </div>
        </div>
      </header>

      {showAddFormModal && (
        <div className="moodboard-modal-overlay-cute" onClick={() => { setShowAddFormModal(false); resetNewItemForm(); resetEditForm(); }}>
          <form
            className="moodboard-form-modal-cute"
            onSubmit={editingItem ? (e) => { e.preventDefault(); handleSaveEdit(); } : handleSubmit}
            onClick={e => e.stopPropagation()}
          >
            <h3>{editingItem ? "✂️ Edit This Scrap" : "✨ Pin a New Idea!"}</h3>
            {editingItem ?
              <RenderFormFields
                formState={editForm} onFormChange={setEditForm}
                onFileChangeHandler={(e) => handleFileChange(e, 'edit')}
                onSocialUrlChangeHandler={(e) => handleSocialUrlChange(e, 'edit')}
                currentFileInputRef={editFileInputRef}
                currentSocialUrl={editForm.embedUrl || ""} // Pass existing embedUrl for edit
                isCurrentUploading={editIsUploading} currentUploadProg={editUploadProgress}
                isCurrentProcessingUrl={false} currentUrlProg={0} // Assuming no separate URL processing state for edit
                formType='edit'
                newTagState={editNewTag} onNewTagChange={setEditNewTag}
                onAddTagHandler={() => handleAddTagForForm('edit')}
                onRemoveTagHandler={(tag) => handleRemoveTagFromForm(tag, 'edit')}
              /> :
              <RenderFormFields
                formState={newMoodItem} onFormChange={setNewMoodItem}
                onFileChangeHandler={(e) => handleFileChange(e, 'new')}
                onSocialUrlChangeHandler={(e) => handleSocialUrlChange(e, 'new')}
                currentFileInputRef={fileInputRef}
                currentSocialUrl={socialUrl}
                isCurrentUploading={isUploading} currentUploadProg={uploadProgress}
                isCurrentProcessingUrl={isProcessingUrl} currentUrlProg={urlProcessingProgress}
                formType='new'
                newTagState={newTag} onNewTagChange={setNewTag}
                onAddTagHandler={() => handleAddTagForForm('new')}
                onRemoveTagHandler={(tag) => handleRemoveTagFromForm(tag, 'new')}
              />
            }
            <div className="moodboard-form-actions-cute">
              <button type="button" onClick={() => { setShowAddFormModal(false); resetNewItemForm(); resetEditForm(); }} className="moodboard-button-cute cancel">Cancel</button>
              <button type="submit" className="moodboard-button-cute save">{editingItem ? "Save Changes" : "Pin to Board!"}</button>
            </div>
          </form>
        </div>
      )}

      {filteredItems.length === 0 && !showAddFormModal && (
        <div className="moodboard-empty-state-cute">
          <span>🎨</span>
          <p>Our inspiration board is looking for its first spark!</p>
          <button onClick={() => { resetNewItemForm(); setEditingItem(null); setShowAddFormModal(true); }} className="moodboard-button-cute add-scrap">
            ✨ Add First Inspiration!
          </button>
        </div>
      )}

      <div className={`moodboard-items-container-cute ${layout === "masonry" ? "masonry" : "grid"}`}>
        {filteredItems.map((item, index) => (
          <div
            key={item._id}
            className="moodboard-item-scrap-cute"
            style={{ backgroundColor: item.color || 'var(--cute-bg-tertiary)', '--animation-delay': `${index * 0.05}s` } as React.CSSProperties}
            onMouseEnter={() => setHoveredItem(item._id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <div className="moodboard-item-tape-cute top-left"></div>
            <div className="moodboard-item-tape-cute top-right"></div>

            {item.embedUrl && item.embedType ? (
              <div className="moodboard-item-embed-wrapper-cute">
                <SocialEmbed url={item.embedUrl} embedType={item.embedType} />
              </div>
            ) : item.imageUrl ? (
              <div className="moodboard-item-image-wrapper-cute">
                <img src={item.imageUrl} alt={item.title} className="moodboard-item-image-cute" />
              </div>
            ) : (
              <div className="moodboard-item-placeholder-cute">📝</div>
            )}
            <div className="moodboard-item-content-cute">
              <h4 className="moodboard-item-title-cute">{item.title}</h4>
              {item.description && <p className="moodboard-item-description-cute">{item.description}</p>}
              {item.tags.length > 0 && (
                <div className="moodboard-item-tags-cute">
                  {item.tags.slice(0, 3).map(tag => <span key={tag} className="moodboard-tag-item-cute small" onClick={(e) => { e.stopPropagation(); setActiveTag(tag); }}>#{tag}</span>)}
                  {item.tags.length > 3 && <span className="moodboard-tag-item-cute small more">+{item.tags.length - 3} more</span>}
                </div>
              )}
            </div>
            <div className="moodboard-item-actions-cute">
              <button onClick={() => handleStartEdit(item)} title="Edit Scrap">✏️</button>
              <button onClick={() => setShowConfirmDelete(item)} title="Remove Scrap">🗑️</button>
            </div>
            <div className="moodboard-item-date-cute">Added: {formatDate(item.addedAt)}</div>
          </div>
        ))}
      </div>

      {showConfirmDelete && (
        <div className="moodboard-modal-overlay-cute" onClick={() => setShowConfirmDelete(null)}>
          <div className="moodboard-form-modal-cute confirm-delete" onClick={e => e.stopPropagation()}>
            <h3>Remove this Scrap?</h3>
            <p>Are you sure you want to unpin "{showConfirmDelete.title}" from our board?</p>
            <div className="moodboard-form-actions-cute">
              <button onClick={() => setShowConfirmDelete(null)} className="moodboard-button-cute cancel">No, Keep It!</button>
              <button onClick={handleDeleteItem} className="moodboard-button-cute delete">Yes, Remove.</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}