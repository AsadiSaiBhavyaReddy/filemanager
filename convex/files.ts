import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { ConvexError } from "convex/values";
import { getUser } from "./users";
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
    orgId: v.string(), // Ensure orgId is passed
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
        return [];
      }
    

    return ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});
