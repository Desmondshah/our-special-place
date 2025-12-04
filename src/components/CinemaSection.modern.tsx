import { useState, FormEvent, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Movie {
  _id: Id<"cinema">;
  title: string;
  poster: string;
  link: string;
  addedAt: number;
  watched?: boolean;
  watchedAt?: number;
}

const OMDB_API_KEY = '5f2c66a6';
const YOUTUBE_API_KEY = 'AIzaSyC1hx_06tH-F2btecw0emxRoLZzpgD_UsM';

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export default function CinemaSectionModern() {
  const movies = useQuery(api.cinema.getAll) ?? [];
  const addMovie = useMutation(api.cinema.add);
  const removeMovie = useMutation(api.cinema.remove);
  const markAsWatched = useMutation(api.cinema.markAsWatched);
  const markAsUnwatched = useMutation(api.cinema.markAsUnwatched);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<Movie | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  
  const [movieName, setMovieName] = useState("");
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState("");

  const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("all");
  const [sortBy, setSortBy] = useState<"recent" | "alpha">("recent");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort movies
  const filteredMovies = movies
    .filter(movie => {
      if (searchQuery && !movie.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filter === "watched") return movie.watched;
      if (filter === "unwatched") return !movie.watched;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "alpha") return a.title.localeCompare(b.title);
      return b.addedAt - a.addedAt;
    });

  const handleAddMovie = async (e: FormEvent) => {
    e.preventDefault();
    if (!movieName.trim() || !link.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${OMDB_API_KEY}`);
      const data = await response.json();

      if (data.Response === "True" && data.Poster && data.Poster !== "N/A") {
        await addMovie({ title: movieName, poster: data.Poster, link });
        setMovieName("");
        setLink("");
        setShowAddModal(false);
      } else {
        alert(`Couldn't find a poster for "${movieName}". Please check the movie title!`);
      }
    } catch (error) {
      console.error("Error adding movie:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const playTrailer = async (movie: Movie) => {
    try {
      const query = encodeURIComponent(`${movie.title} official trailer`);
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&type=video&maxResults=1`);
      const data = await response.json();
      
      if (data.items?.length > 0) {
        const videoId = data.items[0].id.videoId;
        setTrailerUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1`);
        setSelectedMovie(movie);
        setShowTrailerModal(true);
      } else {
        alert("No trailer found for this movie!");
      }
    } catch (error) {
      console.error("Error fetching trailer:", error);
    }
  };

  const toggleWatched = async (movie: Movie) => {
    if (movie.watched) {
      await markAsUnwatched({ id: movie._id });
    } else {
      await markAsWatched({ id: movie._id, watchedAt: Date.now() });
    }
  };

  const handleDelete = async () => {
    if (showDeleteModal) {
      await removeMovie({ id: showDeleteModal._id });
      setShowDeleteModal(null);
    }
  };

  const watchedCount = movies.filter(m => m.watched).length;
  const unwatchedCount = movies.filter(m => !m.watched).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Our Cinema 🎬
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {movies.length} movies • {watchedCount} watched • {unwatchedCount} to watch
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all"
        >
          <span>🎬</span>
          Add Movie
        </motion.button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search movies..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        {/* Filter & Sort */}
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as typeof filter)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-300 transition-all appearance-none pr-10 cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366F1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px"
            }}
          >
            <option value="all">🎭 All Movies</option>
            <option value="unwatched">🎞️ To Watch</option>
            <option value="watched">✅ Watched</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-300 transition-all appearance-none pr-10 cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236366F1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "16px"
            }}
          >
            <option value="recent">⚡ Newest</option>
            <option value="alpha">🔤 A-Z</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {movies.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <span className="text-7xl block mb-6">🎬</span>
          <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">
            Our cinema is empty!
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Add movies to watch together on our cozy movie nights
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-semibold rounded-xl shadow-lg"
          >
            Add First Movie 🍿
          </motion.button>
        </motion.div>
      )}

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMovies.map((movie, index) => (
            <motion.div
              key={movie._id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ delay: index * 0.03 }}
              layout
              className="group relative"
            >
              <motion.div
                whileHover={{ scale: 1.05, zIndex: 10 }}
                className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-lg cursor-pointer bg-gray-100"
                onClick={() => playTrailer(movie)}
              >
                {/* Poster */}
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Watched Badge */}
                {movie.watched && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-lg">
                    ✓ Watched
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h4 className="text-white font-semibold text-sm mb-3 line-clamp-2">
                      {movie.title}
                    </h4>

                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrailer(movie);
                        }}
                        className="flex-1 py-2 bg-white text-gray-800 text-xs font-medium rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        ▶ Trailer
                      </motion.button>
                      <motion.a
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        href={movie.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="py-2 px-3 bg-indigo-500 text-white text-xs font-medium rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        Watch
                      </motion.a>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatched(movie);
                        }}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                          movie.watched
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                      >
                        {movie.watched ? "Mark Unwatched" : "✓ Mark Watched"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteModal(movie);
                        }}
                        className="py-2 px-3 bg-red-500/80 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Title below on mobile */}
              <p className="mt-2 text-sm text-gray-700 font-medium line-clamp-1 group-hover:text-indigo-600 transition-colors sm:hidden">
                {movie.title}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Movie Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-gray-800">
                      Add New Movie 🎬
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">What should we watch next?</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddMovie} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Movie Title
                  </label>
                  <input
                    type="text"
                    value={movieName}
                    onChange={e => setMovieName(e.target.value)}
                    placeholder="The Notebook, Titanic..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Enter the exact title for best poster results</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Watch Link
                  </label>
                  <input
                    type="url"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    placeholder="https://netflix.com/watch/..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Finding Poster..." : "Add Movie 🍿"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trailer Modal */}
      <AnimatePresence>
        {showTrailerModal && trailerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowTrailerModal(false);
              setTrailerUrl("");
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
            >
              <iframe
                src={trailerUrl}
                title="Movie Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => {
                  setShowTrailerModal(false);
                  setTrailerUrl("");
                }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl backdrop-blur-sm transition-colors"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center"
            >
              <div className="w-20 h-28 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg">
                <img src={showDeleteModal.poster} alt="" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-display text-xl font-semibold text-gray-800 mb-2">
                Remove from collection?
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                "{showDeleteModal.title}" will be removed from your watchlist.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Keep It
                </button>
                <motion.button
                  onClick={handleDelete}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-red-400 to-rose-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Remove 🗑️
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
