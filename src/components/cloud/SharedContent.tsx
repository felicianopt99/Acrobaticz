'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface SharedContentProps {
  userId: string;
}

export function SharedContent({ userId }: SharedContentProps) {
  return (
    <div className="min-h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-400" />
          Shared with me
        </h1>
        <p className="text-gray-400 text-sm mt-1">Files and folders others have shared with you</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-32 h-32 mb-6 rounded-full bg-white/5 flex items-center justify-center">
          <Users className="h-12 w-12 text-gray-500" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">No shared items</h2>
        <p className="text-gray-400 max-w-md">
          Files and folders that others share with you will appear here
        </p>
      </div>
    </div>
  );
}
