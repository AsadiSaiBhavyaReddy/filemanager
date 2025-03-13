"use client";
import Image from "next/image";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { FileCard } from "./file-card"; // Assuming FileCard is the correct component for displaying files
import { Loader2 } from "lucide-react";

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
  const isLoading = files=== undefined;
  return (
    <main className="container mx-auto pt-12">
      {isLoading  && (<div className="flex flex-col gap-8 w-full items-center mt-24">
        <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
        <div className="text-2xl">Loading your data.....</div>
      </div>

      )}
      {!isLoading &&files.length ===0 &&(
          <div className="flex flex-col gap-8 w-full items-center mt-24">
        <Image
        alt="an image of a picture and dicrectoty icon"
        width="300"
        height="300"
        src="/empty.svg"
        />
        <div className="text-2xl">
        You have no files, upload one now
        <UploadButton/>
        </div></div>)}

        {!isLoading && files.length >0 && (
          <>
           <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Your File</h1>
            <UploadButton/>
           </div>
           <div className="grid grid-cols-4 gap-4 mt-6 mb-8">
      
        {files?.length ? (
          files.map((file) => (
            <FileCard key={file._id} file={file}/>
          ))
        ) : (
          <p className="col-span-4 text-center text-gray-500"></p>
        )}
      </div>
          </>
        )}
      {/* Grid container for file cards */}
      
    </main>
  );
  
}
