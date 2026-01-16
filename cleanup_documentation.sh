#!/bin/bash

###############################################################################
# DOCUMENTATION CLEANUP & CONSOLIDATION SCRIPT
# Removes phase-related, status, and temporary implementation files
# Consolidates essential documentation
###############################################################################

set -e

REPO_DIR="/media/feli/38826d41-4b6a-4f13-9e48-d9628771bfe5/AC/Acrobaticz"
ARCHIVE_DIR="$REPO_DIR/.documentation_archive_$(date +%Y%m%d_%H%M%S)"
KEEP_DOCS=()

echo "🗑️  Starting Documentation Cleanup & Consolidation..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create archive directory for backup
mkdir -p "$ARCHIVE_DIR"
echo "📦 Archive directory: $ARCHIVE_DIR"
echo ""

###############################################################################
# PHASE FILES TO REMOVE
###############################################################################

PHASE_FILES=(
    "PHASE_1_2_IMPLEMENTATION_NOTES.md"
    "PHASE_1_2_QUICK_REFERENCE.md"
    "PHASE_1_2_SUMMARY.sh"
    "PHASE_1_2_TESTING_GUIDE.md"
    "PHASE_2_CHANGES_SUMMARY.md"
    "PHASE_2_FRONTEND_COMPLETION.md"
    "PHASE_2_QUICK_REFERENCE.md"
    "PHASE_2_VERIFICATION_CHECKLIST.md"
    "PHASE_3_MIGRATION_CONSOLIDATION_PLAN.md"
    "PHASE_4_ARCHITECTURE.md"
    "PHASE_4_COOKIES_IMPLEMENTATION.md"
    "PHASE_4_DONE.md"
    "PHASE_4_QUICKREF.md"
    "PHASE_4_README.md"
    "PHASE_4_SUMMARY.md"
)

echo "📋 PHASE FILES (removing 15 files):"
for file in "${PHASE_FILES[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        mv "$REPO_DIR/$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done
echo ""

###############################################################################
# FRENTE IMPLEMENTATION TRACKING FILES
###############################################################################

FRENTE_FILES=(
    "FRENTE_1_FICHEIROS_MODIFICADOS.md"
    "FRENTE_1_IMPLEMENTACAO.md"
    "FRENTE_1_PHASE_2_COMPLETE.md"
    "FRENTE_1_PHASE_2_EXECUTIVE_SUMMARY.md"
    "FRENTE_1_QUICK_REFERENCE.md"
)

echo "🔧 FRENTE FILES (removing 5 files):"
for file in "${FRENTE_FILES[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        mv "$REPO_DIR/$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done
echo ""

###############################################################################
# IMPLEMENTATION & STATUS TRACKING
###############################################################################

TRACKING_FILES=(
    "IMPLEMENTATION_SUMMARY_COMPLETE.md"
    "EXECUTIVE_SUMMARY_QA_AUDIT.md"
    "ACTION_PLAN_EXECUTIVE_DEPLOYMENT.md"
    "ELITE_SETUP_IMPLEMENTATION_PLAN.md"
    "FINAL_PHASE_4_REPORT.txt"
)

echo "📊 IMPLEMENTATION TRACKING (removing 5 files):"
for file in "${TRACKING_FILES[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        mv "$REPO_DIR/$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done
echo ""

###############################################################################
# QUICK REFERENCE & SETUP FILES (consolidate into QUICK_START.md)
###############################################################################

QUICK_REF_FILES=(
    "QUICK_START_INTEGRATED_SECURITY.md"
    "QUICK_START_PRISMA.txt"
    "QUICK_FIX_INSTALACAO.md"
    "SOCKET_IO_QUICK_REFERENCE.md"
)

echo "⚡ QUICK REFERENCE FILES (consolidating into QUICK_START.md):"
for file in "${QUICK_REF_FILES[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        mv "$REPO_DIR/$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done
echo ""

###############################################################################
# DIAGNOSTIC & ANALYSIS FILES
###############################################################################

ANALYSIS_FILES=(
    "DIAGNOSTICO_TECNICO_ERRO_INSTALACAO.md"
    "RESUMO_SOLUCAO_ERRO_INSTALACAO.md"
    "SOLUCAO_IMPLEMENTADA_ERRO_INSTALACAO.md"
    "QUICK_FIX_INSTALACAO.md"
    "RELATORIO_INSTALADOR.md"
)

