'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ===== Types =====
interface Suggestion {
  style: string;
  reply: string;
}

interface ChatMessage {
  id: number;
  role: 'partner' | 'me';
  content: string;
}

interface ScoreResult {
  total: number;
  eq: number;
  humor: number;
  sincerity: number;
  charm: number;
  fit: number;
  comment: string;
  tip: string;
}

const SCENES = [
  { id: 'first-date', name: '初次约会', emoji: '💕' },
  { id: 'make-up', name: '吵架和好', emoji: '🥺' },
  { id: 'goodnight', name: '晚安情话', emoji: '🌙' },
  { id: 'confession', name: '表白时刻', emoji: '💗' },
  { id: 'daily-miss', name: '日常想念', emoji: '💌' },
  { id: 'comfort', name: '安慰鼓励', emoji: '🤗' },
  { id: 'daily-chat', name: '日常闲聊', emoji: '💬' },
  { id: 'jealous', name: '吃醋撒娇', emoji: '😤' },
];

const STYLE_COLORS: Record<string, string> = {
  '甜蜜版': 'bg-pink-50 text-pink-600 border-pink-200',
  '幽默版': 'bg-amber-50 text-amber-600 border-amber-200',
  '走心版': 'bg-blue-50 text-blue-600 border-blue-200',
  '高情商版': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  '撩人版': 'bg-purple-50 text-purple-600 border-purple-200',
  '傲娇版': 'bg-rose-50 text-rose-600 border-rose-200',
  '暖心版': 'bg-orange-50 text-orange-600 border-orange-200',
  '撒娇版': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
  '霸气版': 'bg-gray-50 text-gray-700 border-gray-300',
  '文艺版': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  '调侃版': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  '深情版': 'bg-red-50 text-red-600 border-red-200',
};

function sc(style: string) { return STYLE_COLORS[style] || 'bg-gray-50 text-gray-600 border-gray-200'; }

