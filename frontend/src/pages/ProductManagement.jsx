import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Admin.css';

export default function ProductManagement() {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
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
                <h2>Quản lý Sản phẩm (Dành cho {role})</h2>
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
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(p => (
                        <tr key={p._id}>
                            <td>{p.name}</td>
                            <td>{p.category}</td>
                            <td>{p.price.toLocaleString()} VNĐ</td>
                            <td>{p.stock}</td>
                            <td>
                                <button className="btn-action btn-edit" onClick={() => handleOpenEdit(p)}>Sửa</button>
                                <button className="btn-action btn-delete" onClick={() => handleDelete(p._id)}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal Form Thêm/Sửa */}
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