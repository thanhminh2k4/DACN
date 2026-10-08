// Tệp: frontend/src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/Checkout.css';

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Đọc trạng thái truyền từ trang Chi tiết sản phẩm (nếu có)
    const isDirect = location.state?.direct;
    const directProduct = location.state?.product;

    const [formData, setFormData] = useState({
        shipping_address: '',
        phone: '',
        payment_method: 'Thanh toán khi nhận hàng (COD)'
    });

    const [items, setItems] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        if (isDirect && directProduct) {
            // Mua ngay 1 sản phẩm
            setItems([{ ...directProduct, quantity: 1 }]);
            setTotalAmount(directProduct.price);
        } else {
            // Mua từ giỏ hàng
            fetchCart();
        }
    }, [isDirect, directProduct]);

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart/');
            if (res.data.items.length === 0) {
                alert("Giỏ hàng trống!");
                navigate('/');
                return;
            }
            setItems(res.data.items);
            setTotalAmount(res.data.total_price);
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng", error);
        }
    };

    const handleConfirmOrder = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                shipping_address: formData.shipping_address,
                phone: formData.phone,
                payment_method: formData.payment_method
            };

            if (isDirect) {
                // Gọi API Mua ngay
                await api.post('/orders/checkout-direct', {
                    ...payload,
                    product_id: directProduct._id,
                    quantity: 1
                });
            } else {
                // Gọi API Giỏ hàng
                await api.post('/orders/create', payload);
            }
            
            alert("🎉 Đặt hàng thành công! Cửa hàng sẽ sớm liên hệ với bạn.");
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.detail || "Lỗi trong quá trình đặt hàng");
        }
    };

    return (
        <div className="checkout-container">
            {/* Form thông tin giao hàng */}
            <div className="checkout-form-section">
                <h2>Thông tin Giao hàng</h2>
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

                    <button type="submit" className="btn-confirm">Xác nhận Đặt hàng</button>
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
                        <span style={{flex: 1, textAlign: 'right'}}>
                            {(item.price * item.quantity).toLocaleString()} đ
                        </span>
                    </div>
                ))}
                
                <div className="summary-total">
                    <span>Tổng cộng:</span>
                    <span>{totalAmount.toLocaleString()} VNĐ</span>
                </div>
            </div>
        </div>
    );
}