// Tệp: frontend/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Home.css'; 

import banner1 from '../images/banner1.png';
import banner2 from '../images/banner2.png';
import banner3 from '../images/banner3.png';
import banner4 from '../images/banner4.png';
import banner5 from '../images/banner5.png';

const BANNERS = [banner1, banner2, banner3, banner4, banner5];

export default function Home() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [currentBanner, setCurrentBanner] = useState(0);

    const [quickAddProduct, setQuickAddProduct] = useState(null);
    const [quickAddQuantity, setQuickAddQuantity] = useState(1);
    
    // State để hiển thị thông báo mượt mà thay cho alert()
    const [modalMessage, setModalMessage] = useState({ type: '', text: '' }); 

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products/');
                const activeProducts = response.data.products.filter(p => p.is_active !== false);
                setProducts(activeProducts);
            } catch (error) {
                console.error(error);
            }
        };
        fetchProducts();

        const bannerInterval = setInterval(() => {
            setCurrentBanner((prev) => (prev === BANNERS.length - 1 ? 0 : prev + 1));
        }, 8000);
        return () => clearInterval(bannerInterval);
    }, []);

    const handleOpenQuickAdd = (product) => {
        const token = sessionStorage.getItem('access_token');
        const role = sessionStorage.getItem('role');
        
        if (!token) return navigate('/login');
        if (role !== 'Customer') return; 
        
        setModalMessage({ type: '', text: '' }); 
        setQuickAddProduct(product);
        setQuickAddQuantity(1); 
    };

    const confirmAddToCart = async () => {
        setModalMessage({ type: '', text: '' });
        try {
            await api.post('/cart/add', { product_id: quickAddProduct._id, quantity: quickAddQuantity });
            
            setModalMessage({ type: 'success', text: '✓ Thêm vào giỏ thành công!' });
            setTimeout(() => setQuickAddProduct(null), 1000); 
            
        } catch (error) {
            if (error.response?.status === 401) {
                setModalMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn. Đang chuyển hướng...' });
                sessionStorage.clear();
                setTimeout(() => {
                    setQuickAddProduct(null);
                    navigate('/login');
                }, 1500);
            } else {
                setModalMessage({ type: 'error', text: 'Có lỗi xảy ra, vui lòng thử lại!' });
            }
        }
    };

    const bestSellers = [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 4);
    const flashSales = products.filter(p => p.discount_percent > 0).slice(0, 4);

    return (
        <div className="home-container">
            <div className="home-content">
                <div className="banner-container">
                    <button className="banner-btn prev" onClick={() => setCurrentBanner(prev => (prev === 0 ? BANNERS.length - 1 : prev - 1))}>❮</button>
                    <button className="banner-btn next" onClick={() => setCurrentBanner(prev => (prev === BANNERS.length - 1 ? 0 : prev + 1))}>❯</button>
                    <img src={BANNERS[currentBanner]} alt="Banner Quảng Cáo" className="banner-image" />
                    <div className="banner-indicators">
                        {BANNERS.map((_, idx) => (
                            <span key={idx} className={`indicator ${idx === currentBanner ? 'active' : ''}`} onClick={() => setCurrentBanner(idx)}></span>
                        ))}
                    </div>
                </div>

                {bestSellers.length > 0 && (
                    <div className="section-block">
                        <h3 className="section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            🔥 Bán chạy nhất
                            <button onClick={() => navigate('/category')} style={{ fontSize: '14px', background: 'none', border: 'none', color: '#0275d8', cursor: 'pointer' }}>Xem tất cả &rarr;</button>
                        </h3>
                        <div className="product-grid">
                            {bestSellers.map(renderProductCard)}
                        </div>
                    </div>
                )}

                {flashSales.length > 0 && (
                    <div className="section-block" style={{ marginBottom: '60px' }}>
                        <h3 className="section-title">⚡ Siêu Sale Giảm Giá</h3>
                        <div className="product-grid">
                            {flashSales.map(renderProductCard)}
                        </div>
                    </div>
                )}
            </div>

            <footer className="site-footer">
                <div>Dự án đồ án chuyên ngành - Phát triển bởi sinh viên Trần Phạm Thành Minh.</div>
                <div>Trường Đại học Tài nguyên và Môi trường TP.HCM. Cấp tại: Khoa Công Nghệ Thông Tin.</div>
                <div>Địa chỉ: 236B Lê Văn Sỹ, Phường 1, Tân Bình, Thành phố Hồ Chí Minh. Điện thoại: 0396971157.</div>
            </footer>

            {/* MODAL CHỌN SỐ LƯỢNG MUA NHANH */}
            {quickAddProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', padding: '25px', borderRadius: '12px', 
                        width: '350px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333', fontSize: '20px' }}>Chọn số lượng</h3>
                        
                        {modalMessage.text && (
                            <div style={{
                                padding: '10px', marginBottom: '15px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold',
                                backgroundColor: modalMessage.type === 'error' ? '#f8d7da' : '#d4edda',
                                color: modalMessage.type === 'error' ? '#721c24' : '#155724'
                            }}>
                                {modalMessage.text}
                            </div>
                        )}

                        <p style={{ fontWeight: 'bold', marginBottom: '25px', color: '#0275d8', lineHeight: '1.4' }}>
                            {quickAddProduct.name}
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', marginBottom: '30px' }}>
                            <button 
                                onClick={() => setQuickAddQuantity(prev => Math.max(1, prev - 1))}
                                style={{ padding: '8px 20px', fontSize: '20px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', background: '#f8f9fa', color: '#333' }}
                            >-</button>
                            <span style={{ fontSize: '22px', fontWeight: 'bold', minWidth: '30px' }}>{quickAddQuantity}</span>
                            <button 
                                onClick={() => setQuickAddQuantity(prev => prev + 1)}
                                style={{ padding: '8px 20px', fontSize: '20px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '8px', background: '#f8f9fa', color: '#333' }}
                            >+</button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={() => setQuickAddProduct(null)}
                                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '6px', background: '#e9ecef', color: '#333', fontWeight: 'bold', cursor: 'pointer' }}
                            >Hủy bỏ</button>
                            <button 
                                onClick={confirmAddToCart}
                                disabled={modalMessage.type === 'success' || modalMessage.text.includes('hết hạn')}
                                style={{ 
                                    flex: 1, padding: '12px', border: 'none', borderRadius: '6px', 
                                    background: '#d9534f', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                                    opacity: (modalMessage.type === 'success' || modalMessage.text.includes('hết hạn')) ? 0.6 : 1 
                                }}
                            >
                                Xác nhận thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    function renderProductCard(product) {
        // CÔNG THỨC GIẢM GIÁ ĐÃ ĐƯỢC FIX LẠI CHUẨN
        const originalPrice = product.price;
        const discountedPrice = product.discount_percent > 0 
            ? originalPrice - (originalPrice * product.discount_percent / 100)
            : originalPrice;

        return (
            <div key={product._id} className="product-card">
                {product.discount_percent > 0 && <div className="badge-discount">-{product.discount_percent}%</div>}
                <div className="product-image-container" onClick={() => navigate(`/product/${product._id}`)} style={{cursor: 'pointer'}}>
                    {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span style={{color: '#ccc'}}>Chưa có ảnh</span>}
                </div>
                <h3 className="product-title" title={product.name}>{product.name}</h3>
                <p className="product-price">
                    {/* Hiển thị giá đã giảm bằng số TO, giá gốc bị gạch ngang */}
                    {discountedPrice.toLocaleString()} đ
                    {product.discount_percent > 0 && (
                        <span style={{textDecoration: 'line-through', color: '#999', fontSize: '13px', display: 'block'}}>
                            {originalPrice.toLocaleString()} đ
                        </span>
                    )}
                </p>
                
                <div className="product-sold">Đã bán: {product.sold || 0}</div>
                
                <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                    <button style={{ flex: 1, padding: '8px', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate(`/product/${product._id}`)}>Chi tiết</button>
                    <button style={{ flex: 1, padding: '8px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleOpenQuickAdd(product)}>Mua</button>
                </div>
            </div>
        );
    }
}