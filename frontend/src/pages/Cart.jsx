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

    useEffect(() => {
        if (!token) {
            alert("Vui lòng đăng nhập!");
            navigate('/login');
            return;
        }
        fetchData();
    }, [token, navigate]);

    const fetchData = async () => {
        try {
            // Lấy Giỏ hàng
            const cartRes = await api.get('/cart/');
            setCartItems(cartRes.data.items);
            setTotalPrice(cartRes.data.total_price);

            // Lấy Đơn hàng đang xử lý (Chờ duyệt, Đang giao)
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
            alert("Lỗi khi xóa sản phẩm");
        }
    };

    if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>Đang tải dữ liệu...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', fontFamily: 'Arial' }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>Quản lý Giỏ hàng & Đơn hàng</h2>
            
            {/* Bố cục Flexbox: Trái 7 - Phải 3 */}
            <div style={{ display: 'flex', gap: '30px' }}>
                
                {/* BÊN TRÁI: 7 PHẦN (Chi tiết Giỏ hàng) */}
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
                            <div className="cart-summary">
                                <h3>Tổng thanh toán: <span style={{ color: '#d9534f' }}>{totalPrice.toLocaleString()} VNĐ</span></h3>
                                <button className="btn-checkout" onClick={() => navigate('/checkout')}>Tiến hành Thanh toán</button>
                            </div>
                        </>
                    )}
                </div>

                {/* BÊN PHẢI: 3 PHẦN (Đơn hàng đang xử lý) */}
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
                        style={{ width: '100%', marginTop: '20px', padding: '10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Xem Lịch sử Đơn hàng
                    </button>
                </div>
            </div>
        </div>
    );
}