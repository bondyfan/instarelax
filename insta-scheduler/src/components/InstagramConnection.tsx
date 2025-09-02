"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { FaInstagram, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { db } from "@/lib/firestore";
import { doc, setDoc } from "firebase/firestore";

type ConnectionStatus = "disconnected" | "connected" | "error";

interface InstagramData {
  username?: string;
  accountType?: string;
  accessToken?: string;
  igUserId?: string;
}

// Helper function to save Instagram connection to Firestore
const saveInstagramConnection = async (userId: string, connectionData: InstagramData) => {
  try {
    await setDoc(doc(db, "instagram_connections", userId), {
      ...connectionData,
      userId,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.error("Failed to save Instagram connection:", error);
  }
};

export default function InstagramConnection() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [instagramData, setInstagramData] = useState<InstagramData>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check URL params for Instagram connection results
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    
    if (success === "instagram_connected") {
      const token = urlParams.get("token");
      const username = urlParams.get("username");
      const accountType = urlParams.get("account_type");
      const igUserId = urlParams.get("ig_user_id");
      
      if (token && username && user) {
        const connectionData = { username, accountType: accountType || "", accessToken: token, igUserId: igUserId || "" };
        setInstagramData(connectionData);
        setStatus("connected");
        
        // Store in localStorage and Firestore
        localStorage.setItem("instagram_connection", JSON.stringify(connectionData));
        saveInstagramConnection(user.uid, connectionData);
        
        // Clean up URL
        window.history.replaceState({}, "", "/dashboard");
      }
    } else if (error) {
      setStatus("error");
      setTimeout(() => setStatus("disconnected"), 3000);
    }
    
    // Check existing connection from localStorage
    const stored = localStorage.getItem("instagram_connection");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setInstagramData(data);
        setStatus("connected");
      } catch {
        localStorage.removeItem("instagram_connection");
      }
    }
  }, [user]);

  const handleConnect = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch Instagram accounts using the server access token
      const response = await fetch("/api/instagram/accounts");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch accounts");
      }
      
      if (data.accounts && data.accounts.length > 0) {
        const account = data.accounts[0]; // Use first account
        const connectionData = {
          username: account.instagram.username,
          accountType: account.instagram.account_type,
          igUserId: account.instagram.id,
          pageId: account.pageId,
          pageName: account.pageName,
        };
        
        setInstagramData(connectionData);
        setStatus("connected");
        localStorage.setItem("instagram_connection", JSON.stringify(connectionData));
        
        // Also save to Firestore for Functions access
        if (user) {
          saveInstagramConnection(user.uid, connectionData);
        }
      } else {
        setStatus("error");
        setTimeout(() => setStatus("disconnected"), 3000);
      }
    } catch (error: unknown) {
      console.error("Connection error:", error);
      setStatus("error");
      setTimeout(() => setStatus("disconnected"), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("instagram_connection");
    setInstagramData({});
    setStatus("disconnected");
  };

  return (
    <div className="card-modern overflow-hidden hover-lift">
      <div className="bg-gradient-instagram p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <FaInstagram className="text-2xl" />
          </div>
          <h3 className="text-xl font-bold">Instagram Connection</h3>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {status === "disconnected" && (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-instagram p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <FaInstagram className="text-3xl gradient-text-instagram" />
                </div>
              </div>
              <p className="text-gray-600 mb-6">Connect your Instagram Business account to start publishing posts automatically</p>
              <button 
                onClick={handleConnect} 
                disabled={loading}
                className="btn-instagram w-full max-w-xs mx-auto flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <FaInstagram className="text-lg" />
                    Connect Instagram
                  </>
                )}
              </button>
            </div>
          )}
          
          {status === "connected" && (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 p-1">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <FaCheckCircle className="text-3xl text-green-500" />
                </div>
              </div>
              <h4 className="font-semibold text-lg text-gray-800 mb-1">Successfully Connected!</h4>
              <div className="space-y-3 text-sm bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium text-gray-800">@{instagramData.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Account Type:</span>
                  <span className="font-medium text-gray-800 capitalize">{instagramData.accountType}</span>
                </div>
              </div>
              <button 
                onClick={handleDisconnect}
                className="text-red-500 hover:text-red-600 font-medium text-sm"
              >
                Disconnect Account
              </button>
            </div>
          )}
          
          {status === "error" && (
            <div className="text-center py-4 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-400 to-pink-500 p-1">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <FaExclamationTriangle className="text-3xl text-red-500" />
                </div>
              </div>
              <h4 className="font-semibold text-lg text-gray-800 mb-2">Connection Failed</h4>
              <p className="text-gray-600 text-sm mb-4">
                Please make sure you have an Instagram Business account connected to a Facebook Page
              </p>
              <button 
                onClick={handleConnect}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function useInstagramConnection() {
  const [instagramData, setInstagramData] = useState<InstagramData>({});
  
  useEffect(() => {
    const stored = localStorage.getItem("instagram_connection");
    if (stored) {
      try {
        setInstagramData(JSON.parse(stored));
      } catch {
        localStorage.removeItem("instagram_connection");
      }
    }
  }, []);
  
  return instagramData;
}
