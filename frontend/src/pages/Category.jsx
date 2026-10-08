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
    const [filterType, setFilterType] = useState('all'); // all, price_asc, price_desc, sale, bestseller

    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';

    // Khi có từ khóa tìm kiếm trên Navbar, reset bộ lọc về mặc định
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

    // ==========================================
    // LOGIC LỌC VÀ SẮP XẾP SẢN PHẨM
    // ==========================================
    let filteredProducts = [...products];

    // 1. Lọc theo tìm kiếm
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // 2. Lọc theo Danh mục (Cột trái)
    if (selectedCategory !== 'Tất cả') {
        filteredProducts = filteredProducts.filter(p => 
            p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())
        );
    }

    // 3. Lọc & Sắp xếp theo công cụ (Cột phải)
    if (filterType === 'sale') {
        filteredProducts = filteredProducts.filter(p => p.discount_percent > 0);
    } else if (filterType === 'bestseller') {
        filteredProducts.sort((a, b) => (b.sold || 0) - (a.sold || 0));
    } else if (filterType === 'price_asc') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (filterType === 'price_desc') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    // Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Style cho nút Filter
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
            
            {/* LAYOUT 2 CỘT */}
            <div style={{ display: 'flex', gap: '20px', maxWidth: '1200px', margin: '20px auto', padding: '0 20px', alignItems: 'flex-start' }}>
                
                {/* ================= CỘT TRÁI: DANH MỤC ================= */}
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

                {/* ================= CỘT PHẢI: BỘ LỌC VÀ GRID ================= */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    
                    {/* THANH CÔNG CỤ FILTER */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', marginBottom: '20px', gap: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#555', marginRight: '5px' }}>Sắp xếp theo:</span>
                        
                        <button style={filterBtnStyle(filterType === 'all')} onClick={() => { setFilterType('all'); setCurrentPage(1); }}>
                            Tất cả
                        </button>
                        <button style={filterBtnStyle(filterType === 'sale')} onClick={() => { setFilterType('sale'); setCurrentPage(1); }}>
                            Giảm giá
                        </button>
                        <button style={filterBtnStyle(filterType === 'bestseller')} onClick={() => { setFilterType('bestseller'); setCurrentPage(1); }}>
                            Bán chạy
                        </button>
                        
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
                    
                    {/* TIÊU ĐỀ KẾT QUẢ */}
                    <h3 className="section-title" style={{ marginTop: '0' }}>
                        {searchQuery ? ` Kết quả tìm kiếm cho: "${searchQuery}"` : ` ${selectedCategory.toUpperCase()}`}
                    </h3>

                    {/* DANH SÁCH SẢN PHẨM */}
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
                                {currentProducts.map(product => (
                                    <div key={product._id} className="product-card" style={{ padding: '10px' }}>
                                        {product.discount_percent > 0 && <div className="badge-discount">-{product.discount_percent}%</div>}
                                        <div className="product-image-container" onClick={() => navigate(`/product/${product._id}`)} style={{cursor: 'pointer', height: '160px'}}>
                                            {product.image_url ? <img src={product.image_url} alt={product.name} /> : <span style={{color: '#ccc'}}>Chưa có ảnh</span>}
                                        </div>
                                        <h3 className="product-title" style={{fontSize: '14px', height: '38px'}} title={product.name}>{product.name}</h3>
                                        <p className="product-price" style={{fontSize: '16px'}}>
                                            {product.price.toLocaleString()} đ
                                            {product.discount_percent > 0 && <span style={{textDecoration: 'line-through', color: '#999', fontSize: '12px', display: 'block'}}>{(product.price / (1 - product.discount_percent/100)).toLocaleString()} đ</span>}
                                        </p>
                                        <div className="product-sold" style={{marginBottom: '5px'}}>Đã bán: {product.sold || 0}</div>
                                        <div style={{ display: 'flex', gap: '5px', marginTop: 'auto' }}>
                                            <button style={{ flex: 1, padding: '6px', fontSize: '13px', background: '#e9ecef', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate(`/product/${product._id}`)}>Xem</button>
                                            <button style={{ flex: 1, padding: '6px', fontSize: '13px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleAddToCart(product)}>Mua</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* PHÂN TRANG */}
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
        </div>
    );
}