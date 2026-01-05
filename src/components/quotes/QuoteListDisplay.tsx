

"use client";

// src/components/quotes/QuoteListDisplay.tsx

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Quote } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
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
  DropdownMenuSeparator,
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
import { PlusCircle, Edit, Trash2, MoreHorizontal, Search, FileText, SearchSlash, CheckCircle2, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QuotePDFPreview } from './QuotePDFPreview';
import { QuotePDFGenerator } from '@/lib/pdf-generator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function QuoteListDisplay() {
  // Translation hooks
  const { translated: toastTherewasanerrorgenerDescText } = useTranslate('There was an error generating the PDF.');
  const { translated: toastDownloadFailedTitleText } = useTranslate('Download Failed');
  const { translated: toastPDFDownloadedTitleText } = useTranslate('PDF Downloaded');
  const { translated: toastApprovalFailedTitleText } = useTranslate('Approval Failed');
  const { translated: toastQuoteApprovedTitleText } = useTranslate('Quote Approved');
  const { translated: toastQuoteDeletedTitleText } = useTranslate('Quote Deleted');
  
  // UI Text
  const { translated: uiQuotesHeading } = useTranslate('Quotes');
  const { translated: uiCreateNewQuoteButton } = useTranslate('Create New Quote');
  const { translated: uiQuoteListTitle } = useTranslate('Quote List');
  const { translated: uiQuoteListDescription } = useTranslate('View, search, and manage all your quotes.');
  const { translated: uiSearchPlaceholder } = useTranslate('Search quotes (name, number, client, status)...');
  const { translated: uiNoQuotesMatchSearch } = useTranslate('No quotes match your search.');
  const { translated: uiTryDifferentSearch } = useTranslate('Try a different search term or clear the search.');
  const { translated: uiNoQuotesCreated } = useTranslate('No quotes created yet.');
  const { translated: uiClickCreateQuote } = useTranslate('Click "Create New Quote" to get started.');
  
  // Table Headers
  const { translated: uiTableHeaderNumber } = useTranslate('Number');
  const { translated: uiTableHeaderName } = useTranslate('Name');
  const { translated: uiTableHeaderClient } = useTranslate('Client');
  const { translated: uiTableHeaderStartDate } = useTranslate('Start Date');
  const { translated: uiTableHeaderEndDate } = useTranslate('End Date');
  const { translated: uiTableHeaderTotal } = useTranslate('Total');
  const { translated: uiTableHeaderStatus } = useTranslate('Status');
  const { translated: uiTableHeaderActions } = useTranslate('Actions');
  
  // Action Menu Items
  const { translated: uiActionViewEdit } = useTranslate('View / Edit');
  const { translated: uiActionApprove } = useTranslate('Approve & Create Event');
  const { translated: uiActionPreviewPDF } = useTranslate('Preview PDF');
  const { translated: uiActionDownloadPDF } = useTranslate('Download PDF');
  const { translated: uiActionDelete } = useTranslate('Delete');
  
  // Dialog Titles
  const { translated: uiConfirmDeletion } = useTranslate('Confirm Deletion');
  const { translated: uiConfirmApproval } = useTranslate('Confirm Quote Approval');
  
  // Dialog Messages
  const { translated: uiDeleteConfirmMessage } = useTranslate('Are you sure you want to delete the quote "{name}"? This action cannot be undone.');
  const { translated: uiApproveConfirmMessage } = useTranslate('Are you sure you want to approve the quote "{name}"? This will change the quote status to "Accepted" and create a corresponding event and rental entries.');
  const { translated: uiApproveImportantNote } = useTranslate('Important: Ensure the quote is linked to an existing client in the system. If not, please edit the quote first. This action may create rentals even if items are overbooked, which will be highlighted in the calendar.');
  
  // Dialog Buttons
  const { translated: uiButtonCancel } = useTranslate('Cancel');
  const { translated: uiButtonDeleteQuote } = useTranslate('Delete Quote');
  const { translated: uiButtonApproveEvent } = useTranslate('Approve & Create Event');

  const { quotes, isDataLoaded } = useAppContext();
  const { deleteQuote, approveQuote } = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();

  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [quoteToApprove, setQuoteToApprove] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // PDF state
  const [isPDFPreviewOpen, setIsPDFPreviewOpen] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const openDeleteDialog = useCallback((quote: Quote) => {
    setQuoteToDelete(quote);
  }, []);

  const confirmDelete = useCallback(() => {
    if (quoteToDelete) {
      deleteQuote(quoteToDelete.id);
      toast({ title: toastQuoteDeletedTitleText, description: `Quote "${quoteToDelete.name || quoteToDelete.quoteNumber}" has been removed.` });
      setQuoteToDelete(null);
    }
  }, [quoteToDelete, deleteQuote, toast]);

  const openApproveDialog = useCallback((quote: Quote) => {
    setQuoteToApprove(quote);
  }, []);

  const confirmApprove = useCallback(async () => {
    if (quoteToApprove) {
      const result = await approveQuote(quoteToApprove);
      if (result.success) {
        toast({ title: toastQuoteApprovedTitleText, description: result.message });
        router.push('/events');
      } else {
        toast({ variant: "destructive", title: toastApprovalFailedTitleText, description: result.message });
      }
      setQuoteToApprove(null);
    }
  }, [quoteToApprove, approveQuote, toast, router]);

  // PDF Methods
  const handlePreviewPDF = useCallback((quote: Quote) => {
    setPreviewQuote(quote);
    setIsPDFPreviewOpen(true);
  }, []);

  const handleDownloadPDF = useCallback(async (quote: Quote) => {
    try {
      setIsGeneratingPDF(true);
      await QuotePDFGenerator.generateQuotePDF(quote, {
        filename: `quote-${quote.quoteNumber}.pdf`,
        download: true
      });
      toast({
        title: toastPDFDownloadedTitleText,
        description: `Quote ${quote.quoteNumber} has been downloaded successfully.`
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: toastDownloadFailedTitleText,
        description: toastTherewasanerrorgenerDescText
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [toast]);

  const filteredQuotes = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return quotes.filter(quote =>
        (quote.name && quote.name.toLowerCase().includes(lowerSearchTerm)) ||
        quote.quoteNumber.toLowerCase().includes(lowerSearchTerm) ||
        (quote.clientName && quote.clientName.toLowerCase().includes(lowerSearchTerm)) ||
        (quote.status && quote.status.toLowerCase().includes(lowerSearchTerm))
    ).sort((a,b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  }, [quotes, searchTerm]);

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };


  if (!isDataLoaded) {
    return (
        <div className="flex flex-col">
            <div className="flex-grow flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Loading quote data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-semibold">{uiQuotesHeading}</h2>
        <Link href="/quotes/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> {uiCreateNewQuoteButton}
          </Button>
        </Link>
      </div>
      <Card className="shadow-lg overflow-hidden">
        <CardHeader>
          <CardTitle>{uiQuoteListTitle}</CardTitle>
          <CardDescription>{uiQuoteListDescription}</CardDescription>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={uiSearchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm md:max-w-md pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
              {searchTerm ? (
                <>
                  <SearchSlash className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">{uiNoQuotesMatchSearch}</p>
                  <p className="text-sm">{uiTryDifferentSearch}</p>
                </>
              ) : (
                <>
                  <FileText className="w-16 h-16 mb-4 text-primary/50" />
                  <p className="text-xl mb-1">{uiNoQuotesCreated}</p>
                  <p className="text-sm">{uiClickCreateQuote}</p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
              {filteredQuotes.map((quote) => (
                <Card key={quote.id} className="p-3 shadow-none border-0 bg-background/50 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow min-w-0">
                      <h3 className="font-medium text-sm">{quote.quoteNumber}</h3>
                      {quote.name && <p className="text-xs text-muted-foreground truncate mt-0.5">{quote.name}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        {quote.clientName && <span className="text-xs text-muted-foreground truncate">{quote.clientName}</span>}
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">€{quote.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{format(new Date(quote.startDate), 'PP')}</span>
                        <div className={`w-2 h-2 rounded-full ${quote.status === 'Accepted' ? 'bg-green-500' : quote.status === 'Sent' ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}`)}>
                          <Edit className="mr-2 h-4 w-4" /> {uiActionViewEdit}
                        </DropdownMenuItem>
                        {quote.status !== "Accepted" && quote.status !== "Declined" && quote.status !== "Archived" && (
                          <DropdownMenuItem onClick={() => openApproveDialog(quote)}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> {uiActionApprove}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handlePreviewPDF(quote)}>
                          <Eye className="mr-2 h-4 w-4" /> {uiActionPreviewPDF}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(quote)} disabled={isGeneratingPDF}>
                          <Download className="mr-2 h-4 w-4" /> {uiActionDownloadPDF}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDeleteDialog(quote)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> {uiActionDelete}
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
                    <TableHead>{uiTableHeaderNumber}</TableHead>
                    <TableHead>{uiTableHeaderName}</TableHead>
                    <TableHead>{uiTableHeaderClient}</TableHead>
                    <TableHead>{uiTableHeaderStartDate}</TableHead>
                    <TableHead>{uiTableHeaderEndDate}</TableHead>
                    <TableHead>{uiTableHeaderTotal}</TableHead>
                    <TableHead>{uiTableHeaderStatus}</TableHead>
                    <TableHead className="text-right">{uiTableHeaderActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                      <TableCell>{quote.name}</TableCell>
                      <TableCell>{quote.clientName || '-'}</TableCell>
                      <TableCell>{format(new Date(quote.startDate), 'PP')}</TableCell>
                      <TableCell>{format(new Date(quote.endDate), 'PP')}</TableCell>
                      <TableCell>€{quote.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`py-1 px-2.5 text-xs ${getStatusColor(quote.status)}`}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="accentGhost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/quotes/${quote.id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> {uiActionViewEdit}
                            </DropdownMenuItem>
                            {quote.status !== "Accepted" && quote.status !== "Declined" && quote.status !== "Archived" && (
                              <DropdownMenuItem onClick={() => openApproveDialog(quote)}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> {uiActionApprove}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handlePreviewPDF(quote)}>
                              <Eye className="mr-2 h-4 w-4" /> {uiActionPreviewPDF}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(quote)} disabled={isGeneratingPDF}>
                              <Download className="mr-2 h-4 w-4" /> {uiActionDownloadPDF}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteDialog(quote)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> {uiActionDelete}
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
      {quoteToDelete && (
        <AlertDialog open={!!quoteToDelete} onOpenChange={(isOpen) => !isOpen && setQuoteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{uiConfirmDeletion}</AlertDialogTitle>
              <AlertDialogDescription>
                {uiDeleteConfirmMessage.replace('{name}', quoteToDelete.name || quoteToDelete.quoteNumber)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setQuoteToDelete(null)}>{uiButtonCancel}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                {uiButtonDeleteQuote}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {quoteToApprove && (
        <AlertDialog open={!!quoteToApprove} onOpenChange={(isOpen) => !isOpen && setQuoteToApprove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{uiConfirmApproval}</AlertDialogTitle>
              <AlertDialogDescription>
                {uiApproveConfirmMessage.replace('{name}', quoteToApprove.name || quoteToApprove.quoteNumber)}
                <br/><br/>
                <strong className="text-destructive-foreground">{uiApproveImportantNote}</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setQuoteToApprove(null)}>{uiButtonCancel}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmApprove} className="bg-green-600 hover:bg-green-600/90">
                {uiButtonApproveEvent}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}