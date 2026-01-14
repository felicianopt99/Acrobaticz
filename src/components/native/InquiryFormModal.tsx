'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { CartItem } from '@/types/entities'

interface Partner {
  id: string
  name: string
  companyName?: string | null
  email?: string | null
  phone?: string | null
}

interface InquiryFormModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  partner?: Partner
  cartItems?: CartItem[]
  onSubmit?: (data: InquiryFormData) => Promise<void>
  isSubmitting?: boolean
}

export interface InquiryFormData {
  eventName: string
  eventType: string
  eventLocation: string
  startDate: string
  endDate: string
  name: string
  email: string
  phone: string
  company?: string
  specialRequirements?: string
  budget?: string
}

export function InquiryFormModal({
  isOpen,
  onOpenChange,
  partner,
  cartItems = [],
  onSubmit,
  isSubmitting = false,
}: InquiryFormModalProps) {
  const [formData, setFormData] = useState<InquiryFormData>({
    eventName: '',
    eventType: '',
    eventLocation: '',
    startDate: '',
    endDate: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    specialRequirements: '',
    budget: '',
  })

  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit(formData)
    }
  }

  const isFormValid =
    formData.eventName &&
    formData.eventLocation &&
    formData.startDate &&
    formData.endDate &&
    formData.name &&
    formData.email &&
    formData.phone

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-700/50 rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-neutral-700/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-white">Rental Inquiry</DialogTitle>
              <DialogDescription className="text-neutral-400 mt-1">
                Complete your rental details for {partner?.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Partner Info */}
          {partner && (
            <div className="bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl">
              <h4 className="text-white font-bold mb-2 text-sm uppercase tracking-wider">
                Sending Inquiry To
              </h4>
              <div className="text-sm text-neutral-300 space-y-1">
                <p className="font-semibold">{partner.name}</p>
                {partner.companyName && <p>{partner.companyName}</p>}
                {partner.email && (
                  <p className="text-blue-400 hover:text-blue-300 transition-colors">
                    {partner.email}
                  </p>
                )}
                {partner.phone && <p>{partner.phone}</p>}
              </div>
            </div>
          )}

          {/* Selected Items */}
          {cartItems.length > 0 && (
            <div>
              <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">
                Selected Equipment ({cartItems.length})
              </h4>
              <div className="space-y-2 bg-neutral-800/50 p-4 rounded-xl max-h-40 overflow-y-auto border border-neutral-700/50">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm text-neutral-300 pb-2 border-b border-neutral-700/30 last:border-0 last:pb-0"
                  >
                    <span className="flex-1">{item.name}</span>
                    <span className="font-semibold text-blue-400 ml-4">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Details Section */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              Event Details
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-neutral-300 mb-2 block text-sm">
                    Event Name *
                  </Label>
                  <Input
                    placeholder="Wedding, Conference, Exhibition..."
                    value={formData.eventName}
                    onChange={(e) =>
                      setFormData({ ...formData, eventName: e.target.value })
                    }
                    className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300 mb-2 block text-sm">
                    Event Type
                  </Label>
                  <Input
                    placeholder="Corporate, Private, Public..."
                    value={formData.eventType}
                    onChange={(e) =>
                      setFormData({ ...formData, eventType: e.target.value })
                    }
                    className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <Label className="text-neutral-300 mb-2 block text-sm">
                  Event Location *
                </Label>
                <Input
                  placeholder="Where will the event take place?"
                  value={formData.eventLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, eventLocation: e.target.value })
                  }
                  className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Rental Period Section */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              Rental Period
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-300 mb-2 block text-sm">
                  Start Date *
                </Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="bg-neutral-700/50 border-neutral-600/50 text-white focus:ring-blue-500/20 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-neutral-300 mb-2 block text-sm">
                  End Date *
                </Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="bg-neutral-700/50 border-neutral-600/50 text-white focus:ring-blue-500/20 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Contact Info Section */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              Your Contact Information
            </h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-neutral-300 mb-2 block text-sm">
                    Full Name *
                  </Label>
                  <Input
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300 mb-2 block text-sm">
                    Email *
                  </Label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-neutral-300 mb-2 block text-sm">
                    Phone *
                  </Label>
                  <Input
                    placeholder="+351 900 000 000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300 mb-2 block text-sm">
                    Company
                  </Label>
                  <Input
                    placeholder="Your company name (optional)"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          <div>
            <Label className="text-neutral-300 mb-2 block text-sm uppercase tracking-wider font-bold">
              Special Requirements
            </Label>
            <Textarea
              placeholder="Any special requests, setup instructions, or additional requirements?"
              value={formData.specialRequirements}
              onChange={(e) =>
                setFormData({ ...formData, specialRequirements: e.target.value })
              }
              className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg min-h-24"
            />
          </div>

          {/* Budget */}
          <div>
            <Label className="text-neutral-300 mb-2 block text-sm uppercase tracking-wider font-bold">
              Budget (Optional)
            </Label>
            <Input
              placeholder="€5000 or your estimated budget"
              value={formData.budget}
              onChange={(e) =>
                setFormData({ ...formData, budget: e.target.value })
              }
              className="bg-neutral-700/50 border-neutral-600/50 text-white placeholder:text-neutral-500 focus:ring-blue-500/20 rounded-lg"
            />
          </div>
        </div>

        {/* Footer */}
        <Separator className="bg-neutral-700/50" />
        <DialogFooter className="pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="bg-neutral-700/20 border-neutral-600/50 text-neutral-300 hover:bg-neutral-700/40 hover:text-white hover:border-neutral-500/50 transition-all duration-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={cn(
              'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-600 transition-all duration-300 font-semibold',
              (!isFormValid || isSubmitting) &&
                'opacity-50 cursor-not-allowed hover:shadow-none'
            )}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
