# 📏 WAREHOUSE LABEL SPECIFICATIONS
## AV Rentals - Real-World Equipment Labeling Standards

**Updated:** 16 January 2026  
**Status:** ✅ PRODUCTION READY  
**Compliance:** EN ISO 3098-2 (Labeling for Logistics)

---

## TEMPLATE SPECIFICATIONS

### 1. CABLE TAG (Envolvente)

**Physical Dimensions:** 25mm × 75mm (or 20mm × 60mm)  
**Screen Display:** 95px × 284px @ 96 DPI  
**Layout:** Vertical / Landscape  
**Material:** Adhesive thermal label, 80gsm  

#### Design Objective
Wrappable label that folds around cable and seals on itself, protecting the print from handling, moisture, and light.

#### Content Structure
```
┌─────────────────────┐
│   ID/SKU (top)      │  [6px font]
│                     │
│                     │
│    [QR CODE]        │  [80px, Level H]
│    [Large 50%)      │
│                     │
│  Item Name (foot)   │  [6px font]
└─────────────────────┘
```

#### Use Cases
- **XLR Cables** (3m, 5m, 10m lengths)
- **PowerCon connectors**
- **HDMI/DVI adapters**
- **Network cables**
- **Patch cables**

#### Printing Notes
- ✅ Horizontal orientation (landscape wrap)
- ✅ Minimal design = maximum legibility
- ✅ High-contrast QR (Level H) for scanning through plastic
- ⚠️ No logos (reduces legibility on narrow tape)
- ⚠️ Avoid metallic inks (thermal printer incompatible)

---

### 2. SMALL CASE (Equipamento Médio)

**Physical Dimensions:** 50mm × 30mm (landscape)  
**Screen Display:** 189px × 114px @ 96 DPI  
**Layout:** Horizontal (side-by-side logo + content)  
**Material:** Thermal adhesive label, 80gsm  

#### Design Objective
Compact label for small flat surfaces where a tall label cannot fit without curling or peeling. Optimized for **mailbox/case** applications.

#### Content Structure
```
┌──────────────────────────────┐
│ Logo  │ Item Name             │
│ [h4]  │ [xs font, bold]      │
│       │ [QR 90px, Level L]   │
└──────────────────────────────┘
```

#### Use Cases
- **Microphone cases** (Shure SM7B, Neumann U87)
- **Tripod bases** (K&M, Manfrotto)
- **Projector cases** (small, portable)
- **Converter boxes** (HDMI→SDI, Dante interfaces)
- **Wireless receiver cases**
- **XLR adapter boxes**

#### Printing Notes
- ✅ Landscape orientation
- ✅ Logo on left (company branding)
- ✅ Item name + QR on right (scanning zone)
- ⚠️ Keep item name to max 15 characters
- ⚠️ Test logo scaling (should fit in 16px height)

---

### 3. FLIGHTCASE / RACK (Standard Logistics)

**Physical Dimensions:** 100mm × 75mm (landscape)  
**Screen Display:** 378px × 284px @ 96 DPI  
**Layout:** Vertical sections (top: branding, middle: name, bottom: QR)  
**Material:** Professional adhesive label, 120gsm (reinforced)  

#### Design Objective
Universal logistics label visible at distance in dark warehouses, on trucks, or stacked pallets. This is the **international standard** for equipment labeling in rental/tour operations.

#### Content Structure
```
┌────────────────────────────┐
│       [Logo]               │  [h6]
│   AV RENTALS               │  [xs font]
├────────────────────────────┤
│                            │
│   MOVING HEAD 575W         │  [lg font, bold]
│   (Large + centered)       │  [Main content area]
│                            │
├────────────────────────────┤
│      [QR Code]             │  [120px, Level M]
│      [Large 75% height]    │
└────────────────────────────┘
```

#### Use Cases
- **Flightcases** (LED moving heads, laser projectors, mixer racks)
- **Road cases** (amplifier stacks, speaker columns)
- **Rack-mount cases** (consoles, cross-overs, amplifiers)
- **Line array components** (CA speakers, subs)
- **Shipping containers** (temporary, field-based logistics)

