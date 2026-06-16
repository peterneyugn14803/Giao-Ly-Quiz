import React, { useState } from 'react';
import { ChevronRight, CheckCircle2, AlertCircle, BookOpen, Compass, Flame, Heart, Sparkles, Tag, ArrowLeft } from 'lucide-react';
import { QuestionItem, UserProgress } from '../types';
import { getStructuredCatechism, StructuredPart, StructuredLesson } from '../data';

interface BrowseModeProps {
  progress: UserProgress;
  toggleLearnedStatus: (id: string) => void;
  searchedQuestion: QuestionItem | null;
  clearSearchedQuestion: () => void;
}

interface SidebarItem {
  key: string; label: string; type: 'chapter' | 'unchaptered'; lessons: StructuredLesson[]; chapterName?: string; sectionName?: string;
}

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
    case 'blue': return { lightBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400', activeText: 'text-blue-500 dark:text-blue-400' };
    case 'emerald': return { lightBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400', activeText: 'text-emerald-500 dark:text-emerald-400' };
    case 'violet': return { lightBg: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400', activeText: 'text-violet-500 dark:text-violet-400' };
    case 'amber': return { lightBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400', activeText: 'text-amber-500 dark:text-amber-400' };
    default: return { lightBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400', activeText: 'text-blue-500 dark:text-blue-400' };
  }
};

const getSidebarItemsForPart = (part: any) => part.sections.map((sec: any) => ({
  sectionName: sec.name,
  items: sec.chapters.map((ch: any) => ({ key: `chapter-${ch.name}`, label: ch.name, type: 'chapter', lessons: ch.lessons }))
}));

const getProgressForPart = (part: StructuredPart, progress: UserProgress) => {
  const allQuestions = part.sections.flatMap(s => s.chapters.flatMap(c => c.lessons.flatMap(l => l.questions)));
  const learnedCount = allQuestions.filter(q => progress.learned.includes(q.id)).length;
  const percentage = allQuestions.length > 0 ? Math.round((learnedCount / allQuestions.length) * 100) : 0;
  return { percentage, learnedCount, totalCount: allQuestions.length };
};

const getProgressForChapter = (chapter: any, progress: UserProgress) => {
  const allQuestions = chapter.lessons.flatMap((l: any) => l.questions);
  const learnedCount = allQuestions.filter((q: any) => progress.learned.includes(q.id)).length;
  const percentage = allQuestions.length > 0 ? Math.round((learnedCount / allQuestions.length) * 100) : 0;
  return { percentage, learnedCount, totalCount: allQuestions.length };
};

const PartCard: React.FC<{ part: StructuredPart; progress: any; onClick: () => void }> = ({ part, progress, onClick }) => {
  const icon = getPartIcon(part.short);
  return (
    <button onClick={onClick} className="w-full text-left p-6 rounded-3xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-blue-200 dark:hover:border-slate-700 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-black tracking-widest text-gray-400 dark:text-slate-500 uppercase">{part.short}</span>
        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800">{icon}</div>
      </div>
      <h3 className="text-lg font-extrabold text-gray-800 dark:text-slate-100 mb-1">{part.title}</h3>
      <p className="text-sm font-medium text-gray-400 mb-4">{part.subtitle}</p>
      <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div className="bg-blue-500 h-full" style={{ width: `${progress.percentage}%` }}></div>
      </div>
      <span className="text-[10px] text-gray-400 mt-2 block">{progress.percentage}% hoàn thành</span>
    </button>
  );
};
  
const ChapterCard: React.FC<{ chapter: any; progress: any; onClick: () => void }> = ({ chapter, progress, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-5 rounded-2xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-blue-200 dark:hover:border-slate-700">
    <div className="text-left"><h4 className="font-bold">{chapter.label}</h4><p className="text-xs text-gray-400 mt-1">{progress.percentage}% hoàn thành • {progress.learnedCount}/{progress.totalCount} câu</p></div>
    <ChevronRight className="text-gray-400" />
  </button>
);

const QuestionItemView: React.FC<{ q: any; isLearned: boolean; toggleLearned: () => void; isExpanded: boolean; onToggle: () => void }> = ({ q, isLearned, toggleLearned, isExpanded, onToggle }) => (
  <div className="p-4 rounded-2xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-blue-200 dark:hover:border-slate-600 transition-all">
    <div className="flex items-start justify-between gap-4">
      <button 
        onClick={onToggle} 
        className="flex-1 text-left flex items-start gap-3 group focus:outline-none"
      >
        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded leading-none bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mt-0.5">
           {q.id}
        </span>
        <h4 className="text-sm font-bold text-gray-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {q.question}
        </h4>
      </button>
      <div className="flex items-center gap-2">
        <button onClick={toggleLearned} className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${isLearned ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'}`}>
          {isLearned ? '✓ Đã thuộc' : 'Học thuộc'}
        </button>
        <button onClick={onToggle} className="text-gray-400">
           <ChevronRight className={`shrink-0 h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>
    </div>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 mt-4 pt-4 border-t border-dashed' : 'max-h-0 opacity-0'}`}>
      <p className="text-sm font-medium text-gray-900 dark:text-slate-50 leading-relaxed">{q.answer}</p>
    </div>
  </div>
);

export const BrowseMode: React.FC<BrowseModeProps> = ({ progress, toggleLearnedStatus }) => {
  const structuredParts = getStructuredCatechism();
  const [view, setView] = useState<'parts' | 'chapters' | 'questions'>('parts');
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activePart = structuredParts[activePartIndex];
  const sidebarSections = getSidebarItemsForPart(activePart);
  const currentItem = sidebarSections.flatMap(g => g.items).find(i => i.key === activeItemKey);

  // Desktop View
  if (!isMobile) {
    return (
      <div className="grid grid-cols-12 gap-8 pt-4 h-[calc(100vh-100px)]">
        {/* Left Sidebar (Parts + Chapters) */}
        <div className="col-span-4 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {structuredParts.map((part, pIdx) => (
               <button key={part.name} onClick={() => { setActivePartIndex(pIdx); setActiveItemKey(null); }} className={`p-3 rounded-2xl border ${activePartIndex === pIdx ? 'bg-blue-100 border-blue-200' : 'bg-gray-50'}`}>
                 <span className="text-[10px] font-black uppercase text-gray-500">{part.short}</span>
               </button>
            ))}
          </div>
          <div className="space-y-4">
             {sidebarSections.flatMap(s => s.items).map(item => (
                <ChapterCard key={item.key} chapter={item} progress={getProgressForChapter(item, progress)} onClick={() => setActiveItemKey(item.key)} />
              ))}
          </div>
        </div>
        {/* Right Content (Questions) */}
        <div className="col-span-8 overflow-y-auto space-y-3">
          <h2 className="text-2xl font-black">{currentItem?.label || "Chọn chương"}</h2>
           {currentItem?.lessons.flatMap(l => l.questions).map(q => (
             <QuestionItemView 
               key={q.id} q={q} 
               isLearned={progress.learned.includes(q.id)} 
               toggleLearned={() => toggleLearnedStatus(q.id)}
               isExpanded={!!expandedQuestions[q.id]}
               onToggle={() => setExpandedQuestions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
             />
           ))}
        </div>
      </div>
    );
  }

  // Mobile View
  if (view === 'parts') return (
    <div className="space-y-6 pt-4 pb-12 px-4 max-w-md mx-auto">
      <h2 className="text-2xl font-black">Bài học Giáo Lý</h2>
      {structuredParts.map((part, pIdx) => <PartCard key={part.name} part={part} progress={getProgressForPart(part, progress)} onClick={() => { setActivePartIndex(pIdx); setView('chapters'); }} />)}
    </div>
  );
  if (view === 'chapters') return (
    <div className="space-y-4 pt-4 pb-12 px-4 max-w-md mx-auto">
      <button onClick={() => setView('parts')} className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>
      <h2 className="text-xl font-black">{activePart.title}</h2>
      {sidebarSections.flatMap(s => s.items).map(item => <ChapterCard key={item.key} chapter={item} progress={getProgressForChapter(item, progress)} onClick={() => { setActiveItemKey(item.key); setView('questions'); }} />)}
    </div>
  );
  return (
    <div className="space-y-4 pt-4 pb-12 px-4 max-w-md mx-auto">
      <button onClick={() => setView('chapters')} className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Quay lại chương
      </button>
      <h2 className="text-xl font-black">{currentItem?.label}</h2>
      {currentItem?.lessons.flatMap(l => l.questions).map(q => (
        <QuestionItemView key={q.id} q={q} isLearned={progress.learned.includes(q.id)} toggleLearned={() => toggleLearnedStatus(q.id)} isExpanded={!!expandedQuestions[q.id]} onToggle={() => setExpandedQuestions(prev => ({ ...prev, [q.id]: !prev[q.id] }))} />
      ))}
    </div>
  );
};
