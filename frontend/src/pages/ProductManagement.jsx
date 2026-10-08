// Tệp: frontend/src/pages/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Admin.css';

export default function ProductManagement() {
    const navigate = useNavigate();
    const role = sessionStorage.getItem('role');
    const [products, setProducts] = useState([]);
    
    // State quản lý form
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ name: '', category: '', price: '', stock: '', description: '' });

    useEffect(() => {
        if (role !== 'Admin' && role !== 'Staff') {
            alert("Bạn không có quyền truy cập trang này!");
            navigate('/');
            return;
        }
        fetchProducts();
    }, [role, navigate]);

    const fetchProducts = async () => {
        const res = await api.get('/products/');
        setProducts(res.data.products);
    };

    const handleOpenAdd = () => {
        setIsEditing(false);
        setFormData({ name: '', category: '', price: '', stock: '', description: '' });
        setShowModal(true);
    };

    const handleOpenEdit = (product) => {
        setIsEditing(true);
        setEditId(product._id);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            description: product.description || ''
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
        const isCurrentlyActive = currentStatus !== false; // Mặc định là true nếu undefined
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
            if (isEditing) {
                await api.put(`/products/update/${editId}`, formData);
            } else {
                await api.post('/products/add', formData);
            }
            setShowModal(false);
            fetchProducts();
        } catch (err) {
            alert("Lỗi khi lưu sản phẩm! Vui lòng kiểm tra lại dữ liệu nhập.");
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Quản lý Sản phẩm </h2>
                <div>
                    <button className="btn-primary" onClick={handleOpenAdd}>+ Thêm Sản phẩm</button>
                    <button className="btn-action" style={{marginLeft: '10px'}} onClick={() => navigate('/')}>Về Trang chủ</button>
                </div>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Tên sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Giá</th>
                        <th>Tồn kho</th>
                        <th>Trạng thái</th> {/* Đã thêm cột Trạng thái */}
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => {
                        const isActive = p.is_active !== false; 
                        
                        return (
                            <tr key={p._id} style={{ opacity: isActive ? 1 : 0.6 }}>
                                <td>{p.name}</td>
                                <td>{p.category}</td>
                                <td>{p.price.toLocaleString()} VNĐ</td>
                                <td>{p.stock}</td>
                                
                                {/* HIỂN THỊ CỘT TRẠNG THÁI */}
                                <td>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        backgroundColor: isActive ? '#d4edda' : '#f8d7da',
                                        color: isActive ? '#155724' : '#721c24'
                                    }}>
                                        {isActive ? "Đang bán" : "Ngừng bán"}
                                    </span>
                                </td>

                                {/* HIỂN THỊ CÁC NÚT HÀNH ĐỘNG */}
                                <td>
                                    <button className="btn-action btn-edit" style={{ marginRight: '5px' }} onClick={() => handleOpenEdit(p)}>Sửa</button>
                                    <button className="btn-action btn-delete" style={{ marginRight: '5px' }} onClick={() => handleDelete(p._id)}>Xóa</button>
                                    
                                    {/* Nút Bật / Tắt trạng thái */}
                                    <button 
                                        className="btn-action"
                                        style={{ backgroundColor: isActive ? '#ffc107' : '#28a745', color: isActive ? '#000' : '#fff' }}
                                        onClick={() => handleToggleStatus(p._id, p.is_active)}
                                    >
                                        {isActive ? "Tạm ngưng" : "Mở bán"}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Modal Form Thêm/Sửa (Giữ nguyên hoàn toàn) */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{isEditing ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h3>
                        <form onSubmit={handleSave}>
                            <label>Tên sản phẩm:</label>
                            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            
                            <label>Danh mục:</label>
                            <input type="text" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                            
                            <label>Giá (VNĐ):</label>
                            <input type="number" required min="1" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                            
                            <label>Số lượng tồn kho:</label>
                            <input type="number" required min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                            
                            <label>Mô tả:</label>
                            <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                            
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}