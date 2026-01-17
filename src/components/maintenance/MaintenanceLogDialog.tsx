
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { EquipmentItem, EquipmentStatus, QuantityByStatus } from "@/types";
import { EQUIPMENT_STATUSES } from '@/lib/constants';
import { useAppDispatch } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { getStatusBreakdownString, updateQuantityByStatus } from "@/lib/equipment-utils";
import { useTranslate } from '@/contexts/TranslationContext';

// Translation helper component
const T = ({ text }: { text: string }) => {
  const { translated } = useTranslate(text);
  return <>{translated}</>;
};

const logSchema = z.object({
  date: z.date({ required_error: "Date is required." }),
  description: z.string().min(5, "Description must be at least 5 characters."),
  cost: z.coerce.number().min(0, "Cost cannot be negative.").optional(),
  updateStatus: z.string().optional(),
  quantityAffected: z.coerce.number().min(1, "At least 1 unit must be affected.").optional(),
});

type LogFormValues = z.infer<typeof logSchema>;

interface MaintenanceLogDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  equipmentItem: EquipmentItem;
}

export function MaintenanceLogDialog({ isOpen, onOpenChange, equipmentItem }: MaintenanceLogDialogProps) {
  const { addMaintenanceLog, updateEquipmentItem } = useAppDispatch();
  const { toast } = useToast();

  // Translation hooks
  const { translated: addMaintenanceLogText } = useTranslate('Add Maintenance Log for');
  const { translated: recordActivityText } = useTranslate('Record a maintenance or repair activity. You can also update the item\'s status.');
  const { translated: currentStatusText } = useTranslate('Current Status');
  const { translated: dateOfMaintenanceText } = useTranslate('Date of Maintenance');
  const { translated: pickDateText } = useTranslate('Pick a date');
  const { translated: descriptionText } = useTranslate('Description');
  const { translated: descriptionPlaceholder } = useTranslate('Describe the work performed...');
  const { translated: costLabel } = useTranslate('Cost ($) (Optional)');
  const { translated: updateStatusLabel } = useTranslate('Update Status (Optional)');
  const { translated: noChangeText } = useTranslate('No Change');
  const { translated: cancelText } = useTranslate('Cancel');
  const { translated: addLogText } = useTranslate('Add Log');
  const { translated: maintenanceLogAddedText } = useTranslate('Maintenance Log Added');
  const { translated: logAddedForText } = useTranslate('Log added for');
  const { translated: errorText } = useTranslate('Error');
  const { translated: failedToAddText } = useTranslate('Failed to add log.');

  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      date: new Date(),
      description: "",
      cost: 0,
      updateStatus: "no-change",
      quantityAffected: 1,
    },
  });

  const updateStatus = form.watch("updateStatus");
  const quantityAffected = form.watch("quantityAffected") || 1;
  
  // Get current status breakdown
  const qbs = (equipmentItem.quantityByStatus || {
    good: equipmentItem.quantity || 0,
    damaged: 0,
    maintenance: 0,
  }) as QuantityByStatus;
  
  const statusBreakdown = getStatusBreakdownString(qbs);

  function onSubmit(data: LogFormValues) {
    try {
      addMaintenanceLog({
        equipmentId: equipmentItem.id,
        date: data.date,
        description: data.description,
        cost: data.cost,
      });

      // Update quantityByStatus if status change is requested
      if (data.updateStatus && data.updateStatus !== "no-change" && data.updateStatus !== equipmentItem.status) {
        const newQbs = updateQuantityByStatus(qbs, data.updateStatus as EquipmentStatus, quantityAffected);
        updateEquipmentItem({ 
          ...equipmentItem, 
          status: data.updateStatus as EquipmentStatus,
          quantityByStatus: newQbs,
        });
      }

      toast({ title: maintenanceLogAddedText, description: `${logAddedForText} ${equipmentItem.name}.` });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({ variant: "destructive", title: errorText, description: failedToAddText });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{addMaintenanceLogText} "{equipmentItem.name}"</DialogTitle>
          <DialogDescription>
            {recordActivityText}
            <div className="mt-2 text-xs text-muted-foreground">
              {currentStatusText}: {statusBreakdown}
            </div>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{dateOfMaintenanceText}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>{pickDateText}</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{descriptionText}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={descriptionPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{costLabel}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="updateStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{updateStatusLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={noChangeText} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no-change">{noChangeText}</SelectItem>
                      {EQUIPMENT_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity field - only show if status is being changed */}
            {updateStatus && updateStatus !== "no-change" && (
              <FormField
                control={form.control}
                name="quantityAffected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Number of Units to {updateStatus === 'good' ? 'Repair' : updateStatus === 'maintenance' ? 'Move to Maintenance' : 'Mark as Damaged'} (1-{equipmentItem.quantity})
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        min="1"
                        max={equipmentItem.quantity}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4">
              <DialogClose asChild><Button type="button" variant="outline">{cancelText}</Button></DialogClose>
              <Button type="submit">{addLogText}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