#### Printing Notes
- ✅ High visibility at distance (text: 18pt+, QR: 120px)
- ✅ Full company branding (logo + name)
- ✅ Large item name (scanning visible from 2-3m away)
- ✅ Medium-level QR (Level M = 30% error correction)
- ⚠️ Use reinforced thermal labels (travel stress)
- ⚠️ Test padding/margins on thermal printer (avoid cuts)

---

### 4. SHIPPING / PALLET (A6 Logistics)

**Physical Dimensions:** 105mm × 148mm (A6 portrait)  
**Screen Display:** 397px × 559px @ 96 DPI  
**Layout:** Vertical (stacked sections)  
**Material:** Premium adhesive label, 150gsm (durable bond)  

#### Design Objective
Maximum branding + identification for external shipments. Used when equipment departs venue and travels to another location (tours, festivals, remote shows). Provides **"at a glance" ownership + destination verification**.

#### Content Structure
```
┌──────────────────────────┐
│                          │
│      [Logo - Large]      │  [h8]
│                          │
│  AV RENTALS              │  [sm font]
│                          │
│  MOVING HEAD 575W        │  [base font, bold]
│  MOVING HEAD 575W        │  (Item name - prominent)
│  MOVING HEAD 575W        │
│                          │
│  ID: MOV-575-041         │  [xs font]
│                          │
│  ┌────────────────────┐  │
│  │   [QR CODE]        │  │  [140px, Level H]
│  │   [140×140px]      │  │  (Largest + centered)
│  └────────────────────┘  │
│                          │
└──────────────────────────┘
```

#### Use Cases
- **Festival shipments** (AES, SXSW, Glastonbury)
- **International tour flights** (EU to US, etc.)
- **Rental fleet redistribution** (warehouse to venue)
- **External storage returns** (from tour bus/truck)
- **High-value equipment cases** (laser projectors, LED walls)
- **Insurance tracking** (documented departure/arrival)

#### Printing Notes
- ✅ Maximum branding (full logo, company name)
- ✅ Large, clear inventory ID (for receiving teams)
- ✅ High-level QR (Level H = 30% error correction, survives water/wear)
- ✅ Portrait orientation (matches postal/logistics standards)
- ✅ 1cm margin from edges (thermal printer safety)
- ⚠️ Use professional-grade thermal stock (150gsm minimum)
- ⚠️ Include "Fragile" / "Handle with Care" if needed
- ⚠️ Test readability in low light (warehouse fluorescent)

---

## TECHNICAL SPECIFICATIONS

### Color Requirements

#### Print-Safe Mode (Automatic)
All templates apply `@media print` CSS rules:
```css
@media print {
  background-color: #FFFFFF !important;
  color: #000000 !important;
  border-color: #000000 !important;
}
```

**Result:** Dark mode system → prints as pure black text on white (regardless of theme)

### QR Code Levels

| Template | Level | Correction | Use Case |
|----------|-------|-----------|----------|
| Cable | H | 30% | Wrapped, handled (needs durability) |
| Small Case | L | 7% | Clean, protected environment |
| Flightcase | M | 15% | Standard warehouse use |
| Shipping | H | 30% | External travel, high stress |

### Font Sizing Reference

| Element | Cable | Small Case | Flightcase | Shipping |
|---------|-------|-----------|-----------|----------|
| Company Name | — | — | 10px | 14px |
| Item Name | 6px | 12px | 18px | 16px |
| ID/SKU | 6px | — | — | 12px |
| QR Code | 80px | 90px | 120px | 140px |

### Dimension Conversion Table

```
Measurement Standard:
1 inch = 25.4mm
1mm @ 96 DPI = 3.78 px

Cable Tag:    25×75mm  =   95×284px
Small Case:   50×30mm  =  189×114px
Flightcase:  100×75mm  =  378×284px
Shipping:   105×148mm  =  397×559px
```

---

## WAREHOUSE WORKFLOW INTEGRATION

### Scenario 1: New Equipment Intake

```
1. Equipment arrives at warehouse
2. Unbox and inspect
3. Create inventory record (SKU auto-assigned)
4. Select label template based on equipment type:
   └─ Cable → CABLE TAG
   └─ Microphone case → SMALL CASE
   └─ Flightcase → FLIGHTCASE
   └─ Tour shipment → SHIPPING
5. Batch print (PDF recommended)
6. Apply label to physical item
7. Scan QR code to verify check-in
```