// ===== Main =====
export default function Home() {
  const [partnerGender, setPartnerGender] = useState<'male' | 'female'>('female');
  const [scene, setScene] = useState('');
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAi, setIsAi] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [showScore, setShowScore] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [pendingPartnerMsg, setPendingPartnerMsg] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, suggestions, loading]);

  // Generate suggestions
  const generate = useCallback(async (partnerMsg: string) => {
    setLoading(true);
    setError('');
    setSuggestions([]);
    setPendingPartnerMsg(partnerMsg);

    // Build history (exclude the latest partner message, it's the current one)
    const history = chat.map((m) => ({ role: m.role as 'partner' | 'me', content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: partnerMsg,
          partnerGender,
          scene: scene ? SCENES.find((s) => s.id === scene)?.name : undefined,
          history,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuggestions(data.suggestions || []);
        setIsAi(!!data.ai);
      }
    } catch {
      setError('网络异常');
    } finally {
      setLoading(false);
    }
  }, [chat, partnerGender, scene]);

  // Submit partner message
  const submitPartnerMessage = useCallback(() => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    // Add partner message to chat
    setChat((prev) => [...prev, { id: nextId.current++, role: 'partner', content: msg }]);
    // Generate suggestions
    generate(msg);
  }, [input, loading, generate]);

  // Pick a suggestion
  const pickSuggestion = useCallback((index: number) => {
    const s = suggestions[index];
    if (!s) return;
    // Add partner message if not yet added
    if (pendingPartnerMsg) {
      // Partner message was already added in submitPartnerMessage
    }
    // Add my reply
    setChat((prev) => [...prev, { id: nextId.current++, role: 'me', content: s.reply }]);
    setSuggestions([]);
    setPendingPartnerMsg('');
  }, [suggestions, pendingPartnerMsg]);

  // Score a suggestion
  const scoreSuggestion = useCallback(async (reply: string) => {
    if (isScoring) return;
    setIsScoring(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply,
          partnerMessage: pendingPartnerMsg,
          scene: scene ? SCENES.find((s) => s.id === scene)?.name : undefined,
        }),
      });
      const data = await res.json();
      if (data.result) { setScoreResult(data.result); setShowScore(true); }
    } catch { /* silent */ }
    finally { setIsScoring(false); }
  }, [isScoring, pendingPartnerMsg, scene]);

  const copyText = useCallback(async (text: string, index: number) => {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPartnerMessage(); }
  };

  return (
    <div className="max-w-lg mx-auto h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 text-white px-4 py-3 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">恋爱聊天军师</h1>
            <p className="text-[11px] text-white/70">输入 TA 说的话，帮你高情商回复</p>
          </div>
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            {showSetup ? '收起设置' : '展开设置'}
          </button>
        </div>

        {/* Setup panel */}
        {showSetup && (
          <div className="mt-3 space-y-3 pb-1">
            {/* Gender */}
            <div>
              <div className="text-[10px] text-white/60 mb-1.5">对方身份</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPartnerGender('female')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    partnerGender === 'female' ? 'bg-white text-pink-500 shadow-md' : 'bg-white/15 text-white/80'
                  }`}
                >女朋友</button>
                <button
                  onClick={() => setPartnerGender('male')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    partnerGender === 'male' ? 'bg-white text-blue-500 shadow-md' : 'bg-white/15 text-white/80'
                  }`}
                >男朋友</button>
              </div>
            </div>
            {/* Scene */}
            <div>
              <div className="text-[10px] text-white/60 mb-1.5">场景（可选）</div>
              <div className="flex flex-wrap gap-1.5">
                {SCENES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScene(scene === s.id ? '' : s.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-all ${
                      scene === s.id
                        ? 'bg-white text-purple-600 border-white shadow-sm'
                        : 'bg-white/10 text-white/80 border-white/20'
                    }`}
                  >{s.emoji} {s.name}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {chat.length === 0 && !loading && suggestions.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-gray-400 text-sm">输入 TA 说的话开始</p>
            <p className="text-gray-300 text-xs mt-1">军师会帮你分析并给出回复建议</p>
          </div>
        )}

        {chat.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex flex-col max-w-[80%]">
              <div className={`text-[10px] mb-1 ${msg.role === 'me' ? 'text-right text-gray-300' : 'text-left text-gray-300'}`}>
                {msg.role === 'partner' ? (partnerGender === 'female' ? '她' : '他') : '我'}
              </div>
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'me'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>军师分析中...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !loading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-gray-500">回复建议</span>
              {isAi && <span className="text-[10px] text-gray-300">由通义千问生成</span>}
            </div>
            {suggestions.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-purple-100 transition-all">
                <div className="px-3.5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${sc(s.style)}`}>{s.style}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => scoreSuggestion(s.reply)} disabled={isScoring}
                        className="text-[11px] text-gray-400 hover:text-purple-500 px-1.5 py-0.5 rounded transition-all disabled:opacity-40">
                        评分
                      </button>
                      <button onClick={() => copyText(s.reply, i)}
                        className="text-[11px] text-gray-400 hover:text-indigo-500 px-1.5 py-0.5 rounded transition-all">
                        {copied === i ? '已复制' : '复制'}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{s.reply}</p>
                </div>
                <button
                  onClick={() => pickSuggestion(i)}
                  className="w-full px-3.5 py-2 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border-t border-gray-50 transition-all"
                >
                  用这条回复
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-xs text-center">{error}</div>}

        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入 TA 说的话..."
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all max-h-20 placeholder:text-gray-300"
          />
          <button
            onClick={submitPartnerMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md disabled:opacity-40 hover:shadow-lg transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Score Panel */}
      {showScore && scoreResult && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => setShowScore(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">回复评分</h3>
              <button onClick={() => setShowScore(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
            </div>
            <div className="text-center mb-5">
              <div className="text-5xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">{scoreResult.total}</div>
              <div className="text-xs text-gray-400 mt-1">总分 100</div>
            </div>
            <div className="space-y-2.5 mb-5">
              {[
                { label: '情商指数', value: scoreResult.eq, color: 'bg-rose-400' },
                { label: '幽默感', value: scoreResult.humor, color: 'bg-amber-400' },
                { label: '真诚度', value: scoreResult.sincerity, color: 'bg-emerald-400' },
                { label: '撩人指数', value: scoreResult.charm, color: 'bg-pink-400' },
                { label: '场景适配', value: scoreResult.fit, color: 'bg-indigo-400' },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 text-right">{d.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${d.color} rounded-full transition-all duration-700`} style={{ width: `${d.value * 5}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-6">{d.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="text-xs text-gray-400">总评</div>
              <div className="text-sm text-gray-700">{scoreResult.comment}</div>
              <div className="text-xs text-gray-400 mt-2">改进建议</div>
              <div className="text-sm text-gray-700">{scoreResult.tip}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
