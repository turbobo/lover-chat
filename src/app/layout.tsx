import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '恋人聊天助手 - AI帮你提升聊天技巧',
  description: '选择心仪的AI恋人角色，练习聊天技巧，获得专业评分和建议',
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
