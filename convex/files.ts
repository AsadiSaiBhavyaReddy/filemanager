import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { ConvexError } from "convex/values";
import { fileTypes } from "./schema";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("You must be logged in to upload a file");
  }
  return await ctx.storage.generateUploadUrl();
});

async function hasAccessToOrg(ctx: QueryCtx | MutationCtx, orgId: string) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("You must be logged in to access this organization.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first();

  if (!user) {
    return null;
  }

  // Check if user has access to the organization
  const hasAccess = user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId);
  return hasAccess ? { user } : null;
}

export const createFile = mutation({
  args: {
    name: v.string(),
    fileId: v.id("_storage"),
    orgId: v.string(), // Ensure orgId is passed
    type: fileTypes,
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);
    if (!hasAccess) {
      throw new ConvexError("You do not have access to this organization.");
    }

    await ctx.db.insert("files", {
      name: args.name,
      orgId: args.orgId,
      fileId: args.fileId,
      type: args.type,
    });
  },
});

export const getFiles = query({
  args: {
    orgId: v.string(),
    query: v.optional(v.string()),
    favorite: v.optional(v.boolean()),
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);
    if (!hasAccess) {
      throw new ConvexError("You do not have access to this organization.");
    }

    let files = await ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    if (args.query) {
      files = files.filter((file) => file.name.toLowerCase().includes(args.query!.toLowerCase()));
    }

    if (args.favorite) {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_userId_orgId_fileId", (q) =>
          q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
        )
        .collect();

      files = files.filter((file) => favorites.some((favorite) => favorite.fileId === file._id));
    }

    return files;
  },
});

export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const access = await hasAccessToFile(ctx, args.fileId);
    if (!access) {
      throw new ConvexError("You do not have access to delete this file.");
    }

    await ctx.db.delete(args.fileId);
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  async handler(ctx, args) {
    return ctx.storage.getUrl(args.storageId);
  },
});

export const getAllFavorites = query({
  args: { orgId: v.string() },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);
    if (!hasAccess) {
      return [];
    }

    return await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
      )
      .collect();
  },
});

async function hasAccessToFile(ctx: QueryCtx | MutationCtx, fileId: Id<"files">) {
  const file = await ctx.db.get(fileId);
  if (!file) {
    return null;
  }

  const hasAccess = await hasAccessToOrg(ctx, file.orgId);
  return hasAccess ? { user: hasAccess.user, file } : null;
}

export const toggleFavorite = mutation({
  args: { fileId: v.id("files"), orgId: v.string() },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);
    if (!hasAccess) {
      throw new ConvexError("You do not have access to this organization.");
    }

    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId).eq("fileId", args.fileId)
      )
      .first();

    if (existingFavorite) {
      await ctx.db.delete(existingFavorite._id);
      return { favorite: false };
    } else {
      await ctx.db.insert("favorites", {
        userId: hasAccess.user._id,
        orgId: args.orgId,
        fileId: args.fileId,
      });
      return { favorite: true };
    }
  },
});
