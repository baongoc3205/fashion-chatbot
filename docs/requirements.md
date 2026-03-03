# Phân Tích Yêu Cầu - Fashion AI Chatbot

## 1. Tổng Quan

Hệ thống trợ lý ảo AI hội thoại **định hướng tác vụ** cho ngành bán lẻ thời trang. Chatbot có khả năng:
- Tư vấn sản phẩm thông minh (semantic search)
- Kiểm tra thông tin chính xác từ database (giá, tồn kho)
- Thực thi hành động nghiệp vụ (tạo đơn hàng, quản lý giỏ hàng)
- Hiển thị UI tương tác (Product Card, Order Confirmation)

## 2. Phân Loại Ý Định (Intent Taxonomy)

| # | Intent | Mô tả | Trigger Examples |
|---|--------|--------|-----------------|
| 1 | `SEARCH_PRODUCT` | Tìm kiếm sản phẩm theo mô tả tự nhiên | "Tìm áo sơ mi trắng", "Có váy đi tiệc không?" |
| 2 | `CHECK_STOCK` | Kiểm tra tồn kho, size còn hàng | "Size M còn không?", "Còn màu đen không?" |
| 3 | `GET_PRODUCT_DETAIL` | Xem chi tiết 1 sản phẩm cụ thể | "Cho xem thông tin áo này", "Giá bao nhiêu?" |
| 4 | `ADD_TO_CART` | Thêm sản phẩm vào giỏ hàng | "Thêm áo này size L", "Cho vào giỏ" |
| 5 | `CREATE_ORDER` | Tạo đơn hàng từ giỏ hàng | "Đặt mua luôn", "Thanh toán" |
| 6 | `ASK_POLICY` | Hỏi chính sách cửa hàng | "Đổi trả thế nào?", "Ship bao lâu?" |
| 7 | `STYLE_ADVICE` | Tư vấn phối đồ, phong cách | "Mặc gì đi dự tiệc?", "Phối đồ thế nào?" |

## 3. User Stories

### Khách hàng tìm kiếm sản phẩm
> **Là** khách hàng, **tôi muốn** mô tả nhu cầu bằng ngôn ngữ tự nhiên, **để** hệ thống gợi ý sản phẩm phù hợp kèm hình ảnh và giá.

### Khách hàng kiểm tra tồn kho
> **Là** khách hàng, **tôi muốn** hỏi size/màu còn hàng, **để** biết sản phẩm có sẵn trước khi đặt.

### Khách hàng đặt hàng
> **Là** khách hàng, **tôi muốn** hoàn tất đơn hàng ngay trong chat, **để** không cần chuyển qua trang web khác.

### Khách hàng hỏi chính sách
> **Là** khách hàng, **tôi muốn** hỏi về chính sách đổi trả/vận chuyển, **để** yên tâm khi mua hàng.

### Khách hàng tư vấn phong cách
> **Là** khách hàng, **tôi muốn** được tư vấn phối đồ, **để** chọn được sản phẩm phù hợp với dịp.

## 4. Happy-case Conversation Flow (≤ 8 Turns)

```
Turn 1: User  → "Chào, mình muốn tìm áo đi làm"
         AI   → Chào + gọi searchProducts → Hiển thị ProductGrid (4-6 sản phẩm)

Turn 2: User  → "Cho mình xem cái áo sơ mi trắng thứ 2"
         AI   → Gọi getProductDetail → Hiển thị ProductDetailCard (ảnh, giá, mô tả, sizes)

Turn 3: User  → "Size M còn không?"
         AI   → Gọi checkStock → "Size M màu trắng còn 5 chiếc ạ!"

Turn 4: User  → "Thêm vào giỏ hàng giúp mình"
         AI   → Gọi addToCart → "Đã thêm vào giỏ! Bạn muốn tiếp tục mua sắm hay đặt hàng?"

Turn 5: User  → "Đặt hàng luôn"
         AI   → "Để xử lý đơn hàng, cho mình xin thông tin giao hàng nhé:
                  - Họ tên
                  - Số điện thoại
                  - Địa chỉ giao hàng"

Turn 6: User  → "Nguyễn Văn A, 0901234567, 123 Nguyễn Huệ Q1 TPHCM"
         AI   → Gọi createOrder → Hiển thị OrderConfirmationCard
                  "Đơn hàng #FC-20260224-001 đã được tạo thành công! 🎉"

Turn 7: User  → "Cảm ơn!"
         AI   → "Cảm ơn bạn đã mua hàng! Chúc bạn một ngày tốt lành! 😊"
```

## 5. Yêu Cầu Phi Chức Năng

| Yêu cầu | Mục tiêu |
|----------|----------|
| Response time (text) | < 2s cho lần đầu stream |
| Response time (tool) | < 5s cho tool execution |
| p95 Backend Latency | < 500ms (không tính LLM) |
| Hallucination Rate | < 5% |
| Task Success Rate | > 85% |
| Intent Accuracy | > 90% |
| Ngôn ngữ | Tiếng Việt (chính), English (hỗ trợ) |
| Concurrent users | 10-50 (demo scale) |

## 6. Dữ Liệu Sản Phẩm

### Categories
- **Áo** (Sơ mi, Thun, Polo, Khoác, Hoodie)
- **Quần** (Jean, Kaki, Short, Jogger)
- **Váy/Đầm** (Đầm dự tiệc, Váy công sở, Váy casual)
- **Phụ kiện** (Túi xách, Thắt lưng, Kính mắt, Mũ)
- **Giày dép** (Sneaker, Sandal, Giày tây, Boot)

### Brands mẫu
Yody, Routine, Canifa, Elise, IVY moda, Nem, Owen, Aristino, Foci, Juno

### Size system
- Áo: XS, S, M, L, XL, XXL
- Quần: 28, 29, 30, 31, 32, 33, 34
- Giày: 38, 39, 40, 41, 42, 43, 44

### Price range
- Áo: 150,000 - 1,200,000 VND
- Quần: 200,000 - 1,500,000 VND
- Váy/Đầm: 300,000 - 2,500,000 VND
- Phụ kiện: 100,000 - 3,000,000 VND
- Giày: 300,000 - 2,000,000 VND
