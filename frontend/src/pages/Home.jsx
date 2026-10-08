// Tệp: frontend/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Home.css'; 

const BANNERS = [
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588500093744-0b1928096cce?auto=format&fit=crop&w=1200&q=80"
];

export default function Home() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [currentBanner, setCurrentBanner] = useState(0);

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

    const handleAddToCart = async (product) => {
        const token = sessionStorage.getItem('access_token');
        const role = sessionStorage.getItem('role');
        if (!token) return navigate('/login');
        if (role !== 'Customer') return alert("Chỉ Khách hàng mới có thể mua!");
        try {
            await api.post('/cart/add', { product_id: product._id, quantity: 1 });
            alert(`Đã thêm "${product.name}" vào giỏ!`);
        } catch (error) {
            alert("Lỗi thêm giỏ hàng");
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
        </div>
    );

    function renderProductCard(product) {
        return (
            <div key={product._id} className="product-card">
                {product.discount_percent > 0 && <div className="badge-discount">-{product.discount_percent}%</div>}
                <div className="product-image-container" onClick={() => navigate(`/product/${product._id}`)} style={{cursor: 'pointer'}}>
                    {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span style={{color: '#ccc'}}>Chưa có ảnh</span>}
                </div>
                <h3 className="product-title" title={product.name}>{product.name}</h3>
                <p className="product-price">
                    {product.price.toLocaleString()} đ
                    {product.discount_percent > 0 && <span style={{textDecoration: 'line-through', color: '#999', fontSize: '13px', display: 'block'}}>{(product.price / (1 - product.discount_percent/100)).toLocaleString()} đ</span>}
                </p>
                <div className="product-sold">Đã bán: {product.sold || 0} (Kho: {product.stock})</div>
                <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                    <button style={{ flex: 1, padding: '8px', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate(`/product/${product._id}`)}>Chi tiết</button>
                    <button style={{ flex: 1, padding: '8px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleAddToCart(product)}>Mua</button>
                </div>
            </div>
        );
    }
}