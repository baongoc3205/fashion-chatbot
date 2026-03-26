def add_to_cart(product_id: str, quantity: int = 1) -> str:
    """Thêm sản phẩm vào giỏ hàng.

    Mô phỏng việc thêm sản phẩm vào giỏ hàng của user hiện tại.

    Args:
        product_id: ID sản phẩm cần thêm
        quantity: Số lượng (mặc định 1)
    """
    return f"Đã thêm {quantity} sản phẩm (ID: {product_id}) vào giỏ hàng."

def get_cart(user_id: str = "default_user") -> str:
    """Xem thông tin giỏ hàng hiện tại.

    Args:
        user_id: ID người dùng (mặc định là default_user giả lập)
    """
    return "Giỏ hàng hiện đang trống."

def remove_from_cart(product_id: str) -> str:
    """Xóa sản phẩm khỏi giỏ hàng.

    Args:
        product_id: ID sản phẩm cần xóa
    """
    return f"Đã xóa sản phẩm (ID: {product_id}) khỏi giỏ hàng."
