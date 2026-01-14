import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function exportProducts() {
  try {
    console.log("Exportando produtos do banco de dados...");

    const products = await prisma.product.findMany({
      include: {
        category: true,
        subcategory: true,
      },
    });

    console.log(`Total de produtos encontrados: ${products.length}`);

    // Formatar os dados para o arquivo de seeding
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      descriptionPt: product.descriptionPt,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      subcategoryId: product.subcategoryId,
      subcategoryName: product.subcategory?.name,
      quantity: product.quantity,
      status: product.status,
      location: product.location,
      imageUrl: product.imageUrl,
      dailyRate: product.dailyRate,
      type: product.type,
    }));

    // Salvar no arquivo
    const outputPath = path.join(process.cwd(), "seeding/data/products.json");
    fs.writeFileSync(outputPath, JSON.stringify(formattedProducts, null, 2));

    console.log(`✅ Produtos exportados com sucesso para ${outputPath}`);
    console.log(`Total de produtos exportados: ${formattedProducts.length}`);
  } catch (error) {
    console.error("Erro ao exportar produtos:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

exportProducts();
