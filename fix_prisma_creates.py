#!/usr/bin/env python3
"""
Script para adicionar campos obrigatórios (id, updatedAt) em todos os prisma.*.create()
"""
import os
import re
from pathlib import Path

# Modelos que precisam de id e updatedAt
MODELS_NEEDING_ID = [
    'category', 'client', 'subcategory', 'catalogShare', 'event', 'fee', 
    'partner', 'jobReference', 'service', 'subrental', 'cloudFolder',
    'cloudFile', 'fileActivity', 'fileShare', 'fileTag', 'tagDefinition',
    'batchOperation', 'activityLog', 'storageQuota', 'notification',
    'notificationPreference', 'dataSyncEvent', 'translationJob',
    'translationHistory', 'productTranslation', 'categoryTranslation',
    'translationCache', 'customization_settings'
]

def fix_create_statements(content, filepath):
    """Adiciona id e updatedAt em prisma creates"""
    modified = False
    
    for model in MODELS_NEEDING_ID:
        # Pattern para encontrar .create({ data: {
        pattern = rf'(prisma\.{model}\.create\(\{{\s*data:\s*\{{)'
        
        matches = list(re.finditer(pattern, content, re.IGNORECASE))
        
        for match in reversed(matches):
            start = match.end()
            # Encontrar o final do objeto data
            brace_count = 1
            i = start
            while i < len(content) and brace_count > 0:
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                i += 1
            
            data_obj = content[start:i-1]
            
            # Verificar se já tem id
            if 'id:' not in data_obj:
                # Adicionar id no início
                new_content = content[:start] + '\n        id: crypto.randomUUID(),' + content[start:]
                content = new_content
                modified = True
                print(f"  ✓ Adicionado id em {model}.create() em {filepath.name}")
            
            # Verificar se já tem updatedAt
            if 'updatedAt:' not in data_obj:
                # Procurar a última linha antes do fechamento
                lines = data_obj.split('\n')
                if len(lines) > 0:
                    # Adicionar updatedAt antes do fechamento
                    insert_pos = start + len(data_obj)
                    new_content = content[:insert_pos] + '\n        updatedAt: new Date(),' + content[insert_pos:]
                    content = new_content
                    modified = True
                    print(f"  ✓ Adicionado updatedAt em {model}.create() em {filepath.name}")
    
    return content, modified

def process_directory(directory):
    """Processa todos os arquivos TypeScript no diretório"""
    total_modified = 0
    
    for root, dirs, files in os.walk(directory):
        # Ignorar node_modules, __tests__, etc
        dirs[:] = [d for d in dirs if d not in ['node_modules', '__tests__', '.git', 'dist', 'build']]
        
        for file in files:
            if file.endswith('.ts') and not file.endswith('.test.ts') and not file.endswith('.d.ts'):
                filepath = Path(root) / file
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content, modified = fix_create_statements(content, filepath)
                    
                    if modified:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        total_modified += 1
                        print(f"✅ Modificado: {filepath}")
                        
                except Exception as e:
                    print(f"❌ Erro ao processar {filepath}: {e}")
    
    return total_modified

if __name__ == '__main__':
    src_dir = Path(__file__).parent / 'src'
    print(f"🔧 Processando diretório: {src_dir}")
    print("-" * 60)
    
    total = process_directory(src_dir)
    
    print("-" * 60)
    print(f"✨ Total de arquivos modificados: {total}")
