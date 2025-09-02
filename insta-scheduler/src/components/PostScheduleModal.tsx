"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { FaImage, FaVideo, FaUpload, FaTimes, FaInstagram, FaCheckCircle, FaExclamationTriangle, FaCrop } from "react-icons/fa";
import Modal from "./Modal";
import { uploadMediaAndGetUrl } from "@/lib/storage";
import { useInstagramConnection } from "./InstagramConnection";
import { useAuth } from "./AuthProvider";
import { saveScheduledPost, updateScheduledPost } from "@/lib/firestore";
import axios from "axios";
import ImageCropper from "./ImageCropper";
import { ScheduledPost } from "@/types/schedule";

interface PostScheduleModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onPostScheduled?: () => void;
  editPost?: ScheduledPost | null;
}

export default function PostScheduleModal({
  open,
  onClose,
  selectedDate,
  onPostScheduled,
  editPost,
}: PostScheduleModalProps) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [time, setTime] = useState("09:00");
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instagramData = useInstagramConnection();
  const { user } = useAuth();

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // Populate form when editing
  useEffect(() => {
    if (editPost) {
      setCaption(editPost.caption);
      setMediaType(editPost.mediaType);
      setPreviewUrl(editPost.mediaUrl);
      const date = new Date(editPost.scheduledAt);
      setTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
    } else {
      // Reset form when not editing
      setCaption("");
      setFile(null);
      setPreviewUrl(null);
      setTime("09:00");
      setMediaType("image");
    }
  }, [editPost]);

  const checkAspectRatio = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("video/")) {
        resolve(true); // Skip AR check for videos
        return;
      }

      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        // Instagram allowed aspect ratios: 1:1 (square), 4:5 (portrait), 1.91:1 (landscape)
        const isValidRatio = 
          (aspectRatio >= 0.99 && aspectRatio <= 1.01) || // Square (1:1)
          (aspectRatio >= 0.79 && aspectRatio <= 0.81) || // Portrait (4:5)
          (aspectRatio >= 1.89 && aspectRatio <= 1.93);   // Landscape (1.91:1)
        
        resolve(isValidRatio);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Auto-detect media type
      if (selectedFile.type.startsWith("video/")) {
        setMediaType("video");
        setFile(selectedFile);
      } else {
        setMediaType("image");
        // Check aspect ratio for images
        const isValidRatio = await checkAspectRatio(selectedFile);
        if (!isValidRatio) {
          // Show cropper for invalid aspect ratios
          const url = URL.createObjectURL(selectedFile);
          setTempImageUrl(url);
          setShowCropper(true);
        } else {
          setFile(selectedFile);
        }
      }
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    // Convert blob to file
    const croppedFile = new File([croppedBlob], "cropped-image.jpg", {
      type: "image/jpeg",
    });
    setFile(croppedFile);
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
    setShowCropper(false);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !caption.trim() || !user) return;
    if (!editPost && !file) return; // For new posts, file is required
    
    setSubmitting(true);
    try {
      let mediaUrl = editPost?.mediaUrl || "";
      
      // Only upload new file if one was selected
      if (file) {
        const { url } = await uploadMediaAndGetUrl({ 
          file, 
          pathPrefix: "scheduled" 
        });
        mediaUrl = url;
      }
      
      const [hours, minutes] = time.split(":").map((n) => parseInt(n, 10));
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      let postStatus: "pending" | "published" | "failed" = "pending";
      let alertMessage = "";

      // Check if this is scheduled for the future or for immediate posting
      const now = new Date();
      const isFuturePost = scheduledAt > now;

      if (editPost) {
        // Update existing post
        await updateScheduledPost(editPost.id, {
          caption,
          mediaUrl,
          mediaType,
          scheduledAt: scheduledAt.getTime(),
        });
        alertMessage = `Post updated successfully!`;
      } else {
        // Create new post
        if (instagramData.igUserId && !isFuturePost) {
          // Publish immediately only if scheduled for now or past
          try {
            const publishResponse = await axios.post("/api/instagram/publish", {
              igUserId: instagramData.igUserId,
              mediaUrl,
              caption,
              mediaType,
            });
            
            if (publishResponse.data.success) {
              postStatus = "published";
              alertMessage = "Post published to Instagram successfully!";
            } else {
              postStatus = "failed";
              alertMessage = "Failed to publish to Instagram";
            }
          } catch (error: unknown) {
            console.error("Publish error:", error);
            postStatus = "failed";
            const err = error as { response?: { data?: { details?: string } }; message?: string };
            alertMessage = `Failed to publish: ${err.response?.data?.details || err.message || "Unknown error"}`;
          }
        } else if (instagramData.igUserId && isFuturePost) {
          // Save for future automatic publishing
          alertMessage = `Post scheduled for ${format(scheduledAt, "PPp")}! It will be automatically published to Instagram at the scheduled time.`;
        } else {
          // No Instagram connection
          alertMessage = `Post scheduled for ${format(scheduledAt, "PPp")}! Connect Instagram to enable automatic publishing.`;
        }

        // Save to Firestore for calendar display
        await saveScheduledPost(user.uid, {
          caption,
          mediaUrl,
          mediaType,
          scheduledAt: scheduledAt.getTime(),
          status: postStatus,
        });
      }
      
      alert(alertMessage);
      
      // Reset form
      setCaption("");
      setFile(null);
      setPreviewUrl(null);
      setTime("09:00");
      onPostScheduled?.();
      onClose();
      
    } catch (error: unknown) {
      console.error("Schedule error:", error);
      alert("Failed to schedule post");
    } finally {
      setSubmitting(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Modal 
      open={open} 
      onClose={onClose} 
      title=""
      size="lg"
    >
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-6 -m-6 mb-0">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FaInstagram className="text-3xl" />
          {editPost ? "Edit" : "Schedule"} Post for {selectedDate ? format(selectedDate, "EEEE, MMMM d") : ""}
        </h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            Upload Media
          </label>
          
          {!file && !editPost?.mediaUrl ? (
            <div 
              className="border-3 border-dashed border-purple-300 rounded-2xl p-12 text-center hover:border-purple-400 transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <FaUpload className="text-3xl gradient-text-instagram" />
              </div>
              <p className="text-gray-700 font-medium mb-2 text-lg">Drop your photo or video here</p>
              <p className="text-sm text-gray-500">or click to browse • PNG, JPG, MP4, MOV up to 100MB</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative animate-slide-up">
              <div className="rounded-2xl overflow-hidden shadow-lg">
                {mediaType === "image" ? (
                  previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-80 object-cover"
                    />
                  ) : (
                    <div className="w-full h-80 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                  )
                ) : (
                  previewUrl ? (
                    <video 
                      src={previewUrl} 
                      className="w-full h-80 object-cover"
                      controls
                    />
                  ) : (
                    <div className="w-full h-80 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                    </div>
                  )
                )}
              </div>
              
              {file && (
                <>
                  <button
                    onClick={removeFile}
                    className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-3 hover:bg-red-600 transition-all hover:scale-110 shadow-lg"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                  
                  {mediaType === "image" && (
                    <button
                      onClick={() => {
                        if (previewUrl) {
                          setTempImageUrl(previewUrl);
                          setShowCropper(true);
                        }
                      }}
                      className="absolute top-4 right-20 bg-purple-500 text-white rounded-full p-3 hover:bg-purple-600 transition-all hover:scale-110 shadow-lg"
                      title="Crop image"
                    >
                      <FaCrop className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
              
              <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`p-2 rounded-lg ${mediaType === "image" ? "bg-purple-100" : "bg-blue-100"}`}>
                  {mediaType === "image" ? <FaImage className="text-purple-600" /> : <FaVideo className="text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 truncate">{file?.name || "Existing media"}</p>
                  <p className="text-sm text-gray-500">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : ""}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="space-y-3">
          <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            Write Caption
          </label>
          <div className="relative">
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl p-4 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 resize-none transition-all text-gray-700 placeholder-gray-400"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              placeholder="What's on your mind? Share your story..."
              maxLength={2200}
            />
            <div className="absolute bottom-3 right-3 text-sm font-medium">
              <span className={caption.length > 2000 ? "text-red-500" : "text-gray-400"}>
                {caption.length}
              </span>
              <span className="text-gray-400">/2200</span>
            </div>
          </div>
        </div>

        {/* Time & Type Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Time Selection */}
          <div className="space-y-3">
            <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              Select Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
            />
          </div>

          {/* Media Type Selection */}
          <div className="space-y-3">
            <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">4</span>
              </div>
              Media Type
            </label>
            <div className="flex gap-2">
              <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-3 rounded-xl border-2 transition-all ${mediaType === "image" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="mediaType"
                  checked={mediaType === "image"}
                  onChange={() => setMediaType("image")}
                  className="sr-only"
                />
                <FaImage className={mediaType === "image" ? "text-purple-600" : "text-gray-500"} />
                <span className={`text-sm font-medium ${mediaType === "image" ? "text-purple-700" : "text-gray-600"}`}>Image</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer p-3 rounded-xl border-2 transition-all ${mediaType === "video" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input
                  type="radio"
                  name="mediaType"
                  checked={mediaType === "video"}
                  onChange={() => setMediaType("video")}
                  className="sr-only"
                />
                <FaVideo className={mediaType === "video" ? "text-blue-600" : "text-gray-500"} />
                <span className={`text-sm font-medium ${mediaType === "video" ? "text-blue-700" : "text-gray-600"}`}>Video</span>
              </label>
            </div>
          </div>
        </div>

        {/* Publishing Notice */}
        {instagramData.igUserId ? (
          <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse-soft">
                <FaCheckCircle className="text-white text-lg" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Ready to Publish!</p>
                <p className="text-sm text-green-700">Connected to @{instagramData.username}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                <FaExclamationTriangle className="text-white text-lg" />
              </div>
              <div>
                <p className="font-semibold text-yellow-900">Instagram Not Connected</p>
                <p className="text-sm text-yellow-700">Post will be saved but not published automatically</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting || (!file && !editPost) || !caption.trim()}
            className={`
              px-8 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              ${instagramData.igUserId 
                ? "bg-gradient-instagram text-white shadow-instagram hover:shadow-xl" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl"
              }
            `}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Publishing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FaInstagram className="text-lg" />
                {editPost ? "Update Post" : (instagramData.igUserId ? "Publish to Instagram" : "Save Post")}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Image Cropper Modal */}
      {showCropper && tempImageUrl && (
        <ImageCropper
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            if (tempImageUrl) {
              URL.revokeObjectURL(tempImageUrl);
              setTempImageUrl(null);
            }
          }}
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
        />
      )}
    </Modal>
  );
}
