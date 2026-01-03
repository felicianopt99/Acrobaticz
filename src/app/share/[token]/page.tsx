import { headers } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Download, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

async function getSharedFile(token: string) {
  try {
    const headersList = await headers();
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    const host = headersList.get('host');
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/cloud/share/${token}`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      return { error: res.statusText, status: res.status };
    }

    return res.json();
  } catch (error) {
    return { error: 'Failed to fetch shared file', status: 500 };
  }
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const result = await getSharedFile(params.token);

  if (result.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {result.status === 404 ? 'Link Not Found' : 'Access Denied'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {result.status === 404
                ? 'This shared link does not exist or has expired.'
                : 'You do not have permission to access this file.'}
            </p>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { file, share } = result;

  // Check if share has expired
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
            <Lock className="h-16 w-16 mx-auto text-orange-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Link Expired
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This shared link has expired and is no longer available.
            </p>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {file.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Shared with you • {(Number(file.size) / 1024 / 1024).toFixed(2)} MB
          </p>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Permission: <span className="font-semibold capitalize">{share.permission}</span>
              </div>
              <DownloadButton fileId={file.id} fileName={file.name} />
            </div>
          </div>

          {share.permission === 'view' && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You have view-only access to this file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DownloadButton({ fileId, fileName }: { fileId: string; fileName: string }) {
  return (
    <form
      action={async () => {
        'use server';
        // Download will be handled by the API
      }}
    >
      <Button
        asChild
        className="flex items-center gap-2"
        onClick={() => {
          window.location.href = `/api/cloud/files/${fileId}?download=true`;
        }}
      >
        <a href={`/api/cloud/files/${fileId}?download=true`}>
          <Download className="h-4 w-4" />
          Download File
        </a>
      </Button>
    </form>
  );
}
