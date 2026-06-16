import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, ChevronDown, ChevronUp, Settings2, ShoppingBag, Gift, Package, ShoppingCart, User, Star } from 'lucide-react';

const ALL_NAV_ITEMS: { key: string; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'shop', label: 'Shop', icon: <ShoppingBag size={14} />, desc: 'Product catalog page' },
  { key: 'offers', label: 'Offers', icon: <Gift size={14} />, desc: 'Exclusive deals & promotions' },
  { key: 'orders', label: 'Orders', icon: <Package size={14} />, desc: 'Order history & tracking' },
  { key: 'vip_lounge', label: 'VIP Lounge', icon: <Crown size={14} />, desc: 'Premium rewards & daily spin' },
  { key: 'cart', label: 'Cart', icon: <ShoppingCart size={14} />, desc: 'Shopping cart & checkout' },
  { key: 'profile', label: 'Profile', icon: <User size={14} />, desc: 'Account settings & profile' },
];

function getStoredPerms(userId: string): Record<string, boolean> {
  try {
    const s = localStorage.getItem(`playpoints_nav_perms_${userId}`);
    if (s) return JSON.parse(s);
  } catch {}
  return { shop: true, offers: true, orders: true, vip_lounge: true, cart: true, profile: true };
}

function savePerms(userId: string, perms: Record<string, boolean>) {
  localStorage.setItem(`playpoints_nav_perms_${userId}`, JSON.stringify(perms));
  window.dispatchEvent(new CustomEvent('nav-permissions-updated', { detail: { userId, perms } }));
}

interface NavPermUser {
  id: string;
  email: string;
  fullName: string;
  tier?: string;
}

function UserPermRow({ user }: { user: NavPermUser }) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<Record<string, boolean>>(() => getStoredPerms(user.id));
  const [saved, setSaved] = useState(false);
  const isPremium = user.tier === 'premium';

  const handleToggle = (key: string) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    savePerms(user.id, perms);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const enabledCount = Object.values(perms).filter(Boolean).length;

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${
      isPremium ? 'border-amber-500/25 bg-amber-500/[0.02]' : 'border-zinc-800 bg-zinc-900/30'
    }`}>
      {/* Row header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer group"
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          isPremium ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'
        }`}>
          {user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
        </div>

        {/* Name & email */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold truncate ${isPremium ? 'text-amber-300' : 'text-zinc-200'}`}>
              {user.fullName || user.email?.split('@')[0]}
            </span>
            {isPremium && <Crown size={11} className="text-amber-500 fill-amber-500 flex-shrink-0" />}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono truncate block">{user.email}</span>
        </div>

        {/* Count badge */}
        <span className="text-[10px] font-mono text-zinc-500 flex-shrink-0 hidden sm:block">
          {enabledCount}/{ALL_NAV_ITEMS.length} visible
        </span>

        {/* Mini checklist preview */}
        <div className="hidden sm:flex gap-1 flex-shrink-0">
          {ALL_NAV_ITEMS.map(item => (
            <div
              key={item.key}
              className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                perms[item.key] !== false
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-zinc-800 text-zinc-700'
              }`}
              title={item.label}
            >
              {item.icon}
            </div>
          ))}
        </div>

        {/* Chevron */}
        <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0 ml-1">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded permission checkboxes */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 flex flex-col gap-3">
              <div className="h-px bg-zinc-800/80 mb-1" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ALL_NAV_ITEMS.map((item) => {
                  const isOn = perms[item.key] !== false;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleToggle(item.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left group ${
                        isOn
                          ? 'border-indigo-500/30 bg-indigo-500/8 hover:bg-indigo-500/12'
                          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                      }`}
                    >
                      {/* Checkbox square */}
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border transition-all duration-200 ${
                        isOn
                          ? 'bg-indigo-500 border-indigo-500 shadow-sm shadow-indigo-500/25'
                          : 'bg-zinc-900 border-zinc-700 group-hover:border-zinc-600'
                      }`}>
                        {isOn && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>

                      {/* Icon + label */}
                      <div className={`flex items-center gap-1.5 flex-1 min-w-0 ${isOn ? 'text-zinc-200' : 'text-zinc-500'}`}>
                        <span className={isOn ? 'text-indigo-400' : 'text-zinc-600'}>{item.icon}</span>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold font-sans block leading-tight">{item.label}</span>
                          <span className="text-[9px] text-zinc-600 leading-tight block truncate">{item.desc}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Save button row */}
              <div className="flex justify-end mt-1">
                <button
                  onClick={handleSave}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold font-mono uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
                    saved
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/15'
                  }`}
                >
                  {saved ? <><Check size={12} strokeWidth={3} /> Saved!</> : <><Settings2 size={12} /> Save Permissions</>}
                </button>
              </div>

              <p className="text-[9px] text-zinc-600 font-mono">
                * Changes take effect next time this user refreshes or logs in.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuPermissionsTab({ users }: { users: NavPermUser[] }) {
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white font-serif flex items-center gap-2">
            <Settings2 size={18} className="text-indigo-400" />
            Menu Permissions
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Control which navigation items each user can see. Changes are applied per-user.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono">
          <span className="text-zinc-400">Users:</span>
          <span className="text-indigo-400 font-bold">{users.length}</span>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search users..."
        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-700 transition-colors font-mono"
      />

      {/* User rows */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center text-zinc-600 font-mono text-sm py-8">
            No users found.
          </div>
        ) : (
          filtered.map(u => <UserPermRow key={u.id} user={u} />)
        )}
      </div>

      {/* Legend */}
      <div className="border border-zinc-800/60 rounded-2xl p-4 flex flex-wrap gap-4 text-[10px] font-mono text-zinc-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Item visible in nav</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-zinc-800 inline-block" /> Item hidden from nav</span>
        <span className="flex items-center gap-1.5"><Crown size={10} className="text-amber-400" /> Premium member</span>
        <span className="text-zinc-600">* VIP Lounge only appears for premium-tier users regardless of permission.</span>
      </div>
    </div>
  );
}
