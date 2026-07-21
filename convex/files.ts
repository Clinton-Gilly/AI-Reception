import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Return an upload URL to upload a file directly to Convex storage
    return await ctx.storage.generateUploadUrl();
  },
});
