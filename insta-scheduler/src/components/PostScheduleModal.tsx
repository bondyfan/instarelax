"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { FaImage, FaVideo, FaUpload, FaTimes } from "react-icons/fa";
import Modal from "./Modal";
import Button from "./ui/Button";
import { uploadMediaAndGetUrl } from "@/lib/storage";
import { useInstagramConnection } from "./InstagramConnection";
import axios from "axios";

interface PostScheduleModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onPostScheduled?: () => void;
}

export default function PostScheduleModal({
  open,
  onClose,
  selectedDate,
  onPostScheduled,
}: PostScheduleModalProps) {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [time, setTime] = useState("09:00");
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const instagramData = useInstagramConnection();

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-detect media type
      if (selectedFile.type.startsWith("video/")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate || !file || !caption.trim()) return;
    
    setSubmitting(true);
    try {
      // Upload media to Firebase Storage
      const { url } = await uploadMediaAndGetUrl({ 
        file, 
        pathPrefix: "scheduled" 
      });
      
      const [hours, minutes] = time.split(":").map((n) => parseInt(n, 10));
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Try to publish to Instagram immediately if connected
      if (instagramData.igUserId) {
        try {
          const publishResponse = await axios.post("/api/instagram/publish", {
            igUserId: instagramData.igUserId,
            mediaUrl: url,
            caption,
            mediaType,
          });
          
          if (publishResponse.data.success) {
            alert("Post published to Instagram successfully!");
          }
        } catch (error: any) {
          console.error("Publish error:", error);
          alert(`Failed to publish: ${error.response?.data?.details || error.message}`);
        }
      } else {
        // Save for later if not connected
        const savedPosts = JSON.parse(localStorage.getItem("scheduled_posts") || "[]");
        const newPost = {
          id: Date.now().toString(),
          caption,
          mediaUrl: url,
          mediaType,
          scheduledAt: scheduledAt.getTime(),
          status: "pending",
          createdAt: Date.now(),
        };
        
        savedPosts.push(newPost);
        localStorage.setItem("scheduled_posts", JSON.stringify(savedPosts));
        
        alert(`Post scheduled for ${format(scheduledAt, "PPp")}! Connect Instagram to publish automatically.`);
      }
      
      // Reset form
      setCaption("");
      setFile(null);
      setPreviewUrl(null);
      setTime("09:00");
      onPostScheduled?.();
      onClose();
      
    } catch (error: any) {
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
      title={`Schedule Post for ${selectedDate ? format(selectedDate, "EEEE, MMMM d") : ""}`}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Media</label>
          
          {!file ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FaUpload className="mx-auto text-3xl text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Click to upload photo or video</p>
              <p className="text-sm text-gray-500">PNG, JPG, MP4, MOV up to 100MB</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {mediaType === "image" ? (
                  previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">Loading preview...</span>
                    </div>
                  )
                ) : (
                  previewUrl ? (
                    <video 
                      src={previewUrl} 
                      className="w-full h-64 object-cover"
                      controls
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">Loading preview...</span>
                    </div>
                  )
                )}
              </div>
              
              <button
                onClick={removeFile}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              >
                <FaTimes className="w-3 h-3" />
              </button>
              
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                {mediaType === "image" ? <FaImage /> : <FaVideo />}
                <span>{file.name}</span>
                <span className="text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Caption</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            placeholder="Write your caption..."
            maxLength={2200}
          />
          <div className="text-right text-sm text-gray-500">
            {caption.length}/2200
          </div>
        </div>

        {/* Time Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Time</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Media Type Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Media Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mediaType"
                checked={mediaType === "image"}
                onChange={() => setMediaType("image")}
                className="text-blue-600 focus:ring-blue-500"
              />
              <FaImage className="text-gray-600" />
              <span className="text-sm">Image</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mediaType"
                checked={mediaType === "video"}
                onChange={() => setMediaType("video")}
                className="text-blue-600 focus:ring-blue-500"
              />
              <FaVideo className="text-gray-600" />
              <span className="text-sm">Video</span>
            </label>
          </div>
        </div>

        {/* Publishing Notice */}
        {instagramData.igUserId ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              ✅ Connected to @{instagramData.username}. Posts will be published directly to Instagram!
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Instagram not connected. Posts will be saved but not published.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
                      <Button
              onClick={handleSubmit}
              disabled={submitting || !file || !caption.trim()}
            >
              {submitting ? "Publishing..." : instagramData.igUserId ? "Publish to Instagram" : "Save Post"}
            </Button>
        </div>
      </div>
    </Modal>
  );
}
