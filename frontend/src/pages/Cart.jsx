// Tệp: frontend/src/pages/Cart.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Cart.css';

export default function Cart() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem('access_token');
    
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [processingOrders, setProcessingOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Mã giảm giá
    const [promoCode, setPromoCode] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [appliedCode, setAppliedCode] = useState('');
    const [discountMessage, setDiscountMessage] = useState({ type: '', text: '' }); 

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [token, navigate]);

    const fetchData = async () => {
        try {
            const cartRes = await api.get('/cart/');
            setCartItems(cartRes.data.items);
            setTotalPrice(cartRes.data.total_price);

            const orderRes = await api.get('/orders/my-orders');
            const processing = orderRes.data.orders.filter(
                o => o.status === 'Chờ duyệt' || o.status === 'Đang giao'
            );
            setProcessingOrders(processing);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            await api.delete(`/cart/remove/${productId}`);
            fetchData(); 
        } catch (error) {
            console.error("Lỗi khi xóa sản phẩm");
        }
    };

    const handleApplyCode = async () => {
        setDiscountMessage({ type: '', text: '' }); 

        if (!promoCode.trim()) {
            setDiscountMessage({ type: 'error', text: 'Vui lòng nhập mã giảm giá!' });
            return;
        }

        try {
            const res = await api.get(`/orders/validate-discount/${promoCode.trim()}`);
            
            if (res.data.valid) {
                setDiscountPercent(res.data.discount_percent);
                setAppliedCode(promoCode.trim().toUpperCase());
                setDiscountMessage({ type: 'success', text: `✓ Đã áp dụng mã: ${promoCode.trim().toUpperCase()} (-${res.data.discount_percent}%)` });
                setPromoCode(''); 
            }
        } catch (error) {
            setDiscountPercent(0);
            setAppliedCode('');
            
            if (error.response?.status === 404) {
                 setDiscountMessage({ type: 'error', text: 'Lỗi hệ thống (404). Vui lòng thử lại sau.' });
                 return;
            }
            setDiscountMessage({ type: 'error', text: 'Mã không hợp lệ hoặc đã hết hạn!' });
        }
    };

    const discountAmount = totalPrice * (discountPercent / 100);
    const finalPrice = totalPrice - discountAmount;

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Đang tải dữ liệu...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: 'Arial' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Quản lý Giỏ hàng & Đơn hàng</h2>
            
            <div style={{ display: 'flex', gap: '30px' }}>
                <div style={{ flex: 7, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Giỏ hàng của bạn</h3>
                    
                    {cartItems.length === 0 ? (
                        <p style={{ marginTop: '20px', color: '#666' }}>Giỏ hàng trống.</p>
                    ) : (
                        <>
                            <table className="cart-table">
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th>Đơn giá</th>
                                        <th>SL</th>
                                        <th>Thành tiền</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cartItems.map((item) => (
                                        <tr key={item.product_id}>
                                            <td 
                                                style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                                                onClick={() => navigate(`/product/${item.product_id}`)}
                                                title="Nhấn để xem chi tiết sản phẩm"
                                            >
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="cart-item-img" />
                                                ) : (
                                                    <div style={{ width: '60px', height: '60px', background: '#eee' }}></div>
                                                )}
                                                <span style={{ color: '#0275d8', fontWeight: 'bold' }}>{item.name}</span>
                                            </td>
                                            <td>{item.price.toLocaleString()} đ</td>
                                            <td><strong>{item.quantity}</strong></td>
                                            <td><strong style={{color: '#d9534f'}}>{item.subtotal.toLocaleString()} đ</strong></td>
                                            <td>
                                                <button className="btn-remove-item" onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.product_id); }}>
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {/* KHU VỰC NHẬP MÁ GIẢM GIÁ & TỔNG KẾT ĐƠN HÀNG (SẮP XẾP NGANG) */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
                                
                                {/* CỘT TRÁI: Nhập mã giảm giá */}
                                <div style={{ flex: '0 0 45%', padding: '15px', border: '1px dashed #ccc', borderRadius: '8px', background: '#fafafa' }}>
                                    <strong style={{ display: 'block', marginBottom: '10px', color: '#333', fontSize: '15px' }}>Mã giảm giá:</strong>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Nhập mã (VD: SALE20)" 
                                            value={promoCode}
                                            onChange={e => {
                                                setPromoCode(e.target.value);
                                                setDiscountMessage({ type: '', text: '' }); 
                                            }}
                                            style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '4px', flex: 1, outline: 'none' }}
                                        />
                                        <button 
                                            onClick={handleApplyCode}
                                            style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                    
                                    {/* THÔNG BÁO LỖI HOẶC THÀNH CÔNG INLINE */}
                                    {discountMessage.text && (
                                        <div style={{ 
                                            color: discountMessage.type === 'error' ? '#dc3545' : '#28a745', 
                                            fontSize: '14px', 
                                            marginTop: '10px', 
                                            fontWeight: discountMessage.type === 'success' ? 'bold' : 'normal' 
                                        }}>
                                            {discountMessage.text}
                                        </div>
                                    )}
                                </div>

                                {/* CỘT PHẢI: Tổng thanh toán */}
                                <div className="cart-summary" style={{ flex: '0 0 45%', textAlign: 'right' }}>
                                    {discountPercent > 0 && (
                                        <div style={{ marginBottom: '12px', fontSize: '15px', color: '#666', lineHeight: '1.6' }}>
                                            <div>Tạm tính: <span style={{ textDecoration: 'line-through' }}>{totalPrice.toLocaleString()} VNĐ</span></div>
                                            <div>Giảm giá: <span style={{ color: '#28a745' }}>-{discountAmount.toLocaleString()} VNĐ</span></div>
                                        </div>
                                    )}
                                    <h3 style={{ marginBottom: '20px' }}>Tổng thanh toán: <span style={{ color: '#d9534f', fontSize: '24px' }}>{finalPrice.toLocaleString()} VNĐ</span></h3>
                                    
                                    <button 
                                        className="btn-checkout" 
                                        style={{ padding: '12px 25px', fontSize: '16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} 
                                        onClick={() => navigate('/checkout', { state: { discount_code: appliedCode } })}
                                    >
                                        Tiến hành Thanh toán
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div style={{ flex: 3, background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', height: 'fit-content' }}>
                    <h3 style={{ borderBottom: '2px solid #ddd', paddingBottom: '10px', color: '#d9534f' }}>Đang xử lý ({processingOrders.length})</h3>
                    
                    {processingOrders.length === 0 ? (
                        <p style={{ fontSize: '14px', color: '#777', marginTop: '15px' }}>Không có đơn hàng nào đang giao.</p>
                    ) : (
                        <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {processingOrders.map(order => (
                                <div key={order._id} style={{ background: '#fff', padding: '15px', borderRadius: '6px', border: '1px solid #ddd' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Mã Đơn: {order.order_id}</div>
                                    <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>{order.created_at}</div>
                                    <div style={{ color: '#0275d8', fontWeight: 'bold', fontSize: '14px' }}>Trạng thái: {order.status}</div>
                                    <div style={{ marginTop: '10px', fontSize: '15px', fontWeight: 'bold', color: '#d9534f' }}>
                                        {order.total_amount.toLocaleString()} đ
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <button 
                        onClick={() => navigate('/order-history')}
                        style={{ width: '100%', marginTop: '20px', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Xem Lịch sử Đơn hàng
                    </button>
                </div>
            </div>
        </div>
    );
}