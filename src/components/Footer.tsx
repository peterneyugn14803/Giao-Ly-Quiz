import React from 'react';
import { BookOpen, Heart, Shield, GraduationCap } from 'lucide-react';

interface FooterProps {
  onNavigate: (mode: 'browse' | 'memory' | 'quiz' | 'writing' | 'dashboard') => void;
  currentView: string;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentView }) => {
  return (
    <footer className="border-t border-gray-150 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950/70 transition-colors duration-300 pb-20 lg:pb-8 pt-10 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="pb-8 border-b border-gray-100 dark:border-slate-800">
          
          {/* Brand / Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white shadow-md shadow-blue-500/10">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <span className="font-extrabold text-base text-gray-800 dark:text-slate-150 tracking-tight">
                Giáo Lý Công Giáo
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-400 leading-relaxed font-medium max-w-2xl">
              Ứng dụng học tập, ghi nhớ, trắc nghiệm và ôn thi tự luận thông minh với 650 câu hỏi Giáo lý chính thống. Giúp bạn tích lũy, củng cố Đức Tin một cách trực quan, sinh động.
            </p>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[11px] font-bold text-gray-400 dark:text-slate-500 font-mono">
          <p className="flex items-center gap-1">
            <span>© 2026 Học và Sống Giáo Lý. </span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-[bounce_1.5s_infinite]" />
          </p>
        </div>

      </div>
    </footer>
  );
};
