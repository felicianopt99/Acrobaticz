'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function SharedPageContent({ userId }: { userId: string }) {
  const [shared, setShared] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div>
      <AppHeader title="Shared With Me" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : shared.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No files shared with you yet</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
