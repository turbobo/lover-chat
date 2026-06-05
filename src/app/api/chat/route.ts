import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const SYSTEM_PROMPT = `你是一个恋爱聊天军师，帮助用户想出高情商的回复。

用户会告诉你：
1. 对方的身份（男朋友/女朋友）
2. 当前场景（可选）
3. 对方说的话

请给出5条不同风格的回复建议，每条建议用一句话概括风格标签，然后是具体的回复内容。

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

风格标签示例（根据对方消息灵活选择最合适的5种）：
- 甜蜜版：温柔甜蜜的回复
- 幽默版：轻松搞笑的回复
- 走心版：真诚深情的回复
- 高情商版：得体有分寸的回复
- 撩人版：适当暧昧的回复
- 傲娇版：嘴硬心软的回复
- 暖心版：温暖治愈的回复
- 撒娇版：可爱撒娇的回复
- 霸气版：自信果断的回复
- 文艺版：浪漫诗意的回复

要求：
- 回复要自然口语化，像真实聊天
- 每条回复1-3句话，不要太长
- 5条风格要有明显区分度
- 考虑对方性别选择合适的语气`;

export async function POST(req: NextRequest) {
  try {
    const { message, partnerGender, scene } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: '请输入对方说的话' }, { status: 400 });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ suggestions: mockSuggestions(), ai: false });
    }

    const userPrompt = buildPrompt(message, partnerGender, scene);

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
      // Try to extract suggestions from text
      const extracted = tryExtract(text);
      if (extracted) {
        return NextResponse.json({ suggestions: extracted, ai: true });
      }
      return NextResponse.json({ suggestions: mockSuggestions(), ai: true });
    }
  } catch (e) {
    console.error('Suggest API error:', e);
    return NextResponse.json({ error: '服务异常' }, { status: 500 });
  }
}

function buildPrompt(message: string, gender?: string, scene?: string): string {
  let prompt = `对方身份：${gender === 'male' ? '男朋友' : '女朋友'}\n`;
  if (scene) prompt += `当前场景：${scene}\n`;
  prompt += `对方说的话：${message.trim()}\n\n请给出5条回复建议。`;
  return prompt;
}

function tryExtract(text: string): Array<{ style: string; reply: string }> | null {
  const lines = text.split('\n').filter((l) => l.trim());
  const suggestions: Array<{ style: string; reply: string }> = [];
  for (const line of lines) {
    const match = line.match(/[\d]+[.、)\]]*\s*[「「【]?(.{1,6})[」」】]?[：:]\s*(.+)/);
    if (match) {
      suggestions.push({ style: match[1], reply: match[2] });
    }
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
