const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger, config} = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

/**
 * Scheduled function that runs every minute to check for posts
 * that need to be published to Instagram
 */
exports.publishScheduledPosts = onSchedule("every 1 minutes", async (event) => {
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
        
        // For now, we'll get Instagram details from a separate collection
        // You might need to store Instagram connection info differently
        const instagramQuery = await db.collection("instagram_connections")
          .where("userId", "==", post.userId)
          .limit(1)
          .get();
        
        if (instagramQuery.empty) {
          throw new Error(`No Instagram connection found for user ${post.userId}`);
        }
        
        const instagramData = instagramQuery.docs[0].data();
        const igUserId = instagramData.igUserId;
        
        if (!igUserId) {
          throw new Error("Instagram User ID not found");
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
    const accessToken = config().facebook.access_token;
    
    if (!accessToken) {
      throw new Error("Facebook access token not configured in Firebase config");
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
 * HTTP function to manually trigger scheduled post publishing
 * Useful for testing or manual triggering
 */
exports.triggerScheduledPosts = onSchedule("every 1 minutes", async (req, res) => {
  try {
    await exports.publishScheduledPosts();
    res.json({success: true, message: "Scheduled posts processed"});
  } catch (error) {
    logger.error("Manual trigger error:", error);
    res.status(500).json({success: false, error: error.message});
  }
});