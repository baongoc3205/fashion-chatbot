import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { generateOrderNumber } from "@/lib/utils";

export const createOrderSchema = z.object({
    sessionId: z.string().describe("Session ID của người dùng hiện tại"),
    customerName: z.string().describe("Tên khách hàng"),
    phone: z.string().describe("Số điện thoại"),
    address: z.string().describe("Địa chỉ giao hàng đầy đủ"),
    city: z.string().optional().describe("Thành phố"),
    email: z.string().optional().describe("Email"),
    note: z.string().optional().describe("Ghi chú đơn hàng"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Shipping fee logic
function calculateShippingFee(city: string | undefined, totalAmount: number): number {
    const isUrban = city && (city.toLowerCase().includes("hồ chí minh") || city.toLowerCase().includes("hà nội"));
    if (isUrban) {
        return totalAmount >= 500000 ? 0 : 20000;
    }
    return totalAmount >= 700000 ? 0 : 30000;
}

export async function createOrder(input: CreateOrderInput) {
    const { sessionId, customerName, phone, address, city, email, note } = input;

    // 1. Find active cart
    const cart = await prisma.cart.findFirst({
        where: { sessionId, status: "ACTIVE" },
        include: {
            items: {
                include: {
                    product: { select: { name: true, price: true } },
                    productVariant: { select: { id: true, size: true, color: true, stockQuantity: true } },
                },
            },
        },
    });

    if (!cart || cart.items.length === 0) {
        return { success: false, error: "Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng." };
    }

    // 2. Validate stock for all items
    for (const item of cart.items) {
        if (item.productVariant.stockQuantity < item.quantity) {
            return {
                success: false,
                error: `Sản phẩm "${item.product.name}" (${item.productVariant.color}, ${item.productVariant.size}) chỉ còn ${item.productVariant.stockQuantity} sản phẩm`,
            };
        }
    }

    // 3. Calculate totals
    const totalAmount = cart.items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
    );
    const shippingFee = calculateShippingFee(city, totalAmount);

    // 4. Find or create customer
    let customer = await prisma.customer.findFirst({
        where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
    });

    if (!customer) {
        customer = await prisma.customer.create({
            data: { name: customerName, phone, email, address, city },
        });
    }

    // 5. Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
            data: {
                orderNumber: generateOrderNumber(),
                customerId: customer.id,
                status: "PENDING",
                totalAmount: totalAmount + shippingFee,
                shippingFee,
                shippingAddress: address,
                shippingCity: city,
                shippingPhone: phone,
                note,
                items: {
                    create: cart.items.map((item) => ({
                        productId: item.productId,
                        productVariantId: item.productVariantId,
                        quantity: item.quantity,
                        unitPrice: item.product.price,
                    })),
                },
            },
            include: { items: true },
        });

        // Decrease stock
        for (const item of cart.items) {
            await tx.productVariant.update({
                where: { id: item.productVariantId },
                data: {
                    stockQuantity: { decrement: item.quantity },
                },
            });
        }

        // Mark cart as converted
        await tx.cart.update({
            where: { id: cart.id },
            data: { status: "CONVERTED", customerId: customer.id },
        });

        return newOrder;
    });

    return {
        success: true,
        message: `Đơn hàng ${order.orderNumber} đã được tạo thành công!`,
        order: {
            orderNumber: order.orderNumber,
            status: order.status,
            items: cart.items.map((item) => ({
                productName: item.product.name,
                size: item.productVariant.size,
                color: item.productVariant.color,
                quantity: item.quantity,
                unitPrice: Number(item.product.price),
                subtotal: Number(item.product.price) * item.quantity,
            })),
            totalAmount: Number(order.totalAmount),
            shippingFee: Number(order.shippingFee),
            shippingAddress: order.shippingAddress,
            shippingPhone: order.shippingPhone,
            note: order.note,
            createdAt: order.createdAt.toISOString(),
        },
    };
}
