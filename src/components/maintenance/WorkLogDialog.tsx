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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { EquipmentItem, EquipmentStatus, MaintenanceLog, QuantityByStatus } from "@/types";
import { EQUIPMENT_STATUSES } from '@/lib/constants';
import { useAppContext, useAppDispatch } from "@/contexts/AppContext";
import { useToast } from "@/hooks/use-toast";
import { getStatusBreakdownString, updateQuantityByStatus } from "@/lib/equipment-utils";
import { useTranslate } from '@/contexts/TranslationContext';

// Translation helper component
const T = ({ text }: { text: string }) => {
  const { translated } = useTranslate(text);
  return <>{translated}</>;
};

// Work log tags/categories
const WORK_TAGS = [
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'repair', label: 'Repair' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'parts-replacement', label: 'Parts Replacement' },
  { id: 'calibration', label: 'Calibration' },
  { id: 'testing', label: 'Testing' },
  { id: 'preventive', label: 'Preventive Maintenance' },
];

const workLogSchema = z.object({
  equipmentId: z.string().min(1, "Equipment is required."),
  date: z.date({ required_error: "Date is required." }),
  description: z.string().min(5, "Description must be at least 5 characters."),
  workStatus: z.enum(['pending', 'in-progress', 'completed']).default('completed'),
  cost: z.coerce.number().min(0, "Cost cannot be negative.").optional(),
  hoursSpent: z.coerce.number().min(0, "Hours cannot be negative.").optional(),
  technician: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isOutsideRepair: z.boolean().default(false),
  vendorName: z.string().optional(),
  expectedReturnDate: z.date().optional(),
  repairStatus: z.enum(['sent', 'in-progress', 'ready-for-pickup', 'returned']).optional(),
  referenceNumber: z.string().optional(),
  updateStatus: z.string().optional(),
  quantityAffected: z.coerce.number().min(1, "At least 1 unit must be affected.").optional(),
});

type WorkLogFormValues = z.infer<typeof workLogSchema>;

interface WorkLogDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  equipmentItem?: EquipmentItem; // If provided, pre-select this equipment
}

