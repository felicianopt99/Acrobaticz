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

export function StepBranding({ form }: { form: UseFormReturn<any> }) {
  const logoUrl = form.watch("companyLogo");

  return (
    <div className="space-y-6">
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(217,93%,57%)]">
          ℹ️ Customize the look and feel of your AV Rentals installation. Branding can be changed anytime.
        </p>
      </div>

      <FormField
        control={form.control}
        name="companyLogo"
        rules={{
          pattern: {
            value: /^(https?:\/\/.+\.(jpg|jpeg|png|gif|svg|webp))?$/i,
            message: "Invalid logo URL format",
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold text-white">🎨 Company Logo URL (Optional)</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="url"
                placeholder="https://example.com/logo.png"
                className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
              />
            </FormControl>
            <FormDescription className="text-[hsl(220,10%,60%)]">
              URL to your company logo. Recommended size: 200x200px or SVG format for best quality.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {logoUrl && (
        <div className="border border-[hsl(220,13%,25%)] rounded-lg p-6 bg-[hsl(220,13%,20%)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-semibold text-[hsl(220,10%,80%)] mb-3">Logo Preview:</p>
            <img src={logoUrl} alt="Company Logo" className="h-24 object-contain mx-auto" onError={() => {}} />
          </div>
        </div>
      )}

      {/* Branding Tips */}
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-[hsl(217,93%,57%)] mb-3">🎯 Branding Tips</p>
        <ul className="text-sm text-[hsl(220,10%,80%)] space-y-2">
          <li>✓ Use a PNG or SVG logo with transparent background</li>
          <li>✓ Recommended dimensions: 200x200px</li>
          <li>✓ Logo will appear in the sidebar and login page</li>
          <li>✓ HTTPS URLs required for security</li>
        </ul>
      </div>
    </div>
  );
}
