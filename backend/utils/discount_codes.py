# Tệp: backend/utils/discount_codes.py

"""
File này chứa toàn bộ các mã giảm giá hợp lệ của hệ thống Studyholic.
Chỉ những mã có mặt trong dictionary này mới được áp dụng khi khách hàng thanh toán.

Cấu trúc: 
    "MÃ_GIẢM_GIÁ": Phần_trăm_giảm_giá
"""

VALID_DISCOUNT_CODES = {
    "STUDYHOLIC10": 10,   # Giảm 10% tổng đơn
    "MINH2026": 15,       # Giảm 15% tổng đơn
    "SALE20": 20,         # Giảm 20% tổng đơn
    "SIEUUDAI50": 50,     # Giảm 50% tổng đơn
    "WELCOME5": 5         # Giảm 5% cho khách mới
}

def get_discount_percent(code: str) -> int:
    """
    Hàm kiểm tra mã giảm giá. 
    Trả về % giảm giá nếu hợp lệ, trả về 0 nếu mã sai hoặc không tồn tại.
    """
    if not code:
        return 0
        
    # Chuyển mã người dùng nhập thành chữ in hoa để so sánh cho chuẩn xác
    code_upper = code.strip().upper()
    
    # Kiểm tra xem mã có nằm trong danh sách hợp lệ không
    if code_upper in VALID_DISCOUNT_CODES:
        return VALID_DISCOUNT_CODES[code_upper]
    
    return 0