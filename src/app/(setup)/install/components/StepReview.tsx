"use client";
import { UseFormReturn } from "react-hook-form";

export function StepReview({ form }: { form: UseFormReturn<any> }) {
  const formData = form.getValues();

  const settings = [
    { label: "Domain", value: formData.domain, icon: "🌐" },
    { label: "Company Name", value: formData.companyName, icon: "🏢" },
    { label: "Purchase Code", value: formData.purchaseCode ? "●●●●●●●●" : "Not set", icon: "🎟️" },
    { label: "JWT Secret", value: formData.jwtSecret ? "●●●●●●●●" : "Not set", icon: "🔐" },
    { label: "DeepL API Key", value: formData.deeplApiKey ? "●●●●●●●●" : "Not set (optional)", icon: "🌐" },
    { label: "Company Logo", value: formData.companyLogo || "Not set (optional)", icon: "🎨" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm text-[hsl(217,93%,57%)]">
          ℹ️ Review your configuration below. You can go back to edit any settings using the progress bar.
        </p>
      </div>

      {/* Settings Review */}
      <div className="space-y-3">
        {settings.map((item) => (
          <div key={item.label} className="bg-[hsl(220,13%,20%)] border border-[hsl(220,13%,25%)] rounded-lg p-4 flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="text-sm text-[hsl(220,10%,60%)] mt-1 break-all">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation */}
      <div className="bg-[hsl(160,84%,39%)] bg-opacity-20 border border-[hsl(160,84%,39%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-[hsl(160,84%,39%)] mb-2">✅ All Set!</p>
        <p className="text-sm text-[hsl(160,84%,60%)]">
          Your configuration is complete. Click "Complete Installation" to finalize the setup and start using AV Rentals.
        </p>
      </div>

      {/* What Happens Next */}
      <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-[hsl(217,93%,57%)] mb-3">📋 What Happens Next</p>
        <ul className="text-sm text-[hsl(220,10%,80%)] space-y-2">
          <li>✓ Your settings will be saved securely in the database</li>
          <li>✓ Sensitive data will be encrypted with AES-256</li>
          <li>✓ You'll be redirected to the login page</li>
          <li>✓ Use your admin account to access the application</li>
        </ul>
      </div>

      {/* Security Note */}
      <div className="bg-[hsl(0,85%,60%)] bg-opacity-20 border border-[hsl(0,85%,60%)] border-opacity-50 rounded-lg p-4">
        <p className="text-sm font-semibold text-[hsl(0,85%,60%)] mb-2">🔒 Security Note</p>
        <p className="text-sm text-[hsl(0,85%,70%)]">
          Your JWT secret and API keys are encrypted and stored safely. They are never displayed again once saved.
        </p>
      </div>
    </div>
  );
}
