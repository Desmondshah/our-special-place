import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";

interface Movie {
  _id: Id<"cinema">;
  title: string;
  poster: string;
  link: string;
  addedAt: number;
  watched?: boolean;
  watchedAt?: number;
}

interface SearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
  Type: string;
}

const OMDB_API_KEY = "5f2c66a6";

const pinColors = [
  "from-red-400 to-red-600",
  "from-pink-400 to-pink-600",
  "from-amber-400 to-amber-600",
  "from-teal-400 to-teal-600",
  "from-purple-400 to-purple-600",
];

export default function CinemaSection() {
  const movies = useQuery(api.cinema.getAll) || [];
  const addMovie = useMutation(api.cinema.add);
  const removeMovie = useMutation(api.cinema.remove);
  const markAsWatched = useMutation(api.cinema.markAsWatched);
  const markAsUnwatched = useMutation(api.cinema.markAsUnwatched);

  const [activeTab, setActiveTab] = useState<"watchlist" | "watched">("watchlist");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [viewingMovie, setViewingMovie] = useState<Movie | null>(null);

  const watchlist = movies.filter((m) => !m.watched);
  const watched = movies.filter((m) => m.watched);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchQuery)}&type=movie`
      );
      const data = await res.json();
      setSearchResults(data.Search || []);
    } catch {
      console.error("Search failed");
    }
    setSearching(false);
  };

  const handleAddMovie = async (movie: SearchResult) => {
    await addMovie({
      title: movie.Title,
      poster: movie.Poster !== "N/A" ? movie.Poster : "",
      link: `https://www.imdb.com/title/${movie.imdbID}`,
    });
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleToggleWatched = async (movie: Movie) => {
    if (movie.watched) {
      await markAsUnwatched({ id: movie._id });
    } else {
      await markAsWatched({ id: movie._id });
    }
    setViewingMovie(null);
  };

  return (
    <div className="space-y-6">
      {/* Header - Movie marquee style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1a1a2e] p-6 rounded-lg shadow-xl relative overflow-hidden"
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        {/* Film strip border */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[#0d0d15] flex items-center justify-around">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-3 h-2 bg-[#1a1a2e] rounded-sm" />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#0d0d15] flex items-center justify-around">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-3 h-2 bg-[#1a1a2e] rounded-sm" />
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
          <div>
            <h2 
              className="text-3xl sm:text-4xl text-amber-200 flex items-center gap-3"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              <span className="text-4xl">🎬</span>
              Our Movie Nights
            </h2>
            <p 
              className="text-pink-300 mt-1"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Films we've loved & ones we're excited to watch 🍿
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSearch(true)}
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 rounded-full shadow-lg self-start font-semibold"
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px' }}
          >
            + Add Movie
          </motion.button>
        </div>

        {/* Movie stats - ticket stubs */}
        <div className="flex gap-4 mt-4">
          <div 
            className="bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 rounded-lg shadow relative"
            style={{ transform: 'rotate(-2deg)' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20" />
            <div className="absolute left-1 top-2 bottom-2 border-l border-dashed border-white/30" />
            <span className="text-white" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              🎬 {watchlist.length} to watch
            </span>
          </div>
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 rounded-lg shadow relative"
            style={{ transform: 'rotate(1deg)' }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20" />
            <div className="absolute left-1 top-2 bottom-2 border-l border-dashed border-white/30" />
            <span className="text-white" style={{ fontFamily: "'Patrick Hand', cursive" }}>
              ⭐ {watched.length} watched
            </span>
          </div>
        </div>

        {/* Decorative popcorn */}
        <span className="absolute bottom-6 right-6 text-4xl">🍿</span>
      </motion.div>

      {/* Tabs - Film strip style */}
      <div className="flex gap-2">
        {(["watchlist", "watched"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-6 py-3 rounded-lg transition-all relative
              ${activeTab === tab 
                ? 'bg-amber-100 text-amber-900 shadow-lg' 
                : 'bg-white/50 text-gray-600 hover:bg-white/80'}
            `}
            style={{ 
              fontFamily: "'Patrick Hand', cursive", 
              fontSize: '18px',
              transform: activeTab === tab ? 'rotate(-1deg)' : 'none'
            }}
          >
            {tab === "watchlist" ? "🎬 Watchlist" : "⭐ Watched"}
            {activeTab === tab && (
              <div className="absolute -top-2 left-1/2 w-8 h-4 bg-gradient-to-r from-pink-300 to-pink-200 opacity-70" style={{ transform: 'translateX(-50%) rotate(3deg)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Movies Grid - Poster board */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[#8b7355] p-6 rounded-lg shadow-inner min-h-[300px]"
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C8B75\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
        }}
      >
        {(activeTab === "watchlist" ? watchlist : watched).length === 0 ? (
          <div className="text-center py-12">
            <div 
              className="bg-white p-6 max-w-xs mx-auto shadow-lg"
              style={{ transform: 'rotate(-2deg)' }}
            >
              <span className="text-5xl block mb-4">
                {activeTab === "watchlist" ? "🎬" : "⭐"}
              </span>
              <p 
                className="text-gray-600"
                style={{ fontFamily: "'Caveat', cursive", fontSize: '20px' }}
              >
                {activeTab === "watchlist" 
                  ? "Add movies you want to watch together!"
                  : "Movies you've watched will appear here"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {(activeTab === "watchlist" ? watchlist : watched).map((movie, index) => (
              <motion.div
                key={movie._id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, rotate: 0, zIndex: 10 }}
                onClick={() => setViewingMovie(movie)}
                className="cursor-pointer relative group"
                style={{ transform: `rotate(${(index % 5 - 2) * 2}deg)` }}
              >
                {/* Pushpin */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${pinColors[index % pinColors.length]} shadow-md border-2 border-white/50`} />
                  <div className="w-1 h-2 bg-gray-400 mx-auto -mt-1" />
                </div>

                {/* Poster */}
                <div className="bg-white p-2 shadow-lg">
                  <div className="aspect-[2/3] bg-gray-200 overflow-hidden">
                    {movie.poster ? (
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                        <span className="text-4xl">🎬</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <div className="mt-2 px-1">
                    <p 
                      className="text-xs text-gray-800 line-clamp-2"
                      style={{ fontFamily: "'Caveat', cursive", fontSize: '14px' }}
                    >
                      {movie.title}
                    </p>
                  </div>

                  {/* Watched indicator */}
                  {movie.watched && (
                    <div className="absolute top-6 right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                      ✓
                    </div>
                  )}
                </div>

                {/* Quick action on hover */}
                <div className="absolute inset-0 top-4 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                  <span className="text-white text-4xl">👁️</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Search Modal - Ticket booth style */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(""); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#fdf6e3] rounded-lg shadow-2xl overflow-hidden"
            >
              {/* Marquee header */}
              <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 p-4 text-center relative">
                <motion.div
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <h3 
                    className="text-2xl text-yellow-200"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    🎬 Now Searching 🎬
                  </h3>
                </motion.div>
              </div>

              <div className="p-6">
                {/* Search input */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search for a movie..."
                    className="flex-1 px-4 py-3 bg-white border-2 border-amber-200 rounded-lg outline-none focus:border-amber-400"
                    style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px' }}
                    autoFocus
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg shadow"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    {searching ? "..." : "🔍"}
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto space-y-3">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.imdbID}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 bg-white p-3 rounded-lg shadow hover:shadow-md cursor-pointer"
                      style={{ transform: `rotate(${(index % 3 - 1) * 0.5}deg)` }}
                      onClick={() => handleAddMovie(result)}
                    >
                      <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {result.Poster !== "N/A" ? (
                          <img src={result.Poster} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">🎬</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-gray-800 font-medium truncate"
                          style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}
                        >
                          {result.Title}
                        </p>
                        <p className="text-sm text-gray-500">{result.Year}</p>
                      </div>
                      <span className="text-2xl self-center">➕</span>
                    </motion.div>
                  ))}

                  {searchResults.length === 0 && searchQuery && !searching && (
                    <p className="text-center text-gray-500 py-8" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                      No movies found. Try another search!
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Movie Detail Modal - Ticket/polaroid style */}
      <AnimatePresence>
        {viewingMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
            onClick={() => setViewingMovie(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white shadow-2xl overflow-hidden relative"
            >
              {/* Ticket perforations */}
              <div className="absolute top-0 left-0 right-0 flex justify-around">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-black/70 rounded-full -mt-2" />
                ))}
              </div>

              {/* Poster */}
              <div className="aspect-[2/3] max-h-64 bg-gray-200 overflow-hidden">
                {viewingMovie.poster ? (
                  <img
                    src={viewingMovie.poster}
                    alt={viewingMovie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 bg-[#fdf6e3]">
                <h2 
                  className="text-2xl text-gray-800 mb-2"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {viewingMovie.title}
                </h2>

                <p 
                  className="text-gray-500 text-sm mb-4"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Added {new Date(viewingMovie.addedAt).toLocaleDateString()}
                  {viewingMovie.watchedAt && (
                    <> • Watched {new Date(viewingMovie.watchedAt).toLocaleDateString()}</>
                  )}
                </p>

                {/* IMDB Link */}
                {viewingMovie.link && (
                  <a
                    href={viewingMovie.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mb-4 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    🔗 View on IMDB
                  </a>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleWatched(viewingMovie)}
                    className={`flex-1 py-3 rounded-lg shadow ${
                      viewingMovie.watched 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                    style={{ fontFamily: "'Patrick Hand', cursive" }}
                  >
                    {viewingMovie.watched ? "📋 Move to Watchlist" : "✅ Mark Watched"}
                  </button>
                </div>

                <button
                  onClick={() => { removeMovie({ id: viewingMovie._id }); setViewingMovie(null); }}
                  className="w-full mt-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  🗑️ Remove Movie
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={() => setViewingMovie(null)}
                className="absolute top-6 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow text-gray-500 hover:text-gray-700"
              >
                ×
              </button>

              {/* Decorative elements */}
              <span className="absolute bottom-4 right-4 text-2xl">🎬</span>
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
