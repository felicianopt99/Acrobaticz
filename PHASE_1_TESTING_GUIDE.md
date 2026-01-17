# 🧪 FASE 1 - GUIA RÁPIDO DE TESTES

**Data:** 17 de Janeiro de 2026  
**Duração esperada:** 15-20 minutos por dispositivo

---

## ✅ CHECKLIST DE TESTES

### 1️⃣ DESKTOP (Chrome DevTools - Mobile Emulation)

#### iPhone SE (375x667)

**Settings Page (`/admin/settings`)**
```
[ ] TabsList não tem overflow horizontal
[ ] Tabs em 2 linhas (General + Security | Email + Backup)
[ ] Texto legível sem scroll
[ ] Espaçamento visual OK
```

**Customization Page (`/admin/customization`)**
```
[ ] 6 tabs distribuídos em 2 linhas
[ ] Texto truncado mas legível
[ ] TabsList não extravasa
[ ] Sem scroll horizontal
```

**Events Page (`/rentals`)**
```
[ ] Status tabs (All | Upcoming | Ongoing | Completed) em 2 linhas
[ ] Filtros abaixo ocupam espaço corretamente
[ ] Sem sobreposição
```

#### iPhone 14 Pro (390x844)
```
[ ] Mesmos testes acima
[ ] Notch handling OK
[ ] Safe area respeita
```

#### iPad (768x1024)
```
[ ] Tabs em 3 colunas (customization)
[ ] Grids em 2 colunas (responsive)
[ ] Espaçamento aumentado conforme esperado
[ ] Layout confortável
```

#### Desktop (1920x1080)
```
[ ] Tabs em uma linha completa
[ ] Grids expandem para 4 colunas
[ ] Não há quebras visuais
[ ] Desktop layout preservado
```

---

### 2️⃣ TOUCH TARGETS

#### Checkboxes
```
[ ] Tamanho: ~20x20px (maior que antes)
[ ] Fácil de tocar com polegar
[ ] Sem falsos positivos
[ ] Indicador visual ao selecionar
```

**Como testar (Chrome mobile):**
1. Ir para página com formulário
2. Tentar clicar em checkbox com dedo (ou mouse)
3. Verificar se área de toque é confortável

#### Dropdowns
```
[ ] Itens com altura ~40px
[ ] Espaço vertical entre itens
[ ] Fácil selecionar com dedo
[ ] Nenhum item truncado
```

**Como testar:**
1. Abrir qualquer dropdown/select
2. Verificar altura de cada item
3. Tentar tocar/clicar em diferentes itens

#### BottomNav
```
[ ] Botões bem separados (gap)
[ ] Nenhum botão se toca
[ ] Ícones + texto legível
[ ] Espaço de toque: min 40px
```

**Como testar:**
1. Ir para página mobile
2. Verificar BottomNav
3. Tentar tocar cada botão

---

### 3️⃣ RESPONSIVIDADE

#### Settings TabsList
```
MOBILE (< 640px):
[ ] 2 colunas: [General][Security]
                [Email][Backup]

TABLET (640px - 1024px):
[ ] 4 colunas: [General][Security][Email][Backup]

DESKTOP (> 1024px):
[ ] 4 colunas: [General][Security][Email][Backup]
```

#### Customization TabsList
```
MOBILE (< 640px):
[ ] 2 colunas: [Branding][Theme]
                [Login][Logos]
                [Terms][Advanced]

TABLET (640px - 1024px):
[ ] 3 colunas: [Branding][Theme][Login]
                [Logos][Terms][Advanced]

DESKTOP (> 1024px):
[ ] 6 colunas: [Branding][Theme][Login][Logos][Terms][Advanced]
```

#### Grids Responsivos
```
[ ] TranslationManager: 1 col mobile → 2 cols tablet
[ ] APIConfig: 1 col mobile → 2 cols tablet
[ ] EventList: filters ajustáveis
```

---

### 4️⃣ OVERFLOW CHECKS

**Settings Page:**
```
[ ] Sem scrollbar horizontal
[ ] Todas as tabs visíveis
[ ] Nenhum elemento cortado
```

**Customization Page:**
```
[ ] Sem scrollbar horizontal
[ ] Todos os 6 tabs acessíveis
[ ] Conteúdo das tabs OK
```

**TranslationManager:**
```
[ ] Cards em coluna única (mobile)
[ ] Expandem para 2 (tablet)
[ ] Sem overflow
```

**APIConfig:**
```
[ ] Grid responsivo
[ ] Sem corte de informações
```

---

### 5️⃣ ORIENTAÇÃO

#### Landscape Mode
```
iPhone SE Landscape (667x375):
[ ] Layout ajusta
[ ] Sem quebras
[ ] Legibilidade OK

iPad Landscape (1024x768):
[ ] Espaçamento adequado
[ ] Sem truncamento
```

---

### 6️⃣ VISUAL REGRESSION

Comparar com screenshots anteriores:

**TabsList antes/depois:**
```
ANTES: Overflow horizontal em mobile
DEPOIS: 2 linhas bem distribuídas
[ ] Visualmente melhor
[ ] Sem quebras óbvias
```

**Touch targets antes/depois:**
```
ANTES: Checkboxes 16x16px (pequenos)
DEPOIS: Checkboxes 20x20px (maiores)
[ ] Aumento visível
[ ] Proporção mantida
```

---

### 7️⃣ PERFORMANCE

```
Chrome DevTools Performance:
[ ] LCP < 2.5s (mobile)
[ ] CLS < 0.1 (no layout shift)
[ ] FID < 100ms (interaction)

Lighthouse Score:
[ ] Performance: > 80
[ ] Accessibility: > 85
```

---

### 8️⃣ BROWSER COMPATIBILITY

```
[ ] Chrome (latest) - ✅
[ ] Safari (latest) - ✅
[ ] Firefox (latest) - ✅
[ ] Edge (latest) - ✅
[ ] Samsung Internet - ✅
```

---

### 9️⃣ ACCESSIBILITY

```
[ ] Keyboard navigation ainda funciona
[ ] Tab order lógico
[ ] Focus ring visível
[ ] Screen reader: componentes identificáveis
```

**Teste com screen reader:**
```bash
# macOS VoiceOver
Cmd + F5 para ativar

# Windows Narrator
Win + Ctrl + N
```

---

## 📋 RESULTADO FINAL

### ✅ Tudo Passou

```
✓ Sem overflow horizontal
✓ Touch targets adequados
✓ Responsive breakpoints OK
✓ Layout preservado
✓ Performance mantida
✓ Sem quebras visuais
```

### ⚠️ Ajustes Necessários

Se encontrar problemas:

1. **Overflow ainda visível?**
   - Verificar breakpoint do Tailwind
   - Confirmar sm: = 640px em tailwind.config.ts

2. **Touch target muito pequeno?**
   - Aumentar: h-5 w-5 → h-6 w-6 se necessário
   - Testar em dispositivo real

3. **Layout quebrado em orientação?**
   - Adicionar media query:
   ```css
   @media (orientation: landscape) {
     /* ajustes */
   }
   ```

---

## 🔄 NEXT STEPS

- [ ] Testar em dispositivos reais
- [ ] Collect user feedback
- [ ] Document any edge cases
- [ ] Proceed to Phase 2 approval

---

## 📞 DÚVIDAS?

Se encontrar algo inesperado:

1. Documentar o comportamento
2. Capturar screenshot
3. Reportar no issue tracker
4. Tag: `phase1-testing`

---

**Good luck with testing! 🚀**
