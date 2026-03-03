import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import {
  PARENT_CATEGORIES,
  CATEGORIES,
  BRANDS,
  COLORS,
  SIZES_MAP,
  MATERIALS,
  PRODUCT_TEMPLATES,
  PRICE_RANGES,
  POLICIES,
} from "./seed-data.js";
// Khởi tạo adapter để nối Database URL trước khi gọi PrismaClient
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPrice(min: number, max: number): number {
  const step = 10000;
  const steps = Math.floor((max - min) / step);
  return min + Math.floor(Math.random() * steps) * step;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

let skuCounter = 0;
function generateSKU(catSlug: string, index: number, size: string, color: string): string {
  skuCounter++;
  const prefix = catSlug.substring(0, 3).toUpperCase();
  const colorCode = color.substring(0, 2).toUpperCase();
  return `${prefix}-${String(skuCounter).padStart(5, "0")}-${size}-${colorCode}`;
}

function generateDescription(
  name: string,
  brand: string,
  material: string,
  category: string,
): string {
  const descriptions: Record<string, string> = {
    ao: `${name} từ thương hiệu ${brand}, chất liệu ${material} cao cấp. Thiết kế hiện đại, phù hợp mặc đi làm và dạo phố. Form dáng thoải mái, dễ phối đồ với nhiều kiểu quần khác nhau.`,
    quan: `${name} từ ${brand}, chất liệu ${material} mềm mại thoáng mát. Đường may tỉ mỉ, form dáng chuẩn Á Đông. Phù hợp đi làm, đi chơi và nhiều dịp khác nhau.`,
    "vay-dam": `${name} từ BST mới nhất của ${brand}. Chất liệu ${material} cao cấp, tôn dáng người mặc. Thiết kế thanh lịch, nữ tính, phù hợp nhiều dịp từ công sở đến dự tiệc.`,
    "phu-kien": `${name} chính hãng ${brand}. Chất liệu ${material} bền đẹp. Thiết kế tinh tế, phù hợp phối với nhiều phong cách thời trang khác nhau.`,
    "giay-dep": `${name} từ ${brand}. Chất liệu ${material}, đế cao su chống trượt. Thiết kế thời trang, êm ái khi di chuyển, phù hợp sử dụng hàng ngày.`,
  };
  return (
    descriptions[category] ||
    `${name} ${brand} - ${material}. Sản phẩm chất lượng cao.`
  );
}

async function main() {
  console.log("🌱 Starting seed...\n");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.$executeRawUnsafe(`DELETE FROM product_embeddings`);
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.policy.deleteMany();

  // 1. Create parent categories
  console.log("📁 Creating categories...");
  const parentCatMap: Record<string, string> = {};
  for (const pc of PARENT_CATEGORIES) {
    const cat = await prisma.category.create({
      data: { name: pc.name, slug: pc.slug },
    });
    parentCatMap[pc.slug] = cat.id;
  }

  // 2. Create sub-categories
  const subCatMap: Record<
    string,
    { id: string; parent: string; gender: string }
  > = {};
  for (const sc of CATEGORIES) {
    const cat = await prisma.category.create({
      data: {
        name: sc.name,
        slug: sc.slug,
        parentId: parentCatMap[sc.parent],
      },
    });
    subCatMap[sc.slug] = { id: cat.id, parent: sc.parent, gender: sc.gender };
  }
  console.log(
    `   ✅ ${PARENT_CATEGORIES.length} parent + ${CATEGORIES.length} sub categories\n`,
  );

  // 3. Create products with variants
  console.log("👕 Creating products...");
  let productCount = 0;
  let variantCount = 0;

  for (const [catSlug, templates] of Object.entries(PRODUCT_TEMPLATES)) {
    const catInfo = subCatMap[catSlug];
    if (!catInfo) continue;

    const parentSlug = catInfo.parent;
    const [minPrice, maxPrice] = PRICE_RANGES[parentSlug] || [200000, 1000000];
    const sizes = SIZES_MAP[parentSlug] || ["M"];
    const materials = MATERIALS[catSlug] || ["Polyester"];

    for (let i = 0; i < templates.length; i++) {
      const name = templates[i];
      const brand = randomItem(BRANDS);
      const material = randomItem(materials);
      const price = randomPrice(minPrice, maxPrice);
      const hasDiscount = Math.random() > 0.7;
      const compareAtPrice = hasDiscount
        ? price + randomPrice(50000, 200000)
        : null;

      // Pick 2-3 random colors for this product
      const numColors = 2 + Math.floor(Math.random() * 2);
      const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
      const productColors = shuffledColors.slice(0, numColors);

      // Pick 3-4 random sizes
      const numSizes = Math.min(
        sizes.length,
        3 + Math.floor(Math.random() * 2),
      );
      const shuffledSizes = [...sizes].sort(() => Math.random() - 0.5);
      const productSizes = shuffledSizes.slice(0, numSizes);

      const slug =
        slugify(name) + `-${brand.toLowerCase().replace(/\s/g, "")}-${i}`;

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description: generateDescription(name, brand, material, parentSlug),
          price,
          compareAtPrice,
          categoryId: catInfo.id,
          brand,
          material,
          careInstructions:
            "Giặt máy ở nhiệt độ thường. Không sử dụng chất tẩy. Phơi trong bóng râm.",
          images: [
            `/images/products/${slug}-1.jpg`,
            `/images/products/${slug}-2.jpg`,
          ],
          tags: [
            catSlug,
            brand.toLowerCase(),
            material.toLowerCase().split(" ")[0],
          ],
          gender: catInfo.gender as "MALE" | "FEMALE" | "UNISEX",
          isActive: true,
          variants: {
            create: productColors.flatMap((color) =>
              productSizes.map((size) => ({
                size,
                color: color.name,
                colorHex: color.hex,
                sku: generateSKU(
                  catSlug,
                  productCount * 10 + i,
                  size,
                  color.name,
                ),
                stockQuantity: Math.floor(Math.random() * 20) + 1,
                isAvailable: Math.random() > 0.1,
              })),
            ),
          },
        },
        include: { variants: true },
      });

      variantCount += product.variants.length;
      productCount++;
    }
    console.log(`   ✅ ${catSlug}: ${templates.length} products`);
  }
  console.log(
    `\n📊 Total: ${productCount} products, ${variantCount} variants\n`,
  );

  // 4. Create policies
  console.log("📋 Creating policies...");
  for (const policy of POLICIES) {
    await prisma.policy.create({
      data: {
        category: policy.category,
        title: policy.title,
        content: policy.content,
      },
    });
  }
  console.log(`   ✅ ${POLICIES.length} policies\n`);

  // 5. Create sample customer
  console.log("👤 Creating sample customer...");
  await prisma.customer.create({
    data: {
      name: "Nguyễn Văn Demo",
      email: "demo@fashionchatbot.vn",
      phone: "0901234567",
      address: "123 Nguyễn Huệ",
      city: "TP. Hồ Chí Minh",
      district: "Quận 1",
      ward: "Phường Bến Nghé",
    },
  });
  console.log("   ✅ 1 sample customer\n");

  console.log("🎉 Seed completed successfully!");
  console.log(`   📦 ${productCount} products`);
  console.log(`   🎨 ${variantCount} variants`);
  console.log(
    `   📁 ${PARENT_CATEGORIES.length + CATEGORIES.length} categories`,
  );
  console.log(`   📋 ${POLICIES.length} policies`);
  console.log(`   👤 1 customer`);
  console.log(
    "\n⚠️  Note: Product embeddings will be generated when you provide a GOOGLE_GENERATIVE_AI_API_KEY and run the embedding script separately.",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    prisma.$disconnect();
    process.exit(1);
  });
