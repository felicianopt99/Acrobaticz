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
        title: "Work Log Added", 
        description: `Log added for ${selectedItem.name}.` 
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
        title: "Error", 
        description: "Failed to add work log." 
      });
    }
  }

  const isAddingToExisting = !!equipmentItem;
  const dialogTitle = isAddingToExisting 
    ? `Add Work Log for "${equipmentItem.name}"`
    : "Add Work Log";
  const dialogDescription = isAddingToExisting
    ? "Record a maintenance or repair activity. You can also update the item's status."
    : "Select equipment and log maintenance or repair work performed.";

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
                    <FormLabel>Equipment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
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
                  <FormLabel>Date of Work</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button 
                          variant={"outline"} 
                          className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                  <FormLabel>Work Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
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
                  <FormLabel>Description of Work</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the work performed or issue resolved..." 
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
                  <FormLabel>Work Type (Select all that apply)</FormLabel>
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
                    <FormLabel>Hours Spent (Optional)</FormLabel>
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
                    <FormLabel>Cost ($) (Optional)</FormLabel>
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
                  <FormLabel>Technician (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Name of technician" 
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional details, diagnostics, or recommendations..." 
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
                    Sent for Outside Repair
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
                      <FormLabel>Vendor/Shop Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Name of repair shop" 
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
                      <FormLabel>Expected Return Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button 
                              variant={"outline"} 
                              className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "MMM dd, yyyy") : <span>Pick return date</span>}
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
                      <FormLabel>Repair Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'sent'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sent">Sent to Vendor</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="ready-for-pickup">Ready for Pickup</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
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
                      <FormLabel>Reference Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Invoice or ticket number" 
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
                  <FormLabel>Cost ($) (Optional)</FormLabel>
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
                  <FormLabel>Technician (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Technician name" 
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
                  <FormLabel>Update Equipment Status (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No Change" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="no-change">No Change</SelectItem>
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
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                type="submit"
                disabled={!form.watch('equipmentId') || !form.watch('description')}
              >
                Add Log
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
