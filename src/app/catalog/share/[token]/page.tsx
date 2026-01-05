import { notFound } from 'next/navigation';
import { PublicCatalogContent } from '@/components/catalog/PublicCatalogContent';

interface PageProps {
  params: Promise<{ token: string }>;
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
