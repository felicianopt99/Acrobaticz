"use client";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink } from "lucide-react";

export function StepDuckDNS({ form }: { form: UseFormReturn<any> }) {
  const [useDuckDNS, setUseDuckDNS] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(217,93%,57%)]">
          ℹ️ Configure DuckDNS for free dynamic DNS if you don't have a fixed domain name. This is optional.
        </p>
      </div>

      {/* Use DuckDNS Toggle */}
      <div className="p-4 border border-[hsl(220,13%,25%)] rounded-lg bg-[hsl(220,13%,18%)] space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="useDuckDNS"
            checked={useDuckDNS}
            onCheckedChange={(checked) => setUseDuckDNS(!!checked)}
            className="mt-1"
          />
          <div className="flex-1">
            <Label htmlFor="useDuckDNS" className="text-white font-semibold cursor-pointer">
              🦆 Use DuckDNS for Dynamic DNS
            </Label>
            <p className="text-xs text-[hsl(220,10%,60%)] mt-1">
              Free service that maps a domain to your dynamic IP address. Perfect for home networks.
            </p>
          </div>
        </div>
      </div>

      {useDuckDNS && (
        <>
          {/* Step 1: Create Account */}
          <div className="bg-[hsl(220,13%,15%)] p-5 rounded-lg border border-[hsl(220,13%,30%)] space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(217,93%,57%)] text-white text-sm font-bold">
                1
              </div>
              <h3 className="text-sm font-semibold text-white">Create DuckDNS Account</h3>
            </div>

            <div className="bg-[hsl(220,13%,22%)] p-3 rounded border border-[hsl(220,13%,28%)] space-y-3">
              <p className="text-xs text-[hsl(220,10%,60%)]">
                Go to DuckDNS website and create a free account:
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 bg-[hsl(217,93%,57%)] hover:bg-[hsl(217,93%,50%)] border-0 text-white"
                onClick={() => window.open("https://www.duckdns.org", "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
                Open DuckDNS.org
              </Button>
            </div>
          </div>

          {/* Step 2: Get Token */}
          <div className="bg-[hsl(220,13%,15%)] p-5 rounded-lg border border-[hsl(220,13%,30%)] space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(217,93%,57%)] text-white text-sm font-bold">
                2
              </div>
              <h3 className="text-sm font-semibold text-white">Get Your Token</h3>
            </div>

            <div className="bg-[hsl(220,13%,22%)] p-3 rounded border border-[hsl(220,13%,28%)] space-y-2">
              <p className="text-xs text-[hsl(220,10%,60%)]">
                After login, copy your DuckDNS token from your account page
              </p>
              <FormField
                control={form.control}
                name="duckdnsToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-white">DuckDNS Token</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          {...field}
                          type="password"
                          placeholder="Your DuckDNS token (32 characters)"
                          className="h-10 text-sm bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
                        />
                        {field.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(field.value)}
                            className="text-[hsl(217,93%,57%)] hover:bg-[hsl(220,13%,25%)]"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Step 3: Choose Domain Name */}
          <div className="bg-[hsl(220,13%,15%)] p-5 rounded-lg border border-[hsl(220,13%,30%)] space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(217,93%,57%)] text-white text-sm font-bold">
                3
              </div>
              <h3 className="text-sm font-semibold text-white">Choose Your Domain</h3>
            </div>

            <div className="bg-[hsl(220,13%,22%)] p-3 rounded border border-[hsl(220,13%,28%)] space-y-2">
              <p className="text-xs text-[hsl(220,10%,60%)]">
                Create a subdomain name (something like "myrentals" or "avrentals")
              </p>
              <FormField
                control={form.control}
                name="duckdnsDomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-white">Subdomain Name</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 items-center">
                        <Input
                          {...field}
                          type="text"
                          placeholder="e.g., myrentals (will become myrentals.duckdns.org)"
                          className="h-10 text-sm bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
                        />
                        {field.value && (
                          <span className="text-xs text-[hsl(217,93%,57%)] whitespace-nowrap font-semibold">
                            .duckdns.org
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Configuration Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-[hsl(217,93%,57%)] mb-2">📝 Setup Instructions</p>
              <p className="text-xs text-[hsl(220,10%,80%)]">
                1. Sign up at duckdns.org<br/>
                2. Copy your token<br/>
                3. Create your subdomain<br/>
                4. Set it to point to your IP
              </p>
            </div>
            <div className="bg-[hsl(160,84%,39%)] bg-opacity-20 border border-[hsl(160,84%,39%)] border-opacity-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-[hsl(160,84%,39%)] mb-2">🔄 Auto-Update IP</p>
              <p className="text-xs text-[hsl(220,10%,80%)]">
                You'll need to run the DuckDNS updater script on your server to keep the IP address updated
              </p>
            </div>
          </div>

          {/* Script Helper */}
          <div className="bg-[hsl(220,13%,15%)] p-4 rounded-lg border border-[hsl(220,13%,30%)] space-y-3">
            <p className="text-sm font-semibold text-[hsl(217,93%,57%)]">🔧 DuckDNS Update Script</p>
            <p className="text-xs text-[hsl(220,10%,60%)] mb-2">
              Add this to your crontab to automatically update your IP every 5 minutes:
            </p>
            <div className="bg-[hsl(220,13%,22%)] p-3 rounded font-mono text-xs text-[hsl(160,84%,39%)] break-all space-y-2">
              <div>echo url="https://www.duckdns.org/update?domains=YOURDOMAIN&token=YOURTOKEN&ip=" | curl -k -o ~/duckdns.log -O -</div>
              <p className="text-xs text-[hsl(220,10%,50%)]">Replace YOURDOMAIN and YOURTOKEN with your values</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('echo url="https://www.duckdns.org/update?domains=YOURDOMAIN&token=YOURTOKEN&ip=" | curl -k -o ~/duckdns.log -O -')}
                className="text-[hsl(217,93%,57%)] hover:bg-[hsl(220,13%,25%)] text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </>
      )}

      {!useDuckDNS && (
        <div className="bg-[hsl(42,100%,50%)] bg-opacity-20 border border-[hsl(42,100%,50%)] border-opacity-50 rounded-lg p-4">
          <p className="text-sm text-[hsl(42,100%,80%)]">
            ⏭️ Using your own domain? Just continue without DuckDNS. You'll need to set up DNS records yourself.
          </p>
        </div>
      )}
    </div>
  );
}
