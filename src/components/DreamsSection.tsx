import { FormEvent, useState, useEffect, ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel"; // Ensure this path is correct

interface Dream {
  _id: Id<"dreams">; // Ensure Id<"dreams"> is correct
  title: string;
  category: string;
  description?: string;
  imageUrl?: string;
}

// Category styles - can be expanded with more unique pixel icons if desired
const dreamCategoryStyles: Record<string, { emoji: string; className: string }> = {
  travel: { emoji: "✈️", className: "dream-category-travel" },
  home: { emoji: "🏡", className: "dream-category-home" }, // Changed for more "homey" feel
  pets: { emoji: "🐾", className: "dream-category-pets" },
  activities: { emoji: "🎨", className: "dream-category-activities" },
  other: { emoji: "🌟", className: "dream-category-other" }, // Default sparkle
};

export default function DreamsSection() {
  const dreams = useQuery(api.dreams.list) || [];
  const addDreamMutation = useMutation(api.dreams.add);
  const removeDreamMutation = useMutation(api.dreams.remove);

  const [showAddDreamModal, setShowAddDreamModal] = useState(false);
  const [newDream, setNewDream] = useState({
    title: "",
    category: "travel",
    description: "",
    imageUrl: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredDreamId, setHoveredDreamId] = useState<Id<"dreams"> | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Dream | null>(null);


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDream(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setNewDream({ title: "", category: "travel", description: "", imageUrl: "" });
    setShowAddDreamModal(false);
  };

  const handleSubmitDream = async (e: FormEvent) => {
    e.preventDefault();
    if (!newDream.title.trim()) {
      alert("Every dream needs a name! ✨");
      return;
    }
    setIsSubmitting(true);
    try {
      await addDreamMutation({
        title: newDream.title,
        category: newDream.category,
        description: newDream.description || undefined,
        imageUrl: newDream.imageUrl || undefined
      });
      resetForm();
      // Add a cute success toast/notification here if you have a system for it
    } catch (error) {
      console.error("Failed to add dream:", error);
      alert("Oh no! Our dreamcatcher missed that one. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDream = async () => {
    if (!showDeleteConfirm) return;
    try {
      await removeDreamMutation({ id: showDeleteConfirm._id });
      setShowDeleteConfirm(null);
      // Add a success toast/notification
    } catch (error) {
      console.error("Failed to remove dream:", error);
      alert("This dream is holding on tight! Could not remove.");
    }
  };

  return (
    <div className="dreams-section-weaver">
      <header className="dreams-header-weaver">
        <h1>Our Shared Dreamscape 🌌</h1>
        <button 
          onClick={() => setShowAddDreamModal(true)} 
          className="dream-button-cute add-dream-button"
        >
          Catch a New Dream 🌠
        </button>
      </header>

      {showAddDreamModal && (
        <div className="dream-modal-overlay-cute" onClick={() => setShowAddDreamModal(false)}>
          <form onSubmit={handleSubmitDream} className="dream-add-form-cute" onClick={e => e.stopPropagation()}>
            <h2>Whisper a New Dream... ✨</h2>
            <input
              type="text" name="title" value={newDream.title} onChange={handleInputChange}
              placeholder="What are we dreaming of?" className="dream-input-cute" required
            />
            <select name="category" value={newDream.category} onChange={handleInputChange} className="dream-input-cute">
              {Object.entries(dreamCategoryStyles).map(([key, { emoji }]) => (
                <option key={key} value={key}>{emoji} {key.charAt(0).toUpperCase() + key.slice(1)}</option>
              ))}
            </select>
            <textarea
              name="description" value={newDream.description} onChange={handleInputChange}
              placeholder="Describe this lovely dream... (optional)" className="dream-textarea-cute" rows={3}
            />
            <input
              type="url" name="imageUrl" value={newDream.imageUrl} onChange={handleInputChange}
              placeholder="A picture for our dream? (URL, optional) 🖼️" className="dream-input-cute"
            />
            <div className="dream-form-actions-cute">
              <button type="button" onClick={resetForm} className="dream-button-cute cancel">Maybe Later</button>
              <button type="submit" className="dream-button-cute submit" disabled={isSubmitting}>
                {isSubmitting ? "Dreaming it up..." : "Add to Our Sky!"}
              </button>
            </div>
          </form>
        </div>
      )}

      {dreams.length === 0 && !showAddDreamModal && (
        <div className="dreams-empty-state-cute">
          <span className="icon">💭</span>
          <h2>The Night Sky is Clear...</h2>
          <p>Let's fill it with our beautiful dreams and wishes!</p>
        </div>
      )}

      <div className="dreams-constellation-grid-cute">
        {dreams.map((dream) => {
          const style = dreamCategoryStyles[dream.category] || dreamCategoryStyles.other;
          return (
            <div 
              key={dream._id} 
              className={`dream-orb-cute ${style.className} ${hoveredDreamId === dream._id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredDreamId(dream._id)}
              onMouseLeave={() => setHoveredDreamId(null)}
              tabIndex={0} // Make it focusable
              // onClick could open a detail view if we expand later
            >
              <button 
                onClick={() => setShowDeleteConfirm(dream)} 
                className="dream-orb-delete-button-cute"
                aria-label="Remove dream"
              >
                ✕
              </button>
              {dream.imageUrl && (
                <div className="dream-orb-image-container-cute">
                  <img src={dream.imageUrl} alt={dream.title} className="dream-orb-image-cute" />
                </div>
              )}
              <div className="dream-orb-content-cute">
                <span className="dream-orb-emoji-cute">{style.emoji}</span>
                <h3 className="dream-orb-title-cute">{dream.title}</h3>
                {dream.description && <p className="dream-orb-description-cute">{dream.description}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {showDeleteConfirm && (
        <div className="dream-modal-overlay-cute" onClick={() => setShowDeleteConfirm(null)}>
          <div className="dream-add-form-cute confirm-delete" onClick={e => e.stopPropagation()}>
            <h2>Let this dream fade?</h2>
            <p>Are you sure you want to remove "{showDeleteConfirm.title}" from our dreamscape?</p>
            <div className="dream-form-actions-cute">
              <button onClick={() => setShowDeleteConfirm(null)} className="dream-button-cute cancel">No, Keep Dreaming!</button>
              <button onClick={handleDeleteDream} className="dream-button-cute delete">Yes, Let It Go</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}