import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { igUserId, mediaUrl, caption, mediaType } = await req.json();
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ error: "Access token not configured" }, { status: 500 });
    }

    if (!igUserId || !mediaUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Step 1: Create media container
    const containerParams: Record<string, string> = {
      access_token: accessToken,
      caption: caption || "",
    };

    if (mediaType === "image") {
      containerParams.image_url = mediaUrl;
    } else if (mediaType === "video") {
      containerParams.video_url = mediaUrl;
      containerParams.media_type = "VIDEO";
    }

    const containerResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      containerParams
    );

    const containerId = containerResponse.data.id;

    // Step 2: Publish the container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
      {
        access_token: accessToken,
        creation_id: containerId,
      }
    );

    return NextResponse.json({
      success: true,
      mediaId: publishResponse.data.id,
      containerId,
    });

  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
    console.error("Instagram publish error:", err?.response?.data || err);
    return NextResponse.json(
      { 
        error: "Failed to publish to Instagram",
        details: err?.response?.data?.error?.message || err?.message 
      }, 
      { status: 500 }
    );
  }
}
