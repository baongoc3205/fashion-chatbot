// Embedding generation script for fashion products
// Uses Google Gemini text-embedding-004 (768 dimensions)
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}' src/lib/rag/generate-embeddings.ts

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { google } from "@ai-sdk/google";
import { embedMany } from "ai";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Build text content from product data for embedding
function buildProductContent(product: {
    name: string;
    description: string;
    brand: string;
    material: string | null;
    tags: string[];
    price: unknown;
    category: { name: string; parent?: { name: string } | null };
    gender: string;
}): string {
    const parts = [
        product.name,
        product.brand,
        product.category.parent ? `${product.category.parent.name} > ${product.category.name}` : product.category.name,
        product.description,
        product.material ? `Chất liệu: ${product.material}` : "",
        `Giới tính: ${product.gender === "MALE" ? "Nam" : product.gender === "FEMALE" ? "Nữ" : "Unisex"}`,
        product.tags.length > 0 ? `Tags: ${product.tags.join(", ")}` : "",
        `Giá: ${Number(product.price).toLocaleString("vi-VN")} VND`,
    ];
    return parts.filter(Boolean).join("\n");
}

async function generateEmbeddings() {
    console.log("🔄 Generating product embeddings with Gemini text-embedding-004...\n");

    // Fetch all active products
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: {
            category: {
                select: {
                    name: true,
                    parent: { select: { name: true } },
                },
            },
        },
    });

    console.log(`📦 Found ${products.length} products\n`);

    // Prepare content for all products
    const contents = products.map((p) => buildProductContent(p));

    // Batch embed (Gemini supports batch embedding)
    const BATCH_SIZE = 50;
    let embeddedCount = 0;

    for (let i = 0; i < contents.length; i += BATCH_SIZE) {
        const batch = contents.slice(i, i + BATCH_SIZE);
        const batchProducts = products.slice(i, i + BATCH_SIZE);

        try {
            const { embeddings } = await embedMany({
                model: google.textEmbeddingModel("text-embedding-004"),
                values: batch,
            });

            // Store embeddings in database
            for (let j = 0; j < embeddings.length; j++) {
                const product = batchProducts[j];
                const embedding = embeddings[j];
                const content = batch[j];

                // Upsert: delete existing + insert new (because vector type is Unsupported in Prisma)
                await prisma.$executeRawUnsafe(
                    `DELETE FROM product_embeddings WHERE "productId" = $1`,
                    product.id
                );
                await prisma.$executeRawUnsafe(
                    `INSERT INTO product_embeddings (id, "productId", content, embedding, "createdAt")
           VALUES (gen_random_uuid(), $1, $2, $3::vector, NOW())`,
                    product.id,
                    content,
                    `[${embedding.join(",")}]`
                );

                embeddedCount++;
            }

            console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${embeddings.length} embeddings generated`);
        } catch (error) {
            console.error(`   ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
        }
    }

    console.log(`\n🎉 Done! ${embeddedCount}/${products.length} products embedded.`);
}

generateEmbeddings()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error("❌ Failed:", e);
        prisma.$disconnect();
        process.exit(1);
    });
