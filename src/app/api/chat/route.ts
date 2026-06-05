import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '请输入消息' }, { status: 400 });
    }
    if (!systemPrompt) {
      return NextResponse.json({ error: '请选择角色' }, { status: 400 });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: mockReply(messages[messages.length - 1]?.content || ''),
        ai: false,
      });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10), // 最近10条对话保持上下文
        ],
        temperature: 0.85,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('DashScope error:', err);
      return NextResponse.json({ error: 'AI 服务暂时不可用' }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '...';
    return NextResponse.json({ reply, ai: true });
  } catch (e) {
    console.error('Chat API error:', e);
    return NextResponse.json({ error: '服务异常' }, { status: 500 });
  }
}

function mockReply(input: string): string {
  const replies = [
    '嗯嗯，然后呢？我在听呀~',
    '哈哈，你说的好有意思！',
    '嗯...让我想想怎么回你',
    '真的吗？跟我多说说嘛',
    '你今天心情怎么样呀？',
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}
