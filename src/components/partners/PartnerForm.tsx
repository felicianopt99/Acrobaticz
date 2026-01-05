// src/components/partners/PartnerForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useTranslate } from '@/contexts/TranslationContext';
import { useState, useEffect } from "react";
import type { Client } from "@/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Partner } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";

const partnerFormSchema = z.object({
  name: z.string().min(2, "Partner name must be at least 2 characters.").max(100),
  companyName: z.string().max(100).optional().or(z.literal('')),
  contactPerson: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email("Invalid email address.").max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  website: z.string().url("Invalid website URL.").max(200).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  clientId: z.string().optional().or(z.literal('none')),  // Link to existing client or "none" for no link
  partnerType: z.enum(['provider', 'agency', 'both']).default('provider'),
  commission: z.number().positive().optional(),
  isActive: z.boolean(),
  logoUrl: z.string().optional().or(z.literal('')),
});

type PartnerFormValues = z.infer<typeof partnerFormSchema>;

interface PartnerFormProps {
  initialData?: Partner;
  onSubmitSuccess?: () => void;
}

export function PartnerForm({ initialData, onSubmitSuccess }: PartnerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logoUrl || null);
  const [uploading, setUploading] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
    fetchClients();
  }, []);

  // Translation hooks
  const { translated: toastFailedText } = useTranslate('Failed to save partner. Please try again.');
  const { translated: toastErrorTitle } = useTranslate('Error');
  const { translated: toastPartnerAddedTitle } = useTranslate('Partner Added');
  const { translated: toastPartnerUpdatedTitle } = useTranslate('Partner Updated');
  const { translated: labelPartnerName } = useTranslate('Partner Name');
  const { translated: phPartnerName } = useTranslate('e.g., ABC Rentals');
  const { translated: labelCompanyName } = useTranslate('Company Name (Optional)');
  const { translated: phCompanyName } = useTranslate('e.g., ABC Rentals Ltd.');
  const { translated: labelContactPerson } = useTranslate('Contact Person (Optional)');
  const { translated: phContactPerson } = useTranslate('e.g., John Smith');
  const { translated: labelEmail } = useTranslate('Email (Optional)');
  const { translated: phEmail } = useTranslate('e.g., contact@partner.com');
  const { translated: labelPhone } = useTranslate('Phone (Optional)');
  const { translated: phPhone } = useTranslate('e.g., +351 912 345 678');
  const { translated: labelAddress } = useTranslate('Address (Optional)');
  const { translated: phAddress } = useTranslate('e.g., 123 Main St, Lisbon, Portugal');
  const { translated: labelWebsite } = useTranslate('Website (Optional)');
  const { translated: phWebsite } = useTranslate('e.g., https://partner.com');
  const { translated: labelNotes } = useTranslate('Notes (Optional)');
  const { translated: phNotes } = useTranslate('Any relevant notes about this partner...');
  const { translated: notesDescription } = useTranslate('Internal notes for partner management.');
  const { translated: labelActive } = useTranslate('Active Partner');
  const { translated: activeDescription } = useTranslate('Inactive partners will not appear in subrental selections.');
  const { translated: btnUpdatePartner } = useTranslate('Update Partner');
  const { translated: btnAddPartner } = useTranslate('Add Partner');
  const { translated: labelPartnerType } = useTranslate('Partner Type');
  const { translated: typeDescription } = useTranslate('Select whether this partner supplies equipment, refers jobs, or both.');
  const { translated: labelCommission } = useTranslate('Commission (%) (Optional)');
  const { translated: phCommission } = useTranslate('e.g., 10 for 10%');
  const { translated: commissionDescription } = useTranslate('For agency partners - commission percentage or flat fee per referral.');
  const { translated: labelLinkedClient } = useTranslate('Link to Client (Optional)');
  const { translated: linkedClientDescription } = useTranslate('For agency partners - link this partner to an existing client record if they are also your direct client.');
  const { translated: labelLogo } = useTranslate('Company Logo (Optional)');
  const { translated: logoDescription } = useTranslate('Upload a company logo to display in catalogs (max 2MB, PNG/JPG)');
  const { translated: uploadLogoBtn } = useTranslate('Upload Logo');
  const { translated: removeLogo } = useTranslate('Remove Logo');

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      companyName: initialData.companyName || '',
      contactPerson: initialData.contactPerson || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      address: initialData.address || '',
      website: initialData.website || '',
      notes: initialData.notes || '',
      clientId: initialData.clientId || '',
      partnerType: initialData.partnerType || 'provider',
      commission: initialData.commission || undefined,
      isActive: initialData.isActive,
      logoUrl: initialData.logoUrl || '',
    } : {
      name: "",
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      notes: "",
      clientId: "",
      partnerType: 'provider',
      commission: undefined,
      isActive: true,
      logoUrl: "",
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: toastErrorTitle,
        description: 'File size exceeds 2MB limit'
      });
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        variant: 'destructive',
        title: toastErrorTitle,
        description: 'Only PNG, JPG, or WebP images are allowed'
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const logoUrl = data.url;

      // Update form and preview
      form.setValue('logoUrl', logoUrl);
      setLogoPreview(logoUrl);
      
      toast({
        title: 'Success',
        description: 'Logo uploaded successfully'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: toastErrorTitle,
        description: 'Failed to upload logo'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    form.setValue('logoUrl', '');
    setLogoPreview(null);
  };

  async function onSubmit(data: PartnerFormValues) {
    try {
      const url = '/api/partners';
      const method = initialData ? 'PUT' : 'POST';
      const body = initialData ? { ...data, id: initialData.id } : data;

      console.log(`[${method}] Sending partner data:`, body);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        let errorMessage = 'Failed to save partner';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error('API error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (initialData) {
        toast({ title: toastPartnerUpdatedTitle, description: `Partner "${data.name}" has been successfully updated.` });
        // Refetch clients to reflect any synced changes from partner to client
        const clientsResponse = await fetch('/api/clients');
        if (clientsResponse.ok) {
          // Trigger a refresh event for parent components listening to client changes
          window.dispatchEvent(new CustomEvent('clientsUpdated', { detail: await clientsResponse.json() }));
        }
      } else {
        toast({ title: toastPartnerAddedTitle, description: `Partner "${data.name}" has been successfully added.` });
      }
      onSubmitSuccess ? onSubmitSuccess() : router.push("/partners");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ variant: "destructive", title: toastErrorTitle, description: errorMessage });
      console.error("Error saving partner:", error);
    }
  }

  return (
    <Card className="glass-card bg-card text-card-foreground shadow-xl border border-border/40">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelPartnerName}</FormLabel>
                  <FormControl>
                    <Input placeholder={phPartnerName} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelCompanyName}</FormLabel>
                  <FormControl>
                    <Input placeholder={phCompanyName} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labelContactPerson}</FormLabel>
                    <FormControl>
                      <Input placeholder={phContactPerson} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{labelPhone}</FormLabel>
                    <FormControl>
                      <Input placeholder={phPhone} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelEmail}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={phEmail} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelWebsite}</FormLabel>
                  <FormControl>
                    <Input placeholder={phWebsite} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelAddress}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={phAddress} {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partnerType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelPartnerType}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="provider">Provider (Equipment Supplier)</SelectItem>
                      <SelectItem value="agency">Agency (Job Referral)</SelectItem>
                      <SelectItem value="both">Both (Supplier & Referral)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>{typeDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelCommission}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      placeholder={phCommission} 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>{commissionDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelLinkedClient}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No client linked" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No client linked</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{linkedClientDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{labelNotes}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={phNotes} {...field} rows={4} />
                  </FormControl>
                  <FormDescription>{notesDescription}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>{labelLogo}</FormLabel>
              <FormDescription>{logoDescription}</FormDescription>
              <div className="space-y-4">
                {logoPreview && (
                  <div className="relative w-32 h-32 rounded-lg border border-border/50 overflow-hidden bg-muted">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-full h-full object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={uploading}
                      className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive rounded-full p-1 text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border/50 rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{uploading ? 'Uploading...' : uploadLogoBtn}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              <FormMessage />
            </FormItem>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{labelActive}</FormLabel>
                    <FormDescription>{activeDescription}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto">
              {initialData ? btnUpdatePartner : btnAddPartner}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
