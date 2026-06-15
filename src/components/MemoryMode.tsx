import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, AlertCircle, RefreshCw, Layers, Award, Sparkles, HelpCircle, Play, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { QuestionItem, UserProgress } from '../types';

interface ChapterConfig {
  value: string;
  label: string;
}

interface PartConfig {
  part: string;
  chapters: ChapterConfig[];
}

export const CHAPTER_HIERARCHY: PartConfig[] = [
  {
    part: "PHẦN I: TUYÊN XƯNG ĐỨC TIN (BÀI 1 - 29)",
    chapters: [
      {
        value: "CHƯƠNG MỘT - CON NGƯỜI CÓ KHẢ NĂNG ĐÓN NHẬN THIÊN CHÚA",
        label: "Chương 1: Con người có khả năng đón nhận Thiên Chúa"
      },
      {
        value: "CHƯƠNG HAI - THIÊN CHÚA ĐẾN GẶP CON NGƯỜI",
        label: "Chương 2: Thiên Chúa đến gặp con người"
      },
      {
        value: "CHƯƠNG BA - CON NGƯỜI ĐÁP LỜI THIÊN CHÚA",
        label: "Chương 3: Con người đáp lời Thiên Chúa"
      },
      {
        value: "CHƯƠNG MỘT - TÔI TIN KÍNH ĐỨC CHÚA TRỜI LÀ CHA",
        label: "Chương 1 (Mục II): Tôi tin kính Đức Chúa Trời là Cha"
      },
      {
        value: "CHƯƠNG HAI - TÔI TIN KÍNH ĐỨC CHÚA GIÊSU KITÔ CON MỘT THIÊN CHÚA",
        label: "Chương 2 (Mục II): Tôi tin kính Đức Chúa Giêsu Kitô Con Một Thiên Chúa"
      },
      {
        value: "CHƯƠNG BA - TÔI TIN KÍNH ĐỨC CHÚA THÁNH THẦN",
        label: "Chương 3 (Mục II): Tôi tin kính Đức Chúa Thánh Thần"
      }
    ]
  },
  {
    part: "PHẦN II: CỬ HÀNH MẦU NHIỆM PHỤNG VỤ (BÀI 30 - 44)",
    chapters: [
      {
        value: "CHƯƠNG MỘT - MẦU NHIỆM VƯỢT QUA TRONG ĐỜI SỐNG HỘI THÁNH",
        label: "Chương 1: Mầu nhiệm Vượt Qua trong đời sống Hội Thánh"
      },
      {
        value: "CHƯƠNG HAI - CỬ HÀNH MẦU NHIỆM VƯỢT QUA",
        label: "Chương 2: Cử hành mầu nhiệm Vượt Qua"
      },
      {
        value: "CHƯƠNG MỘT - CÁC BÍ TÍCH KHAI TÂM KITÔ GIÁO",
        label: "Chương 1 (Mục II): Các Bí tích Khai tâm Kitô giáo"
      },
      {
        value: "CHƯƠNG HAI - CÁC BÍ TÍCH CHỮA LÀNH",
        label: "Chương 2 (Mục II): Các Bí tích Chữa lành"
      },
      {
        value: "CHƯƠNG BA - CÁC BÍ TÍCH PHỤC VỤ SỰ HIỆP THÔNG VÀ SỨ VỤ",
        label: "Chương 3 (Mục II): Các Bí tích Phục vụ sự hiệp thông và sứ vụ"
      },
      {
        value: "CHƯƠNG BỐN - NHỮNG CỬ HÀNH PHỤNG VỤ KHÁC",
        label: "Chương 4 (Mục II): Những cử hành phụng vụ khác"
      }
    ]
  },
  {
    part: "PHẦN III: ĐỜI SỐNG TRONG ĐỨC KITÔ (BÀI 45 - 69)",
    chapters: [
      {
        value: "CHƯƠNG MỘT - PHẨM GIÁ CON NGƯỜI",
        label: "Chương 1: Phẩm giá con người"
      },
      {
        value: "CHƯƠNG HAI - CỘNG ĐỒNG NHÂN LOẠI",
        label: "Chương 2: Cộng đồng nhân loại"
      },
      {
        value: "CHƯƠNG BA - ƠN CỨU ĐỘ CỦA THIÊN CHÚA: LỀ LUẬT VÀ ÂN SỦNG",
        label: "Chương 3: Ơn cứu độ của Thiên Chúa / Mười Điều Răn"
      }
    ]
  },
  {
    part: "PHẦN IV: KINH NGUYỆN KITÔ GIÁO (BÀI 70 - 75)",
    chapters: [
      {
        value: "CHƯƠNG MỘT - MẠC KHẢI VỀ CẦU NGUYỆN",
        label: "Chương 1: Mạc khải về cầu nguyện"
      },
      {
        value: "CHƯƠNG HAI - TRUYỀN THỐNG CẦU NGUYỆN",
        label: "Chương 2: Truyền thống cầu nguyện"
      },
      {
        value: "CHƯƠNG BA - ĐỜI SỐNG CẦU NGUYỆN",
        label: "Chương 3: Đời sống cầu nguyện"
      }
    ]
  }
];

