import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const addToCartSchema = z.object({
    sessionId: z.string().describe("Session ID của người dùng hiện tại"),
    productId: z.string().describe("ID sản phẩm"),
    variantId: z.string().describe("ID variant (size + color) cụ thể"),
    quantity: z.number().min(1).default(1).describe("Số lượng muốn thêm"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export async function addToCart(input: AddToCartInput) {
    const { sessionId, productId, variantId, quantity } = input;

    // 1. Validate variant exists and has stock
    const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        include: {
            product: { select: { name: true, price: true, images: true } },
        },
    });

    if (!variant) {
        return { success: false, error: "Variant không tồn tại" };
    }

    if (!variant.isAvailable || variant.stockQuantity < quantity) {
        return {
            success: false,
            error: `Không đủ hàng. Còn lại: ${variant.stockQuantity}`,
        };
    }

    // 2. Find or create active cart for this session
    let cart = await prisma.cart.findFirst({
        where: { sessionId, status: "ACTIVE" },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { sessionId, status: "ACTIVE" },
        });
    }

    // 3. Check if this variant already in cart → update quantity
    const existingItem = await prisma.cartItem.findUnique({
        where: { cartId_productVariantId: { cartId: cart.id, productVariantId: variantId } },
    });

    if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (newQty > variant.stockQuantity) {
            return {
                success: false,
                error: `Không thể thêm. Đã có ${existingItem.quantity} trong giỏ, kho còn ${variant.stockQuantity}`,
            };
        }
        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQty },
        });
    } else {
        await prisma.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                productVariantId: variantId,
                quantity,
            },
        });
    }

    // 4. Get updated cart summary
    const cartItems = await prisma.cartItem.findMany({
        where: { cartId: cart.id },
        include: {
            product: { select: { name: true, price: true } },
            productVariant: { select: { size: true, color: true } },
        },
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
    );

    return {
        success: true,
        message: `Đã thêm ${variant.product.name} (${variant.color}, ${variant.size}) x${quantity} vào giỏ hàng`,
        addedItem: {
            productName: variant.product.name,
            size: variant.size,
            color: variant.color,
            quantity,
            unitPrice: Number(variant.product.price),
        },
        cartSummary: {
            cartId: cart.id,
            totalItems,
            totalAmount,
            items: cartItems.map((item) => ({
                productName: item.product.name,
                size: item.productVariant.size,
                color: item.productVariant.color,
                quantity: item.quantity,
                subtotal: Number(item.product.price) * item.quantity,
            })),
        },
    };
}
