# Kiến Trúc Hệ Thống - Fashion AI Chatbot

## XÂY DỰNG ỨNG DỤNG VỚI OPENAI AGENTS SDK

### 1. Tổng quan và Kiến trúc Cốt lõi
OpenAI Agents SDK là một framework được thiết kế theo tư duy "Python-first", tối ưu hóa quy trình xây dựng các tác nhân AI (Agent) có khả năng sử dụng công cụ và tương tác đa phương thức.

#### 1.1. Cấu trúc cơ bản của Agent
Một Agent trong SDK được cấu thành từ ba yếu tố chính:
- **Name**: Định danh của Agent.
- **Instructions**: Hệ thống chỉ dẫn (System Prompt) định hình hành vi và vai trò.
- **Model**: Mô hình ngôn ngữ nền tảng (ví dụ: GPT-4o-mini).

#### 1.2. Cơ chế thực thi (The Runner)
Class Runner chịu trách nhiệm quản lý vòng đời và quá trình thực thi của Agent. Có ba phương thức vận hành chính:
- **run (Async)**: Thực thi bất đồng bộ, trả về kết quả cuối cùng sau khi hoàn tất toàn bộ quy trình.
- **run_sync**: Thực thi đồng bộ, chặn luồng chính cho đến khi có kết quả (chỉ dùng cho thử nghiệm, không khuyến nghị cho môi trường Production).
- **run_stream**: Thực thi bất đồng bộ và trả về dữ liệu theo dòng (stream). Đây là phương thức tối ưu cho trải nghiệm người dùng (UX), cho phép hiển thị phản hồi tức thì (token-by-token) thay vì chờ đợi toàn bộ câu trả lời.

#### 1.3. Quản lý Sự kiện (Event Handling)
Khi sử dụng chế độ Streaming, hệ thống sẽ trả về các đối tượng sự kiện (Events) để lập trình viên xử lý phía giao diện:
- **Raw Response**: Các token văn bản thô từ mô hình.
- **Run Item**: Thông tin về việc gọi công cụ (tool calls) hoặc các trạng thái nội bộ.
- **Xử lý**: Cần thiết lập bộ lọc để chỉ hiển thị nội dung văn bản cho người dùng cuối và ẩn các logic xử lý ngầm.

---

### 2. Công cụ và Cơ chế Bảo vệ (Tools & Guardrails)

#### 2.1. Function Tools
SDK cho phép biến các hàm Python thông thường thành công cụ cho Agent thông qua decorator `@function_tool`.
- **Cơ chế hoạt động**: Agent phân tích docstring (chuỗi mô tả) của hàm để hiểu mục đích và tham số.
- **Tự động hóa**: Khi Agent quyết định gọi một công cụ, SDK sẽ tự động thực thi hàm Python tương ứng và trả kết quả về cho Agent để tổng hợp câu trả lời cuối cùng.

#### 2.2. Guardrails (Hàng rào bảo vệ)
Guardrails là lớp bảo mật giúp kiểm soát nội dung đầu vào và đầu ra, đảm bảo an toàn hệ thống.
- **Input Guardrails**: Hoạt động như một bộ lọc trước khi tin nhắn đến Agent chính.
  - **Quy trình**: Tin nhắn người dùng -> Input Guardrail (Agent phụ kiểm tra vi phạm) -> Agent chính.
  - **Cấu trúc**: Sử dụng class `InputGuardrail` bao bọc một hàm kiểm tra. Hàm này trả về đối tượng chứa trạng thái kích hoạt (boolean) và thông tin từ chối nếu có vi phạm (ví dụ: chặn các câu hỏi về chính trị hoặc bạo lực).

---

### 3. Xây dựng Trợ lý Giọng nói (Voice Interfaces)

