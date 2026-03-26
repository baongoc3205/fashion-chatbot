def faq_search(question: str) -> str:
    """Tìm kiếm câu trả lời cho các câu hỏi thường gặp.

    Ví dụ: Chính sách đổi trả, bảo hành, giờ làm việc...

    Args:
        question: Câu hỏi của khách hàng
    """
    return f"Theo chính sách của cửa hàng, đối với câu hỏi '{question}', quý khách sẽ được hỗ trợ đổi trả trong 7 ngày nếu lỗi từ nhà sản xuất."

def get_order_status(order_id: str) -> str:
    """Kiểm tra trạng thái của một đơn hàng.

    Args:
        order_id: Mã đơn hàng cần kiểm tra
    """
    return f"Đơn hàng {order_id} của anh/chị hiện đang ở trạng thái: Đang vận chuyển."

def handoff_human() -> str:
    """Chuyển cuộc gọi hoặc chat cho nhân viên hỗ trợ thật.

    Sử dụng khi chatbot không thể xử lý hoặc khách hàng yêu cầu gặp người thật.
    """
    return "Đang chuyển kết nối đến nhân viên chăm sóc khách hàng. Vui lòng đợi trong giây lát..."
