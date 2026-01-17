
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { EquipmentItem, Category, Subcategory, EquipmentStatus, EquipmentType, QuantityByStatus } from "@/types";
import { EQUIPMENT_STATUSES } from "@/lib/constants";
import { useAppContext, useAppDispatch } from "@/contexts/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { categoriesAPI, subcategoriesAPI } from '@/lib/api';
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo, useCallback, forwardRef } from "react";
import AIEquipmentAssistant from "./AIEquipmentAssistant";
import { getStatusBreakdownString } from "@/lib/equipment-utils";
import { useTranslate } from '@/contexts/TranslationContext';
import { 
  Eye, 
  EyeOff, 
  Package, 
  FolderTree, 
  DollarSign, 
  MapPin, 
  Image as ImageIcon, 
  CheckCircle2, 
  Circle, 
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  ArrowLeft,
  AlertCircle,
  Info,
  Sparkles,
  Box,
  Recycle
} from "lucide-react";

const NO_SUBCATEGORY_VALUE = "__no_subcategory__";

// Helper to prevent scroll on input focus
const preventScrollOnFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  // Store scroll position before browser auto-scrolls
  const scrollTop = window.scrollY;
  const scrollLeft = window.scrollX;
  
  // Use multiple timing strategies to catch the scroll at different phases
  // setTimeout with 0ms executes after the current event loop
  setTimeout(() => {
    window.scrollTo(scrollLeft, scrollTop);
  }, 0);
  
  // Also use requestAnimationFrame as a backup
  requestAnimationFrame(() => {
    window.scrollTo(scrollLeft, scrollTop);
  });
};

const equipmentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  description: z.string().min(10, "Description must be at least 10 characters.").max(500),
  type: z.enum(["equipment", "consumable"] as [EquipmentType, ...EquipmentType[]]),
  categoryId: z.string().min(1, "Please select a category."),
  subcategoryId: z.string().optional(),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative."),
  dailyRate: z.coerce.number().min(0, "Daily rate cannot be negative.").optional().default(0),
  status: z.enum(["good", "damaged", "maintenance"] as [EquipmentStatus, ...EquipmentStatus[]], {
    required_error: "You need to select a status.",
  }),
  location: z.string().min(2, "Location must be at least 2 characters.").max(50),
  imageUrl: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim() : val),
    z.string()
      .optional()
      .refine(
        (val) =>
          !val ||
          val === '' ||
          z.string().url().safeParse(val).success ||
          (typeof val === 'string' && val.startsWith('/')),
        { message: "Please enter a valid image URL (http(s)://...) or a relative path starting with /, or leave blank." }
      )
  ),
});

type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

interface EquipmentFormProps {
  initialData?: EquipmentItem;
  onSubmitSuccess?: () => void;
}

