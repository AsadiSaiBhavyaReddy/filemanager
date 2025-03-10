"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { FileCard } from "./file-card"; // Assuming FileCard is the correct component for displaying files

export default function Home() {
  const organization = useOrganization();
  const user = useUser();

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  console.log("Organization Loaded:", organization.isLoaded);
  console.log("User Loaded:", user.isLoaded);
  console.log("Organization ID:", orgId);

  const files = useQuery(api.files.getFiles, orgId ? { orgId } : "skip");

  return (
    <main className="container mx-auto pt-12">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Your Files</h1>
        <UploadButton />
      </div>
  
      {/* Grid container for file cards */}
      <div className="grid grid-cols-4 gap-4 mt-6 mb-8">
        {files?.length ? (
          files.map((file) => (
            <FileCard key={file._id} file={file}/>
          ))
        ) : (
          <p className="col-span-4 text-center text-gray-500">No files available.</p>
        )}
      </div>
    </main>
  );
  
}
