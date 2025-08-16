import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    console.log("Access token available:", !!accessToken);
    console.log("Access token length:", accessToken?.length || 0);
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: "Access token not configured",
        debug: "FACEBOOK_ACCESS_TOKEN environment variable is missing"
      }, { status: 500 });
    }

    // Get Facebook Pages with Instagram accounts
    const response = await axios.get("https://graph.facebook.com/v18.0/me/accounts", {
      params: {
        access_token: accessToken,
        fields: "id,name,instagram_business_account{id,username,media_count}",
      },
    });

    const pages = response.data.data;
    const instagramAccounts = pages
      .filter((page: any) => page.instagram_business_account)
      .map((page: any) => ({
        pageId: page.id,
        pageName: page.name,
        instagram: {
          ...page.instagram_business_account,
          account_type: "BUSINESS", // Instagram Business accounts are always business type
        },
      }));

    return NextResponse.json({ accounts: instagramAccounts });
  } catch (error: any) {
    console.error("Instagram accounts error:", error?.response?.data || error);
    return NextResponse.json(
      { 
        error: "Failed to fetch Instagram accounts",
        details: error?.response?.data?.error?.message || error?.message 
      }, 
      { status: 500 }
    );
  }
}
