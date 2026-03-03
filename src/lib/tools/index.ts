// Tool Layer - Vercel AI SDK v6 tool definitions
// All 6 core business tools for the Fashion AI Chatbot
// AI SDK v6 uses `inputSchema` instead of `parameters`

import { z } from "zod";
import type { Tool } from "ai";
import { searchProducts } from "./search-products";
import { getProductDetail } from "./get-product-detail";
import { checkStock } from "./check-stock";
import { addToCart } from "./add-to-cart";
import { createOrder } from "./create-order";
import { getPolicy } from "./get-policy";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTool = Tool<any, any>;

export function createTools(sessionId: string): Record<string, AnyTool> {
    return {
        searchProducts: {
            description:
                "Tìm kiếm sản phẩm thời trang theo từ khóa, danh mục, thương hiệu, giới tính, khoảng giá. Dùng khi khách hỏi tìm sản phẩm, gợi ý sản phẩm, hoặc mô tả nhu cầu mua sắm.",
            inputSchema: z.object({
                query: z.string().describe("Từ khóa tìm kiếm sản phẩm"),
                category: z.string().optional().describe("Slug danh mục"),
                brand: z.string().optional().describe("Tên thương hiệu"),
                gender: z.enum(["MALE", "FEMALE", "UNISEX"]).optional().describe("Giới tính"),
                minPrice: z.number().optional().describe("Giá tối thiểu (VND)"),
                maxPrice: z.number().optional().describe("Giá tối đa (VND)"),
                limit: z.number().optional().default(6).describe("Số kết quả"),
            }),
            execute: async (args: { query: string; category?: string; brand?: string; gender?: "MALE" | "FEMALE" | "UNISEX"; minPrice?: number; maxPrice?: number; limit: number }) =>
                searchProducts(args),
        } as AnyTool,

        getProductDetail: {
            description:
                "Lấy thông tin chi tiết sản phẩm: mô tả, giá, chất liệu, màu sắc, size có sẵn. Dùng khi khách muốn xem chi tiết 1 sản phẩm.",
            inputSchema: z.object({
                productId: z.string().optional().describe("ID sản phẩm"),
                slug: z.string().optional().describe("Slug sản phẩm"),
            }),
            execute: async (args: { productId?: string; slug?: string }) =>
                getProductDetail(args),
        } as AnyTool,

        checkStock: {
            description:
                "Kiểm tra tồn kho sản phẩm theo size và màu sắc. Dùng khi khách hỏi còn hàng không, size nào còn.",
            inputSchema: z.object({
                productId: z.string().describe("ID sản phẩm cần kiểm tra"),
                size: z.string().optional().describe("Size cần kiểm tra (vd: M, L, 39)"),
                color: z.string().optional().describe("Màu sắc cần kiểm tra (vd: Trắng, Đen)"),
            }),
            execute: async (args: { productId: string; size?: string; color?: string }) =>
                checkStock(args),
        } as AnyTool,

        addToCart: {
            description:
                "Thêm sản phẩm vào giỏ hàng. Cần variantId (ID variant size+color cụ thể). Dùng khi khách muốn thêm vào giỏ.",
            inputSchema: z.object({
                productId: z.string().describe("ID sản phẩm"),
                variantId: z.string().describe("ID variant (size + color)"),
                quantity: z.number().min(1).default(1).describe("Số lượng"),
            }),
            execute: async (args: { productId: string; variantId: string; quantity: number }) =>
                addToCart({ ...args, sessionId }),
        } as AnyTool,

        createOrder: {
            description:
                "Tạo đơn hàng từ giỏ hàng hiện tại. Cần thông tin giao hàng: tên, SĐT, địa chỉ. Dùng khi khách muốn đặt mua.",
            inputSchema: z.object({
                customerName: z.string().describe("Tên khách hàng"),
                phone: z.string().describe("Số điện thoại"),
                address: z.string().describe("Địa chỉ giao hàng"),
                city: z.string().optional().describe("Thành phố"),
                email: z.string().optional().describe("Email"),
                note: z.string().optional().describe("Ghi chú đơn hàng"),
            }),
            execute: async (args: { customerName: string; phone: string; address: string; city?: string; email?: string; note?: string }) =>
                createOrder({ ...args, sessionId }),
        } as AnyTool,

        getPolicy: {
            description:
                "Tra cứu chính sách cửa hàng: đổi trả (doi-tra), vận chuyển (van-chuyen), bảo hành (bao-hanh), thanh toán (thanh-toan), thành viên (khac).",
            inputSchema: z.object({
                category: z.string().optional().describe("Loại chính sách: doi-tra, van-chuyen, bao-hanh, thanh-toan, khac"),
                keyword: z.string().optional().describe("Từ khóa tìm kiếm"),
            }),
            execute: async (args: { category?: string; keyword?: string }) =>
                getPolicy(args),
        } as AnyTool,
    };
}
