import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const SCORE_PROMPT = `你是一个恋爱聊天技巧专家。请对用户最近发送的消息进行评分和点评。

评分维度（各20分，总分100分）：
1. 情商指数：是否体贴、共情
2. 幽默感：是否有趣、不死板
3. 主动性：是否主动推进话题
4. 真诚度：是否真实自然、不刻意
5. 撩人指数：是否恰到好处地表达好感

请严格按照以下JSON格式回复，不要有其他内容：
{
  "total": 总分数字,
  "dimensions": {
    "eq": 情商分数,
    "humor": 幽默分数,
    "initiative": 主动性分数,
    "sincerity": 真诚度分数,
    "charm": 撩人指数分数
  },
  "comment": "一句话总评",
  "tip": "一条具体的改进建议"
}`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: '还没有聊天记录' }, { status: 400 });
    }

    // 提取用户的消息
    const userMessages = messages
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content)
      .join('\n');

    if (!userMessages.trim()) {
      return NextResponse.json({ error: '还没有你的发言' }, { status: 400 });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ result: mockScore() });
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
          { role: 'system', content: SCORE_PROMPT },
          { role: 'user', content: `请评价以下聊天内容中"我"说的话：\n\n${userMessages}` },
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: '评分服务不可用' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';

    try {
      const result = JSON.parse(text);
      return NextResponse.json({ result });
    } catch {
      return NextResponse.json({ error: '评分解析失败' }, { status: 500 });
    }
  } catch (e) {
    console.error('Score API error:', e);
    return NextResponse.json({ error: '服务异常' }, { status: 500 });
  }
}

function mockScore() {
  return {
    total: 72,
    dimensions: { eq: 15, humor: 14, initiative: 13, sincerity: 16, charm: 14 },
    comment: '整体不错，真诚度很好，可以多一点幽默感',
    tip: '试着在回复中加入一些轻松的玩笑或反问，让对话更有趣',
  };
}
