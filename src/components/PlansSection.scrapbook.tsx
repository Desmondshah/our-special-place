import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

// Washi tape colors for variety
const washiColors = [
  "from-pink-300 to-pink-200",
  "from-yellow-200 to-amber-100",
  "from-teal-200 to-emerald-200",
  "from-purple-200 to-violet-200",
  "from-orange-200 to-amber-100",
  "from-blue-200 to-sky-200",
];

// Paper colors for cards
const paperColors = [
  "bg-[#fdf6e3]", // cream
  "bg-[#fff0f5]", // pink
  "bg-[#f0fff4]", // mint
  "bg-[#f8f4ff]", // lavender
  "bg-[#fff5eb]", // peach
  "bg-[#f0f7ff]", // blue
];

// Decorative stickers
const stickers = ["✨", "💕", "🌸", "⭐", "💫", "🎀", "🌈", "💖"];

interface Plan {
  _id: Id<"plans">;
  title: string;
  date: string;
  type: string;
  website?: string;
  mapsLink?: string;
  isCompleted: boolean;
  memory?: {
    photos: string[];
    rating: number;
    notes: string[];
    createdAt: string;
  };
}

export default function PlansSection() {
  const plans = useQuery(api.plans.list) || [];
  const addPlan = useMutation(api.plans.add);
  const updatePlan = useMutation(api.plans.update);
  const toggleComplete = useMutation(api.plans.toggle);
  const deletePlan = useMutation(api.plans.remove);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<Plan | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

  // Form state
  const [title, setTitle] = useState("");
  const [planType, setPlanType] = useState("date");
  const [date, setDate] = useState("");
  const [website, setWebsite] = useState("");
  const [mapsLink, setMapsLink] = useState("");

  const resetForm = () => {
    setTitle("");
    setPlanType("date");
    setDate("");
    setWebsite("");
    setMapsLink("");
    setEditingPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingPlan) {
      await updatePlan({
        id: editingPlan._id,
        title,
        type: planType,
        date,
        website: website || undefined,
        mapsLink: mapsLink || undefined,
      });
    } else {
      await addPlan({ title, type: planType, date, website: website || undefined, mapsLink: mapsLink || undefined, isCompleted: false });
    }
    resetForm();
    setShowAddModal(false);
  };

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setTitle(plan.title);
    setPlanType(plan.type || "date");
    setDate(plan.date || "");
    setWebsite(plan.website || "");
    setMapsLink(plan.mapsLink || "");
    setShowAddModal(true);
  };

  const filteredPlans = plans.filter((plan) => {
    if (filter === "upcoming") return !plan.isCompleted;
    if (filter === "completed") return plan.isCompleted;
    return true;
  });

  const upcomingCount = plans.filter((p) => !p.isCompleted).length;
  const completedCount = plans.filter((p) => p.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Header Card - Scrapbook style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#fdf6e3] rounded-sm p-6 shadow-xl relative overflow-hidden"
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        {/* Washi tape decorations */}
        <div className="absolute -top-2 left-8 w-24 h-6 bg-gradient-to-r from-pink-300 to-pink-200 opacity-80" style={{ transform: 'rotate(-3deg)' }} />
        <div className="absolute -top-2 right-12 w-20 h-6 bg-gradient-to-r from-yellow-200 to-amber-100 opacity-80" style={{ transform: 'rotate(5deg)' }} />
        
        {/* Paper texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e5d5c0 27px, #e5d5c0 28px)',
          }}
        />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 
                className="text-3xl sm:text-4xl text-gray-800 flex items-center gap-3"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                <span className="text-4xl">🗺️</span>
                Our Adventures
              </h2>
              <p 
                className="text-amber-700 mt-1"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                All the places we'll go, all the things we'll do... ✨
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-6 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full shadow-lg self-start sm:self-auto"
              style={{ 
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '18px',
                boxShadow: '0 4px 0 #d4547a'
              }}
            >
              + Plan New Adventure
            </motion.button>
          </div>

          {/* Stats - Sticky note style */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div 
              className="bg-yellow-100 px-4 py-2 shadow-md"
              style={{ transform: 'rotate(-2deg)' }}
            >
              <span className="text-2xl font-bold text-amber-700" style={{ fontFamily: "'Caveat', cursive" }}>{upcomingCount}</span>
              <span className="text-amber-600 ml-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>upcoming</span>
            </div>
            <div 
              className="bg-green-100 px-4 py-2 shadow-md"
              style={{ transform: 'rotate(1deg)' }}
            >
              <span className="text-2xl font-bold text-green-700" style={{ fontFamily: "'Caveat', cursive" }}>{completedCount}</span>
              <span className="text-green-600 ml-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>memories made!</span>
            </div>
          </div>
        </div>

        {/* Corner sticker */}
        <motion.div
          animate={{ rotate: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute bottom-2 right-4 text-3xl"
        >
          💕
        </motion.div>
      </motion.div>

      {/* Filter Tabs - Notebook tabs style */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "all", label: "All Pages", icon: "📖" },
          { id: "upcoming", label: "Coming Up", icon: "🗓️" },
          { id: "completed", label: "Memories", icon: "📸" },
        ].map((tab, i) => (
          <motion.button
            key={tab.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(tab.id as typeof filter)}
            className={`px-4 py-2 rounded-t-lg border-2 border-b-0 transition-all whitespace-nowrap ${
              filter === tab.id
                ? "bg-[#fdf6e3] border-amber-300 -mb-px z-10"
                : "bg-white/60 border-transparent hover:bg-white/80"
            }`}
            style={{ 
              fontFamily: "'Patrick Hand', cursive",
              transform: `rotate(${i % 2 === 0 ? -1 : 1}deg)`,
            }}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div 
            className="bg-[#fdf6e3] max-w-sm mx-auto p-8 shadow-xl"
            style={{ transform: 'rotate(1deg)' }}
          >
            <div className="text-6xl mb-4">🗺️</div>
            <h3 
              className="text-2xl text-gray-700 mb-2"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              No adventures yet!
            </h3>
            <p 
              className="text-gray-500 mb-6"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Let's plan something amazing together...
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-6 py-2 bg-pink-400 text-white rounded-full"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Plan Our First Adventure ✨
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredPlans.map((plan, index) => (
              <motion.div
                key={plan._id}
                layout
                initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: (index % 3 - 1) * 1.5 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02, rotate: 0, zIndex: 10 }}
                className={`${paperColors[index % paperColors.length]} p-5 shadow-lg relative cursor-pointer group`}
                style={{ minHeight: '200px' }}
                onClick={() => setViewingPlan(plan)}
              >
                {/* Washi tape at top */}
                <div 
                  className={`absolute -top-2 left-1/4 w-20 h-5 bg-gradient-to-r ${washiColors[index % washiColors.length]} opacity-80`}
                  style={{ transform: `rotate(${(index % 2 === 0 ? -5 : 5)}deg)` }}
                />

                {/* Push pin for completed */}
                {plan.isCompleted && (
                  <div className="absolute -top-2 right-6">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-md">
                      <div className="absolute inset-1 rounded-full bg-white/30" />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="pt-4">
                  {/* Date badge */}
                  {plan.date && (
                    <div 
                      className="inline-block px-3 py-1 bg-white/80 rounded shadow-sm text-sm text-amber-700 mb-3"
                      style={{ fontFamily: "'Patrick Hand', cursive", transform: 'rotate(-2deg)' }}
                    >
                      📅 {new Date(plan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}

                  <h3 
                    className={`text-2xl text-gray-800 mb-2 ${plan.isCompleted ? 'line-through decoration-pink-400 decoration-2' : ''}`}
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    {plan.title}
                  </h3>

                  {/* Type badge */}
                  <span 
                    className="inline-block px-2 py-0.5 bg-white/60 rounded text-xs text-gray-600 mb-2"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    {plan.type}
                  </span>

                  {/* Links */}
                  {(plan.mapsLink || plan.website) && (
                    <div className="flex gap-2 mt-2">
                      {plan.mapsLink && (
                        <a 
                          href={plan.mapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                        >
                          📍 Map
                        </a>
                      )}
                      {plan.website && (
                        <a 
                          href={plan.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
                        >
                          🔗 Link
                        </a>
                      )}
                    </div>
                  )}

                  {/* Status stamp */}
                  {plan.isCompleted && (
                    <div 
                      className="absolute bottom-4 right-4 px-3 py-1 border-2 border-dashed border-green-500 text-green-600 text-sm font-bold"
                      style={{ fontFamily: "'Patrick Hand', cursive", transform: 'rotate(-8deg)' }}
                    >
                      ✓ MEMORY MADE!
                    </div>
                  )}
                </div>

                {/* Hover actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(plan); }}
                    className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-sm hover:bg-yellow-100 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={async (e) => { e.stopPropagation(); await toggleComplete({ id: plan._id, isCompleted: !plan.isCompleted }); }}
                    className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-sm hover:bg-green-100 transition-colors"
                  >
                    {plan.isCompleted ? "↩️" : "✓"}
                  </button>
                </div>

                {/* Decorative corner sticker */}
                <div className="absolute -bottom-2 -right-2 text-2xl opacity-60">
                  {stickers[index % stickers.length]}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
              animate={{ opacity: 1, scale: 1, rotate: -1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#fdf6e3] p-6 shadow-2xl relative"
            >
              {/* Washi tape decorations */}
              <div className="absolute -top-3 left-8 w-24 h-6 bg-gradient-to-r from-pink-300 to-pink-200 opacity-80" style={{ transform: 'rotate(-5deg)' }} />
              <div className="absolute -top-3 right-8 w-20 h-6 bg-gradient-to-r from-teal-200 to-emerald-200 opacity-80" style={{ transform: 'rotate(8deg)' }} />

              {/* Lined paper effect */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e5d5c0 27px, #e5d5c0 28px)',
                }}
              />

              <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                <h3 
                  className="text-2xl text-gray-800 mb-6 flex items-center gap-2"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  <span className="text-3xl">{editingPlan ? "✏️" : "✨"}</span>
                  {editingPlan ? "Edit Adventure" : "Plan New Adventure"}
                </h3>

                <div>
                  <label 
                    className="block text-amber-700 text-sm mb-1"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    What are we doing?
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Our amazing adventure..."
                    className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none transition-colors"
                    style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}
                    required
                  />
                </div>

                <div>
                  <label 
                    className="block text-amber-700 text-sm mb-1"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    When?
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none transition-colors"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-amber-700 text-sm mb-1"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    Type
                  </label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value)}
                    className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none transition-colors"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    <option value="date">Date Night</option>
                    <option value="trip">Trip</option>
                    <option value="activity">Activity</option>
                    <option value="event">Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label 
                    className="block text-amber-700 text-sm mb-1"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    Maps Link (optional)
                  </label>
                  <input
                    type="url"
                    value={mapsLink}
                    onChange={(e) => setMapsLink(e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none transition-colors"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-amber-700 text-sm mb-1"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none transition-colors"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); resetForm(); }}
                    className="flex-1 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-white/50 transition-colors"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-lg shadow-md"
                    style={{ fontFamily: "'Patrick Hand', cursive", boxShadow: '0 3px 0 #d4547a' }}
                  >
                    {editingPlan ? "Save Changes" : "Add to Scrapbook"} 💕
                  </motion.button>
                </div>
              </form>

              {/* Corner sticker */}
              <div className="absolute -bottom-4 -right-4 text-4xl" style={{ transform: 'rotate(15deg)' }}>
                🌸
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Plan Modal */}
      <AnimatePresence>
        {viewingPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            onClick={() => setViewingPlan(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white p-4 pb-16 shadow-2xl relative"
            >
              {/* Polaroid style - image placeholder */}
              <div className="bg-[#fdf6e3] aspect-video flex items-center justify-center mb-4">
                <span className="text-6xl">🗺️</span>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 
                  className="text-3xl text-gray-800 mb-2"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {viewingPlan.title}
                </h3>
                
                <span 
                  className="inline-block px-3 py-1 bg-amber-100 rounded-full text-amber-700 text-sm mb-2"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  {viewingPlan.type}
                </span>

                {viewingPlan.date && (
                  <p 
                    className="text-amber-700"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    📅 {new Date(viewingPlan.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                {/* Links */}
                <div className="flex justify-center gap-3 mt-4">
                  {viewingPlan.mapsLink && (
                    <a 
                      href={viewingPlan.mapsLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      📍 View Map
                    </a>
                  )}
                  {viewingPlan.website && (
                    <a 
                      href={viewingPlan.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      🔗 Website
                    </a>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
                <button
                  onClick={() => { setViewingPlan(null); startEdit(viewingPlan); }}
                  className="px-4 py-2 bg-yellow-100 text-amber-700 rounded-full text-sm"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={async () => { await toggleComplete({ id: viewingPlan._id, isCompleted: !viewingPlan.isCompleted }); setViewingPlan(null); }}
                  className={`px-4 py-2 rounded-full text-sm ${viewingPlan.isCompleted ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  {viewingPlan.isCompleted ? "↩️ Undo" : "✓ Mark Complete"}
                </button>
                <button
                  onClick={async () => { await deletePlan({ id: viewingPlan._id }); setViewingPlan(null); }}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-sm"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  🗑️ Delete
                </button>
              </div>

              {/* Status stamp */}
              {viewingPlan.isCompleted && (
                <div 
                  className="absolute top-8 right-8 px-4 py-2 border-3 border-dashed border-green-500 text-green-600 font-bold bg-white/80"
                  style={{ fontFamily: "'Patrick Hand', cursive", transform: 'rotate(12deg)' }}
                >
                  ✓ DONE!
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setViewingPlan(null)}
                className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
      `}</style>
    </div>
  );
}