export function EquipmentForm({ initialData, onSubmitSuccess }: EquipmentFormProps) {
  const { categories, subcategories: allSubcategories, equipment } = useAppContext();
  const { addEquipmentItem, updateEquipmentItem, refreshData, addCategory, addSubcategory } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  
  // Translation hooks
  const { translated: uiResetFormText } = useTranslate('Reset Form');
  const { translated: uiClearAllText } = useTranslate('Clear all form fields');
  const { translated: uiBasicInfoText } = useTranslate('Basic Information');
  const { translated: uiBasicInfoDescText } = useTranslate('Equipment name, description, and type');
  const { translated: uiEquipmentNameText } = useTranslate('Equipment Name');
  const { translated: uiRequiredText } = useTranslate('Required');
  const { translated: uiDescriptionText } = useTranslate('Description');
  const { translated: uiItemTypeText } = useTranslate('Item Type');
  const { translated: uiEquipmentText } = useTranslate('Equipment');
  const { translated: uiConsumableText } = useTranslate('Consumable');
  const { translated: uiRentableItemsText } = useTranslate('Rentable items with daily rate');
  const { translated: uiStockItemsText } = useTranslate('Stock items like tape or batteries');
  const { translated: uiCategorizationText } = useTranslate('Categorization');
  const { translated: uiCategorizationDescText } = useTranslate('Organize equipment in your inventory system');
  const { translated: uiCategoryText } = useTranslate('Category');
  const { translated: uiSubcategoryText } = useTranslate('Subcategory');
  const { translated: uiOptionalText } = useTranslate('Optional');
  const { translated: uiSelectCategoryText } = useTranslate('Select a category');
  const { translated: uiSelectCategoryFirstText } = useTranslate('Select a category first');
  const { translated: uiNoSubcategoriesText } = useTranslate('No subcategories available');
  const { translated: uiSelectSubcategoryText } = useTranslate('Select a subcategory');
  const { translated: uiNoSubcategoryText } = useTranslate('No subcategory');
  const { translated: uiNoCategoriesText } = useTranslate('No categories available. Create one first.');
  const { translated: uiAddNewCategoryText } = useTranslate('Add new category...');
  const { translated: uiAddNewSubcategoryText } = useTranslate('Add new subcategory...');
  const { translated: uiHelpsOrganizeText } = useTranslate('Helps organize within categories');
  const { translated: uiInventoryPricingText } = useTranslate('Inventory & Pricing');
  const { translated: uiInventoryPricingDescText } = useTranslate('Stock quantity and rental rate');
  const { translated: uiQuantityInStockText } = useTranslate('Quantity in Stock');
  const { translated: uiTotalUnitsText } = useTranslate('Total units available in inventory');
  const { translated: uiDailyRateText } = useTranslate('Daily Rate');
  const { translated: uiNAConsumablesText } = useTranslate('N/A for consumables');
  const { translated: uiConsumablesNoRateText } = useTranslate("Consumables don't have rental rates");
  const { translated: uiPhysicalInfoText } = useTranslate('Physical Information');
  const { translated: uiPhysicalInfoDescText } = useTranslate('Location and status in inventory');
  const { translated: uiPhysicalLocationText } = useTranslate('Physical Location');
  const { translated: uiWhereStoredText } = useTranslate('Where this equipment is physically stored');
  const { translated: uiExistingLocationsText } = useTranslate('existing locations available');
  const { translated: uiStatusText } = useTranslate('Status');
  const { translated: uiGoodText } = useTranslate('Good');
  const { translated: uiMaintenanceText } = useTranslate('In Maintenance');
  const { translated: uiDamagedText } = useTranslate('Damaged');
  const { translated: uiReadyToRentText } = useTranslate('Ready to rent');
  const { translated: uiInServiceText } = useTranslate('In service');
  const { translated: uiNeedsRepairText } = useTranslate('Needs repair');
  const { translated: uiQuantityBreakdownText } = useTranslate('Quantity Breakdown by Status');
  const { translated: uiMaintenanceLogText } = useTranslate('Use the Maintenance Log feature to update individual unit statuses.');
  const { translated: uiMediaText } = useTranslate('Media');
  const { translated: uiMediaDescText } = useTranslate('Equipment image for visual identification');
  const { translated: uiImageURLText } = useTranslate('Image URL');
  const { translated: uiProvideURLText } = useTranslate('Provide a URL for the equipment image. Use a placeholder if needed:');
  const { translated: uiImageCannotPreviewText } = useTranslate('Image cannot be previewed');
  const { translated: uiWebsiteBlockText } = useTranslate('The website may block external access. The URL will still be saved.');
  const { translated: uiOpenNewTabText } = useTranslate('Open in new tab');
  const { translated: uiHidePreviewText } = useTranslate('Hide Preview');
  const { translated: uiShowPreviewText } = useTranslate('Show Preview');
  const { translated: uiSavingText } = useTranslate('Saving...');
  const { translated: uiUpdateEquipmentText } = useTranslate('Update Equipment');
  const { translated: uiAddEquipmentText } = useTranslate('Add Equipment');
  const { translated: uiCancelText } = useTranslate('Cancel');
  const { translated: uiBackToInventoryText } = useTranslate('Back to Inventory');
  const { translated: uiFixErrorsText } = useTranslate('Please fix the errors above before submitting');
  const { translated: uiAddNewCategoryTitleText } = useTranslate('Add New Category');
  const { translated: uiAddNewCategoryDescText } = useTranslate('Enter a new category name to organize your equipment.');
  const { translated: uiCategoryNameText } = useTranslate('Category name');
  const { translated: uiCreateCategoryText } = useTranslate('Create Category');
  const { translated: uiCreatingText } = useTranslate('Creating...');
  const { translated: uiAddNewSubcategoryTitleText } = useTranslate('Add New Subcategory');
  const { translated: uiAddNewSubcategoryDescText } = useTranslate('Add a subcategory for the selected category.');
  const { translated: uiSubcategoryNameText } = useTranslate('Subcategory name');
  const { translated: uiCreateSubcategoryText } = useTranslate('Create Subcategory');
  const { translated: uiValidationErrorsText } = useTranslate('Validation errors:');
  const { translated: uiFormResetText } = useTranslate('Form Reset');
  const { translated: uiAllFieldsClearedText } = useTranslate('All fields have been cleared.');
  const { translated: uiBrandModelTipText } = useTranslate('Brand + Model for clarity (e.g., "Sony A7III Camera")');
  const { translated: uiDetailedDescText } = useTranslate('Detailed description of the equipment (10-500 characters)');

  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>(initialData?.imageUrl || "");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    category: true,
    inventory: true,
    physical: true,
    media: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);
  
  // Local state for number inputs to handle AI-filled values
  const [dailyRateInput, setDailyRateInput] = useState<string>(String(initialData?.dailyRate || 0));
  const [quantityInput, setQuantityInput] = useState<string>(String(initialData?.quantity || 0));
  const [imageLoadError, setImageLoadError] = useState(false);

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      quantity: initialData.quantity || 0,
      dailyRate: initialData.dailyRate || 0,
      imageUrl: initialData.imageUrl || '',
      subcategoryId: initialData.subcategoryId || "", // Ensure empty string if undefined
      type: initialData.type || 'equipment',
    } : {
      name: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      quantity: 0,
      dailyRate: 0,
      status: "good",
      location: "",
      imageUrl: "",
      type: "equipment",
    },
  });
  
  const selectedCategoryId = form.watch("categoryId");
  const itemType = form.watch("type");

  // Handle AI-generated equipment data
  const handleAIEquipmentGenerated = async (equipmentData: any, refreshDataCallback?: () => Promise<void>) => {
    console.log('=== AI Equipment Data received ===');
    console.log('Full equipmentData:', JSON.stringify(equipmentData, null, 2));
    console.log('equipmentData.dailyRate:', equipmentData.dailyRate);
    console.log('typeof equipmentData.dailyRate:', typeof equipmentData.dailyRate);
    
    // If categories were created, refresh the data first
    if (refreshDataCallback) {
      console.log('Refreshing categories data...');
      await refreshDataCallback();
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('Available categories:', categories);
    console.log('Available subcategories:', allSubcategories);
    
    let categoryId = "";
    let subcategoryId = "";

    // If AI assistant provided direct IDs (from newly created categories), use them
    if (equipmentData.categoryId) {
      categoryId = equipmentData.categoryId;
      console.log('Using direct categoryId:', categoryId);
    } else {
      // Find matching category by name
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(equipmentData.category.toLowerCase()) ||
        equipmentData.category.toLowerCase().includes(cat.name.toLowerCase())
      );
      categoryId = matchingCategory?.id || "";
      console.log('Found matching category:', matchingCategory, 'ID:', categoryId);
    }

    // Handle subcategory
    if (equipmentData.subcategoryId) {
      subcategoryId = equipmentData.subcategoryId;
      console.log('Using direct subcategoryId:', subcategoryId);
    } else if (equipmentData.subcategory && categoryId) {
      // Find matching subcategory by name
      const matchingSubcategory = allSubcategories.find(sub => 
        sub.parentId === categoryId &&
        (sub.name.toLowerCase().includes(equipmentData.subcategory.toLowerCase()) ||
         equipmentData.subcategory.toLowerCase().includes(sub.name.toLowerCase()))
      );
      subcategoryId = matchingSubcategory?.id || "";
      console.log('Found matching subcategory:', matchingSubcategory, 'ID:', subcategoryId);
    }

    // Update form with AI data
    form.setValue("name", equipmentData.name || "");
    form.setValue("description", equipmentData.description || "");
    form.setValue("categoryId", categoryId);
    form.setValue("subcategoryId", subcategoryId);
    
    // Ensure dailyRate is a number and properly set
    let dailyRateValue = 0;
    if (typeof equipmentData.dailyRate === 'number') {
      dailyRateValue = equipmentData.dailyRate;
    } else if (typeof equipmentData.dailyRate === 'string') {
      dailyRateValue = parseFloat(equipmentData.dailyRate) || 0;
    }
    
    console.log('=== Setting dailyRate ===');
    console.log('Computed dailyRateValue:', dailyRateValue);
    console.log('String value for input:', String(dailyRateValue));
    
    // Set both form value AND local state for the input
    form.setValue("dailyRate", dailyRateValue);
    setDailyRateInput(String(dailyRateValue));
    
    console.log('After setDailyRateInput, checking form value:', form.getValues("dailyRate"));
    
    form.setValue("imageUrl", equipmentData.imageUrl || "");
    if (equipmentData.imageUrl) {
      setImagePreviewUrl(equipmentData.imageUrl);
      setImageLoadError(false); // Reset error for new URL
    }
    form.setValue("location", "Warehouse"); // Default location
    form.setValue("status", "good"); // Default status
    form.setValue("quantity", 1); // Default quantity
    setQuantityInput("1");

    toast({
      title: "AI Assistant",
      description: `Form filled with details for: ${equipmentData.name}${dailyRateValue > 0 ? ` (Suggested rate: €${dailyRateValue.toFixed(2)}/day)` : ''}`,
    });
  };

  // Create a new category via API and select it
  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast({ variant: 'destructive', title: 'Invalid name', description: 'Category name cannot be empty.' });
      return;
    }
    // Prevent duplicates (case-insensitive)
    const exists = categories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast({ variant: 'destructive', title: 'Duplicate', description: 'A category with that name already exists.' });
      return;
    }

    try {
      setCreatingCategory(true);
      const created = await categoriesAPI.create({ name });
      await refreshData();
      form.setValue('categoryId', created.id);
      setShowAddCategoryDialog(false);
      setNewCategoryName('');
      toast({ title: 'Category created', description: `${created.name} was added.` });
    } catch (err) {
      console.error('Failed to create category', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create category.' });
    } finally {
      setCreatingCategory(false);
    }
  };

  // Create a new subcategory under the currently selected category
  const createSubcategory = async () => {
    const name = newSubcategoryName.trim();
    const parentId = form.getValues('categoryId');
    if (!parentId) {
      toast({ variant: 'destructive', title: 'No category', description: 'Please select a category first.' });
      return;
    }
    if (!name) {
      toast({ variant: 'destructive', title: 'Invalid name', description: 'Subcategory name cannot be empty.' });
      return;
    }
    // Prevent duplicate subcategory names under same parent
    const exists = allSubcategories.some(sub => sub.parentId === parentId && sub.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      toast({ variant: 'destructive', title: 'Duplicate', description: 'A subcategory with that name already exists for this category.' });
      return;
    }

    try {
      setCreatingSubcategory(true);
      const created = await subcategoriesAPI.create({ name, parentId });
      await refreshData();
      form.setValue('subcategoryId', created.id);
      setShowAddSubcategoryDialog(false);
      setNewSubcategoryName('');
      toast({ title: 'Subcategory created', description: `${created.name} was added.` });
    } catch (err) {
      console.error('Failed to create subcategory', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create subcategory.' });
    } finally {
      setCreatingSubcategory(false);
    }
  };

  useEffect(() => {
    if (selectedCategoryId) {
      const filteredSubs = allSubcategories.filter(sub => sub.parentId === selectedCategoryId);
      setAvailableSubcategories(filteredSubs);
      const currentSubcategoryId = form.getValues("subcategoryId");
      // If current subcategory is not in the new list of available ones, reset it
      if (currentSubcategoryId && !filteredSubs.find(s => s.id === currentSubcategoryId)) {
        form.setValue("subcategoryId", ""); // Reset to empty string for "No subcategory"
      }
    } else {
      setAvailableSubcategories([]);
      form.setValue("subcategoryId", "");
    }
  }, [selectedCategoryId, allSubcategories, form]);

  useEffect(() => {
    if (itemType === 'consumable') {
      form.setValue('dailyRate', 0);
    }
  }, [itemType, form]);

  // Populate location suggestions from existing equipment
  useEffect(() => {
    if (equipment && equipment.length > 0) {
      const locations = [...new Set(equipment.map(e => e.location).filter(Boolean))].sort();
      setAvailableLocations(locations);
    }
  }, [equipment]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const resetForm = () => {
    form.reset({
      name: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      quantity: 0,
      dailyRate: 0,
      status: "good",
      location: "",
      imageUrl: "",
      type: "equipment",
    });
    setImagePreviewUrl("");
    toast({
      title: uiFormResetText,
      description: uiAllFieldsClearedText,
    });
  };


  async function onSubmit(data: EquipmentFormValues) {
    setIsSubmitting(true);
    try {
      const normalizedSubId = data.subcategoryId && data.subcategoryId.trim().length > 0 && data.subcategoryId !== NO_SUBCATEGORY_VALUE
        ? data.subcategoryId
        : undefined;

      const finalData = {
        ...data,
        subcategoryId: normalizedSubId,
      };

      if (initialData) {
        await updateEquipmentItem({ ...initialData, ...finalData });
        toast({ title: "✅ Equipment Updated", description: `${finalData.name} has been successfully updated.` });
      } else {
        await addEquipmentItem(finalData as any);
        toast({ title: "✅ Equipment Added", description: `${finalData.name} has been successfully added to inventory.` });
      }
      onSubmitSuccess ? onSubmitSuccess() : router.push("/inventory");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save equipment. Please try again." });
      console.error("Error saving equipment:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Section card component for consistent styling
  const SectionCard = ({ 
    id, 
    title, 
    description, 
    icon: Icon, 
    children,
    badge,
  }: { 
    id: string; 
    title: string; 
    description: string; 
    icon: React.ElementType; 
    children: React.ReactNode;
    badge?: React.ReactNode;
  }) => (
    <Collapsible open={expandedSections[id]} onOpenChange={() => toggleSection(id)}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md border-l-4 border-l-primary/20 hover:border-l-primary/50 scroll-mt-24">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {title}
                    {badge}
                  </CardTitle>
                  <CardDescription className="text-sm">{description}</CardDescription>
                </div>
              </div>
              <div className="text-muted-foreground">
                {expandedSections[id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-2 pb-6 space-y-6">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );

  return (
    <TooltipProvider>
      <Form {...form}>
        {/* DEBUG: Show all form errors at the top for troubleshooting */}
        {Object.keys(form.formState.errors).length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 border border-red-300">
            <strong>{uiValidationErrorsText}</strong>
            <ul className="list-disc ml-5 mt-1">
              {Object.entries(form.formState.errors).map(([field, error]) => (
                <li key={field}>
                  <span className="font-semibold">{field}:</span> {error?.message || JSON.stringify(error)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Form Actions */}
          {!initialData && (
            <div className="flex justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">{uiResetFormText}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{uiClearAllText}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* AI Equipment Assistant */}
          <AIEquipmentAssistant 
            onEquipmentGenerated={handleAIEquipmentGenerated}
            refreshData={refreshData}
            disabled={false}
          />
          
          {/* BASIC INFORMATION SECTION */}
          <SectionCard
            id="basic"
            title={uiBasicInfoText}
            description={uiBasicInfoDescText}
            icon={Package}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {uiEquipmentNameText}
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{uiRequiredText}</Badge>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Shure SM58 Microphone" 
                      {...field} 
                      className="text-base"
                      onFocus={preventScrollOnFocus}
                    />
                  </FormControl>
                  <FormDescription className="flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {uiBrandModelTipText}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {uiDescriptionText}
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{uiRequiredText}</Badge>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of the equipment, features, and usage..." 
                      className="min-h-24 text-base resize-none" 
                      {...field}
                      onFocus={preventScrollOnFocus}
                    />
                  </FormControl>
                  <FormDescription>{uiDetailedDescText}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    {uiItemTypeText}
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{uiRequiredText}</Badge>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <FormItem>
                        <FormControl>
                          <label
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              field.value === 'equipment'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <RadioGroupItem value="equipment" className="sr-only" />
                            <div className={`p-2 rounded-lg ${field.value === 'equipment' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <Box className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{uiEquipmentText}</p>
                              <p className="text-xs text-muted-foreground">{uiRentableItemsText}</p>
                            </div>
                            {field.value === 'equipment' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </label>
                        </FormControl>
                      </FormItem>
                      <FormItem>
                        <FormControl>
                          <label
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              field.value === 'consumable'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <RadioGroupItem value="consumable" className="sr-only" />
                            <div className={`p-2 rounded-lg ${field.value === 'consumable' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <Recycle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{uiConsumableText}</p>
                              <p className="text-xs text-muted-foreground">{uiStockItemsText}</p>
                            </div>
                            {field.value === 'consumable' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </label>
                        </FormControl>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>
          {/* Add Category Dialog */}
          <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{uiAddNewCategoryTitleText}</DialogTitle>
                <DialogDescription>{uiAddNewCategoryDescText}</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <input
                  className="w-full border px-3 py-2 rounded-md"
                  placeholder={uiCategoryNameText}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <div className="flex gap-2 w-full justify-end mt-4">
                  <Button variant="outline" onClick={() => { setShowAddCategoryDialog(false); setNewCategoryName(''); }}>{uiCancelText}</Button>
                  <Button onClick={createCategory} disabled={creatingCategory}>{creatingCategory ? uiCreatingText : uiCreateCategoryText}</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Subcategory Dialog */}
          <Dialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{uiAddNewSubcategoryTitleText}</DialogTitle>
                <DialogDescription>{uiAddNewSubcategoryDescText}</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <input
                  className="w-full border px-3 py-2 rounded-md"
                  placeholder={uiSubcategoryNameText}
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <div className="flex gap-2 w-full justify-end mt-4">
                  <Button variant="outline" onClick={() => { setShowAddSubcategoryDialog(false); setNewSubcategoryName(''); }}>{uiCancelText}</Button>
                  <Button onClick={createSubcategory} disabled={creatingSubcategory}>{creatingSubcategory ? uiCreatingText : uiCreateSubcategoryText}</Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* CATEGORIZATION SECTION */}
          <SectionCard
            id="category"
            title={uiCategorizationText}
            description={uiCategorizationDescText}
            icon={FolderTree}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {uiCategoryText}
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{uiRequiredText}</Badge>
                    </FormLabel>
                    <Select onValueChange={(val) => {
                        if (val === '__add_new__') {
                          setShowAddCategoryDialog(true);
                        } else {
                          field.onChange(val);
                        }
                      }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full text-base">
                          <SelectValue placeholder={uiSelectCategoryText} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                        <SelectItem value="__add_new__">{uiAddNewCategoryText}</SelectItem>
                      </SelectContent>
                    </Select>
                    {categories.length === 0 && (
                      <p className="text-xs text-orange-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {uiNoCategoriesText}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subcategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {uiSubcategoryText}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{uiOptionalText}</Badge>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value === '__add_sub__') {
                          setShowAddSubcategoryDialog(true);
                        } else {
                          field.onChange(value === NO_SUBCATEGORY_VALUE ? "" : value);
                        }
                      }}
                      value={field.value || NO_SUBCATEGORY_VALUE}
                      disabled={availableSubcategories.length === 0 && !selectedCategoryId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full text-base">
                          <SelectValue placeholder={
                            !selectedCategoryId ? uiSelectCategoryFirstText :
                            availableSubcategories.length === 0 ? uiNoSubcategoriesText :
                            uiSelectSubcategoryText
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         <SelectItem value={NO_SUBCATEGORY_VALUE}>{uiNoSubcategoryText}</SelectItem>
                        {availableSubcategories.map(subcat => (
                          <SelectItem key={subcat.id} value={subcat.id}>{subcat.name}</SelectItem>
                        ))}
                        {selectedCategoryId && <SelectItem value="__add_sub__">{uiAddNewSubcategoryText}</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormDescription>{uiHelpsOrganizeText}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          {/* INVENTORY & PRICING SECTION */}
          <SectionCard
            id="inventory"
            title={uiInventoryPricingText}
            description={uiInventoryPricingDescText}
            icon={DollarSign}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {uiQuantityInStockText}
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{uiRequiredText}</Badge>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={quantityInput}
                          onChange={(e) => {
                            const scrollTop = window.scrollY;
                            const scrollLeft = window.scrollX;
                            setQuantityInput(e.target.value);
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            field.onChange(val);
                            setTimeout(() => window.scrollTo(scrollLeft, scrollTop), 0);
                          }}
                          onFocus={preventScrollOnFocus}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          className="text-base pl-11"
                          min="0"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>{uiTotalUnitsText}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dailyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {uiDailyRateText} (€)
                      {itemType === 'consumable' && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{uiNAConsumablesText}</Badge>
                      )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={dailyRateInput}
                          onChange={(e) => {
                            const scrollTop = window.scrollY;
                            const scrollLeft = window.scrollX;
                            setDailyRateInput(e.target.value);
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            field.onChange(val);
                            setTimeout(() => window.scrollTo(scrollLeft, scrollTop), 0);
                          }}
                          onFocus={preventScrollOnFocus}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          disabled={itemType === 'consumable'}
                          className="text-base pr-8"
                          min="0"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium text-sm">€</span>
                      </div>
                    </FormControl>
                    {itemType === 'consumable' && (
                      <FormDescription className="text-orange-500">{uiConsumablesNoRateText}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          {/* PHYSICAL INFORMATION SECTION */}
          <SectionCard
            id="physical"
            title={uiPhysicalInfoText}
            description={uiPhysicalInfoDescText}
            icon={MapPin}
          >
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => {
                const [showSuggestions, setShowSuggestions] = useState(false);
                const filteredLocations = availableLocations.filter(loc => 
                  loc.toLowerCase().includes((field.value || '').toLowerCase())
                );
                
                return (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {uiPhysicalLocationText}
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{uiRequiredText}</Badge>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                        <Input 
                          placeholder="e.g., Shelf A1, Warehouse B" 
                          {...field}
                          onChange={(e) => {
                            const scrollTop = window.scrollY;
                            const scrollLeft = window.scrollX;
                            field.onChange(e.target.value);
                            setTimeout(() => window.scrollTo(scrollLeft, scrollTop), 0);
                          }}
                          autoComplete="off"
                          className="text-base pl-11"
                          onFocus={(e) => {
                            preventScrollOnFocus(e);
                            setShowSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        {showSuggestions && filteredLocations.length > 0 && field.value && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-y-auto z-50">
                            {filteredLocations.slice(0, 5).map((loc) => (
                              <button
                                key={loc}
                                type="button"
                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  field.onChange(loc);
                                  setShowSuggestions(false);
                                }}
                              >
                                {loc}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      {uiWhereStoredText}
                      {availableLocations.length > 0 && (
                        <span className="text-primary"> • {availableLocations.length} {uiExistingLocationsText}</span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    {uiStatusText}
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{uiRequiredText}</Badge>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                    >
                      {EQUIPMENT_STATUSES.map(statusInfo => {
                        const isSelected = field.value === statusInfo.value;
                        const colors = {
                          good: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-600' },
                          maintenance: { bg: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-600' },
                          damaged: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600' },
                        }[statusInfo.value] || { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-600' };
                        
                        const translatedLabel = statusInfo.value === 'good' ? uiGoodText :
                          statusInfo.value === 'maintenance' ? uiMaintenanceText :
                          statusInfo.value === 'damaged' ? uiDamagedText : statusInfo.label;
                        
                        const translatedDescription = statusInfo.value === 'good' ? uiReadyToRentText :
                          statusInfo.value === 'maintenance' ? uiInServiceText :
                          statusInfo.value === 'damaged' ? uiNeedsRepairText : '';
                        
                        return (
                          <FormItem key={statusInfo.value}>
                            <FormControl>
                              <label
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? `${colors.border} bg-opacity-5`
                                    : 'border-border hover:border-muted-foreground/50 hover:bg-muted/50'
                                }`}
                                style={isSelected ? { backgroundColor: `${colors.bg.replace('bg-', '')}10` } : {}}
                              >
                                <RadioGroupItem value={statusInfo.value} className="sr-only" />
                                <div className={`w-4 h-4 rounded-full ${colors.bg}`} />
                                <div className="text-center">
                                  <p className={`font-medium ${isSelected ? colors.text : ''}`}>{translatedLabel}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {translatedDescription}
                                  </p>
                                </div>
                              </label>
                            </FormControl>
                          </FormItem>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Display quantity breakdown if editing existing equipment */}
            {initialData && (
              <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
                <p className="text-sm font-semibold mb-2">{uiQuantityBreakdownText}</p>
                <p className="text-sm text-muted-foreground">
                  {getStatusBreakdownString(
                    (initialData.quantityByStatus || {
                      good: initialData.quantity || 0,
                      damaged: 0,
                      maintenance: 0,
                    }) as QuantityByStatus
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {uiMaintenanceLogText}
                </p>
              </div>
            )}
          </SectionCard>

          {/* MEDIA SECTION */}
          <SectionCard
            id="media"
            title={uiMediaText}
            description={uiMediaDescText}
            icon={ImageIcon}
            badge={<Badge variant="secondary" className="text-xs">{uiOptionalText}</Badge>}
          >
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{uiImageURLText}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                      <Input 
                        placeholder="https://example.com/image.png" 
                        {...field}
                        onFocus={preventScrollOnFocus}
                        onChange={(e) => {
                          field.onChange(e);
                          setImagePreviewUrl(e.target.value);
                          setImageLoadError(false); // Reset error when URL changes
                        }}
                        className="text-base pl-11"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {uiProvideURLText}{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => {
                        const placeholder = "https://placehold.co/300x300.png";
                        field.onChange(placeholder);
                        setImagePreviewUrl(placeholder);
                      }}
                    >
                      https://placehold.co/300x300.png
                    </button>
                  </FormDescription>
                  
                  {/* Image Preview */}
                  {imagePreviewUrl && (
                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowImagePreview(!showImagePreview)}
                        className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                      >
                        {showImagePreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showImagePreview ? uiHidePreviewText : uiShowPreviewText}
                      </button>
                      {showImagePreview && (
                        <div className="relative w-full max-w-xs h-48 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border">
                          {imageLoadError ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                              <AlertCircle className="w-8 h-8 mb-2 text-orange-500" />
                              <p className="text-sm font-medium">{uiImageCannotPreviewText}</p>
                              <p className="text-xs mt-1">{uiWebsiteBlockText}</p>
                              <button
                                type="button"
                                className="mt-2 text-xs text-primary hover:underline"
                                onClick={() => window.open(imagePreviewUrl, '_blank')}
                              >
                                {uiOpenNewTabText}
                              </button>
                            </div>
                          ) : (
                            <img 
                              src={imagePreviewUrl} 
                              alt="Preview" 
                              className="w-full h-full object-contain p-2"
                              onError={() => {
                                setImageLoadError(true);
                              }}
                              onLoad={() => {
                                setImageLoadError(false);
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />
          </SectionCard>

          {/* Submit Buttons - Sticky on mobile */}
          <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-4 border-t md:relative md:mx-0 md:px-0 md:py-0 md:border-0 md:bg-transparent md:pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="submit" 
                className="flex-1 sm:flex-none sm:min-w-[200px] h-12 text-base font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {uiSavingText}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {initialData ? uiUpdateEquipmentText : uiAddEquipmentText}
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/inventory')}
                className="flex-1 sm:flex-none h-12 text-base"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {initialData ? uiCancelText : uiBackToInventoryText}
              </Button>
            </div>
            {Object.keys(form.formState.errors).length > 0 && (
              <p className="text-sm text-destructive mt-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {uiFixErrorsText}
              </p>
            )}
          </div>
        </form>
      </Form>
    </TooltipProvider>
  );
}

    