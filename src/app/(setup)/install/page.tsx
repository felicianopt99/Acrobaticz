"use client";
import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { StepGeneral } from "./components/StepGeneral";
import { StepAuth } from "./components/StepAuth";
import { StepDeepL } from "./components/StepDeepL";
import { StepBranding } from "./components/StepBranding";
import { StepReview } from "./components/StepReview";
import { Check } from "lucide-react";

const STEPS = [
  { id: "general", label: "General Settings", icon: "⚙️" },
  { id: "auth", label: "Authentication", icon: "🔐" },
  { id: "deepl", label: "Translation", icon: "🌐" },
  { id: "branding", label: "Branding", icon: "🎨" },
  { id: "review", label: "Review & Install", icon: "✅" },
];

const STEP_COMPONENTS = [StepGeneral, StepAuth, StepDeepL, StepBranding, StepReview];

export default function InstallPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      domain: "localhost:3000",
      jwtSecret: "",
      deeplApiKey: "",
      companyName: "AV Rentals",
      companyLogo: "",
      purchaseCode: "",
    },
  });

  // Check if installation is already complete and redirect if needed
  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const res = await fetch("/api/config?category=General&key=INSTALLATION_COMPLETE");
        if (res.ok) {
          const data = await res.json();
          if (data.value === "true") {
            // Installation already complete, redirect to dashboard
            toast({
              title: "Already Installed",
              description: "System is already configured. Redirecting to dashboard...",
            });
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1500);
          }
        }
      } catch (err) {
        // Not installed yet, continue
        console.log("Fresh installation detected");
      } finally {
        setIsLoading(false);
      }
    };

    checkInstallation();
  }, [toast]);

  const CurrentStep = STEP_COMPONENTS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"></div>
          </div>
          <h2 className="text-white text-xl font-semibold">Checking installation status...</h2>
          <p className="text-slate-400 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Allow Enter to submit on the last step
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleNext = async () => {
    // Validate required fields based on current step
    const requiredFields: Record<number, string[]> = {
      0: ["domain", "companyName", "purchaseCode"],
      1: ["jwtSecret"],
      2: [], // DeepL is optional
      3: [], // Branding is optional
      4: [], // Review step doesn't need validation
    };

    const fieldsToValidate = requiredFields[step] || [];
    let hasErrors = false;

    for (const field of fieldsToValidate) {
      const value = form.getValues(field as any);
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        await form.trigger(field as any);
        hasErrors = true;
      }
    }

    // If there are validation errors, don't proceed
    if (hasErrors) {
      return;
    }

    if (step === STEPS.length - 1) {
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/install/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form.getValues()),
        });
        if (res.ok) {
          toast({
            title: "Success!",
            description: "Installation completed. Redirecting to login...",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
        } else {
          const error = await res.json();
          toast({
            title: "Installation Failed",
            description: error.error || "An error occurred during installation",
            variant: "destructive",
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        toast({
          title: "Installation Error",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(220,13%,9%)]">
      {/* Header */}
      <div className="bg-[hsl(220,13%,13%)] border-b border-[hsl(220,13%,25%)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">AV Rentals</h1>
              <p className="text-[hsl(220,10%,60%)] mt-1">Professional Installation Wizard</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[hsl(220,10%,60%)]">STEP {step + 1} OF {STEPS.length}</p>
              <p className="text-lg font-bold text-[hsl(217,93%,57%)] mt-1">{STEPS[step].label}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[hsl(220,13%,25%)] rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[hsl(217,93%,57%)] via-[hsl(280,85%,55%)] to-[hsl(320,100%,60%)] h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[hsl(220,13%,13%)] rounded-lg shadow-sm p-6 sticky top-8 border border-[hsl(220,13%,25%)]">
              <h3 className="text-sm font-semibold text-white mb-4">Progress</h3>
              <div className="space-y-3">
                {STEPS.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      idx === step
                        ? "bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)]"
                        : idx < step
                          ? "bg-[hsl(160,84%,39%)] bg-opacity-20 border border-[hsl(160,84%,39%)]"
                          : "bg-[hsl(220,13%,20%)] border border-[hsl(220,13%,25%)]"
                    }`}
                    onClick={() => idx < step && setStep(idx)}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx < step
                          ? "bg-[hsl(160,84%,39%)] text-white"
                          : idx === step
                            ? "bg-[hsl(217,93%,57%)] text-white"
                            : "bg-[hsl(220,13%,30%)] text-[hsl(220,10%,60%)]"
                      }`}
                    >
                      {idx < step ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          idx === step ? "text-[hsl(217,93%,57%)]" : "text-[hsl(220,10%,80%)]"
                        }`}
                      >
                        {s.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            <div className="bg-[hsl(220,13%,13%)] rounded-lg shadow-lg p-8 border border-[hsl(220,13%,25%)]">
              <FormProvider {...form}>
                <form onKeyDown={handleKeyDown}>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">{STEPS[step].label}</h2>
                    <p className="text-[hsl(220,10%,60%)]">
                      {step === 0 && "Configure basic settings for your AV Rentals instance"}
                      {step === 1 && "Set up secure authentication for your application"}
                      {step === 2 && "Configure translation services (optional)"}
                      {step === 3 && "Customize your application branding"}
                      {step === 4 && "Review and complete your installation"}
                    </p>
                  </div>

                  <CurrentStep form={form} />

                  {/* Navigation */}
                  <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-[hsl(220,13%,25%)]">
                  <Button
                    variant="outline"
                    onClick={() => setStep(Math.max(0, step - 1))}
                    disabled={step === 0 || isSubmitting}
                    className="min-w-24"
                  >
                    ← Back
                  </Button>

                  <div className="flex gap-2">
                    {STEPS.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-2 w-8 rounded-full transition-all ${
                          idx <= step ? "bg-[hsl(217,93%,57%)]" : "bg-[hsl(220,13%,25%)]"
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className={`min-w-40 ${
                      step === STEPS.length - 1
                        ? "bg-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,35%)] text-white"
                        : "bg-[hsl(217,93%,57%)] hover:bg-[hsl(217,93%,50%)] text-white"
                    }`}
                  >
                    {isSubmitting
                      ? "Installing..."
                      : step === STEPS.length - 1
                        ? "Complete Installation →"
                        : "Next →"}
                  </Button>
                  </div>
                </form>
              </FormProvider>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="bg-[hsl(217,93%,57%)] bg-opacity-20 border border-[hsl(217,93%,57%)] border-opacity-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-[hsl(217,93%,57%)] mb-1">💾 Secure Storage</p>
                <p className="text-sm text-[hsl(220,10%,80%)]">All sensitive data is encrypted with AES-256</p>
              </div>
              <div className="bg-[hsl(160,84%,39%)] bg-opacity-20 border border-[hsl(160,84%,39%)] border-opacity-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-[hsl(160,84%,39%)] mb-1">⚡ Quick Setup</p>
                <p className="text-sm text-[hsl(220,10%,80%)]">Complete your installation in 5 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[hsl(220,13%,25%)] bg-[hsl(220,13%,13%)] mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-[hsl(220,10%,60%)]">
            AV Rentals • Professional Equipment Rental Management
          </p>
        </div>
      </div>
    </div>
  );
}
