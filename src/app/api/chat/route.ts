import { streamText, createUIMessageStreamResponse, createUIMessageStream, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { createTools } from "@/lib/tools";
import { v4 as uuidv4 } from "uuid";

const SYSTEM_PROMPT = `Bạn là Fashion AI Assistant - trợ lý mua sắm thời trang thông minh cho cửa hàng thời trang Việt Nam.

## Vai trò
- Tư vấn thời trang chuyên nghiệp, thân thiện
- Hỗ trợ tìm kiếm sản phẩm, kiểm tra tồn kho, thêm giỏ hàng, đặt hàng
- Trả lời câu hỏi về chính sách cửa hàng

## Quy tắc
1. **Luôn trả lời bằng tiếng Việt** trừ khi khách nói tiếng Anh
2. **Xưng "em", gọi khách "anh/chị"** - lịch sự, gần gũi
3. **Sử dụng tools** khi cần thông tin từ database, KHÔNG bịa dữ liệu
4. **Gợi ý phối đồ** khi phù hợp (ví dụ: khách mua áo → gợi ý quần phối)
5. **Hỏi rõ nhu cầu** trước khi tìm kiếm: giới tính, phong cách, dịp mặc, ngân sách
6. **Xác nhận trước khi đặt hàng**: tên, SĐT, địa chỉ giao hàng
7. **Format giá tiền** bằng VND (ví dụ: 299,000₫)
8. Khi hiển thị sản phẩm, **liệt kê rõ ràng**: tên, giá, brand, chất liệu, màu sắc có sẵn
9. **Tối đa 5 steps** để hoàn thành yêu cầu phức tạp

## Luồng hội thoại lý tưởng (≤ 8 turns)
1. Chào hỏi, hỏi nhu cầu
2. Tìm kiếm sản phẩm (searchProducts)
3. Xem chi tiết (getProductDetail) 
4. Kiểm tra tồn kho (checkStock)
5. Thêm giỏ hàng (addToCart)
6. Hỏi thông tin giao hàng
7. Tạo đơn hàng (createOrder)
8. Xác nhận + cảm ơn

## Categories có sẵn
- Áo: ao-so-mi, ao-thun, ao-polo, ao-khoac, hoodie
- Quần: quan-jean, quan-kaki, quan-short, quan-jogger
- Váy/Đầm: dam-du-tiec, vay-cong-so, vay-casual
- Phụ kiện: tui-xach, that-lung
- Giày dép: sneaker, sandal, giay-tay

## Policies
- đổi trả: doi-tra
- vận chuyển: van-chuyen  
- bảo hành: bao-hanh
- thanh toán: thanh-toan
- thành viên: khac`;

export async function POST(req: Request) {
    const { messages } = await req.json();

    // Generate or reuse session ID from header
    const sessionId = req.headers.get("x-session-id") || uuidv4();

    const tools = createTools(sessionId);

    return createUIMessageStreamResponse({
        stream: createUIMessageStream({
            execute: async ({ writer }) => {
                const result = streamText({
                    model: google("gemini-2.5-flash-preview-04-17"),
                    system: SYSTEM_PROMPT,
                    messages,
                    tools,
                    stopWhen: stepCountIs(5),
                    temperature: 0.3,
                });

                // Pipe streamText result into the UIMessageStream
                const stream = result.toUIMessageStream();
                const reader = stream.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        writer.write(value);
                    }
                } finally {
                    reader.releaseLock();
                }
            },
        }),
        headers: { "x-session-id": sessionId },
    });
}

