"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { signOut as fbSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Calendar30, { CalendarEvent } from "@/components/Calendar30";
import PostScheduleModal from "@/components/PostScheduleModal";
import InstagramConnection from "@/components/InstagramConnection";
import { format, addMonths, subMonths } from "date-fns";
import { FaChevronLeft, FaChevronRight, FaSignOutAlt, FaCalendarAlt, FaInstagram } from "react-icons/fa";
import { getScheduledPosts, deleteScheduledPost } from "@/lib/firestore";
import type { ScheduledPost } from "@/types/schedule";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Beautiful gradient background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5 pointer-events-none" />
      
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/20 animate-slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-instagram shadow-instagram">
                <FaInstagram className="text-2xl text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text-instagram">InstaScheduler</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm">
                {user.photoURL && user.photoURL.trim() !== "" ? (
                  <img 
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "User")}&background=e1306c&color=fff`;
                    }}
                  />
                ) : (
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "User")}&background=e1306c&color=fff`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">{user.displayName || user.email}</span>
              </div>
              
              <button
                className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
                onClick={async () => {
                  await fbSignOut(auth);
                  router.replace("/login");
                }}
              >
                <FaSignOutAlt className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <InstagramConnection />
            
            <div className="card-modern p-6 hover-lift">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                    <FaCalendarAlt className="text-white text-sm" />
                  </div>
                  Quick Stats
                </h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Scheduled Posts</span>
                    <span className="text-2xl font-bold gradient-text">0</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Published This Month</span>
                    <span className="text-2xl font-bold text-blue-600">0</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Success Rate</span>
                    <span className="text-2xl font-bold text-green-600">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Calendar Area */}
          <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
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
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const { user } = useAuth();

  // Load events from Firestore
  useEffect(() => {
    if (!user) return;
    
    const loadEvents = async () => {
      try {
        // Check for and migrate localStorage data if it exists
        const localPosts = localStorage.getItem("scheduled_posts");
        if (localPosts) {
          const parsedPosts = JSON.parse(localPosts);
          if (parsedPosts.length > 0) {
            // Import saveScheduledPost here to avoid circular imports
            const { saveScheduledPost } = await import("@/lib/firestore");
            
            for (const post of parsedPosts) {
              try {
                await saveScheduledPost(user.uid, {
                  caption: post.caption,
                  mediaUrl: post.mediaUrl,
                  mediaType: post.mediaType,
                  scheduledAt: post.scheduledAt,
                  status: post.status || "pending",
                });
              } catch (migrateError) {
                console.error("Failed to migrate post:", post.id, migrateError);
              }
            }
            
            // Clear localStorage after successful migration
            localStorage.removeItem("scheduled_posts");
          }
        }

        const scheduledPosts = await getScheduledPosts(user.uid);
        const calendarEvents = scheduledPosts.map((post) => ({
          id: post.id || "",
          title: post.caption || "Instagram Post",
          date: new Date(post.scheduledAt),
          mediaUrl: post.mediaUrl,
          mediaType: post.mediaType,
          status: post.status,
        }));
        setPosts(scheduledPosts);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load scheduled posts:", error);
      }
    };

    loadEvents();
  }, [user]); // Refresh when user changes

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setEditingPost(null); // Clear any editing state when selecting a new date
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setMonth(direction === "prev" ? subMonths(month, 1) : addMonths(month, 1));
  };

  const handleDeletePost = async (postId: string) => {
    try {
      console.log("🗑️ Deleting post:", postId);
      await deleteScheduledPost(postId);
      console.log("✅ Post deleted successfully from Firestore:", postId);
      
      // Refresh events by updating the refresh key
      setPosts(posts.filter(post => post.id !== postId));
      
      // Show success message
      alert("✅ Post deleted successfully!");
    } catch (error) {
      console.error("❌ Failed to delete post:", error);
      alert("❌ Failed to delete post. Please try again.");
    }
  };

  const handleEditPost = (event: CalendarEvent) => {
    const post = posts.find(p => p.id === event.id);
    if (post) {
      setEditingPost(post);
      setSelectedDate(new Date(post.scheduledAt));
    }
  };

  const loadPosts = async () => {
    if (!user) return;
    try {
      const scheduledPosts = await getScheduledPosts(user.uid);
      setPosts(scheduledPosts);
    } catch (error) {
      console.error("Failed to load posts:", error);
    }
  };

  const handleModalClose = () => {
    setSelectedDate(null);
    setEditingPost(null);
    loadPosts(); // Reload posts after closing modal
  };

  const handleModalSuccess = () => {
    setSelectedDate(null);
    setEditingPost(null);
    loadPosts(); // Reload posts after successful submission
  };

  return (
    <div className="card-modern overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
              <FaCalendarAlt className="text-2xl text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Content Calendar</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-1">
              <button
                className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
                onClick={() => navigateMonth("prev")}
              >
                <FaChevronLeft className="text-lg" />
              </button>
              
              <h3 className="text-lg font-semibold min-w-[160px] text-center text-white px-3">
                {format(month, "MMMM yyyy")}
              </h3>
              
              <button
                className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white"
                onClick={() => navigateMonth("next")}
              >
                <FaChevronRight className="text-lg" />
              </button>
            </div>
            
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FaInstagram className="text-lg" />
              Schedule Post
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <Calendar30 
          month={month} 
          onSelectDate={handleSelectDate} 
          events={posts.map((post) => ({
            id: post.id || "",
            title: post.caption || "Instagram Post",
            date: new Date(post.scheduledAt),
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType,
            status: post.status,
          }))}
          onDeletePost={handleDeletePost}
          onEditPost={handleEditPost}
        />
      </div>

      {selectedDate && (
        <PostScheduleModal
          open={!!selectedDate}
          onClose={handleModalClose}
          onPostScheduled={handleModalSuccess}
          selectedDate={selectedDate}
          editPost={editingPost}
        />
      )}
    </div>
  );
}


