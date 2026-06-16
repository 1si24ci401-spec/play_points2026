import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@figma/astraui';
import { Star, Crown, Sparkles, Award, ArrowUpRight, Shield, Zap, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { toast } from 'sonner';
import { AppNav, getUserNavPermissions, getFirstPermittedPage } from '../components/AppNav';
import { ScrollProgress } from '../components/ScrollProgress';
import { useAuth } from '../context/AuthContext';
import { api } from '../../utils/api';

const SLICES = [
  { label: '5 Points', value: 5, color: '#131525', text: '#818CF8' },
  { label: '25 Points', value: 25, color: '#4F46E5', text: '#FFFFFF' },
  { label: '10 Points', value: 10, color: '#1A1C30', text: '#818CF8' },
  { label: '50 Points', value: 50, color: '#EC4899', text: '#FFFFFF' },
  { label: '15 Points', value: 15, color: '#20223D', text: '#818CF8' },
  { label: '100 Points', value: 100, color: '#F43F5E', text: '#FFFFFF' },
  { label: '20 Points', value: 20, color: '#1A1C30', text: '#818CF8' },
  { label: 'Jackpot! 💎', value: 250, color: '#8B5CF6', text: '#FFFFFF' }
];

interface StickyCardProps {
  i: number;
  progress: any;
  range: number[];
  targetScale: number;
  children: React.ReactNode;
}

function StickyCard({ i, progress, range, targetScale, children }: StickyCardProps) {
  const container = useRef<HTMLDivElement>(null);

  // Maps scroll progress to target scale
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={container}
      className="h-screen flex items-center justify-center sticky top-0 w-full px-4 overflow-visible z-10 pointer-events-none"
    >
      <motion.div
        style={{
          scale,
          top: `calc(10vh + ${i * 26}px)`,
        }}
        className="pointer-events-auto relative w-full max-w-6xl rounded-[32px] overflow-y-auto md:overflow-hidden glass-card shadow-[0_30px_70px_rgba(0,0,0,0.55)] border border-white/[0.08] flex flex-col p-4 sm:p-6 md:p-10 origin-top h-[580px] max-h-[85vh] bg-zinc-950/45 backdrop-blur-xl"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function VipLoungePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, accessToken, refreshUser, updatePointsLocally } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [wonAmount, setWonAmount] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [activeCategory, setActiveCategory] = useState('DEVICES');

  const [perms, setPerms] = useState<Record<string, boolean> | null>(() =>
    user ? getUserNavPermissions(user.id) : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    if (!user) return;
    setPerms(getUserNavPermissions(user.id));

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.userId === user.id) {
        setPerms(customEvent.detail.perms);
      }
    };
    window.addEventListener('nav-permissions-updated', handleUpdate);
    return () => window.removeEventListener('nav-permissions-updated', handleUpdate);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.tier !== 'premium') {
        navigate(user ? getFirstPermittedPage(user.id, user.tier) : '/login');
        return;
      }
      if (perms && perms.vip_lounge === false) {
        navigate(getFirstPermittedPage(user.id, user.tier));
      }
    }
  }, [user, authLoading, navigate, perms]);

  useEffect(() => {
    if (user) {
      const lastSpin = localStorage.getItem(`playpoints_last_spin_${user.id}`);
      const today = new Date().toDateString();
      if (lastSpin === today) {
        setHasSpunToday(true);
      }
    }
  }, [user]);

  if (authLoading || !user || user.tier !== 'premium' || (perms && perms.vip_lounge === false)) {
    return null;
  }

  const handleSpin = async () => {
    if (spinning || hasSpunToday) return;

    setSpinning(true);
    setWonAmount(null);

    const randomIndex = Math.floor(Math.random() * SLICES.length);
    const selectedSlice = SLICES[randomIndex];

    const sliceAngle = 360 / SLICES.length;
    const targetAngle = 360 - (randomIndex * sliceAngle) - (sliceAngle / 2);
    const newRotation = rotation + (360 * 5) + targetAngle - (rotation % 360);

    setRotation(newRotation);

    setTimeout(async () => {
      setSpinning(false);
      setWonAmount(selectedSlice.value);
      setShowConfetti(true);
      setHasSpunToday(true);

      if (user && accessToken) {
        try {
          const updatedPoints = (user.points || 0) + selectedSlice.value;
          // Optimistically update points locally
          updatePointsLocally(updatedPoints);

          // Update backend in background
          api.updateUserPoints(accessToken, user.id, updatedPoints).then(() => {
            refreshUser();
          }).catch(err => {
            console.error('Failed to sync spin points with server:', err);
          });

          localStorage.setItem(`playpoints_last_spin_${user.id}`, new Date().toDateString());
          toast(`✨ Congratulations! You won ${selectedSlice.value} points! ✨`);
        } catch (err) {
          console.error('Failed to claim daily reward points:', err);
          toast('Failed to save reward points');
        }
      }

      setTimeout(() => setShowConfetti(false), 5000);
    }, 4000);
  };

  const [submittingRedemption, setSubmittingRedemption] = useState<number | null>(null);

  const handleRedeemReward = async (reward: typeof featuredRewards[0]) => {
    if (!user || !accessToken) return;
    if (submittingRedemption) return;

    if ((user.points || 0) < reward.cost) {
      toast.error(`Insufficient points balance. You need ${reward.cost} points.`);
      return;
    }

    setSubmittingRedemption(reward.id);
    try {
      // Deduct points optimistically
      const updatedPoints = (user.points || 0) - reward.cost;
      updatePointsLocally(updatedPoints);

      // Deduct points on server
      await api.updateUserPoints(accessToken, user.id, updatedPoints);

      // Create order with status 'pending' (admin approval required)
      await api.createOrder(accessToken, {
        items: [{
          id: `reward-${reward.id}`,
          productId: `reward-${reward.id}`,
          name: reward.title,
          title: reward.title,
          price: 0,
          pointsCost: reward.cost,
          quantity: 1,
          image: reward.image
        }],
        total: 0,
        discountedTotal: 0,
        discordUsername: user.username || 'VIP_User',
        codGameId: 'VIP_LOUNGE',
        paymentType: 'full',
        paymentStatus: 'approved',
        status: 'pending'
      });

      await refreshUser();
      toast.success(`✨ Redemption request submitted for ${reward.title}! Awaiting admin approval.`);
    } catch (err: any) {
      console.error('Redemption error:', err);
      // Revert points locally on failure
      if (user) {
        updatePointsLocally(user.points || 0);
      }
      toast.error(err.message || 'Failed to submit redemption request.');
    } finally {
      setSubmittingRedemption(null);
    }
  };

  const categories = [
    { id: 'DEVICES', name: 'PREMIUM DEVICES' },
    { id: 'GAMING', name: 'GAMING GEAR' },
    { id: 'ACCESSORIES', name: 'ACCESSORIES' }
  ];

  const featuredRewards = [
    {
      id: 1,
      category: 'DEVICES',
      tag: 'HOT',
      title: 'X-PRO WIRELESS EARBUDS',
      desc: 'Active noise cancellation & spatial audio.',
      cost: 500,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 2,
      category: 'GAMING',
      tag: 'NEW',
      title: 'RGB MECHANICAL KEYBOARD',
      desc: 'Ultra-fast switches with customizable backlighting.',
      cost: 750,
      rating: 4,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 3,
      category: 'ACCESSORIES',
      tag: 'POPULAR',
      title: 'PREMIUM LEATHER TRAVEL BAG',
      desc: 'Water-resistant compartments for all gadgets.',
      cost: 400,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 4,
      category: 'DEVICES',
      tag: 'SALE',
      title: 'SMART FITNESS WATCH PRO',
      desc: 'Track fitness metrics, blood oxygen & sleeps.',
      cost: 600,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=600'
    }
  ];

  const filteredRewards = featuredRewards.filter(r => r.category === activeCategory);

  return (
    <div className="size-full flex flex-col bg-transparent" style={{ color: '#fff' }}>
      <ScrollProgress />
      <AppNav />

      {/* Marquee Ticker Tape */}
      <div className="bg-zinc-950/80 backdrop-blur-md text-white overflow-hidden py-3 border-b border-white/5 relative z-30 select-none">
        <div className="flex whitespace-nowrap animate-marquee">
          <span className="text-[11px] font-mono uppercase tracking-widest mx-4 text-zinc-400">
            ⚡ Welcome to the VIP Lounge • <span className="text-indigo-400 font-bold">1.5x PLAY POINTS BOOST ACTIVE</span> • Free Daily Spins • Rare Inventory Drops ⚡
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest mx-4 text-zinc-400">
            ⚡ Welcome to the VIP Lounge • <span className="text-indigo-400 font-bold">1.5x PLAY POINTS BOOST ACTIVE</span> • Free Daily Spins • Rare Inventory Drops ⚡
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest mx-4 text-zinc-400">
            ⚡ Welcome to the VIP Lounge • <span className="text-indigo-400 font-bold">1.5x PLAY POINTS BOOST ACTIVE</span> • Free Daily Spins • Rare Inventory Drops ⚡
          </span>
        </div>
      </div>

      {/* Stacked Cards Parallax Wrapper */}
      <div ref={containerRef} className="relative w-full z-10 flex flex-col pb-20">

        {/* Card 0: Welcome & VIP Holographic Card */}
        <StickyCard i={0} progress={scrollYProgress} range={[0, 1]} targetScale={0.80}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full text-left">
            <div className="lg:col-span-6 flex flex-col gap-6 justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 w-fit">
                <Crown size={14} className="text-indigo-400 fill-current animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-indigo-300">VIP PREMIUM MEMBER</span>
              </div>
              <div className="flex flex-col gap-3">
                <h1 className="text-4xl md:text-5xl font-black font-sans leading-none tracking-tight bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
                  THE VIP LOUNGE
                </h1>
                <p className="text-xs md:text-sm text-zinc-450 leading-relaxed font-sans max-w-lg">
                  Welcome to the peak of the Play Points ecosystem. Here, your loyalty translates directly into premium physical products, custom game codes, and automated priority fulfillment. Scroll down to claim rewards.
                </p>
              </div>

              {/* Status statistics row */}
              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-2">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">TIER STATUS</span>
                  <span className="text-sm font-bold text-white font-mono tracking-wide">PLATINUM</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">ACCUMULATION</span>
                  <span className="text-sm font-bold text-indigo-400 font-mono tracking-wide">1.5X ACTIVE</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">Fulfillment</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono tracking-wide">DIRECT EDGE</span>
                </div>
              </div>

              <div className="text-[10px] font-mono text-zinc-500 mt-4 animate-bounce flex items-center gap-1.5">
                <span>SCROLL TO EXPLORE REWARDS</span>
                <span>↓↓</span>
              </div>
            </div>

            {/* Premium 3D Interactive Card Representation */}
            <div className="lg:col-span-6 flex items-center justify-center relative perspective-[1000px] w-full mt-4 lg:mt-0">
              <motion.div
                whileHover={{ rotateY: 15, rotateX: -10, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full max-w-[280px] xs:max-w-[340px] sm:max-w-[420px] aspect-[1.58/1] rounded-2xl bg-gradient-to-br from-indigo-950/90 via-zinc-950/80 to-purple-950/90 border border-white/10 p-4 sm:p-6 flex flex-col justify-between shadow-[0_25px_60px_rgba(99,102,241,0.25)] relative overflow-hidden mx-auto"
              >
                {/* Grid Overlay inside card */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                <div className="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

                {/* Logo in the center of the card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25 z-0 pointer-events-none select-none">
                  <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 5L90 28.1V71.9L50 95L10 71.9V28.1L50 5Z" stroke="url(#paint0_linear)" strokeWidth="2" strokeLinejoin="round"/>
                    <path d="M50 20L76 35V65L50 80L24 65V35L50 20Z" stroke="url(#paint1_linear)" strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="50" cy="50" r="10" fill="url(#paint2_linear)" className="animate-pulse" />
                    <defs>
                      <linearGradient id="paint0_linear" x1="10" y1="5" x2="90" y2="95" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366F1"/>
                        <stop offset="1" stopColor="#EC4899"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear" x1="24" y1="20" x2="76" y2="80" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#EC4899"/>
                        <stop offset="1" stopColor="#8B5CF6"/>
                      </linearGradient>
                      <linearGradient id="paint2_linear" x1="40" y1="40" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#8B5CF6"/>
                        <stop offset="1" stopColor="#6366F1"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-bold uppercase">NEXA DIGITAL</span>
                    <span className="text-xs font-bold text-white font-sans uppercase">PLAY POINTS VIP</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Star size={14} className="text-indigo-400 fill-current" />
                  </div>
                </div>

                {/* Hologram Card Chip */}
                <div className="w-12 h-9 rounded-md bg-gradient-to-r from-yellow-500/70 via-amber-400/50 to-yellow-600/70 border border-yellow-400/30 flex flex-col p-1 gap-1 justify-center relative shadow-inner overflow-hidden my-4 z-10">
                  <div className="w-full h-px bg-zinc-950/20" />
                  <div className="w-full h-px bg-zinc-950/20" />
                  <div className="w-full h-px bg-zinc-950/20" />
                  <div className="absolute inset-x-3 inset-y-0 w-px bg-zinc-950/20" />
                </div>

                <div className="flex justify-between items-end z-10 text-left">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">CARDHOLDER</span>
                    <span className="text-xs font-bold font-mono tracking-wide text-zinc-200">{user.fullName || user.username || 'VIP MEMBER'}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase">MEMBERSHIP BALANCE</span>
                    <span className="text-base font-bold font-mono text-indigo-400">{user.points || 0} PTS</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </StickyCard>

        {/* Card 1: Interactive Reward Wheel */}
        <StickyCard i={1} progress={scrollYProgress} range={[0.25, 1]} targetScale={0.87}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full text-left">

            {/* Left side: Instructions & buttons */}
            <div className="lg:col-span-5 flex flex-col gap-5 justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-mono font-bold tracking-wider text-indigo-300 uppercase w-fit text-left">
                <Award size={13} className="text-indigo-400" />
                DAILY WHEEL
              </div>

              <div className="flex flex-col gap-2 text-left">
                <h2 className="text-2xl md:text-3xl font-black font-sans uppercase text-white">
                  WHEEL OF FORTUNE
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Tap the button to spin the daily reward wheel. Every VIP member is guaranteed to win extra redeemable points once every 24 hours. Points update inside the database automatically.
                </p>
              </div>

              {/* Odds list table */}
              <div className="flex flex-col gap-1 border-t border-white/5 pt-4 mt-2 text-left">
                <span className="text-[9px] font-mono text-zinc-500 uppercase">REWARD DISTRIBUTION</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="flex justify-between text-zinc-450 bg-white/[0.02] px-2 py-1 rounded border border-white/[0.04]">
                    <span>💎 JACKPOT</span>
                    <span className="text-indigo-400 font-bold">250 PTS</span>
                  </div>
                  <div className="flex justify-between text-zinc-450 bg-white/[0.02] px-2 py-1 rounded border border-white/[0.04]">
                    <span>⚡ ELITE</span>
                    <span className="text-purple-400 font-bold">100 PTS</span>
                  </div>
                  <div className="flex justify-between text-zinc-450 bg-white/[0.02] px-2 py-1 rounded border border-white/[0.04]">
                    <span>🌟 SPECIAL</span>
                    <span className="text-pink-400 font-bold">50 PTS</span>
                  </div>
                  <div className="flex justify-between text-zinc-450 bg-white/[0.02] px-2 py-1 rounded border border-white/[0.04]">
                    <span>⭐ COMMON</span>
                    <span className="text-indigo-300 font-bold">25 PTS</span>
                  </div>
                </div>
              </div>

              <div className="w-full mt-4">
                {hasSpunToday ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-center">
                    <p className="text-xs font-bold text-zinc-500 font-mono uppercase tracking-wider">
                      🔒 WHEEL LOCKED - CLAIMED FOR TODAY
                    </p>
                  </div>
                ) : (
                  <button
                    className={`w-full py-3.5 rounded-xl text-xs font-black font-mono tracking-widest uppercase transition-all duration-300 border cursor-pointer ${spinning
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-600 hover:shadow-[0_10px_25px_rgba(99,102,241,0.35)] hover:scale-[1.01] active:scale-[0.99]'
                      }`}
                    onClick={handleSpin}
                    disabled={spinning}
                  >
                    {spinning ? 'SPINNING WHEEL...' : 'SPIN REWARDS WHEEL'}
                  </button>
                )}

                {wonAmount !== null && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs font-bold text-indigo-400 animate-pulse font-mono text-center mt-3 bg-indigo-500/10 border border-indigo-500/20 py-2 rounded-lg"
                  >
                    🎉 WIN CONFIRMED! +{wonAmount} POINTS ADDED!
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right side: The Wheel SVG */}
            <div className="lg:col-span-7 flex items-center justify-center w-full mt-4 lg:mt-0">
              <div className="relative w-44 h-44 xs:w-56 xs:h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 flex items-center justify-center mx-auto">
                {/* Pointer marker */}
                <div
                  className="absolute -top-3 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] z-20 drop-shadow-[0_4px_10px_rgba(99,102,241,0.5)]"
                  style={{ borderTopColor: '#6366F1' }}
                />

                {/* Wheel circle */}
                <motion.div
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4, ease: [0.1, 0.8, 0.1, 1] }}
                  className="w-full h-full rounded-full border-[6px] border-zinc-900 shadow-[0_15px_45px_rgba(0,0,0,0.6)] overflow-hidden relative"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full select-none pointer-events-none">
                    {SLICES.map((slice, index) => {
                      const angle = 360 / SLICES.length;
                      const rotateVal = index * angle;
                      return (
                        <g key={index} transform={`rotate(${rotateVal} 50 50)`}>
                          <path
                            d={`M50,50 L50,0 A50,50 0 0,1 ${50 + 50 * Math.sin((angle * Math.PI) / 180)},${50 - 50 * Math.cos((angle * Math.PI) / 180)} Z`}
                            fill={slice.color}
                            stroke="#0b0c1e"
                            strokeWidth="0.8"
                          />
                          <text
                            x="50"
                            y="14"
                            fill={slice.text}
                            fontSize="4.5"
                            fontWeight="900"
                            textAnchor="middle"
                            transform={`rotate(${angle / 2} 50 50)`}
                            style={{ fontFamily: 'sans-serif', letterSpacing: '0.01em' }}
                          >
                            {slice.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Inner center core */}
                  <div className="absolute inset-[36%] rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center shadow-[inset_0_2px_8px_rgba(255,255,255,0.1)]">
                    <Star size={14} className="text-indigo-400 fill-current animate-pulse" />
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </StickyCard>

        {/* Card 2: Exclusive VIP Deals Catalog */}
        <StickyCard i={2} progress={scrollYProgress} range={[0.5, 1]} targetScale={0.93}>
          <div className="flex flex-col h-full text-left gap-4 overflow-hidden">

            {/* Header section inside sticky card */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-3">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-bold">REWARD CATALOG</span>
                <h2 className="text-xl md:text-2xl font-black font-sans uppercase tracking-tight text-white mt-0.5">
                  EXCLUSIVE REDEMPTIONS
                </h2>
              </div>

              {/* Tabs list */}
              <div className="flex gap-1 overflow-x-auto pb-1 max-w-full sm:max-w-md">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-mono tracking-wider uppercase font-bold border whitespace-nowrap transition-all duration-300 cursor-pointer ${activeCategory === cat.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/25'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Products Grid - scrollable inside card if viewport is small */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-4">
              {filteredRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="group relative glass-card glass-card-hover rounded-xl p-3 flex flex-col gap-2.5 h-fit text-left"
                >
                  {/* Photo Container */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
                    <img
                      src={reward.image}
                      alt={reward.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge */}
                    <span className="absolute top-2 left-2 bg-indigo-600 text-white font-mono text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded">
                      {reward.tag}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-xs font-black tracking-tight text-white font-sans truncate">
                      {reward.title}
                    </h3>
                    <p className="text-[10px] text-zinc-400 leading-normal line-clamp-1">
                      {reward.desc}
                    </p>

                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/5 text-[10px]">
                      <span className="font-mono text-zinc-500">COST</span>
                      <span className="font-bold font-mono text-indigo-400">{reward.cost} PTS</span>
                    </div>

                    <button
                      onClick={() => handleRedeemReward(reward)}
                      disabled={submittingRedemption === reward.id}
                      className="w-full mt-1 border border-white/[0.08] bg-white/[0.02] hover:bg-indigo-600 hover:border-indigo-500 hover:text-white text-zinc-300 py-2 rounded-lg font-mono text-[9px] uppercase font-bold tracking-widest transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingRedemption === reward.id ? 'SUBMITTING...' : 'Redeem Reward'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </StickyCard>

        {/* Card 3: VIP Perks & Concierge Support */}
        <StickyCard i={3} progress={scrollYProgress} range={[0.75, 1]} targetScale={1}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full text-left">

            {/* Left side: Perks list */}
            <div className="lg:col-span-7 flex flex-col gap-4 justify-center">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-bold">VIP PRIVILEGES</span>
                <h2 className="text-2xl md:text-3xl font-black font-sans uppercase text-white mt-0.5">
                  LOUNGE PERKS
                </h2>
              </div>

              <div className="flex flex-col gap-3.5 text-left">
                <div className="glass-card rounded-2xl p-4 flex flex-col gap-1.5 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono tracking-widest text-indigo-400 uppercase font-bold">PERK 01</span>
                    <span className="text-[8px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">ACTIVE</span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase">VIP 1.5X POINT MULTIPLIER</h3>
                  <p className="text-[10px] text-zinc-400 leading-relaxed max-w-xl">
                    Accumulate rewards faster than standard accounts. Every purchase triggers a automated 1.5x multiplier broadcast to your point wallet.
                  </p>
                </div>

                <div className="glass-card rounded-2xl p-4 flex flex-col gap-1.5 border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono tracking-widest text-indigo-400 uppercase font-bold">PERK 02</span>
                    <span className="text-[8px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">ACTIVE</span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase">PRIORITY ORDER FULFILLMENT</h3>
                  <p className="text-[10px] text-zinc-400 leading-relaxed max-w-xl">
                    Skip the queue. VIP redemption payloads bypass standard verification steps and execute inside the first processing loop.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Testimonial Reviews */}
            <div className="lg:col-span-5 flex flex-col gap-4 text-left w-full mt-6 lg:mt-0">
              <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">VIP HALL OF FAME</span>

              <div className="flex flex-col gap-3">
                {[
                  { name: 'Prasad Shetty', points: '12.4k pts', text: '“Redeemed the wireless controller and got the digital key on discord instantly! The premium 1.5x boost accumulates points ridiculously fast.”' },
                  { name: 'Aman S.', points: '8.1k pts', text: '“The daily spin wheel is so responsive, and I love the red e-commerce aesthetic. Highly premium user interface and layout design.”' },
                  { name: 'David R.', points: '15.9k pts', text: '“Priority support answered my custom tokens request in minutes. Hands down the best premium loyalty lounge I have used.”' }
                ].map((r, i) => (
                  <div key={i} className={`glass-card rounded-xl p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2 border border-white/5 ${i === 2 ? 'hidden sm:flex' : 'flex'}`}>
                    <div className="flex gap-0.5 text-indigo-400">
                      {[...Array(5)].map((_, starIdx) => <Star key={starIdx} size={10} className="fill-current" />)}
                    </div>
                    <p className="text-[10px] text-zinc-400 italic leading-relaxed font-sans">
                      {r.text}
                    </p>
                    <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                      <span className="text-[10px] font-bold text-zinc-200">{r.name}</span>
                      <span className="text-[8px] font-mono text-indigo-400 uppercase font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">{r.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </StickyCard>

      </div>

      {/* Footer & Newsletter replica */}
      <footer className="bg-transparent border-t border-white/5 text-white pt-16 pb-8 px-6 text-left relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">

          {/* Newsletter Box */}
          <div className="glass-card rounded-3xl p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col gap-2 max-w-md">
              <h3 className="text-xl font-bold tracking-tight">VIP NEWS & RESTOCK NOTIFICATION</h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Be the first to know when rare rewards and items are restocked in the store. We never spam.
              </p>
            </div>
            <div className="flex w-full lg:w-auto gap-2.5 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 p-3.5 glass-input rounded-xl text-xs text-white outline-none focus:border-indigo-500 transition-all font-mono"
              />
              <button
                onClick={() => toast('Subscribed to VIP Restocks!')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] uppercase font-bold tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                SUBSCRIBE
              </button>
            </div>
          </div>

          {/* Footer Grid Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-b border-white/5 pb-12">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-indigo-600 shadow-md shadow-indigo-500/20">
                  <Star size={12} className="text-white fill-current" />
                </div>
                <span className="font-mono text-xs uppercase tracking-widest font-bold text-white">PLAY POINTS</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                Providing high-fidelity digital products, direct support, and automated redemptions.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">QUICK LINKS</span>
              <a onClick={() => navigate('/products')} className="text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors">Redeem Shop</a>
              <a onClick={() => navigate('/offers')} className="text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors">Exclusive Offers</a>
              <a onClick={() => navigate('/orders')} className="text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors">Order Logs</a>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">SECURITY GATE</span>
              <span className="text-xs text-zinc-400">SSL Encrypted</span>
              <span className="text-xs text-zinc-400">Supabase Auth</span>
              <span className="text-xs text-zinc-400">Secure Edge</span>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">VIP SUPPORT</span>
              <a href="https://discord.gg" className="text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors">Discord Server</a>
              <span className="text-xs text-zinc-400">Direct Chat</span>
              <span className="text-xs text-zinc-400">VIP Ticket Loop</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-500 font-mono">
            <span>© 2026 Play Points Store. All Rights Reserved.</span>
            <div className="flex gap-4">
              <a className="hover:text-white cursor-pointer transition-colors">Terms of Service</a>
              <a className="hover:text-white cursor-pointer transition-colors">Privacy Policy</a>
            </div>
          </div>

        </div>
      </footer>

      {showConfetti && <PremiumConfettiOverlay />}
    </div>
  );
}

function PremiumConfettiOverlay() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; color: string; rotate: number }>>([]);

  useEffect(() => {
    const colors = ['#6366F1', '#a855f7', '#FFFFFF', '#4f46e5'];
    const generated = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      size: 8 + Math.random() * 12,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            opacity: 0.85,
            animation: `fall 4.5s linear infinite`,
            animationDelay: `${p.delay}s`,
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fall {
          0% {
            top: -10%;
            transform: translateY(0) rotate(0deg) translateX(0);
          }
          50% {
            transform: translateY(45vh) rotate(180deg) translateX(40px);
          }
          100% {
            top: 110%;
            transform: translateY(90vh) rotate(360deg) translateX(-40px);
          }
        }
      `}} />
    </div>
  );
}
