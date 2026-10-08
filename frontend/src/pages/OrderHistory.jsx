// Tệp: frontend/src/pages/OrderHistory.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/OrderManagement.css'; 

export default function OrderHistory() {
    const navigate = useNavigate();
    const token = sessionStorage.getItem('access_token');
    const role = sessionStorage.getItem('role');
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [returnOrder, setReturnOrder] = useState(null);
    const [selectedReasons, setSelectedReasons] = useState([]);
    const [returnNote, setReturnNote] = useState('');
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

    // HỘP THOẠI XÁC NHẬN CHUNG (Thay cho alert/window.confirm)
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', order: null, message: '' });

    useEffect(() => {
        if (!token || role !== 'Customer') {
            navigate('/login');
            return;
        }
        fetchMyOrders();
    }, [role, navigate, token]);

    const fetchMyOrders = async () => {
        try {
            const res = await api.get('/orders/my-orders');
            setOrders(res.data.orders);
        } catch (error) {
            console.error("Lỗi khi tải lịch sử", error);
        } finally {
            setLoading(false);
        }
    };

    // Mở hộp thoại xác nhận Hủy / Chỉnh sửa
    const openConfirm = (type, order) => {
        const message = type === 'cancel' 
            ? `Bạn có chắc chắn muốn hủy đơn hàng ${order.order_id} không?`
            : `Bạn có muốn đưa các sản phẩm của đơn ${order.order_id} về lại giỏ hàng để chỉnh sửa không? (Đơn hiện tại sẽ bị hủy)`;
        setConfirmModal({ isOpen: true, type, order, message });
    };

    // Xử lý khi nhấn "Đồng ý"
    const handleConfirmYes = async () => {
        const { type, order } = confirmModal;
        setConfirmModal({ isOpen: false, type: '', order: null, message: '' });
        
        try {
            if (type === 'cancel') {
                await api.put(`/orders/cancel/${order._id}`);
                setActionMessage({ type: 'success', text: `Đã hủy đơn hàng ${order.order_id} thành công.` });
                fetchMyOrders();
                setTimeout(() => setActionMessage({ type: '', text: '' }), 5000);
            } 
            else if (type === 'edit') {
                // 1. Hủy đơn hiện tại
                await api.put(`/orders/cancel/${order._id}`);
                // 2. Thêm lại từng món vào giỏ
                for (const item of order.items) {
                    await api.post('/cart/add', { product_id: item.product_id, quantity: item.quantity });
                }
                // 3. Bay thẳng qua giỏ hàng
                navigate('/cart');
            }
        } catch (error) {
            setActionMessage({ type: 'error', text: "Lỗi xử lý: " + (error.response?.data?.detail || "") });
            setTimeout(() => setActionMessage({ type: '', text: '' }), 5000);
        }
    };

    const handleOpenReturnModal = (order) => {
        setReturnOrder(order);
        setSelectedReasons([]);
        setReturnNote('');
        setActionMessage({ type: '', text: '' });
        setReturnModalOpen(true);
    };

    const handleReasonChange = (reason) => {
        setSelectedReasons(prev => prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]);
    };

    const handleSubmitReturn = () => {
        if (selectedReasons.length === 0) {
            setActionMessage({ type: 'error', text: 'Vui lòng chọn ít nhất 1 lý do!' });
            return;
        }
        setActionMessage({ type: 'success', text: `Yêu cầu hoàn trả đơn ${returnOrder.order_id} đã được gửi!` });
        setTimeout(() => { setReturnModalOpen(false); setReturnOrder(null); }, 3000);
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
        <div className="admin-container" style={{ maxWidth: '900px', margin: '40px auto' }}>
            <div className="admin-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Lịch sử Đơn hàng của bạn</h2>
                <button onClick={() => navigate('/')} style={{ padding: '10px 15px', cursor: 'pointer', borderRadius: '4px', background: '#333', color: '#fff', border: 'none', fontWeight: 'bold' }}>
                    ← Trở về Mua sắm
                </button>
            </div>

            {/* BÁO CÁO TRẠNG THÁI (Thay thế alert) */}
            {actionMessage.text && !isReturnModalOpen && (
                <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '4px', fontWeight: 'bold', fontSize: '15px', background: actionMessage.type === 'error' ? '#f8d7da' : '#d4edda', color: actionMessage.type === 'error' ? '#721c24' : '#155724' }}>
                    {actionMessage.text}
                </div>
            )}

            {loading ? (
                <p style={{ textAlign: 'center', padding: '50px' }}>Đang tải dữ liệu...</p>
            ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>🛒</div>
                    <p style={{ color: '#555', fontSize: '16px' }}>Bạn chưa có đơn hàng nào.</p>
                    <button onClick={() => navigate('/')} style={{ marginTop: '15px', padding: '10px 25px', cursor: 'pointer', background: '#d9534f', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Khám phá Sản phẩm</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {orders.map((order) => (
                        <div key={order._id} style={{ border: '1px solid #eaeaea', borderRadius: '8px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                            <div style={{ padding: '15px 20px', borderBottom: '1px solid #eaeaea', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ color: '#555', fontSize: '14px' }}>
                                    <span style={{ marginRight: '15px' }}>Mã Đơn: <strong style={{ color: '#333' }}>{order.order_id}</strong></span>
                                    <span>Ngày đặt: {order.created_at}</span>
                                </div>
                                <span className={`order-status ${getStatusClass(order.status)}`} style={{ fontWeight: 'bold', padding: '5px 12px', borderRadius: '4px', fontSize: '13px' }}>
                                    {order.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: idx !== order.items.length - 1 ? '15px' : '0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.product_name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                                            ) : (
                                                <div style={{ width: '60px', height: '60px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #eee' }}></div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>{item.product_name}</div>
                                                <div style={{ color: '#777', fontSize: '13px' }}>x{item.quantity}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: '#555' }}>
                                            {(item.price * item.quantity).toLocaleString()} đ
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '15px 20px', borderTop: '1px solid #eaeaea', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    {order.discount_code && order.discount_percent > 0 && (
                                        <div style={{ fontSize: '13px', color: '#28a745', marginBottom: '4px' }}>
                                            ✓ Đã áp dụng mã: <strong>{order.discount_code} (-{order.discount_percent}%)</strong>
                                        </div>
                                    )}
                                    <div style={{ fontSize: '15px' }}>
                                        Thành tiền: <strong style={{ color: '#d9534f', fontSize: '20px', marginLeft: '5px' }}>{order.total_amount.toLocaleString()} đ</strong>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {order.status === 'Hoàn thành' && (
                                        <button onClick={() => handleOpenReturnModal(order)} style={{ padding: '8px 20px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                            Yêu cầu Hoàn trả
                                        </button>
                                    )}
                                    
                                    {/* NÚT CHỈNH SỬA ĐƠN HÀNG MỚI THÊM */}
                                    <button 
                                        onClick={() => order.status === 'Chờ duyệt' && openConfirm('edit', order)}
                                        disabled={order.status !== 'Chờ duyệt'}
                                        style={{ padding: '8px 20px', background: order.status === 'Chờ duyệt' ? '#17a2b8' : '#f1f1f1', color: order.status === 'Chờ duyệt' ? '#fff' : '#a1a1a1', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: order.status === 'Chờ duyệt' ? 'pointer' : 'not-allowed', transition: '0.2s' }}
                                    >
                                        Chỉnh sửa
                                    </button>

                                    {/* NÚT HỦY ĐƠN HÀNG */}
                                    <button 
                                        onClick={() => order.status === 'Chờ duyệt' && openConfirm('cancel', order)}
                                        disabled={order.status !== 'Chờ duyệt'}
                                        style={{ padding: '8px 25px', background: order.status === 'Chờ duyệt' ? '#dc3545' : '#f1f1f1', color: order.status === 'Chờ duyệt' ? '#fff' : '#a1a1a1', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: order.status === 'Chờ duyệt' ? 'pointer' : 'not-allowed', transition: '0.2s' }}
                                    >
                                        Hủy đơn
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL XÁC NHẬN CHUNG (THAY THẾ WINDOW.CONFIRM) */}
            {confirmModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#fff', width: '400px', padding: '25px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Xác nhận</h3>
                        <p style={{ color: '#555', marginBottom: '25px', lineHeight: '1.5' }}>{confirmModal.message}</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                            <button onClick={() => setConfirmModal({ isOpen: false, type: '', order: null, message: '' })} style={{ padding: '10px 20px', border: 'none', borderRadius: '4px', background: '#e9ecef', color: '#333', cursor: 'pointer', fontWeight: 'bold' }}>
                                Hủy bỏ
                            </button>
                            <button onClick={handleConfirmYes} style={{ padding: '10px 20px', border: 'none', borderRadius: '4px', background: confirmModal.type === 'cancel' ? '#dc3545' : '#17a2b8', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                                Đồng ý
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL YÊU CẦU HOÀN TRẢ */}
            {isReturnModalOpen && returnOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#fff', width: '500px', padding: '25px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #eee', paddingBottom: '10px', color: '#333' }}>Yêu cầu Hoàn trả - Đơn {returnOrder.order_id}</h3>
                        {actionMessage.text && (
                            <div style={{ padding: '10px 15px', marginBottom: '15px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', background: actionMessage.type === 'error' ? '#f8d7da' : '#d4edda', color: actionMessage.type === 'error' ? '#721c24' : '#155724' }}>
                                {actionMessage.text}
                            </div>
                        )}
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>Lý do hoàn trả <span style={{fontSize: '13px', fontWeight: 'normal'}}>(có thể chọn nhiều)</span>:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {['Sản phẩm bị lỗi kỹ thuật / Không hoạt động', 'Giao sai sản phẩm (sai màu, sai mẫu mã)', 'Sản phẩm thực tế không giống mô tả', 'Thiếu phụ kiện / Thiếu hàng tặng kèm', 'Nghi ngờ hàng giả, hàng nhái'].map(reason => (
                                    <label key={reason} style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px' }}>
                                        <input type="checkbox" checked={selectedReasons.includes(reason)} onChange={() => handleReasonChange(reason)} style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }} />
                                        <span style={{ color: '#333' }}>{reason}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: '25px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>Ghi chú thêm (không bắt buộc):</p>
                            <textarea rows="3" value={returnNote} onChange={(e) => setReturnNote(e.target.value)} placeholder="Mô tả chi tiết tình trạng sản phẩm..." style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setReturnModalOpen(false)} style={{ padding: '10px 20px', border: 'none', borderRadius: '4px', background: '#e9ecef', color: '#333', cursor: 'pointer', fontWeight: 'bold' }} disabled={actionMessage.type === 'success'}>Hủy bỏ</button>
                            <button onClick={handleSubmitReturn} disabled={actionMessage.type === 'success'} style={{ padding: '10px 20px', border: 'none', borderRadius: '4px', background: actionMessage.type === 'success' ? '#6c757d' : '#d9534f', color: '#fff', cursor: actionMessage.type === 'success' ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Gửi yêu cầu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}