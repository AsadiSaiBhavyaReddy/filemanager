"use client";
import Image from "next/image";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { FileCard } from "./file-card"; 
import { SearchBar } from "./search-bar";
import { useState } from "react";
import { Loader2 } from "lucide-react";

function Placeholder() {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-24">
      <Image
        alt="an image of a picture and directory icon"
        width="300"
        height="300"
        src="/empty.svg"
      />
      <div className="text-2xl">
        You have no files, upload one now
        <UploadButton />
      </div>
    </div>
  );
}

export default function FileBrowser({
  title,
  favoritesOnly,
}: {
  title: string;
  favoritesOnly?: boolean;
}) {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  // Corrected favorites query
  const favorites = useQuery(
    api.files.getAllFavorites,
    orgId ? { orgId } : "skip"
  );
 

  const files = useQuery(
    api.files.getFiles,
    orgId ? { orgId, query, favorite: favoritesOnly } : "skip"
  );

  const isLoading = files === undefined;

  return (
    <div>
      {isLoading && (
        <div className="flex flex-col gap-8 w-full items-center mt-24">
          <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
          <div className="text-2xl">Loading your data.....</div>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{title}</h1>
            <SearchBar query={query} setQuery={setQuery} />
            <UploadButton />
          </div>

          {files.length === 0 && <Placeholder />}

          <div className="grid grid-cols-4 gap-4 mt-6 mb-8">
            {files?.length ? (
              files.map((file) => <FileCard favorites={favorites ?? []} key={file._id} file={file} />)
            ) : (
              <p className="col-span-4 text-center text-gray-500"></p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
