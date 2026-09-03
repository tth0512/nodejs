// frontend/src/components/FollowRequests.jsx
import { useState, useEffect, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getFollowRequests, acceptFollowRequest, rejectFollowRequest } from '../api/followApi.js';
import { toast } from 'react-toastify';
import './FollowRequests.css';

function FollowRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFollowRequests();
      setRequests(res.data.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requesterId) => {
    setProcessingId(requesterId);
    try {
      await acceptFollowRequest(requesterId);
      setRequests((prev) => prev.filter((r) => r._id !== requesterId));
      toast.success('Đã chấp nhận yêu cầu follow.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý yêu cầu.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requesterId) => {
    setProcessingId(requesterId);
    try {
      await rejectFollowRequest(requesterId);
      setRequests((prev) => prev.filter((r) => r._id !== requesterId));
      toast.info('Đã từ chối yêu cầu follow.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý yêu cầu.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="freq-section" aria-label="Follow Requests">
      <div className="freq-header">
        <FiLock className="freq-header__icon" />
        <h4 className="freq-header__title">
          Yêu cầu follow
          {requests.length > 0 && <span className="freq-badge">{requests.length}</span>}
        </h4>
      </div>

      {loading && <p className="freq-empty">Đang tải...</p>}

      {!loading && requests.length === 0 && (
        <p className="freq-empty">Không có yêu cầu follow nào đang chờ.</p>
      )}

      {!loading && requests.length > 0 && (
        <div className="freq-list">
          {requests.map((r) => (
            <div key={r._id} className="freq-item" id={`freq-item-${r._id}`}>
              <div
                className="freq-item__user"
                onClick={() => navigate(`/users/${r._id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="freq-avatar">
                  {r.avatarUrl
                    ? <img src={r.avatarUrl} alt={r.username} />
                    : <span>{(r.username || 'U').charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className="freq-item__info">
                  <span className="freq-item__name">{r.fullName || r.username}</span>
                  <span className="freq-item__username">@{r.username}</span>
                </div>
              </div>
              <div className="freq-item__actions">
                <button
                  id={`accept-btn-${r._id}`}
                  className="freq-btn freq-btn--accept"
                  onClick={() => handleAccept(r._id)}
                  disabled={processingId === r._id}
                  title="Chấp nhận"
                >
                  <FiCheckCircle />
                  <span>Chấp nhận</span>
                </button>
                <button
                  id={`reject-btn-${r._id}`}
                  className="freq-btn freq-btn--reject"
                  onClick={() => handleReject(r._id)}
                  disabled={processingId === r._id}
                  title="Từ chối"
                >
                  <FiXCircle />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default FollowRequests;
