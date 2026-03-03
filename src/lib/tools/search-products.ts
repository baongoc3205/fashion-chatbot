import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

// Input schema for searchProducts tool
export const searchProductsSchema = z.object({
    query: z.string().describe("Từ khóa tìm kiếm sản phẩm (ví dụ: áo sơ mi trắng, quần jean nam)"),
    category: z.string().optional().describe("Slug danh mục (vd: ao-so-mi, quan-jean)"),
    brand: z.string().optional().describe("Tên thương hiệu (vd: Yody, Canifa)"),
    gender: z.enum(["MALE", "FEMALE", "UNISEX"]).optional().describe("Giới tính"),
    minPrice: z.number().optional().describe("Giá tối thiểu (VND)"),
    maxPrice: z.number().optional().describe("Giá tối đa (VND)"),
    limit: z.number().optional().default(6).describe("Số lượng kết quả trả về"),
});

export type SearchProductsInput = z.infer<typeof searchProductsSchema>;

export async function searchProducts(input: SearchProductsInput) {
    const { query, category, brand, gender, minPrice, maxPrice, limit } = input;

    // Build WHERE conditions using Prisma's typed input
    const conditions: Prisma.ProductWhereInput[] = [{ isActive: true }];

    // Keyword search in name and description
    if (query) {
        conditions.push({
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { brand: { contains: query, mode: "insensitive" } },
                { tags: { hasSome: query.toLowerCase().split(" ") } },
            ],
        });
    }

    // Filters
    if (category) {
        conditions.push({
            category: {
                OR: [{ slug: category }, { parent: { slug: category } }],
            },
        });
    }
    if (brand) conditions.push({ brand: { contains: brand, mode: "insensitive" } });
    if (gender) conditions.push({ gender });
    if (minPrice) conditions.push({ price: { gte: minPrice } });
    if (maxPrice) conditions.push({ price: { lte: maxPrice } });

    const products = await prisma.product.findMany({
        where: { AND: conditions },
        include: {
            category: { select: { name: true, slug: true } },
            variants: {
                where: { isAvailable: true },
                select: {
                    id: true,
                    size: true,
                    color: true,
                    colorHex: true,
                    stockQuantity: true,
                },
            },
            _count: { select: { variants: true } },
        },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
    });

    return {
        products: products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description.substring(0, 150) + "...",
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            brand: p.brand,
            material: p.material,
            gender: p.gender,
            category: p.category.name,
            categorySlug: p.category.slug,
            images: p.images,
            availableColors: [...new Set(p.variants.map((v) => v.color))],
            availableSizes: [...new Set(p.variants.map((v) => v.size))],
            totalVariants: p._count.variants,
            inStock: p.variants.length > 0,
        })),
        total: products.length,
        query,
    };
}
