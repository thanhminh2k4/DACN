// Tệp: frontend/src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/ProductDetail.css';

export default function ProductDetail() {
    const { id } = useParams(); // Lấy ID sản phẩm từ URL
    const navigate = useNavigate();
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Xử lý mã giảm giá
    const [promoCode, setPromoCode] = useState('');
    const [discountValue, setDiscountValue] = useState(0);

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

    const handleApplyCode = () => {
        // Giả lập logic mã giảm giá
        if (promoCode.toUpperCase() === 'SALE10') {
            setDiscountValue(10000); // Giảm cứng 10k
            alert("Áp dụng mã giảm 10,000đ thành công!");
        } else {
            alert("Mã không hợp lệ!");
            setDiscountValue(0);
        }
    };

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
        // Logic Thanh toán thẳng sẽ được phát triển sau
        alert("Chức năng thanh toán trực tiếp đang phát triển!");
    };

    if (loading) return <div style={{padding: '50px'}}>Đang tải chi tiết...</div>;

    // Tính toán giá sau giảm
    const finalPrice = product.price - discountValue;

    return (
        <div className="detail-container">
            <button onClick={() => navigate('/')} style={{marginBottom: '20px', padding: '5px 15px'}}>← Quay lại</button>
            
            <div className="detail-grid">
                {/* TRÁI: 6 Phần - Chi tiết */}
                <div className="detail-left">
                    <h1 className="detail-title">{product.name}</h1>
                    <div className="detail-id">Mã SP: {product.custom_id || 'Đang cập nhật'}</div>
                    
                    <div className="detail-info">
                        <p><strong>Nhà sản xuất:</strong> {product.manufacturer || 'Đang cập nhật'}</p>
                        <p><strong>Ngày lên kệ:</strong> {product.release_date || 'Đang cập nhật'}</p>
                        <p><strong>Bảo hành:</strong> {product.warranty || 'Không bảo hành'}</p>
                        <p><strong>Mô tả:</strong> {product.description || 'Chưa có mô tả'}</p>
                    </div>

                    <div className="discount-box">
                        <div>Giảm giá hiện hành: <strong>{product.discount_percent || 0}%</strong></div>
                        <div>
                            <input 
                                type="text" 
                                className="discount-input" 
                                placeholder="Nhập mã (VD: SALE10)" 
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                            />
                            <button className="btn-apply" onClick={handleApplyCode}>Áp dụng</button>
                        </div>
                    </div>

                    <div className="price-box">
                        {discountValue > 0 && <span className="old-price">{product.price.toLocaleString()}đ</span>}
                        Giá thanh toán: {finalPrice > 0 ? finalPrice.toLocaleString() : 0} VNĐ
                    </div>

                    <div className="action-row">
                        <button className="btn-add" onClick={handleAddToCart}>Thêm vào giỏ</button>
                        <button className="btn-buy" onClick={handleCheckout}>Thanh toán ngay</button>
                    </div>
                </div>

                {/* PHẢI: 4 Phần - Hình ảnh */}
                <div className="detail-right">
                    {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="detail-image" />
                    ) : (
                        <div style={{width: '100%', height: '300px', backgroundColor: '#eee', display: 'flex', alignItems:'center', justifyContent: 'center'}}>
                            Không có ảnh
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}