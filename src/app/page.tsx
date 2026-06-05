'use client';

import { useState, useCallback } from 'react';

// ===== Types =====
interface Suggestion {
  style: string;
  reply: string;
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

// ===== Data =====
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
  '甜蜜版': 'bg-pink-100 text-pink-600 border-pink-200',
  '幽默版': 'bg-amber-100 text-amber-600 border-amber-200',
  '走心版': 'bg-blue-100 text-blue-600 border-blue-200',
  '高情商版': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  '撩人版': 'bg-purple-100 text-purple-600 border-purple-200',
  '傲娇版': 'bg-rose-100 text-rose-600 border-rose-200',
  '暖心版': 'bg-orange-100 text-orange-600 border-orange-200',
  '撒娇版': 'bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200',
  '霸气版': 'bg-gray-100 text-gray-700 border-gray-200',
  '文艺版': 'bg-indigo-100 text-indigo-600 border-indigo-200',
};

function getStyleColor(style: string): string {
  return STYLE_COLORS[style] || 'bg-gray-100 text-gray-600 border-gray-200';
}

// ===== Main Component =====
export default function Home() {
  const [partnerGender, setPartnerGender] = useState<'male' | 'female'>('female');
  const [scene, setScene] = useState('');
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAi, setIsAi] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [scoringIndex, setScoringIndex] = useState<number | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [showScore, setShowScore] = useState(false);

  // Generate suggestions
  const generate = useCallback(async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError('');
    setSuggestions([]);
    setScoreResult(null);
    setShowScore(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          partnerGender,
          scene: scene ? SCENES.find((s) => s.id === scene)?.name : undefined,
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
      setError('网络异常，请检查连接');
    } finally {
      setLoading(false);
    }
  }, [input, partnerGender, scene, loading]);

  // Score a suggestion
  const scoreSuggestion = useCallback(async (index: number) => {
    const s = suggestions[index];
    if (!s || isScoring) return;
    setIsScoring(true);
    setScoringIndex(index);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: s.reply,
          partnerMessage: input.trim(),
          scene: scene ? SCENES.find((s) => s.id === scene)?.name : undefined,
        }),
      });
      const data = await res.json();
      if (data.result) {
        setScoreResult(data.result);
        setShowScore(true);
      }
    } catch {
      // silent
    } finally {
      setIsScoring(false);
    }
  }, [suggestions, isScoring, input, scene]);

  // Copy text
  const copyText = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 sm:py-8 min-h-screen">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-2">
          恋爱聊天军师
        </h1>
        <p className="text-gray-400 text-sm">输入 TA 说的话，AI 帮你高情商回复</p>
      </div>

      {/* Partner Gender */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="text-xs text-gray-400 mb-2">对方身份</div>
        <div className="flex gap-3">
          <button
            onClick={() => setPartnerGender('female')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              partnerGender === 'female'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200/50'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            女朋友
          </button>
          <button
            onClick={() => setPartnerGender('male')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              partnerGender === 'male'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200/50'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            男朋友
          </button>
        </div>
      </div>

      {/* Scene Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="text-xs text-gray-400 mb-2">当前场景（可选）</div>
        <div className="flex flex-wrap gap-2">
          {SCENES.map((s) => (
            <button
              key={s.id}
              onClick={() => setScene(scene === s.id ? '' : s.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                scene === s.id
                  ? 'bg-purple-50 border-purple-300 text-purple-600'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-purple-200'
              }`}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="text-xs text-gray-400 mb-2">TA 说的话</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入对方发的消息或截图文字..."
          rows={3}
          className="w-full resize-none border-0 outline-none text-gray-800 text-sm leading-relaxed placeholder:text-gray-300"
          maxLength={500}
        />
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-300">{input.length}/500</span>
          <button
            onClick={generate}
            disabled={!input.trim() || loading}
            className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-200/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                军师分析中...
              </span>
            ) : '帮我回复'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">回复建议</span>
            {isAi && <span className="text-[10px] text-gray-300">由通义千问生成</span>}
          </div>

          {suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-purple-100 transition-all"
            >
              {/* Style tag */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getStyleColor(s.style)}`}>
                  {s.style}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => scoreSuggestion(i)}
                    disabled={isScoring}
                    className="text-xs text-gray-400 hover:text-purple-600 px-2 py-1 rounded-md hover:bg-purple-50 transition-all disabled:opacity-40"
                  >
                    {isScoring && scoringIndex === i ? '评分中...' : '评分'}
                  </button>
                  <button
                    onClick={() => copyText(s.reply, i)}
                    className="text-xs text-gray-400 hover:text-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-50 transition-all"
                  >
                    {copied === i ? '已复制 ✓' : '复制'}
                  </button>
                </div>
              </div>
              {/* Reply text */}
              <p className="text-sm text-gray-700 leading-relaxed">{s.reply}</p>
            </div>
          ))}
        </div>
      )}

      {/* Score Panel */}
      {showScore && scoreResult && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => setShowScore(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">回复评分</h3>
              <button onClick={() => setShowScore(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
            </div>

            {/* Total */}
            <div className="text-center mb-5">
              <div className="text-5xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
                {scoreResult.total}
              </div>
              <div className="text-xs text-gray-400 mt-1">总分 100</div>
            </div>

            {/* Dimensions */}
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

            {/* Comment */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="text-xs text-gray-400">总评</div>
              <div className="text-sm text-gray-700">{scoreResult.comment}</div>
              <div className="text-xs text-gray-400 mt-2">改进建议</div>
              <div className="text-sm text-gray-700">{scoreResult.tip}</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 text-center text-xs text-gray-300">
        Powered by 通义千问 · AI 生成内容仅供参考
      </div>
    </div>
  );
}
