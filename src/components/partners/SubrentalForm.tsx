// src/components/partners/SubrentalForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useTranslate } from '@/contexts/TranslationContext';
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
import type { Event, Subrental } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const subrentalFormSchema = z.object({
  equipmentName: z.string().min(2, "Equipment name must be at least 2 characters.").max(200),
  equipmentDesc: z.string().max(500).optional().or(z.literal('')),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  dailyRate: z.coerce.number().min(0, "Daily rate must be non-negative"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  eventId: z.string().optional(),
  invoiceNumber: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type SubrentalFormValues = z.infer<typeof subrentalFormSchema>;

interface SubrentalFormProps {
  partnerId: string;
  events: Event[];
  initialData?: Subrental;
  onSuccess?: () => void;
}

export function SubrentalForm({ partnerId, events, initialData, onSuccess }: SubrentalFormProps) {
  const { toast } = useToast();

  // Translation hooks
  const { translated: toastFailedText } = useTranslate('Failed to save subrental. Please try again.');
  const { translated: toastErrorTitle } = useTranslate('Error');
  const { translated: toastSubrentalAddedTitle } = useTranslate('Subrental Added');
  const { translated: toastSubrentalUpdatedTitle } = useTranslate('Subrental Updated');
  const { translated: labelEquipmentName } = useTranslate('Equipment Name');
  const { translated: phEquipmentName } = useTranslate('e.g., Wireless Microphone Set');
  const { translated: labelDescription } = useTranslate('Description (Optional)');
  const { translated: phDescription } = useTranslate('e.g., Shure ULXD4Q with 4 handhelds');
  const { translated: labelQuantity } = useTranslate('Quantity');
  const { translated: labelDailyRate } = useTranslate('Daily Rate (€)');
  const { translated: labelStartDate } = useTranslate('Start Date');
  const { translated: labelEndDate } = useTranslate('End Date');
  const { translated: labelEvent } = useTranslate('Linked Event (Optional)');
  const { translated: phSelectEvent } = useTranslate('Select an event');
  const { translated: noEvent } = useTranslate('No linked event');
  const { translated: labelInvoiceNumber } = useTranslate('Invoice Number (Optional)');
  const { translated: phInvoiceNumber } = useTranslate('e.g., INV-2026-001');
  const { translated: labelNotes } = useTranslate('Notes (Optional)');
  const { translated: phNotes } = useTranslate('Any relevant notes about this subrental...');
  const { translated: labelTotalCost } = useTranslate('Estimated Total Cost');
  const { translated: btnAddSubrental } = useTranslate('Add Subrental');
  const { translated: btnUpdateSubrental } = useTranslate('Update Subrental');
  const { translated: pickDate } = useTranslate('Pick a date');

  const form = useForm<SubrentalFormValues>({
    resolver: zodResolver(subrentalFormSchema),
    defaultValues: initialData ? {
      equipmentName: initialData.equipmentName,
      equipmentDesc: initialData.equipmentDesc || '',
      quantity: initialData.quantity,
      dailyRate: initialData.dailyRate,
      startDate: new Date(initialData.startDate),
      endDate: new Date(initialData.endDate),
      eventId: initialData.eventId || undefined,
      invoiceNumber: initialData.invoiceNumber || '',
      notes: initialData.notes || '',
    } : {
      equipmentName: "",
      equipmentDesc: "",
      quantity: 1,
      dailyRate: 0,
      startDate: new Date(),
      endDate: new Date(),
      eventId: undefined,
      invoiceNumber: "",
      notes: "",
    },
  });

  // Watch for changes to calculate total
  const quantity = form.watch('quantity');
  const dailyRate = form.watch('dailyRate');
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  // Calculate total cost
  const calculateTotalCost = () => {
    if (!startDate || !endDate || !quantity || !dailyRate) return 0;
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return quantity * dailyRate * days;
  };

  const totalCost = calculateTotalCost();

  async function onSubmit(data: SubrentalFormValues) {
    try {
      const url = '/api/subrentals';
      const method = initialData ? 'PUT' : 'POST';
      
      const body = {
        ...data,
        partnerId,
        totalCost,
        ...(initialData && { id: initialData.id }),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save subrental');
      }

      if (initialData) {
        toast({ title: toastSubrentalUpdatedTitle, description: `Subrental "${data.equipmentName}" has been updated.` });
      } else {
        toast({ title: toastSubrentalAddedTitle, description: `Subrental "${data.equipmentName}" has been added.` });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({ variant: "destructive", title: toastErrorTitle, description: toastFailedText });
      console.error("Error saving subrental:", error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="equipmentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labelEquipmentName}</FormLabel>
              <FormControl>
                <Input placeholder={phEquipmentName} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="equipmentDesc"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labelDescription}</FormLabel>
              <FormControl>
                <Input placeholder={phDescription} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labelQuantity}</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dailyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labelDailyRate}</FormLabel>
                <FormControl>
                  <Input type="number" min={0} step={0.01} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{labelStartDate}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>{pickDate}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{labelEndDate}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>{pickDate}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labelEvent}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={phSelectEvent} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">{noEvent}</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} ({format(new Date(event.startDate), 'dd/MM/yyyy')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="invoiceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labelInvoiceNumber}</FormLabel>
              <FormControl>
                <Input placeholder={phInvoiceNumber} {...field} />
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
                <Textarea placeholder={phNotes} {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Total Cost Display */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">{labelTotalCost}</span>
            <span className="text-xl font-bold text-primary">€{totalCost.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {quantity} × €{dailyRate} × {startDate && endDate ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1} days
          </p>
        </div>

        <Button type="submit" className="w-full">
          {initialData ? btnUpdateSubrental : btnAddSubrental}
        </Button>
      </form>
    </Form>
  );
}
