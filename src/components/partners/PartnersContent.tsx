// src/components/partners/PartnersContent.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Partner } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
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
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, SearchSlash, Building2, Eye, AlertTriangle, Package, Handshake, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function PartnersContent() {
  const { currentUser } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  // Translation hooks
  const { translated: accessDeniedText } = useTranslate('Access Denied');
  const { translated: noPermissionText } = useTranslate('You do not have permission to view this page.');
  const { translated: loadingData } = useTranslate('Loading partner data...');
  const { translated: partnersHeading } = useTranslate('Partners');
  const { translated: addNewPartner } = useTranslate('Add New Partner');
  const { translated: partnerList } = useTranslate('Partner List');
  const { translated: viewSearchManagePartners } = useTranslate('View, search, and manage your rental partners for subrentals.');
  const { translated: searchPlaceholder } = useTranslate('Search partners (name, company, contact, email)...');
  const { translated: noPartnersMatch } = useTranslate('No partners match your search.');
  const { translated: tryDifferentSearch } = useTranslate('Try a different search term or clear the search.');
  const { translated: noPartnersYet } = useTranslate('No partners yet.');
  const { translated: clickAddNewPartner } = useTranslate('Click "Add New Partner" to get started.');
  const { translated: nameHeader } = useTranslate('Name');
  const { translated: companyHeader } = useTranslate('Company');
  const { translated: contactHeader } = useTranslate('Contact');
  const { translated: emailHeader } = useTranslate('Email');
  const { translated: subrentalsHeader } = useTranslate('Subrentals');
  const { translated: statusHeader } = useTranslate('Status');
  const { translated: actionsHeader } = useTranslate('Actions');
  const { translated: viewDetails } = useTranslate('View Details');
  const { translated: editLabel } = useTranslate('Edit');
  const { translated: deleteLabel } = useTranslate('Delete');
  const { translated: confirmDeletion } = useTranslate('Confirm Deletion');
  const { translated: confirmDeletionDesc } = useTranslate('Are you sure you want to delete this partner? This action cannot be undone.');
  const { translated: cancelLabel } = useTranslate('Cancel');
  const { translated: deletePartnerLabel } = useTranslate('Delete Partner');
  const { translated: activeLabel } = useTranslate('Active');
  const { translated: inactiveLabel } = useTranslate('Inactive');
  const { translated: partnerDeletedTitle } = useTranslate('Partner Deleted');
  const { translated: typeHeader } = useTranslate('Type');
  const { translated: filterByType } = useTranslate('Filter by type');
  const { translated: providerType } = useTranslate('Provider');
  const { translated: agencyType } = useTranslate('Agency');
  const { translated: bothType } = useTranslate('Both');
  const { translated: allType } = useTranslate('All');
  const { translated: linkedClientHeader } = useTranslate('Linked Client');
  const { translated: clientLabel } = useTranslate('Client');

  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'provider' | 'agency' | 'both'>('all');

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleDelete = useCallback(async () => {
    if (!partnerToDelete) return;
    
    try {
      const response = await fetch(`/api/partners?id=${partnerToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPartners(prev => prev.filter(p => p.id !== partnerToDelete.id));
        toast({ title: partnerDeletedTitle, description: `Partner "${partnerToDelete.name}" has been removed.` });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete partner.' });
    } finally {
      setPartnerToDelete(null);
    }
  }, [partnerToDelete, toast, partnerDeletedTitle]);

  const filteredPartners = useMemo(() => partners.filter(partner => {
    const matchesSearch = 
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (partner.companyName && partner.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner.contactPerson && partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner.email && partner.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner.phone && partner.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || partner.partnerType === typeFilter;
    
    return matchesSearch && matchesType;
  }), [partners, searchTerm, typeFilter]);

  // Allow Admin and Manager to access partners
  const { hasRole, ROLE_GROUPS } = require('@/lib/roles');
  if (!currentUser || !hasRole(currentUser.role, ROLE_GROUPS.MANAGEMENT)) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 overflow-y-auto p-2 md:p-6 flex items-center justify-center">
          <Card className="max-w-lg w-full bg-destructive/10 border-destructive/30">
            <CardHeader className="flex-row gap-4 items-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div>
                <CardTitle className="text-destructive">{accessDeniedText}</CardTitle>
                <CardDescription>{noPermissionText}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow flex items-center justify-center">
          <p className="text-lg text-muted-foreground">{loadingData}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl md:text-2xl font-semibold">{partnersHeading}</h2>
            <Button asChild variant="glass" className="w-full sm:w-auto">
              <Link href="/partners/new">
                <PlusCircle className="mr-2 h-4 w-4" /> {addNewPartner}
              </Link>
            </Button>
          </div>
          
          <Card className="glass-card bg-card text-card-foreground shadow-xl border border-border/40">
            <CardHeader>
              <CardTitle>{partnerList}</CardTitle>
              <CardDescription>{viewSearchManagePartners}</CardDescription>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:max-w-sm md:max-w-md pl-10 bg-background/70 border border-border/30 focus:border-primary/60"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">{filterByType}:</span>
                  {(['all', 'provider', 'agency', 'both'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={typeFilter === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTypeFilter(type)}
                      className={typeFilter === type ? '' : 'text-muted-foreground'}
                    >
                      {type === 'all' ? allType : type === 'provider' ? providerType : type === 'agency' ? agencyType : bothType}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredPartners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                  {searchTerm ? (
                    <>
                      <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
                      <p className="text-xl mb-1">{noPartnersMatch}</p>
                      <p className="text-sm">{tryDifferentSearch}</p>
                    </>
                  ) : (
                    <>
                      <Building2 className="w-16 h-16 mb-4 text-primary/50" />
                      <p className="text-xl mb-1">{noPartnersYet}</p>
                      <p className="text-sm">{clickAddNewPartner}</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredPartners.map((partner) => (
                      <Card 
                        key={partner.id} 
                        className="p-3 cursor-pointer glass-card bg-card/80 hover:bg-card/90 transition-all shadow-md border border-border/30" 
                        onClick={() => router.push(`/partners/${partner.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-sm">{partner.name}</h3>
                              <Badge variant={partner.isActive ? 'default' : 'secondary'} className="text-xs">
                                {partner.isActive ? activeLabel : inactiveLabel}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  partner.partnerType === 'provider' ? 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300' :
                                  partner.partnerType === 'agency' ? 'border-emerald-300 text-emerald-700 dark:border-emerald-600 dark:text-emerald-300' :
                                  'border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300'
                                }`}
                              >
                                {partner.partnerType === 'provider' ? providerType : partner.partnerType === 'agency' ? agencyType : bothType}
                              </Badge>
                            </div>
                            {partner.companyName && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{partner.companyName}</p>
                            )}
                            {partner.client && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                                📋 {clientLabel}: {partner.client.name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {partner.email && <span className="text-xs text-muted-foreground truncate">{partner.email}</span>}
                              {partner.phone && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">{partner.phone}</span>
                                </>
                              )}
                            </div>
                            {partner._count && (
                              <div className="flex items-center gap-1 mt-2">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {partner._count.subrentals} {subrentalsHeader.toLowerCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {e.stopPropagation(); router.push(`/partners/${partner.id}`)}}>
                                <Eye className="mr-2 h-4 w-4" /> {viewDetails}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {e.stopPropagation(); router.push(`/partners/${partner.id}/edit`)}}>
                                <Edit className="mr-2 h-4 w-4" /> {editLabel}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {e.stopPropagation(); setPartnerToDelete(partner)}} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> {deleteLabel}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{nameHeader}</TableHead>
                          <TableHead>{companyHeader}</TableHead>
                          <TableHead>{contactHeader}</TableHead>
                          <TableHead>{emailHeader}</TableHead>
                          <TableHead>{typeHeader}</TableHead>
                          <TableHead>{linkedClientHeader}</TableHead>
                          <TableHead>{subrentalsHeader}</TableHead>
                          <TableHead>{statusHeader}</TableHead>
                          <TableHead className="text-right">{actionsHeader}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPartners.map((partner) => (
                          <TableRow 
                            key={partner.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/partners/${partner.id}`)}
                          >
                            <TableCell className="font-medium">{partner.name}</TableCell>
                            <TableCell>{partner.companyName || '-'}</TableCell>
                            <TableCell>{partner.contactPerson || '-'}</TableCell>
                            <TableCell>{partner.email || '-'}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  partner.partnerType === 'provider' ? 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300' :
                                  partner.partnerType === 'agency' ? 'border-emerald-300 text-emerald-700 dark:border-emerald-600 dark:text-emerald-300' :
                                  'border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300'
                                }
                              >
                                {partner.partnerType === 'provider' ? providerType : partner.partnerType === 'agency' ? agencyType : bothType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {partner.client ? (
                                <div className="text-sm">
                                  <p className="font-medium text-emerald-600 dark:text-emerald-400">{partner.client.name}</p>
                                  {partner.client.contactPerson && (
                                    <p className="text-xs text-muted-foreground">{partner.client.contactPerson}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {partner._count?.subrentals || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                                {partner.isActive ? activeLabel : inactiveLabel}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {e.stopPropagation(); router.push(`/partners/${partner.id}`)}}>
                                    <Eye className="mr-2 h-4 w-4" /> {viewDetails}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {e.stopPropagation(); router.push(`/partners/${partner.id}/edit`)}}>
                                    <Edit className="mr-2 h-4 w-4" /> {editLabel}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {e.stopPropagation(); setPartnerToDelete(partner)}} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" /> {deleteLabel}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
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
      <AlertDialog open={!!partnerToDelete} onOpenChange={() => setPartnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDeletion}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeletionDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletePartnerLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
