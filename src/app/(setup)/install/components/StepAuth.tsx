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
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function StepAuth({ form }: { form: UseFormReturn<any> }) {
  const [showSecret, setShowSecret] = useState(false);

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    form.setValue("jwtSecret", secret);
  };

  const jwtValue = form.watch("jwtSecret");

  return (
    <div className="space-y-6">
      <div className="bg-[hsl(0,85%,60%)] bg-opacity-20 border border-[hsl(0,85%,60%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(0,85%,60%)]">
          ⚠️ The JWT secret is critical for your application's security. It's used to sign authentication tokens.
        </p>
      </div>

      <FormField
        control={form.control}
        name="jwtSecret"
        rules={{ required: "JWT Secret is required" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold text-white">🔐 JWT Secret Key</FormLabel>
            <div className="flex gap-2">
              <FormControl className="flex-1">
                <Input
                  {...field}
                  type={showSecret ? "text" : "password"}
                  placeholder="Generated or custom secret"
                  className="h-11 text-base font-mono bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSecret(!showSecret)}
                className="px-4 bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white hover:bg-[hsl(220,13%,30%)]"
                title={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? "🙈" : "👁️"}
              </Button>
            </div>
            <FormDescription className="text-[hsl(220,10%,60%)]">
              A cryptographic key used to sign and verify authentication tokens.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button
        type="button"
        onClick={generateSecret}
        className="w-full bg-[hsl(217,93%,57%)] hover:bg-[hsl(217,93%,50%)] h-11 text-base text-white"
      >
        ✨ Generate Secure Secret
      </Button>

      {jwtValue && (
        <div className="bg-[hsl(160,84%,39%)] bg-opacity-20 border border-[hsl(160,84%,39%)] border-opacity-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-[hsl(160,84%,39%)] mb-2">✅ Secret Generated</p>
          <p className="text-xs text-[hsl(160,84%,70%)]">Your JWT secret is {jwtValue.length} characters long and cryptographically secure.</p>
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-[hsl(217,93%,57%)] mb-3">🛡️ Security Tips</p>
        <ul className="text-sm text-[hsl(220,10%,80%)] space-y-2">
          <li>✓ Use the "Generate Secure Secret" button for best security</li>
          <li>✓ Never share your JWT secret with anyone</li>
          <li>✓ Store it securely - it cannot be recovered if lost</li>
          <li>✓ Change it regularly in production environments</li>
        </ul>
      </div>
    </div>
  );
}