export function WorkLogDialog({ isOpen, onOpenChange, equipmentItem }: WorkLogDialogProps) {
  const { equipment } = useAppContext();
  const { addMaintenanceLog, updateEquipmentItem } = useAppDispatch();
  const { toast } = useToast();

  // Translation hooks
  const { translated: addWorkLogText } = useTranslate('Add Work Log');
  const { translated: workLogAddedText } = useTranslate('Work Log Added');
  const { translated: logAddedForText } = useTranslate('Log added for');
  const { translated: errorText } = useTranslate('Error');
  const { translated: failedToAddText } = useTranslate('Failed to add work log.');
  const { translated: equipmentLabel } = useTranslate('Equipment');
  const { translated: selectEquipmentText } = useTranslate('Select equipment');
  const { translated: dateOfWorkText } = useTranslate('Date of Work');
  const { translated: pickDateText } = useTranslate('Pick a date');
  const { translated: workStatusText } = useTranslate('Work Status');
  const { translated: pendingText } = useTranslate('Pending');
  const { translated: inProgressText } = useTranslate('In Progress');
  const { translated: completedText } = useTranslate('Completed');
  const { translated: descriptionLabel } = useTranslate('Description of Work');
  const { translated: descriptionPlaceholder } = useTranslate('Describe the work performed or issue resolved...');
  const { translated: workTypeLabel } = useTranslate('Work Type (Select all that apply)');
  const { translated: hoursSpentLabel } = useTranslate('Hours Spent (Optional)');
  const { translated: costLabel } = useTranslate('Cost ($) (Optional)');
  const { translated: technicianLabel } = useTranslate('Technician (Optional)');
  const { translated: technicianPlaceholder } = useTranslate('Name of technician');
  const { translated: notesLabel } = useTranslate('Notes (Optional)');
  const { translated: notesPlaceholder } = useTranslate('Additional details, diagnostics, or recommendations...');
  const { translated: outsideRepairLabel } = useTranslate('Sent for Outside Repair');
  const { translated: vendorLabel } = useTranslate('Vendor/Shop Name');
  const { translated: vendorPlaceholder } = useTranslate('Name of repair shop');
  const { translated: expectedReturnLabel } = useTranslate('Expected Return Date');
  const { translated: pickReturnDateText } = useTranslate('Pick return date');
  const { translated: repairStatusLabel } = useTranslate('Repair Status');
  const { translated: sentToVendorText } = useTranslate('Sent to Vendor');
  const { translated: readyForPickupText } = useTranslate('Ready for Pickup');
  const { translated: returnedText } = useTranslate('Returned');
  const { translated: referenceNumberLabel } = useTranslate('Reference Number (Optional)');
  const { translated: referencePlaceholder } = useTranslate('Invoice or ticket number');
  const { translated: updateStatusLabel } = useTranslate('Update Equipment Status (Optional)');
  const { translated: noChangeText } = useTranslate('No Change');
  const { translated: cancelText } = useTranslate('Cancel');
  const { translated: addLogText } = useTranslate('Add Log');
  const { translated: recordActivityText } = useTranslate('Record a maintenance or repair activity. You can also update the item\'s status.');
  const { translated: selectEquipmentLogText } = useTranslate('Select equipment and log maintenance or repair work performed.');

  const form = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      equipmentId: equipmentItem?.id || '',
      date: new Date(),
      description: "",
      workStatus: 'completed',
      cost: undefined,
      hoursSpent: undefined,
      technician: "",
      tags: [],
      notes: "",
      isOutsideRepair: false,
      vendorName: "",
      expectedReturnDate: undefined,
      repairStatus: 'sent',
      referenceNumber: "",
      updateStatus: "no-change",
      quantityAffected: 1,
    },
  });

  const isOutsideRepair = form.watch('isOutsideRepair');
  const selectedTags = form.watch('tags') || [];
  const updateStatus = form.watch('updateStatus');

  // Filter equipment - if equipmentItem is provided, only allow adding to that item
  // Otherwise, show all equipment so users can select any item to add maintenance logs to
  const availableEquipment = equipmentItem 
    ? [equipmentItem]
    : equipment.sort((a, b) => a.name.localeCompare(b.name));

  function onSubmit(data: WorkLogFormValues) {
    try {
      const selectedItem = equipment.find(item => item.id === data.equipmentId);
      if (!selectedItem) return;

      const newLog: MaintenanceLog & { 
        workStatus?: string;
        hoursSpent?: number;
        tags?: string[];
        notes?: string;
        isOutsideRepair?: boolean;
        vendorName?: string;
        expectedReturnDate?: Date;
        repairStatus?: string;
        referenceNumber?: string;
      } = {
        id: Date.now().toString(),
        equipmentId: data.equipmentId,
        date: data.date,
        description: data.description,
        cost: data.cost,
        workStatus: data.workStatus,
        hoursSpent: data.hoursSpent,
        tags: data.tags,
        notes: data.notes,
        isOutsideRepair: data.isOutsideRepair,
        vendorName: data.isOutsideRepair ? data.vendorName : undefined,
        expectedReturnDate: data.isOutsideRepair ? data.expectedReturnDate : undefined,
        repairStatus: data.isOutsideRepair ? data.repairStatus : undefined,
        referenceNumber: data.isOutsideRepair ? data.referenceNumber : undefined,
      };

      addMaintenanceLog(newLog);

      // Update quantityByStatus if status change is requested
      if (data.updateStatus && data.updateStatus !== "no-change" && data.updateStatus !== selectedItem.status) {
        const qbs = (selectedItem.quantityByStatus || {
          good: selectedItem.quantity || 0,
          damaged: 0,
          maintenance: 0,
        }) as QuantityByStatus;
        const newQbs = updateQuantityByStatus(qbs, data.updateStatus as EquipmentStatus, data.quantityAffected || 1);
        updateEquipmentItem({ 
          ...selectedItem, 
          status: data.updateStatus as EquipmentStatus,
          quantityByStatus: newQbs,
        });
      }

      toast({ 
        title: workLogAddedText, 
        description: `${logAddedForText} ${selectedItem.name}.` 
      });
      onOpenChange(false);
      form.reset({
        equipmentId: equipmentItem?.id || '',
        date: new Date(),
        description: "",
        workStatus: 'completed',
        cost: undefined,
        hoursSpent: undefined,
        technician: "",
        tags: [],
        notes: "",
        isOutsideRepair: false,
        vendorName: "",
        expectedReturnDate: undefined,
        repairStatus: 'sent',
        referenceNumber: "",
        updateStatus: "no-change",
        quantityAffected: 1,
      });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: errorText, 
        description: failedToAddText 
      });
    }
  }

  const isAddingToExisting = !!equipmentItem;
  const dialogTitle = isAddingToExisting 
    ? `${addWorkLogText} - "${equipmentItem.name}"`
    : addWorkLogText;
  const dialogDescription = isAddingToExisting
    ? recordActivityText
    : selectEquipmentLogText;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Equipment Selection - only show if not adding to specific equipment */}
            {!isAddingToExisting && (
              <FormField
                control={form.control}
                name="equipmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{equipmentLabel}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectEquipmentText} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableEquipment.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.location}) - {item.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{dateOfWorkText}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button 
                          variant={"outline"} 
                          className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
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

            {/* Work Status Field */}
            <FormField
              control={form.control}
              name="workStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{workStatusText} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">{pendingText}</SelectItem>
                      <SelectItem value="in-progress">{inProgressText}</SelectItem>
                      <SelectItem value="completed">{completedText}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{descriptionLabel}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={descriptionPlaceholder} 
                      {...field} 
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Work Tags Field */}
            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>{workTypeLabel}</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {WORK_TAGS.map(tag => (
                      <FormField
                        key={tag.id}
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(tag.id) || false}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, tag.id]);
                                  } else {
                                    field.onChange(current.filter(id => id !== tag.id));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {tag.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />

            {/* Hours Spent and Cost Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hoursSpent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{hoursSpentLabel}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.5" 
                        step="0.25"
                        min="0"
                        {...field} 
                      />
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
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        step="0.01"
                        min="0"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Technician Field */}
            <FormField
              control={form.control}
              name="technician"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{technicianLabel}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={technicianPlaceholder} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{notesLabel}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={notesPlaceholder} 
                      {...field} 
                      className="min-h-[60px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Outside Repair Section */}
            <FormField
              control={form.control}
              name="isOutsideRepair"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-semibold cursor-pointer">
                    {outsideRepairLabel}
                  </FormLabel>
                </FormItem>
              )}
            />

            {/* Outside Repair Fields - Only show when checkbox is checked */}
            {isOutsideRepair && (
              <div className="space-y-4 p-4 border border-dashed rounded-lg bg-muted/30">
                <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{vendorLabel}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={vendorPlaceholder} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedReturnDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{expectedReturnLabel}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button 
                              variant={"outline"} 
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "MMM dd, yyyy") : <span>{pickReturnDateText}</span>}
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
                  name="repairStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{repairStatusLabel}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'sent'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sent">{sentToVendorText}</SelectItem>
                          <SelectItem value="in-progress">{inProgressText}</SelectItem>
                          <SelectItem value="ready-for-pickup">{readyForPickupText}</SelectItem>
                          <SelectItem value="returned">{returnedText}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{referenceNumberLabel}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={referencePlaceholder} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Cost Field */}
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{costLabel}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      step="0.01"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Technician Field */}
            <FormField
              control={form.control}
              name="technician"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{technicianLabel}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={technicianPlaceholder} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Update Field */}
            <FormField
              control={form.control}
              name="updateStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{updateStatusLabel}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                render={({ field }) => {
                  const selectedItem = equipment.find(item => item.id === form.watch('equipmentId'));
                  return (
                    <FormItem>
                      <FormLabel>
                        Number of Units to {updateStatus === 'good' ? 'Repair' : updateStatus === 'maintenance' ? 'Move to Maintenance' : 'Mark as Damaged'} (1-{selectedItem?.quantity || 0})
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          min="1"
                          max={selectedItem?.quantity}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">{cancelText}</Button>
              </DialogClose>
              <Button 
                type="submit"
                disabled={!form.watch('equipmentId') || !form.watch('description')}
              >
                {addLogText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
