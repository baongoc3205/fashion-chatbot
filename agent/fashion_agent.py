"""
Fashion AI Agent — built with OpenAI Agents SDK.

Architecture: Multi-Agent Handoffs
"""

from agents import Agent
from tools import search_products

# ==========================================
# 1. KHỞI TẠO CÁC AGENTS (Chưa nhúng tools chuyển giao)
# ==========================================

triage_agent = Agent(
    name="TriageAgent",
    model="gpt-4o-mini",
    instructions="""Bạn là Lễ tân (Triage Agent) của cửa hàng thời trang Việt Nam.
Luôn trả lời bằng tiếng Việt thân thiện, xưng "em" và gọi khách là "anh/chị".
- Nhiệm vụ: Chào hỏi người dùng và tìm hiểu nhu cầu của họ. Mở đầu bằng một câu chào vui vẻ.
- Nếu khách muốn tìm quần áo, mua sắm hoặc tư vấn phong cách -> GỌI CÔNG CỤ transfer_to_search_agent.
- Nếu khách muốn thanh toán, kiểm tra đơn hàng -> GỌI CÔNG CỤ transfer_to_checkout_agent.
- KHÔNG tự tư vấn sản phẩm, hãy chuyển giao công việc cho các agent chuyên môn!"""
)

search_agent = Agent(
    name="SearchAgent",
    model="gpt-4o-mini",
    instructions="""Bạn là Chuyên gia tư vấn thời trang (Search Agent).
Luôn trả lời bằng tiếng Việt thân thiện, xưng "em" và gọi khách là "anh/chị".
## Nhiệm vụ
- Hỏi rõ nhu cầu nếu chưa đủ thông tin (giới tính, phong cách, dịp mặc, ngân sách).
- Sử dụng công cụ `search_products` để tìm đồ thực tế từ database. KHÔNG bịa ra dữ liệu.
- Gợi ý phối đồ khi phù hợp (ví dụ khách mua áo -> gợi ý quần phối).
- Liệt kê thông tin rõ ràng: tên, brand, giá (định dạng 299,000₫), chất liệu, màu sắc.
- Khi khách đã chốt được sản phẩm và muốn mua/thanh toán -> Gọi công cụ transfer_to_checkout_agent để chuyển sang phần thanh toán.
- Nếu khách hỏi vấn đề khác ngoài tìm kiếm quần áo -> Gọi công cụ transfer_back_to_triage."""
)

checkout_agent = Agent(
    name="CheckoutAgent",
    model="gpt-4o-mini",
    instructions="""Bạn là Nhân viên Thu ngân (Checkout Agent).
Luôn trả lời bằng tiếng Việt thân thiện, xưng "em" và gọi khách là "anh/chị".
## Nhiệm vụ
- Xác nhận lại tên các sản phẩm khách muốn mua.
- Xin thông tin giao hàng: Tên người nhận, Số điện thoại, Địa chỉ.
- Tóm tắt lại toàn bộ thông tin đơn hàng lần cuối để khách xác nhận.
- Cảm ơn và thông báo đơn hàng sẽ được xử lý sớm.
- Nếu khách muốn quay lại tìm thêm đồ -> Gọi công cụ transfer_to_search_agent."""
)

# ==========================================
# 2. DEFINING HANDOFF FUNCTIONS (Hàm chuyển giao)
# ==========================================

def transfer_to_search_agent():
    """Gọi hàm này khi người dùng muốn tìm kiếm quần áo, phụ kiện, hoặc cần tư vấn phong cách."""
    return search_agent

def transfer_to_checkout_agent():
    """Gọi hàm này khi người dùng đã chốt chọn sản phẩm và muốn thanh toán, đặt hàng, hoặc hỏi về giỏ hàng/đơn hàng."""
    return checkout_agent

def transfer_back_to_triage():
    """Trở về TriageAgent nếu người dùng hỏi những vấn đề chung chung hoặc cần tư vấn điều hướng lại."""
    return triage_agent

# ==========================================
# 3. GÁN TOOLS CHUYỂN GIAO & CÔNG CỤ CHO AGENTS
# ==========================================

triage_agent.tools = [transfer_to_search_agent, transfer_to_checkout_agent]
search_agent.tools = [search_products, transfer_to_checkout_agent, transfer_back_to_triage]
checkout_agent.tools = [transfer_to_search_agent, transfer_back_to_triage]

# Agent khởi đầu của hệ thống (Export ra để main.py sử dụng)
fashion_agent = triage_agent