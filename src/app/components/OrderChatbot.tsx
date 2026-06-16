import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../../utils/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// AI Text Loading Component — cycling animated gradient text
function AITextLoading() {
  const texts = ['Thinking...', 'Processing...', 'Analyzing...', 'Searching...', 'Almost...'];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % texts.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-4 py-2.5 flex items-center justify-start">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            backgroundPosition: ['200% center', '-200% center'],
          }}
          exit={{ opacity: 0, y: -8 }}
          transition={{
            opacity: { duration: 0.25 },
            y: { duration: 0.25 },
            backgroundPosition: { duration: 2, ease: 'linear', repeat: Infinity },
          }}
          className="text-[11px] font-bold bg-gradient-to-r from-indigo-400 via-slate-300 to-indigo-400 bg-[length:200%_100%] bg-clip-text text-transparent tracking-wide"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function OrderChatbot() {
  const { user, accessToken } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load products to map IDs
  useEffect(() => {
    if (accessToken) {
      api.getProducts()
        .then((res: any) => setProducts(res.products || []))
        .catch((err: any) => console.error('Failed to load products in chatbot:', err));
    }
  }, [accessToken]);

  useEffect(() => {
    if (user && messages.length === 0) {
      const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';
      const isPremium = user.tier === 'premium';
      setMessages([
        {
          role: 'assistant',
          content: isPremium
            ? `✨ Welcome back, **${username}**! I'm **PlayBot**, your dedicated VIP AI assistant.\nI can help you with your orders, products, points balance, and checkout. How can I assist you today?`
            : `Hi **${username}**! 👋 I'm **PlayBot**, your Play Points shop assistant.\nI can help with your orders, products, points, and checkout. What can I help you with?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!user || !accessToken) return null;

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // API call to our new backend chat endpoint
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.chat(accessToken, history);
      
      const assistantText = response.choices?.[0]?.message?.content || 'Sorry, I did not receive a response. Please check your OpenRouter API Key.';

      let cleanText = assistantText;

      // 1. Process SHOW_NOTIFICATION
      const notificationRegex = /\[SHOW_NOTIFICATION:\s*({[^\]]+})\]/g;
      let notificationMatch;
      while ((notificationMatch = notificationRegex.exec(assistantText)) !== null) {
        try {
          const data = JSON.parse(notificationMatch[1]);
          toast.success(data.message || data.title, {
            description: data.title !== data.message ? data.title : undefined,
            duration: 4000
          });
        } catch (e) {
          console.error('Failed to parse SHOW_NOTIFICATION tag:', e);
        }
      }
      cleanText = cleanText.replace(notificationRegex, '');

      // 2. Process ADD_TO_CART
      const cartRegex = /\[ADD_TO_CART:\s*({[^\]]+})\]/g;
      let cartMatch;
      while ((cartMatch = cartRegex.exec(assistantText)) !== null) {
        try {
          const data = JSON.parse(cartMatch[1]);
          const prodId = data.productId;
          const product = products.find((p: any) => {
            const idOnly = p.id ? (p.id.includes(':') ? p.id.split(':')[1] : p.id) : p.id;
            return idOnly === prodId || p.id === prodId;
          });
          if (product) {
            addToCart(product);
          } else {
            console.warn('Product not found in local catalog for chatbot add-to-cart:', prodId);
          }
        } catch (e) {
          console.error('Failed to parse ADD_TO_CART tag:', e);
        }
      }
      cleanText = cleanText.replace(cartRegex, '');

      // 3. Process NAVIGATE
      const navigateRegex = /\[NAVIGATE:\s*["']?([^\]"']+)["']?\]/g;
      let navigateMatch;
      if ((navigateMatch = navigateRegex.exec(assistantText)) !== null) {
        try {
          const route = navigateMatch[1];
          setTimeout(() => {
            navigate(route);
          }, 400);
        } catch (e) {
          console.error('Failed to parse NAVIGATE tag:', e);
        }
      }
      cleanText = cleanText.replace(navigateRegex, '');

      cleanText = cleanText.trim();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: cleanText,
          timestamp: new Date(),
        },
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ **Error:** ${error.message || 'Failed to connect to the assistant. Please verify your internet and API configuration.'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const quickChips = [
    { label: '📦 Track recent order', query: 'What is the status of my most recent order?' },
    { label: '✏️ How to edit order?', query: 'Can I edit my pending order items?' },
    { label: '❌ Cancel my order', query: 'How do I cancel my order?' },
    { label: '🎟️ How to use coupons?', query: 'How do I apply a discount coupon?' },
  ];

  return (
    <div className="fixed z-50 select-none">
      {/* Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-trigger"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-28 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20 border border-white/10 hover:shadow-indigo-500/40 transition-all duration-300 cursor-pointer opacity-60 hover:opacity-100"
          >
            <MessageSquare size={24} className="animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-window"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 right-4 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[500px] rounded-[var(--radius-lg)] border backdrop-blur-md flex flex-col shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Header */}
            <div
              className="p-4 border-b flex items-center justify-between"
              style={{
                borderColor: 'var(--color-border)',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%)'
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white">
                  <Bot size={18} />
                </div>
              <div>
                  <h3 className="font-medium text-sm flex items-center gap-1" style={{ color: 'var(--color-card-foreground)' }}>
                    PlayBot <Sparkles size={12} className="text-indigo-400 fill-current" />
                    {user?.tier === 'premium' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-1">VIP</span>}
                  </h3>
                  <p className="text-[10px]" style={{ color: 'var(--color-muted-foreground)' }}>
                    AI-powered store assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-[var(--color-muted)] text-slate-400 hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot size={13} className="text-indigo-400" />
                      </div>
                    )}
                    <div
                      className="p-3 rounded-[var(--radius-md)] text-xs leading-relaxed break-words"
                      style={{
                        backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-muted)',
                        color: msg.role === 'user' ? 'var(--color-primary-foreground)' : 'var(--color-card-foreground)',
                        borderBottomRightRadius: msg.role === 'user' ? '2px' : undefined,
                        borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : undefined,
                      }}
                    >
                      {/* Simple Markdown Parser for Bold & Linebreaks */}
                      {msg.content.split('\n').map((line, lIdx) => {
                        // Basic bold parsing **text**
                        const parts = line.split('**');
                        return (
                          <p key={lIdx} className={lIdx > 0 ? 'mt-1.5' : ''}>
                            {parts.map((part, pIdx) =>
                              pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold">{part}</strong> : part
                            )}
                          </p>
                        );
                      })}
                      <span className="block text-[8px] text-right mt-1 opacity-50">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={13} className="text-indigo-400" />
                    </div>
                    <div
                      className="rounded-[var(--radius-md)] overflow-hidden"
                      style={{
                        backgroundColor: 'var(--color-muted)',
                        borderBottomLeftRadius: '2px',
                      }}
                    >
                      <AITextLoading />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-4 py-2 border-t flex flex-col gap-1.5" style={{ borderColor: 'var(--color-border)' }}>
                <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>Suggested Questions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.query)}
                      className="text-[10px] px-2.5 py-1 rounded-full border hover:bg-[var(--color-muted)] hover:text-foreground transition-all duration-200 cursor-pointer flex items-center gap-1"
                      style={{
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-muted-foreground)',
                        backgroundColor: 'var(--color-card)',
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about your orders..."
                className="flex-1 resize-none py-2 px-3 text-xs rounded-[var(--radius-md)] border bg-transparent focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-foreground)',
                  maxHeight: '60px',
                  minHeight: '38px',
                }}
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors cursor-pointer flex-shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
