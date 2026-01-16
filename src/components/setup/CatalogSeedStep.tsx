'use client';

import { useState } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronUp, Loader2, Package, Users, MapPin } from 'lucide-react';

interface SeedStats {
  users: number;
  clients: number;
  partners: number;
  categories: number;
  subcategories: number;
  products: number;
  images: number;
  logos: number;
  errors: number;
}

export function CatalogSeedStep({ onNext }: { onNext: () => void }) {
  const [shouldSeed, setShouldSeed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState<SeedStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleSeed = async () => {
    if (!shouldSeed) {
      onNext();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup/seed-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shouldSeed: true,
          cleanDatabase: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Seeding failed');
      }

      setStats(data.stats);
      setCompleted(true);

      // Auto-advance after 3 seconds
      setTimeout(() => {
        onNext();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Dados de Catálogo</h2>
        <p className="text-gray-600">
          Deseja importar 65 produtos de equipamento com imagens, categorias, clientes e parceiros?
        </p>
      </div>

      {/* Preview Card */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Package className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">64 Produtos AV</h3>
              <p className="text-sm text-gray-600">Iluminação, Som, Vídeo, Estruturas e Poder</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Users className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Usuários & Clientes</h3>
              <p className="text-sm text-gray-600">3 usuários (Admin, Manager, Technician) + 1 cliente premium</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <MapPin className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900">Imagens & Logos</h3>
              <p className="text-sm text-gray-600">77 imagens de produtos + 3 logos da plataforma</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Expandable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition"
      >
        <span className="font-medium text-gray-900">O que será importado?</span>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="rounded-lg bg-gray-50 p-4 space-y-3 border border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Categorias</p>
              <p className="font-semibold text-gray-900">6 principais</p>
            </div>
            <div>
              <p className="text-gray-600">Subcategorias</p>
              <p className="font-semibold text-gray-900">21 especializadas</p>
            </div>
            <div>
              <p className="text-gray-600">Produtos</p>
              <p className="font-semibold text-gray-900">64 itens com descrição</p>
            </div>
            <div>
              <p className="text-gray-600">Imagens</p>
              <p className="font-semibold text-gray-900">77 fotografias</p>
            </div>
            <div>
              <p className="text-gray-600">Clientes</p>
              <p className="font-semibold text-gray-900">1 principal (VRD Production)</p>
            </div>
            <div>
              <p className="text-gray-600">Parceiros</p>
              <p className="font-semibold text-gray-900">1 parceiro</p>
            </div>
          </div>
        </div>
      )}

      {/* Seeding In Progress */}
      {isLoading && !completed && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <p className="font-medium text-blue-900">Importando catálogo...</p>
          </div>
          <p className="text-sm text-blue-800">
            Isso pode levar alguns segundos. Por favor, não feche esta página.
          </p>
        </div>
      )}

      {/* Seeding Completed */}
      {completed && stats && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            <p className="font-medium text-green-900">Catálogo importado com sucesso!</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between bg-white rounded px-2 py-1">
              <span className="text-gray-600">Usuários:</span>
              <span className="font-semibold">{stats.users}</span>
            </div>
            <div className="flex justify-between bg-white rounded px-2 py-1">
              <span className="text-gray-600">Clientes:</span>
              <span className="font-semibold">{stats.clients}</span>
            </div>
            <div className="flex justify-between bg-white rounded px-2 py-1">
              <span className="text-gray-600">Categorias:</span>
              <span className="font-semibold">{stats.categories}</span>
            </div>
            <div className="flex justify-between bg-white rounded px-2 py-1">
              <span className="text-gray-600">Produtos:</span>
              <span className="font-semibold">{stats.products}</span>
            </div>
            <div className="flex justify-between bg-white rounded px-2 py-1">
              <span className="text-gray-600">Imagens:</span>
              <span className="font-semibold">{stats.images}</span>
            </div>
            <div className="flex justify-between bg-white rounded px-2 py-1">
              <span className="text-gray-600">Logos:</span>
              <span className="font-semibold">{stats.logos}</span>
            </div>
          </div>

          <p className="text-xs text-green-700">
            Continuando para o próximo passo em 3 segundos...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Erro na importação</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Checkbox */}
      {!isLoading && !completed && (
        <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition">
          <input
            type="checkbox"
            checked={shouldSeed}
            onChange={(e) => setShouldSeed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
          />
          <div>
            <p className="font-medium text-gray-900">
              Sim, importar catálogo de produtos
            </p>
            <p className="text-sm text-gray-600">
              Recomendado para ter dados de demonstração no sistema
            </p>
          </div>
        </label>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        {!isLoading && !completed && (
          <>
            <button
              onClick={() => {
                setShouldSeed(false);
                onNext();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Ignorar
            </button>
            <button
              onClick={handleSeed}
              disabled={!shouldSeed}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                shouldSeed
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Importar Catálogo
            </button>
          </>
        )}

        {completed && (
          <button
            onClick={onNext}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Continuar
          </button>
        )}
      </div>

      {/* Info Footer */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Dica:</strong> Você pode sempre adicionar mais produtos ou editar os existentes
          após a instalação através do painel de administração.
        </p>
      </div>
    </div>
  );
}
