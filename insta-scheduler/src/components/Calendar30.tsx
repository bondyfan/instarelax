"use client";

import { addDays, endOfMonth, format, isSameDay, startOfMonth, isToday, isBefore } from "date-fns";
import { useMemo } from "react";
import { FaImage, FaVideo } from "react-icons/fa";

export type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  mediaType?: "image" | "video";
  status?: "pending" | "published" | "failed";
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar30({
  month,
  onSelectDate,
  events,
}: {
  month: Date;
  onSelectDate: (date: Date) => void;
  events?: CalendarEvent[];
}) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const total = end.getDate();
    return Array.from({ length: total }, (_, i) => addDays(start, i));
  }, [month]);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with weekdays */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
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
            <button
              key={d.toISOString()}
              onClick={() => onSelectDate(d)}
              disabled={isPast}
              className={`
                aspect-square p-2 text-left border-r border-b border-gray-100 transition-colors
                ${isToday(d) ? "bg-blue-50 border-blue-200" : ""}
                ${isPast ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "hover:bg-gray-50"}
                ${!isPast ? "hover:bg-blue-50" : ""}
              `}
            >
              <div className={`text-sm font-medium mb-1 ${isToday(d) ? "text-blue-600" : ""}`}>
                {format(d, "d")}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className={`
                      text-xs px-1 py-0.5 rounded truncate flex items-center gap-1
                      ${e.status === "published" ? "bg-green-100 text-green-700" : ""}
                      ${e.status === "pending" ? "bg-blue-100 text-blue-700" : ""}
                      ${e.status === "failed" ? "bg-red-100 text-red-700" : ""}
                    `}
                  >
                    {e.mediaType === "image" && <FaImage className="w-2 h-2" />}
                    {e.mediaType === "video" && <FaVideo className="w-2 h-2" />}
                    <span className="truncate">{e.title}</span>
                  </div>
                ))}
                
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}


