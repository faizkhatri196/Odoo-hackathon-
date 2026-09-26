import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { deliveryService } from '../../services/deliveryService';

export const DeliveryForm = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await deliveryService.createDelivery({
        customer: { name: customerName },
        items: [],
      });
      navigate('/deliveries');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating delivery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="New Delivery Order" description="Prepare customer dispatch order." />
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Customer Name</label>
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Delivery Draft'}
        </button>
      </form>
    </div>
  );
};
