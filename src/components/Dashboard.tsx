import React from 'react';
import { BookOpen, HelpCircle, Inbox, Award, ArrowRight, Zap, Target, BookOpenCheck, Brain, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { QuestionItem, UserProgress } from '../types';

interface DashboardProps {
  progress: UserProgress;
  totalQuestions: number;
  onNavigate: (mode: 'browse' | 'memory' | 'quiz' | 'writing') => void;
  onOpenKinhSangSoi?: () => void;
  onStartQuickReview?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ progress, totalQuestions, onNavigate, onOpenKinhSangSoi, onStartQuickReview }) => {
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-200 shadow-xl border border-amber-200 dark:border-amber-900/30">
        <div className="relative px-6 py-10 sm:px-12 sm:py-14 flex flex-col md:flex-row justify-between gap-8 items-center">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-amber-900 dark:text-amber-100 font-sans">
              Xin Thánh Phaolô Lê Bảo Tịnh<br/>
              <span className="text-xl sm:text-2xl font-medium text-amber-700 dark:text-amber-300">cầu nguyện, xin Chúa ban muôn ơn lành.</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto md:mx-0">
               Cùng với sự bảo trợ của Thánh nhân, hãy bắt đầu hành trình học tập Giáo Lý Công Giáo của bạn một cách trọn vẹn và an yên.
            </p>
            {onOpenKinhSangSoi && (
              <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                <button
                  onClick={onOpenKinhSangSoi}
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/10 transition-all hover:scale-103 active:scale-97 cursor-pointer"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  Kinh Sáng Soi & Lời Chúa Nghị Lực ✦
                </button>
              </div>
            )}
          </div>

          {/* Saint Image */}
          <div className="shrink-0">
            <div className="h-40 w-40 rounded-full border-4 border-amber-200 dark:border-amber-900 shadow-lg overflow-hidden bg-white">
              <img 
                src="/saint-paul-le-bao-tinh.jpg" 
                alt="Thánh Phaolô Lê Bảo Tịnh" 
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
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
          {onStartQuickReview && (
            <div className="mt-4 pt-1">
              <button
                onClick={onStartQuickReview}
                disabled={needsReviewCount === 0}
                className={`w-full inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-black transition-all border ${
                  needsReviewCount > 0
                    ? 'bg-gradient-to-r from-orange-50 to-amber-100 text-amber-700 border-amber-200/50 hover:bg-amber-100/80 hover:text-amber-800 dark:from-amber-950/20 dark:to-orange-950/15 dark:text-amber-400 dark:border-amber-900/40 dark:hover:bg-amber-950/30 dark:hover:text-amber-300 active:scale-97 cursor-pointer shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-800/50 text-gray-400 dark:text-slate-600 border-transparent cursor-not-allowed opacity-50'
                }`}
              >
                <Zap size={13} className={needsReviewCount > 0 ? 'animate-pulse' : ''} />
                Ôn tập nhanh 5 câu ✦
              </button>
            </div>
          )}
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

      {/* Learning Progress Chart Section */}
      <div className="rounded-3xl border border-gray-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md dark:shadow-none transition-all">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-gray-800 dark:text-slate-100 flex items-center gap-2 uppercase font-sans">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400">
                <Target size={15} />
              </span>
              Biểu đồ Tiến Độ Học Tập
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">
              Thống kê lũy kế số câu Giáo Lý bạn đã ghi nhớ thành công (Đã Thuộc) qua thời gian
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-105 dark:border-blue-900/10">
              ⚡ Toàn bộ: {totalLearned} / {totalQuestions} câu
            </span>
          </div>
        </div>

        {/* Chart container */}
        <div className="h-56 w-full">
          {progress.learnedHistory && progress.learnedHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={(progress.learnedHistory || []).map(h => {
                  let displayDate = h.date;
                  try {
                    const parts = h.date.split('-');
                    if (parts.length === 3) {
                      displayDate = `${parts[2]}/${parts[1]}`;
                    }
                  } catch (_) {}
                  return {
                    ...h,
                    displayDate,
                    fullDate: `Ngày ${displayDate}`
                  };
                })} 
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorLearnedArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                  axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }} 
                  className="dark:stroke-slate-800 font-mono"
                  tickLine={false}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                  className="font-mono"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 dark:bg-slate-950/95 border border-slate-205 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 shadow-xl text-xs text-slate-200">
                          <p className="font-bold text-slate-400 mb-1">{payload[0].payload.fullDate}</p>
                          <p className="font-black text-blue-400">
                            Số câu đã thuộc: <span className="text-white text-sm font-mono ml-1">{payload[0].value}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorLearnedArea)" 
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#3b82f6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full border border-dashed border-gray-150 dark:border-slate-800 rounded-3xl text-gray-400 dark:text-slate-500">
              <span className="text-xs font-bold">Hãy lưu thêm câu đã thuộc để hiển thị biểu đồ xu hướng ✦</span>
            </div>
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
