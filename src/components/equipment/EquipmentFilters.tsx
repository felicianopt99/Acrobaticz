"use client";

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { Category, Subcategory } from '@/types';
import { EQUIPMENT_STATUSES } from '@/lib/constants';
import { useTranslate } from '@/contexts/TranslationContext';

interface EquipmentFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategoryId: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedAvailability: string;
  setSelectedAvailability: (availability: string) => void;
  categories: Category[];
  subcategories: Subcategory[];
  locations: string[];
}

export function EquipmentFilters({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  selectedStatus,
  setSelectedStatus,
  selectedLocation,
  setSelectedLocation,
  selectedType,
  setSelectedType,
  selectedAvailability,
  setSelectedAvailability,
  categories,
  subcategories,
  locations,
}: EquipmentFiltersProps) {
  // Translation hooks
  const { translated: uiSearchEquipmentText } = useTranslate('Search Equipment');
  const { translated: uiCategoryText } = useTranslate('Category');
  const { translated: uiSubcategoryText } = useTranslate('Subcategory');
  const { translated: uiStatusText } = useTranslate('Status');
  const { translated: uiLocationText } = useTranslate('Location');
  const { translated: uiTypeText } = useTranslate('Type');
  const { translated: uiAvailabilityText } = useTranslate('Availability');
  const { translated: uiAllCategoriesText } = useTranslate('All Categories');
  const { translated: uiAllSubcategoriesText } = useTranslate('All Subcategories');
  const { translated: uiAllStatusesText } = useTranslate('All Statuses');
  const { translated: uiAllLocationsText } = useTranslate('All Locations');
  const { translated: uiAllTypesText } = useTranslate('All Types');
  const { translated: uiEquipmentText } = useTranslate('Equipment');
  const { translated: uiConsumableText } = useTranslate('Consumable');
  const { translated: uiAllText } = useTranslate('All');
  const { translated: uiAvailableText } = useTranslate('Available');
  const { translated: uiRentedText } = useTranslate('Rented');
  const { translated: uiClearFiltersText } = useTranslate('Clear Filters');

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedStatus('');
    setSelectedLocation('');
    setSelectedType('');
    setSelectedAvailability('');
  };

  const filteredSubcategories = subcategories.filter(sub =>
    !selectedCategory || sub.parentId === selectedCategory
  );

  return (
    <div className="mb-4 md:mb-8 p-3 md:p-6 bg-card rounded-xl shadow-lg border border-border/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 md:gap-x-6 gap-y-3 md:gap-y-4 items-end">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1.5">{uiSearchEquipmentText}</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              id="search"
              type="text"
              placeholder="e.g., SM58, Projector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 h-11"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-muted-foreground mb-1.5">{uiCategoryText}</label>
          <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setSelectedSubcategory(''); }}>
            <SelectTrigger id="category" className="h-11">
              <SelectValue placeholder={uiAllCategoriesText} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="subcategory" className="block text-sm font-medium text-muted-foreground mb-1.5">{uiSubcategoryText}</label>
          <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} disabled={!selectedCategory}>
            <SelectTrigger id="subcategory" className="h-11">
              <SelectValue placeholder={uiAllSubcategoriesText} />
            </SelectTrigger>
            <SelectContent>
              {filteredSubcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1.5">{uiStatusText}</label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger id="status" className="h-11">
              <SelectValue placeholder={uiAllStatusesText} />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-1.5">{uiLocationText}</label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger id="location" className="h-11">
              <SelectValue placeholder={uiAllLocationsText} />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-muted-foreground mb-1.5">{uiTypeText}</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger id="type" className="h-11">
              <SelectValue placeholder={uiAllTypesText} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipment">{uiEquipmentText}</SelectItem>
              <SelectItem value="consumable">{uiConsumableText}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-muted-foreground mb-1.5">{uiAvailabilityText}</label>
          <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
            <SelectTrigger id="availability" className="h-11">
              <SelectValue placeholder={uiAllText} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{uiAllText}</SelectItem>
              <SelectItem value="available">{uiAvailableText}</SelectItem>
              <SelectItem value="rented">{uiRentedText}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={clearFilters} variant="outline" className="w-full h-11 text-base font-medium">
          <X className="mr-2 h-4 w-4" /> {uiClearFiltersText}
        </Button>
      </div>
    </div>
  );
}
