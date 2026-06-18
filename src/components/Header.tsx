import React, { useState } from 'react';
import { BookOpen, Search, Sparkles, Trophy, Sun, Moon } from 'lucide-react';
import { QuestionItem } from '../types';

interface HeaderProps {
  streak: number;
  allQuestions: QuestionItem[];
  onSelectQuestion: (q: QuestionItem) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streak,
  allQuestions,
  onSelectQuestion,
  theme,
  onToggleTheme,
  zenMode,
  onToggleZenMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<QuestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 1) {
      const lower = val.toLowerCase();
      const filtered = allQuestions.filter(q => 
        q.id.includes(lower) ||
        q.question.toLowerCase().includes(lower) ||
        q.answer.toLowerCase().includes(lower) ||
        q.chapter.toLowerCase().includes(lower) ||
        q.lesson.toLowerCase().includes(lower)
      );
      setResults(filtered.slice(0, 5));
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelectResult = (item: QuestionItem) => {
    onSelectQuestion(item);
    setSearchQuery('');
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-150 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md shadow-blue-500/10">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm sm:text-lg font-bold tracking-tight text-gray-800 dark:text-slate-100">Giáo Lý Công Giáo</h1>
            <p className="hidden text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 sm:block font-mono font-medium">Học thuộc lòng 650 câu hỏi</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md mx-2 sm:mx-4 md:mx-12">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Tìm câu hỏi, nội dung, mã... (VD: 001)"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => { if (results.length > 0) setIsOpen(true); }}
              className="w-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none transition-all focus:border-blue-400 dark:focus:border-blue-900 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950/20"
            />
          </div>

          {/* Results Dropdown */}
          {isOpen && results.length > 0 && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
              <div className="absolute left-0 right-0 z-40 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl shadow-gray-200/50 dark:shadow-none">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Kết quả tìm được ({results.length})</p>
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      className="w-full flex flex-col text-left px-3 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">{item.id}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-xs">{item.lesson}</span>
                      </div>
                      <p className="text-gray-700 dark:text-slate-200 text-sm font-medium line-clamp-1">{item.question}</p>
                      <p className="text-gray-400 dark:text-slate-400 text-xs line-clamp-1 mt-0.5">{item.answer}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Controls (Theme, Streak) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Zen Mode Toggle Button */}
          <button
            onClick={onToggleZenMode}
            title={zenMode ? 'Tắt chế độ Zen (Khôi phục giao diện)' : 'Bật chế độ Zen (Tập trung tối đa)'}
            id="zen-toggle-header-btn"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all focus:outline-none ${
              zenMode
                ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-400 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-100 shadow-sm'
            }`}
          >
            <Sparkles className={`h-4.5 w-4.5 ${zenMode ? 'text-amber-300 animate-pulse' : 'text-blue-500'}`} />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Chuyển sang Giao diện sáng' : 'Chuyển sang Giao diện tối'}
            id="theme-toggle-btn"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-100 shadow-sm transition-all focus:outline-none"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-500 animate-[spin_8s_linear_infinite]" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-blue-600" />
            )}
          </button>

          {/* Streak badge */}
          <div className="flex items-center gap-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 px-3 py-2 sm:px-3.5 sm:py-1.5 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 shadow-xs">
            <Trophy className="h-4 w-4 sm:h-4.5 sm:w-4.5 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold font-mono">{streak} Ngày</span>
          </div>
        </div>
      </div>
    </header>
  );
};
