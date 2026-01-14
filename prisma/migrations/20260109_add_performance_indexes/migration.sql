-- Migração: Adicionar índices para otimizar queries de performance
-- Criado em: 2026-01-09
-- Descrição: Índices compostos para melhorar performance de queries

-- ============================================================================
-- ÍNDICES PARA EquipmentItem
-- ============================================================================

-- Índice 1: Categoria + Nome (queries filtradas por categoria)
CREATE INDEX IF NOT EXISTS "idx_equipment_category_name" 
  ON "EquipmentItem"("categoryId" ASC, "name" ASC);

-- Índice 2: Subcategoria + Nome
CREATE INDEX IF NOT EXISTS "idx_equipment_subcategory_name" 
  ON "EquipmentItem"("subcategoryId" ASC, "name" ASC);

-- Índice 3: Status + Categoria (queries de disponibilidade)
CREATE INDEX IF NOT EXISTS "idx_equipment_status_category" 
  ON "EquipmentItem"("status" ASC, "categoryId" ASC);

-- Índice 4: Data de criação (ordenação por data)
CREATE INDEX IF NOT EXISTS "idx_equipment_createdat" 
  ON "EquipmentItem"("createdAt" DESC);

-- Índice 5: Nome para busca
CREATE INDEX IF NOT EXISTS "idx_equipment_name" 
  ON "EquipmentItem"("name" ASC);

-- Índice 6: Categoria (filtros simples)
CREATE INDEX IF NOT EXISTS "idx_equipment_category_id" 
  ON "EquipmentItem"("categoryId" ASC);

-- Índice 7: Subcategoria
CREATE INDEX IF NOT EXISTS "idx_equipment_subcategory_id" 
  ON "EquipmentItem"("subcategoryId" ASC);

-- ============================================================================
-- ÍNDICES PARA Category
-- ============================================================================

-- Índice 1: Nome (ordenação e busca)
CREATE INDEX IF NOT EXISTS "idx_category_name" 
  ON "Category"("name" ASC);

-- Índice 2: Data de atualização
CREATE INDEX IF NOT EXISTS "idx_category_updatedat" 
  ON "Category"("updatedAt" DESC);

-- ============================================================================
-- ÍNDICES PARA Subcategory
-- ============================================================================

-- Índice 1: Parent + Nome
CREATE INDEX IF NOT EXISTS "idx_subcategory_parent_name" 
  ON "Subcategory"("parentId" ASC, "name" ASC);

-- Índice 2: Nome
CREATE INDEX IF NOT EXISTS "idx_subcategory_name" 
  ON "Subcategory"("name" ASC);

-- ============================================================================
-- ÍNDICES PARA CatalogShare
-- ============================================================================

-- Índice 1: Token (busca por token)
CREATE INDEX IF NOT EXISTS "idx_catalogshare_token" 
  ON "CatalogShare"("token" ASC);

-- Índice 2: Partner + Data expiração
CREATE INDEX IF NOT EXISTS "idx_catalogshare_partner_expires" 
  ON "CatalogShare"("partnerId" ASC, "expiresAt" DESC);

-- Índice 3: Data de criação
CREATE INDEX IF NOT EXISTS "idx_catalogshare_createdat" 
  ON "CatalogShare"("createdAt" DESC);

-- ============================================================================
-- ÍNDICES PARA CatalogShareItems (opcional - se tabela foi criada)
-- ============================================================================
-- Comentado por enquanto - ativar se tabela for criada
-- CREATE INDEX IF NOT EXISTS "idx_catalogshareitems_catalogshare_equipment" 
--   ON "CatalogShareItems"("catalogShareId" ASC, "equipmentId" ASC);
-- CREATE INDEX IF NOT EXISTS "idx_catalogshareitems_equipment" 
--   ON "CatalogShareItems"("equipmentId" ASC);

-- ============================================================================
-- ANÁLISE
-- ============================================================================

-- Executar análise para atualizar estatísticas
ANALYZE "EquipmentItem";
ANALYZE "Category";
ANALYZE "Subcategory";
ANALYZE "CatalogShare";
