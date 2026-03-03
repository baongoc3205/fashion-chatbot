import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const getProductDetailSchema = z.object({
    productId: z.string().optional().describe("ID sản phẩm"),
    slug: z.string().optional().describe("Slug sản phẩm"),
});

export type GetProductDetailInput = z.infer<typeof getProductDetailSchema>;

export async function getProductDetail(input: GetProductDetailInput) {
    const { productId, slug } = input;

    if (!productId && !slug) {
        return { error: "Cần cung cấp productId hoặc slug" };
    }

    const product = await prisma.product.findFirst({
        where: productId ? { id: productId } : { slug },
        include: {
            category: {
                select: {
                    name: true,
                    slug: true,
                    parent: { select: { name: true, slug: true } },
                },
            },
            variants: {
                orderBy: [{ color: "asc" }, { size: "asc" }],
                select: {
                    id: true,
                    size: true,
                    color: true,
                    colorHex: true,
                    sku: true,
                    stockQuantity: true,
                    isAvailable: true,
                },
            },
        },
    });

    if (!product) {
        return { error: "Không tìm thấy sản phẩm" };
    }

    // Group variants by color
    const colorGroups: Record<string, { color: string; colorHex: string | null; sizes: { size: string; stock: number; available: boolean; variantId: string }[] }> = {};
    for (const v of product.variants) {
        if (!colorGroups[v.color]) {
            colorGroups[v.color] = { color: v.color, colorHex: v.colorHex, sizes: [] };
        }
        colorGroups[v.color].sizes.push({
            size: v.size,
            stock: v.stockQuantity,
            available: v.isAvailable && v.stockQuantity > 0,
            variantId: v.id,
        });
    }

    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        discount: product.compareAtPrice
            ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)
            : null,
        brand: product.brand,
        material: product.material,
        careInstructions: product.careInstructions,
        gender: product.gender,
        category: product.category.name,
        parentCategory: product.category.parent?.name || null,
        images: product.images,
        tags: product.tags,
        colorOptions: Object.values(colorGroups),
        totalStock: product.variants.reduce((sum, v) => sum + v.stockQuantity, 0),
        isActive: product.isActive,
    };
}