### Scenario 2: Multi-Location Tour

```
Day 1: Equipment loaded at AV Rentals
  └─ Print SHIPPING label (A6, large QR)
  └─ Attach to external crate
  
Day 2-30: Equipment in field (venue, tour bus)
  └─ Technician scans QR for quick lookup
  └─ FLIGHTCASE label visible for inventory counts
  └─ CABLE TAGS protect cable identification
  
Day 31: Equipment returns to warehouse
  └─ SHIPPING label provides proof of return
  └─ Scan QR to update location in system
```

### Scenario 3: High-Volume Cable Management

```
Intake: 200 XLR cables received
  └─ Generate CABLE TAG batch (200 labels)
  └─ PDF printing 40 labels/page (A4)
  └─ 5 pages total
  
Application: Technician applies wrap-around tags
  └─ Fold 25×75mm label length-wise
  └─ Wrap around cable end (5cm from connector)
  └─ Seal overlapping edge
  └─ QR exposed for scanning
  
Result: Protected label, scannable even when coiled
```

---

## QUALITY ASSURANCE

### Pre-Production Testing

- [ ] Test QR code scannability in **dark warehouse** (low light)
- [ ] Test printing on **thermal printer** (Zebra, Brother TZe)
- [ ] Test adhesive bond on **cable wrap** (pull test)
- [ ] Test adhesive bond on **plastic cases** (climatic test)
- [ ] Test fading in **UV sunlight** (30-day sun exposure)
- [ ] Verify **font rendering** on thermal output (crisp, not blurry)
- [ ] Verify **logo clarity** at target size
- [ ] Test **moisture resistance** (spray test, 5 minutes)

### Field Validation

After production deployment, sample at least:
- 10% of CABLE TAGs (physical wrap test)
- 5% of SMALL CASE labels (adhesion over time)
- 2% of FLIGHTCASE labels (warehouse visibility)
- 1% of SHIPPING labels (damage resistance)

---

## CHANGELOG

### v1.0 (16 January 2026)
- ✅ Cable Tag: 25×75mm (wrap-around design)
- ✅ Small Case: 50×30mm (landscape, logo-left)
- ✅ Flightcase: 100×75mm (standard logistics)
- ✅ Shipping: 105×148mm A6 (maximum branding)
- ✅ All templates: Print-safe mode, auto dark-mode handling
- ✅ Admin branding integration (logo from PDF Branding)
- ✅ QR code level optimization per template

---

## REFERENCE IMAGES

### Real-World Examples

**Cable Tag Application:**
```
XLR Cable (3m) with wrap-around tag
┌─────────────────────────────────┐
│  ID: XLR-041                    │
│        [QR]                     │
│  XLR-041                        │
└─────────────────────────────────┘
(Wraps 360° around cable near one end)
```

**Small Case Label:**
```
Microphone Case (Shure SM7B)
┌────────────────────────────────┐
│ [LOGO] │ Shure SM7B            │
│ [h4]   │ [QR 90px]             │
└────────────────────────────────┘
```

**Flightcase Label:**
```
LED Moving Head Transport Case
┌─────────────────────────────┐
│       [AV RENTALS LOGO]     │
│      AV RENTALS             │
├─────────────────────────────┤
│   MOVING HEAD 575W          │
│   (Large, centered)         │
├─────────────────────────────┤
│      [QR 120px]             │
│      [Centered]             │
└─────────────────────────────┘
```

**Shipping Label (A6):**
```
Festival Shipment - Full Branding
┌─────────────────────────┐
│     [LARGE LOGO]        │
│   AV RENTALS - LISBON   │
│                         │
│  MOVING HEAD 575W       │
│  MOVING HEAD 575W       │
│  MOVING HEAD 575W       │
│                         │
│  ID: MOV-575-041        │
│  ┌───────────────────┐  │
│  │  [QR 140×140px]   │  │
│  │  [LARGE CENTER]   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

---

**Document:** WAREHOUSE_LABEL_SPECS.md  
**Version:** 1.0  
**Last Updated:** 16 January 2026  
**Maintainer:** Senior Fullstack Developer & Logistics Expert
