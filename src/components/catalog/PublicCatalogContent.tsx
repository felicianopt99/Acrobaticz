'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Search, Filter, Mail, Phone, MapPin, ShoppingCart, X, Plus, Minus, Calendar } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CategoryIconMapper } from '@/components/icons/CategoryIconMapper';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Equipment {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  dailyRate: number;
  quantity: number;
  category: {
    id: string;
    name: string;
    icon: string | null;
  };
  subcategory: {
    id: string;
    name: string;
  } | null;
}

interface CartItem {
  equipment: Equipment;
  quantity: number;
}

interface Partner {
  id: string;
  name: string;
  companyName: string | null;
  logoUrl: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
}

interface CatalogData {
  partner: Partner;
  equipment: Equipment[];
  shareToken: string;
}

interface PublicCatalogContentProps {
  token: string;
}

export function PublicCatalogContent({ token }: PublicCatalogContentProps) {
  const [catalogData, setCatalogData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInquiryFormOpen, setIsInquiryFormOpen] = useState(false);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  
  const [inquiryData, setInquiryData] = useState({
    eventName: '',
    eventType: '',
    eventLocation: '',
    startDate: '',
    endDate: '',
    deliveryLocation: '',
    setupDateTime: '',
    breakdownDateTime: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    specialRequirements: '',
    budget: '',
  });

  useEffect(() => {
    loadCatalog();
  }, [token]);

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/catalog/share/${token}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Catalog not found or has expired.');
        } else if (response.status === 410) {
          setError('This catalog share link has expired.');
        } else {
          setError('Failed to load catalog.');
        }
        return;
      }

      const data = await response.json();
      setCatalogData(data);

      // Extract unique categories
      const cats = [...new Set(data.equipment.map((eq: Equipment) => eq.category.name))] as string[];
      setCategories(cats);
    } catch (err) {
      console.error('Error loading catalog:', err);
      setError('Failed to load catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cart functions
  const addToCart = (equipment: Equipment, quantity: number = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.equipment.id === equipment.id);
      if (existingItem) {
        return prev.map(item =>
          item.equipment.id === equipment.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, equipment.quantity) }
            : item
        );
      }
      return [...prev, { equipment, quantity: Math.min(quantity, equipment.quantity) }];
    });
  };

  const removeFromCart = (equipmentId: string) => {
    setCartItems(prev => prev.filter(item => item.equipment.id !== equipmentId));
  };

  const updateCartItemQuantity = (equipmentId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.equipment.id === equipmentId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.equipment.quantity)) }
          : item
      )
    );
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryData.eventName || !inquiryData.eventLocation || !inquiryData.startDate || !inquiryData.endDate || !inquiryData.name || !inquiryData.email || !inquiryData.phone) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }

    setSubmittingInquiry(true);
    try {
      const response = await fetch('/api/catalog/submit-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          cartItems: cartItems.map(item => ({
            equipmentId: item.equipment.id,
            quantity: item.quantity,
          })),
          eventName: inquiryData.eventName,
          eventType: inquiryData.eventType,
          eventLocation: inquiryData.eventLocation,
          startDate: inquiryData.startDate,
          endDate: inquiryData.endDate,
          deliveryLocation: inquiryData.deliveryLocation,
          setupDateTime: inquiryData.setupDateTime,
          breakdownDateTime: inquiryData.breakdownDateTime,
          name: inquiryData.name,
          email: inquiryData.email,
          phone: inquiryData.phone,
          company: inquiryData.company,
          specialRequirements: inquiryData.specialRequirements,
          budget: inquiryData.budget,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit inquiry');

      alert('Inquiry submitted successfully! We will contact you shortly.');
      setIsInquiryFormOpen(false);
      setCartItems([]);
      setInquiryData({
        eventName: '',
        eventType: '',
        eventLocation: '',
        startDate: '',
        endDate: '',
        deliveryLocation: '',
        setupDateTime: '',
        breakdownDateTime: '',
        name: '',
        email: '',
        phone: '',
        company: '',
        specialRequirements: '',
        budget: '',
      });
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const filteredEquipment = catalogData?.equipment.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category.name === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Group equipment by category and subcategory
  const groupedEquipment = filteredEquipment.reduce((groups, item) => {
    const categoryName = item.category.name;
    const subcategoryName = item.subcategory?.name || 'General';

    if (!groups[categoryName]) {
      groups[categoryName] = {};
    }
    if (!groups[categoryName][subcategoryName]) {
      groups[categoryName][subcategoryName] = [];
    }
    groups[categoryName][subcategoryName].push(item);
    return groups;
  }, {} as Record<string, Record<string, Equipment[]>>);

  const getStatusColor = (status: string = 'good') => {
    switch (status) {
      case 'good':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'damaged':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!catalogData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert className="max-w-md">
          <AlertDescription>No catalog data available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { partner, equipment } = catalogData;

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center">
        <div />
        <Button
          onClick={() => setIsCartOpen(true)}
          className="relative"
          size="lg"
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          Cart ({totalCartItems})
          {totalCartItems > 0 && (
            <Badge className="ml-2 rounded-full" variant="secondary">
              {totalCartItems}
            </Badge>
          )}
        </Button>
      </div>

      {/* Partner Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {partner.logoUrl && (
              <div className="w-24 h-24 rounded-lg border border-border/50 overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold">{partner.name}</h1>
              {partner.companyName && (
                <p className="text-muted-foreground text-lg mt-1">{partner.companyName}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                {partner.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{partner.address}</span>
                  </div>
                )}
                {partner.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a href={`tel:${partner.phone}`} className="hover:text-primary transition-colors">
                      {partner.phone}
                    </a>
                  </div>
                )}
                {partner.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <a href={`mailto:${partner.email}`} className="hover:text-primary transition-colors">
                      {partner.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Catalog Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Equipment Catalog</CardTitle>
          <CardDescription>
            Browse {equipment.length} available equipment items
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filter */}
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {categories.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 dark:bg-white/5 rounded-lg border border-white/10">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Equipment Grid */}
          {filteredEquipment.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedEquipment).map(([categoryName, subcategories]) => (
                <div key={categoryName} className="space-y-4">
                  {/* Category Header */}
                  <div className="border-b-2 border-primary/20 pb-3">
                    <h2 className="text-2xl font-bold text-primary">{categoryName}</h2>
                  </div>

                  {/* Subcategories */}
                  <div className="space-y-6">
                    {Object.entries(subcategories).map(([subcategoryName, items]) => (
                      <div key={subcategoryName} className="space-y-3">
                        {/* Subcategory Header */}
                        {subcategoryName !== 'General' && (
                          <h3 className="text-lg font-semibold text-muted-foreground ml-2">
                            {subcategoryName}
                          </h3>
                        )}

                        {/* Equipment Grid for this subcategory */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {items.map(item => (
                            <Card
                              key={item.id}
                              className="overflow-hidden flex flex-col h-full border border-border/40 hover:border-primary/40 transition-all hover:shadow-lg"
                            >
                              {/* Image */}
                              <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted">
                                <Image
                                  src={item.imageUrl || 'https://placehold.co/600x400.png?text=No+Image'}
                                  alt={item.name}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                  className="object-contain"
                                />
                                <div className="absolute left-2 top-2">
                                  <Badge variant="outline" className={`text-[10px] sm:text-xs rounded-full ${getStatusColor('good')}`}>
                                    Available
                                  </Badge>
                                </div>
                                {item.dailyRate > 0 && (
                                  <div className="absolute right-2 bottom-2">
                                    <div className="rounded-full bg-background/80 backdrop-blur px-2 py-1 text-[10px] sm:text-xs border border-border/50 font-semibold">
                                      €{item.dailyRate.toFixed(2)} / day
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <CardContent className="p-3 flex-1 flex flex-col">
                                <h3 className="font-semibold text-sm line-clamp-2 mb-1">{item.name}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                                <div className="flex items-center gap-2 mb-3">
                                  <CategoryIconMapper iconName={item.category.icon || undefined} className="h-4 w-4 text-primary" />
                                  <span className="text-xs text-muted-foreground">{item.category.name}</span>
                                </div>
                                <div className="mt-auto">
                                  <Button 
                                    size="sm" 
                                    className="w-full" 
                                    variant="default"
                                    onClick={() => addToCart(item, 1)}
                                  >
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Add to Cart
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No equipment found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cart Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Inquiry Cart
            </DialogTitle>
            <DialogDescription>
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
            </DialogDescription>
          </DialogHeader>

          {cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map(item => (
                <Card key={item.equipment.id} className="p-4">
                  <div className="flex gap-4">
                    {item.equipment.imageUrl && (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={item.equipment.imageUrl}
                          alt={item.equipment.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.equipment.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.equipment.category.name}</p>
                      {item.equipment.dailyRate > 0 && (
                        <p className="text-sm font-medium mt-1">€{item.equipment.dailyRate.toFixed(2)} / day</p>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateCartItemQuantity(item.equipment.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          max={item.equipment.quantity}
                          value={item.quantity}
                          onChange={(e) => updateCartItemQuantity(item.equipment.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-center"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0"
                          onClick={() => updateCartItemQuantity(item.equipment.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-8"
                          onClick={() => removeFromCart(item.equipment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCartOpen(false)}>
                  Continue Shopping
                </Button>
                <Button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsInquiryFormOpen(true);
                  }}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Submit Inquiry
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>Your cart is empty. Add some equipment to get started!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inquiry Form Dialog */}
      <Dialog open={isInquiryFormOpen} onOpenChange={setIsInquiryFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rental Inquiry for {catalogData?.partner.name}
            </DialogTitle>
            <DialogDescription>
              Provide your details and rental dates to submit your inquiry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
            {/* Partner Info Card */}
            {catalogData && (
              <Card className="bg-muted/50 border border-primary/20 p-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Inquiry Recipient
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="font-medium">{catalogData.partner.name}</div>
                  {catalogData.partner.companyName && (
                    <div className="text-muted-foreground">{catalogData.partner.companyName}</div>
                  )}
                  {catalogData.partner.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {catalogData.partner.email}
                    </div>
                  )}
                  {catalogData.partner.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {catalogData.partner.phone}
                    </div>
                  )}
                  {catalogData.partner.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {catalogData.partner.address}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Event Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-primary">Event Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    placeholder="Wedding, Conference, Concert..."
                    value={inquiryData.eventName}
                    onChange={(e) => setInquiryData({ ...inquiryData, eventName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Input
                    id="eventType"
                    placeholder="e.g., Wedding, Corporate, Concert"
                    value={inquiryData.eventType}
                    onChange={(e) => setInquiryData({ ...inquiryData, eventType: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="eventLocation">Event Location *</Label>
                <Input
                  id="eventLocation"
                  placeholder="Address where the event will take place"
                  value={inquiryData.eventLocation}
                  onChange={(e) => setInquiryData({ ...inquiryData, eventLocation: e.target.value })}
                />
              </div>
            </div>

            {/* Rental Dates */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-primary">Rental Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={inquiryData.startDate}
                    onChange={(e) => setInquiryData({ ...inquiryData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={inquiryData.endDate}
                    onChange={(e) => setInquiryData({ ...inquiryData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Delivery & Setup */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-primary">Delivery & Setup</h3>
              <div>
                <Label htmlFor="deliveryLocation">Delivery Location</Label>
                <Input
                  id="deliveryLocation"
                  placeholder="Leave blank if same as event location"
                  value={inquiryData.deliveryLocation}
                  onChange={(e) => setInquiryData({ ...inquiryData, deliveryLocation: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="setupDateTime">Setup Date & Time</Label>
                  <Input
                    id="setupDateTime"
                    type="datetime-local"
                    value={inquiryData.setupDateTime}
                    onChange={(e) => setInquiryData({ ...inquiryData, setupDateTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="breakdownDateTime">Breakdown Date & Time</Label>
                  <Input
                    id="breakdownDateTime"
                    type="datetime-local"
                    value={inquiryData.breakdownDateTime}
                    onChange={(e) => setInquiryData({ ...inquiryData, breakdownDateTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-primary">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={inquiryData.name}
                    onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    placeholder="Company name (optional)"
                    value={inquiryData.company}
                    onChange={(e) => setInquiryData({ ...inquiryData, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={inquiryData.email}
                    onChange={(e) => setInquiryData({ ...inquiryData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="Your phone number"
                    value={inquiryData.phone}
                    onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Special Requirements & Budget */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-primary">Additional Details</h3>
              <div>
                <Label htmlFor="specialRequirements">Special Requirements</Label>
                <Textarea
                  id="specialRequirements"
                  placeholder="Installation requirements, power needs, weather protection, etc."
                  value={inquiryData.specialRequirements}
                  onChange={(e) => setInquiryData({ ...inquiryData, specialRequirements: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="budget">Budget Range (Optional)</Label>
                <Input
                  id="budget"
                  placeholder="e.g., €2000 - €5000"
                  value={inquiryData.budget}
                  onChange={(e) => setInquiryData({ ...inquiryData, budget: e.target.value })}
                />
              </div>
            </div>

            {/* Cart Summary */}
            <Card className="bg-muted/50 p-4">
              <h4 className="font-semibold mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                {cartItems.map(item => (
                  <div key={item.equipment.id} className="flex justify-between">
                    <span>{item.equipment.name} x{item.quantity}</span>
                    <span>{item.equipment.dailyRate > 0 ? `€${(item.equipment.dailyRate * item.quantity).toFixed(2)}/day` : 'TBD'}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInquiryFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitInquiry}
              disabled={submittingInquiry}
              className="gap-2"
            >
              {submittingInquiry ? 'Submitting...' : 'Submit Inquiry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
