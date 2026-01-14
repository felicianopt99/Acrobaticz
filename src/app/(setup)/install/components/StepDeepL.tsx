"use client";
import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function StepDeepL({ form }: { form: UseFormReturn<any> }) {
  const deeplValue = form.watch("deeplApiKey");

  return (
    <div className="space-y-6">
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(217,93%,57%)]">
          ℹ️ DeepL API enables automatic translation of equipment descriptions and communications. This step is optional.
        </p>
      </div>

      <FormField
        control={form.control}
        name="deeplApiKey"
        rules={{
          pattern: {
            value: /^[a-f0-9-:]*$/i,
            message: "Invalid DeepL API key format",
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold text-white">🌐 DeepL API Key (Optional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="password"
                placeholder="Your DeepL API key"
                className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
              />
            </FormControl>
            <FormDescription className="text-[hsl(220,10%,60%)]">
              Get your free API key from <a href="https://www.deepl.com/pro" target="_blank" rel="noopener noreferrer" className="text-[hsl(217,93%,57%)] hover:text-[hsl(217,93%,50%)]">DeepL Pro</a>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-[hsl(217,93%,57%)] mb-2">💬 Translation Features</p>
          <p className="text-xs text-[hsl(220,10%,80%)]">Automatically translate descriptions, emails, and documents</p>
        </div>
        <div className="bg-[hsl(160,84%,39%)] bg-opacity-20 border border-[hsl(160,84%,39%)] border-opacity-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-[hsl(160,84%,39%)] mb-2">🔄 Can Change Later</p>
          <p className="text-xs text-[hsl(220,10%,80%)]">You can add or update this API key in admin settings</p>
        </div>
      </div>

      {!deeplValue && (
        <div className="bg-[hsl(42,100%,50%)] bg-opacity-20 border border-[hsl(42,100%,50%)] border-opacity-50 rounded-lg p-4">
          <p className="text-sm text-[hsl(42,100%,80%)]">
            ⏭️ Skipping translation? You can still use the app without DeepL. Just click "Next" to continue.
          </p>
        </div>
      )}
    </div>
  );
}
