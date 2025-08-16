"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import Button from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { FaInstagram, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

type ConnectionStatus = "disconnected" | "connected" | "error";

interface InstagramData {
  username?: string;
  accountType?: string;
  accessToken?: string;
  igUserId?: string;
}

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
      
      if (token && username) {
        setInstagramData({ username, accountType: accountType || "", accessToken: token, igUserId: igUserId || "" });
        setStatus("connected");
        
        // Store in localStorage for demo purposes
        localStorage.setItem("instagram_connection", JSON.stringify({
          username, accountType, accessToken: token, igUserId
        }));
        
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
  }, []);

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
      } else {
        setStatus("error");
        setTimeout(() => setStatus("disconnected"), 3000);
      }
    } catch (error: any) {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaInstagram className="text-pink-500" />
          Instagram Connection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status === "disconnected" && (
            <div className="text-center py-6">
              <FaInstagram className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Connect your Instagram Business account to start publishing posts</p>
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? "Connecting..." : "Connect Instagram"}
              </Button>
            </div>
          )}
          
          {status === "connected" && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <FaCheckCircle />
                <span className="font-medium">Connected</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Username:</strong> @{instagramData.username}</p>
                <p><strong>Account Type:</strong> {instagramData.accountType}</p>
              </div>
              <div className="mt-4">
                <Button variant="outline" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          )}
          
          {status === "error" && (
            <div className="text-center py-6">
              <div className="flex items-center justify-center gap-2 text-red-600 mb-4">
                <FaExclamationTriangle />
                <span className="font-medium">Connection Failed</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Please make sure you have an Instagram Business account connected to a Facebook Page
              </p>
              <Button onClick={handleConnect}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
