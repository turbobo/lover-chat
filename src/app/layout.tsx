import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '恋爱聊天军师 - AI帮你高情商回复',
  description: '输入对方说的话，AI给出5条不同风格的回复建议，还可评分打分',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
        {children}
      </body>
    </html>
  );
}
