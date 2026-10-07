import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Home.css'; 

export default function Home() {
    const navigate = useNavigate();
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchProducts();
    }, []);

    // Cập nhật hàm Đăng xuất để gọi API đổi trạng thái
    const handleLogout = async () => {
        try {
            await api.post('/users/logout');
        } catch (e) {
            console.error("Lỗi khi đăng xuất:", e);
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div className="home-container">
            <div className="home-header">
                <h2>Trang chủ - Danh sách đồ dùng học tập</h2>
                {token ? (
                    <div>
                        <span className="role-info">Vai trò: <strong>{role}</strong></span>
                        
                        {/* Bổ sung nút Quản lý Tài khoản (Chỉ dành cho Admin) */}
                        {role === 'Admin' && (
                            <button 
                                className="btn-auth" 
                                style={{ marginRight: '10px', backgroundColor: '#0275d8', color: 'white' }} 
                                onClick={() => navigate('/manage-users')}
                            >
                                Quản lý Tài khoản
                            </button>
                        )}

                        {/* Chỉ hiển thị nút Quản lý Sản phẩm nếu là Admin hoặc Staff */}
                        {(role === 'Admin' || role === 'Staff') && (
                            <button 
                                className="btn-auth" 
                                style={{ marginRight: '10px', backgroundColor: '#5cb85c', color: 'white' }} 
                                onClick={() => navigate('/manage-products')}
                            >
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
                <p>Chưa có sản phẩm nào trong cửa hàng. (Hãy dùng tài khoản Admin để thêm sản phẩm)</p>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                        <div key={product._id} className="product-card">
                            <h3 className="product-title">{product.name}</h3>
                            <p className="product-category">Danh mục: {product.category}</p>
                            <p className="product-price">Giá: {product.price.toLocaleString()} VNĐ</p>
                            <p className="product-stock">Tồn kho: {product.stock}</p>
                            
                            <button className="btn-add-cart">Thêm vào giỏ hàng</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}