import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Award, 
  Sparkles, 
  HelpCircle, 
  Play, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Compass,
  Flame,
  Heart,
  Filter,
  X,
  Search,
  Grid,
  List
} from 'lucide-react';
import { motion } from 'motion/react';
import { QuestionItem, UserProgress } from '../types';
import { getStructuredCatechism, StructuredPart, StructuredChapter, StructuredLesson } from '../data';

interface MemoryModeProps {
  progress: UserProgress;
  toggleLearnedStatus: (id: string, state?: 'learned' | 'needsReview') => void;
  allQuestions: QuestionItem[];
  zenMode?: boolean;
}

interface FilterScope {
  type: 'all' | 'part' | 'chapter' | 'lesson';
  value: string | number;
  label: string;
}

const getLessonNum = (lessonStr: string): number => {
  const match = lessonStr.match(/BÀI\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

const getQuestionsInScope = (currentScope: FilterScope, allQ: QuestionItem[], partsList: StructuredPart[]): QuestionItem[] => {
  if (currentScope.type === 'all' || currentScope.value === 'all') {
    return allQ;
  }
  
  if (currentScope.type === 'part') {
    const partObj = partsList.find(p => p.name === currentScope.value);
    if (partObj) {
      const list: QuestionItem[] = [];
      partObj.sections.forEach(sec => {
        sec.chapters.forEach(ch => {
          ch.lessons.forEach(les => {
            list.push(...les.questions);
          });
        });
        sec.lessonsWithoutChapter.forEach(les => {
          list.push(...les.questions);
        });
      });
      return list;
    }
    return allQ.filter(q => q.part === currentScope.value);
  }
  
  if (currentScope.type === 'chapter') {
    for (const part of partsList) {
      for (const sec of part.sections) {
        const chapObj = sec.chapters.find(ch => ch.name === currentScope.value);
        if (chapObj) {
          const list: QuestionItem[] = [];
          chapObj.lessons.forEach(les => {
            list.push(...les.questions);
          });
          return list;
        }
      }
    }
    return allQ.filter(q => q.chapter === currentScope.value);
  }
  
  if (currentScope.type === 'lesson') {
    return allQ.filter(q => getLessonNum(q.lesson) === currentScope.value);
  }
  
  return allQ;
};

export const MemoryMode: React.FC<MemoryModeProps> = ({
  progress,
  toggleLearnedStatus,
  allQuestions,
  zenMode = false
}) => {
  const [scope, setScope] = useState<FilterScope>({
    type: 'all',
    value: 'all',
    label: 'Tất cả 75 bài câu hỏi'
  });
  const [studyQueue, setStudyQueue] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<number>(0);
  const [stats, setStats] = useState({ learnedThisSession: 0, forgottenThisSession: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile UI controls
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Collapse status of tree nodes
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({
    "PHẦN THỨ NHẤT: TUYÊN XƯNG ĐỨC TIN": true, // Default open the first part for premium UX
  });
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Synchronize showAnswer with isFlipped, using a beautiful midpoint transition delay of 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnswer(isFlipped);
    }, 150);
    return () => clearTimeout(timer);
  }, [isFlipped]);

  // Immediately clear states when switching card index or scope to avoid UI ghosting
  useEffect(() => {
    setIsFlipped(false);
    setShowAnswer(false);
  }, [currentIndex, scope]);

  // Generate structured parts lists from static data
  const parts = React.useMemo(() => getStructuredCatechism(), []);

  // Filter study queue based on scope
  useEffect(() => {
    let list = getQuestionsInScope(scope, allQuestions, parts);
    
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
  }, [scope, allQuestions, sessionKey, parts]);

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

  // Filter question sets under active scope to show in lists below
  const filteredQuestions = React.useMemo(() => {
    return getQuestionsInScope(scope, allQuestions, parts);
  }, [scope, allQuestions, parts]);

  const unlearnedQuestions = React.useMemo(() => {
    return filteredQuestions.filter(q => progress.needsReview.includes(q.id));
  }, [filteredQuestions, progress.needsReview]);

  const learnedQuestions = React.useMemo(() => {
    return filteredQuestions.filter(q => progress.learned.includes(q.id));
  }, [filteredQuestions, progress.learned]);

  // Nested hierarchical search filter
  const filteredParts = React.useMemo(() => {
    if (!searchQuery.trim()) return parts;
    const q = searchQuery.toLowerCase().trim();
    
    return parts.map(part => {
      const filteredSections = part.sections.map(sec => {
        // Filter chapters
        const filteredChapters = sec.chapters.map(ch => {
          const matchingLessons = ch.lessons.filter(l => 
            l.name.toLowerCase().includes(q) || 
            `bài ${l.lessonId}`.includes(q)
          );
          const chMatches = ch.name.toLowerCase().includes(q);
          
          if (chMatches || matchingLessons.length > 0) {
            return {
              ...ch,
              lessons: chMatches ? ch.lessons : matchingLessons
            };
          }
          return null;
        }).filter((ch): ch is StructuredChapter => ch !== null);

        // Filter lessons without chapter
        const filteredLessonsWithout = sec.lessonsWithoutChapter.filter(l => 
          l.name.toLowerCase().includes(q) || 
          `bài ${l.lessonId}`.includes(q)
        );

        return {
          ...sec,
          chapters: filteredChapters,
          lessonsWithoutChapter: filteredLessonsWithout
        };
      }).filter(sec => sec.chapters.length > 0 || sec.lessonsWithoutChapter.length > 0);

      return {
        ...part,
        sections: filteredSections
      };
    }).filter(part => part.sections.length > 0);
  }, [searchQuery, parts]);

  // Expand matching nodes automatically when typing search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const newExpandedParts: Record<string, boolean> = {};
      const newExpandedChapters: Record<string, boolean> = {};
      
      filteredParts.forEach(part => {
        newExpandedParts[part.name] = true;
        part.sections.forEach(sec => {
          sec.chapters.forEach(ch => {
            newExpandedChapters[ch.name] = true;
          });
        });
      });
      
      setExpandedParts(newExpandedParts);
      setExpandedChapters(newExpandedChapters);
    }
  }, [searchQuery, filteredParts]);

  // Overall statistics calculation
  const totalLeanedOverall = progress.learned.length;
  const overallPercentage = allQuestions.length > 0 ? Math.round((totalLeanedOverall / allQuestions.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 animate-fade-in">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: STATIC HIERARCHICAL DESKTOP SIDEBAR */}
        {!zenMode && (
          <div id="desktop-sidebar" className="hidden lg:block lg:col-span-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-6 h-[calc(100vh-140px)] overflow-y-auto sticky top-24 shadow-sm space-y-4">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-md">
                <Layers className="h-5 w-5 text-orange-500" />
                Phạm Vi Luyện Học
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Đã thuộc {totalLeanedOverall}/{allQuestions.length} câu giáo lý ({overallPercentage}%)</p>
            </div>

            {/* Search box within sidebar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm chương, tên bài, bài số..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 text-gray-750 dark:text-slate-100 outline-none transition-all focus-border-orange-400 dark:focus:border-orange-800"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-2.5 top-2.5 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {/* All questions direct link */}
              <button 
                onClick={() => setScope({ type: 'all', value: 'all', label: `Tất cả ${allQuestions.length} câu hỏi Giáo Lý` })}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                  scope.type === 'all' 
                    ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20 dark:border-blue-800 font-extrabold text-blue-600 dark:text-blue-400' 
                    : 'border-gray-100 dark:border-slate-850 hover:bg-gray-50 dark:hover:bg-slate-800/50 font-bold text-gray-700 dark:text-slate-205 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Grid className="h-4.5 w-4.5" />
                  <span className="text-xs">Tất cả câu hỏi Giáo lý</span>
                </div>
                <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-500">
                  {allQuestions.length} câu
                </span>
              </button>

              {/* Structured hierarchical tree representation */}
              <HierarchyTree 
                partsList={filteredParts}
                activeScope={scope}
                onSelectScope={(s) => setScope(s)}
                progress={progress}
                expandedParts={expandedParts}
                setExpandedParts={setExpandedParts}
                expandedChapters={expandedChapters}
                setExpandedChapters={setExpandedChapters}
                allQuestions={allQuestions}
              />
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: MAIN PRACTICE STAGE */}
        <div className={`col-span-1 ${zenMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-6 max-w-2xl mx-auto w-full`}>
          
          {/* Active study scope indicator on both desktop + mobile wrapper */}
          <div className="bg-gradient-to-r from-orange-50/50 via-white to-orange-50/20 dark:from-slate-900 dark:via-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 uppercase font-mono tracking-widest text-[10px] font-extrabold text-orange-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  PHẠM VI ĐANG LUYỆN TẬP
                </div>
                <h2 className="text-md sm:text-lg font-black text-gray-805 dark:text-white leading-tight">
                  {scope.label}
                </h2>
              </div>

              {/* Mobile button to reveal drawer */}
              {!zenMode && (
                <button
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-xl shadow shadow-blue-200/20"
                >
                  <Filter className="h-4 w-4" />
                  Thay đổi phạm vi học
                </button>
              )}
            </div>

            {/* Quick scope completion stats */}
            {(() => {
              const totalInScope = filteredQuestions.length;
              const learnedInScope = filteredQuestions.filter(q => progress.learned.includes(q.id)).length;
              const scopePercentage = totalInScope > 0 ? Math.round((learnedInScope / totalInScope) * 100) : 0;
              
              return (
                <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-950/20 rounded-2xl p-3 border border-gray-100 dark:border-slate-850/60 text-xs">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between font-bold text-[11px] text-gray-500 dark:text-slate-400">
                      <span>Tiến trình hoàn thành phạm vi ôn tập:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{learnedInScope}/{totalInScope} câu ({scopePercentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${scopePercentage}%` }} />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {studyQueue.length > 0 ? (
            <div id="flashcard-practice-area" className="space-y-6">
              {/* Card statistics bar */}
              {(() => {
                const displayIndex = currentIndex + 1;
                const displayTotal = studyQueue.length;

                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-400 dark:text-slate-500 font-mono">
                      <span>THẺ SỐ: {displayIndex} / {displayTotal}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-500 dark:text-emerald-400">Đã học: {stats.learnedThisSession}</span>
                        <span className="text-orange-500 dark:text-orange-400">Chưa ôn: {stats.forgottenThisSession}</span>
                      </div>
                    </div>

                    <div className="w-full bg-gray-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-orange-500 h-full rounded-full transition-all duration-305" 
                        style={{ width: `${(displayIndex / (displayTotal || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* The Interactive Flipping Card Grid with navigation cues */}
              <div className="flex items-center justify-between gap-3 sm:gap-4 w-full">
                {/* Left Navigation trigger */}
                <button
                  disabled={currentIndex === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentIndex > 0) {
                      setCurrentIndex(prev => prev - 1);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all duration-200 shrink-0 ${
                    currentIndex === 0
                      ? 'opacity-25 cursor-not-allowed bg-gray-50/50 dark:bg-slate-900/50 border-gray-150 dark:border-slate-850 text-gray-400'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-orange-350 dark:hover:border-orange-800/60 text-gray-600 dark:text-slate-350 hover:text-orange-500 dark:hover:text-orange-400 active:scale-95 shadow-sm'
                  }`}
                  title="Câu hỏi trước"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                {/* Main clickable flippable sheet card */}
                <div 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="relative h-96 flex-1 min-w-0 cursor-pointer rounded-3xl [perspective:1000px] group focus:outline-none"
                >
                  <motion.div 
                    className="relative h-full w-full rounded-3xl border border-gray-150 dark:border-slate-800/80"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    {/* Front view (Question panel) */}
                    {!showAnswer && (
                      <div 
                        className="absolute inset-0 h-full w-full rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-8 flex flex-col justify-between shadow-sm group-hover:shadow transition-shadow"
                        style={{ 
                          backfaceVisibility: 'hidden', 
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-extrabold text-orange-500 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded uppercase tracking-wider">CÂU HỎI {currentCard.id}</span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-[200px] font-medium">{currentCard.lesson}</span>
                          </div>
                          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-805 dark:text-slate-100 leading-relaxed pt-2 sm:pt-4">
                            {currentCard.question}
                          </h3>
                        </div>

                        <div className="flex flex-col items-center gap-1.5 text-center text-[11px] sm:text-xs text-gray-400 dark:text-slate-500 font-medium pt-3 sm:pt-4 border-t border-gray-100 dark:border-slate-800">
                          <Eye className="h-4 w-4 text-orange-400 animate-pulse" />
                          <span>Chạm lật thẻ để xem lời Hội Thánh câu {currentCard.id}</span>
                        </div>
                      </div>
                    )}

                    {/* Back view (Answer panel) */}
                    {showAnswer && (
                      <div 
                        className="absolute inset-0 h-full w-full rounded-3xl bg-gradient-to-tr from-slate-50 dark:from-slate-905 via-white dark:via-slate-900 to-orange-50/15 dark:to-orange-950/5 p-6 sm:p-8 flex flex-col justify-between shadow-inner"
                        style={{ 
                          backfaceVisibility: 'hidden', 
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          WebkitTransform: 'rotateY(180deg)',
                        }}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/45 px-2 py-0.5 rounded uppercase tracking-wider">Hội thánh Trả Lời</span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">CÂU {currentCard.id}</span>
                          </div>
                          <p className="text-xs sm:text-sm md:text-base text-gray-700 dark:text-slate-205 leading-relaxed font-semibold whitespace-pre-line pt-2 sm:pt-4 overflow-y-auto max-h-[180px]">
                            {currentCard.answer}
                          </p>
                        </div>

                        <div className="pt-3 sm:pt-4 border-t border-gray-150 dark:border-slate-800/80 flex items-center justify-between text-gray-400 dark:text-slate-500 text-[11px] sm:text-xs">
                          <span>Tham chiếu: {currentCard.referenceCode || "[Compendium]"}</span>
                          <span>Chạm để lật lại câu hỏi</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Right Navigation trigger */}
                <button
                  disabled={currentIndex === studyQueue.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentIndex < studyQueue.length - 1) {
                      setCurrentIndex(prev => prev + 1);
                    }
                  }}
                  className={`p-3 rounded-2xl border transition-all duration-200 shrink-0 ${
                    currentIndex === studyQueue.length - 1
                      ? 'opacity-25 cursor-not-allowed bg-gray-50/50 dark:bg-slate-900/50 border-gray-150 dark:border-slate-850 text-gray-400'
                      : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-orange-355 dark:hover:border-orange-800/60 text-gray-600 dark:text-slate-350 hover:text-orange-500 dark:hover:text-orange-400 active:scale-95 shadow-sm'
                  }`}
                  title="Câu hỏi tiếp theo"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              {/* Status responses */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleResponse('needsReview')}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-orange-200 dark:border-orange-950 bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100/70 dark:hover:bg-orange-905 px-5 py-3.5 text-sm font-bold text-orange-600 dark:text-orange-400 transition-all active:scale-95"
                >
                  <AlertCircle className="h-4.5 w-4.5" />
                  <span>Chưa thuộc lòng</span>
                </button>
                <button
                  onClick={() => handleResponse('learned')}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-950 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-905 px-5 py-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-all active:scale-95"
                >
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  <span>Tôi đã thuộc</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-3xl p-8 space-y-4">
              <p className="text-gray-400 dark:text-slate-500">Không tìm thấy câu hỏi nào thỏa mãn bộ lọc hiện thời.</p>
              <button 
                onClick={restartSession}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-500 text-white font-bold text-sm px-6 py-3 hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Nạp lại danh sách</span>
              </button>
            </div>
          )}

          {/* LOWER STATUS SECTIONS: LIST UNLEARNED & LIST LEARNED OF ACTIVE SCOPE */}
          <div className="border-t border-gray-150 dark:border-slate-800 pt-6 mt-8 space-y-6">
            
            {/* UNLEARNED CARDS LIST */}
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/25 px-4 py-3 rounded-2xl border border-gray-150 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-orange-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200">
                    Câu chưa thuộc lòng ({unlearnedQuestions.length})
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  Mục tiêu hiện tại
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
                          : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-850 hover:border-orange-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded leading-none bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100/10 shrink-0 animate-pulse">
                            Thẻ #{qIdx + 1}
                          </span>
                          <span className="font-mono text-[9px] font-bold px-1 py-0.5 rounded leading-none bg-gray-100 dark:bg-slate-850 text-gray-500">
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
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            let targetIdx = studyQueue.findIndex(item => item.id === q.id);
                            if (targetIdx === -1) {
                              setScope({ type: 'all', value: 'all', label: `Tất cả ${allQuestions.length} câu hỏi Giáo Lý` });
                              targetIdx = 0;
                            }
                            setCurrentIndex(targetIdx);
                            setIsFlipped(false);
                            setShowAnswer(false);
                            
                            const element = document.getElementById('flashcard-practice-area');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="p-2 sm:px-3 sm:py-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-100 transition-all text-xs font-semibold flex items-center gap-1"
                          title="Tập trung học câu này"
                        >
                          <Play className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                          <span className="hidden sm:inline">Học</span>
                        </button>
                        <button
                          onClick={() => toggleLearnedStatus(q.id, 'learned')}
                          className="p-2 sm:px-3 sm:py-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-transparent hover:border-emerald-100 transition-all text-xs font-semibold flex items-center gap-1"
                          title="Đánh dấu thuộc luôn"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span className="hidden sm:inline">Thộc</span>
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

            {/* LEARNED CARDS LIST */}
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/25 px-4 py-3 rounded-2xl border border-gray-150 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-200">
                    Câu đã học thuộc ({learnedQuestions.length})
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  Ghi danh thành quả
                </span>
              </div>

              {learnedQuestions.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {learnedQuestions.map((q, qIdx) => (
                    <div 
                      key={q.id}
                      className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-gray-150 dark:border-slate-850 bg-white dark:bg-slate-900 hover:border-emerald-250 transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded leading-none bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-450 border border-emerald-100/10 shrink-0">
                            Đã thuộc #{qIdx + 1}
                          </span>
                          <span className="font-mono text-[9px] font-bold px-1 py-0.5 rounded leading-none bg-gray-100 dark:bg-slate-850 text-gray-500">
                            ID: {q.id}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-slate-500 truncate max-w-[200px] font-medium">
                            {q.lesson}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-750 dark:text-slate-200 line-clamp-2 leading-relaxed font-semibold">
                          {q.question}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            let targetIdx = studyQueue.findIndex(item => item.id === q.id);
                            if (targetIdx === -1) {
                              setScope({ type: 'all', value: 'all', label: `Tất cả ${allQuestions.length} câu hỏi Giáo Lý` });
                              targetIdx = 0;
                            }
                            setCurrentIndex(targetIdx);
                            setIsFlipped(false);
                            setShowAnswer(false);
                            
                            const element = document.getElementById('flashcard-practice-area');
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="p-2 sm:px-3 sm:py-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-transparent hover:border-blue-100 transition-all text-xs font-semibold flex items-center gap-1"
                          title="Luyện ôn lại"
                        >
                          <Play className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                          <span className="hidden sm:inline font-bold">Lật</span>
                        </button>
                        <button
                          onClick={() => toggleLearnedStatus(q.id, 'needsReview')}
                          className="p-2 sm:px-3 sm:py-2 rounded-xl text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 border border-transparent hover:border-orange-100 transition-all text-xs font-semibold flex items-center gap-1"
                          title="Học lại câu này"
                        >
                          <RefreshCw className="h-3.5 w-3.5 shrink-0 text-orange-500 animate-spin-slow" />
                          <span className="hidden sm:inline font-bold">Chưa thuộc</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50/50 dark:bg-slate-900/10 border border-dashed border-gray-200 dark:border-slate-800 rounded-2xl p-6">
                  <Layers className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-80" />
                  <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest font-mono mb-1">Chưa có câu đã thuộc</h4>
                  <p className="text-[11px] text-gray-450 dark:text-slate-500 max-w-sm mx-auto">Hãy lật thẻ và bấm nút "Tôi đã thuộc" ở trên để ghi danh thành quả tại đây.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* MOBILE DRAWER MODAL OVERLAY SHEET */}
      {isMobileDrawerOpen && (
        <div id="mobile-selection-drawer" className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Sliding Pane */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col z-10 animate-fade-in pl-4 pr-1">
            <div className="p-5 border-b border-gray-150 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-20">
              <div>
                <h3 className="font-black text-gray-900 dark:text-white text-md flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-orange-500" />
                  Chọn Phạm Vi Luyện Học
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">Lướt xem danh sách các bài để học theo tiến độ</p>
              </div>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 rounded-xl text-gray-450 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Search box within drawer */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh chương/bài..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-gray-250 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/25 text-gray-750 dark:text-slate-100 outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-gray-450">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* All questions Option */}
              <button 
                onClick={() => {
                  setScope({ type: 'all', value: 'all', label: `Tất cả ${allQuestions.length} câu hỏi Giáo Lý` });
                  setIsMobileDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                  scope.type === 'all' 
                    ? 'border-blue-500 bg-blue-50/40 text-blue-700 font-extrabold dark:bg-blue-950/20 dark:text-blue-400' 
                    : 'border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Grid className="h-4.5 w-4.5 text-orange-500" />
                  <span className="text-xs font-bold">Học tất cả {allQuestions.length} câu hỏi Giáo lý</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>

              {/* Nested hierarchical tree representation */}
              <div className="pb-8">
                <HierarchyTree 
                  partsList={filteredParts}
                  activeScope={scope}
                  onSelectScope={(s) => {
                    setScope(s);
                    setIsMobileDrawerOpen(false);
                  }}
                  progress={progress}
                  expandedParts={expandedParts}
                  setExpandedParts={setExpandedParts}
                  expandedChapters={expandedChapters}
                  setExpandedChapters={setExpandedChapters}
                  allQuestions={allQuestions}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Extracted Collapsible Hierarchical Tree Component for clean modular rendering
const HierarchyTree: React.FC<{
  partsList: any[];
  activeScope: any;
  onSelectScope: (scope: any) => void;
  progress: UserProgress;
  themeColor?: string;
  expandedParts: Record<string, boolean>;
  setExpandedParts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  expandedChapters: Record<string, boolean>;
  setExpandedChapters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  allQuestions: QuestionItem[];
}> = ({
  partsList,
  activeScope,
  onSelectScope,
  progress,
  expandedParts,
  setExpandedParts,
  expandedChapters,
  setExpandedChapters,
  allQuestions
}) => {
  const learnedSet = new Set(progress.learned);

  const getLessonStats = (lesson: StructuredLesson) => {
    const qCount = lesson.questions.length;
    const learnedCount = lesson.questions.filter(q => learnedSet.has(q.id)).length;
    const percentage = qCount > 0 ? Math.round((learnedCount / qCount) * 100) : 0;
    return { learnedCount, totalCount: qCount, percentage };
  };

  const getChapterStats = (chapter: StructuredChapter) => {
    const chapterQuestions = chapter.lessons.flatMap(l => l.questions);
    const qCount = chapterQuestions.length;
    const learnedCount = chapterQuestions.filter(q => learnedSet.has(q.id)).length;
    const percentage = qCount > 0 ? Math.min(Math.round((learnedCount / qCount) * 100), 100) : 0;
    return { learnedCount, totalCount: qCount, percentage };
  };

  const getPartStats = (part: any) => {
    const partQuestions = part.sections.flatMap((s: any) => 
      [
        ...s.chapters.flatMap((c: any) => c.lessons.flatMap((l: any) => l.questions)),
        ...s.lessonsWithoutChapter.flatMap((l: any) => l.questions)
      ]
    );
    const qCount = partQuestions.length;
    const learnedCount = partQuestions.filter((q: any) => learnedSet.has(q.id)).length;
    const percentage = qCount > 0 ? Math.round((learnedCount / qCount) * 100) : 0;
    return { learnedCount, totalCount: qCount, percentage };
  };

  const togglePart = (partName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedParts(prev => ({ ...prev, [partName]: !prev[partName] }));
  };

  const toggleChapter = (chapterName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters(prev => ({ ...prev, [chapterName]: !prev[chapterName] }));
  };

  const partIconsMap: Record<string, React.ReactNode> = {
    'PHẦN I': <Compass className="h-4 w-4" />,
    'PHẦN II': <Flame className="h-4 w-4" />,
    'PHẦN III': <Heart className="h-4 w-4" />,
    'PHẦN IV': <Sparkles className="h-4 w-4" />,
  };

  return (
    <div className="space-y-3 mt-3">
      {partsList.map((part) => {
        const partStats = getPartStats(part);
        const isPartExpanded = !!expandedParts[part.name];
        const isPartSelected = activeScope.type === 'part' && activeScope.value === part.name;

        return (
          <div key={part.name} className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-gray-50/20 dark:bg-slate-900/5">
            {/* Part Row */}
            <div 
              onClick={() => onSelectScope({ type: 'part', value: part.name, label: part.title })}
              className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                isPartSelected 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'hover:bg-gray-100/70 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`p-1.5 rounded-lg shrink-0 ${isPartSelected ? 'bg-white/20' : 'bg-orange-50 dark:bg-orange-950/20 text-orange-500'}`}>
                  {partIconsMap[part.short] || <BookOpen className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-wider ${isPartSelected ? 'text-blue-105' : 'text-gray-400'}`}>
                      {part.short}
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${isPartSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                      {partStats.percentage}%
                    </span>
                  </div>
                  <h4 className="text-xs font-black truncate">{part.title}</h4>
                </div>
              </div>
              <button 
                onClick={(e) => togglePart(part.name, e)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isPartSelected ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-750 text-gray-450'
                }`}
              >
                {isPartExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>

            {/* Part Children */}
            {isPartExpanded && (
              <div className="border-t border-gray-100 dark:border-slate-850 bg-white dark:bg-slate-900/30 p-2 space-y-3">
                {part.sections.map((section: any, sIdx: number) => (
                  <div key={sIdx} className="space-y-2">
                    {/* Section Label */}
                    <div className="px-1 py-0.5 border-l-2 border-orange-200 dark:border-orange-900 ml-1">
                      <span className="text-[10px] font-black text-gray-450 dark:text-slate-450 uppercase tracking-wide leading-relaxed">
                        {section.name}
                      </span>
                    </div>

                    {/* Chapters items list */}
                    {section.chapters.map((chapter: any) => {
                      const chapterStats = getChapterStats(chapter);
                      const isChapExpanded = !!expandedChapters[chapter.name];
                      const isChapSelected = activeScope.type === 'chapter' && activeScope.value === chapter.name;

                      return (
                        <div key={chapter.name} className="rounded-xl border border-gray-50 dark:border-slate-850 overflow-hidden ml-1">
                          {/* Chapter layout */}
                          <div
                            onClick={() => onSelectScope({ type: 'chapter', value: chapter.name, label: chapter.name })}
                            className={`p-2 flex items-center justify-between cursor-pointer transition-all ${
                              isChapSelected 
                                ? 'bg-orange-500 text-white shadow-sm' 
                                : 'hover:bg-gray-55 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-350 bg-gray-50/40 dark:bg-slate-950/15'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8px] font-bold uppercase shrink-0 ${isChapSelected ? 'text-orange-50' : 'text-gray-450'}`}>CHƯƠNG</span>
                                <span className={`text-[8px] font-black px-1 rounded shrink-0 ${isChapSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450'}`}>
                                  {chapterStats.percentage}%
                                </span>
                              </div>
                              <h5 className="text-[10.5px] font-bold leading-tight mt-0.5">{chapter.name}</h5>
                            </div>
                            <button
                              onClick={(e) => toggleChapter(chapter.name, e)}
                              className={`p-1 rounded-lg transition-colors shrink-0 ${
                                isChapSelected ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400'
                              }`}
                            >
                              {isChapExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {/* Chapter lessons list content (Indented nested) */}
                          {isChapExpanded && (
                            <div className="bg-gray-50/20 dark:bg-slate-950/5 p-1 space-y-1">
                              {chapter.lessons.map((lesson: any) => {
                                const lessonStats = getLessonStats(lesson);
                                const isLessonSelected = activeScope.type === 'lesson' && activeScope.value === lesson.lessonId;

                                return (
                                  <div
                                    key={lesson.lessonId}
                                    onClick={() => onSelectScope({ type: 'lesson', value: lesson.lessonId, label: lesson.name })}
                                    className={`p-1.5 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                                      isLessonSelected
                                        ? 'bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 shadow-xs'
                                        : 'hover:bg-white dark:hover:bg-slate-800 border border-transparent'
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1 pr-2">
                                      <div className="flex items-center gap-1">
                                        <span className={`text-[8px] font-black px-1 rounded ${isLessonSelected ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-gray-150 dark:bg-slate-800 text-gray-500'}`}>
                                          BÀI {lesson.lessonId}
                                        </span>
                                      </div>
                                      <p className={`text-[10px] font-bold leading-normal truncate mt-0.5 ${isLessonSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-slate-400'}`}>
                                        {lesson.name.replace(/^BÀI \d+:\s*/i, '')}
                                      </p>
                                    </div>
                                    <span className={`text-[8.5px] font-black shrink-0 px-1 py-0.2 rounded font-mono ${lessonStats.percentage === 100 ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400' : 'text-gray-400'}`}>
                                      {lessonStats.percentage}%
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* lessons without chapter items list (STANDALONE / SEPARATED) */}
                    {section.lessonsWithoutChapter.length > 0 && (
                      <div className="space-y-1 mt-2-important pt-2 border-t border-dashed border-gray-150 dark:border-slate-850/80 ml-1">
                        <div className="px-1 pb-1">
                          <span className="text-[8.5px] font-black text-amber-500 uppercase tracking-widest font-mono">
                            Bài học chung (Không thuộc chương)
                          </span>
                        </div>
                        {section.lessonsWithoutChapter.map((lesson: any) => {
                          const lessonStats = getLessonStats(lesson);
                          const isLessonSelected = activeScope.type === 'lesson' && activeScope.value === lesson.lessonId;

                          return (
                            <div
                              key={lesson.lessonId}
                              onClick={() => onSelectScope({ type: 'lesson', value: lesson.lessonId, label: lesson.name })}
                              className={`p-2 rounded-xl border border-gray-100 dark:border-slate-850 cursor-pointer flex items-center justify-between transition-all ${
                                isLessonSelected
                                  ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 shadow-sm'
                                  : 'bg-white/80 dark:bg-slate-900/20 hover:bg-gray-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`text-[8px] font-black px-1.5 rounded ${isLessonSelected ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-955/30 text-amber-700'}`}>
                                    BÀI {lesson.lessonId}
                                  </span>
                                  <span className="text-[8px] text-gray-400 dark:text-slate-500 font-medium">
                                    {lessonStats.totalCount} câu hỏi
                                  </span>
                                </div>
                                <p className={`text-[10.5px] font-bold leading-normal truncate ${isLessonSelected ? 'text-blue-800 dark:text-blue-300' : 'text-gray-700 dark:text-slate-350'}`}>
                                  {lesson.name.replace(/^BÀI \d+:\s*/i, '')}
                                </p>
                              </div>
                              <span className={`text-[8.5px] font-black font-mono shrink-0 px-1 py-0.5 rounded ${lessonStats.percentage === 100 ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400' : 'text-gray-400'}`}>
                                {lessonStats.percentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
