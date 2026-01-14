import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function importSeedingData() {
  try {
    console.log("🚀 Iniciando importação de dados de seeding...\n");

    const seedingDataDir = path.join(process.cwd(), "seeding/data");

    // 1. Importar partners
    console.log("🤝 Importando partners...");
    const partnersData = JSON.parse(
      fs.readFileSync(path.join(seedingDataDir, "partners.json"), "utf-8")
    );

    for (const partner of partnersData) {
      const existing = await prisma.partner.findUnique({
        where: { id: partner.id },
      });

      if (!existing) {
        await prisma.partner.create({
          data: {
            id: partner.id,
            name: partner.name,
            companyName: partner.companyName,
            email: partner.email,
            phone: partner.phone,
            address: partner.address,
            website: partner.website,
            notes: partner.notes,
            partnerType: partner.partnerType || "provider",
            commission: partner.commission,
            isActive: partner.isActive !== false,
            logoUrl: partner.logoUrl || "",
          },
        });
        console.log(`  ✅ Partner criado: ${partner.name}`);
      } else {
        console.log(`  ℹ️ Partner já existe: ${partner.name}`);
      }
    }

    // 2. Importar clientes
    console.log("\n📋 Importando clientes...");
    const clientsData = JSON.parse(
      fs.readFileSync(path.join(seedingDataDir, "clients.json"), "utf-8")
    );

    for (const client of clientsData) {
      const existing = await prisma.client.findUnique({
        where: { id: client.id },
      });

      if (!existing) {
        await prisma.client.create({
          data: {
            id: client.id,
            name: client.name,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            address: client.address,
            notes: client.notes,
            taxId: client.taxId,
            partnerId: client.partnerId || undefined,
          },
        });
        console.log(`  ✅ Cliente criado: ${client.name}`);
      } else {
        console.log(`  ℹ️ Cliente já existe: ${client.name}`);
      }
    }

    // 3. Importar categorias
    console.log("\n🏷️ Importando categorias...");
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(seedingDataDir, "categories.json"), "utf-8")
    );

    for (const category of categoriesData) {
      const existing = await prisma.category.findUnique({
        where: { id: category.id },
      });

      if (!existing) {
        await prisma.category.create({
          data: {
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
          },
        });
        console.log(`  ✅ Categoria criada: ${category.name}`);
      } else {
        console.log(`  ℹ️ Categoria já existe: ${category.name}`);
      }
    }

    // 4. Importar subcategorias
    console.log("\n📂 Importando subcategorias...");
    const subcategoriesData = JSON.parse(
      fs.readFileSync(path.join(seedingDataDir, "subcategories.json"), "utf-8")
    );

    for (const subcategory of subcategoriesData) {
      const existing = await prisma.subcategory.findUnique({
        where: { id: subcategory.id },
      });

      if (!existing) {
        await prisma.subcategory.create({
          data: {
            id: subcategory.id,
            name: subcategory.name,
            parentId: subcategory.parentId,
          },
        });
        console.log(`  ✅ Subcategoria criada: ${subcategory.name}`);
      } else {
        console.log(`  ℹ️ Subcategoria já existe: ${subcategory.name}`);
      }
    }

    // 5. Importar customization
    console.log("\n🎨 Importando customização...");
    const customizationData = JSON.parse(
      fs.readFileSync(path.join(seedingDataDir, "customization.json"), "utf-8")
    );

    const existingCustomization = await prisma.customizationSettings.findFirst();

    if (!existingCustomization && customizationData) {
      await prisma.customizationSettings.create({
        data: customizationData,
      });
      console.log(`  ✅ Customização criada`);
    } else if (existingCustomization) {
      console.log(`  ℹ️ Customização já existe`);
    }

    // 6. Importar produtos
    console.log("\n📦 Importando produtos...");
    const productsData = JSON.parse(
      fs.readFileSync(path.join(seedingDataDir, "products.json"), "utf-8")
    );

    for (const product of productsData) {
      const existing = await prisma.equipmentItem.findUnique({
        where: { id: product.id },
      });

      if (!existing) {
        await prisma.equipmentItem.create({
          data: {
            id: product.id,
            name: product.name,
            description: product.description,
            descriptionPt: product.descriptionPt,
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
            quantity: product.quantity,
            status: product.status || "good",
            quantityByStatus: product.quantityByStatus || {
              good: product.quantity || 0,
              damaged: 0,
              maintenance: 0,
            },
            location: product.location || "Warehouse",
            imageUrl: product.imageUrl,
            imageData: product.imageData,
            imageContentType: product.imageContentType,
            dailyRate: product.dailyRate || 0,
            type: product.type || "Equipment",
          },
        });
        console.log(`  ✅ Produto criado: ${product.name}`);
      } else {
        console.log(`  ℹ️ Produto já existe: ${product.name}`);
      }
    }

    console.log("\n✅ Importação concluída com sucesso!\n");

    // Executar exportação
    console.log("📊 Gerando relatório de dados...\n");
    const clients = await prisma.client.findMany();
    const partners = await prisma.partner.findMany();
    const categories = await prisma.category.findMany();
    const products = await prisma.equipmentItem.findMany();

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                 DADOS IMPORTADOS COM SUCESSO                   ║
╚════════════════════════════════════════════════════════════════╝

📊 RESUMO:
─────────────────────────────────────────────────────────────────
✓ Clientes:      ${clients.length}
✓ Partners:      ${partners.length}
✓ Categorias:    ${categories.length}
✓ Produtos:      ${products.length}

═══════════════════════════════════════════════════════════════════
    `);
  } catch (error) {
    console.error("❌ Erro durante a importação:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar importação
importSeedingData().catch((err) => {
  console.error(err);
  process.exit(1);
});
