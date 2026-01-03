'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FilterPanelProps {
  onFilterChange: (filters: {
    minSize?: bigint;
    maxSize?: bigint;
    fileType?: string;
    startDate?: Date;
    endDate?: Date;
    owner?: string;
    sortBy?: 'createdAt' | 'name' | 'size';
    sortOrder?: 'asc' | 'desc';
  }) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function FilterPanel({
  onFilterChange,
  isOpen,
  onClose,
}: FilterPanelProps) {
  const { toast } = useToast();
  const [minSize, setMinSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [fileType, setFileType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'size'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [hasFilters, setHasFilters] = useState(false);

  const handleApplyFilters = useCallback(() => {
    const filters: any = {
      sortBy,
      sortOrder,
    };

    if (minSize) {
      filters.minSize = BigInt(parseInt(minSize));
    }
    if (maxSize) {
      filters.maxSize = BigInt(parseInt(maxSize));
    }
    if (fileType) {
      filters.fileType = fileType;
    }
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    setHasFilters(
      !!(minSize || maxSize || fileType || startDate || endDate)
    );

    onFilterChange(filters);
    toast({
      title: 'Filters Applied',
      description: 'Search results updated',
    });
  }, [minSize, maxSize, fileType, startDate, endDate, sortBy, sortOrder, onFilterChange, toast]);

  const handleReset = useCallback(() => {
    setMinSize('');
    setMaxSize('');
    setFileType('');
    setStartDate('');
    setEndDate('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setHasFilters(false);

    onFilterChange({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    toast({
      title: 'Filters Reset',
      description: 'All filters have been cleared',
    });
  }, [onFilterChange, toast]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 w-80 max-h-[600px] bg-white border border-gray-200 rounded-lg shadow-xl z-40 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filters & Sort</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* File Size Filter */}
        <div>
          <label className="text-sm font-medium block mb-2">File Size (Bytes)</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minSize}
              onChange={(e) => setMinSize(e.target.value)}
              className="flex-1 text-sm"
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxSize}
              onChange={(e) => setMaxSize(e.target.value)}
              className="flex-1 text-sm"
            />
          </div>
        </div>

        {/* File Type Filter */}
        <div>
          <label className="text-sm font-medium block mb-2">File Type</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">All Types</option>
            <option value="image/">Images</option>
            <option value="video/">Videos</option>
            <option value="audio/">Audio</option>
            <option value="application/pdf">PDF</option>
            <option value="text/">Text</option>
            <option value="application/zip">Archives</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="text-sm font-medium block mb-2">Date Range</label>
          <div className="space-y-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="text-sm font-medium block mb-2">Sort By</label>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'name' | 'size')}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="createdAt">Date Created</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={!hasFilters && sortBy === 'createdAt' && sortOrder === 'desc'}
          className="flex-1"
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={handleApplyFilters}
          className="flex-1"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
