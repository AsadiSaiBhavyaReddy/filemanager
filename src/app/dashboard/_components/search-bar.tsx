import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem,  FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, SearchIcon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";

// Define validation schema
const formSchema = z.object({
  query: z.string().min(0, "Query is required").max(200, "Query is too long"),
});

export function SearchBar({query,setQuery}:{query: string,setQuery:Dispatch<SetStateAction<string>>;}) {
    console.log(query);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setQuery(values.query);
  }

  return (
    <FormProvider {...form}>
      <div className="w-full max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-center">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem>
                {/* <FormLabel>Search</FormLabel> */}
                <FormControl>
                  <Input placeholder="Your file names" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting} className="flex items-center gap-2">
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
            Search
          </Button>
        </form>
      </div>
    </FormProvider>
  );
}
