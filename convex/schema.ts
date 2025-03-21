import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define allowed file types
export const fileTypes = v.union(
  v.literal("image"),
  v.literal("csv"),
  v.literal("pdf")
);

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: v.optional(fileTypes), // Ensure type is optional
    orgId: v.string(),
    fileId: v.id("_storage"),
  })
    .index("by_orgId", ["orgId"])
    .index("by_fileId", ["fileId"]), // Added index for better retrieval

  favorites: defineTable({
    fileId: v.id("files"),
    orgId: v.string(),
    userId: v.id("users"),
  })
    .index("by_userId_orgId_fileId", ["userId", "orgId", "fileId"])
    .index("by_fileId", ["fileId"]), // Allows quick lookup for a file's favorite status

  users: defineTable({
    tokenIdentifier: v.string(),
    orgIds: v.array(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
});
