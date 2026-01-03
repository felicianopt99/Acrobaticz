'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  File,
  Folder,
  Download,
  Copy,
  Trash2,
  Star,
  MoreVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { formatBytes, formatDate } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string | number;
  mimeType?: string;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount?: number; // For folders
}

interface FileListProps {
  items: FileItem[];
  onDelete?: (id: string) => void;
  onStar?: (id: string, value: boolean) => void;
  onRename?: (id: string, newName: string) => void;
  isLoading?: boolean;
}

type SortField = 'name' | 'size' | 'date';
type SortDirection = 'asc' | 'desc';

export function FileList({
  items,
  onDelete,
  onStar,
  onRename,
  isLoading = false,
}: FileListProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<'all' | 'file' | 'folder'>('all');

  const filteredItems = items.filter(
    item => filterType === 'all' || item.type === filterType
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortField === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    } else if (sortField === 'size') {
      aVal = Number(a.size) || 0;
      bVal = Number(b.size) || 0;
    } else if (sortField === 'date') {
      aVal = new Date(a.updatedAt).getTime();
      bVal = new Date(b.updatedAt).getTime();
    }

    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 inline" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full" />
        </div>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-8">
        <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No {filterType === 'all' ? 'items' : filterType + 's'} found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'file', 'folder'] as const).map((type) => (
          <Button
            key={type}
            variant={filterType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(type)}
            className="capitalize"
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Files Table */}
      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center font-semibold"
                >
                  Name
                  <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('size')}
                  className="flex items-center font-semibold"
                >
                  Size
                  <SortIcon field="size" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center font-semibold"
                >
                  Modified
                  <SortIcon field="date" />
                </button>
              </TableHead>
              <TableHead className="w-10">Star</TableHead>
              <TableHead className="w-10">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item) => (
              <FileListRow
                key={item.id}
                item={item}
                onDelete={() => onDelete?.(item.id)}
                onStar={(value) => onStar?.(item.id, value)}
                onRename={(newName) => onRename?.(item.id, newName)}
              />
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function FileListRow({
  item,
  onDelete,
  onStar,
  onRename,
}: {
  item: FileItem;
  onDelete: () => void;
  onStar: (value: boolean) => void;
  onRename: (newName: string) => void;
}) {
  const { toast } = useToast();
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);

  const handleRename = async () => {
    if (newName && newName !== item.name) {
      onRename(newName);
      setRenaming(false);
    } else {
      setRenaming(false);
    }
  };

  if (renaming) {
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              className="flex-1 px-2 py-1 border rounded"
              autoFocus
            />
            <Button size="sm" onClick={handleRename}>
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRenaming(false)}
            >
              Cancel
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {item.type === 'file' ? (
            <File className="h-4 w-4 text-gray-400" />
          ) : (
            <Folder className="h-4 w-4 text-blue-500" />
          )}
          <span>{item.name}</span>
          {item.type === 'folder' && item.itemCount !== undefined && (
            <span className="text-xs text-gray-500">({item.itemCount})</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {item.type === 'file' ? formatBytes(Number(item.size) || 0) : '-'}
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {formatDate(item.updatedAt)}
      </TableCell>
      <TableCell>
        <button
          onClick={() => onStar(!item.isStarred)}
          className="hover:text-yellow-500 transition"
        >
          {item.isStarred ? (
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
          ) : (
            <Star className="h-4 w-4 text-gray-300" />
          )}
        </button>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {item.type === 'file' && (
              <DropdownMenuItem
                onClick={() => {
                  window.location.href = `/api/cloud/files/${item.id}?download=true`;
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setRenaming(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete()} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
