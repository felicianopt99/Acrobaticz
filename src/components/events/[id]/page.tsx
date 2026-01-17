
// src/app/events/[id]/page.tsx
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { Event, Rental, EquipmentItem, Client } from '@/types';
import { useAppContext, useAppDispatch } from '@/contexts/AppContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, PackageSearch, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { EventFormDialog } from '@/components/events/EventFormDialog';
import { AddEquipmentToEventDialog } from '@/components/events/AddEquipmentToEventDialog';
import { useTranslate } from '@/contexts/TranslationContext';
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

export default function EventDetailsPage() {
  // Translation hooks
  const { translated: toastEventDeletedTitleText } = useTranslate('Event Deleted');
  const { translated: toastTheequipmenthasbeenrDescText } = useTranslate('The equipment has been removed from this event.');
  const { translated: toastEquipmentRemovedTitleText } = useTranslate('Equipment Removed');
  const { translated: toastEventnotfoundDescText } = useTranslate('Event not found.');
  const { translated: toastErrorTitleText } = useTranslate('Error');
  const { translated: eventDetailsText } = useTranslate('Event Details');
  const { translated: loadingEventDataText } = useTranslate('Loading event data...');
  const { translated: eventNotFoundText } = useTranslate('Event not found or could not be loaded.');
  const { translated: forText } = useTranslate('For');
  const { translated: unknownClientText } = useTranslate('Unknown Client');
  const { translated: prepareEventText } = useTranslate('Prepare Event');
  const { translated: editEventText } = useTranslate('Edit Event');
  const { translated: locationLabelText } = useTranslate('Location');
  const { translated: fromText } = useTranslate('From');
  const { translated: toLabelText } = useTranslate('To');
  const { translated: rentedEquipmentText } = useTranslate('Rented Equipment');
  const { translated: equipmentColText } = useTranslate('Equipment');
  const { translated: quantityColText } = useTranslate('Quantity');
  const { translated: statusColText } = useTranslate('Status');
  const { translated: actionsColText } = useTranslate('Actions');
  const { translated: naText } = useTranslate('N/A');
  const { translated: unknownText } = useTranslate('Unknown');
  const { translated: noEquipmentRentedText } = useTranslate('No equipment rented for this event yet.');
  const { translated: clickAddEquipmentText } = useTranslate('Click "Add Equipment" to get started.');
  const { translated: addEquipmentText } = useTranslate('Add Equipment');
  const { translated: deleteEventText } = useTranslate('Delete Event');
  const { translated: confirmRemovalText } = useTranslate('Confirm Removal');
  const { translated: areYouSureRemoveText } = useTranslate('Are you sure you want to remove');
  const { translated: fromThisEventText } = useTranslate('from this event?');
  const { translated: cancelText } = useTranslate('Cancel');
  const { translated: removeText } = useTranslate('Remove');
  const { translated: confirmEventDeletionText } = useTranslate('Confirm Event Deletion');
  const { translated: areYouSureDeleteText } = useTranslate('Are you sure you want to delete the event');
  const { translated: deleteWarningText } = useTranslate('This will also delete all rental records associated with it. This action cannot be undone.');
  const { translated: theEventText } = useTranslate('The event');
  const { translated: andAllRentalsDeletedText } = useTranslate('and all its rentals have been deleted.');

  const params = useParams();
  const router = useRouter();
  const { events, clients, rentals, equipment, isDataLoaded } = useAppContext();
  const { deleteRental, deleteEvent } = useAppDispatch();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [eventRentals, setEventRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isAddEquipmentOpen, setIsAddEquipmentOpen] = useState(false);
  const [rentalToDelete, setRentalToDelete] = useState<(Rental & { equipment?: EquipmentItem }) | null>(null);
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);

  const eventId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (isDataLoaded && eventId) {
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
        const foundClient = clients.find(c => c.id === foundEvent.clientId);
        setClient(foundClient || null);

        const rentalsForEvent = rentals
          .filter(r => r.eventId === eventId)
          .map(r => ({
            ...r,
            equipment: equipment.find(eq => eq.id === r.equipmentId)
          }));
        setEventRentals(rentalsForEvent);
      } else {
        toast({ variant: "destructive", title: toastErrorTitleText, description: toastEventnotfoundDescText});
        router.replace('/events'); 
      }
      setLoading(false);
    } else if (isDataLoaded && !eventId) {
        router.replace('/events');
        setLoading(false);
    }
  }, [eventId, events, clients, rentals, equipment, isDataLoaded, router, toast]);
  
  const handleEditFormSubmitSuccess = () => {
    setIsEditFormOpen(false);
    // Data will refresh via useEffect
  }
  
  const handleAddEquipmentSuccess = () => {
    setIsAddEquipmentOpen(false);
    // Data will refresh via useEffect
  }

  const handleDeleteRental = () => {
    if(rentalToDelete) {
        deleteRental(rentalToDelete.id);
        toast({ title: toastEquipmentRemovedTitleText, description: toastTheequipmenthasbeenrDescText});
        setRentalToDelete(null);
    }
  }

  const handleDeleteEvent = () => {
    if(event) {
        deleteEvent(event.id);
        toast({ title: toastEventDeletedTitleText, description: `${theEventText} "${event.name}" ${andAllRentalsDeletedText}`});
        router.push('/events');
    }
    setIsDeleteEventOpen(false);
  }

  if (loading || !isDataLoaded) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title={eventDetailsText} />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-muted-foreground">{loadingEventDataText}</p>
            </div>
        </div>
    );
  }

  if (!event) {
    return (
        <div className="flex flex-col h-screen">
            <AppHeader title={toastErrorTitleText} />
            <div className="flex-grow flex items-center justify-center p-4 md:p-6">
                <p className="text-lg text-destructive">{eventNotFoundText}</p>
            </div>
        </div>
    );
  }

  return (
      <div className="flex flex-col h-full">
          <AppHeader title={eventDetailsText} />
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <Card className="max-w-4xl mx-auto shadow-xl">
              <CardHeader>
                <div className='flex justify-between items-start gap-4'>
                    <div>
                        <CardTitle className="text-3xl">{event.name}</CardTitle>
                        <CardDescription className="mt-2 text-base">
                            {forText}: <Link
                            href={`/clients/${client?.id}`}
                            className="text-primary hover:underline">{client?.name || unknownClientText}</Link>
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      <Button variant="default" onClick={() => router.push(`/rentals/${event.id}/prep`)}><ListChecks className="mr-2 h-4 w-4" /> {prepareEventText}</Button>
                      <Button variant="outline" onClick={() => setIsEditFormOpen(true)}><Edit className="mr-2 h-4 w-4" /> {editEventText}</Button>
                    </div>
                </div>
                <div className="text-sm text-muted-foreground pt-4 flex flex-wrap gap-x-6 gap-y-2">
                    <span><strong>{locationLabelText}:</strong> {event.location}</span>
                    <span><strong>{fromText}:</strong> {format(new Date(event.startDate), "PPP")}</span>
                    <span><strong>{toLabelText}:</strong> {format(new Date(event.endDate), "PPP")}</span>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold mb-4">{rentedEquipmentText}</h3>
                <div className="border rounded-md">
                     {eventRentals.length > 0 ? (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>{equipmentColText}</TableHead>
                                <TableHead>{quantityColText}</TableHead>
                                <TableHead>{statusColText}</TableHead>
                                <TableHead className="text-right">{actionsColText}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {eventRentals.map((rental, index) => (
                                <TableRow key={`${rental.id}-${index}`}>
                                <TableCell className="font-medium">{rental.equipment?.name || naText}</TableCell>
                                <TableCell>{rental.quantityRented}</TableCell>
                                <TableCell>
                                    <Badge variant={rental.equipment?.status === 'good' ? 'secondary' : 'destructive'}>
                                    {rental.equipment?.status || unknownText}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => setRentalToDelete(rental)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                            <PackageSearch className="w-16 h-16 mb-4 text-primary/50" />
                            <p className="text-lg mb-1">{noEquipmentRentedText}</p>
                            <p className="text-sm">{clickAddEquipmentText}</p>
                        </div>
                    )}
                </div>
                 <Button className="mt-6" onClick={() => setIsAddEquipmentOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> {addEquipmentText}
                </Button>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button variant="destructive" onClick={() => setIsDeleteEventOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> {deleteEventText}
                </Button>
              </CardFooter>
            </Card>
          </div>
          {/* Dialogs */}
          <EventFormDialog 
            isOpen={isEditFormOpen}
            onOpenChange={setIsEditFormOpen}
            initialData={event}
            onSubmitSuccess={handleEditFormSubmitSuccess}
          />
          <AddEquipmentToEventDialog
            isOpen={isAddEquipmentOpen}
            onOpenChange={setIsAddEquipmentOpen}
            onSubmitSuccess={handleAddEquipmentSuccess}
            event={event}
          />
          {rentalToDelete && (
             <AlertDialog open={!!rentalToDelete} onOpenChange={() => setRentalToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{confirmRemovalText}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {areYouSureRemoveText} "{rentalToDelete.equipment?.name}" {fromThisEventText}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRentalToDelete(null)}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteRental} className="bg-destructive hover:bg-destructive/90">
                        {removeText}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
          {isDeleteEventOpen && (
             <AlertDialog open={isDeleteEventOpen} onOpenChange={setIsDeleteEventOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{confirmEventDeletionText}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {areYouSureDeleteText} "{event.name}"? {deleteWarningText}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive hover:bg-destructive/90">
                        {deleteEventText}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
      </div>
  );
}

    