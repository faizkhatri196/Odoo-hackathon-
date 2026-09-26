import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Loading } from '../../components/Loading';
import { deliveryService } from '../../services/deliveryService';

export const DeliveryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  const load = async () => {
    try {
      const res = await deliveryService.getDeliveryById(id);
      setDelivery(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleValidate = async () => {
    setValidating(true);
    try {
      await deliveryService.validateDelivery(id);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Delivery validation failed');
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <Loading text="Loading delivery details..." />;
  if (!delivery) return <div>Delivery not found.</div>;

  return (
    <div>
      <PageHeader
        title={`Delivery ${delivery.deliveryNumber}`}
        description={`Customer: ${delivery.customer?.name} | Status: ${delivery.status}`}
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
            {delivery.status !== 'done' && (
              <button className="btn-primary" onClick={handleValidate} disabled={validating}>
                {validating ? 'Dispatching...' : 'Validate & Dispatch'}
              </button>
            )}
            <button className="btn-secondary" onClick={() => navigate('/deliveries')}>Back</button>
          </div>
        }
      />

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Delivery State</h3>
          <StatusBadge status={delivery.status} />
        </div>
      </div>
    </div>
  );
};
