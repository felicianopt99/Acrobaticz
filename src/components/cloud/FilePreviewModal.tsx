'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
  mimeType: string;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  fileId,
  fileName,
  mimeType,
}: FilePreviewModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const isImage = mimeType.startsWith('image/');
  const isPDF = mimeType === 'application/pdf';
  const isVideo = mimeType.startsWith('video/');
  const isAudio = mimeType.startsWith('audio/');
  const isText = mimeType.startsWith('text/') || mimeType.includes('json');

  const fileUrl = `/api/cloud/files/${fileId}`;

  const handleDownload = () => {
    window.location.href = `${fileUrl}?download=true`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate">{fileName}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {mimeType}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-[400px] bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-auto">
          {isLoading && !isText && (
            <div className="animate-spin">
              <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-500 rounded-full" />
            </div>
          )}

          {/* Image Preview */}
          {isImage && (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <Image
                src={fileUrl}
                alt={fileName}
                fill
                className="object-contain"
                onLoadingComplete={() => setIsLoading(false)}
              />
            </div>
          )}

          {/* Video Preview */}
          {isVideo && (
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-full"
              onLoadedMetadata={() => setIsLoading(false)}
            />
          )}

          {/* Audio Preview */}
          {isAudio && (
            <div className="w-full px-8">
              <audio
                src={fileUrl}
                controls
                className="w-full"
                onLoadedMetadata={() => setIsLoading(false)}
              />
            </div>
          )}

          {/* PDF Preview */}
          {isPDF && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <p className="text-gray-600 dark:text-gray-400">
                PDF preview not available in browser
              </p>
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          )}

          {/* Text Preview */}
          {isText && (
            <TextPreview fileUrl={fileUrl} onLoad={() => setIsLoading(false)} />
          )}

          {/* Unsupported Format */}
          {!isImage && !isVideo && !isAudio && !isPDF && !isText && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Preview not available for this file type
              </p>
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download File
              </Button>
            </div>
          )}
        </div>

        {/* Download Button */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TextPreview({
  fileUrl,
  onLoad,
}: {
  fileUrl: string;
  onLoad: () => void;
}) {
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetch(fileUrl)
      .then(res => res.text())
      .then(text => {
        setContent(text.substring(0, 10000)); // Limit to 10KB display
        onLoad();
      })
      .catch(() => {
        setError('Failed to load file content');
        onLoad();
      });
  }, [fileUrl, onLoad]);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <pre className="bg-white dark:bg-slate-800 p-4 rounded-lg w-full h-full overflow-auto text-sm font-mono whitespace-pre-wrap break-words">
      {content || 'Loading...'}
    </pre>
  );
}
