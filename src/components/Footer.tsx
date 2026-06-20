import React from 'react';
import { BookOpen, Heart, Sparkles, ExternalLink, HelpCircle, Shield, GraduationCap, Github } from 'lucide-react';

interface FooterProps {
  onNavigate: (mode: 'browse' | 'memory' | 'quiz' | 'writing' | 'dashboard') => void;
  currentView: string;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, currentView }) => {
  return (
    <footer className="border-t border-gray-150 dark:border-slate-850 bg-gray-50/50 dark:bg-slate-950/70 transition-colors duration-300 pb-20 lg:pb-8 pt-10 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-gray-100 dark:border-slate-800">
          
          {/* Col 1: Brand / Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white shadow-md shadow-blue-500/10">
                <BookOpen className="h-4.5 w-4.5" />
              </div>
              <span className="font-extrabold text-base text-gray-800 dark:text-slate-150 tracking-tight">
                Giáo Lý Công Giáo
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-400 leading-relaxed font-medium">
              Ứng dụng học tập, ghi nhớ, trắc nghiệm và ôn thi tự luận thông minh với 650 câu hỏi Giáo lý chính thống. Giúp bạn tích lũy, củng cố Đức Tin một cách trực quan, sinh động.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-500 font-bold font-mono uppercase">
              <span>Bản phát hành ổn định 2.5 ✦</span>
            </div>
          </div>

          {/* Col 2: Navigation Shortcuts */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-gray-750 dark:text-slate-200 tracking-wider uppercase font-sans">
              Phân Hệ Học Tập
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button 
                onClick={() => onNavigate('dashboard')} 
                className={`text-left transition-colors hover:text-blue-500 hover:underline ${
                  currentView === 'dashboard' ? 'text-blue-500' : 'text-gray-450 dark:text-slate-400'
                }`}
                id="footer-nav-dashboard"
              >
                ✦ Bảng điểm (Dashboard)
              </button>
              <button 
                onClick={() => onNavigate('browse')} 
                className={`text-left transition-colors hover:text-blue-500 hover:underline ${
                  currentView === 'browse' ? 'text-blue-500' : 'text-gray-450 dark:text-slate-400'
                }`}
                id="footer-nav-browse"
              >
                ✦ Danh sách bài học
              </button>
              <button 
                onClick={() => onNavigate('memory')} 
                className={`text-left transition-colors hover:text-blue-500 hover:underline ${
                  currentView === 'memory' ? 'text-blue-500' : 'text-gray-450 dark:text-slate-400'
                }`}
                id="footer-nav-memory"
              >
                ✦ Thẻ Flashcard
              </button>
              <button 
                onClick={() => onNavigate('quiz')} 
                className={`text-left transition-colors hover:text-blue-500 hover:underline ${
                  currentView === 'quiz' ? 'text-blue-500' : 'text-gray-450 dark:text-slate-400'
                }`}
                id="footer-nav-quiz"
              >
                ✦ Trắc nghiệm 10 câu
              </button>
              <button 
                onClick={() => onNavigate('writing')} 
                className={`text-left transition-colors hover:text-violet-500 hover:underline col-span-2 ${
                  currentView === 'writing' ? 'text-violet-500' : 'text-gray-450 dark:text-slate-400'
                }`}
                id="footer-nav-writing"
              >
                ✦ Viết tự luận thông minh
              </button>
            </div>
          </div>

          {/* Col 3: Inspired Catholic Verse or Encouragement */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-amber-550 dark:text-amber-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Lời Chúa Khích Lệ
            </h4>
            <div className="rounded-2xl bg-amber-500/5 border border-amber-550/10 p-3.5 space-y-2">
              <p className="text-xs italic text-gray-500 dark:text-slate-400 leading-relaxed font-serif">
                "Lời Chúa là ngọn đèn soi cho con bước, là ánh sáng chỉ đường cho con đi."
              </p>
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 text-right font-serif">
                — Thánh Vịnh 119, 105
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[11px] font-bold text-gray-400 dark:text-slate-500 font-mono">
          <p className="flex items-center gap-1">
            <span>© 2026 Học và Sống Giáo Lý. Thiết kế với</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-[bounce_1.5s_infinite]" />
            <span>cho Hội Thánh Công Giáo.</span>
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-emerald-550" />
              Bảo mật Offline-first
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
              <GraduationCap className="h-3.5 w-3.5" />
              Đắc Nhân Tâm ✦
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
