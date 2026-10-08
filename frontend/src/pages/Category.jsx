// Tệp: frontend/src/pages/Category.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import '../styles/Home.css'; 

const CATEGORIES = ['Tất cả', 'Bút', 'Vở', 'Giấy', 'Sách', 'Tài liệu', 'Bộ dụng cụ', 'Khác'];

export default function Category() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 16;

    // State cho bộ lọc
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [filterType, setFilterType] = useState('all'); 

    // State quản lý Modal mua hàng nhanh
    const [quickAddProduct, setQuickAddProduct] = useState(null);
    const [quickAddQuantity, setQuickAddQuantity] = useState(1);
    const [modalMessage, setModalMessage] = useState({ type: '', text: '' }); 

    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        if (searchQuery) {
            setSelectedCategory('Tất cả');
            setFilterType('all');
            setCurrentPage(1);
        }
    }, [searchQuery]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products/');
                const activeProducts = response.data.products.filter(p => p.is_active !== false);
                setProducts(activeProducts);
            } catch (error) {
                console.error("Lỗi khi tải sản phẩm:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // 1. Hàm mở Modal chọn số lượng 
    const handleOpenQuickAdd = (product) => {
        const token = sessionStorage.getItem('access_token');
        const role = sessionStorage.getItem('role');
        
        if (!token) return navigate('/login');
        if (role !== 'Customer') return; 
        
        setModalMessage({ type: '', text: '' }); 
        setQuickAddProduct(product);
        setQuickAddQuantity(1); 
    };

    // 2. Hàm gọi API xác nhận thêm vào giỏ hàng
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

    let filteredProducts = [...products];

    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (selectedCategory !== 'Tất cả') {
        filteredProducts = filteredProducts.filter(p => 
            p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())
        );
    }

    if (filterType === 'sale') {
        filteredProducts = filteredProducts.filter(p => p.discount_percent > 0);
    } else if (filterType === 'bestseller') {
        filteredProducts.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    } else if (filterType === 'price_asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (filterType === 'price_desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const filterBtnStyle = (isActive) => ({
        padding: '8px 15px',
        border: '1px solid #d9534f',
        backgroundColor: isActive ? '#d9534f' : '#fff',
        color: isActive ? '#fff' : '#d9534f',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: '0.2s'
    });

    return (
        <div className="home-container" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '40px' }}>
            
            <div style={{ display: 'flex', gap: '20px', maxWidth: '1200px', margin: '20px auto', padding: '0 20px', alignItems: 'flex-start' }}>
                
                {/* CỘT TRÁI */}
                <div style={{ flex: '0 0 250px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', position: 'sticky', top: '90px' }}>
                    <h3 style={{ borderBottom: '2px solid #d9534f', paddingBottom: '10px', marginBottom: '15px', textTransform: 'uppercase', fontSize: '16px', color: '#333' }}>
                        ☰ Danh Mục Sản Phẩm
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {CATEGORIES.map(cat => (
                            <li 
                                key={cat} 
                                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                                style={{ 
                                    padding: '12px 15px', 
                                    cursor: 'pointer', 
                                    borderBottom: '1px solid #f1f1f1',
                                    fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                                    color: selectedCategory === cat ? '#d9534f' : '#555',
                                    backgroundColor: selectedCategory === cat ? '#fcf0f0' : 'transparent',
                                    borderRadius: '4px',
                                    transition: '0.2s'
                                }}
                            >
                                {cat}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CỘT PHẢI */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#555', marginRight: '5px' }}>Sắp xếp theo:</span>
                        
                        <button style={filterBtnStyle(filterType === 'all')} onClick={() => { setFilterType('all'); setCurrentPage(1); }}>Tất cả</button>
                        <button style={filterBtnStyle(filterType === 'sale')} onClick={() => { setFilterType('sale'); setCurrentPage(1); }}>Giảm giá</button>
                        <button style={filterBtnStyle(filterType === 'bestseller')} onClick={() => { setFilterType('bestseller'); setCurrentPage(1); }}>Bán chạy</button>
                        
                        <select 
                            style={{ padding: '8px 10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
                            value={filterType === 'price_asc' || filterType === 'price_desc' ? filterType : ''}
                            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="" disabled>Lọc theo giá ▾</option>
                            <option value="price_asc">Giá: Thấp đến Cao</option>
                            <option value="price_desc">Giá: Cao đến Thấp</option>
                        </select>
                    </div>
                    
                    <h3 className="section-title" style={{ marginTop: '0' }}>
                        {searchQuery ? ` Kết quả tìm kiếm cho: "${searchQuery}"` : ` ${selectedCategory.toUpperCase()}`}
                    </h3>

                    {loading ? (
                        <p style={{textAlign: 'center', padding: '50px'}}>Đang tải dữ liệu...</p>
                    ) : currentProducts.length === 0 ? (
                        <div style={{textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '8px', color: '#777'}}>
                            <div style={{fontSize: '40px', marginBottom: '15px'}}>📦</div>
                            Không tìm thấy sản phẩm nào phù hợp.
                        </div>
                    ) : (
                        <>
                            <div className="product-grid" style={{ gap: '15px' }}>
                                {currentProducts.map(product => {
                                    // SỬA CÔNG THỨC GIẢM GIÁ 
                                    const originalPrice = product.price;
                                    const discountedPrice = product.discount_percent > 0 
                                        ? originalPrice - (originalPrice * product.discount_percent / 100)
                                        : originalPrice;

                                    return (
                                        <div key={product._id} className="product-card" style={{ padding: '10px' }}>
                                            {product.discount_percent > 0 && <div className="badge-discount">-{product.discount_percent}%</div>}
                                            <div className="product-image-container" onClick={() => navigate(`/product/${product._id}`)} style={{cursor: 'pointer', height: '160px'}}>
                                                {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span style={{color: '#ccc'}}>Chưa có ảnh</span>}
                                            </div>
                                            <h3 className="product-title" style={{fontSize: '14px', height: '38px'}} title={product.name}>{product.name}</h3>
                                            
                                            <p className="product-price" style={{fontSize: '16px'}}>
                                                {/* Hiển thị giá sau giảm làm giá chính, giá gốc bị gạch ngang */}
                                                {discountedPrice.toLocaleString()} đ
                                                {product.discount_percent > 0 && (
                                                    <span style={{textDecoration: 'line-through', color: '#999', fontSize: '12px', display: 'block'}}>
                                                        {originalPrice.toLocaleString()} đ
                                                    </span>
                                                )}
                                            </p>
                                            
                                            <div className="product-sold" style={{marginBottom: '5px'}}>Đã bán: {product.sold || 0}</div>
                                            <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                                                <button style={{ flex: 1, padding: '6px', fontSize: '13px', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate(`/product/${product._id}`)}>Xem</button>
                                                {/* Gọi Modal thay vì ném thẳng vào giỏ */}
                                                <button style={{ flex: 1, padding: '6px', fontSize: '13px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleOpenQuickAdd(product)}>Mua</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {totalPages > 1 && (
                                <div className="pagination" style={{ marginTop: '30px' }}>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button 
                                            key={i} 
                                            className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                            onClick={() => { setCurrentPage(i + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            <footer className="site-footer">
                <div>Dự án đồ án chuyên ngành - Phát triển bởi sinh viên Trần Phạm Thành Minh.</div>
                <div>Trường Đại học Tài nguyên và Môi trường TP.HCM. Cấp tại: Khoa Công Nghệ Thông Tin.</div>
                <div>Địa chỉ: 236B Lê Văn Sỹ, Phường 1, Tân Bình, Thành phố Hồ Chí Minh. Điện thoại: 0396971157.</div>
            </footer>

            {/* MODAL CHỌN SỐ LƯỢNG MUA NHANH TÍCH HỢP */}
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
}