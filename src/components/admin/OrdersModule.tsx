import React, { useEffect, useState } from 'react';
import { DollarSign, CheckCircle2, RefreshCw, ShoppingBag, CreditCard, Mail, ShieldCheck, Search } from 'lucide-react';
import { PayPalOrder } from '../../types';

interface OrdersModuleProps {
  hideTable?: boolean;
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({ hideTable = false }) => {
  const [orders, setOrders] = useState<PayPalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sellerPaypalEmail, setSellerPaypalEmail] = useState('nightrunna842@gmail.com');
  const [editingEmail, setEditingEmail] = useState('nightrunna842@gmail.com');
  const [isEditing, setIsEditing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrdersAndSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (data.paypalSettings?.sellerPaypalEmail) {
          setSellerPaypalEmail(data.paypalSettings.sellerPaypalEmail);
          setEditingEmail(data.paypalSettings.sellerPaypalEmail);
          localStorage.setItem('NIGHTRUNNA_PERSONAL_PAYPAL', data.paypalSettings.sellerPaypalEmail);
        }
      } else {
        setError(data.error || 'Failed to load order history.');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Connection error loading order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndSettings();
  }, []);

  const handleSavePaypalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmail.trim() || !editingEmail.includes('@')) {
      alert('Please enter a valid PayPal email address.');
      return;
    }

    setSavingSettings(true);
    setSaveSuccessMsg('');
    try {
      const res = await fetch('/api/paypal/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerPaypalEmail: editingEmail.trim(), currency: 'USD' })
      });
      const data = await res.json();
      if (data.success) {
        setSellerPaypalEmail(editingEmail.trim());
        localStorage.setItem('NIGHTRUNNA_PERSONAL_PAYPAL', editingEmail.trim());
        setIsEditing(false);
        setSaveSuccessMsg('✓ PayPal seller payout account updated successfully!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to update PayPal settings.');
      }
    } catch (err) {
      console.error('Error updating PayPal settings:', err);
      alert('Failed to update settings. Please check your connection.');
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredOrders = orders.filter(o => 
    !searchQuery || 
    (o.beatTitle && o.beatTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.buyerEmail && o.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.buyerName && o.buyerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.transactionId && o.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (o.orderId && o.orderId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

  return (
    <div className="space-y-8">
      {/* PAYPAL SELLER PAYOUT CONNECTION CARD */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">PayPal Seller Payout Connection</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> BEATSTARS ROUTING ACTIVE
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                All beat sales & license purchases route directly to this connected seller PayPal account.
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => { setEditingEmail(sellerPaypalEmail); setIsEditing(true); }}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 rounded-xl transition-all border border-neutral-700"
            >
              Configure Account
            </button>
          )}
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {saveSuccessMsg}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSavePaypalSettings} className="mt-6 space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Seller PayPal Email / Payout Account
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={editingEmail}
                  onChange={(e) => setEditingEmail(e.target.value)}
                  placeholder="nightrunna842@gmail.com"
                  required
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
                Supports standard Personal and Business PayPal accounts. PayPal's direct payee routing will send buyer funds directly to this account email upon order completion.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Save Payout Account
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Connected Seller Email
              </span>
              <span className="font-mono text-sm font-bold text-amber-400 break-all">
                {sellerPaypalEmail}
              </span>
            </div>

            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Integration Architecture
              </span>
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                BeatStars Personal/Business Payee Routing
              </span>
            </div>

            <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                External Requirements
              </span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Zero Gmail/GCP/Resend Dependencies
              </span>
            </div>
          </div>
        )}
      </div>

      {/* METRICS METERS */}
      {!hideTable && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex justify-between items-center text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Beat Sales</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ${totalRevenue.toFixed(2)} <span className="text-xs text-neutral-500 font-sans">USD</span>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex justify-between items-center text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completed Orders</span>
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {orders.length}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <div className="flex justify-between items-center text-neutral-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Seller Payout Account</span>
              <Mail className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs font-bold text-amber-400 font-mono truncate mt-2">
              {sellerPaypalEmail}
            </div>
          </div>
        </div>
      )}

      {/* BEAT SALES ORDERS HISTORY TABLE */}
      {!hideTable && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Beat Sales & Orders History</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Completed transactions processed via PayPal and routed to <span className="font-mono text-amber-400">{sellerPaypalEmail}</span>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by beat, email, ID..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <button
                onClick={fetchOrdersAndSettings}
                disabled={loading}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-all shrink-0"
                title="Refresh Orders"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-neutral-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
              Loading beat sales order history...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center bg-neutral-950/40 border border-neutral-800/80 rounded-2xl">
              <ShoppingBag className="w-8 h-8 text-neutral-600 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-bold text-neutral-400">No beat sales recorded yet.</p>
              <p className="text-xs text-neutral-600 mt-1">
                When customers purchase beats via PayPal, completed orders will log here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Transaction / Order ID</th>
                    <th className="pb-3 px-3">Beat Purchased</th>
                    <th className="pb-3 px-3">Buyer Information</th>
                    <th className="pb-3 px-3 text-right">Amount Paid</th>
                    <th className="pb-3 px-3">Payout Account</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-800/30 transition-all">
                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                        {order.transactionId || order.orderId}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white whitespace-nowrap">
                        {order.beatTitle}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-neutral-200">{order.buyerName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{order.buyerEmail}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-extrabold text-emerald-400 whitespace-nowrap">
                        ${Number(order.amount).toFixed(2)} {order.currency || 'USD'}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[11px] text-amber-400 whitespace-nowrap">
                        {order.sellerPayoutAccount || sellerPaypalEmail}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {order.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                        {order.timestamp ? new Date(order.timestamp).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersModule;
