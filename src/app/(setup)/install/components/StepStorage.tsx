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
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface StorageTestResult {
  success: boolean;
  message?: string;
  error?: string;
  bucketExists?: boolean;
  latency?: number;
}

export function StepStorage({ form }: { form: UseFormReturn<any> }) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<StorageTestResult | null>(null);
  const { toast } = useToast();

  // Watch MinIO fields to enable/disable test button
  const minioEndpoint = form.watch("minioEndpoint");
  const minioAccessKey = form.watch("minioAccessKey");
  const minioSecretKey = form.watch("minioSecretKey");
  const minioBucket = form.watch("minioBucket");

  const hasMinioConfig = Boolean(
    minioEndpoint && minioAccessKey && minioSecretKey && minioBucket
  );

  const handleTestStorage = async () => {
    if (!hasMinioConfig) {
      toast({
        title: "Invalid Configuration",
        description: "All MinIO fields are required to test the connection",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/setup/test-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minioEndpoint,
          minioAccessKey,
          minioSecretKey,
          minioBucket,
        }),
      });

      const data: StorageTestResult = await res.json();

      setTestResult(data);

      if (data.success) {
        toast({
          title: "✓ Connection Successful",
          description: `MinIO is accessible. Latency: ${data.latency}ms`,
        });
      } else {
        toast({
          title: "✗ Connection Failed",
          description: data.error || "Could not connect to MinIO",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setTestResult({
        success: false,
        error: errorMsg,
      });
      toast({
        title: "Test Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(217,93%,57%)]">
          ℹ️ Configure MinIO/S3 storage for file uploads and backups. This is optional - you can skip it for now.
        </p>
      </div>

      {/* Storage Configuration Fields */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="minioEndpoint"
          rules={{
            pattern: {
              value: /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(:[0-9]{1,5})?$/,
              message: "Invalid endpoint format (e.g., minio:9000 or minio.example.com)",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-white">
                📦 MinIO Endpoint (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="minio:9000 or minio.example.com:9000"
                  type="text"
                  className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
                  aria-label="MinIO Endpoint"
                  aria-describedby="minio-endpoint-description"
                />
              </FormControl>
              <FormDescription id="minio-endpoint-description" className="text-[hsl(220,10%,60%)]">
                The address and port of your MinIO server (e.g., minio:9000 for Docker or minio.example.com)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minioAccessKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-white">
                🔑 Access Key (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="minioadmin or your access key"
                  type="text"
                  className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
                  aria-label="MinIO Access Key"
                  aria-describedby="minio-access-key-description"
                />
              </FormControl>
              <FormDescription id="minio-access-key-description" className="text-[hsl(220,10%,60%)]">
                Your MinIO access key (username)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minioSecretKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-white">
                🔐 Secret Key (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Your secret key"
                  type="password"
                  className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
                  aria-label="MinIO Secret Key"
                  aria-describedby="minio-secret-key-description"
                />
              </FormControl>
              <FormDescription id="minio-secret-key-description" className="text-[hsl(220,10%,60%)]">
                Your MinIO secret key (password)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minioBucket"
          rules={{
            pattern: {
              value: /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/,
              message: "Bucket name must start and end with lowercase letter or number",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-white">
                📂 Bucket Name (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="acrobaticz-storage"
                  type="text"
                  className="h-11 text-base bg-[hsl(220,13%,25%)] border-[hsl(220,13%,30%)] text-white placeholder-[hsl(220,10%,50%)]"
                  aria-label="MinIO Bucket"
                  aria-describedby="minio-bucket-description"
                />
              </FormControl>
              <FormDescription id="minio-bucket-description" className="text-[hsl(220,10%,60%)]">
                The bucket name where files will be stored (lowercase, alphanumeric, dots and hyphens)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Test Connection Section */}
      {hasMinioConfig && (
        <div className="bg-[hsl(220,13%,20%)] border border-[hsl(220,13%,25%)] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Test MinIO Connection</h3>
              <p className="text-sm text-[hsl(220,10%,60%)]">
                Validate your credentials before proceeding
              </p>
            </div>
            <Button
              onClick={handleTestStorage}
              disabled={isTesting}
              className="bg-[hsl(217,93%,57%)] hover:bg-[hsl(217,93%,50%)] text-white whitespace-nowrap"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-lg border flex items-start gap-3 ${
                testResult.success
                  ? "bg-[hsl(160,84%,39%)] bg-opacity-20 border-[hsl(160,84%,39%)]"
                  : "bg-[hsl(0,84%,60%)] bg-opacity-20 border-[hsl(0,84%,60%)]"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-[hsl(160,84%,39%)] flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[hsl(0,84%,60%)] flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    testResult.success
                      ? "text-[hsl(160,84%,39%)]"
                      : "text-[hsl(0,84%,60%)]"
                  }`}
                >
                  {testResult.success ? "✓ Connection Successful" : "✗ Connection Failed"}
                </p>
                <p className="text-sm text-[hsl(220,10%,80%)] mt-1">
                  {testResult.message || testResult.error}
                </p>
                {testResult.latency && (
                  <p className="text-xs text-[hsl(220,10%,70%)] mt-2">
                    Latency: {testResult.latency}ms
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Setup Guide */}
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-[hsl(217,93%,57%)] mb-3">📚 MinIO Setup Guide</p>
        <ul className="text-sm text-[hsl(220,10%,80%)] space-y-2">
          <li>✓ MinIO is an S3-compatible object storage server</li>
          <li>✓ Perfect for self-hosted file storage and backups</li>
          <li>✓ Can be deployed via Docker alongside your application</li>
          <li>✓ You can always configure storage later if needed</li>
        </ul>
      </div>

      {/* Skip Notice */}
      <div className="bg-[hsl(220,13%,20%)] border border-[hsl(220,13%,25%)] rounded-lg p-4">
        <p className="text-sm text-[hsl(220,10%,70%)]">
          💡 <strong>Note:</strong> MinIO configuration is optional. You can skip this step and configure storage later through the admin panel.
        </p>
      </div>
    </div>
  );
}
