"""
Fashion AI Agent — built with OpenAI Agents SDK.

Architecture: Multi-Agent Handoffs for E-commerce (Router, Search, Cart, Checkout, Support)
"""

from agents import Agent
from tools import (
    search_products,
    add_to_cart, get_cart, remove_from_cart,
    create_order, calculate_shipping, apply_discount,
    faq_search, get_order_status, handoff_human
)

# ==========================================
# 1. KHỞI TẠO CÁC AGENTS (Chưa nhúng tools chuyển giao)
# ==========================================

triage_agent = Agent(
    name="TriageAgent",
    model="gpt-4o-mini",
    instructions="""Bạn là Lễ tân (Router) của cửa hàng thời trang Việt Nam.
Trách nhiệm duy nhất của bạn là phân tích yêu cầu của khách hàng và chuyển giao (handoff) đến agent phù hợp.
Luôn thân thiện, xưng "em" và gọi khách là "anh/chị". 

Quy tắc điều hướng:
1. Nếu khách muốn tìm kiếm quần áo, hỏi đồ, hoặc cần gợi ý phối đồ (Search) -> transfer_to_search_agent
2. Nếu khách muốn thêm vào giỏ hàng, xem giỏ hàng, xóa đồ trong giỏ (Cart) -> transfer_to_cart_agent
3. Nếu khách muốn thanh toán, chốt đơn, tính phí ship (Checkout) -> transfer_to_checkout_agent
4. Nếu khách hỏi chính sách, đổi trả, bảo hành, xem tình trạng đơn, hoặc gặp người thật (Support) -> transfer_to_support_agent
5. Không tự tư vấn hay giải quyết! Bắt buộc phải chuyển khách cho Agent chuyên môn."""
)

search_agent = Agent(
    name="SearchAgent",
    model="gpt-4o-mini",
    instructions="""Bạn là Chuyên gia tư vấn thời trang (Search Agent).
Luôn trả lời bằng tiếng Việt thân thiện, xưng "em" và gọi khách là "anh/chị".
## Nhiệm vụ
- Hỏi rõ nhu cầu nếu chưa đủ thông tin (giới tính, phong cách, dịp mặc, ngân sách).
- Sử dụng `search_products` để tìm đồ thực tế từ database. KHÔNG tự bịa ra dữ liệu.
- Liệt kê tên, brand, giá, chất liệu.
- Khi khách đã ưng ý và muốn mua, nhắc khách thêm vào giỏ. Nếu khách đồng ý -> transfer_to_cart_agent.
- Nếu khách cần hỗ trợ sau bán hàng -> transfer_to_support_agent.
- Nếu khách hỏi ngoài chức năng -> transfer_back_to_triage."""
)

cart_agent = Agent(
    name="CartAgent",
    model="gpt-4o-mini",
    instructions="""Bạn là Nhân viên Quản lý Giỏ hàng (Cart Agent).
Tiếp nhận yêu cầu thêm, xem, sửa, xóa sản phẩm trong giỏ hàng.
- Sử dụng công cụ `add_to_cart`, `get_cart`, `remove_from_cart`.
- Sau khi thao tác, xác nhận lại với khách (vd: "Em đã thêm vào giỏ hàng cho anh chị").
- Khi khách muốn mua sắm tiếp -> transfer_to_search_agent.
- Khi khách báo muốn thanh toán -> transfer_to_checkout_agent.
- Nếu khách hỏi khó / ngoài phận sự -> transfer_to_support_agent."""
)

checkout_agent = Agent(
    name="CheckoutAgent",
    model="gpt-4o-mini",
    instructions="""Bạn là Nhân viên Thu ngân (Checkout Agent).
Thực hiện quá trình Thanh toán cho khách.
- Sử dụng `calculate_shipping`, `apply_discount` nếu khách yêu cầu.
- Gọi `create_order` sau khi xin đủ thông tin (address, tên, sđt) và khách đồng ý chốt đơn.
- Nếu khách khựng lại, muốn sửa đổi giỏ hàng -> transfer_to_cart_agent.
- Nếu khách cần hỗ trợ khác -> transfer_to_support_agent."""
)

support_agent = Agent(
    name="SupportAgent",
    model="gpt-4o-mini",
    instructions="""Bạn là Chăm sóc Khách hàng (Support Agent).
- Dùng `faq_search` để lấy thông tin đổi trả, chính sách.
- Dùng `get_order_status` để kiểm tra đơn hàng theo mã đơn.
- Dùng `handoff_human` nếu không có câu trả lời, hoặc khách muốn phàn nàn/nhắn với người thật.
- Nếu giải quyết xong và khách muốn quay lại từ đầu -> transfer_back_to_triage."""
)

# ==========================================
# 2. DEFINING HANDOFF FUNCTIONS (Hàm chuyển giao)
# ==========================================

def transfer_to_search_agent():
    """Chuyển giao cho SearchAgent để tìm kiếm, tư vấn sản phẩm, gợi ý phối đồ."""
    return search_agent

def transfer_to_cart_agent():
    """Chuyển giao cho CartAgent để quản lý, xem, xóa, thêm sản phẩm vào giỏ hàng."""
    return cart_agent

def transfer_to_checkout_agent():
    """Chuyển giao cho CheckoutAgent khi khách muốn thanh toán hoặc đặt hàng."""
    return checkout_agent

def transfer_to_support_agent():
    """Chuyển giao cho SupportAgent để giải đáp FAQ, kiểm tra trạng thái đơn, bảo hành."""
    return support_agent

def transfer_back_to_triage():
    """Trả luồng về TriageAgent nếu cần điều hướng lại từ đầu."""
    return triage_agent

# ==========================================
# 3. GÁN VÀ KẾT NỐI TOOLS (Gồm Handoff và Functions)
# ==========================================

triage_agent.tools = [
    transfer_to_search_agent,
    transfer_to_cart_agent,
    transfer_to_checkout_agent,
    transfer_to_support_agent
]

search_agent.tools = [
    search_products,
    transfer_to_cart_agent,
    transfer_to_support_agent,
    transfer_back_to_triage
]

cart_agent.tools = [
    add_to_cart, get_cart, remove_from_cart,
    transfer_to_search_agent,
    transfer_to_checkout_agent,
    transfer_to_support_agent
]

checkout_agent.tools = [
    create_order, calculate_shipping, apply_discount,
    transfer_to_cart_agent,
    transfer_to_support_agent
]

support_agent.tools = [
    faq_search, get_order_status, handoff_human,
    transfer_back_to_triage
]

# Agent khởi đầu của hệ thống (Được export ra để main.py gọi vào)
fashion_agent = triage_agent