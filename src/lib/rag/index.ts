// RAG Pipeline - Semantic search using pgvector
// Uses cosine similarity for vector search + Prisma for keyword filtering

import { prisma } from "@/lib/db/prisma";
import { google } from "@ai-sdk/google";
import { embed } from "ai";

// Generate embedding for a query string
async function getQueryEmbedding(query: string): Promise<number[]> {
    const { embedding } = await embed({
        model: google.textEmbeddingModel("text-embedding-004"),
        value: query,
    });
    return embedding;
}

export interface SemanticSearchOptions {
    query: string;
    limit?: number;
    similarityThreshold?: number;
    categorySlug?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
}

export interface SemanticSearchResult {
    productId: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    brand: string;
    material: string | null;
    gender: string;
    category: string;
    images: string[];
    similarity: number;
}

export async function semanticSearch(
    options: SemanticSearchOptions
): Promise<SemanticSearchResult[]> {
    const {
        query,
        limit = 6,
        similarityThreshold = 0.3,
        categorySlug,
        gender,
        minPrice,
        maxPrice,
    } = options;

    try {
        // 1. Generate query embedding
        const queryEmbedding = await getQueryEmbedding(query);
        const embeddingStr = `[${queryEmbedding.join(",")}]`;

        // 2. Build additional WHERE conditions
        const conditions: string[] = ["p.\"isActive\" = true"];
        const params: unknown[] = [embeddingStr, similarityThreshold, limit];
        let paramIndex = 4;

        if (categorySlug) {
            conditions.push(`(c.slug = $${paramIndex} OR pc.slug = $${paramIndex})`);
            params.push(categorySlug);
            paramIndex++;
        }
        if (gender) {
            conditions.push(`p.gender = $${paramIndex}::"Gender"`);
            params.push(gender);
            paramIndex++;
        }
        if (minPrice) {
            conditions.push(`p.price >= $${paramIndex}`);
            params.push(minPrice);
            paramIndex++;
        }
        if (maxPrice) {
            conditions.push(`p.price <= $${paramIndex}`);
            params.push(maxPrice);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

        // 3. Execute vector similarity search
        const results = await prisma.$queryRawUnsafe<SemanticSearchResult[]>(
            `SELECT
        p.id as "productId",
        p.name,
        p.slug,
        p.description,
        p.price::float as price,
        p."compareAtPrice"::float as "compareAtPrice",
        p.brand,
        p.material,
        p.gender,
        c.name as category,
        p.images,
        1 - (pe.embedding <=> $1::vector) as similarity
      FROM product_embeddings pe
      JOIN products p ON pe."productId" = p.id
      JOIN categories c ON p."categoryId" = c.id
      LEFT JOIN categories pc ON c."parentId" = pc.id
      WHERE 1 - (pe.embedding <=> $1::vector) > $2
        ${whereClause}
      ORDER BY similarity DESC
      LIMIT $3`,
            ...params
        );

        return results;
    } catch (error) {
        console.error("Semantic search failed, falling back to keyword search:", error);
        // Fallback: return empty array, let the tool layer handle keyword search
        return [];
    }
}
