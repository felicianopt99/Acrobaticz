// src/components/quotes/QuotePDFTemplate.tsx
"use client";

import React from 'react';
import { format } from 'date-fns';
import type { Quote } from '@/types';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslate } from '@/contexts/TranslationContext';

interface QuotePDFTemplateProps {
  quote: Quote;
  className?: string;
}

export function QuotePDFTemplate({ quote, className = "" }: QuotePDFTemplateProps) {
  // Translation hooks
  const { translated: quoteTitle } = useTranslate('QUOTE');
  const { translated: dateLabel } = useTranslate('Date');
  const { translated: validUntilLabel } = useTranslate('Valid Until');
  const { translated: avRentalsLabel } = useTranslate('AV RENTALS');
  const { translated: professionalAvLabel } = useTranslate('Professional AV Equipment Rental');
  const { translated: clientInfoTitle } = useTranslate('Client Information');
  const { translated: nameLabel } = useTranslate('Name');
  const { translated: emailLabel } = useTranslate('Email');
  const { translated: phoneLabel } = useTranslate('Phone');
  const { translated: addressLabel } = useTranslate('Address');
  const { translated: eventDetailsTitle } = useTranslate('Event Details');
  const { translated: locationLabel } = useTranslate('Location');
  const { translated: startDateLabel } = useTranslate('Start Date');
  const { translated: endDateLabel } = useTranslate('End Date');
  const { translated: durationLabel } = useTranslate('Duration');
  const { translated: daysText } = useTranslate('day(s)');
  const { translated: equipmentServicesTitle } = useTranslate('Equipment & Services');
  const { translated: itemHeader } = useTranslate('Item');
  const { translated: qtyHeader } = useTranslate('Qty');
  const { translated: rateDayHeader } = useTranslate('Rate/Day');
  const { translated: daysHeader } = useTranslate('Days');
  const { translated: totalHeader } = useTranslate('Total');
  const { translated: equipmentItemText } = useTranslate('Equipment Item');
  const { translated: subtotalLabel } = useTranslate('Subtotal');
  const { translated: discountLabel } = useTranslate('Discount');
  const { translated: netAmountLabel } = useTranslate('Net Amount');
  const { translated: taxLabel } = useTranslate('Tax');
  const { translated: totalAmountLabel } = useTranslate('Total Amount');
  const { translated: additionalNotesTitle } = useTranslate('Additional Notes');
  const { translated: termsConditionsTitle } = useTranslate('Terms & Conditions');
  const { translated: term1 } = useTranslate('Equipment must be returned in the same condition as received.');
  const { translated: term2 } = useTranslate('Client is responsible for any damage or loss during rental period.');
  const { translated: term3 } = useTranslate('Payment is due within 30 days of invoice date.');
  const { translated: term4 } = useTranslate('Cancellations must be made 48 hours in advance.');
  const { translated: term5 } = useTranslate('Setup and breakdown services are available upon request.');
  const { translated: term6 } = useTranslate('This quote is valid for 30 days from the date issued.');
  const { translated: thankYouText } = useTranslate('Thank you for considering AV Rentals for your event needs!');
  const { translated: contactText } = useTranslate('For questions about this quote, please contact us at info@av-rentals.com or +1 (555) 123-4567');

  // Calculate totals for display
  const subtotal = quote.subTotal || 0;
  const discountAmount = quote.discountType === 'percentage' 
    ? (subtotal * (quote.discountAmount / 100))
    : quote.discountAmount;
  const discountedSubtotal = subtotal - discountAmount;
  const taxAmount = quote.taxAmount || 0;
  const totalAmount = quote.totalAmount || 0;

  return (
    <div id="quote-pdf-template" className={`bg-white text-gray-900 max-w-4xl mx-auto ${className}`}>
      {/* Header Section */}
      <div className="mb-8 pb-6 border-b-2 border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{quoteTitle}</h1>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{quote.quoteNumber}</p>
              <p>{dateLabel}: {format(new Date(), 'MMMM d, yyyy')}</p>
              <p>{validUntilLabel}: {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-gray-900 mb-4">{avRentalsLabel}</div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{professionalAvLabel}</p>
              <p>info@av-rentals.com</p>
              <p>+1 (555) 123-4567</p>
              <p>www.av-rentals.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{quote.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-1">{clientInfoTitle}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">{nameLabel}:</span> {quote.clientName}</p>
              {quote.clientEmail && <p><span className="font-medium">{emailLabel}:</span> {quote.clientEmail}</p>}
              {quote.clientPhone && <p><span className="font-medium">{phoneLabel}:</span> {quote.clientPhone}</p>}
              {quote.clientAddress && <p><span className="font-medium">{addressLabel}:</span> {quote.clientAddress}</p>}
            </div>
          </div>

          {/* Event Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-1">{eventDetailsTitle}</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">{locationLabel}:</span> {quote.location}</p>
              <p><span className="font-medium">{startDateLabel}:</span> {format(new Date(quote.startDate), 'MMMM d, yyyy')}</p>
              <p><span className="font-medium">{endDateLabel}:</span> {format(new Date(quote.endDate), 'MMMM d, yyyy')}</p>
              <p><span className="font-medium">{durationLabel}:</span> {Math.ceil((new Date(quote.endDate).getTime() - new Date(quote.startDate).getTime()) / (1000 * 60 * 60 * 24))} {daysText}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Items */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b border-gray-200 pb-1">{equipmentServicesTitle}</h3>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">{itemHeader}</th>
                <th className="text-center py-3 px-2 font-medium text-gray-900">{qtyHeader}</th>
                <th className="text-right py-3 px-2 font-medium text-gray-900">{rateDayHeader}</th>
                <th className="text-center py-3 px-2 font-medium text-gray-900">{daysHeader}</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">{totalHeader}</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((item, index) => (
                <tr key={item.id || index} className="border-b border-gray-100 hover:bg-gray-25">
                  <td className="py-3 px-4 text-gray-900">{item.equipmentName || equipmentItemText}</td>
                  <td className="py-3 px-2 text-center text-gray-700">{item.quantity || 1}</td>
                  <td className="py-3 px-2 text-right text-gray-700">€{(item.unitPrice || 0).toFixed(2)}</td>
                  <td className="py-3 px-2 text-center text-gray-700">{item.days || 1}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">€{item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="mb-8">
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">{subtotalLabel}:</span>
                  <span className="font-medium text-gray-900">€{subtotal.toFixed(2)}</span>
                </div>
                
                {quote.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>
                      {discountLabel} {quote.discountType === 'percentage' 
                        ? `(${quote.discountAmount}%):` 
                        : ':'
                      }
                    </span>
                    <span>-€{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-700">{netAmountLabel}:</span>
                  <span className="font-medium text-gray-900">€{discountedSubtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-700">{taxLabel} ({((quote.taxRate || 0) * 100).toFixed(1)}%):</span>
                  <span className="font-medium text-gray-900">€{taxAmount.toFixed(2)}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">{totalAmountLabel}:</span>
                  <span className="font-bold text-gray-900">€{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {quote.notes && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-1">{additionalNotesTitle}</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-1">{termsConditionsTitle}</h3>
        <div className="text-xs text-gray-600 space-y-2">
          <p>• {term1}</p>
          <p>• {term2}</p>
          <p>• {term3}</p>
          <p>• {term4}</p>
          <p>• {term5}</p>
          <p>• {term6}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600 mb-2">
          {thankYouText}
        </p>
        <p className="text-xs text-gray-500">
          {contactText}
        </p>
      </div>
    </div>
  );
}