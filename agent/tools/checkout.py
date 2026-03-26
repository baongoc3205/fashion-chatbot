def create_order(shipping_info: str) -> str:
    """Tạo đơn hàng mới từ giỏ hàng hiện tại.

    Args:
        shipping_info: Thông tin giao hàng (Tên, Số điện thoại, Địa chỉ)
    """
    return f"Đã tạo đơn hàng thành công! Thông tin giao nhận: {shipping_info}."

def calculate_shipping(address: str) -> str:
    """Tính phí giao hàng dựa trên địa chỉ.

    Args:
        address: Địa chỉ nhận hàng
    """
    return "Phí giao hàng dự kiến là 30,000VND."

def apply_discount(code: str) -> str:
    """Áp dụng mã giảm giá cho đơn hàng.

    Args:
        code: Mã giảm giá (ví dụ: FREESHIP, SALE10)
    """
    if code.upper() in ["FREESHIP", "FASHION10"]:
        return f"Đã áp dụng mã {code.upper()} thành công!"
    return f"Mã {code} không hợp lệ hoặc đã hết hạn."
