
// src/components/clients/ClientForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useTranslate } from '@/contexts/TranslationContext';
import { useState, useEffect } from "react";
import type { Client, Partner } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const clientFormSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters.").max(100),
  contactPerson: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email("Invalid email address.").max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  partnerId: z.string().optional().or(z.literal('none')),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Client;
  onSubmitSuccess?: () => void;
}

export function ClientForm({ initialData, onSubmitSuccess }: ClientFormProps) {
  // Translation hooks
  const { translated: toastFailedtosaveclientPlDescText } = useTranslate('Failed to save client. Please try again.');
  const { translated: toastErrorTitleText } = useTranslate('Error');
  const { translated: toastClientAddedTitleText } = useTranslate('Client Added');
  const { translated: toastClientUpdatedTitleText } = useTranslate('Client Updated');
  const { translated: labelClientName } = useTranslate('Client Name / Company');
  const { translated: phClientName } = useTranslate('e.g., Acme Corp or John Doe');
  const { translated: labelContactPerson } = useTranslate('Contact Person (Optional)');
  const { translated: phContactPerson } = useTranslate('e.g., Jane Smith');
  const { translated: labelEmail } = useTranslate('Email (Optional)');
  const { translated: phEmail } = useTranslate('e.g., contact@example.com');
  const { translated: labelPhone } = useTranslate('Phone (Optional)');
  const { translated: phPhone } = useTranslate('e.g., 555-123-4567');
  const { translated: labelAddress } = useTranslate('Address (Optional)');
  const { translated: phAddress } = useTranslate('e.g., 123 Main St, Anytown, USA');
  const { translated: labelNotes } = useTranslate('Notes (Optional)');
  const { translated: phNotes } = useTranslate('Any relevant notes about the client...');
  const { translated: notesDescription } = useTranslate('Internal notes for client management.');
  const { translated: btnUpdateClient } = useTranslate('Update Client');
  const { translated: btnAddClient } = useTranslate('Add Client');
  const { translated: labelAgency } = useTranslate('Related Agency/Partner (Optional)');
  const { translated: phAgency } = useTranslate('Select an agency if this client is associated with a partner');
  const { translated: descAgency } = useTranslate('Link this client to a partner agency or provider');
  const { translated: noAgency } = useTranslate('None');

  const { addClient, updateClient } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const [agencies, setAgencies] = useState<Partner[]>([]);

  // Fetch agencies/partners on mount
  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const response = await fetch('/api/partners?activeOnly=true');
        if (response.ok) {
          const data = await response.json();
          // Filter to only agency-type or both-type partners
          const agencyPartners = data.filter((p: Partner) => p.partnerType === 'agency' || p.partnerType === 'both');
          setAgencies(agencyPartners);
        }
      } catch (error) {
        console.error('Error fetching agencies:', error);
      }
    };
    fetchAgencies();
  }, []);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialData ? {
      name: initialData.name || "",
      contactPerson: initialData.contactPerson || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      address: initialData.address || "",
      notes: initialData.notes || "",
      partnerId: "",
    } : {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      partnerId: "none",
    },
  });

  function onSubmit(data: ClientFormValues) {
    try {
      // Prepare client data, excluding "none" for partnerId
      const clientData = {
        name: data.name,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
        partnerId: data.partnerId && data.partnerId !== 'none' ? data.partnerId : undefined,
      }
      
      if (initialData) {
        updateClient({ ...initialData, ...clientData });
        toast({ title: toastClientUpdatedTitleText, description: `Client "${data.name}" has been successfully updated.` });
      } else {
        addClient(clientData);
        toast({ title: toastClientAddedTitleText, description: `Client "${data.name}" has been successfully added.` });
      }
      onSubmitSuccess ? onSubmitSuccess() : router.push("/clients");
    } catch (error) {
      toast({ variant: "destructive", title: toastErrorTitleText, description: toastFailedtosaveclientPlDescText });
      console.error("Error saving client:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labelClientName}</FormLabel>
              <FormControl>
                <Input placeholder={phClientName} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labelAddress}</FormLabel>
              <FormControl>
                <Textarea placeholder={phAddress} {...field} />
              </FormControl>
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
        <FormField
          control={form.control}
          name="partnerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labelAgency}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={phAgency} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">{noAgency}</SelectItem>
                  {agencies.map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{agency.name}</span>
                        {agency.companyName && (
                          <span className="text-xs text-muted-foreground">{agency.companyName}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{descAgency}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full md:w-auto">
          {initialData ? btnUpdateClient : btnAddClient}
        </Button>
      </form>
    </Form>
  );
}

    