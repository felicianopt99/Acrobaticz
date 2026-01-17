"use client";

import React, { useState, useEffect } from 'react';
import { useTranslate } from '@/contexts/TranslationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, Trash2, Plus, Save, RefreshCw, Languages, 
  Download, CheckCircle, AlertTriangle, BarChart3, Settings, Globe,
  Pencil, X, Check
} from 'lucide-react';

interface Translation {
  id: string;
  sourceText: string;
  translatedText: string;
  targetLang: string;
  status: string;
  qualityScore: number;
  category: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TranslationStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  averageQuality: number;
  needsReview: number;
  autoTranslated: number;
  totalUsage: number;
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'clients', label: 'Clients' },
  { value: 'events', label: 'Events' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'forms', label: 'Forms' },
  { value: 'messages', label: 'Messages' },
  { value: 'errors', label: 'Errors' },
];

export default function AdminTranslationsPage() {
  const { toast } = useToast();

  // Translation helper
  const T = ({ text }: { text: string }) => { const { translated } = useTranslate(text); return <>{translated}</>; };
  
  // Core state
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [stats, setStats] = useState<TranslationStats>({
    total: 0, byStatus: {}, byCategory: {}, averageQuality: 100, 
    needsReview: 0, autoTranslated: 0, totalUsage: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [targetLang, setTargetLang] = useState('pt');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  
  // Rules state
  const [rules, setRules] = useState<Record<string, string>>({});
  const [rulesLoading, setRulesLoading] = useState(false);
  const [newRuleSource, setNewRuleSource] = useState('');
  const [newRuleTranslation, setNewRuleTranslation] = useState('');

  // Signal cache clear
  const signalUpdate = () => {
    try {
      localStorage.setItem('translations-updated', String(Date.now()));
    } catch {}
  };

  // Fetch translations
  const fetchTranslations = async (page: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '30',
        search: searchTerm,
        targetLang,
        category: categoryFilter,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      });

      const res = await fetch(`/api/admin/translations?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setTranslations(data.translations || []);
      setStats(data.stats || stats);
      setTotalPages(data.pagination?.pages || 1);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch rules
  const fetchRules = async () => {
    try {
      setRulesLoading(true);
      const res = await fetch('/api/admin/translation-rules');
      if (res.ok) {
        const text = await res.text();
        setRules(JSON.parse(text || '{}'));
      }
    } catch {
      setRules({});
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations(currentPage);
  }, [currentPage, targetLang]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchTranslations(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    fetchRules();
  }, []);

  // Save translation edit
  const handleSaveEdit = async (id: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/translations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], updates: { translatedText: editText } }),
      });
      if (!res.ok) throw new Error('Failed to save');
      
      setTranslations(prev => prev.map(t => 
        t.id === id ? { ...t, translatedText: editText } : t
      ));
      setEditingId(null);
      signalUpdate();
      toast({ title: 'Saved', description: 'Translation updated successfully' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete translation
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this translation?')) return;
    try {
      const res = await fetch(`/api/admin/translations?ids=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      setTranslations(prev => prev.filter(t => t.id !== id));
      signalUpdate();
      toast({ title: 'Deleted', description: 'Translation removed' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Add new translation
  const handleAddTranslation = async () => {
    if (!newSource.trim() || !newTranslation.trim()) {
      toast({ title: 'Error', description: 'Both fields are required', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch('/api/admin/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: newSource,
          translatedText: newTranslation,
          targetLang,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add');
      }
      
      setShowAddDialog(false);
      setNewSource('');
      setNewTranslation('');
      signalUpdate();
      fetchTranslations(1);
      toast({ title: 'Added', description: 'Translation created successfully' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Save rules
  const handleSaveRules = async () => {
    try {
      setRulesLoading(true);
      const res = await fetch('/api/admin/translation-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      if (!res.ok) throw new Error('Failed to save rules');
      signalUpdate();
      toast({ title: 'Saved', description: 'Translation rules updated' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setRulesLoading(false);
    }
  };

  // Add rule
  const handleAddRule = () => {
    if (!newRuleSource.trim()) return;
    setRules(prev => ({ ...prev, [newRuleSource]: newRuleTranslation }));
    setNewRuleSource('');
    setNewRuleTranslation('');
  };

  // Delete rule
  const handleDeleteRule = (key: string) => {
    setRules(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Clear all PT translations (refresh to PT-PT)
  const handleClearPTTranslations = async () => {
    if (!confirm('This will delete all Portuguese translations so they can be re-translated using European Portuguese (PT-PT). Continue?')) return;
    try {
      setLoading(true);
      // Get all PT translation IDs
      const res = await fetch(`/api/admin/translations?targetLang=pt&limit=10000`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const ids = (data.translations || []).map((t: Translation) => t.id);
      
      if (ids.length === 0) {
        toast({ title: 'Info', description: 'No PT translations to clear' });
        return;
      }
      
      // Delete all
      const delRes = await fetch(`/api/admin/translations?ids=${ids.join(',')}`, { method: 'DELETE' });
      if (!delRes.ok) throw new Error('Failed to delete');
      
      signalUpdate();
      fetchTranslations(1);
      toast({ title: 'Cleared', description: `Removed ${ids.length} PT translations. They will be re-translated as PT-PT.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Export
  const handleExport = () => {
    const data = JSON.stringify(translations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations-${targetLang}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Languages className="h-6 w-6" />
            <T text="Translation Manager" />
          </h1>
          <p className="text-muted-foreground"><T text="Manage translations for English ↔ Portuguese (PT-PT)" /></p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /><T text="Export" />
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /><T text="Add Translation" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground"><T text="Total Translations" /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.averageQuality}%</p>
                <p className="text-sm text-muted-foreground"><T text="Avg Quality" /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.needsReview}</p>
                <p className="text-sm text-muted-foreground"><T text="Needs Review" /></p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground"><T text="Total Usage" /></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="translations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="translations"><T text="Translations" /></TabsTrigger>
          <TabsTrigger value="rules"><T text="Override Rules" /></TabsTrigger>
          <TabsTrigger value="settings"><T text="Settings" /></TabsTrigger>
        </TabsList>

        {/* Translations Tab */}
        <TabsContent value="translations" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search translations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">🇵🇹 Português</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => fetchTranslations(currentPage)} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[40%]">Source (English)</TableHead>
                      <TableHead className="w-[40%]">Translation ({targetLang === 'pt' ? 'Português' : 'English'})</TableHead>
                      <TableHead className="w-[10%] text-center">Category</TableHead>
                      <TableHead className="w-[10%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && translations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <T text="Loading translations..." />
                        </TableCell>
                      </TableRow>
                    ) : translations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <T text="No translations found" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      translations.map(t => (
                        <TableRow key={t.id} className="group">
                          <TableCell className="font-mono text-sm">
                            {t.sourceText.length > 80 ? t.sourceText.slice(0, 80) + '...' : t.sourceText}
                          </TableCell>
                          <TableCell>
                            {editingId === t.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="flex-1"
                                  autoFocus
                                />
                                <Button size="sm" onClick={() => handleSaveEdit(t.id)} disabled={saving}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm">
                                {t.translatedText.length > 80 ? t.translatedText.slice(0, 80) + '...' : t.translatedText}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="capitalize text-xs">
                              {t.category || 'general'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(t.id);
                                  setEditText(t.translatedText);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(t.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • {stats.total} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Translation Override Rules
              </CardTitle>
              <CardDescription>
                Define custom word/phrase replacements that apply after DeepL translation.
                Useful for ensuring specific business terms use PT-PT instead of PT-BR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new rule */}
              <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                <Input
                  placeholder="Source word/phrase (e.g., 'contact')"
                  value={newRuleSource}
                  onChange={(e) => setNewRuleSource(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Replacement (e.g., 'contacto')"
                  value={newRuleTranslation}
                  onChange={(e) => setNewRuleTranslation(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddRule} disabled={!newRuleSource.trim()}>
                  <Plus className="h-4 w-4 mr-2" />Add Rule
                </Button>
              </div>

              {/* Rules list */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Source Text</TableHead>
                      <TableHead>Replacement</TableHead>
                      <TableHead className="w-20 text-right">Remove</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(rules).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No override rules defined
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(rules).map(([source, replacement]) => (
                        <TableRow key={source}>
                          <TableCell className="font-mono">{source}</TableCell>
                          <TableCell className="font-mono">{replacement}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRule(source)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="outline" onClick={fetchRules} disabled={rulesLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${rulesLoading ? 'animate-spin' : ''}`} />
                  Reload
                </Button>
                <Button onClick={handleSaveRules} disabled={rulesLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Translation Settings</CardTitle>
              <CardDescription>Configure translation behavior and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Info */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🇵🇹 European Portuguese (PT-PT)
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  All translations use European Portuguese (PT-PT), not Brazilian Portuguese (PT-BR).
                  DeepL is configured to target PT-PT, and additional glossary rules convert common 
                  Brazilian terms to European equivalents.
                </p>
              </div>

              <Separator />

              {/* Maintenance Actions */}
              <div className="space-y-4">
                <h3 className="font-semibold">Maintenance Actions</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-orange-500" />
                      <h4 className="font-medium">Refresh PT Translations</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clear all Portuguese translations to re-translate using PT-PT. 
                      Use this if you see Brazilian Portuguese text.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleClearPTTranslations}
                      disabled={loading}
                    >
                      Clear & Re-translate PT
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">Export Translations</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Download all translations as JSON for backup or analysis.
                    </p>
                    <Button variant="outline" className="w-full" onClick={handleExport}>
                      Export JSON
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* PT-BR to PT-PT Glossary Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">Built-in PT-BR → PT-PT Corrections</h3>
                <p className="text-sm text-muted-foreground">
                  These automatic corrections are applied after DeepL translation:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {[
                    ['contato', 'contacto'],
                    ['conosco', 'connosco'],
                    ['aluguel', 'aluguer'],
                    ['celular', 'telemóvel'],
                    ['ônibus', 'autocarro'],
                    ['fato', 'facto'],
                    ['trem', 'comboio'],
                    ['banheiro', 'casa de banho'],
                  ].map(([br, pt]) => (
                    <div key={br} className="p-2 bg-muted rounded text-center">
                      <span className="line-through text-muted-foreground">{br}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Translation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Translation</DialogTitle>
            <DialogDescription>
              Add a custom translation for {targetLang === 'pt' ? 'Portuguese' : 'English'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Source Text (English)</Label>
              <Textarea
                placeholder="Enter the English text..."
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Translation ({targetLang === 'pt' ? 'Português' : 'English'})</Label>
              <Textarea
                placeholder="Enter the translation..."
                value={newTranslation}
                onChange={(e) => setNewTranslation(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTranslation}>
              <Plus className="h-4 w-4 mr-2" />Add Translation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
