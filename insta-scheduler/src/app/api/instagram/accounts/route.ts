import { NextResponse } from "next/server";
import axios from "axios";

interface IgBusinessAccount {
  id: string;
  username: string;
  media_count?: number;
}

interface Page {
  id: string;
  name: string;
  instagram_business_account?: IgBusinessAccount;
}

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

    const pages: Page[] = response.data.data as Page[];
    const instagramAccounts = pages
      .filter((page) => page.instagram_business_account)
      .map((page) => ({
        pageId: page.id,
        pageName: page.name,
        instagram: {
          ...page.instagram_business_account,
          account_type: "BUSINESS", // Instagram Business accounts are always business type
        },
      }));

    return NextResponse.json({ accounts: instagramAccounts });
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
    console.error("Instagram accounts error:", err?.response?.data || err);
    return NextResponse.json(
      { 
        error: "Failed to fetch Instagram accounts",
        details: err?.response?.data?.error?.message || err?.message 
      }, 
      { status: 500 }
    );
  }
}
