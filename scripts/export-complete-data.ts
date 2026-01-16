import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ExportedData {
  clients: any[];
  partners: any[];
  categories: any[];
  subcategories: any[];
  products: any[];
  branding: any;
  images: {
    products: Array<{
      productId: string;
      productName: string;
      imageUrl: string | null;
      imageData: string | null;
      imageContentType: string | null;
    }>;
    logos: Array<{
      type: "pdf" | "platform" | "login" | "favicon";
      url: string | null;
      description: string;
    }>;
  };
}

async function exportCompleteData() {
  try {
    console.log("🚀 Iniciando exportação de dados completos...\n");

    // 1. Exportar todos os clientes
    console.log("📋 Exportando clientes...");
    const clients = await prisma.client.findMany({
      include: {
        Quote: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    console.log(`✅ ${clients.length} clientes exportados\n`);

    // 2. Exportar todos os partners (agências, fornecedores)
    console.log("🤝 Exportando partners...");
    const partners = await prisma.partner.findMany({
      include: {
        Subrental: {
          select: {
            id: true,
            status: true,
          },
        },
        JobReference: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    console.log(`✅ ${partners.length} partners exportados\n`);

    // 3. Exportar categorias
    console.log("🏷️ Exportando categorias...");
    const categories = await prisma.category.findMany({
      include: {
        Subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`✅ ${categories.length} categorias exportadas\n`);

    // 4. Exportar subcategorias
    console.log("📂 Exportando subcategorias...");
    const subcategories = await prisma.subcategory.findMany({
      include: {
        Category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`✅ ${subcategories.length} subcategorias exportadas\n`);

    // 5. Exportar produtos (EquipmentItem) com imagens
    console.log("📦 Exportando produtos...");
    const products = await prisma.equipmentItem.findMany({
      include: {
        Category: {
          select: {
            id: true,
            name: true,
          },
        },
        Subcategory: {
          select: {
            id: true,
            name: true,
          },
        },
        Rental: {
          select: {
            id: true,
            eventId: true,
            quantityRented: true,
          },
        },
      },
    });

    console.log(`✅ ${products.length} produtos exportados\n`);

    // 6. Extrair imagens de produtos
    console.log("🖼️ Extraindo imagens dos produtos...");
    const productImages = products
      .filter((p) => p.imageUrl || p.imageData)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        imageUrl: p.imageUrl,
        imageData: p.imageData ? `[BASE64 DATA - ${p.imageData.length} chars]` : null,
        imageContentType: p.imageContentType,
      }));

    console.log(`✅ ${productImages.length} imagens de produtos encontradas\n`);

    // 7. Exportar configurações de branding
    console.log("🎨 Exportando configurações de branding...");
    const branding = await prisma.customization_settings.findFirst();

    const brandingData = branding
      ? {
          companyName: branding.companyName,
          companyTagline: branding.companyTagline,
          contactEmail: branding.contactEmail,
          contactPhone: branding.contactPhone,
          pdfBranding: {
            companyName: branding.pdfCompanyName,
            companyTagline: branding.pdfCompanyTagline,
            contactEmail: branding.pdfContactEmail,
            contactPhone: branding.pdfContactPhone,
            footerMessage: branding.pdfFooterMessage,
            footerContactText: branding.pdfFooterContactText,
            showFooterContact: branding.pdfShowFooterContact,
            useTextLogo: branding.pdfUseTextLogo,
            logoUrl: branding.pdfLogoUrl,
          },
          platformBranding: {
            logoUrl: branding.logoUrl,
            faviconUrl: branding.faviconUrl,
            useTextLogo: branding.useTextLogo,
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            accentColor: branding.accentColor,
            darkMode: branding.darkMode,
          },
          loginBranding: {
            logoUrl: branding.loginLogoUrl,
            logoSize: branding.loginLogoSize,
            welcomeMessage: branding.loginWelcomeMessage,
            welcomeSubtitle: branding.loginWelcomeSubtitle,
            footerText: branding.loginFooterText,
            backgroundType: branding.loginBackgroundType,
            backgroundColor1: branding.loginBackgroundColor1,
            backgroundColor2: branding.loginBackgroundColor2,
            backgroundImage: branding.loginBackgroundImage,
            showCompanyName: branding.loginShowCompanyName,
          },
        }
      : null;

    console.log("✅ Configurações de branding exportadas\n");

    // 8. Compilar logos
    console.log("🏛️ Compilando logos...");
    const logos = [];

    if (branding?.pdfLogoUrl) {
      logos.push({
        type: "pdf",
        url: branding.pdfLogoUrl,
        description: "Logo PDF para documentos",
      });
    }

    if (branding?.logoUrl) {
      logos.push({
        type: "platform",
        url: branding.logoUrl,
        description: "Logo da plataforma",
      });
    }

    if (branding?.loginLogoUrl) {
      logos.push({
        type: "login",
        url: branding.loginLogoUrl,
        description: "Logo página de login",
      });
    }

    if (branding?.faviconUrl) {
      logos.push({
        type: "favicon",
        url: branding.faviconUrl,
        description: "Favicon do site",
      });
    }

    console.log(`✅ ${logos.length} logos encontrados\n`);

    // 9. Compilar dados finais
    const exportedData: ExportedData = {
      clients,
      partners,
      categories,
      subcategories,
      products,
      branding: brandingData,
      images: {
        products: productImages,
        logos: logos as any,
      },
    };

    // 10. Salvar arquivos
    console.log("💾 Salvando arquivos...\n");

    const exportDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split("T")[0];

    // Salvar dados completos
    const completeFilePath = path.join(exportDir, `complete-data-${timestamp}.json`);
    fs.writeFileSync(completeFilePath, JSON.stringify(exportedData, null, 2));
    console.log(`✅ Dados completos: ${completeFilePath}`);

    // Salvar clientes
    const clientsFilePath = path.join(exportDir, `clients-${timestamp}.json`);
    fs.writeFileSync(clientsFilePath, JSON.stringify(clients, null, 2));
    console.log(`✅ Clientes: ${clientsFilePath}`);

    // Salvar partners
    const partnersFilePath = path.join(exportDir, `partners-${timestamp}.json`);
    fs.writeFileSync(partnersFilePath, JSON.stringify(partners, null, 2));
    console.log(`✅ Partners: ${partnersFilePath}`);

    // Salvar categorias
    const categoriesFilePath = path.join(exportDir, `categories-${timestamp}.json`);
    fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2));
    console.log(`✅ Categorias: ${categoriesFilePath}`);

    // Salvar subcategorias
    const subcategoriesFilePath = path.join(exportDir, `subcategories-${timestamp}.json`);
    fs.writeFileSync(subcategoriesFilePath, JSON.stringify(subcategories, null, 2));
    console.log(`✅ Subcategorias: ${subcategoriesFilePath}`);

    // Salvar produtos
    const productsFilePath = path.join(exportDir, `products-${timestamp}.json`);
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
    console.log(`✅ Produtos: ${productsFilePath}`);

    // Salvar branding
    const brandingFilePath = path.join(exportDir, `branding-${timestamp}.json`);
    fs.writeFileSync(brandingFilePath, JSON.stringify(brandingData, null, 2));
    console.log(`✅ Branding: ${brandingFilePath}`);

    // Salvar informações de imagens
    const imagesFilePath = path.join(exportDir, `images-info-${timestamp}.json`);
    fs.writeFileSync(imagesFilePath, JSON.stringify(exportedData.images, null, 2));
    console.log(`✅ Informações de imagens: ${imagesFilePath}`);

    // Criar relatório de exportação
    const reportPath = path.join(exportDir, `export-report-${timestamp}.txt`);
    const report = `
╔════════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE EXPORTAÇÃO                      ║
╚════════════════════════════════════════════════════════════════╝

📅 Data da Exportação: ${new Date().toLocaleString("pt-BR")}

📊 RESUMO DE DADOS:
─────────────────────────────────────────────────────────────────
✓ Clientes:          ${clients.length}
✓ Partners:          ${partners.length}
✓ Categorias:        ${categories.length}
✓ Subcategorias:     ${subcategories.length}
✓ Produtos:          ${products.length}
✓ Imagens Produtos:  ${productImages.length}
✓ Logos:             ${logos.length}

🎨 BRANDING EXPORTADO:
─────────────────────────────────────────────────────────────────
${
  branding
    ? `
✓ Nome da Empresa: ${branding.companyName || "N/A"}
✓ Tagline: ${branding.companyTagline || "N/A"}
✓ Email: ${branding.contactEmail || "N/A"}
✓ Telefone: ${branding.contactPhone || "N/A"}

PDF Branding:
  - Logo: ${branding.pdfLogoUrl ? "✓ Configurado" : "✗ Não configurado"}
  - Nome: ${branding.pdfCompanyName || "N/A"}
  - Tagline: ${branding.pdfCompanyTagline || "N/A"}

Platform Branding:
  - Logo: ${branding.logoUrl ? "✓ Configurado" : "✗ Não configurado"}
  - Favicon: ${branding.faviconUrl ? "✓ Configurado" : "✗ Não configurado"}
  - Cor Primária: ${branding.primaryColor || "N/A"}
  - Cor Secundária: ${branding.secondaryColor || "N/A"}

Login Branding:
  - Logo: ${branding.loginLogoUrl ? "✓ Configurado" : "✗ Não configurado"}
  - Mensagem: ${branding.loginWelcomeMessage || "N/A"}
`
    : "✗ Nenhuma configuração de branding encontrada"
}

📁 ARQUIVOS GERADOS:
─────────────────────────────────────────────────────────────────
📄 complete-data-${timestamp}.json
   └─ Dados completos em um único arquivo

📄 clients-${timestamp}.json
   └─ Lista de todos os clientes

📄 partners-${timestamp}.json
   └─ Lista de todos os partners e agências

📄 categories-${timestamp}.json
   └─ Categorias com subcategorias

📄 subcategories-${timestamp}.json
   └─ Subcategorias detalhadas

📄 products-${timestamp}.json
   └─ Produtos com imagens e informações

📄 branding-${timestamp}.json
   └─ Configurações de branding e logos

📄 images-info-${timestamp}.json
   └─ Informações sobre imagens de produtos e logos

🖼️ IMAGENS EXPORTADAS:
─────────────────────────────────────────────────────────────────
Produtos com Imagens:
${productImages
  .slice(0, 10)
  .map(
    (img) => `
  • ${img.productName}
    └─ ID: ${img.productId}
    └─ URL: ${img.imageUrl || "N/A"}
    └─ Tipo: ${img.imageContentType || "N/A"}
    └─ Dados Base64: ${img.imageData ? "✓ Sim" : "✗ Não"}
`
  )
  .join("")}
${productImages.length > 10 ? `  ... e mais ${productImages.length - 10} produtos` : ""}

Logos:
${logos
  .map(
    (logo) => `
  • ${logo.description}
    └─ Tipo: ${logo.type}
    └─ URL: ${logo.url || "N/A"}
`
  )
  .join("")}

═══════════════════════════════════════════════════════════════════

Exportação concluída com sucesso! 🎉

Todos os arquivos foram salvos em: ${exportDir}
    `;

    fs.writeFileSync(reportPath, report);
    console.log(`\n✅ Relatório: ${reportPath}\n`);

    // Imprimir resumo
    console.log(report);

    // Se há imagens base64, criar arquivo separado
    const productsWithBase64 = productImages.filter((p) => p.imageData);
    if (productsWithBase64.length > 0) {
      const base64FilePath = path.join(exportDir, `product-images-base64-${timestamp}.json`);
      const base64Data = await prisma.equipmentItem.findMany({
        where: {
          imageData: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          imageData: true,
          imageContentType: true,
        },
      });
      fs.writeFileSync(base64FilePath, JSON.stringify(base64Data, null, 2));
      console.log(`✅ Imagens Base64: ${base64FilePath}`);
    }

    console.log("\n🎉 Exportação concluída com sucesso!\n");
  } catch (error) {
    console.error("❌ Erro durante a exportação:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar exportação
exportCompleteData().catch((err) => {
  console.error(err);
  process.exit(1);
});
