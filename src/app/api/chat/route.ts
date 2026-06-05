import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const SYSTEM_PROMPT = `你是一个恋爱聊天军师，帮助用户想出高情商的回复。

用户会告诉你：
1. 对方的身份（男朋友/女朋友）
2. 当前场景（可选）
3. 之前的聊天记录（如果有的话）
4. 对方最新说的一句话

请结合聊天记录上下文，给出5条不同风格的回复建议。每条建议用一句话概括风格标签，然后是具体的回复内容。

严格按照以下JSON格式回复：
{
  "suggestions": [
    { "style": "风格标签", "reply": "具体回复内容" },
    { "style": "风格标签", "reply": "具体回复内容" },
    { "style": "风格标签", "reply": "具体回复内容" },
    { "style": "风格标签", "reply": "具体回复内容" },
    { "style": "风格标签", "reply": "具体回复内容" }
  ]
}

风格标签参考（根据语境灵活选择最合适的5种）：
甜蜜版、幽默版、走心版、高情商版、撩人版、傲娇版、暖心版、撒娇版、霸气版、文艺版、调侃版、深情版

要求：
- 回复自然口语化，像真实聊天
- 每条1-3句话，不要太长
- 5条风格有明显区分度
- 考虑对话上下文和情绪走向
- 如果之前聊得开心就延续甜蜜氛围，如果有矛盾就侧重化解`;

export async function POST(req: NextRequest) {
  try {
    const { message, partnerGender, scene, history } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: '请输入对方说的话' }, { status: 400 });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ suggestions: mockSuggestions(), ai: false });
    }

    const userPrompt = buildPrompt(message, partnerGender, scene, history);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('DashScope error:', err);
      return NextResponse.json({ error: 'AI 服务暂时不可用' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    try {
      const result = JSON.parse(text);
      return NextResponse.json({ suggestions: result.suggestions || mockSuggestions(), ai: true });
    } catch {
      const extracted = tryExtract(text);
      if (extracted) return NextResponse.json({ suggestions: extracted, ai: true });
      return NextResponse.json({ suggestions: mockSuggestions(), ai: true });
    }
  } catch (e) {
    console.error('Suggest API error:', e);
    return NextResponse.json({ error: '服务异常' }, { status: 500 });
  }
}

interface HistoryItem {
  role: 'partner' | 'me';
  content: string;
}

function buildPrompt(message: string, gender?: string, scene?: string, history?: HistoryItem[]): string {
  let prompt = `对方身份：${gender === 'male' ? '男朋友' : '女朋友'}\n`;
  if (scene) prompt += `当前场景：${scene}\n`;

  if (history && history.length > 0) {
    prompt += `\n之前聊天记录：\n`;
    for (const h of history.slice(-12)) {
      const label = h.role === 'partner' ? 'TA' : '我';
      prompt += `${label}：${h.content}\n`;
    }
  }

  prompt += `\n对方最新说：${message.trim()}\n\n请结合上下文给出5条回复建议。`;
  return prompt;
}

function tryExtract(text: string): Array<{ style: string; reply: string }> | null {
  const lines = text.split('\n').filter((l) => l.trim());
  const suggestions: Array<{ style: string; reply: string }> = [];
  for (const line of lines) {
    const match = line.match(/[\d]+[.、)\]]*\s*[「「【]?(.{1,6})[」」】]?[：:]\s*(.+)/);
    if (match) suggestions.push({ style: match[1], reply: match[2] });
  }
  return suggestions.length >= 3 ? suggestions.slice(0, 5) : null;
}

function mockSuggestions() {
  return [
    { style: '甜蜜版', reply: '嘿嘿，你说的对，但是我想你了怎么办～' },
    { style: '幽默版', reply: '哈哈哈哈你这个说法很新奇，让我笑一会儿' },
    { style: '走心版', reply: '嗯，我明白你的意思，谢谢你跟我说这些' },
    { style: '高情商版', reply: '这个想法不错，我觉得我们可以一起想想' },
    { style: '撩人版', reply: '你说的每句话我都好喜欢，因为你说的呀' },
  ];
}
