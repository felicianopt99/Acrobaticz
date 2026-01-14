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

export function StepGeneral({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="space-y-6">
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(217,93%,57%)]">
          ℹ️ These settings configure how your AV Rentals application will be accessed and identified.
        </p>
      </div>

      <FormField
        control={form.control}
        name="domain"
        rules={{
          required: "Domain is required",
          pattern: {
            value: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
            message: "Invalid domain format",
          },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="domain" className="text-base font-semibold text-white">🌐 Domain or Host</FormLabel>
            <FormControl>
              <Input
                id="domain"
                {...field}
                placeholder="example.com or localhost:3000"
                type="text"
                className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
                aria-label="Domain or Host"
                aria-describedby="domain-description"
              />
            </FormControl>
            <FormDescription id="domain-description" className="text-[hsl(220,10%,60%)]">
              The URL where your application will be hosted. Use your domain name or IP address with port.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="companyName"
        rules={{ required: "Company name is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold text-white">🏢 Company Name</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Your company name"
                type="text"
                className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
              />
            </FormControl>
            <FormDescription className="text-[hsl(220,10%,60%)]">
              This will be displayed throughout the application and in communications.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="purchaseCode"
        rules={{
          required: "Purchase code is required",
          minLength: { value: 20, message: "Invalid purchase code" },
        }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold text-white">🎟️ Envato Purchase Code</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Enter your Codecanyon purchase code"
                type="password"
                className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
              />
            </FormControl>
            <FormDescription className="text-[hsl(220,10%,60%)]">
              Your unique code from Codecanyon/Envato to validate your license. Find it in your Codecanyon download page.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Info Section */}
      <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-[hsl(220,13%,25%)]">
        <div className="bg-[hsl(220,13%,20%)] p-4 rounded-lg border border-[hsl(220,13%,30%)]">
          <p className="text-xs font-semibold text-[hsl(220,10%,70%)] uppercase mb-1">Example Domain</p>
          <p className="text-sm text-[hsl(220,10%,60%)]">av-rentals.com</p>
        </div>
        <div className="bg-[hsl(220,13%,20%)] p-4 rounded-lg border border-[hsl(220,13%,30%)]">
          <p className="text-xs font-semibold text-[hsl(220,10%,70%)] uppercase mb-1">Or Local Dev</p>
          <p className="text-sm text-[hsl(220,10%,60%)]">localhost:3000</p>
        </div>
      </div>
    </div>
  );
}
