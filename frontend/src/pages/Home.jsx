import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Home.css'; 
import '../styles/Cart.css';

export default function Home() {
    const navigate = useNavigate();
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        fetchProducts();
        if (role === 'Customer') {
            fetchCartCount();
        }
    }, [role]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products/');
            setProducts(response.data.products);
        } catch (error) {
            console.error("Lỗi khi tải sản phẩm:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCartCount = async () => {
        try {
            const res = await api.get('/cart/');
            const count = res.data.items.reduce((total, item) => total + item.quantity, 0);
            setCartCount(count);
        } catch (error) {
            console.error("Lỗi lấy giỏ hàng", error);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post('/users/logout');
        } catch (e) {
            console.error(e);
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const handleAddToCart = async (product) => {
        if (!token) {
            alert("Vui lòng đăng nhập để mua hàng!");
            navigate('/login');
            return;
        }
        if (role !== 'Customer') {
            alert("Chỉ tài khoản Khách hàng mới có thể mua hàng!");
            return;
        }

        try {
            await api.post('/cart/add', {
                product_id: product._id,
                quantity: 1
            });
            alert(`Đã thêm "${product.name}" vào giỏ!`);
            fetchCartCount(); 
        } catch (error) {
            alert(error.response?.data?.detail || "Lỗi thêm giỏ hàng");
        }
    };

    return (
        <div className="home-container">
            <div className="home-header">
                <h2>Trang chủ - Danh sách đồ dùng học tập</h2>
                {token ? (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {role === 'Customer' && (
                            <button className="cart-btn-header" onClick={() => navigate('/cart')}>
                                🛒 Giỏ hàng <span className="badge">{cartCount}</span>
                            </button>
                        )}

                        <span className="role-info">Vai trò: <strong>{role}</strong></span>
                        
                        {role === 'Admin' && (
                            <button className="btn-auth" style={{ marginRight: '10px', backgroundColor: '#0275d8', color: 'white' }} onClick={() => navigate('/manage-users')}>
                                Quản lý Tài khoản
                            </button>
                        )}

                        {(role === 'Admin' || role === 'Staff') && (
                            <button className="btn-auth" style={{ marginRight: '10px', backgroundColor: '#5cb85c', color: 'white' }} onClick={() => navigate('/manage-products')}>
                                Quản lý Sản phẩm
                            </button>
                        )}

                        <button className="btn-auth" onClick={handleLogout}>Đăng xuất</button>
                    </div>
                ) : (
                    <button className="btn-auth" onClick={() => navigate('/login')}>
                        Đi đến Đăng nhập
                    </button>
                )}
            </div>
            
            <hr className="divider" />

            {loading ? (
                <p>Đang tải danh sách sản phẩm...</p>
            ) : products.length === 0 ? (
                <p>Chưa có sản phẩm nào trong cửa hàng.</p>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                        <div key={product._id} className="product-card">
                            
                            <div className="product-image-container">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} />
                                ) : (
                                    <span className="no-image">Chưa có ảnh</span>
                                )}
                            </div>

                            <h3 className="product-title">{product.name}</h3>
                            <p className="product-category">Danh mục: {product.category}</p>
                            <p className="product-price">Giá: {product.price.toLocaleString()} VNĐ</p>
                            
                            {/* Cập nhật khu vực Nút bấm: Chia 2 nút */}
                            <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                                <button 
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} 
                                    onClick={() => navigate(`/product/${product._id}`)}
                                >
                                    Chi tiết
                                </button>
                                <button 
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#0275d8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={() => handleAddToCart(product)}
                                >
                                    Thêm giỏ
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}