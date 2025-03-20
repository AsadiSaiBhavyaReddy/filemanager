import React, { useState, ReactNode, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  FileTextIcon,
 
  GaugeIcon,
  ImageIcon,
  MoreVertical,
  StarIcon,
  TextIcon,
  TrashIcon,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toast } from "sonner";
import * as Papa from "papaparse"; // ✅ FIXED PAPAPARSE IMPORT

// ✅ Function to fetch a valid storage URL
function useFileUrl(storageId: string | undefined) {
  return useQuery(
    api.files.getFileUrl,
    storageId ? { storageId: storageId as Id<"_storage"> } : "skip"
  );
}

function FileCardActions({ file }: { file: Doc<"files"> }) {
  const deleteFile = useMutation(api.files.deleteFile);
  const toggleFavorite =useMutation(api.files.toggleFavorite);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your file.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteFile({ fileId: file._id });
                toast.success("File deleted", {
                  description: "Your file is now gone from the system.",
                });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
        <DropdownMenuItem
            onClick={() => {
              toggleFavorite({
                fileId:file._id,
              })
            }}
            className="flex items-center gap-1 cursor-pointer"
          >
            <StarIcon className="w-4 h-4" />
            Favorite
          </DropdownMenuItem>
          <DropdownMenuSeparator/>
          <DropdownMenuItem
            onClick={() => setIsConfirmOpen(true)}
            className="flex items-center gap-1 text-red-600 cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function FileCard({ file }: { file: Doc<"files"> }) {
  const fileUrl = useFileUrl(file.fileId);
  const [csvData, setCsvData] = useState<string[][] | null>(null);

  const typeIcons: Record<string, ReactNode> = {
    image: <ImageIcon />,
    pdf: <FileTextIcon />,
    csv: <GaugeIcon />,
  };

  const fileType = file.type ?? "unknown";
  const fileIcon = typeIcons[fileType] || <TextIcon />;

  // ✅ Function to parse CSV and display preview
  useEffect(() => {
    if (file.type === "csv" && fileUrl) {
      fetch(fileUrl)
        .then((response) => response.text())
        .then((csvText) => {
          const parsed = Papa.parse(csvText, { header: false });
          setCsvData(parsed.data as string[][]);
        });
    }
  }, [fileUrl, file.type]);

  // ✅ Function to handle file download
  const handleDownload = () => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader className="relative">
        <CardTitle className="flex gap-2">
          <div className="flex justify-center">{fileIcon}</div>
          {file.name}
        </CardTitle>
        <div className="absolute top-2 right-2">
          <FileCardActions file={file} />
        </div>
      </CardHeader>

      <CardContent className="h-[200px] flex justify-center items-center overflow-auto">
        {file.type === "image" && fileUrl ? (
          <img src={fileUrl} alt={file.name} className="w-32 h-32 object-cover rounded" />
        ) : file.type === "csv" && csvData ? (
          <table className="border-collapse border border-gray-300">
            <tbody>
              {csvData.slice(0, 5).map((row, rowIndex) => (
                <tr key={rowIndex} className="border border-gray-300">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-2 py-1 text-sm">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : file.type === "pdf" ? (
          <FileTextIcon className="w-20 h-20" />
        ) : (
          <TextIcon className="w-20 h-20" />
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {/* Preview Button */}
        <Button
          onClick={() => {
            if (fileUrl) window.open(fileUrl, "_blank");
          }}
          className="bg-black text-white"
          disabled={!fileUrl}
        >
          Preview
        </Button>

        {/* Download Button */}
        <Button onClick={handleDownload} className="bg-black text-white" disabled={!fileUrl}>
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}