interface MemoryModeProps {
  progress: UserProgress;
  toggleLearnedStatus: (id: string, state?: 'learned' | 'needsReview') => void;
  allQuestions: QuestionItem[];
}

export const MemoryMode: React.FC<MemoryModeProps> = ({
  progress,
  toggleLearnedStatus,
  allQuestions
}) => {
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [studyQueue, setStudyQueue] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<number>(0);
  const [stats, setStats] = useState({ learnedThisSession: 0, forgottenThisSession: 0 });

  // Synchronize showAnswer with isFlipped, using a beautiful midpoint transition delay of 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnswer(isFlipped);
    }, 150);
    return () => clearTimeout(timer);
  }, [isFlipped]);

  // Immediately clear states when switching card index or chapter filters to avoid UI ghosting
  useEffect(() => {
    setIsFlipped(false);
    setShowAnswer(false);
  }, [currentIndex, filterChapter]);

  // Extract unique chapters for filtering & find any that might fall outside our hierarchy (defensive mapping)
  const databaseChapters: string[] = Array.from(new Set(allQuestions.map(q => q.chapter)));
  const matchedValues = new Set<string>(
    CHAPTER_HIERARCHY.flatMap(group => group.chapters.map(c => c.value)) as string[]
  );
  const extraChapters = databaseChapters.filter((ch: string) => !matchedValues.has(ch));

  // Filter unlearned questions based on current chapter selection
  const unlearnedQuestions = allQuestions.filter(q => {
    const isUnlearned = progress.needsReview.includes(q.id);
    if (!isUnlearned) return false;
    if (filterChapter !== 'all') {
      return q.chapter === filterChapter;
    }
    return true;
  });

  // Filter learned questions based on current chapter selection
  const learnedQuestions = allQuestions.filter(q => {
    const isLearned = progress.learned.includes(q.id);
    if (!isLearned) return false;
    if (filterChapter !== 'all') {
      return q.chapter === filterChapter;
    }
    return true;
  });

  // Generate study queue based on filters and session state
  useEffect(() => {
    let list = [...allQuestions];
    
    // 1. Filter by Chapter
    if (filterChapter !== 'all') {
      list = list.filter(q => q.chapter === filterChapter);
    }

    // 2. Multi-tier sort: Priority to "Chưa thuộc" (needsReview), then "New" cards, then "Đã thuộc"
    list.sort((a, b) => {
      const aReview = progress.needsReview.includes(a.id);
      const bReview = progress.needsReview.includes(b.id);
      const aLearned = progress.learned.includes(a.id);
      const bLearned = progress.learned.includes(b.id);

      if (aReview && !bReview) return -1;
      if (!aReview && bReview) return 1;
      if (!aLearned && bLearned) return -1;
      if (aLearned && !bLearned) return 1;
      return parseInt(a.id) - parseInt(b.id);
    });

    setStudyQueue(list);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filterChapter, allQuestions, sessionKey]);

  const currentCard = studyQueue[currentIndex];

  const handleResponse = (state: 'learned' | 'needsReview') => {
    if (!currentCard) return;

    toggleLearnedStatus(currentCard.id, state);
    
    if (state === 'learned') {
      setStats(prev => ({ ...prev, learnedThisSession: prev.learnedThisSession + 1 }));
    } else {
      setStats(prev => ({ ...prev, forgottenThisSession: prev.forgottenThisSession + 1 }));
    }

    // Advance queue
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < studyQueue.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Wrap around or restart
        setCurrentIndex(0);
      }
    }, 200);
  };

  const restartSession = () => {
    setSessionKey(prev => prev + 1);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({ learnedThisSession: 0, forgottenThisSession: 0 });
  };

  return (
    <div id="flashcard-practice-area" className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Intro and Filters */}
      <div className="flex flex-col gap-4 border-b border-gray-150 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-orange-500" />
            Luyện Học Thuộc Flashcard
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">Thuật toán ghi nhớ ưu tiên những câu mạc định Chưa Thuộc nhiều hơn.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 self-center shrink-0 font-mono uppercase">Phạm Vi Học:</label>
          <select
            value={filterChapter === 'all' ? (currentCard?.chapter || 'all') : filterChapter}
            onChange={(e) => setFilterChapter(e.target.value)}
            className="w-full rounded-2xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-700 dark:text-slate-200 outline-none transition-all focus:border-orange-300 dark:focus:border-orange-700/80 focus:ring-4 focus:ring-orange-100 dark:focus:ring-orange-950/20 font-medium"
          >
            <option value="all" className="font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-slate-800">
              Tất cả {allQuestions.length} câu hỏi Giáo Lý
            </option>
            {CHAPTER_HIERARCHY.map((group, idx) => (
              <optgroup 
                key={idx} 
                label={group.part} 
                className="font-bold text-xs text-orange-600 dark:text-orange-400 bg-gray-50 dark:bg-slate-950/50 uppercase tracking-wide"
              >
                {group.chapters.map((chap, cIdx) => (
                  <option 
                    key={cIdx} 
                    value={chap.value} 
                    className="font-normal text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 pl-4 py-1"
                  >
                    {chap.label}
                  </option>
                ))}
              </optgroup>
            ))}
            {extraChapters.length > 0 && (
              <optgroup 
                label="CÁC BÀI/PHẦN KHÁC" 
                className="font-bold text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-950/50 uppercase"
              >
                {extraChapters.map((chap, idx) => (
                  <option 
                    key={idx} 
                    value={chap} 
                    className="font-normal text-sm text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 pl-4 py-1"
                  >
                    {chap}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {currentCard ? (
        <div className="space-y-6">
          {/* Progress indicators */}
          {(() => {
            const isUnlearned = currentCard && progress.needsReview.includes(currentCard.id);
            const rawIdx = currentCard ? unlearnedQuestions.findIndex(q => q.id === currentCard.id) : -1;
            const displayIndex = (isUnlearned && rawIdx !== -1) ? rawIdx + 1 : currentIndex + 1;
            const displayTotal = (isUnlearned && rawIdx !== -1) ? unlearnedQuestions.length : studyQueue.length;

            return (
              <>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-400 dark:text-slate-500 font-mono">
                  <span>THẺ SỐ: {displayIndex} / {displayTotal}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-500 dark:text-emerald-400">Đã học: {stats.learnedThisSession}</span>
                    <span className="text-orange-500 dark:text-orange-400">Chưa ôn: {stats.forgottenThisSession}</span>
                  </div>
                </div>

                {/* Simple structural Progress bar */}
                <div className="w-full bg-gray-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${(displayIndex / (displayTotal || 1)) * 100}%` }}
                  />
                </div>
              </>
            );
          })()}

          {/* The Flashcard with Navigation Arrows */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 w-full">
            {/* Left navigation arrow */}
            <button
              disabled={currentIndex === 0}
              onClick={(e) => {
                e.stopPropagation();
                if (currentIndex > 0) {
                  setCurrentIndex(prev => prev - 1);
                }
              }}
              className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 shrink-0 ${
                currentIndex === 0
                  ? 'opacity-25 cursor-not-allowed bg-gray-50/50 dark:bg-slate-900/50 border-gray-150 dark:border-slate-800 text-gray-400 dark:text-slate-600'
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800/60 text-gray-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 active:scale-95 shadow-sm hover:shadow'
              }`}
              title="Câu hỏi trước"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* The Flashcard wrapper container */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative h-96 flex-1 min-w-0 cursor-pointer rounded-3xl [perspective:1000px] group focus:outline-none"
            >
              {/* Inner rotation element */}
              <motion.div 
                className="relative h-full w-full rounded-3xl border border-gray-150 dark:border-slate-800/80"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                
                {/* FRONT SIDE (Question) */}
                {!showAnswer && (
                  <div 
                    className="absolute inset-0 h-full w-full rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between shadow-sm group-hover:shadow-md dark:shadow-none transition-shadow"
                    style={{ 
                      backfaceVisibility: 'hidden', 
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-extrabold text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded uppercase tracking-wider">CÂU HỎI {currentCard.id}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-[200px]">{currentCard.lesson}</span>
                      </div>
                      <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 dark:text-slate-100 leading-relaxed pt-2 sm:pt-4">
                        {currentCard.question}
                      </h3>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 text-center text-[11px] sm:text-xs text-gray-400 dark:text-slate-550 font-medium pt-3 sm:pt-4 border-t border-gray-100 dark:border-slate-800">
                      <Eye className="h-4 w-4 text-orange-400 animate-bounce" />
                      <span>Chạm thẻ bài để lật xem đáp án</span>
                    </div>
                  </div>
                )}

                {/* BACK SIDE (Answer) */}
                {showAnswer && (
                  <div 
                    className="absolute inset-0 h-full w-full rounded-3xl bg-gradient-to-tr from-slate-50 dark:from-slate-900 via-white dark:via-slate-900 to-orange-50/20 dark:to-orange-950/10 p-6 sm:p-8 flex flex-col justify-between shadow-inner"
                    style={{ 
                      backfaceVisibility: 'hidden', 
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      WebkitTransform: 'rotateY(180deg)',
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase tracking-wider">Hội thánh trả lời (T)</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">ID: {currentCard.id}</span>
                      </div>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-slate-200 leading-relaxed font-semibold whitespace-pre-line pt-2 sm:pt-4 overflow-y-auto max-h-[180px]">
                        {currentCard.answer}
                      </p>
                    </div>

                    <div className="pt-3 sm:pt-4 border-t border-gray-150 dark:border-slate-800 flex items-center justify-between text-gray-400 dark:text-slate-550 text-[11px] sm:text-xs">
                      <span>Tham chiếu: {currentCard.referenceCode || "[Có sẵn]"}</span>
                      <span>Chạm để quay lại mặt trước</span>
                    </div>
                  </div>
                )}

              </motion.div>
            </div>

            {/* Right navigation arrow */}
            <button
              disabled={currentIndex === studyQueue.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                if (currentIndex < studyQueue.length - 1) {
                  setCurrentIndex(prev => prev + 1);
                }
              }}
              className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 shrink-0 ${
                currentIndex === studyQueue.length - 1
                  ? 'opacity-25 cursor-not-allowed bg-gray-50/50 dark:bg-slate-900/50 border-gray-150 dark:border-slate-800 text-gray-400 dark:text-slate-600'
                  : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800/60 text-gray-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 active:scale-95 shadow-sm hover:shadow shadow'
              }`}
              title="Câu hỏi tiếp theo"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          {/* Spaced repetition buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleResponse('needsReview')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-900 px-6 py-4 text-sm font-bold text-orange-600 dark:text-orange-400 transition-all active:scale-95"
            >
              <AlertCircle className="h-5 w-5" />
              <span>Chưa thuộc lòng</span>
            </button>
            <button
              onClick={() => handleResponse('learned')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900 px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-all active:scale-95"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>Tôi đã thuộc</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-8 space-y-4">
          <p className="text-gray-400 dark:text-slate-500">Không có câu hỏi nào thỏa mãn bộ lọc hiện tại.</p>
          <button 
            onClick={restartSession}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-500 text-white font-bold text-sm px-6 py-3 hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Xếp lại danh sách</span>
          </button>
        </div>
      )}

      {/* SECTION: UNLEARNED QUESTIONS / CÂU CHƯA THUỘC */}
      <div className="border-t border-gray-150 dark:border-slate-800 pt-6 mt-8 space-y-4">
        <div className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 px-4 py-3 rounded-2xl border border-gray-150 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-orange-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200">
              Câu chưa thuộc lòng ({unlearnedQuestions.length})
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-slate-550 font-mono">
            Phạm vi: {filterChapter === 'all' ? 'Tất cả' : 'Chương hiện tại'}
          </span>
        </div>

        {unlearnedQuestions.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {unlearnedQuestions.map((q, qIdx) => (
              <div 
                key={q.id}
                className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                  currentCard?.id === q.id 
                    ? 'bg-orange-50/15 dark:bg-orange-950/10 border-orange-200 dark:border-orange-900/60 shadow-sm ring-1 ring-orange-100/30' 
                    : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-950/40'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded leading-none bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100/10 shrink-0">
                      Thẻ #{qIdx + 1}
                    </span>
                    <span className="font-mono text-[9px] font-bold px-1 py-0.5 rounded leading-none bg-gray-100 dark:bg-slate-850 text-gray-500 dark:text-slate-400">
                      ID: {q.id}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 truncate max-w-[200px] font-medium">
                      {q.lesson}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-750 dark:text-slate-200 line-clamp-2 leading-relaxed">
                    {q.question}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      // Move to this card in flashcard queue
                      let targetIdx = studyQueue.findIndex(item => item.id === q.id);
                      if (targetIdx === -1) {
                        // Defensive self-healing: if the card is not found in the current filtered queue,
                        // reset the filter, prepend it to the queue to ensure it is present, and set it as the first item
                        setFilterChapter('all');
                        setStudyQueue(prev => [q, ...prev.filter(item => item.id !== q.id)]);
                        targetIdx = 0;
                      }
                      
                      setCurrentIndex(targetIdx);
                      setIsFlipped(false);
                      setShowAnswer(false);
                      
                      // Robust smooth scroll back to the top flashcard practice area
                      const element = document.getElementById('flashcard-practice-area');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all text-xs font-semibold flex items-center gap-1"
                    title="Luyện lại câu hỏi này"
                  >
                    <Play className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="hidden sm:inline">Học Lại</span>
                  </button>
                  <button
                    onClick={() => toggleLearnedStatus(q.id, 'learned')}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all text-xs font-semibold flex items-center gap-1"
                    title="Đánh dấu đã học thuộc"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="hidden sm:inline">Thuộc</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-emerald-50/10 dark:bg-emerald-950/5 border border-dashed border-emerald-150 dark:border-emerald-900/20 rounded-2xl p-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest font-mono mb-1">Mọi thứ đã thuộc lòng</h4>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 max-w-sm mx-auto">Bạn không có câu hỏi nào chưa thuộc lòng trong phạm vi lọc này.</p>
          </div>
        )}
      </div>

      {/* SECTION: LEARNED QUESTIONS / CÂU ĐÃ THUỘC */}
      <div className="border-t border-gray-150 dark:border-slate-800 pt-6 mt-8 space-y-4">
        <div className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 px-4 py-3 rounded-2xl border border-gray-150 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200">
              Câu đã học thuộc ({learnedQuestions.length})
            </h3>
          </div>
          <span className="text-[10px] text-gray-400 dark:text-slate-550 font-mono">
            Phạm vi: {filterChapter === 'all' ? 'Tất cả' : 'Chương hiện tại'}
          </span>
        </div>

        {learnedQuestions.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {learnedQuestions.map((q, qIdx) => (
              <div 
                key={q.id}
                className={`flex items-start justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 ${
                  currentCard?.id === q.id 
                    ? 'bg-emerald-50/15 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60 shadow-sm ring-1 ring-emerald-100/30' 
                    : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-950/40'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded leading-none bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 border border-emerald-100/10 shrink-0">
                      Thẻ Đã Thuộc #{qIdx + 1}
                    </span>
                    <span className="font-mono text-[9px] font-bold px-1 py-0.5 rounded leading-none bg-gray-100 dark:bg-slate-850 text-gray-500 dark:text-slate-400">
                      ID: {q.id}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 truncate max-w-[200px] font-medium">
                      {q.lesson}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-750 dark:text-slate-200 line-clamp-2 leading-relaxed">
                    {q.question}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      // Move to this card in flashcard queue
                      let targetIdx = studyQueue.findIndex(item => item.id === q.id);
                      if (targetIdx === -1) {
                        setFilterChapter('all');
                        setStudyQueue(prev => [q, ...prev.filter(item => item.id !== q.id)]);
                        targetIdx = 0;
                      }
                      
                      setCurrentIndex(targetIdx);
                      setIsFlipped(false);
                      setShowAnswer(false);
                      
                      const element = document.getElementById('flashcard-practice-area');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all text-xs font-semibold flex items-center gap-1"
                    title="Luyện ôn lại câu hỏi này"
                  >
                    <Play className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="hidden sm:inline">Ôn Lại</span>
                  </button>
                  <button
                    onClick={() => toggleLearnedStatus(q.id, 'needsReview')}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30 transition-all text-xs font-semibold flex items-center gap-1"
                    title="Đá về mục chưa thuộc lòng để học lại"
                  >
                    <RefreshCw className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                    <span className="hidden sm:inline">Học Lại</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50/50 dark:bg-slate-900/10 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6">
            <Layers className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest font-mono mb-1">Chưa có câu đã thuộc</h4>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 max-w-sm mx-auto">Hãy bấm nút "Tôi đã thuộc" ở trên để lưu trữ thành quả tại đây.</p>
          </div>
        )}
      </div>
    </div>
  );
};
