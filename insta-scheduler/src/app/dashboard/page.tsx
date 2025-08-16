"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Calendar30 from "@/components/Calendar30";
import PostScheduleModal from "@/components/PostScheduleModal";
import InstagramConnection from "@/components/InstagramConnection";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { format, addMonths, subMonths } from "date-fns";
import { FaChevronLeft, FaChevronRight, FaSignOutAlt, FaCalendarAlt, FaInstagram } from "react-icons/fa";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <FaInstagram className="text-2xl text-pink-500" />
              <h1 className="text-xl font-semibold text-gray-900">InstaScheduler</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user.photoURL && user.photoURL.trim() !== "" ? (
                  <img 
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "User")}&background=3b82f6&color=fff`;
                    }}
                  />
                ) : (
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "User")}&background=3b82f6&color=fff`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{user.displayName || user.email}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await fbSignOut(auth);
                  router.replace("/login");
                }}
              >
                <FaSignOutAlt className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <InstagramConnection />
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Scheduled Posts</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Published This Month</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-semibold text-green-600">100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Calendar Area */}
          <div className="lg:col-span-2">
            <CalendarSection />
          </div>
        </div>
      </main>
    </div>
  );
}

function CalendarSection() {
  const [month, setMonth] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  // Load events from localStorage
  useEffect(() => {
    const savedPosts = JSON.parse(localStorage.getItem("scheduled_posts") || "[]");
    const calendarEvents = savedPosts.map((post: any) => ({
      id: post.id,
      date: new Date(post.scheduledAt),
      title: post.caption.slice(0, 20) + "...",
      mediaType: post.mediaType,
      status: post.status,
    }));
    setEvents(calendarEvents);
  }, [showModal]); // Refresh when modal closes

  const onSelectDate = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setMonth(direction === "prev" ? subMonths(month, 1) : addMonths(month, 1));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FaCalendarAlt className="text-blue-600" />
            Content Calendar
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <FaChevronLeft />
              </Button>
              
              <h3 className="text-lg font-medium min-w-[140px] text-center">
                {format(month, "MMMM yyyy")}
              </h3>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <FaChevronRight />
              </Button>
            </div>
            
            <Button onClick={() => setShowModal(true)}>
              Schedule Post
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Calendar30 
          month={month} 
          onSelectDate={onSelectDate} 
          events={events} 
        />
      </CardContent>

      <PostScheduleModal
        open={showModal}
        onClose={() => setShowModal(false)}
        selectedDate={selectedDate}
        onPostScheduled={() => {
          // Refresh events or handle success
          console.log("Post scheduled successfully");
        }}
      />
    </Card>
  );
}


