import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const getPolicySchema = z.object({
    category: z
        .string()
        .optional()
        .describe("Loại chính sách: doi-tra, van-chuyen, bao-hanh, thanh-toan, khac"),
    keyword: z.string().optional().describe("Từ khóa tìm kiếm trong nội dung chính sách"),
});

export type GetPolicyInput = z.infer<typeof getPolicySchema>;

export async function getPolicy(input: GetPolicyInput) {
    const { category, keyword } = input;

    const policies = await prisma.policy.findMany({
        where: {
            isActive: true,
            ...(category ? { category } : {}),
            ...(keyword
                ? {
                    OR: [
                        { title: { contains: keyword, mode: "insensitive" as const } },
                        { content: { contains: keyword, mode: "insensitive" as const } },
                    ],
                }
                : {}),
        },
        select: {
            id: true,
            category: true,
            title: true,
            content: true,
        },
    });

    if (policies.length === 0) {
        return {
            found: false,
            message: "Không tìm thấy chính sách phù hợp",
            policies: [],
        };
    }

    return {
        found: true,
        policies: policies.map((p) => ({
            category: p.category,
            title: p.title,
            content: p.content,
        })),
    };
}
