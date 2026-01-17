import React from 'react';
import Link from 'next/link';
import { Home, Package, Users, CalendarClock } from 'lucide-react';
import { useTranslate } from '@/contexts/TranslationContext';

const BottomNavigation: React.FC = () => {
  const { translated: homeText } = useTranslate('Home');
  const { translated: equipmentText } = useTranslate('Equipment');
  const { translated: clientsText } = useTranslate('Clients');
  const { translated: eventsText } = useTranslate('Events');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around py-2 backdrop-blur-xl z-50">
      <Link href="/">
        <a className="flex flex-col items-center text-muted-foreground hover:text-primary">
          <Home className="h-6 w-6" />
          <span className="text-xs">{homeText}</span>
        </a>
      </Link>
      <Link href="/equipment">
        <a className="flex flex-col items-center text-muted-foreground hover:text-primary">
          <Package className="h-6 w-6" />
          <span className="text-xs">{equipmentText}</span>
        </a>
      </Link>
      <Link href="/clients">
        <a className="flex flex-col items-center text-gray-600 hover:text-blue-500">
          <Users className="h-6 w-6" />
          <span className="text-xs">{clientsText}</span>
        </a>
      </Link>
      <Link href="/events">
        <a className="flex flex-col items-center text-gray-600 hover:text-blue-500">
          <CalendarClock className="h-6 w-6" />
          <span className="text-xs">{eventsText}</span>
        </a>
      </Link>
    </nav>
  );
};

export default BottomNavigation;