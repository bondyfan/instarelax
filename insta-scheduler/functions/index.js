const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

/**
 * Scheduled function that runs every minute to check for posts
 * that need to be published to Instagram
 */
exports.publishScheduledPosts = onSchedule({
  schedule: "every 1 minutes",
  secrets: ["FACEBOOK_ACCESS_TOKEN"]
}, async (event) => {
  logger.info("Checking for scheduled posts to publish...");
  
  try {
    const db = admin.firestore();
    const now = Date.now();
    
    // Query for posts that are pending and scheduled for now or earlier
    const query = await db.collection("scheduled_posts")
      .where("status", "==", "pending")
      .where("scheduledAt", "<=", now)
      .get();
    
    if (query.empty) {
      logger.info("No posts to publish at this time");
      return;
    }
    
    logger.info(`Found ${query.size} posts to publish`);
    
    const promises = query.docs.map(async (doc) => {
      const post = doc.data();
      const postId = doc.id;
      
      try {
        logger.info(`Publishing post ${postId}: ${post.caption?.slice(0, 30)}...`);
        
        // Get user's Instagram connection details
        const userDoc = await db.collection("users").doc(post.userId).get();
        if (!userDoc.exists) {
          throw new Error(`User ${post.userId} not found`);
        }
        
        // Fetch Instagram connection. First try direct doc lookup by userId (we save docs with userId as ID),
        // then fall back to query by field if needed.
        let instagramData;
        const connDoc = await db.collection("instagram_connections").doc(post.userId).get();
        if (connDoc.exists) {
          instagramData = connDoc.data();
          logger.info(`Found instagram connection by doc id for user ${post.userId}`);
        } else {
          const instagramQuery = await db.collection("instagram_connections")
            .where("userId", "==", post.userId)
            .limit(1)
            .get();

          if (instagramQuery.empty) {
            throw new Error(`No Instagram connection found for user ${post.userId}`);
          }
          instagramData = instagramQuery.docs[0].data();
          logger.info(`Found instagram connection by query for user ${post.userId}`);
        }
        const igUserId = instagramData.igUserId;
        
        if (!igUserId) {
          throw new Error(`Instagram User ID not found in instagram_connections for user ${post.userId}`);
        }
        
        // Publish to Instagram using the same logic as the API route
        const success = await publishToInstagram({
          igUserId,
          mediaUrl: post.mediaUrl,
          caption: post.caption,
          mediaType: post.mediaType,
        });
        
        if (success) {
          // Update post status to published
          await doc.ref.update({
            status: "published",
            publishedAt: now,
            updatedAt: now,
          });
          
          logger.info(`Successfully published post ${postId}`);
        } else {
          throw new Error("Instagram publish API returned failure");
        }
        
      } catch (error) {
        logger.error(`Failed to publish post ${postId}:`, error);
        
        // Update post status to failed
        await doc.ref.update({
          status: "failed",
          errorMessage: error.message,
          updatedAt: now,
        });
      }
    });
    
    await Promise.all(promises);
    logger.info("Finished processing scheduled posts");
    
  } catch (error) {
    logger.error("Error in publishScheduledPosts function:", error);
  }
});

/**
 * Publishes a post to Instagram using the Facebook Graph API
 */
async function publishToInstagram({igUserId, mediaUrl, caption, mediaType}) {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error("Facebook access token not configured as environment variable");
    }
    
    // Step 1: Create media container
    const containerParams = {
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
        containerParams,
    );
    
    const containerId = containerResponse.data.id;
    
    // Step 2: Publish the container
    const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
        {
          access_token: accessToken,
          creation_id: containerId,
        },
    );
    
    logger.info(`Instagram publish successful. Media ID: ${publishResponse.data.id}`);
    return true;
    
  } catch (error) {
    logger.error("Instagram publish error:", error?.response?.data || error);
    throw error;
  }
}

/**
 * Alternative scheduled function with same functionality
 * (Kept for redundancy but can be removed if not needed)
 */
exports.triggerScheduledPosts = onSchedule({
  schedule: "every 1 minutes",
  secrets: ["FACEBOOK_ACCESS_TOKEN"]
}, async (event) => {
  // This is redundant with publishScheduledPosts
  // Consider removing this function to avoid duplicate processing
  logger.info("Trigger function called - skipping as publishScheduledPosts handles this");
});