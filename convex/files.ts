import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getUser } from "./users";
import { fileTypes } from "./schema";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("You must be logged in to upload a file");
    }
  return await ctx.storage.generateUploadUrl();
});
async function hasAccessToOrg(
  ctx: QueryCtx|MutationCtx ,
  tokenIdentifier:string,orgId:string){
  const user = await getUser(ctx,tokenIdentifier);

  // Check if user has access to the organization
  const hasAccess =
    user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId);
 return hasAccess;
  
}
export const createFile = mutation({
  args: {
    name: v.string(),
    fileId:v.id("_storage"),
    orgId: v.string(), // Ensure orgId is passed
    type:fileTypes,
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("You must be logged in to upload a file");
    }
    const hasAccess=await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      args.orgId);
   
   
    if (!hasAccess) {
      throw new ConvexError("You do not have access to this organization");
    }
    console.log(hasAccess);
    console.log("User Token Identifier:", identity.tokenIdentifier);
   
    await ctx.db.insert("files", {
      name: args.name,
      orgId: args.orgId,
      fileId:args.fileId,
      type:args.type,
    });
  },
});

export const getFiles = query({
  args: {
    orgId: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }
    const hasAccess=await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      args.orgId);
      if (!hasAccess) {
        throw new ConvexError("You do not have access to this organization");
      }
    

    return ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});
export const deleteFile=mutation({
  args:{fileId: v.id("files")},
  async handler(ctx,args){
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("You do not have access to this organization");
    }
    const file=await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("This file doesn't exists");
    }
    const hasAccess=await hasAccessToOrg(
      ctx,
      identity.tokenIdentifier,
      file.orgId
    );
    if (!hasAccess) {
      throw new ConvexError("You donot have access to delete the file");
    }
    await ctx.db.delete(args.fileId);
   },
})