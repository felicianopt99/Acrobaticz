export function renderCatalogHTML(partnerInfo: any, equipment: any[], t: any, branding: any) {
  const safePartner = partnerInfo?.name || 'Partner';
  const company = branding?.companyName || partnerInfo?.companyName || '';
  const logo = partnerInfo?.logoData || '';

  // Improved print CSS: flowing content, fixed header/footer, clear 3-column item layout
  const css = `
    @page { size: A4; margin: 20mm }
    html,body{margin:0;padding:0;font-family: Inter, Arial, Helvetica, sans-serif;color:#222}
    body{padding:0;background:white}
    header{position:fixed;left:20mm;right:20mm;top:8mm;display:flex;justify-content:space-between;align-items:flex-start}
    header .left{max-width:65%}
    .title{font-size:20px;font-weight:700;color:#15324a;margin:0}
    .subtitle{font-size:11px;color:#505f6b;margin-top:6px}
    header .right{text-align:right}
    header img.logo{max-width:140px;height:auto}

    main{display:block;margin:36mm 20mm 28mm 20mm}

    .category{font-size:14px;color:#23456a;font-weight:700;margin-top:8px;margin-bottom:6px}
    .subcategory{font-size:12px;color:#2b5a86;margin-left:6px;margin-top:6px;margin-bottom:4px}

    .items{display:flex;flex-direction:column;gap:6px}
    .item{display:grid;grid-template-columns:86px 1fr 90px;gap:10px;padding:8px;border-radius:6px;align-items:start}
    .item{background:transparent}
    .item-inner{page-break-inside:avoid;break-inside:avoid-column}
    .thumb img{width:86px;height:86px;object-fit:cover;border-radius:6px;border:1px solid #eee}
    .meta .name{font-size:12px;font-weight:700;color:#0f1720}
    .meta .desc{font-size:11px;color:#404b52;margin-top:6px;white-space:normal}
    .price{font-size:12px;font-weight:800;color:#1f7a2f;text-align:right}
    .qty{font-size:10px;color:#6b7280;text-align:right;margin-top:6px}

    footer{position:fixed;left:20mm;right:20mm;bottom:8mm;font-size:10px;color:#6b7280;display:flex;justify-content:space-between}

    /* Avoid breaking an item across pages */
    .item, .item * { page-break-inside: avoid; break-inside: avoid }

    /* Small screen adjustments when previewing in browser */
    @media screen {
      body { padding: 10px }
      header { position:static; margin-bottom:12px }
      footer { position:static; margin-top:12px }
    }
  `;

  function renderGroups(groups: Record<string, Record<string, any[]>>) {
    let html = '';
    for (const category of Object.keys(groups).sort()) {
      html += `<div class="category">${escapeHtml(category)}</div>`;
      for (const sub of Object.keys(groups[category]).sort()) {
        html += `<div class="subcategory">${escapeHtml(sub)}</div>`;
        html += `<div class="items">`;
        for (const item of groups[category][sub]) {
          const img = item.imageData || '';
          const price = item.dailyRate != null ? `€${Number(item.dailyRate).toFixed(2)}/day` : '';
          const qty = item.quantity != null ? `${t.quantity}: ${item.quantity}` : '';
          html += `
            <div class="item" role="article">
              <div class="item-inner">
                <div class="thumb">${img ? `<img src="${img}" alt="${escapeHtml(item.name||'')}">` : '<div style="width:86px;height:86px;background:#f5f7f9;border-radius:6px;border:1px solid #eee"></div>'}</div>
              </div>
              <div class="meta">
                <div class="name">${escapeHtml(item.name || '')}</div>
                <div class="desc">${escapeHtml(item.description || '')}</div>
              </div>
              <div class="price-col">
                <div class="price">${escapeHtml(price)}</div>
                <div class="qty">${escapeHtml(qty)}</div>
              </div>
            </div>
          `;
        }
        html += `</div>`;
      }
    }
    return html;
  }

  // Build grouped structure from equipment
  const grouped: Record<string, Record<string, any[]>> = {};
  for (const it of equipment) {
    const cat = it.category?.name || 'Other';
    const sub = it.subcategory?.name || 'General';
    if (!grouped[cat]) grouped[cat] = {};
    if (!grouped[cat][sub]) grouped[cat][sub] = [];
    grouped[cat][sub].push(it);
  }

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>${css}</style>
    </head>
    <body>
      <header>
        <div class="left">
          <h1 class="title">${escapeHtml(t.title)}</h1>
          <div class="subtitle">${escapeHtml(t.preparedFor)}: ${escapeHtml(safePartner)} ${company ? '- ' + escapeHtml(company) : ''}</div>
        </div>
        <div class="right">
          ${logo ? `<img class="logo" src="${logo}" alt="logo">` : ''}
          <div style="margin-top:6px;font-size:11px;color:#6b7280">${escapeHtml(branding?.companyTagline || '')}</div>
        </div>
      </header>
      <main>
        ${renderGroups(grouped)}
      </main>
      <footer>
        <div>${escapeHtml(t.inquiries)}</div>
        <div>${escapeHtml(new Date().toLocaleDateString())}</div>
      </footer>
    </body>
  </html>
  `;

  return html;
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' } as any)[c];
  });
}

function truncate(s: string, max: number) {
  if (!s) return '';
  if (s.length <= max) return s;
  return s.substring(0, max-3) + '...';
}
