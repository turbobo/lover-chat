'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ===== Types =====
interface Character {
  id: string;
  name: string;
  emoji: string;
  gender: 'female' | 'male';
  tagline: string;
  description: string;
  gradient: string;
  bubbleColor: string;
  systemPrompt: string;
}

interface Scenario {
  id: string;
  name: string;
  emoji: string;
  description: string;
  opener: Record<string, string>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ScoreResult {
  total: number;
  dimensions: { eq: number; humor: number; initiative: number; sincerity: number; charm: number };
  comment: string;
  tip: string;
}

// ===== Data =====
const characters: Character[] = [
  {
    id: 'gentle-gf', name: '小柔', emoji: '🌸', gender: 'female',
    tagline: '温柔女友', description: '温柔体贴、善解人意，会撒娇也会心疼你',
    gradient: 'from-pink-400 to-rose-400', bubbleColor: 'bg-pink-50 border-pink-100',
    systemPrompt: `你是"小柔"，一个温柔体贴的女朋友。性格：温柔善良、善解人意、会适时撒娇、关心对方身体和心情、偶尔用可爱语气词（嘛、呀、呢、哼）。聊天风格：回复简短自然（1-3句话）像真实微信聊天，适当用表情符号，记住之前聊过的内容，遇到甜言蜜语会害羞但开心。保持角色，不要太正式。`,
  },
  {
    id: 'boss-bf', name: '陆渊', emoji: '🖤', gender: 'male',
    tagline: '霸道男友', description: '外冷内热，嘴上霸道心里宠你上天',
    gradient: 'from-gray-700 to-gray-900', bubbleColor: 'bg-gray-50 border-gray-100',
    systemPrompt: `你是"陆渊"，一个霸道但内心宠溺的男朋友。性格：表面高冷霸道内心超级宠溺、说话简洁有力、占有欲强但出于关心、嘴硬心软。聊天风格：回复简洁（1-2句话为主），不用可爱表情偶尔用😏😤，霸道中带关心如"早点睡别让我担心"，被夸会嘴硬。保持角色，回复像真实情侣聊天。`,
  },
  {
    id: 'mature-sis', name: '苏晚', emoji: '🌙', gender: 'female',
    tagline: '知性御姐', description: '优雅成熟，偶尔调侃你，让人又爱又敬',
    gradient: 'from-purple-500 to-indigo-500', bubbleColor: 'bg-purple-50 border-purple-100',
    systemPrompt: `你是"苏晚"，一个知性优雅的御姐型女朋友。性格：成熟知性见多识广、说话有分寸偶尔调侃、给建设性意见不一味附和、独立自信但也会柔软。聊天风格：回复2-3句话语言优雅不做作，调侃时带幽默如"小笨蛋这都不懂？"，关心含蓄如"今天有没有好好吃饭呀"，常用"嗯哼""是吗""说说看"。保持角色。`,
  },
  {
    id: 'sunny-bf', name: '林阳', emoji: '☀️', gender: 'male',
    tagline: '阳光暖男', description: '阳光幽默，会撩会逗，让你每天笑不停',
    gradient: 'from-orange-400 to-amber-400', bubbleColor: 'bg-orange-50 border-orange-100',
    systemPrompt: `你是"林阳"，一个阳光开朗的暖男型男朋友。性格：阳光积极正能量、幽默风趣喜欢逗人开心、细心体贴记得每件事、会做饭拍照哄人。聊天风格：回复活泼自然（1-3句话），经常用哈哈和表情式文字，喜欢开玩笑知道分寸，甜的时候很甜如"想你了就是突然想告诉你"。保持角色。`,
  },
];

const scenarios: Scenario[] = [
  { id: 'first-date', name: '初次约会', emoji: '💕', description: '第一次约会的紧张与甜蜜',
    opener: { 'gentle-gf': '今天见到你好紧张呀，你比我想象中还要好看呢 🙈', 'boss-bf': '到了？过来，我帮你拿包。别紧张，有我在。', 'mature-sis': '嗯，比照片上看起来更顺眼呢。走吧，带你去个好地方。', 'sunny-bf': '哇哇哇，今天也太好看了吧！我感觉我要成为全场最让人羡慕的人了哈哈' } },
  { id: 'make-up', name: '吵架和好', emoji: '🥺', description: '闹别扭了，学会化解矛盾',
    opener: { 'gentle-gf': '你还知道来找我呀...哼，我生气了你知不知道 😤', 'boss-bf': '好了好了，别闹了。过来，让我抱抱。这次算我的错行了吧。', 'mature-sis': '吵完了？那我们来好好谈谈吧，我不想因为这种事影响我们的感情。', 'sunny-bf': '宝宝别生气了嘛，我错了真的错了，你看我给你带了你最爱吃的...' } },
  { id: 'goodnight', name: '晚安情话', emoji: '🌙', description: '睡前甜蜜聊天',
    opener: { 'gentle-gf': '困了吗？再陪我聊一会儿嘛，舍不得跟你说晚安呢...', 'boss-bf': '还不睡？再不睡明天又要困成狗了。乖，把手机放下，晚安。', 'mature-sis': '今天辛苦了，早点休息吧。明天又是新的一天，晚安。', 'sunny-bf': '嘿嘿，今天开心的一天！晚安呀~梦里见！' } },
  { id: 'confession', name: '表白时刻', emoji: '💗', description: '鼓起勇气说出喜欢',
    opener: { 'gentle-gf': '嗯？你说有重要的话要跟我说？怎么突然这么严肃呀...', 'boss-bf': '你有话说就说，别磨磨唧唧的。......嗯，我听着呢。', 'mature-sis': '看你今天欲言又止的样子，有什么想对我说的吗？说吧，我在听。', 'sunny-bf': '怎么啦怎么啦，是不是要跟我告白！开玩笑的啦，你说你说~' } },
  { id: 'daily-miss', name: '日常想念', emoji: '💌', description: '不在身边用文字传递思念',
    opener: { 'gentle-gf': '你在干嘛呀？我刚才看到一个好可爱的东西想给你看~', 'boss-bf': '今天加班？几点回来。我等你。别太累了。', 'mature-sis': '今天在书店看到一本你可能会喜欢的书，先帮你买下来了。', 'sunny-bf': '猜猜我在干嘛？哈哈我在看我们上次的合照！你笑起来真的超级好看' } },
  { id: 'comfort', name: '安慰鼓励', emoji: '🤗', description: '对方心情不好时暖心安慰',
    opener: { 'gentle-gf': '怎么了宝贝？感觉你今天不太开心...跟我说说好不好 💕', 'boss-bf': '谁惹你了？跟我说。......不管什么事，有我在，别怕。', 'mature-sis': '听起来确实不容易。不过你要相信，这些事过一阵回头看，其实都没什么的。', 'sunny-bf': '哎呀别难过了嘛！你难过我也会跟着难过的。来，我讲个笑话给你听！' } },
];

// ===== Component =====
export default function Home() {
  const [screen, setScreen] = useState<'select' | 'chat'>('select');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Select character and start chat
  const startChat = useCallback((char: Character, scenarioId?: string) => {
    setSelectedChar(char);
    setMessages([]);
    setScoreResult(null);
    setShowScore(false);

    const scenario = scenarioId ? scenarios.find((s) => s.id === scenarioId) : null;
    const opener = scenario?.opener[char.id];

    if (opener) {
      setMessages([{ role: 'assistant', content: opener }]);
    }

    setScreen('chat');
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !selectedChar || isTyping) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: selectedChar.systemPrompt,
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || '...';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '网络异常，稍后再试' }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, messages, selectedChar, isTyping]);

  // Score chat
  const scoreChat = useCallback(async () => {
    if (messages.length < 2 || isScoring) return;
    setIsScoring(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
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
  }, [messages, isScoring]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ===== SELECT SCREEN =====
  if (screen === 'select') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-2">
            恋人聊天助手
          </h1>
          <p className="text-gray-400">选择角色，练习聊天，让感情升温</p>
        </div>

        {/* Characters */}
        <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1.5">
          <span>选择 TA</span>
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {characters.map((char) => (
            <button
              key={char.id}
              onClick={() => startChat(char)}
              className="group relative bg-white rounded-2xl p-4 border border-gray-100 hover:border-transparent hover:shadow-lg hover:shadow-purple-100/40 transition-all duration-300 text-left"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${char.gradient} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                {char.emoji}
              </div>
              <div className="font-semibold text-gray-800 text-sm">{char.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{char.tagline}</div>
              <div className="text-xs text-gray-300 mt-2 leading-relaxed">{char.description}</div>
            </button>
          ))}
        </div>

        {/* Scenarios */}
        <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1.5">
          <span>场景模拟</span>
          <span className="text-xs text-gray-300">（选角色后自动进入场景）</span>
        </h2>
        <div className="space-y-2">
          {scenarios.map((scene) => (
            <ScenarioCard key={scene.id} scenario={scene} onSelect={startChat} />
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-gray-300">
          Powered by 通义千问 · AI 生成内容仅供练习参考
        </div>
      </div>
    );
  }

  // ===== CHAT SCREEN =====
  return (
    <div className="max-w-lg mx-auto h-screen flex flex-col bg-white">
      {/* Chat Header */}
      <div className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r ${selectedChar?.gradient} text-white shadow-md`}>
        <button
          onClick={() => setScreen('select')}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl">
          {selectedChar?.emoji}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{selectedChar?.name}</div>
          <div className="text-xs text-white/70">{selectedChar?.tagline}</div>
        </div>
        <button
          onClick={scoreChat}
          disabled={messages.length < 2 || isScoring}
          className="px-3 py-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-40"
        >
          {isScoring ? '评分中...' : '聊天评分'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-300 text-sm py-12">
            说点什么开始聊天吧
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-md'
                  : `${selectedChar?.bubbleColor} border text-gray-700 rounded-bl-md`
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`${selectedChar?.bubbleColor} border rounded-2xl rounded-bl-md px-4 py-3`}>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 px-4 py-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你想说的话..."
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all max-h-24"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md disabled:opacity-40 hover:shadow-lg transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Score Panel Overlay */}
      {showScore && scoreResult && (
        <ScorePanel result={scoreResult} onClose={() => setShowScore(false)} />
      )}
    </div>
  );
}

// ===== Scenario Card Component =====
function ScenarioCard({ scenario, onSelect }: { scenario: Scenario; onSelect: (char: Character, scenarioId: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-xl">{scenario.emoji}</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">{scenario.name}</div>
          <div className="text-xs text-gray-400">{scenario.description}</div>
        </div>
        <svg className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {characters.filter((c) => scenario.opener[c.id]).map((char) => (
            <button
              key={char.id}
              onClick={() => onSelect(char, scenario.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-50 hover:bg-purple-50 hover:text-purple-600 rounded-full border border-gray-200 hover:border-purple-200 transition-all"
            >
              <span>{char.emoji}</span>
              <span>{char.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Score Panel Component =====
function ScorePanel({ result, onClose }: { result: ScoreResult; onClose: () => void }) {
  const dims = [
    { key: 'eq', label: '情商指数', color: 'bg-rose-400' },
    { key: 'humor', label: '幽默感', color: 'bg-amber-400' },
    { key: 'initiative', label: '主动性', color: 'bg-indigo-400' },
    { key: 'sincerity', label: '真诚度', color: 'bg-emerald-400' },
    { key: 'charm', label: '撩人指数', color: 'bg-pink-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">聊天评分</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            ✕
          </button>
        </div>

        {/* Total Score */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold bg-gradient-to-r from-rose-500 to-purple-500 bg-clip-text text-transparent">
            {result.total}
          </div>
          <div className="text-sm text-gray-400 mt-1">总分 100</div>
        </div>

        {/* Dimensions */}
        <div className="space-y-3 mb-6">
          {dims.map((dim) => {
            const value = result.dimensions[dim.key as keyof typeof result.dimensions] || 0;
            return (
              <div key={dim.key} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 text-right">{dim.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${dim.color} rounded-full transition-all duration-700`} style={{ width: `${value * 5}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-6">{value}</span>
              </div>
            );
          })}
        </div>

        {/* Comment & Tip */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">总评</div>
            <div className="text-sm text-gray-700">{result.comment}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">改进建议</div>
            <div className="text-sm text-gray-700">{result.tip}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
