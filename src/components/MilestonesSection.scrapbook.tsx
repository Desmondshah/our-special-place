import { useState, useRef, ChangeEvent, useMemo, useCallback, memo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { useCachedImage, preloadImagesBatched, isImageCached } from "../lib/imageCache";

// Hook to preload all milestone images when data changes
const usePreloadMilestoneImages = (milestones: Array<{ photos: string[] }>) => {
  useEffect(() => {
    // Collect all unique image URLs
    const allUrls = milestones.flatMap(m => m.photos || []);
    const uniqueUrls = [...new Set(allUrls)];
    
    // Preload using the shared cache utility
    preloadImagesBatched(uniqueUrls, 5, 100);
  }, [milestones]);
};

// Performance: Detect if we should reduce animations
const useReducedMotion = () => {
  const [shouldReduce, setShouldReduce] = useState(false);
  
  useEffect(() => {
    // Check for iOS/mobile or prefers-reduced-motion
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    setShouldReduce(isIOS || isMobile || prefersReduced);
    
    // Listen for changes in preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setShouldReduce(e.matches || isIOS || isMobile);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return shouldReduce;
};

// Optimized image component with lazy loading and caching
const OptimizedImage = memo(({ 
  src, 
  alt, 
  className,
  onClick 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  onClick?: () => void;
}) => {
  const { cachedUrl, isLoading } = useCachedImage(src);
  const isCached = isImageCached(src);
  
  return (
    <div className="relative w-full h-full bg-[#fdf6e3]">
      {isLoading && !isCached && (
        <div className="absolute inset-0 bg-pink-50 animate-pulse flex items-center justify-center z-10">
          <span className="text-2xl">📷</span>
        </div>
      )}
      <img 
        src={cachedUrl || src} 
        alt={alt}
        className={`${className} ${isLoading && !isCached ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onClick={onClick}
        loading="lazy"
        decoding="async"
        style={{ backgroundColor: '#fdf6e3' }}
      />
    </div>
  );
});

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = "dzpyafpzu";
const CLOUDINARY_UPLOAD_PRESET = "unsigned_uploads";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const uploadToCloudinary = async (
  dataUrl: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (dataUrl.startsWith('http')) return dataUrl;

  const arr = dataUrl.split(',');
  if (arr.length < 2) throw new Error('Invalid data URL');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);
    xhr.send(formData);
  });
};

interface Milestone {
  _id: Id<"milestones">;
  title: string;
  date: string;
  description?: string;
  category: string;
  photos: string[];
  icon: string;
}

const decorativeStickers = ["💕", "✨", "🌸", "⭐", "💖", "🎀", "💫", "🦋"];
const tapeColors = [
  "from-pink-300 to-pink-200",
  "from-yellow-200 to-amber-100",
  "from-teal-200 to-emerald-200",
  "from-purple-200 to-violet-200",
  "from-orange-200 to-amber-100",
];

// Photo gallery component for displaying multiple photos - Memoized for performance
const PhotoGallery = memo(({ 
  photos, 
  onPhotoClick,
  reduceMotion = false
}: { 
  photos: string[]; 
  onPhotoClick: (index: number) => void;
  reduceMotion?: boolean;
}) => {
  const hoverClass = reduceMotion ? '' : 'hover:scale-105 transition-transform duration-300';
  
  if (photos.length === 0) {
    return (
      <div className="bg-[#fdf6e3] aspect-video flex items-center justify-center">
        <div className="text-center py-8">
          <span className="text-4xl">📷</span>
          <p 
            className="text-gray-400 text-sm mt-2"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            Memory captured
          </p>
        </div>
      </div>
    );
  }

  if (photos.length === 1) {
    return (
      <div 
        className="bg-[#fdf6e3] aspect-video flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => onPhotoClick(0)}
      >
        <OptimizedImage 
          src={photos[0]} 
          alt="Memory"
          className={`w-full h-full object-cover ${hoverClass}`}
        />
      </div>
    );
  }

  if (photos.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 bg-[#fdf6e3]">
        {photos.map((photo, idx) => (
          <div 
            key={idx} 
            className="aspect-square overflow-hidden cursor-pointer bg-[#fdf6e3]"
            onClick={() => onPhotoClick(idx)}
          >
            <OptimizedImage 
              src={photo} 
              alt={`Memory ${idx + 1}`}
              className={`w-full h-full object-cover ${hoverClass}`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (photos.length === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 bg-[#fdf6e3]">
        <div 
          className="row-span-2 overflow-hidden cursor-pointer bg-[#fdf6e3]"
          onClick={() => onPhotoClick(0)}
        >
          <OptimizedImage 
            src={photos[0]} 
            alt="Memory 1"
            className={`w-full h-full object-cover ${hoverClass}`}
          />
        </div>
        {photos.slice(1).map((photo, idx) => (
          <div 
            key={idx} 
            className="aspect-square overflow-hidden cursor-pointer bg-[#fdf6e3]"
            onClick={() => onPhotoClick(idx + 1)}
          >
            <OptimizedImage 
              src={photo} 
              alt={`Memory ${idx + 2}`}
              className={`w-full h-full object-cover ${hoverClass}`}
            />
          </div>
        ))}
      </div>
    );
  }

  // 4+ photos - grid with remaining count
  return (
    <div className="grid grid-cols-2 gap-1 bg-[#fdf6e3]">
      {photos.slice(0, 4).map((photo, idx) => (
        <div 
          key={idx} 
          className="aspect-square overflow-hidden cursor-pointer relative bg-[#fdf6e3]"
          onClick={() => onPhotoClick(idx)}
        >
          <OptimizedImage 
            src={photo} 
            alt={`Memory ${idx + 1}`}
            className={`w-full h-full object-cover ${hoverClass}`}
          />
          {idx === 3 && photos.length > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span 
                className="text-white text-2xl font-bold"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                +{photos.length - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

// Truncated note preview component - Memoized
const NotePreview = memo(({ 
  description, 
  onClick 
}: { 
  description?: string; 
  onClick: () => void;
}) => {
  if (!description) return null;
  
  const maxLength = 80;
  const isTruncated = description.length > maxLength;
  const displayText = isTruncated ? description.slice(0, maxLength) + "..." : description;
  
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer hover:bg-amber-50/50 p-2 rounded transition-colors"
    >
      <p 
        className="text-gray-600 text-sm leading-relaxed"
        style={{ fontFamily: "'Caveat', cursive", fontSize: '16px' }}
      >
        "{displayText}"
      </p>
      {isTruncated && (
        <span 
          className="text-pink-500 text-xs mt-1 inline-block hover:text-pink-600"
          style={{ fontFamily: "'Patrick Hand', cursive" }}
        >
          Click to read more →
        </span>
      )}
    </div>
  );
});

export default function MilestonesSection() {
  const milestones = useQuery(api.milestones.list) || [];
  const addMilestone = useMutation(api.milestones.add);
  const removeMilestone = useMutation(api.milestones.remove);
  
  // Performance optimization: detect if we should reduce motion
  const reduceMotion = useReducedMotion();
  
  // Preload all milestone images in background for instant switching
  usePreloadMilestoneImages(milestones);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingMilestone, setViewingMilestone] = useState<Milestone | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [photoViewerData, setPhotoViewerData] = useState<{ photos: string[]; currentIndex: number } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Memoized animation variants for performance
  const cardAnimationProps = useMemo(() => 
    reduceMotion 
      ? {} 
      : { whileHover: { scale: 1.01 } }
  , [reduceMotion]);
  
  const listItemAnimation = useMemo(() => (index: number) => 
    reduceMotion 
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : { 
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          transition: { delay: Math.min(index * 0.05, 0.3) } // Cap delay for long lists
        }
  , [reduceMotion]);

  const resetForm = () => {
    setTitle("");
    setDate("");
    setDescription("");
    setPhotos([]);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readFileAsDataURL = (file: File): Promise<string> => 
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    try {
      const dataUrls = await Promise.all(
        Array.from(files).map(file => {
          if (file.size > 5 * 1024 * 1024) {
            alert(`${file.name} is too big! Max 5MB please.`);
            return null;
          }
          return readFileAsDataURL(file);
        })
      );
      setPhotos(prev => [...prev, ...dataUrls.filter((url): url is string => url !== null)]);
    } catch (error) {
      alert("Error reading files. Please try again.");
    }

    if (e.target) e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload photos to Cloudinary
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.startsWith('http')) {
          uploadedUrls.push(photo);
        } else {
          const url = await uploadToCloudinary(photo, (progress) => {
            const overallProgress = Math.round(((i + progress / 100) / photos.length) * 100);
            setUploadProgress(overallProgress);
          });
          uploadedUrls.push(url);
        }
      }

      await addMilestone({
        title,
        date,
        description: description || undefined,
        category: "memory",
        photos: uploadedUrls,
        icon: "📸",
      });
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding memory:", error);
      alert("Failed to add memory. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const openPhotoViewer = useCallback((photos: string[], startIndex: number) => {
    setPhotoViewerData({ photos, currentIndex: startIndex });
  }, []);

  const closePhotoViewer = useCallback(() => {
    setPhotoViewerData(null);
  }, []);

  const navigatePhoto = useCallback((direction: 'prev' | 'next') => {
    setPhotoViewerData(prev => {
      if (!prev) return null;
      const { photos, currentIndex } = prev;
      let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (newIndex < 0) newIndex = photos.length - 1;
      if (newIndex >= photos.length) newIndex = 0;
      return { photos, currentIndex: newIndex };
    });
  }, []);

  // Memoize sorted milestones to prevent re-sorting on every render
  const sortedMilestones = useMemo(() => 
    [...milestones].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  , [milestones]);

  return (
    <div className="space-y-6">
      {/* Header - Photo album style */}
      <div
        className="bg-[#fdf6e3] p-6 shadow-xl relative overflow-hidden gpu-accelerate"
        style={{ transform: 'rotate(-0.5deg)' }}
      >
        {/* Decorative tape */}
        <div className="absolute -top-2 left-12 w-24 h-6 bg-gradient-to-r from-pink-300 to-pink-200 opacity-80" style={{ transform: 'rotate(-5deg)' }} />
        <div className="absolute -top-2 right-16 w-20 h-6 bg-gradient-to-r from-teal-200 to-emerald-200 opacity-80" style={{ transform: 'rotate(8deg)' }} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 
              className="text-3xl sm:text-4xl text-gray-800 flex items-center gap-3"
              style={{ fontFamily: "'Caveat', cursive" }}
            >
              <span className="text-4xl">📸</span>
              Our Memories
            </h2>
            <p 
              className="text-pink-600 mt-1"
              style={{ fontFamily: "'Patrick Hand', cursive" }}
            >
              Moments that made our hearts smile 💕
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-full shadow-lg self-start active:scale-95 transition-transform"
            style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '18px', boxShadow: '0 4px 0 #be185d' }}
          >
            + Add Memory
          </button>
        </div>

        {/* Memory count */}
        <div className="mt-4">
          <span 
            className="inline-block bg-pink-100 px-4 py-2 rounded-full shadow-sm"
            style={{ fontFamily: "'Patrick Hand', cursive", transform: 'rotate(-1deg)' }}
          >
            📖 {milestones.length} precious memories captured
          </span>
        </div>

        {/* Corner heart - only animate on desktop */}
        <span
          className={`absolute bottom-2 right-4 text-3xl ${reduceMotion ? '' : 'animate-pulse-gentle'}`}
        >
          💕
        </span>
      </div>

      {/* Timeline */}
      {sortedMilestones.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="relative max-w-sm mx-auto">
            {/* Polaroid style */}
            <div 
              className="bg-white p-4 pb-16 shadow-xl"
              style={{ transform: 'rotate(-3deg)' }}
            >
              <div className="bg-pink-50 aspect-square flex items-center justify-center">
                <span className="text-6xl">📷</span>
              </div>
              <p 
                className="absolute bottom-4 left-0 right-0 text-center text-gray-600"
                style={{ fontFamily: "'Caveat', cursive", fontSize: '20px' }}
              >
                Our first memory goes here...
              </p>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-rose-400 text-white rounded-full"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                Capture First Memory 📸
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="relative pl-8 md:pl-12">
          {/* Timeline line */}
          <div 
            className="absolute left-3 md:left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-300 via-rose-300 to-purple-300"
            style={{ borderRadius: '999px' }}
          />

          <div className="space-y-8">
            {sortedMilestones.map((milestone, index) => (
              <motion.div
                key={milestone._id}
                {...listItemAnimation(index)}
                className="relative gpu-accelerate"
              >
                {/* Timeline dot */}
                <div className="absolute -left-5 md:-left-7 top-4 w-6 h-6 rounded-full bg-white border-4 border-pink-400 shadow-md z-10">
                  <span className="absolute -top-1 -right-1 text-xs">
                    {decorativeStickers[index % decorativeStickers.length]}
                  </span>
                </div>

                {/* Memory card - Scrapbook style with photos on left, notes on right */}
                <motion.div
                  {...cardAnimationProps}
                  className="bg-white p-4 shadow-lg relative ml-4 gpu-accelerate"
                  style={{ 
                    transform: `rotate(${(index % 3 - 1) * 0.5}deg)`,
                  }}
                >
                  {/* Washi tape */}
                  <div 
                    className={`absolute -top-3 left-8 w-16 h-5 bg-gradient-to-r ${tapeColors[index % tapeColors.length]} opacity-80`}
                    style={{ transform: `rotate(${(index % 2 === 0 ? -5 : 5)}deg)` }}
                  />

                  {/* Main content: Photos + Notes side by side */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Photos section - Left side */}
                    <div className="md:w-1/2 lg:w-3/5">
                      <PhotoGallery 
                        photos={milestone.photos || []} 
                        onPhotoClick={(idx) => openPhotoViewer(milestone.photos || [], idx)}
                        reduceMotion={reduceMotion}
                      />
                      {/* Photo count indicator */}
                      {milestone.photos && milestone.photos.length > 0 && (
                        <p 
                          className="text-xs text-gray-400 mt-1 text-center"
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          {milestone.photos.length} photo{milestone.photos.length > 1 ? 's' : ''} 📷
                        </p>
                      )}
                    </div>

                    {/* Notes section - Right side */}
                    <div className="md:w-1/2 lg:w-2/5 flex flex-col justify-between">
                      {/* Title and date */}
                      <div>
                        <h3 
                          className="text-2xl text-gray-800 mb-1"
                          style={{ fontFamily: "'Caveat', cursive" }}
                        >
                          {milestone.title}
                        </h3>
                        <p 
                          className="text-sm text-pink-600 mb-3"
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          📅 {new Date(milestone.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>

                        {/* Notes preview or full */}
                        {milestone.description && (
                          <div className="bg-amber-50/50 rounded-lg p-2 border border-dashed border-amber-200">
                            <div className="flex items-start gap-2">
                              <span className="text-amber-600">📝</span>
                              <div className="flex-1">
                                {expandedNoteId === milestone._id ? (
                                  <>
                                    <p 
                                      className="text-gray-600 leading-relaxed"
                                      style={{ fontFamily: "'Caveat', cursive", fontSize: '16px' }}
                                    >
                                      "{milestone.description}"
                                    </p>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setExpandedNoteId(null); }}
                                      className="text-pink-500 text-xs mt-2 hover:text-pink-600"
                                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                                    >
                                      Show less ↑
                                    </button>
                                  </>
                                ) : (
                                  <NotePreview 
                                    description={milestone.description} 
                                    onClick={() => setExpandedNoteId(milestone._id)}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewingMilestone(milestone); }}
                          className="flex-1 px-3 py-2 bg-pink-100 text-pink-600 rounded-lg text-sm hover:bg-pink-200 transition-colors"
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          View All 👁️
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeMilestone({ id: milestone._id }); }}
                          className="px-3 py-2 bg-red-50 text-red-400 rounded-lg text-sm hover:bg-red-100 transition-colors"
                          style={{ fontFamily: "'Patrick Hand', cursive" }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Decorative sticker */}
                  <span className="absolute -bottom-3 -right-3 text-2xl">
                    {decorativeStickers[(index + 3) % decorativeStickers.length]}
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto"
            onClick={() => { if (!isUploading) { setShowAddModal(false); resetForm(); } }}
          >
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: -3 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white p-4 pb-6 shadow-2xl relative my-8 gpu-accelerate"
            >
              {/* Polaroid style inner */}
              <div className="bg-[#fdf6e3] p-6">
                {/* Washi tape */}
                <div className="absolute -top-3 left-12 w-20 h-5 bg-gradient-to-r from-pink-300 to-rose-200 opacity-80" style={{ transform: 'rotate(-3deg)' }} />
                <div className="absolute -top-3 right-12 w-16 h-5 bg-gradient-to-r from-yellow-200 to-amber-100 opacity-80" style={{ transform: 'rotate(5deg)' }} />

                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 
                    className="text-2xl text-gray-800 flex items-center gap-2"
                    style={{ fontFamily: "'Caveat', cursive" }}
                  >
                    📸 Capture a Memory
                  </h3>

                  <div>
                    <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                      What happened?
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Our special moment..."
                      className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none"
                      style={{ fontFamily: "'Caveat', cursive", fontSize: '18px' }}
                      required
                      disabled={isUploading}
                    />
                  </div>

                  <div>
                    <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                      When?
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white/80 border-b-2 border-amber-300 focus:border-pink-400 outline-none"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                      required
                      disabled={isUploading}
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                      Add Photos 📷
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full py-3 border-2 border-dashed border-amber-300 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      + Add Photos
                    </button>

                    {/* Photo previews */}
                    {photos.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {photos.map((photo, idx) => (
                          <div key={idx} className="relative aspect-square">
                            <img 
                              src={photo} 
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-full object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              disabled={isUploading}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-amber-700 text-sm mb-1" style={{ fontFamily: "'Patrick Hand', cursive" }}>
                      Tell the story... (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What made this moment special..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white/80 border-2 border-dashed border-amber-200 focus:border-pink-300 outline-none resize-none"
                      style={{ fontFamily: "'Caveat', cursive", fontSize: '16px' }}
                      disabled={isUploading}
                    />
                  </div>

                  {/* Upload progress */}
                  {isUploading && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={reduceMotion ? '' : 'animate-spin'}>
                          📷
                        </span>
                        <span style={{ fontFamily: "'Patrick Hand', cursive" }}>
                          Uploading photos... {uploadProgress}%
                        </span>
                      </div>
                      <div className="h-2 bg-pink-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-pink-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowAddModal(false); resetForm(); }}
                      disabled={isUploading}
                      className="flex-1 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg disabled:opacity-50"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="flex-1 py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-lg shadow-md disabled:opacity-50"
                      style={{ fontFamily: "'Patrick Hand', cursive", boxShadow: '0 3px 0 #be185d' }}
                    >
                      {isUploading ? "Saving..." : "Save Memory 💕"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Caption area */}
              <p 
                className="text-center mt-3 text-gray-500"
                style={{ fontFamily: "'Caveat', cursive" }}
              >
                A moment to remember forever ♥
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Memory Modal - Full screen gallery */}
      <AnimatePresence>
        {viewingMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
            onClick={() => setViewingMilestone(null)}
          >
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: 2 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white p-4 shadow-2xl relative my-8 gpu-accelerate"
            >
              {/* Washi tape decorations */}
              <div className="absolute -top-3 left-16 w-20 h-6 bg-gradient-to-r from-pink-300 to-pink-200 opacity-80" style={{ transform: 'rotate(-8deg)' }} />
              <div className="absolute -top-3 right-16 w-16 h-6 bg-gradient-to-r from-teal-200 to-emerald-200 opacity-80" style={{ transform: 'rotate(6deg)' }} />

              {/* Header */}
              <div className="bg-[#fdf6e3] p-4 mb-4 rounded">
                <h2 
                  className="text-3xl text-gray-800 mb-2"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  {viewingMilestone.title}
                </h2>
                <p 
                  className="text-pink-600"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  📅 {new Date(viewingMilestone.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* All Photos Grid */}
              {viewingMilestone.photos && viewingMilestone.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {viewingMilestone.photos.map((photo, idx) => (
                    <div 
                      key={idx}
                      className="aspect-square overflow-hidden cursor-pointer rounded shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => openPhotoViewer(viewingMilestone.photos || [], idx)}
                    >
                      <OptimizedImage 
                        src={photo} 
                        alt={`Memory ${idx + 1}`}
                        className={`w-full h-full object-cover ${reduceMotion ? '' : 'hover:scale-105 transition-transform duration-300'}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#fdf6e3] aspect-video flex items-center justify-center mb-4 rounded">
                  <div className="text-center">
                    <span className="text-6xl">📷</span>
                    <p 
                      className="text-gray-400 mt-2"
                      style={{ fontFamily: "'Patrick Hand', cursive" }}
                    >
                      Memory captured in our hearts
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {viewingMilestone.description && (
                <div className="bg-amber-50 p-4 rounded-lg border border-dashed border-amber-200 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">📝</span>
                    <p 
                      className="text-gray-600 flex-1"
                      style={{ fontFamily: "'Caveat', cursive", fontSize: '18px', lineHeight: '1.6' }}
                    >
                      "{viewingMilestone.description}"
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { removeMilestone({ id: viewingMilestone._id }); setViewingMilestone(null); }}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Delete Memory 🗑️
                </button>
                <button
                  onClick={() => setViewingMilestone(null)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: "'Patrick Hand', cursive" }}
                >
                  Close
                </button>
              </div>

              {/* Decorative stickers */}
              <span className="absolute -bottom-4 -right-4 text-4xl" style={{ transform: 'rotate(15deg)' }}>💕</span>
              <span className="absolute -bottom-2 left-4 text-2xl">✨</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Photo Viewer - Using Portal to render at document body */}
      {photoViewerData && createPortal(
        <div
          id="photo-viewer-overlay"
          onClick={closePhotoViewer}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0
          }}
        >
          {/* Prev button */}
          <button
            onClick={(e) => { e.stopPropagation(); navigatePhoto('prev'); }}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.25)',
              color: '#fff',
              fontSize: 28,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ‹
          </button>

          {/* Next button */}
          <button
            onClick={(e) => { e.stopPropagation(); navigatePhoto('next'); }}
            style={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.25)',
              color: '#fff',
              fontSize: 28,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ›
          </button>

          {/* Close button */}
          <button
            onClick={closePhotoViewer}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.35)',
              color: '#fff',
              fontSize: 28,
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>

          {/* Counter */}
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: 999,
              fontFamily: "'Patrick Hand', cursive",
              fontSize: 16
            }}
          >
            {photoViewerData.currentIndex + 1} / {photoViewerData.photos.length}
          </div>

          {/* The Image */}
          <img
            src={photoViewerData.photos[photoViewerData.currentIndex]}
            alt="Full size"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '85%',
              objectFit: 'contain'
            }}
          />
        </div>,
        document.body
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');
        
        /* GPU acceleration for smoother animations */
        .gpu-accelerate {
          transform: translateZ(0);
          backface-visibility: hidden;
          will-change: transform, opacity;
        }
        
        /* Gentle pulse animation for desktop */
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
        
        /* Reduce animations for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-gentle,
          .animate-spin {
            animation: none;
          }
          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
