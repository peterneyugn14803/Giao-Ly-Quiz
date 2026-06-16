import React from 'react';
import { BookOpen, HelpCircle, Inbox, Award, ArrowRight, Zap, Target, BookOpenCheck, Brain } from 'lucide-react';
import { QuestionItem, UserProgress } from '../types';

interface DashboardProps {
  progress: UserProgress;
  totalQuestions: number;
  onNavigate: (mode: 'browse' | 'memory' | 'quiz' | 'writing') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ progress, totalQuestions, onNavigate }) => {
  const totalLearned = progress.learned.length;
  const learnedPercent = totalQuestions > 0 ? Math.round((totalLearned / totalQuestions) * 100) : 0;
  const needsReviewCount = progress.needsReview.length;

  const highestScore = progress.quizScores.length > 0 
    ? Math.max(...progress.quizScores.map(q => q.percentage)) 
    : 0;

  const recentQuiz = progress.quizScores.slice(-1)[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-blue-950 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent" />
        <div className="relative px-6 py-10 sm:px-12 sm:py-14 flex flex-col md:flex-row justify-between gap-8 items-start md:items-center">
          <div className="space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <Zap className="h-3.5 w-3.5" />
              <span>Phương Pháp Spaced Repetition</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Đồng Hành Học Tập Giáo Lý Công Giáo
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Hệ thống hóa 650 câu hỏi & trả lời giúp bạn ghi nhớ và học thuộc lòng vững vàng thông qua Flashcard thông minh và trắc nghiệm thực tế.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-8 w-full md:w-auto">
            <div className="text-center bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1 md:flex-initial md:min-w-[100px]">
              <span className="block text-3xl font-extrabold font-mono text-blue-300">{learnedPercent}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Tiến độ thuộc</span>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-1 md:flex-initial md:min-w-[100px]">
              <span className="block text-3xl font-extrabold font-mono text-orange-400">{progress.streak}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Chuỗi ngày</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Progress */}
        <div className="rounded-3xl border border-gray-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider font-mono">Đã Thuộc</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400">
              <BookOpenCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold font-mono text-gray-800 dark:text-slate-100">{totalLearned}</span>
            <span className="text-gray-400 dark:text-slate-500 text-sm">/ {totalQuestions} câu</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-1">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${learnedPercent}%` }} />
          </div>
          <p className="text-right text-[11px] font-semibold text-gray-400 dark:text-slate-500">{learnedPercent}% hoàn thành giáo trình</p>
        </div>

        {/* Needs Review Card */}
        <div className="rounded-3xl border border-gray-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md dark:shadow-none transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider font-mono">Cần Ôn Tập</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-extrabold font-mono text-gray-800 dark:text-slate-100">{needsReviewCount}</span>
            <span className="text-gray-400 dark:text-slate-500 text-sm">câu hỏi yếu</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-snug">
            {needsReviewCount > 0 
              ? `Hệ thống Flashcard đang ưu tiên ghi nhớ ${needsReviewCount} câu chưa thuộc này.` 
              : "Thật tuyệt vời! Không có câu hỏi nào bị đánh dấu yếu lúc này."}
          </p>
        </div>

        {/* Quiz scores */}
        <div className="rounded-3xl border border-gray-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md dark:shadow-none transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider font-mono font-sans">Kỳ Thi Gần Nhất</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold font-mono text-gray-800 dark:text-slate-100">
              {recentQuiz ? `${recentQuiz.correct}/${recentQuiz.total}` : "Chưa thi"}
            </span>
            {recentQuiz && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full font-mono">
                {recentQuiz.percentage}%
              </span>
            )}
          </div>
          {highestScore > 0 ? (
            <p className="text-xs text-gray-500 dark:text-slate-400">Điểm số kỷ lục cao nhất của bạn là <strong className="text-gray-700 dark:text-slate-350 font-mono">{highestScore}%</strong>.</p>
          ) : (
            <p className="text-xs text-gray-400 dark:text-slate-500">Hãy thử bắt đầu một kỳ thi trắc nghiệm để đánh giá sức thuộc!</p>
          )}
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold tracking-tight text-gray-800 dark:text-slate-100">CÁC CHẾ ĐỘ HỌC TẬP CHUYÊN SÂU</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Mode 1: Browse Case */}
          <button
            onClick={() => onNavigate('browse')}
            className="group relative flex flex-col text-left rounded-3xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-lg hover:shadow-blue-500/5 focus:outline-none"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white dark:group-hover:text-white transition-all duration-300">
              <BookOpen className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Danh Mục Bài Học</h4>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1 font-semibold uppercase tracking-wider">Browse Mode</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Hiển thị cấu trúc cây Chương &gt; Bài &gt; Câu Hỏi. Tích hợp Accordion lật đáp án xem nhanh thích hợp học nhẩm thụ động.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-500 dark:text-blue-400">
              <span>Mở bài học</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Mode 2: Flashcard Case */}
          <button
            onClick={() => onNavigate('memory')}
            className="group relative flex flex-col text-left rounded-3xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-lg hover:shadow-orange-500/5 focus:outline-none"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white dark:group-hover:text-white transition-all duration-300">
              <Inbox className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Luyện Flashcard</h4>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1 font-semibold uppercase tracking-wider">Memory Mode</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Áp dụng thuật toán Spaced Repetition (Lặp lại ngắt quãng). Tập trung lặp đi lặp lại những câu bạn đánh dấu “Chưa thuộc”.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-orange-500 dark:text-orange-400">
              <span>Học Flashcard</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Mode 3: Quiz Case */}
          <button
            onClick={() => onNavigate('quiz')}
            className="group relative flex flex-col text-left rounded-3xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-900 hover:shadow-lg hover:shadow-emerald-500/5 focus:outline-none"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-white transition-all duration-300">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Thi Trắc Nghiệm</h4>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1 font-semibold uppercase tracking-wider">Quiz Mode</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Thi trắc nghiệm ngẫu nhiên. Phần mềm tự động xâu chuỗi 3 đáp án nhiễu từ cùng Chương tạo kỳ thi chân thực nhất.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-500 dark:text-emerald-400">
              <span>Vào thi đấu</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Mode 4: Writing Case */}
          <button
            onClick={() => onNavigate('writing')}
            className="group relative flex flex-col text-left rounded-3xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-200 dark:hover:border-violet-900 hover:shadow-lg hover:shadow-violet-500/5 focus:outline-none"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-500 dark:text-violet-400 group-hover:bg-violet-550 group-hover:text-white dark:group-hover:text-white transition-all duration-300">
              <Brain className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Thi Tự Luận AI</h4>
            <p className="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1 font-semibold uppercase tracking-wider">Writing Mode</p>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Nhập câu trả lời bằng gõ bàn phím. Sử dụng trí tuệ nhân tạo Gemini đánh giá theo ý chính thần học và tương đồng từ đồng nghĩa.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-violet-500 dark:text-violet-400">
              <span>Bắt đầu thi gõ</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