#### 3.1. Cấu hình Pipeline Âm thanh
Để xây dựng giao diện giọng nói thời gian thực, SDK cung cấp `VoicePipelineConfig` để thiết lập quy trình ba bước khép kín:
1. **Speech-to-Text (STT)**: Chuyển đổi âm thanh đầu vào thành văn bản (sử dụng Whisper).
2. **LLM Processing**: Agent xử lý văn bản và sinh phản hồi.
3. **Text-to-Speech (TTS)**: Chuyển đổi văn bản phản hồi thành âm thanh.

#### 3.2. Kỹ thuật Xử lý Audio
- **Thư viện**: Sử dụng `sounddevice` và `numpy` để thu và phát âm thanh.
- **Lưu ý về Sample Rate**: Có sự khác biệt giữa phần cứng (thường là 44.1kHz hoặc 48kHz) và chuẩn đầu vào của OpenAI (24kHz). Cần thực hiện bước chuyển đổi (resampling) dữ liệu âm thanh trước khi gửi đi để tránh lỗi sai lệch cao độ/tốc độ.
- **Prompt Engineering**: Trong phần instructions của Agent, bắt buộc phải khai báo rõ "Bạn là một trợ lý giọng nói". Điều này ngăn chặn việc Agent sinh ra các phản hồi không phù hợp với ngữ cảnh nghe nói (ví dụ: không dùng markdown, không nói "tôi không thể nghe thấy").

---

### 4. Hệ thống Đa tác vụ (Multi-Agent Systems)

#### 4.1. Orchestrator vs. Handoffs
Có hai mô hình chính để phối hợp nhiều Agent:
- **Orchestrator (Điều phối viên)**: Một Agent trung tâm gọi các Agent con như những công cụ.
  - *Nhược điểm*: Độ trễ cao và tốn kém tài nguyên do mọi thông tin đều phải đi qua Agent trung tâm.
- **Handoffs (Chuyền giao - Được khuyến nghị)**: Agent hiện tại chuyển hoàn toàn quyền kiểm soát sang một Agent khác chuyên biệt hơn.
  - *Ưu điểm*: Giảm độ trễ, tiết kiệm token và đơn giản hóa logic hội thoại.

#### 4.2. Cơ chế Handoff
- **Triển khai**: Khai báo danh sách các Agent đích trong tham số `handoffs`. SDK tự động tạo ra hàm `transfer_to_[AgentName]` để Agent tự quyết định khi nào cần chuyển giao.
- **Context Filtering (Bộ lọc ngữ cảnh)**: Khi chuyển giao, có thể sử dụng `input_filter` để loại bỏ các thông tin không cần thiết từ lịch sử hội thoại cũ (ví dụ: xóa các tool call của Agent trước đó). Điều này giúp Agent mới không bị "nhiễu" và tiết kiệm context window.
- **Input Type**: Định nghĩa cấu trúc dữ liệu bắt buộc phải truyền kèm khi chuyển giao, đảm bảo Agent nhận có đủ thông tin để tiếp tục công việc ngay lập tức.

---

### 5. Giám sát và Gỡ lỗi (Observability)

#### 5.1. OpenAI Dashboard
Agents SDK tích hợp sâu với nền tảng OpenAI. Khi chạy code với API Key hợp lệ, dữ liệu sẽ tự động được đẩy lên Dashboard tại mục **Traces**.
- **Lợi ích**: Cho phép xem lại toàn bộ luồng thực thi, bao gồm: đầu vào, đầu ra, các tool đã gọi, thời gian phản hồi (latency) và chi phí token.

#### 5.2. Custom Tracing
Để quản lý logs hiệu quả hơn trong các dự án lớn, SDK hỗ trợ tùy chỉnh tracing:
- **Grouping**: Sử dụng ngữ cảnh `with trace(...)` để nhóm các hoạt động liên quan lại với nhau (ví dụ: nhóm toàn bộ quy trình xử lý một yêu cầu người dùng).
- **Metadata**: Gắn thêm các thẻ dữ liệu (tags, attributes) vào trace để phục vụ việc lọc và tìm kiếm lỗi sau này.
- **Workflow Name**: Đặt tên định danh cho các luồng công việc để dễ dàng phân loại trên giao diện quản lý.

