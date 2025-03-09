"use client";

import { Button } from "@/components/ui/button";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  file: z
    .custom<FileList>((val) => val instanceof FileList, "Required")
    .refine((files) => files.length > 0, "Required"),
});

export default function Home() {
  const organization = useOrganization();
  const user = useUser();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createFile = useMutation(api.files.createFile);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      file: undefined,
    },
  });

  const fileRef = form.register("file");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    if (!orgId) return;

    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": values.file[0].type },
        body: values.file[0],
      });
      const { storageId } = await result.json();

      await createFile({
        name: values.title,
        fileId: storageId,
        orgId,
      });

      form.reset();
      setIsFileDialogOpen(false);

      toast("File Uploaded", {
        description: "Now everyone can view your file",
        style: { backgroundColor: "lightblue", color: "white" },
      });

    } catch (err) {
      console.error(err);
      toast("File Upload Failed", {
        description: "Something went wrong. Please try again."
      });
    }
  }

  const files = useQuery(api.files.getFiles, orgId ? { orgId } : "skip");

  return (
    <main className="container mx-auto pt-12">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Your Files</h1>
        <Dialog open={isFileDialogOpen} onOpenChange={(isOpen) => 
          {setIsFileDialogOpen(isOpen); 
          form.reset();
          }}>
          <DialogTrigger asChild>
            <Button>Upload File</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="mb-8">Upload your file here</DialogTitle>
              <DialogDescription>
                Please upload your file with a title.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="file"
                  render={() => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input type="file" {...fileRef} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" 
                disabled={form.formState.isSubmitting} 
               
                className="flex gap-1 ">
                {form.formState.isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Submit
                  </Button>

              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {files?.map((file) => (
        <div key={file._id}>{file.name}</div>
      ))}
    </main>
  );
}
