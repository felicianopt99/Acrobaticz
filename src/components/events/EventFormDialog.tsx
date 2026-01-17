
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { Event, Partner } from "@/types";
import { useAppContext, useAppDispatch } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useTranslate } from '@/contexts/TranslationContext';

const eventFormSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters."),
  clientId: z.string().min(1, "Please select a client."),
  location: z.string().min(2, "Location is required."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  assignedTo: z.string().optional(),
  agencyId: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialData?: Event;
  onSubmitSuccess?: (newEventId?: string) => void;
}

export function EventFormDialog({ isOpen, onOpenChange, initialData, onSubmitSuccess }: EventFormDialogProps) {
  const { clients, users } = useAppContext();
  const { addEvent, updateEvent } = useAppDispatch();
  const { toast } = useToast();
  const [agencies, setAgencies] = useState<Partner[]>([]);

  // Translation hooks
  const { translated: selectAgency } = useTranslate('Select an agency (optional)');
  const { translated: noAgency } = useTranslate('None');
  const { translated: editEventText } = useTranslate('Edit Event');
  const { translated: createNewEventText } = useTranslate('Create New Event');
  const { translated: eventNameText } = useTranslate('Event Name');
  const { translated: eventNamePlaceholderText } = useTranslate('e.g., Annual Tech Conference');
  const { translated: clientText } = useTranslate('Client');
  const { translated: selectClientText } = useTranslate('Select a client for this event');
  const { translated: locationText } = useTranslate('Location');
  const { translated: locationPlaceholderText } = useTranslate('e.g., Grand Hyatt Ballroom');
  const { translated: agencyText } = useTranslate('Agency');
  const { translated: assignedToText } = useTranslate('Assigned To');
  const { translated: selectTechnicianText } = useTranslate('Select a technician/person for this event');
  const { translated: startDateText } = useTranslate('Start Date');
  const { translated: endDateText } = useTranslate('End Date');
  const { translated: pickDateText } = useTranslate('Pick a date');
  const { translated: cancelText } = useTranslate('Cancel');
  const { translated: saveChangesText } = useTranslate('Save Changes');
  const { translated: createEventText } = useTranslate('Create Event');
  const { translated: eventUpdatedText } = useTranslate('Event Updated');
  const { translated: eventCreatedText } = useTranslate('Event Created');
  const { translated: errorText } = useTranslate('Error');
  const { translated: failedToSaveText } = useTranslate('Failed to save event.');
  const { translated: hasBeenUpdatedText } = useTranslate('has been updated.');
  const { translated: hasBeenCreatedText } = useTranslate('has been created.');

  // Fetch agencies on mount
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

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      clientId: "",
      location: "",
      startDate: undefined,
      endDate: undefined,
      assignedTo: "",
      agencyId: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        startDate: new Date(initialData.startDate),
        endDate: new Date(initialData.endDate),
        agencyId: initialData.agencyId || "",
      });
    } else {
        form.reset({
            name: "",
            clientId: "",
            location: "",
            startDate: undefined,
            endDate: undefined,
            agencyId: "",
        });
    }
  }, [initialData, form, isOpen]); // Rerun when dialog opens as well

  async function onSubmit(data: EventFormValues) {
    try {
      // Prepare event data, excluding agencyId if it's "none"
      const eventData: any = { 
        ...data, 
        date: data.startDate // Use startDate as the date property
      };
      
      // Only include agencyId if it's selected and not "none"
      if (data.agencyId && data.agencyId !== 'none') {
        eventData.agencyId = data.agencyId;
      }

      if (initialData) {
        await updateEvent({ ...initialData, ...eventData });
        toast({ title: eventUpdatedText, description: `"${data.name}" ${hasBeenUpdatedText}` });
        if (onSubmitSuccess) onSubmitSuccess();
      } else {
        const newEventId = await addEvent(eventData);
        toast({ title: eventCreatedText, description: `"${data.name}" ${hasBeenCreatedText}` });
        if (onSubmitSuccess) onSubmitSuccess(newEventId);
      }
    } catch (error) {
      toast({ variant: "destructive", title: errorText, description: failedToSaveText });
      console.error("Error saving event:", error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{initialData ? editEventText : createNewEventText}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{eventNameText}</FormLabel>
                  <FormControl><Input placeholder={eventNamePlaceholderText} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{clientText}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectClientText} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{locationText}</FormLabel>
                  <FormControl><Input placeholder={locationPlaceholderText} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agencyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{agencyText}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectAgency} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{noAgency}</SelectItem>
                      {agencies.map(agency => (
                        <SelectItem key={agency.id} value={agency.id}>
                          {agency.name} {agency.companyName ? `(${agency.companyName})` : ''}
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
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{assignedToText}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectTechnicianText} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.filter(user => user.isActive).map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>{startDateText}</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal w-full",!field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>{pickDateText}</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                        </PopoverContent></Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>{endDateText}</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl>
                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal w-full",!field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>{pickDateText}</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (form.getValues("startDate") || new Date(0))} initialFocus/>
                        </PopoverContent></Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <DialogFooter className="pt-4">
                <DialogClose asChild><Button type="button" variant="outline">{cancelText}</Button></DialogClose>
                <Button type="submit">{initialData ? saveChangesText : createEventText}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    