// Tệp: frontend/src/pages/Cart.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Cart.css';

export default function Cart() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const res = await api.get('/cart/');
            setCartItems(res.data.items);
            setTotalPrice(res.data.total_price);
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            await api.delete(`/cart/remove/${productId}`);
            fetchCart(); // Cập nhật lại giỏ hàng
        } catch (error) {
            alert("Lỗi khi xóa sản phẩm");
        }
    };

    if (loading) return <div style={{padding: '30px'}}>Đang tải giỏ hàng...</div>;

    return (
        <div className="cart-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Giỏ hàng của bạn</h2>
                <button onClick={() => navigate('/')} style={{ padding: '8px 15px', cursor: 'pointer' }}>
                    Tiếp tục mua sắm
                </button>
            </div>

            {cartItems.length === 0 ? (
                <p style={{ marginTop: '20px' }}>Giỏ hàng hiện đang trống.</p>
            ) : (
                <>
                    <table className="cart-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Giá</th>
                                <th>Số lượng</th>
                                <th>Tổng</th>
                                <th>Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item) => (
                                <tr key={item.product_id}>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="cart-item-img" />
                                        ) : (
                                            <div style={{ width: '60px', height: '60px', background: '#eee' }}></div>
                                        )}
                                        <span>{item.name}</span>
                                    </td>
                                    <td>{item.price.toLocaleString()} đ</td>
                                    <td>
                                        <div className="cart-quantity-control">
                                            {/* (Tương lai có thể làm nút -/+) */}
                                            <strong>{item.quantity}</strong>
                                        </div>
                                    </td>
                                    <td><strong style={{color: '#d9534f'}}>{item.subtotal.toLocaleString()} đ</strong></td>
                                    <td>
                                        <button className="btn-remove-item" onClick={() => handleRemoveItem(item.product_id)}>
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="cart-summary">
                        <h3>Tổng thanh toán: <span style={{ color: '#d9534f' }}>{totalPrice.toLocaleString()} VNĐ</span></h3>
                        <button className="btn-checkout" onClick={() => alert("Chức năng đặt hàng đang phát triển!")}>
                            Tiến hành Đặt hàng
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}