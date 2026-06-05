import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

const SCORE_PROMPT = `你是一个恋爱聊天技巧专家。请对用户准备发送的回复进行评分。

评分维度（各20分，总分100分）：
1. 情商指数：是否体贴、共情、考虑对方感受
2. 幽默感：是否有趣、轻松不死板
3. 真诚度：是否真实自然、不刻意做作
4. 撩人指数：是否恰到好处地表达好感
5. 场景适配：是否适合当前的对话场景

严格按照以下JSON格式回复：
{
  "total": 总分,
  "eq": 情商分数,
  "humor": 幽默分数,
  "sincerity": 真诚度分数,
  "charm": 撩人指数分数,
  "fit": 场景适配分数,
  "comment": "一句话总评",
  "tip": "一条具体的改进建议"
}`;

export async function POST(req: NextRequest) {
  try {
    const { reply, partnerMessage, scene } = await req.json();

    if (!reply) {
      return NextResponse.json({ error: '没有要评分的内容' }, { status: 400 });
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ result: mockScore() });
    }

    const userContent = `对方说：${partnerMessage || '（未知）'}\n${scene ? `场景：${scene}\n` : ''}我准备回复：${reply}`;

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
          { role: 'user', content: userContent },
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
    total: 78, eq: 16, humor: 15, sincerity: 17, charm: 15, fit: 15,
    comment: '整体不错，真诚度很好',
    tip: '可以加一点轻松的表情让回复更活泼',
  };
}
