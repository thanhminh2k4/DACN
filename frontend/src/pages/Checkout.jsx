// Tệp: frontend/src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/Checkout.css';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Đọc trạng thái truyền từ trang Chi tiết sản phẩm hoặc Giỏ hàng
    const isDirect = location.state?.direct;
    const directProduct = location.state?.product;
    const appliedDiscountCode = location.state?.discount_code || ''; // Nhận mã giảm giá truyền sang

    const [formData, setFormData] = useState({
        shipping_address: '',
        phone: '',
        payment_method: 'Thanh toán khi nhận hàng (COD)'
    });

    const [items, setItems] = useState([]);
    const [subTotalAmount, setSubTotalAmount] = useState(0); // Tiền gốc chưa giảm
    
    // State cho mã giảm giá
    const [discountPercent, setDiscountPercent] = useState(0);
    
    // State quản lý thông báo mượt mà (thay thế cho alert)
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (isDirect && directProduct) {
            setItems([{ ...directProduct, quantity: 1 }]);
            setSubTotalAmount(directProduct.price);
        } else {
            fetchCart();
        }
    }, [isDirect, directProduct]);

    // Gọi API để xác thực lại mã giảm giá nếu có mã truyền sang
    useEffect(() => {
        if (appliedDiscountCode) {
            validateDiscount(appliedDiscountCode);
        }
    }, [appliedDiscountCode]);

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart/');
            if (res.data.items.length === 0) {
                navigate('/');
                return;
            }
            setItems(res.data.items);
            setSubTotalAmount(res.data.total_price);
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng", error);
        }
    };

    const validateDiscount = async (code) => {
        try {
            const res = await api.get(`/orders/validate-discount/${code}`);
            if (res.data.valid) {
                setDiscountPercent(res.data.discount_percent);
            }
        } catch (error) {
            setDiscountPercent(0);
        }
    };

    // Hàm hiển thị thông báo
    const showMessage = (type, text) => {
        setMessage({ type, text });
        // Tự động tắt thông báo lỗi sau 5 giây
        if (type === 'error') {
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const handleConfirmOrder = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' }); // Xóa thông báo cũ
        
        try {
            const payload = {
                shipping_address: formData.shipping_address,
                phone: formData.phone,
                payment_method: formData.payment_method,
                discount_code: appliedDiscountCode // Đính kèm mã giảm giá để gửi cho Backend
            };

            if (isDirect) {
                await api.post('/orders/checkout-direct', {
                    ...payload,
                    product_id: directProduct._id,
                    quantity: 1
                });
            } else {
                await api.post('/orders/create', payload);
            }
            
            showMessage('success', '🎉 Đặt hàng thành công! Đang chuyển hướng về trang chủ...');
            setTimeout(() => navigate('/'), 2000);
            
        } catch (err) {
            // Thay thế alert bằng hộp thoại báo lỗi mượt mà
            const errorDetail = err.response?.data?.detail;
            
            if (typeof errorDetail === 'string') {
                showMessage('error', `Lỗi: ${errorDetail}`); // Bắt được lỗi "Sản phẩm không tồn tại"
            } else if (Array.isArray(errorDetail)) {
                showMessage('error', 'Vui lòng kiểm tra lại thông tin nhập vào!');
            } else {
                showMessage('error', 'Có lỗi xảy ra trong quá trình đặt hàng. Vui lòng thử lại!');
            }
        }
    };

    // Tính toán tiền cuối cùng
    const discountAmount = subTotalAmount * (discountPercent / 100);
    const finalAmount = subTotalAmount - discountAmount;

    return (
        <div className="checkout-container">
            {/* Form thông tin giao hàng */}
            <div className="checkout-form-section">
                <h2>Thông tin Giao hàng</h2>
                
                {/* HỘP THOẠI THÔNG BÁO (THAY THẾ ALERT) */}
                {message.text && (
                    <div style={{
                        padding: '12px 15px', 
                        marginBottom: '20px', 
                        borderRadius: '6px',
                        backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda',
                        color: message.type === 'error' ? '#721c24' : '#155724',
                        border: `1px solid ${message.type === 'error' ? '#f5c6cb' : '#c3e6cb'}`,
                        fontWeight: 'bold',
                        fontSize: '15px'
                    }}>
                        {message.text}
                    </div>
                )}
                
                <form onSubmit={handleConfirmOrder}>
                    <div className="form-group">
                        <label>Địa chỉ nhận hàng chi tiết:</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            required 
                            placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện..."
                            value={formData.shipping_address}
                            onChange={(e) => setFormData({...formData, shipping_address: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Số điện thoại liên hệ:</label>
                        <input 
                            type="tel" 
                            className="form-control" 
                            required 
                            placeholder="Nhập số điện thoại"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>
                    <div className="form-group">
                        <label>Phương thức thanh toán:</label>
                        <select 
                            className="form-control"
                            value={formData.payment_method}
                            onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                        >
                            <option value="Thanh toán khi nhận hàng (COD)">Thanh toán khi nhận hàng (COD)</option>
                            <option value="Chuyển khoản ngân hàng">Chuyển khoản ngân hàng (Đang bảo trì)</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-confirm" disabled={message.type === 'success'}>
                        {message.type === 'success' ? 'Đang xử lý...' : 'Xác nhận Đặt hàng'}
                    </button>
                    <button type="button" onClick={() => navigate(-1)} style={{marginTop: '10px', padding: '10px', width: '100%', cursor: 'pointer'}}>
                        Quay lại
                    </button>
                </form>
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="checkout-summary-section">
                <h3>Tóm tắt Đơn hàng</h3>
                <hr />
                {items.map((item, index) => (
                    <div key={index} className="summary-item">
                        <span style={{flex: 2}}>{item.name} (x{item.quantity})</span>
                        <span style={{flex: 1, textAlign: 'right', fontWeight: 'bold'}}>
                            {(item.price * item.quantity).toLocaleString()} đ
                        </span>
                    </div>
                ))}
                
                <hr style={{ border: '1px dashed #ddd', margin: '15px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#555' }}>
                    <span>Tạm tính:</span>
                    <span>{subTotalAmount.toLocaleString()} đ</span>
                </div>
                
                {discountPercent > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#28a745', fontWeight: 'bold' }}>
                        <span>Giảm giá ({appliedDiscountCode}):</span>
                        <span>-{discountAmount.toLocaleString()} đ</span>
                    </div>
                )}
                
                <div className="summary-total" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #eee' }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#d9534f', fontSize: '24px' }}>{finalAmount.toLocaleString()} VNĐ</span>
                </div>
            </div>
        </div>
    );
}