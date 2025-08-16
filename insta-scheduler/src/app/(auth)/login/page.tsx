"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { db } from "@/lib/firestore";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { FaGoogle, FaInstagram } from "react-icons/fa";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      // Persist minimal profile client-side in Firestore
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          uid: cred.user.uid,
          displayName: cred.user.displayName ?? null,
          email: cred.user.email ?? null,
          photoURL: cred.user.photoURL ?? null,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.replace("/dashboard");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to sign in";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pink-500 to-purple-600 p-12 items-center justify-center">
        <div className="text-white text-center max-w-md">
          <FaInstagram className="text-6xl mx-auto mb-8" />
          <h1 className="text-4xl font-bold mb-4">InstaScheduler</h1>
          <p className="text-xl opacity-90 mb-8">
            Schedule your Instagram posts with ease and never miss the perfect moment to engage your audience.
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="font-semibold">📅</div>
              <div>Schedule Posts</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="font-semibold">📊</div>
              <div>Track Analytics</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="font-semibold">🎯</div>
              <div>Grow Audience</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <FaInstagram className="text-4xl text-pink-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Sign in to access your Instagram scheduler</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button
                onClick={signIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3"
                size="lg"
              >
                <FaGoogle className="text-lg" />
                {loading ? "Signing in..." : "Continue with Google"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </div>

          {/* Mobile branding */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-gray-600">
              The easiest way to schedule and manage your Instagram content
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


