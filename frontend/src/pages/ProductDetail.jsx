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
    
    // Xử lý mã giảm giá
    const [promoCode, setPromoCode] = useState('');
    const [discountValue, setDiscountValue] = useState(0); 
    const [appliedCode, setAppliedCode] = useState(''); // Lưu mã nếu áp dụng thành công

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

    // GỌI API ĐỂ KIỂM TRA MÃ GIẢM GIÁ (Đã sửa /order thành /orders)
    const handleApplyCode = async () => {
        if (!promoCode.trim()) {
            alert("Vui lòng nhập mã giảm giá!");
            return;
        }

        try {
            // Đã đổi thành /orders/ 
            const res = await api.get(`/orders/validate-discount/${promoCode.trim()}`);
            
            if (res.data.valid) {
                const percent = res.data.discount_percent;
                // Tính số tiền được giảm dựa trên % trả về
                const calculatedDiscount = product.price * (percent / 100);
                
                setDiscountValue(calculatedDiscount);
                setAppliedCode(promoCode.trim().toUpperCase());
                alert(`Áp dụng mã thành công! Bạn được giảm ${percent}%`);
            }
        } catch (error) {
            // Nếu vẫn lỗi 404 thì nguyên nhân là do chưa Restart Backend
            if (error.response?.status === 404) {
                 alert("Lỗi 404: Không tìm thấy API trên Server. Vui lòng tắt và bật lại (Restart) Backend FastAPI của bạn!");
                 return;
            }
            alert("Mã không hợp lệ hoặc đã hết hạn!");
            setDiscountValue(0);
            setAppliedCode('');
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
         if (!token) return navigate('/login');
    
        // Gửi cả sản phẩm và mã giảm giá sang trang Checkout (nếu có)
        navigate('/checkout', { 
            state: { 
                direct: true, 
                product: product,
                discount_code: appliedCode // Đính kèm mã để trang checkout xử lý
            } 
        });
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
                    <div className="detail-id">Mã SP: <strong>{product.product_code || '---'}</strong></div>
                    
                    <div className="detail-info">
                        <p><strong>Nhà cung cấp:</strong> {product.supplier || 'Đang cập nhật'}</p>
                        <p><strong>Ngày lên kệ:</strong> {product.release_date || 'Đang cập nhật'}</p>
                        <p><strong>Bảo hành:</strong> {product.warranty || 'Không bảo hành'}</p>
                        <p><strong>Mô tả:</strong> {product.description || 'Chưa có mô tả'}</p>
                    </div>

                    <div className="discount-box">
                        <div>Giảm giá hiện hành: <strong>{product.discount_percent || 0}%</strong></div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                            <input 
                                type="text" 
                                className="discount-input" 
                                placeholder="Nhập mã (VD: SALE20)" 
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                            />
                            <button className="btn-apply" onClick={handleApplyCode}>Áp dụng</button>
                        </div>
                        {appliedCode && <div style={{color: 'green', fontSize: '13px', marginTop: '5px'}}>Mã đã dùng: {appliedCode}</div>}
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