// Tệp: frontend/src/pages/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Admin.css';

export default function ProductManagement() {
    const navigate = useNavigate();
    const role = sessionStorage.getItem('role');
    const [products, setProducts] = useState([]);
    
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    
    const [formData, setFormData] = useState({ 
        product_code: '', 
        name: '', 
        category: '',
        supplier: '', 
        price: '', 
        discount_percent: '', 
        discount_duration: '', 
        description: '',
        image_url: '' 
    });

    useEffect(() => {
        if (role !== 'Admin' && role !== 'Staff') {
            alert("Bạn không có quyền truy cập trang này!");
            navigate('/');
            return;
        }
        fetchProducts();
    }, [role, navigate]);

    // BẮT LỖI 401 KHI TẢI SẢN PHẨM
    const fetchProducts = async () => {
        try {
            const res = await api.get('/products/');
            setProducts(res.data.products);
        } catch (error) {
            if (error.response?.status === 401) {
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
                sessionStorage.clear();
                navigate('/login');
            } else {
                console.error("Lỗi lấy danh sách SP:", error);
            }
        }
    };

    const generateProductCode = (category) => {
        let prefix = 'SP';
        if (category === 'Bút') prefix = 'BUT';
        else if (category === 'Vở') prefix = 'VO';
        else if (category === 'Giấy') prefix = 'GIA';
        else if (category === 'Sách') prefix = 'SAC';
        else if (category === 'Tài liệu') prefix = 'TLI';
        else if (category === 'Bộ dụng cụ') prefix = 'BDC';
        else if (category === 'Khác') prefix = 'KHA';
        
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}${randomStr}`;
    };

    const handleOpenAdd = () => {
        setIsEditing(false);
        setFormData({ 
            product_code: '', 
            name: '', 
            category: '',
            supplier: '', 
            price: '', 
            discount_percent: '', 
            discount_duration: '', 
            description: '',
            image_url: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (product) => {
        setIsEditing(true);
        setEditId(product._id);
        setFormData({
            product_code: product.product_code || '',
            name: product.name,
            category: product.category,
            supplier: product.supplier || '',
            price: product.price,
            discount_percent: product.discount_percent || '',
            discount_duration: product.discount_duration || '',
            description: product.description || '',
            image_url: product.image_url || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
            try {
                await api.delete(`/products/delete/${id}`);
                fetchProducts(); 
            } catch (err) {
                alert("Lỗi khi xóa sản phẩm!");
            }
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const isCurrentlyActive = currentStatus !== false; 
        const actionText = isCurrentlyActive ? "NGỪNG BÁN" : "MỞ BÁN LẠI";
        
        if (window.confirm(`Bạn có chắc muốn ${actionText} sản phẩm này?\n(Sản phẩm ngừng bán sẽ bị ẩn khỏi trang của khách hàng)`)) {
            try {
                await api.put(`/products/${id}/toggle-status`);
                fetchProducts(); 
            } catch (error) {
                alert("Lỗi khi cập nhật trạng thái!");
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                category: formData.category,
                price: Number(formData.price) || 0,
                stock: 1000, 
                description: formData.description || "",
                image_url: formData.image_url || "",
                product_code: formData.product_code || "",
                supplier: formData.supplier || "",
                discount_percent: Number(formData.discount_percent) || 0,
                discount_duration: Number(formData.discount_duration) || 0
            };

            if (isEditing) {
                await api.put(`/products/update/${editId}`, payload);
            } else {
                await api.post('/products/add', payload);
            }
            setShowModal(false);
            fetchProducts();
            
        } catch (err) {
            // TỰ ĐỘNG VĂNG RA NẾU HẾT HẠN TOKEN (401)
            if (err.response?.status === 401) {
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
                sessionStorage.clear();
                navigate('/login');
                return;
            }

            const detail = err.response?.data?.detail;
            let errorMsg = "Lỗi xác thực dữ liệu với Server.";
            
            if (Array.isArray(detail)) {
                errorMsg = detail.map(d => `❌ Trường [${d.loc[d.loc.length - 1]}]: ${d.msg}`).join('\n');
            } else if (typeof detail === 'string') {
                errorMsg = detail;
            }

            alert(`Lỗi khi lưu sản phẩm!\nChi tiết từ Backend:\n\n${errorMsg}`);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Quản lý Sản phẩm (Dành cho {role})</h2>
                <div>
                    <button className="btn-primary" onClick={handleOpenAdd}>+ Thêm Sản phẩm</button>
                    <button className="btn-action" style={{marginLeft: '10px'}} onClick={() => navigate('/')}>Về Trang chủ</button>
                </div>
            </div>

            <div style={{ paddingRight: '150px' }}>
                <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '12%' }}>Mã SP</th>
                            <th style={{ width: '30%' }}>Tên sản phẩm</th>
                            <th style={{ width: '15%' }}>Danh mục</th>
                            <th style={{ width: '18%' }}>Nhà cung cấp</th>
                            <th style={{ width: '15%' }}>Giá</th>
                            <th style={{ width: '10%' }}>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => {
                            const isActive = p.is_active !== false; 
                            return (
                                <tr key={p._id} style={{ opacity: isActive ? 1 : 0.6 }}>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <strong>{p.product_code || '---'}</strong>
                                    </td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.name}>
                                        {p.name}
                                    </td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.category}
                                    </td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.supplier}>
                                        {p.supplier || '---'}
                                    </td>
                                    <td>{p.price.toLocaleString()} VNĐ</td>
                                    
                                    <td>
                                        <span 
                                            onClick={() => handleToggleStatus(p._id, p.is_active)}
                                            style={{ 
                                                padding: '5px 10px', 
                                                borderRadius: '20px', 
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                backgroundColor: isActive ? '#d4edda' : '#f8d7da',
                                                color: isActive ? '#155724' : '#721c24',
                                                cursor: 'pointer',
                                                display: 'inline-block'
                                            }}
                                            title="Click để Mở bán / Ngừng bán"
                                        >
                                            {isActive ? "Đang bán" : "Ngừng bán"}
                                        </span>
                                    </td>

                                    <td style={{ border: 'none', background: 'transparent', padding: '0 0 0 20px', width: '1px', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => handleOpenEdit(p)} 
                                                style={{ backgroundColor: '#ffc107', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            >
                                                UP
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(p._id)} 
                                                style={{ backgroundColor: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            >
                                                DEL
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content-pro" style={{ width: '550px' }}>
                        <div className="modal-header-pro">
                            <h3>{isEditing ? "Cập nhật Sản phẩm" : "Thêm Sản phẩm mới"}</h3>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="modal-body-pro" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                
                                <div className="form-group-pro">
                                    <label>Tên sản phẩm <span style={{color: 'red'}}>*</span></label>
                                    <input 
                                        type="text" 
                                        className="form-control-pro" 
                                        required 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                        placeholder="Nhập tên sản phẩm..."
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#444', fontSize: '14px' }}>Danh mục <span style={{color: 'red'}}>*</span></label>
                                        <select 
                                            className="form-control-pro" 
                                            required 
                                            value={formData.category} 
                                            onChange={e => {
                                                const cat = e.target.value;
                                                setFormData({
                                                    ...formData, 
                                                    category: cat,
                                                    product_code: isEditing ? formData.product_code : generateProductCode(cat)
                                                });
                                            }}
                                        >
                                            <option value="" disabled>-- Chọn danh mục --</option>
                                            <option value="Bút">Bút</option>
                                            <option value="Vở">Vở</option>
                                            <option value="Giấy">Giấy</option>
                                            <option value="Sách">Sách</option>
                                            <option value="Tài liệu">Tài liệu</option>
                                            <option value="Bộ dụng cụ">Bộ dụng cụ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#444', fontSize: '14px' }}>Nhà cung cấp</label>
                                        <input 
                                            type="text" 
                                            className="form-control-pro" 
                                            value={formData.supplier} 
                                            onChange={e => setFormData({...formData, supplier: e.target.value})} 
                                            placeholder="VD: Thiên Long..."
                                        />
                                    </div>
                                </div>

                                <div className="form-group-pro">
                                    <label>Ảnh minh họa (URL)</label>
                                    <input 
                                        type="text" 
                                        className="form-control-pro" 
                                        value={formData.image_url} 
                                        onChange={e => setFormData({...formData, image_url: e.target.value})} 
                                        placeholder="Nhập link ảnh (VD: https://...)"
                                    />
                                </div>
                                
                                <div className="form-group-pro">
                                    <label>Giá bán (VNĐ) <span style={{color: 'red'}}>*</span></label>
                                    <input 
                                        type="number" 
                                        className="form-control-pro" 
                                        required min="1" 
                                        value={formData.price} 
                                        onChange={e => setFormData({...formData, price: e.target.value})} 
                                        placeholder="VD: 15000"
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '15px', marginBottom: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#444', fontSize: '14px' }}>Giảm giá (%)</label>
                                        <input 
                                            type="number" 
                                            className="form-control-pro" 
                                            min="0" max="100"
                                            value={formData.discount_percent} 
                                            onChange={e => setFormData({...formData, discount_percent: e.target.value})} 
                                            placeholder="VD: 10"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#444', fontSize: '14px' }}>Thời gian giảm (giờ)</label>
                                        <input 
                                            type="number" 
                                            className="form-control-pro" 
                                            min="0"
                                            value={formData.discount_duration} 
                                            onChange={e => setFormData({...formData, discount_duration: e.target.value})} 
                                            placeholder="VD: 72"
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-group-pro">
                                    <label>Mô tả chi tiết</label>
                                    <textarea 
                                        className="form-control-pro" 
                                        rows="3" 
                                        value={formData.description} 
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                        placeholder="Nhập mô tả..."
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="modal-footer-pro">
                                <button type="button" className="btn-cancel-pro" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                                <button type="submit" className="btn-save-pro">{isEditing ? "Cập nhật" : "Lưu sản phẩm"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}