'use client';

/**
 * Translation Manager Component
 * Admin dashboard component for managing translations with shadcn/ui
 * Shows translation status and allows manual retranslation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getProductTranslationStatus,
  getCategoryTranslationStatus,
  retranslateProduct,
  retranslateCategory,
  getCacheStatistics,
} from '@/app/api/actions/translation.actions';
import type { TranslationStatus, Language } from '@/types/translation.types';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const SUPPORTED_LANGUAGES: Language[] = ['en', 'pt'];

interface TranslationManagerProps {
  contentType: 'product' | 'category';
  contentId: string;
  contentName: string;
}

export function TranslationManager({
  contentType,
  contentId,
  contentName,
}: TranslationManagerProps) {
  const [status, setStatus] = useState<TranslationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [retranslating, setRetranslating] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(['pt']);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial translation status
  useEffect(() => {
    loadTranslationStatus();
  }, [contentId]);

  const loadTranslationStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result =
        contentType === 'product'
          ? await getProductTranslationStatus(contentId)
          : await getCategoryTranslationStatus(contentId);

      if (result.status === 'success' && result.data) {
        setStatus(result.data);
      } else {
        setError(result.message || 'Failed to load translation status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [contentId, contentType]);

  const handleRetranslate = useCallback(async () => {
    try {
      setRetranslating(true);
      setError(null);

      const result =
        contentType === 'product'
          ? await retranslateProduct(contentId, selectedLanguages)
          : await retranslateCategory(contentId, selectedLanguages);

      if (result.status === 'success' && result.data) {
        setStatus(result.data);
        setIsOpen(false);
      } else {
        setError(result.message || 'Retranslation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRetranslating(false);
    }
  }, [contentId, contentType, selectedLanguages]);

  const getStatusIcon = (
    translationStatus: TranslationStatus['translations'][keyof TranslationStatus['translations']]
  ) => {
    if (!translationStatus) return <Clock className="w-4 h-4 text-gray-400" />;

    switch (translationStatus.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (translationStatus: string | undefined) => {
    switch (translationStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Translation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Translation Manager</CardTitle>
          <p className="text-sm text-gray-600 mt-1">{contentName}</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retranslate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retranslate {contentType}</DialogTitle>
              <DialogDescription>
                Select languages to retranslate. This will overwrite existing translations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Target Languages</label>
                <div className="space-y-2">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <label key={lang} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedLanguages([...selectedLanguages, lang]);
                          } else {
                            setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">
                        {lang === 'pt' ? 'Portuguese' : 'English'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={retranslating}
                >
                  Cancel
                </Button>
                <Button onClick={handleRetranslate} disabled={retranslating} className="gap-2">
                  {retranslating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {retranslating ? 'Translating...' : 'Retranslate'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status ? (
          <div className="space-y-4">
            {/* Translation Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUPPORTED_LANGUAGES.map(lang => {
                const translation = status.translations[lang];
                const isCompleted = translation?.status === 'completed';
                const isFailed = translation?.status === 'failed';

                return (
                  <div key={lang} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {lang === 'pt' ? 'Portuguese' : 'English'}
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(translation)}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(translation?.status)}`}
                        >
                          {translation?.status || 'not-started'}
                        </span>
                      </div>
                    </div>

                    {isCompleted && translation.text && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Translation:</p>
                        <p className="text-sm text-gray-700 italic">"{translation.text}"</p>
                      </div>
                    )}

                    {isFailed && translation.error && (
                      <div className="mt-2">
                        <p className="text-xs text-red-500">Error: {translation.error}</p>
                      </div>
                    )}

                    {translation?.translatedAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(translation.translatedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Metadata */}
            <div className="border-t pt-4 mt-4 text-xs text-gray-500 space-y-1">
              <p>
                <span className="font-medium">Type:</span> {status.isAutomatic ? 'Automatic' : 'Manual'}
              </p>
              <p>
                <span className="font-medium">Last Updated:</span>{' '}
                {new Date(status.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No translation data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Translation Cache Statistics Component
 */
interface CacheStatsProps {
  onRefresh?: () => void;
}

export function TranslationCacheStats({ onRefresh }: CacheStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await getCacheStatistics();
      if (result.status === 'success' && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to load cache stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
    onRefresh?.();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Cache Statistics</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Cached Items</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCached}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Expired Items</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalExpired}</p>
              </div>
            </div>

            {Object.keys(stats.byLanguage || {}).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-600 mb-2">By Language:</p>
                <div className="space-y-1">
                  {Object.entries(stats.byLanguage).map(([lang, count]) => (
                    <div key={lang} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {lang === 'pt' ? 'Portuguese' : 'English'}
                      </span>
                      <span className="font-medium text-gray-900">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No cache data available</p>
        )}
      </CardContent>
    </Card>
  );
}
