import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const checkStockSchema = z.object({
    productId: z.string().describe("ID sản phẩm cần kiểm tra"),
    size: z.string().optional().describe("Size cần kiểm tra (vd: M, L, 39)"),
    color: z.string().optional().describe("Màu sắc cần kiểm tra (vd: Trắng, Đen)"),
});

export type CheckStockInput = z.infer<typeof checkStockSchema>;

export async function checkStock(input: CheckStockInput) {
    const { productId, size, color } = input;

    const variants = await prisma.productVariant.findMany({
        where: {
            productId,
            ...(size ? { size: { equals: size, mode: "insensitive" as const } } : {}),
            ...(color ? { color: { contains: color, mode: "insensitive" as const } } : {}),
        },
        include: {
            product: { select: { name: true, price: true } },
        },
        orderBy: [{ color: "asc" }, { size: "asc" }],
    });

    if (variants.length === 0) {
        return {
            available: false,
            message: size || color
                ? `Không tìm thấy variant ${size ? `size ${size}` : ""}${size && color ? " " : ""}${color ? `màu ${color}` : ""}`
                : "Không tìm thấy sản phẩm",
            variants: [],
        };
    }

    const availableVariants = variants.filter(
        (v) => v.isAvailable && v.stockQuantity > 0
    );

    return {
        productName: variants[0].product.name,
        productPrice: Number(variants[0].product.price),
        available: availableVariants.length > 0,
        message: availableVariants.length > 0
            ? `Có ${availableVariants.length} lựa chọn còn hàng`
            : "Hết hàng",
        variants: variants.map((v) => ({
            variantId: v.id,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            stock: v.stockQuantity,
            available: v.isAvailable && v.stockQuantity > 0,
        })),
    };
}