echo "🔍 DIAGNOSTIC FILES (consolidating into DEPLOYMENT.md):"
for file in "${ANALYSIS_FILES[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        mv "$REPO_DIR/$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done
echo ""

###############################################################################
# ARCHITECTURAL & PLANNING DOCS
###############################################################################

ARCH_FILES=(
    "ARQUITECTURA_INTEGRADA_SEGURANCA.md"
    "ARQUITETURA_DIAGRAMAS_VISUAIS.md"
    "SOCKET_IO_BACKEND_IMPLEMENTATION.md"
    "SOCKET_IO_EXTENSION_GUIDE.md"
    "SOCKET_IO_INTEGRATION_SUMMARY.md"
    "SOCKET_IO_PRODUCTION_CHECKLIST.md"
    "SOCKET_IO_TEST_GUIDE.md"
)

echo "🏗️  ARCHITECTURAL FILES (consolidating into ARCHITECTURE.md):"
for file in "${ARCH_FILES[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        mv "$REPO_DIR/$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done
echo ""

###############################################################################
# SECURITY & OPTIMIZATION DOCS
###############################################################################

SECURITY_FILES=(
    "RESUMO_EXECUTIVO_SEGURANCA.md"
    "PROXY_CONNECTIVITY_AUDIT.md"
    "QA_AUDIT_REPORT_2026_01_15.md"
    "QA_TECHNICAL_EVIDENCE_APPENDIX_A.md"
)

echo "🔐 SECURITY & AUDIT FILES (keeping for reference in docs/):"
for file in "${SECURITY_FILES[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        mv "$REPO_DIR/$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done
echo ""

###############################################################################
# ANALYSIS & CATALOG FILES
###############################################################################

CATALOG_FILES=(
    "CLEANUP_ANALYSIS.md"
    "INDEX_ARQUITETURA.md"
)

echo "📚 INDEX & ANALYSIS FILES (consolidating):"
for file in "${CATALOG_FILES[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        mv "$REPO_DIR/$file" "$ARCHIVE_DIR/"
        echo "  ✓ Archived: $file"
    fi
done
echo ""

###############################################################################
# SUMMARY: FILES TO KEEP IN ROOT
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CONSOLIDATED DOCUMENTATION STRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

KEEP_IN_ROOT=(
    "README.md"
    "QUICK_START.md"
    "CONTRIBUTING.md"
    "DEPLOYMENT.md"
    "INSTALL_GUIDE.md"
    "INSTALLER_README.md"
    "INSTALLER_ADVANCED.md"
    "INSTALLER_COMPARISON.md"
    "EXECUTIVE_SUMMARY.md"
    "DOCKER_DEV_SETUP.md"
)

echo "📌 ROOT LEVEL DOCUMENTATION (Core files):"
for file in "${KEEP_IN_ROOT[@]}"; do
    if [ -f "$REPO_DIR/$file" ]; then
        echo "  ✓ KEPT: $file"
    fi
done
echo ""

OTHER_KEPT=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "docker-compose.test.yml"
    "docker-entrypoint.sh"
    "Dockerfile"
    "Dockerfile.dev"
    "package.json"
    "next.config.ts"
    "tsconfig.json"
    "tailwind.config.ts"
    "postcss.config.mjs"
    "translation-rules.json"
    "components.json"
    "env"
    "env.production"
    ".env*"
)

echo "⚙️  CONFIGURATION FILES (project setup):"
for file in "${OTHER_KEPT[@]}"; do
    count=$(find "$REPO_DIR" -maxdepth 1 -name "$file" 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "  ✓ KEPT: $file"
    fi
done
echo ""

###############################################################################
# STATISTICS
###############################################################################

ARCHIVED_COUNT=$(find "$ARCHIVE_DIR" -maxdepth 1 -type f | wc -l)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CLEANUP STATISTICS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Files archived: $ARCHIVED_COUNT"
echo "Archive location: $ARCHIVE_DIR"
echo ""
echo "✨ Documentation cleanup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Review archived files in: $ARCHIVE_DIR"
echo "  2. Update main README.md with consolidated information"
echo "  3. Ensure QUICK_START.md covers all setup scenarios"
echo "  4. Verify DEPLOYMENT.md includes all deployment instructions"
echo ""
echo "💾 Archive can be safely deleted after verification"
