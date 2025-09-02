"use client";

import { addDays, endOfMonth, format, isSameDay, startOfMonth, isToday, isBefore } from "date-fns";
import { useMemo, useState } from "react";
import { FaImage, FaVideo, FaTimes, FaEllipsisV } from "react-icons/fa";

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  mediaType?: "image" | "video";
  mediaUrl?: string;
  status?: "pending" | "published" | "failed";
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar30({
  month,
  onSelectDate,
  events,
  onDeletePost,
  onEditPost,
}: {
  month: Date;
  onSelectDate: (date: Date) => void;
  events?: CalendarEvent[];
  onDeletePost?: (postId: string) => void;
  onEditPost?: (event: CalendarEvent) => void;
}) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const total = end.getDate();
    return Array.from({ length: total }, (_, i) => addDays(start, i));
  }, [month]);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-inner">
      {/* Header with weekdays */}
      <div className="grid grid-cols-7 bg-gradient-to-r from-purple-50 to-pink-50">
        {weekDays.map((day) => (
          <div key={day} className="p-4 text-center text-sm font-bold text-gray-600 tracking-wide">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const dayEvents = events?.filter((e) => isSameDay(e.date, d)) || [];
          const isPast = isBefore(d, new Date()) && !isToday(d);
          
          return (
            <div
              key={d.toISOString()}
              className={`
                min-h-[140px] p-3 text-left border-r border-b border-gray-100 transition-all flex flex-col cursor-pointer group
                ${isToday(d) ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-inner" : ""}
                ${isPast ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-60" : "hover:bg-gradient-to-br hover:from-purple-50/50 hover:to-pink-50/50"}
                ${!isPast ? "hover:shadow-md" : ""}
              `}
              onClick={() => !isPast && onSelectDate(d)}
            >
              <div className={`text-sm font-bold mb-2 flex items-center justify-between ${isToday(d) ? "text-purple-600" : "text-gray-700"}`}>
                <span>{format(d, "d")}</span>
                {isToday(d) && (
                  <span className="text-xs font-medium bg-purple-500 text-white px-2 py-1 rounded-full animate-pulse-soft">
                    Today
                  </span>
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                {dayEvents.slice(0, 1).map((e) => (
                  <PostCard 
                    key={e.id} 
                    event={e} 
                    onDelete={onDeletePost}
                    onEdit={onEditPost}
                  />
                ))}
                
                {dayEvents.length > 1 && (
                  <div className="text-xs text-gray-500 px-1 flex items-center gap-1 mt-auto">
                    <FaEllipsisV className="w-2 h-2" />
                    <span>+{dayEvents.length - 1} more</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// PostCard component for displaying individual posts in calendar
function PostCard({ 
  event, 
  onDelete,
  onEdit
}: { 
  event: CalendarEvent; 
  onDelete?: (postId: string) => void;
  onEdit?: (event: CalendarEvent) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('Are you sure you want to delete this scheduled post?')) {
      onDelete(event.id);
    }
  };

  return (
    <div
      className={`
        relative group rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg
        ${event.status === "published" ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50" : ""}
        ${event.status === "pending" ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50" : ""}
        ${event.status === "failed" ? "border-red-300 bg-gradient-to-br from-red-50 to-pink-50" : ""}
      `}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={(e) => {
        e.stopPropagation(); // Prevent calendar day selection when clicking on post
        if (onEdit) {
          onEdit(event);
        }
      }}
    >
      {/* Media Preview */}
      {event.mediaUrl && !imageError ? (
        <div className="relative w-full h-16">
          {event.mediaType === "video" ? (
            <video 
              src={event.mediaUrl} 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <img 
              src={event.mediaUrl} 
              alt="Post preview"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
          
          {/* Media type indicator */}
          <div className="absolute top-1 left-1">
            {event.mediaType === "image" ? (
              <FaImage className="w-3 h-3 text-white drop-shadow-md" />
            ) : (
              <FaVideo className="w-3 h-3 text-white drop-shadow-md" />
            )}
          </div>

          {/* Delete button */}
          {showActions && onDelete && (
            <button
              onClick={handleDelete}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              title="Delete post"
            >
              <FaTimes className="w-2 h-2" />
            </button>
          )}
        </div>
      ) : (
        // Fallback when no image or image failed to load
        <div className="relative w-full h-12 flex items-center justify-center bg-gray-100">
          {event.mediaType === "image" ? (
            <FaImage className="w-4 h-4 text-gray-400" />
          ) : (
            <FaVideo className="w-4 h-4 text-gray-400" />
          )}
          
          {/* Delete button for fallback */}
          {showActions && onDelete && (
            <button
              onClick={handleDelete}
              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
              title="Delete post"
            >
              <FaTimes className="w-2 h-2" />
            </button>
          )}
        </div>
      )}

      {/* Post info */}
      <div className="p-1">
        <div className={`
          text-xs font-medium truncate
          ${event.status === "published" ? "text-green-700" : ""}
          ${event.status === "pending" ? "text-blue-700" : ""}
          ${event.status === "failed" ? "text-red-700" : ""}
        `}>
          {event.title}
        </div>
        
        {/* Status indicator */}
        <div className={`
          text-xs mt-0.5
          ${event.status === "published" ? "text-green-600" : ""}
          ${event.status === "pending" ? "text-blue-600" : ""}
          ${event.status === "failed" ? "text-red-600" : ""}
        `}>
          {event.status === "published" && "✓ Published"}
          {event.status === "pending" && "⏳ Scheduled"}
          {event.status === "failed" && "✗ Failed"}
        </div>
      </div>
    </div>
  );
}


