// src/components/partners/PartnerDetailContent.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Partner, Subrental, Event } from '@/types';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/contexts/TranslationContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  PlusCircle, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Package,
  Calendar,
  Euro,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubrentalForm } from './SubrentalForm';
import { format } from 'date-fns';

interface PartnerDetailContentProps {
  partnerId: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-700', icon: Clock },
  active: { label: 'Active', color: 'bg-blue-500/20 text-blue-700', icon: Package },
  returned: { label: 'Returned', color: 'bg-green-500/20 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-700', icon: XCircle },
};

export function PartnerDetailContent({ partnerId }: PartnerDetailContentProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Translation hooks
  const { translated: loadingData } = useTranslate('Loading partner details...');
  const { translated: backToPartners } = useTranslate('Back to Partners');
  const { translated: editPartner } = useTranslate('Edit Partner');
  const { translated: addSubrental } = useTranslate('Add Subrental');
  const { translated: partnerInfo } = useTranslate('Partner Information');
  const { translated: subrentalHistory } = useTranslate('Subrental History');
  const { translated: noSubrentalsYet } = useTranslate('No subrentals yet.');
  const { translated: addFirstSubrental } = useTranslate('Add the first subrental for this partner.');
  const { translated: equipmentHeader } = useTranslate('Equipment');
  const { translated: eventHeader } = useTranslate('Event');
  const { translated: periodHeader } = useTranslate('Period');
  const { translated: costHeader } = useTranslate('Cost');
  const { translated: statusHeader } = useTranslate('Status');
  const { translated: actionsHeader } = useTranslate('Actions');
  const { translated: deleteLabel } = useTranslate('Delete');
  const { translated: confirmDeletion } = useTranslate('Confirm Deletion');
  const { translated: confirmDeletionDesc } = useTranslate('Are you sure you want to delete this subrental? This action cannot be undone.');
  const { translated: cancelLabel } = useTranslate('Cancel');
  const { translated: deleteSubrentalLabel } = useTranslate('Delete Subrental');
  const { translated: subrentalDeletedTitle } = useTranslate('Subrental Deleted');
  const { translated: totalSpent } = useTranslate('Total Spent');
  const { translated: activeSubrentals } = useTranslate('Active Subrentals');
  const { translated: totalSubrentals } = useTranslate('Total Subrentals');
  const { translated: markAsActive } = useTranslate('Mark as Active');
  const { translated: markAsReturned } = useTranslate('Mark as Returned');
  const { translated: markAsCancelled } = useTranslate('Mark as Cancelled');
  const { translated: statusUpdated } = useTranslate('Status Updated');

  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subrentalToDelete, setSubrentalToDelete] = useState<Subrental | null>(null);
  const [isSubrentalDialogOpen, setIsSubrentalDialogOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

  // Fetch partner details
  const fetchPartner = useCallback(async () => {
    try {
      const response = await fetch(`/api/partners/${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        setPartner(data);
      }
    } catch (error) {
      console.error('Error fetching partner:', error);
    } finally {
      setIsLoading(false);
    }
  }, [partnerId]);

  // Fetch events for subrental form
  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, []);

  useEffect(() => {
    fetchPartner();
    fetchEvents();
  }, [fetchPartner, fetchEvents]);

  const handleDeleteSubrental = useCallback(async () => {
    if (!subrentalToDelete) return;
    
    try {
      const response = await fetch(`/api/subrentals?id=${subrentalToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPartner(prev => prev ? {
          ...prev,
          subrentals: prev.subrentals?.filter(s => s.id !== subrentalToDelete.id),
        } : null);
        toast({ title: subrentalDeletedTitle, description: 'Subrental has been removed.' });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete subrental.' });
    } finally {
      setSubrentalToDelete(null);
    }
  }, [subrentalToDelete, toast, subrentalDeletedTitle]);

  const handleStatusChange = useCallback(async (subrental: Subrental, newStatus: string) => {
    try {
      const response = await fetch(`/api/subrentals/${subrental.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setPartner(prev => prev ? {
          ...prev,
          subrentals: prev.subrentals?.map(s => 
            s.id === subrental.id ? { ...s, status: newStatus as any } : s
          ),
        } : null);
        toast({ title: statusUpdated, description: `Status changed to ${newStatus}.` });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  }, [toast, statusUpdated]);

  const handleSubrentalSuccess = useCallback(() => {
    setIsSubrentalDialogOpen(false);
    fetchPartner();
  }, [fetchPartner]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center">
          <p className="text-lg text-muted-foreground">{loadingData}</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center">
          <p className="text-lg text-muted-foreground">Partner not found</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalCost = partner.subrentals?.reduce((sum, s) => sum + s.totalCost, 0) || 0;
  const activeCount = partner.subrentals?.filter(s => s.status === 'active').length || 0;
  const totalCount = partner.subrentals?.length || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/partners')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-xl md:text-2xl font-semibold">{partner.name}</h2>
                {partner.companyName && (
                  <p className="text-muted-foreground">{partner.companyName}</p>
                )}
              </div>
              <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                {partner.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/partners/${partnerId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> {editPartner}
                </Link>
              </Button>
              <Dialog open={isSubrentalDialogOpen} onOpenChange={setIsSubrentalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="glass">
                    <PlusCircle className="mr-2 h-4 w-4" /> {addSubrental}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{addSubrental}</DialogTitle>
                    <DialogDescription>
                      Add subrented equipment from {partner.name}
                    </DialogDescription>
                  </DialogHeader>
                  <SubrentalForm 
                    partnerId={partnerId} 
                    events={events}
                    onSuccess={handleSubrentalSuccess}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Euro className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{totalSpent}</p>
                    <p className="text-2xl font-bold">€{totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/10">
                    <Package className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{activeSubrentals}</p>
                    <p className="text-2xl font-bold">{activeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Calendar className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{totalSubrentals}</p>
                    <p className="text-2xl font-bold">{totalCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partner Info Card */}
          <Card className="glass-card bg-card text-card-foreground shadow-xl border border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {partnerInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partner.contactPerson && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Contact:</span>
                    <span>{partner.contactPerson}</span>
                  </div>
                )}
                {partner.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${partner.email}`} className="text-primary hover:underline">
                      {partner.email}
                    </a>
                  </div>
                )}
                {partner.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${partner.phone}`} className="text-primary hover:underline">
                      {partner.phone}
                    </a>
                  </div>
                )}
                {partner.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {partner.website}
                    </a>
                  </div>
                )}
                {partner.address && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{partner.address}</span>
                  </div>
                )}
                {partner.notes && (
                  <div className="md:col-span-2 mt-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                    <p className="text-sm">{partner.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subrental History */}
          <Card className="glass-card bg-card text-card-foreground shadow-xl border border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {subrentalHistory}
              </CardTitle>
              <CardDescription>
                Equipment subrented from this partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!partner.subrentals || partner.subrentals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                  <Package className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">{noSubrentalsYet}</p>
                  <p className="text-sm">{addFirstSubrental}</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {partner.subrentals.map((subrental) => {
                      const config = statusConfig[subrental.status];
                      const StatusIcon = config.icon;
                      return (
                        <Card key={subrental.id} className="p-3 glass-card bg-card/80">
                          <div className="flex justify-between items-start">
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm truncate">{subrental.equipmentName}</h4>
                                <Badge className={config.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              {subrental.equipmentDesc && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{subrental.equipmentDesc}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <span>Qty: {subrental.quantity}</span>
                                <span>•</span>
                                <span>€{subrental.dailyRate}/day</span>
                                <span>•</span>
                                <span className="font-medium text-foreground">€{subrental.totalCost}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(subrental.startDate), 'dd/MM/yyyy')} - {format(new Date(subrental.endDate), 'dd/MM/yyyy')}
                              </div>
                              {(subrental as any).event && (
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {(subrental as any).event.name}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {subrental.status === 'pending' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(subrental, 'active')}>
                                    <Package className="mr-2 h-4 w-4" /> {markAsActive}
                                  </DropdownMenuItem>
                                )}
                                {(subrental.status === 'pending' || subrental.status === 'active') && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(subrental, 'returned')}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> {markAsReturned}
                                  </DropdownMenuItem>
                                )}
                                {subrental.status !== 'cancelled' && subrental.status !== 'returned' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(subrental, 'cancelled')}>
                                    <XCircle className="mr-2 h-4 w-4" /> {markAsCancelled}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setSubrentalToDelete(subrental)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> {deleteLabel}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{equipmentHeader}</TableHead>
                          <TableHead>{eventHeader}</TableHead>
                          <TableHead>{periodHeader}</TableHead>
                          <TableHead className="text-right">{costHeader}</TableHead>
                          <TableHead>{statusHeader}</TableHead>
                          <TableHead className="text-right">{actionsHeader}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partner.subrentals.map((subrental) => {
                          const config = statusConfig[subrental.status];
                          const StatusIcon = config.icon;
                          return (
                            <TableRow key={subrental.id}>
                              <TableCell>
                                <div>
                                  <span className="font-medium">{subrental.equipmentName}</span>
                                  {subrental.equipmentDesc && (
                                    <p className="text-xs text-muted-foreground">{subrental.equipmentDesc}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {subrental.quantity} × €{subrental.dailyRate}/day
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {(subrental as any).event ? (
                                  <Badge variant="outline">{(subrental as any).event.name}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {format(new Date(subrental.startDate), 'dd/MM/yyyy')}
                                  <br />
                                  <span className="text-muted-foreground">to</span>
                                  <br />
                                  {format(new Date(subrental.endDate), 'dd/MM/yyyy')}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                €{subrental.totalCost.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge className={config.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {subrental.status === 'pending' && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(subrental, 'active')}>
                                        <Package className="mr-2 h-4 w-4" /> {markAsActive}
                                      </DropdownMenuItem>
                                    )}
                                    {(subrental.status === 'pending' || subrental.status === 'active') && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(subrental, 'returned')}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> {markAsReturned}
                                      </DropdownMenuItem>
                                    )}
                                    {subrental.status !== 'cancelled' && subrental.status !== 'returned' && (
                                      <DropdownMenuItem onClick={() => handleStatusChange(subrental, 'cancelled')}>
                                        <XCircle className="mr-2 h-4 w-4" /> {markAsCancelled}
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => setSubrentalToDelete(subrental)} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> {deleteLabel}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!subrentalToDelete} onOpenChange={() => setSubrentalToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDeletion}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeletionDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubrental} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteSubrentalLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
