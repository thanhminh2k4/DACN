// Tệp: frontend/src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/ProductDetail.css';

export default function ProductDetail() {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const token = sessionStorage.getItem('access_token');
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // STATE CHO ĐỒNG HỒ ĐẾM NGƯỢC
    const [timeLeft, setTimeLeft] = useState('');
    const [isDiscountActive, setIsDiscountActive] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                setProduct(res.data);
            } catch (err) {
                alert("Không tìm thấy sản phẩm!");
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    // BỘ MÁY ĐẾM NGƯỢC REAL-TIME
    useEffect(() => {
        if (!product || !product.discount_end_time) {
            setIsDiscountActive(false);
            return;
        }

        const updateTimer = () => {
            const now = new Date().getTime();
            const endTime = new Date(product.discount_end_time).getTime();
            const distance = endTime - now;

            if (distance <= 0) {
                // Hết giờ
                setIsDiscountActive(false);
                setTimeLeft('');
            } else {
                // Đang trong giờ vàng
                setIsDiscountActive(true);
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);
                
                const format = (num) => num.toString().padStart(2, '0');
                setTimeLeft(`${format(h)}:${format(m)}:${format(s)}`);
            }
        };

        updateTimer(); // Chạy ngay lần đầu tiên
        const timerId = setInterval(updateTimer, 1000); // Cập nhật mỗi giây
        
        return () => clearInterval(timerId); // Xóa bộ nhớ khi thoát trang
    }, [product]);

    const handleAddToCart = async () => {
        if (!token) return navigate('/login');
        try {
            await api.post('/cart/add', { product_id: product._id, quantity: 1 });
            alert("Đã thêm vào giỏ hàng!");
        } catch (err) {
            alert("Lỗi thêm giỏ hàng");
        }
    };

    const handleCheckout = () => {
         if (!token) return navigate('/login');
        // Không gửi mã giảm giá nữa vì Flash Sale sẽ tự áp dụng giá mới
        navigate('/checkout', { 
            state: { direct: true, product: product, discount_code: null } 
        });
    };
    
    if (loading) return <div style={{padding: '50px'}}>Đang tải chi tiết...</div>;

    // TÍNH TOÁN GIÁ TIỀN (Chỉ giảm khi đồng hồ còn chạy)
    const discountValue = isDiscountActive && product.discount_percent > 0 
        ? product.price * (product.discount_percent / 100) 
        : 0;
        
    const finalPrice = product.price - discountValue;

    return (
        <div className="detail-container">
            <button onClick={() => navigate('/')} style={{marginBottom: '20px', padding: '5px 15px'}}>← Quay lại</button>
            
            <div className="detail-grid">
                {/* TRÁI: Chi tiết sản phẩm */}
                <div className="detail-left">
                    <h1 className="detail-title">{product.name}</h1>
                    <div className="detail-id">Mã SP: <strong>{product.product_code || product.custom_id || product.ma_sp || '---'}</strong></div>
                    
                    <div className="detail-info">
                        <p><strong>Nhà cung cấp:</strong> {product.supplier || 'Đang cập nhật'}</p>
                        <p><strong>Ngày lên kệ:</strong> {product.release_date || 'Đang cập nhật'}</p>
                        <p><strong>Bảo hành:</strong> {product.warranty || 'Không bảo hành'}</p>
                        <p><strong>Mô tả:</strong> {product.description || 'Chưa có mô tả'}</p>
                    </div>

                    {/* KHU VỰC ĐỒNG HỒ FLASH SALE */}
                    {isDiscountActive && product.discount_percent > 0 && (
                        <div className="discount-box" style={{ background: '#fff3cd', border: '1px solid #ffeeba', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: '#856404', fontWeight: 'bold', fontSize: '16px' }}>
                                    ⚡ ĐANG GIẢM GIÁ: {product.discount_percent}%
                                </div>
                                <div style={{ background: '#d9534f', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '18px', letterSpacing: '1px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                    ⏱ {timeLeft}
                                </div>
                            </div>
                            <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                                Nhanh tay lên! Mức giá ưu đãi sẽ kết thúc khi hết thời gian.
                            </div>
                        </div>
                    )}

                    <div className="price-box">
                        {discountValue > 0 && (
                            <span className="old-price" style={{ textDecoration: 'line-through', color: '#999', marginRight: '15px', fontSize: '18px' }}>
                                {product.price.toLocaleString()}đ
                            </span>
                        )}
                        Giá thanh toán: <span style={{ color: '#d9534f', fontWeight: 'bold', fontSize: '24px' }}>{finalPrice > 0 ? finalPrice.toLocaleString() : 0} VNĐ</span>
                    </div>

                    <div className="action-row">
                        <button className="btn-add" onClick={handleAddToCart}>Thêm vào giỏ</button>
                        <button className="btn-buy" onClick={handleCheckout}>Thanh toán ngay</button>
                    </div>
                </div>

                {/* PHẢI: Hình ảnh */}
                <div className="detail-right">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="detail-image" />
                    ) : (
                        <div style={{width: '100%', height: '100%', minHeight: '300px', backgroundColor: '#eee', display: 'flex', alignItems:'center', justifyContent: 'center', borderRadius: '8px'}}>
                            Không có ảnh minh họa
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}   