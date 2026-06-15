import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, BookOpen, Compass, Flame, Heart, Sparkles, FolderOpen, Tag } from 'lucide-react';
import { QuestionItem, UserProgress } from '../types';
import { getStructuredCatechism, StructuredPart, StructuredLesson } from '../data';

interface BrowseModeProps {
  progress: UserProgress;
  toggleLearnedStatus: (id: string) => void;
  searchedQuestion: QuestionItem | null;
  clearSearchedQuestion: () => void;
}

interface SidebarItem {
  key: string;
  label: string;
  type: 'chapter' | 'unchaptered';
  lessons: StructuredLesson[];
  chapterName?: string;
  sectionName?: string;
}

const getLessonNum = (lessonStr: string): number => {
  const match = lessonStr.match(/BÀI\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 0;
};

const getPartIcon = (short: string) => {
  switch (short) {
    case 'PHẦN I': return <Compass className="h-5.5 w-5.5" />;
    case 'PHẦN II': return <Flame className="h-5.5 w-5.5" />;
    case 'PHẦN III': return <Heart className="h-5.5 w-5.5" />;
    case 'PHẦN IV': return <Sparkles className="h-5.5 w-5.5" />;
    default: return <BookOpen className="h-5.5 w-5.5" />;
  }
};

const getTheme = (color: string) => {
  switch (color) {
    case 'blue':
      return {
        color: 'blue',
        hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20',
        activeBg: 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/10',
        activeText: 'text-blue-500 dark:text-blue-400',
        lightBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
        borderTheme: 'hover:border-blue-300 dark:hover:border-blue-800/80',
        ringTheme: 'focus:ring-blue-100 dark:focus:ring-blue-950/20',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'
      };
    case 'emerald':
      return {
        color: 'emerald',
        hoverBg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20',
        activeBg: 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-500/10',
        activeText: 'text-emerald-500 dark:text-emerald-400',
        lightBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
        borderTheme: 'hover:border-emerald-300 dark:hover:border-emerald-800/80 border-transparent',
        ringTheme: 'focus:ring-emerald-100 dark:focus:ring-emerald-950/20',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
      };
    case 'violet':
      return {
        color: 'violet',
        hoverBg: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/20',
        activeBg: 'bg-violet-600 dark:bg-violet-500 text-white shadow-lg shadow-violet-500/10',
        activeText: 'text-violet-500 dark:text-violet-400',
        lightBg: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
        borderTheme: 'hover:border-violet-300 dark:hover:border-violet-800/80',
        ringTheme: 'focus:ring-violet-100 dark:focus:ring-violet-950/20',
        badgeBg: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/30'
      };
    case 'amber':
      return {
        color: 'amber',
        hoverBg: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/20',
        activeBg: 'bg-amber-600 dark:bg-amber-500 text-white shadow-lg shadow-amber-500/10',
        activeText: 'text-amber-500 dark:text-amber-400',
        lightBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
        borderTheme: 'hover:border-amber-300 dark:hover:border-amber-800/80',
        ringTheme: 'focus:ring-amber-100 dark:focus:ring-amber-950/20',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
      };
    default:
      return {
        color: 'blue',
        hoverBg: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/20',
        activeBg: 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg',
        activeText: 'text-blue-500 dark:text-blue-400',
        lightBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
        borderTheme: 'hover:border-blue-300',
        ringTheme: 'focus:ring-blue-100',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
      };
  }
};

const getSidebarItemsForPart = (part: StructuredPart): { sectionName: string; items: SidebarItem[] }[] => {
  return part.sections.map(sec => {
    const items: SidebarItem[] = [];

    if (sec.name.includes("Tôi tin” – “Chúng tôi tin")) {
      // Chapters
      sec.chapters.forEach(ch => {
        items.push({
          key: `chapter-${ch.name}`,
          label: ch.name,
          type: 'chapter',
          lessons: ch.lessons,
          chapterName: ch.name
        });
      });
      // Plus transitional 5 & 6
      if (sec.lessonsWithoutChapter.length > 0) {
        items.push({
          key: `unchaptered-${sec.name}`,
          label: "Chương ba: Con người đáp lời Thiên Chúa (Bài 5–6)",
          type: 'unchaptered',
          lessons: sec.lessonsWithoutChapter,
          sectionName: sec.name
        });
      }
    }
    else if (sec.name.includes("Nhiệm cục Bí tích")) {
      // Lesson 30 has to go first before Chapters!
      if (sec.lessonsWithoutChapter.length > 0) {
        items.push({
          key: `unchaptered-${sec.name}`,
          label: "Lời nói đầu: Giới thiệu Phụng vụ (Bài 30)",
          type: 'unchaptered',
          lessons: sec.lessonsWithoutChapter,
          sectionName: sec.name
        });
      }
      sec.chapters.forEach(ch => {
        items.push({
          key: `chapter-${ch.name}`,
          label: ch.name,
          type: 'chapter',
          lessons: ch.lessons,
          chapterName: ch.name
        });
      });
    }
    else if (sec.name.includes("Bảy Bí tích của Hội Thánh")) {
      // Lesson 35 before Chapters
      if (sec.lessonsWithoutChapter.length > 0) {
        items.push({
          key: `unchaptered-${sec.name}`,
          label: "Mở đầu: Tổng quan Bảy Bí tích (Bài 35)",
          type: 'unchaptered',
          lessons: sec.lessonsWithoutChapter,
          sectionName: sec.name
        });
      }
      sec.chapters.forEach(ch => {
        items.push({
          key: `chapter-${ch.name}`,
          label: ch.name,
          type: 'chapter',
          lessons: ch.lessons,
          chapterName: ch.name
        });
      });
    }
    else if (sec.name.includes("Mười Điều Răn")) {
      // Lesson 58 before Chapters
      if (sec.lessonsWithoutChapter.length > 0) {
        items.push({
          key: `unchaptered-${sec.name}`,
          label: "Khái quát: Giới luật mười Điều răn (Bài 58)",
          type: 'unchaptered',
          lessons: sec.lessonsWithoutChapter,
          sectionName: sec.name
        });
      }
      sec.chapters.forEach(ch => {
        items.push({
          key: `chapter-${ch.name}`,
          label: ch.name,
          type: 'chapter',
          lessons: ch.lessons,
          chapterName: ch.name
        });
      });
    }
    else {
      sec.chapters.forEach(ch => {
        items.push({
          key: `chapter-${ch.name}`,
          label: ch.name,
          type: 'chapter',
          lessons: ch.lessons,
          chapterName: ch.name
        });
      });

      if (sec.lessonsWithoutChapter.length > 0) {
        const isKinhLayCha = sec.name.includes("Kinh Lạy Cha") || sec.name.includes("Mục thứ hai");
        items.push({
          key: `unchaptered-${sec.name}`,
          label: isKinhLayCha ? "Mục thứ hai: Kinh nguyện Kinh Lạy Cha (Bài 74–75)" : "Các bài học chung khác",
          type: 'unchaptered',
          lessons: sec.lessonsWithoutChapter,
          sectionName: sec.name
        });
      }
    }

    return {
      sectionName: sec.name,
      items
    };
  });
};

export const BrowseMode: React.FC<BrowseModeProps> = ({
  progress,
  toggleLearnedStatus,
  searchedQuestion,
  clearSearchedQuestion
}) => {
  const structuredParts = getStructuredCatechism();

  // Find exact landing position for incoming searched question
  const findStructureForQuestion = (q: QuestionItem) => {
    const lessonNum = getLessonNum(q.lesson);
    for (let pIdx = 0; pIdx < structuredParts.length; pIdx++) {
      const p = structuredParts[pIdx];
      const sidebarItems = getSidebarItemsForPart(p);
      for (const sec of sidebarItems) {
        for (const item of sec.items) {
          if (item.lessons.some(l => l.lessonId === lessonNum)) {
            return {
              partIndex: pIdx,
              itemKey: item.key,
              lessonId: lessonNum
            };
          }
        }
      }
    }
    return null;
  };

  const initialPartIndex = searchedQuestion 
    ? (findStructureForQuestion(searchedQuestion)?.partIndex ?? 0)
    : 0;

  const [activePartIndex, setActivePartIndex] = useState<number>(initialPartIndex);

  const initialSidebarItems = getSidebarItemsForPart(structuredParts[initialPartIndex]);
  const initialItemKey = searchedQuestion
    ? (findStructureForQuestion(searchedQuestion)?.itemKey ?? initialSidebarItems[0]?.items[0]?.key ?? null)
    : (initialSidebarItems[0]?.items[0]?.key ?? null);

  const [activeItemKey, setActiveItemKey] = useState<string | null>(initialItemKey);
  const [activeLesson, setActiveLesson] = useState<number | null>(
    searchedQuestion ? getLessonNum(searchedQuestion.lesson) : null
  );
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>(
    searchedQuestion ? { [searchedQuestion.id]: true } : {}
  );

  // If a search result was clicked, resolve structural routing and expand target question
  React.useEffect(() => {
    if (searchedQuestion) {
      const match = findStructureForQuestion(searchedQuestion);
      if (match) {
        setActivePartIndex(match.partIndex);
        setActiveItemKey(match.itemKey);
        setActiveLesson(match.lessonId);
        setExpandedQuestions(prev => ({ ...prev, [searchedQuestion.id]: true }));
        // Smooth scroll to element placement
        setTimeout(() => {
          const el = document.getElementById(`q-${searchedQuestion.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
      clearSearchedQuestion();
    }
  }, [searchedQuestion, clearSearchedQuestion]);

  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const activePart = structuredParts[activePartIndex];
  const theme = getTheme(activePart.color);
  const sidebarSections = getSidebarItemsForPart(activePart);

  // Find currently selected sidebar item
  const currentItem = sidebarSections
    .flatMap(g => g.items)
    .find(i => i.key === activeItemKey);

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Introduction text */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500 animate-pulse" />
            Mục Lục & Bài Học Giáo Lý Hết Hệ Thống
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Giáo lý được phân hóa khoa học và chuẩn mực theo cấu trúc bốn phần Kinh Điển tương ứng với bản sắc Giáo Hội Công Giáo.
          </p>
        </div>
      </div>

      {/* Part tabs (Bento styling cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {structuredParts.map((part, pIdx) => {
          const metaColor = getTheme(part.color);
          const icon = getPartIcon(part.short);
          const isActive = activePartIndex === pIdx;

          return (
            <button
              key={part.name}
              id={`part-tab-${part.short.replace(' ', '')}`}
              onClick={() => {
                setActivePartIndex(pIdx);
                const derivedSidebarItems = getSidebarItemsForPart(part);
                const firstItem = derivedSidebarItems[0]?.items[0]?.key ?? null;
                setActiveItemKey(firstItem);
                setActiveLesson(null);
              }}
              className={`text-left p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden group focus:outline-none flex flex-col justify-between h-28 ${
                isActive
                  ? `${metaColor.activeBg} border-transparent shadow-lg scale-[1.01]`
                  : 'bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 border-gray-150 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className={`text-[10px] font-black font-mono tracking-widest ${isActive ? 'text-white/80' : 'text-gray-400 dark:text-slate-500'}`}>
                  {part.short}
                </span>
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/10 text-white' : metaColor.lightBg}`}>
                  {icon}
                </div>
              </div>
              <div>
                <h3 className={`text-sm font-extrabold leading-tight ${isActive ? 'text-white' : 'text-gray-800 dark:text-slate-100 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`}>
                  {part.title}
                </h3>
                <p className={`text-[10.5px] mt-0.5 font-medium line-clamp-1 truncate ${isActive ? 'text-white/70' : 'text-gray-400 dark:text-slate-400'}`}>
                  {part.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
        {/* Navigation Sidebar (Sections and Chapters for active part) */}
        <div className="lg:col-span-4 space-y-5">
          {sidebarSections.map((secGroup) => {
            if (secGroup.items.length === 0) return null;
            return (
              <div key={secGroup.sectionName} className="space-y-2">
                <div className="flex items-center gap-1.5 px-2">
                  <span className={`h-2 w-2 rounded-full ${theme.activeText} bg-current opacity-80`}></span>
                  <p className="text-[10.5px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider leading-snug">
                    {secGroup.sectionName}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {secGroup.items.map((item) => {
                    const isActive = activeItemKey === item.key;
                    const isUnchaptered = item.type === 'unchaptered';

                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setActiveItemKey(item.key);
                          setActiveLesson(null);
                        }}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all duration-200 border ${
                          isActive
                            ? `${theme.activeBg} border-transparent shadow-md`
                            : isUnchaptered
                            ? 'bg-amber-50/20 dark:bg-amber-950/10 border-amber-100/40 dark:border-amber-900/10 text-gray-700 dark:text-slate-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                            : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50/50 dark:hover:bg-slate-850 focus:outline-none'
                        }`}
                      >
                        <span className="line-clamp-2 leading-relaxed flex-1 pr-2">
                          {isUnchaptered && (
                            <span className="inline-flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 align-middle">
                              HỌC CHUNG
                            </span>
                          )}
                          {item.label}
                        </span>
                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'rotate-90 text-white' : 'text-gray-400 dark:text-slate-500'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Content Panel (Lessons & Accordions) */}
        <div className="lg:col-span-8 space-y-4">
          {currentItem ? (
            <div className="space-y-4">
              {/* Category Breadcrumb */}
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-5 rounded-3xl shadow-sm dark:shadow-none">
                <span className={`text-[10px] font-extrabold font-mono tracking-widest px-2.5 py-1 rounded-md uppercase ${theme.lightBg} inline-block mb-2 border border-gray-100 dark:border-slate-800`}>
                  {activePart.short} / {currentItem.type === 'chapter' ? 'CHƯƠNG PHÂN' : 'BÀI HỌC CHUNG'}
                </span>
                <h3 className="text-base font-extrabold text-gray-800 dark:text-slate-100 leading-snug">
                  {currentItem.label}
                </h3>
              </div>

              {/* Lesson accordions */}
              {currentItem.lessons.length > 0 ? (
                currentItem.lessons.map((lesson) => {
                  const isLessonActive = activeLesson === lesson.lessonId || activeLesson === null;

                  return (
                    <div key={lesson.lessonId} className="rounded-3xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm dark:shadow-none">
                      {/* Lesson title bar */}
                      <button
                        onClick={() => setActiveLesson(activeLesson === lesson.lessonId ? null : lesson.lessonId)}
                        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/40 dark:bg-slate-900/20 hover:bg-gray-50 dark:hover:bg-slate-800 text-left border-b border-gray-100 dark:border-slate-800 focus:outline-none"
                      >
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-200 leading-snug flex items-center gap-2">
                          <Tag className={`h-3.5 w-3.5 ${theme.activeText}`} />
                          {lesson.name}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 dark:text-slate-500 transition-transform ${
                            activeLesson === lesson.lessonId ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Lesson questions */}
                      {isLessonActive && (
                        <div className="divide-y divide-gray-100 dark:divide-slate-855/50">
                          {lesson.questions.map((q) => {
                            const isExpanded = !!expandedQuestions[q.id];
                            const isLearned = progress.learned.includes(q.id);
                            const needsReview = progress.needsReview.includes(q.id);

                            return (
                              <div key={q.id} id={`q-${q.id}`} className="p-4 sm:p-5 hover:bg-gray-50/20 dark:hover:bg-slate-800/10 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <button
                                    onClick={() => toggleQuestion(q.id)}
                                    className="flex-1 text-left flex items-start gap-3 group focus:outline-none"
                                  >
                                    <span className={`font-mono text-[10px] font-black px-2 py-0.5 rounded leading-none shrink-0 mt-0.5 ${theme.badgeBg} border border-gray-100 dark:border-slate-850`}>
                                      {q.id}
                                    </span>
                                    <div className="space-y-1">
                                      <h4 className={`text-sm font-semibold text-gray-800 dark:text-slate-100 leading-relaxed transition-colors group-hover:${theme.activeText}`}>
                                        {q.question}
                                      </h4>
                                      {q.referenceCode && (
                                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">Tham chiếu: {q.referenceCode}</p>
                                      )}
                                    </div>
                                  </button>

                                  {/* Progress handles */}
                                  <div className="flex items-center gap-2">
                                    {isLearned && (
                                      <span className="text-emerald-500 dark:text-emerald-400" title="Đã thuộc">
                                        <CheckCircle2 className="h-4.5 w-4.5 fill-emerald-50 dark:fill-emerald-950/10" />
                                      </span>
                                    )}
                                    {needsReview && (
                                      <span className="text-orange-500 dark:text-orange-400" title="Cần ôn tập">
                                        <AlertCircle className="h-4.5 w-4.5 fill-orange-50 dark:fill-orange-950/10" />
                                      </span>
                                    )}
                                    <button
                                      onClick={() => toggleLearnedStatus(q.id)}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border shrink-0 ${
                                        isLearned
                                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40'
                                          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:border-blue-200 dark:hover:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400'
                                      }`}
                                    >
                                      {isLearned ? 'Đã thuộc' : 'Học thuộc'}
                                    </button>
                                  </div>
                                </div>

                                {/* Answer box with transitions */}
                                {isExpanded && (
                                  <div className="mt-4 pt-4 border-t border-dashed border-gray-150 dark:border-slate-800 pl-8 pr-4 text-sm text-gray-700 dark:text-slate-200 leading-relaxed bg-gradient-to-r from-gray-50 dark:from-slate-850/40 to-transparent p-3 rounded-2xl animate-slide-down">
                                    <span className={`block font-bold text-[10px] tracking-wider uppercase mb-1 ${theme.activeText}`}>Trả lời (T):</span>
                                    <p className="whitespace-pre-line font-medium text-gray-700 dark:text-slate-200">{q.answer}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-8 rounded-3xl text-center text-gray-400 dark:text-slate-500">
                  Chưa có bài học nào được định vị trong phạm vi này.
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
              <p>Vui lòng lựa chọn một Chương để học.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
