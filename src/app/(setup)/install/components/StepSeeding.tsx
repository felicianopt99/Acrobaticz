"use client";
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function StepSeeding({ form }: { form: UseFormReturn<any> }) {
  const [seedingOptions, setSeedingOptions] = useState({
    seedCatalog: false,
    seedDemoData: true,
  });

  return (
    <div className="space-y-6">
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(217,93%,57%)]">
          ℹ️ Initialize your database with sample data. This step is optional.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-white">Data Seeding Options</h3>

        {/* Demo Data Option */}
        <div className="p-4 border border-[hsl(220,13%,25%)] rounded-lg bg-[hsl(220,13%,18%)] space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="seedDemo"
              checked={seedingOptions.seedDemoData}
              onCheckedChange={(checked) =>
                setSeedingOptions({ ...seedingOptions, seedDemoData: !!checked })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="seedDemo" className="text-white font-semibold cursor-pointer">
                📊 Load Demo Data (Recommended)
              </Label>
              <p className="text-xs text-[hsl(220,10%,60%)] mt-1">
                Creates sample users, clients, partners, and equipment categories to explore the application
              </p>
            </div>
          </div>
        </div>

        {/* Catalog Option */}
        <div className="p-4 border border-[hsl(220,13%,25%)] rounded-lg bg-[hsl(220,13%,18%)] space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="seedCatalog"
              checked={seedingOptions.seedCatalog}
              onCheckedChange={(checked) =>
                setSeedingOptions({ ...seedingOptions, seedCatalog: !!checked })
              }
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="seedCatalog" className="text-white font-semibold cursor-pointer">
                📦 Load Catalog Data
              </Label>
              <p className="text-xs text-[hsl(220,10%,60%)] mt-1">
                Import 65+ products from the CATALOG_65_PRODUTOS with full descriptions and images
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[hsl(160,84%,39%)] bg-opacity-20 border border-[hsl(160,84%,39%)] border-opacity-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-[hsl(160,84%,39%)] mb-2">⏱️ Time Required</p>
          <p className="text-xs text-[hsl(220,10%,80%)]">
            • Demo Data: ~10 seconds<br/>
            • Catalog Data: ~30 seconds<br/>
            • Both: ~40 seconds total
          </p>
        </div>
        <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-[hsl(217,93%,57%)] mb-2">🔄 Can Change Later</p>
          <p className="text-xs text-[hsl(220,10%,80%)]">
            You can always add or remove data from the admin dashboard after installation
          </p>
        </div>
      </div>

      {/* Skip Option */}
      <div className="bg-[hsl(42,100%,50%)] bg-opacity-20 border border-[hsl(42,100%,50%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(42,100%,80%)]">
          ⏭️ Prefer starting fresh? You can skip seeding and add your own data later through the admin dashboard.
        </p>
      </div>

      {/* Hidden field to store seeding options */}
      <input
        type="hidden"
        value={JSON.stringify(seedingOptions)}
        onChange={() => {}}
      />
    </div>
  );
}
