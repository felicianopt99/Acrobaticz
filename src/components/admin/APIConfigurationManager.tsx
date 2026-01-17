'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Clock, Plus, Trash2, TestTube } from 'lucide-react';
import {
  getAPIConfigurations,
  updateAPIConfiguration,
  deleteAPIConfiguration,
  testAPIConnection,
  toggleAPIConfiguration,
  type APIConfigResponse,
} from '@/app/api/actions/api-configuration.actions';

const PROVIDERS = ['deepl', 'gemini'] as const;

export default function APIConfigurationManager() {
  const [configurations, setConfigurations] = useState<APIConfigResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState({ apiKey: '', settings: '{}' });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const data = await getAPIConfigurations();
      setConfigurations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (provider?: string) => {
    if (provider) {
      const config = configurations.find((c) => c.provider === provider);
      if (config) {
        setEditingProvider(provider);
        setFormData({
          apiKey: '', // Don't expose the key
          settings: JSON.stringify(config.settings, null, 2),
        });
      }
    } else {
      setEditingProvider(null);
      setFormData({ apiKey: '', settings: '{}' });
    }
    setOpenDialog(true);
  };

  const handleSaveConfiguration = async (provider: string) => {
    try {
      setSubmitting(provider);
      setError(null);

      let settings = {};
      try {
        settings = JSON.parse(formData.settings);
      } catch {
        throw new Error('Invalid JSON in settings');
      }

      await updateAPIConfiguration({
        provider: provider as 'deepl' | 'gemini',
        apiKey: formData.apiKey,
        settings,
      });

      setSuccess(`${provider} configuration updated successfully`);
      setOpenDialog(false);
      await loadConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSubmitting(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleTestConnection = async (provider: string) => {
    try {
      setTesting(provider);
      setError(null);

      const result = await testAPIConnection(provider);
      
      if (result.success) {
        setSuccess(`${provider} connection test passed`);
      } else {
        setError(`${provider} test failed: ${result.message}`);
      }

      await loadConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(null);
      setTimeout(() => setSuccess(null), 5000);
    }
  };

  const handleToggle = async (provider: string, currentStatus: boolean) => {
    try {
      setSubmitting(provider);
      await toggleAPIConfiguration(provider, !currentStatus);
      setSuccess(`${provider} ${!currentStatus ? 'enabled' : 'disabled'}`);
      await loadConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle configuration');
    } finally {
      setSubmitting(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleDelete = async (provider: string) => {
    if (!confirm(`Are you sure you want to delete ${provider} configuration?`)) return;

    try {
      setSubmitting(provider);
      await deleteAPIConfiguration(provider);
      setSuccess(`${provider} configuration deleted`);
      await loadConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
    } finally {
      setSubmitting(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Integrations</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage external API keys and configurations for DeepL and Gemini
          </p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add API
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? `Edit ${editingProvider}` : 'Add New API'}
              </DialogTitle>
              <DialogDescription>
                Configure your API credentials and settings
              </DialogDescription>
            </DialogHeader>

            {!editingProvider ? (
              <div className="space-y-3">
                {PROVIDERS.map((provider) => {
                  const exists = configurations.some((c) => c.provider === provider);
                  return (
                    <Button
                      key={provider}
                      variant={exists ? 'outline' : 'default'}
                      className="w-full"
                      onClick={() => {
                        setEditingProvider(provider);
                        setFormData({ apiKey: '', settings: '{}' });
                      }}
                    >
                      {provider.toUpperCase()}
                      {exists && ' (configured)'}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your API key"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="settings">Settings (JSON)</Label>
                  <textarea
                    id="settings"
                    className="w-full h-32 p-2 border rounded font-mono text-sm"
                    value={formData.settings}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, settings: e.target.value }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingProvider(null)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => handleSaveConfiguration(editingProvider)}
                    disabled={submitting === editingProvider || !formData.apiKey}
                    className="flex-1"
                  >
                    {submitting === editingProvider ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-start gap-3 pt-6">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading configurations...</div>
      ) : configurations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            No API configurations yet. Click "Add API" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configurations.map((config) => (
            <Card key={config.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg capitalize">{config.provider}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {config.isActive ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection(config.provider)}
                      disabled={testing === config.provider}
                      title="Test connection"
                    >
                      <TestTube className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(config.provider)}
                      disabled={submitting === config.provider}
                      title="Delete configuration"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Test Status</p>
                    <p className="font-medium">
                      {config.testStatus === 'success' ? (
                        <span className="text-green-600">✓ Passed</span>
                      ) : config.testStatus === 'failed' ? (
                        <span className="text-red-600">✗ Failed</span>
                      ) : (
                        <span className="text-gray-500">Not tested</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Tested</p>
                    <p className="font-medium text-sm">
                      {config.lastTestedAt
                        ? new Date(config.lastTestedAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {config.testError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {config.testError}
                  </div>
                )}

                {Object.keys(config.settings).length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Settings</p>
                    <pre className="p-2 bg-gray-50 rounded text-xs overflow-x-auto border border-gray-200">
                      {JSON.stringify(config.settings, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(config.provider)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant={config.isActive ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => handleToggle(config.provider, config.isActive)}
                    disabled={submitting === config.provider}
                    className="flex-1"
                  >
                    {config.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
