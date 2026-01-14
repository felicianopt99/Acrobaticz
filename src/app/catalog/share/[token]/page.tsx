import { notFound } from 'next/navigation';
import { PublicCatalogContent } from '@/components/catalog/PublicCatalogContent';

interface PageProps {
  params: Promise<{ token: string }>;
}

// Enable ISR: revalidate every 5 minutes
export const revalidate = 300; // 5 minutes

// Dynamic metadata for better SEO
export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  return {
    title: 'Equipment Catalog',
    description: 'Browse our equipment catalog',
    openGraph: {
      title: 'Equipment Catalog',
      description: 'Browse our equipment catalog',
    },
  };
}

export default async function PublicCatalogPage({ params }: PageProps) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicCatalogContent token={token} />
    </div>
  );
}
