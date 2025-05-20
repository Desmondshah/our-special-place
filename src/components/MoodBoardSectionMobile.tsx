import { FormEvent, useState, useRef, ChangeEvent, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MoodItem, MoodItemForm, emptyMoodItemForm, defaultColors } from "../../convex/MoodBoardTypes";
import {
  readFileAsDataURL, isFileSizeValid, playSuccessAnimation,
  filterMoodItems, getAllTags, formatDate,
  checkSocialMediaUrl, fetchEmbedData, getEmbedTitle, getEmbedDescription, getEmbedThumbnail
} from "../../convex/MoodBoardUtils";
import SocialEmbed from "./SocialEmbed";

export default function MoodBoardSectionMobile() {
  const moodItems = useQuery(api.moodboard.getAll) || [];
  const addMoodItem = useMutation(api.moodboard.add);
  const updateMoodItem = useMutation(api.moodboard.update);
  const removeMoodItem = useMutation(api.moodboard.remove);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null); // Added missing ref

  const [activeSheet, setActiveSheet] = useState<"none" | "add" | "edit" | "filter" | "details">("none");
  const [currentItemForSheet, setCurrentItemForSheet] = useState<MoodItem | null>(null);

  const [formState, setFormState] = useState<MoodItemForm>({ ...emptyMoodItemForm });
  const [formSocialUrl, setFormSocialUrl] = useState("");
  const [isFormUploading, setIsFormUploading] = useState(false);
  const [formUploadProgress, setFormUploadProgress] = useState(0);
  const [isFormProcessingUrl, setIsFormProcessingUrl] = useState(false);
  const [formUrlProgress, setFormUrlProgress] = useState(0);
  const [formNewTag, setFormNewTag] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [allTagsFromItems, setAllTagsFromItems] = useState<string[]>([]);

  const filteredItems = filterMoodItems(moodItems, searchQuery, activeTag);
  useEffect(() => setAllTagsFromItems(getAllTags(moodItems)), [moodItems]);

  const openSheet = (type: "add" | "edit" | "details" | "filter", item?: MoodItem) => {
    setActiveSheet(type);
    if (item) setCurrentItemForSheet(item);

    if (type === "add") {
      setFormState({ ...emptyMoodItemForm });
      setFormSocialUrl("");
    } else if (type === "edit" && item) {
      setFormState({
        imageUrl: item.imageUrl || "", // Ensure imageUrl is string
        title: item.title, description: item.description || "",
        tags: [...item.tags], color: item.color || defaultColors[0],
        embedUrl: item.embedUrl, embedType: item.embedType, embedData: item.embedData
      });
      setFormSocialUrl(item.embedUrl || "");
    }
    document.body.classList.add('overflow-hidden-cute');
  };

  const closeSheet = () => {
    setActiveSheet("none");
    setCurrentItemForSheet(null);
    setIsFormUploading(false); setFormUploadProgress(0);
    setIsFormProcessingUrl(false); setFormUrlProgress(0);
    setFormNewTag("");
    document.body.classList.remove('overflow-hidden-cute');
  };

  const handleSheetSocialUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormSocialUrl(url);
    const { isValid, type } = checkSocialMediaUrl(url);
    if (isValid && type) {
      try {
        setIsFormProcessingUrl(true); setFormUrlProgress(30);
        const embedData = await fetchEmbedData(url); setFormUrlProgress(70);
        setFormState(prev => ({
          ...prev, title: getEmbedTitle(embedData) || prev.title,
          description: getEmbedDescription(embedData) || prev.description,
          imageUrl: getEmbedThumbnail(embedData) || "", // Ensure imageUrl is always string
          embedUrl: url, embedType: type, embedData: embedData
        }));
        setFormUrlProgress(100); setTimeout(() => { setIsFormProcessingUrl(false); setFormUrlProgress(0); }, 500);
      } catch (err) { console.error(err); alert("Link trouble!"); setIsFormProcessingUrl(false); setFormUrlProgress(0); }
    } else if (url === "") {
        setFormState(prev => ({ ...prev, embedUrl: undefined, embedType: undefined, embedData: null}));
    }
  };

  const handleSheetFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    setIsFormUploading(true); setFormUploadProgress(20);
    try {
      if (!isFileSizeValid(files[0])) { alert("Pic too big!"); setIsFormUploading(false); return; }
      const dataUrl = await readFileAsDataURL(files[0]); setFormUploadProgress(80);
      setFormState(prev => ({ ...prev, imageUrl: dataUrl, embedUrl: undefined, embedType: undefined, embedData: null }));
      setFormUploadProgress(100); if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) { console.error(err); alert("Image error!"); }
    finally { setTimeout(() => { setIsFormUploading(false); setFormUploadProgress(0); }, 500); }
  };

  const handleSheetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isFormUploading || isFormProcessingUrl) { alert("Working on it!"); return; }
    if (!formState.title.trim() || (!formState.imageUrl && !formState.embedUrl)) { alert("Needs title & pic/link!"); return; }

    try {
      const payload = {
        imageUrl: formState.imageUrl, // Will be "" if embed is used, or dataUrl
        title: formState.title,
        description: formState.description || undefined,
        tags: formState.tags,
        color: formState.color || undefined,
        embedUrl: formState.embedUrl || undefined,
        embedType: formState.embedType || undefined,
        embedData: formState.embedData
      };

      if (activeSheet === "add") {
        // Corrected: Remove addedAt, server will handle it
        await addMoodItem(payload);
        playSuccessAnimation();
      } else if (activeSheet === "edit" && currentItemForSheet) {
        await updateMoodItem({ id: currentItemForSheet._id, ...payload });
        playSuccessAnimation();
      }
      closeSheet();
    } catch (err) { console.error(err); alert("Oops! Couldn't save."); }
  };

  const handleSheetAddTag = () => {
    if (formNewTag.trim() && !formState.tags.includes(formNewTag.trim())) {
      setFormState(prev => ({ ...prev, tags: [...prev.tags, formNewTag.trim()] }));
    }
    setFormNewTag("");
  };
  const handleSheetRemoveTag = (tag: string) => {
    setFormState(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSheetDeleteItem = async () => {
    if (currentItemForSheet && window.confirm(`Really remove "${currentItemForSheet.title}"?`)) {
      try {
        await removeMoodItem({ id: currentItemForSheet._id });
        playSuccessAnimation("delete");
        closeSheet();
      } catch (err) { console.error(err); alert("Couldn't delete!"); }
    }
  };


  const renderSheetContent = () => {
    if (activeSheet === 'add' || (activeSheet === 'edit' && currentItemForSheet)) {
      return (
        <form onSubmit={handleSheetSubmit} className="moodboard-sheet-form-cute">
          <h3>{activeSheet === 'add' ? "✨ New Scrap!" : "✏️ Edit Scrap"}</h3>
          {!formState.imageUrl && (
            <div className="moodboard-form-field-cute">
              <label>🔗 Link (Pinterest, etc.):</label>
              <input type="text" value={formSocialUrl} onChange={handleSheetSocialUrlChange} placeholder="Paste a link..." className="moodboard-input-cute sheet" disabled={isFormProcessingUrl || !!formState.imageUrl} />
              {isFormProcessingUrl && <div className="moodboard-progress-bar-cute sheet" style={{ width: `${formUrlProgress}%` }} />}
            </div>
          )}

          {formState.embedUrl && !formState.imageUrl ? (
            <div className="moodboard-embed-preview-cute sheet">
              <SocialEmbed url={formState.embedUrl} embedType={formState.embedType || "link"} />
              <button type="button" onClick={() => setFormState(prev => ({ ...prev, embedUrl: undefined, embedType: undefined, embedData: null, title: activeSheet === 'edit' ? currentItemForSheet?.title || "" : "", description: activeSheet === 'edit' ? currentItemForSheet?.description || "" : "" }))} className="moodboard-remove-item-btn-cute sheet">X Clear Link</button>
            </div>
          ) : formState.imageUrl ? (
            <div className="moodboard-image-preview-cute sheet">
              <img src={formState.imageUrl} alt="Preview" />
              <button type="button" onClick={() => setFormState(prev => ({ ...prev, imageUrl: "", title: activeSheet === 'edit' ? currentItemForSheet?.title || "" : "", description: activeSheet === 'edit' ? currentItemForSheet?.description || "" : "" }))} className="moodboard-remove-item-btn-cute sheet">X Clear Image</button>
            </div>
          ) : (
            <div className="moodboard-form-field-cute">
              <label>🖼️ Or Upload Image:</label>
              <input type="file" ref={fileInputRef} onChange={handleSheetFileChange} accept="image/*" style={{ display: 'none' }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isFormUploading} className="moodboard-button-cute choose-file sheet">
                {isFormUploading ? `Uploading ${formUploadProgress}%` : "Choose Pic"}
              </button>
              {isFormUploading && <div className="moodboard-progress-bar-cute sheet" style={{ width: `${formUploadProgress}%` }} />}
            </div>
          )}

          <input type="text" value={formState.title} onChange={e => setFormState(prev => ({ ...prev, title: e.target.value }))} placeholder="Title this scrap!" className="moodboard-input-cute sheet" required />
          <textarea value={formState.description} onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))} placeholder="A little note..." className="moodboard-textarea-cute sheet" rows={2} />

          <div className="moodboard-color-palette-cute sheet">
            {defaultColors.map(c => <button key={c} type="button" style={{ backgroundColor: c }} className={formState.color === c ? 'selected' : ''} onClick={() => setFormState(prev => ({ ...prev, color: c }))} />)}
          </div>

          <div className="moodboard-tags-input-area-cute sheet">
            <input type="text" value={formNewTag} onChange={e => setFormNewTag(e.target.value)} placeholder="Add tag" className="moodboard-input-cute small sheet" onKeyPress={e => { if (e.key === 'Enter') { e.preventDefault(); handleSheetAddTag(); } }} />
            <button type="button" onClick={handleSheetAddTag} className="moodboard-button-cute add-tag small sheet">Add</button>
          </div>
          <div className="moodboard-tags-display-cute sheet">
            {formState.tags.map(t => <span key={t} className="moodboard-tag-item-cute">{t} <button type="button" onClick={() => handleSheetRemoveTag(t)}>x</button></span>)}
          </div>

          <div className="moodboard-sheet-actions-cute">
            <button type="button" onClick={closeSheet} className="moodboard-button-cute cancel sheet">Cancel</button>
            <button type="submit" className="moodboard-button-cute save sheet">{activeSheet === 'add' ? "Pin It!" : "Save Scrap"}</button>
          </div>
        </form>
      );
    }
    if (activeSheet === 'details' && currentItemForSheet) {
      return (
        <div className="moodboard-sheet-details-cute">
          <h3>{currentItemForSheet.title}</h3>
          {currentItemForSheet.embedUrl ?
            <SocialEmbed url={currentItemForSheet.embedUrl} embedType={currentItemForSheet.embedType || "link"} /> :
            currentItemForSheet.imageUrl && <img src={currentItemForSheet.imageUrl} alt={currentItemForSheet.title} />
          }
          {currentItemForSheet.description && <p>{currentItemForSheet.description}</p>}
          <div className="moodboard-tags-display-cute sheet details">
            {currentItemForSheet.tags.map(t => <span key={t} className="moodboard-tag-item-cute">#{t}</span>)}
          </div>
          <p className="moodboard-item-date-cute sheet">Added: {formatDate(currentItemForSheet.addedAt)}</p>
          <div className="moodboard-sheet-actions-cute">
            <button onClick={() => { openSheet('edit', currentItemForSheet) }} className="moodboard-button-cute edit sheet">Edit</button>
            <button onClick={closeSheet} className="moodboard-button-cute cancel sheet">Close</button>
          </div>
           {/* Delete button can be added here if desired for the details view */}
           <button onClick={handleSheetDeleteItem} className="moodboard-button-cute delete sheet full-width mt-2">Delete Scrap</button>
        </div>
      );
    }
    if (activeSheet === 'filter') {
      return (
        <div className="moodboard-sheet-filter-cute">
          <h3>🎨 Filter Scraps</h3>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Search..." className="moodboard-input-cute sheet" />
          <h4>Filter by Tag:</h4>
          <div className="moodboard-tag-filter-list-cute">
            <button onClick={() => { setActiveTag(""); closeSheet(); }} className={activeTag === "" ? "active" : ""}>All Tags</button>
            {allTagsFromItems.map(tag => (
              <button key={tag} onClick={() => { setActiveTag(tag); closeSheet(); }} className={activeTag === tag ? "active" : ""}>#{tag}</button>
            ))}
          </div>
          <button onClick={closeSheet} className="moodboard-button-cute cancel sheet full-width mt-2">Done Filtering</button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="moodboard-section-mobile-scrapbook">
      <header className="moodboard-mobile-header-cute">
        <h2>Inspiration Nook ✨</h2>
        <button onClick={() => openSheet('filter')} className="moodboard-mobile-filter-btn-cute">
          🎨 <span className={(searchQuery || activeTag) ? "filter-active-indicator" : ""}>Filters</span>
        </button>
      </header>

      {filteredItems.length === 0 && activeSheet === 'none' && (
        <div className="moodboard-empty-state-cute mobile">
          <span>✂️</span>
          <p>Our scrapbook is waiting for its first lovely idea!</p>
        </div>
      )}

      <div className="moodboard-items-container-cute mobile-grid">
        {filteredItems.map((item) => ( // Removed index as it's not used for key
          <div
            key={item._id}
            className="moodboard-item-scrap-cute mobile"
            style={{ backgroundColor: item.color || 'var(--cute-bg-tertiary)' }}
            onClick={() => openSheet('details', item)}
          >
            {item.embedUrl && item.embedType ? (
              <div className="moodboard-item-embed-wrapper-cute mobile">
                <div className="moodboard-embed-placeholder-mobile">🔗 {item.embedType.charAt(0).toUpperCase() + item.embedType.slice(1)}</div>
              </div>
            ) : item.imageUrl ? (
              <div className="moodboard-item-image-wrapper-cute mobile">
                <img src={item.imageUrl} alt={item.title} className="moodboard-item-image-cute" />
              </div>
            ) : <div className="moodboard-item-placeholder-cute mobile">📝</div>}
            <div className="moodboard-item-content-cute mobile">
              <h4 className="moodboard-item-title-cute mobile">{item.title}</h4>
              {item.tags.length > 0 && <span className="moodboard-tag-item-cute small mobile">#{item.tags[0]} {item.tags.length > 1 ? `+${item.tags.length - 1}` : ''}</span>}
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => openSheet('add')} className="moodboard-fab-cute">💖</button>

      {activeSheet !== 'none' && (
        <div className="moodboard-bottom-sheet-overlay-cute" onClick={closeSheet}>
          <div ref={bottomSheetRef} className="moodboard-bottom-sheet-cute" onClick={e => e.stopPropagation()}>
            <div className="moodboard-bottom-sheet-handle-cute"></div>
            {renderSheetContent()}
          </div>
        </div>
      )}
    </div>
  );
}