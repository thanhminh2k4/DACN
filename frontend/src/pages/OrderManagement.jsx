// Tệp: frontend/src/pages/ManageOrders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Admin.css'; 
import '../styles/OrderManagement.css';

export default function OrderManagement() {
    const navigate = useNavigate();
    const role = sessionStorage.getItem('role');
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null, newStatus: '' });
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (role !== 'Admin' && role !== 'Staff') {
            navigate('/');
            return;
        }
        fetchOrders();
    }, [role, navigate]);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/admin/all');
            setOrders(res.data.orders);
        } catch (error) {
            console.error("Lỗi khi tải đơn hàng", error);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setActionMessage({ type, text });
        setTimeout(() => setActionMessage({ type: '', text: '' }), 4000);
    };

    const handleStatusSelect = (orderId, currentStatus, newStatus) => {
        if (currentStatus === newStatus) return;
        setConfirmModal({ isOpen: true, orderId, newStatus });
    };

    const handleConfirmUpdate = async () => {
        const { orderId, newStatus } = confirmModal;
        setConfirmModal({ isOpen: false, orderId: null, newStatus: '' });
        
        try {
            await api.put(`/orders/admin/update/${orderId}`, { status: newStatus });
            showMessage('success', `Đã cập nhật đơn hàng thành "${newStatus}"!`);
            fetchOrders(); 
        } catch (error) {
            showMessage('error', 'Lỗi khi cập nhật trạng thái!');
            fetchOrders(); 
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Chờ duyệt': return 'status-pending';
            case 'Đang giao': return 'status-shipping';
            case 'Hoàn thành': return 'status-completed';
            case 'Đã hủy': return 'status-canceled';
            default: return '';
        }
    };

    return (
        <div className="admin-container" style={{ maxWidth: '1200px', margin: '40px auto' }}>
            <div className="admin-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Quản lý Đơn hàng</h2>
                <button 
                    onClick={() => navigate('/')} 
                    style={{ padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ← Về Trang chủ
                </button>
            </div>

            {actionMessage.text && (
                <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '4px', fontWeight: 'bold', background: actionMessage.type === 'error' ? '#f8d7da' : '#d4edda', color: actionMessage.type === 'error' ? '#721c24' : '#155724' }}>
                    {actionMessage.text}
                </div>
            )}

            {loading ? (
                <p style={{ textAlign: 'center', padding: '50px' }}>Đang tải danh sách đơn hàng...</p>
            ) : (
                <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8f9fa' }}>
                            <tr>
                                <th style={{ padding: '15px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Mã Đơn</th>
                                <th style={{ padding: '15px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Ngày đặt</th>
                                <th style={{ padding: '15px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Khách hàng</th>
                                <th style={{ padding: '15px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Sản phẩm</th>
                                <th style={{ padding: '15px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Tổng tiền</th>
                                <th style={{ padding: '15px', borderBottom: '2px solid #eee', textAlign: 'left' }}>Trạng thái</th>
                                <th style={{ padding: '15px', borderBottom: '2px solid #eee', textAlign: 'center' }}>Cập nhật</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px' }}>
                                        <span 
                                            onClick={() => setSelectedOrder(order)}
                                            style={{ fontWeight: 'bold', color: '#333', cursor: 'pointer', transition: '0.2s' }}
                                            onMouseOver={(e) => e.target.style.color = '#0275d8'}
                                            onMouseOut={(e) => e.target.style.color = '#333'}
                                            title="Nhấn để xem chi tiết đơn hàng"
                                        >
                                            {order.order_id}
                                        </span>
                                    </td>
                                    
                                    <td style={{ padding: '15px', color: '#555', fontSize: '14px' }}>{order.created_at}</td>
                                    
                                    <td style={{ padding: '15px' }}>
                                        <strong style={{ color: '#333' }}>{order.fullname || order.username}</strong>
                                    </td>
                                    
                                    <td style={{ padding: '15px' }}>
                                        <ul style={{ paddingLeft: '15px', margin: 0, color: '#555', fontSize: '14px' }}>
                                            {order.items.map((item, idx) => (
                                                <li key={idx} style={{ marginBottom: '5px' }}>
                                                    {item.product_name} (x{item.quantity})
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    
                                    <td style={{ padding: '15px' }}>
                                        <strong style={{ color: '#d9534f' }}>{order.total_amount.toLocaleString()} đ</strong>
                                    </td>
                                    
                                    <td style={{ padding: '15px' }}>
                                        <span className={`order-status ${getStatusClass(order.status)}`} style={{ padding: '5px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                                            {order.status}
                                        </span>
                                    </td>
                                    
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <select 
                                            value={order.status}
                                            onChange={(e) => handleStatusSelect(order._id, order.status, e.target.value)}
                                            disabled={order.status === 'Hoàn thành' || order.status === 'Đã hủy'}
                                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', cursor: (order.status === 'Hoàn thành' || order.status === 'Đã hủy') ? 'not-allowed' : 'pointer' }}
                                        >
                                            <option value="Chờ duyệt">Chờ duyệt</option>
                                            <option value="Đang giao">Đang giao</option>
                                            <option value="Hoàn thành">Hoàn thành</option>
                                            <option value="Đã hủy">Hủy đơn</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            {selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#fff', width: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#333' }}>Thông tin Đơn hàng: {selectedOrder.order_id}</h2>
                            <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>&times;</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
                            <div>
                                <h4 style={{ margin: '0 0 15px 0', color: '#0275d8' }}>Thông tin Khách hàng</h4>
                                <p style={{ margin: '5px 0', color: '#555' }}><strong>Họ tên:</strong> {selectedOrder.fullname || selectedOrder.username}</p>
                                <p style={{ margin: '5px 0', color: '#555' }}><strong>Email:</strong> {selectedOrder.email || <span style={{color: '#999', fontStyle: 'italic'}}>Chưa cập nhật</span>}</p>
                                <p style={{ margin: '5px 0', color: '#555' }}><strong>SĐT:</strong> {selectedOrder.phone}</p>
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 15px 0', color: '#0275d8' }}>Thông tin Giao hàng</h4>
                                <p style={{ margin: '5px 0', color: '#555' }}><strong>Địa chỉ:</strong> {selectedOrder.shipping_address}</p>
                                <p style={{ margin: '5px 0', color: '#555' }}><strong>Phương thức thanh toán:</strong> <br/> {selectedOrder.payment_method || 'Thanh toán khi nhận hàng (COD)'}</p>
                            </div>
                        </div>

                        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Danh sách Sản phẩm</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                            <thead style={{ background: '#f1f1f1' }}>
                                <tr>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Mã SP</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Tên sản phẩm</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Danh mục</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Số lượng</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Đơn giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedOrder.items.map((item, idx) => (
                                    <tr key={idx}>
                                        {/* HIỂN THỊ TRỌN VẸN MÃ SẢN PHẨM */}
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#0275d8' }}>
                                             {item.ma_sp_hien_thi || item.product_id}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#333' }}>
                                            {item.product_name}
                                        </td>
                                        {/* HIỂN THỊ DANH MỤC */}
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', color: '#555' }}>
                                            {item.category || <span style={{color: '#aaa'}}>---</span>}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                                            {item.quantity}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', color: '#d9534f', fontWeight: 'bold' }}>
                                            {item.price.toLocaleString()} đ
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ textAlign: 'right', fontSize: '16px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
                            <span style={{ color: '#555', marginRight: '10px' }}>Tổng thanh toán:</span>
                            <strong style={{ color: '#d9534f', fontSize: '22px' }}>{selectedOrder.total_amount.toLocaleString()} VNĐ</strong>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <button onClick={() => setSelectedOrder(null)} style={{ padding: '10px 30px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN CHUYỂN TRẠNG THÁI */}
            {confirmModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#fff', width: '400px', padding: '25px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Xác nhận Cập nhật</h3>
                        <p style={{ color: '#555', marginBottom: '25px', lineHeight: '1.5' }}>
                            {confirmModal.newStatus === 'Đã hủy' 
                                ? 'Bạn có chắc chắn muốn HỦY đơn hàng này? Số lượng sản phẩm sẽ được tự động hoàn lại vào kho.' 
                                : `Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang "${confirmModal.newStatus}"?`}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                            <button onClick={() => { setConfirmModal({ isOpen: false, orderId: null, newStatus: '' }); fetchOrders(); }} style={{ padding: '10px 20px', border: 'none', borderRadius: '4px', background: '#e9ecef', color: '#333', cursor: 'pointer', fontWeight: 'bold' }}>Hủy bỏ</button>
                            <button onClick={handleConfirmUpdate} style={{ padding: '10px 20px', border: 'none', borderRadius: '4px', background: confirmModal.newStatus === 'Đã hủy' ? '#dc3545' : '#0275d8', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}