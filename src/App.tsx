import { useState, useEffect } from 'react';
import { BookOpen, Layers, HelpCircle, LayoutDashboard, ChevronRight, Share2, Brain, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BrowseMode } from './components/BrowseMode';
import { MemoryMode } from './components/MemoryMode';
import { QuizMode } from './components/QuizMode';
import { QuestionItem, UserProgress } from './types';
import { CATECHISM_DATA } from './data';
import { WritingQuiz } from './components/WritingQuiz';
import KinhSangSoiModal from './components/KinhSangSoiModal';
import { Footer } from './components/Footer';

const LOCAL_STORAGE_KEY = 'giaoly_progress_v1';

const INITIAL_PROGRESS: UserProgress = {
  learned: [],
  needsReview: [],
  reviewStates: {},
  streak: 0,
  lastActive: null,
  quizScores: []
};

export default function App() {
  const [view, setView] = useState<'dashboard' | 'browse' | 'memory' | 'quiz' | 'writing'>('dashboard');
  const [progress, setProgress] = useState<UserProgress>(INITIAL_PROGRESS);
  const [searchedQuestion, setSearchedQuestion] = useState<QuestionItem | null>(null);
  const [isKinhOpen, setIsKinhOpen] = useState<boolean>(true);
  const [quickReviewQuestions, setQuickReviewQuestions] = useState<QuestionItem[] | undefined>(undefined);

  useEffect(() => {
    if (view !== 'quiz') {
      setQuickReviewQuestions(undefined);
    }
  }, [view]);
  const [zenMode, setZenMode] = useState<boolean>(() => {
    return localStorage.getItem('giaoly_zen_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('giaoly_zen_mode', zenMode ? 'true' : 'false');
  }, [zenMode]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load user progress from localStorage on boot
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: UserProgress = JSON.parse(saved);
        
        let historyData = parsed.learnedHistory || [];
        const currentLearnedCount = (parsed.learned || []).length;

        // If there is no historical sequence or it is empty, backfill it
        if (historyData.length === 0) {
          const today = new Date();
          const generatedHistory = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            // Linear progression mockup for historical visuals
            const factor = currentLearnedCount > 0 ? (7 - i) / 7 : 0;
            const approxCount = Math.max(0, Math.round(currentLearnedCount * factor));
            generatedHistory.push({
              date: dateStr,
              count: approxCount
            });
          }
          historyData = generatedHistory;
        }

        // Clean and validate structures
        setProgress({
          learned: parsed.learned || [],
          needsReview: parsed.needsReview || [],
          reviewStates: parsed.reviewStates || {},
          streak: parsed.streak || 0,
          lastActive: parsed.lastActive || null,
          quizScores: parsed.quizScores || [],
          learnedHistory: historyData
        });
      } catch (err) {
        console.error('Error parsing local progression:', err);
      }
    } else {
      // Create empty initial state but with 7-days flat baseline of 0 learned questions
      const today = new Date();
      const generatedHistory = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        generatedHistory.push({
          date: dateStr,
          count: 0
        });
      }
      setProgress({
        ...INITIAL_PROGRESS,
        learnedHistory: generatedHistory
      });
    }
    updateStreak();
  }, []);

  // Save progress dynamically on any changes
  const saveProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newProgress));
  };

  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed: UserProgress = JSON.parse(saved);
      if (parsed.lastActive === today) return; // Already checked today

      let currentStreak = parsed.streak || 0;
      if (parsed.lastActive) {
        const lastDate = new Date(parsed.lastActive);
        const diffTime = Math.abs(new Date(today).getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Continuous days
          currentStreak += 1;
        } else if (diffDays > 1) {
          // Streak broken
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      saveProgress({
        ...parsed,
        streak: currentStreak,
        lastActive: today
      });
    } catch {
       // Ignore fallback
    }
  };

  const toggleLearnedStatus = (id: string, forceState?: 'learned' | 'needsReview') => {
    const isCurrentlyLearned = progress.learned.includes(id);
    let newLearned = [...progress.learned];
    let newNeedsReview = [...progress.needsReview];

    if (forceState === 'learned' || (forceState === undefined && !isCurrentlyLearned)) {
      if (!newLearned.includes(id)) newLearned.push(id);
      newNeedsReview = newNeedsReview.filter(x => x !== id);
    } else {
      newLearned = newLearned.filter(x => x !== id);
      if (!newNeedsReview.includes(id)) newNeedsReview.push(id);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let updatedHistory = [...(progress.learnedHistory || [])];
    
    // Find index of today in historical sequence
    const todayIndex = updatedHistory.findIndex(h => h.date === todayStr);
    if (todayIndex >= 0) {
      updatedHistory[todayIndex] = { ...updatedHistory[todayIndex], count: newLearned.length };
    } else {
      updatedHistory.push({ date: todayStr, count: newLearned.length });
    }
    updatedHistory.sort((a, b) => a.date.localeCompare(b.date));
    
    if (updatedHistory.length > 30) {
      updatedHistory = updatedHistory.slice(updatedHistory.length - 30);
    }

    saveProgress({
      ...progress,
      learned: newLearned,
      needsReview: newNeedsReview,
      lastActive: todayStr,
      learnedHistory: updatedHistory
    });
  };

  const handleSaveQuizResult = (correct: number, total: number) => {
    const scoreItem = {
      date: new Date().toISOString().split('T')[0],
      total,
      correct,
      percentage: Math.round((correct / total) * 100)
    };

    saveProgress({
      ...progress,
      quizScores: [...progress.quizScores, scoreItem],
      lastActive: new Date().toISOString().split('T')[0]
    });
  };

  const handleStartQuickReview = () => {
    if (progress.needsReview.length === 0) return;
    const reviewPool = CATECHISM_DATA.filter(q => progress.needsReview.includes(q.id));
    const shuffled = [...reviewPool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(5, shuffled.length));
    setQuickReviewQuestions(selected);
    setView('quiz');
  };

  const handleSelectSearchedQuestion = (item: QuestionItem) => {
    setSearchedQuestion(item);
    setView('browse');
  };

  const isZenActive = zenMode && view !== 'dashboard';

  return (
    <div className={`min-h-screen bg-slate-50/50 dark:bg-slate-950 text-gray-800 dark:text-slate-100 ${isZenActive ? 'pb-8' : 'pb-16'} transition-colors duration-300`}>
      <KinhSangSoiModal isOpen={isKinhOpen} onClose={() => setIsKinhOpen(false)} />
      {/* Top Header navbar */}
      {!isZenActive && (
        <Header
          streak={progress.streak}
          allQuestions={CATECHISM_DATA}
          onSelectQuestion={handleSelectSearchedQuestion}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
          zenMode={zenMode}
          onToggleZenMode={() => setZenMode(prev => !prev)}
          onOpenKinhSangSoi={() => setIsKinhOpen(true)}
        />
      )}

      {/* Main Container */}
      <main className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isZenActive ? 'pt-12 sm:pt-20 pb-12' : 'pt-8'}`}>
        
        {/* Navigation Breadcrumb / quick tab switcher */}
        {!isZenActive && (
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-500 mb-6 font-sans">
            <button 
              onClick={() => setView('dashboard')} 
              className="hover:text-blue-500 flex items-center gap-1.5 focus:outline-none"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Trang Chủ</span>
            </button>
            {view !== 'dashboard' && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-gray-700 dark:text-slate-300 font-bold capitalize">
                  {view === 'browse' ? 'Danh mục bài học' : view === 'memory' ? 'Luyện Flashcard' : view === 'quiz' ? 'Thi trắc nghiệm' : 'Thi tự luận'}
                </span>
              </>
            )}
          </div>
        )}

        {/* View Switcher content */}
        <div className="overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Dashboard
                  progress={progress}
                  totalQuestions={CATECHISM_DATA.length}
                  onNavigate={setView}
                  onOpenKinhSangSoi={() => setIsKinhOpen(true)}
                  onStartQuickReview={handleStartQuickReview}
                />
              </motion.div>
            )}

            {view === 'browse' && (
              <motion.div
                key="browse"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <BrowseMode
                  progress={progress}
                  toggleLearnedStatus={toggleLearnedStatus}
                  searchedQuestion={searchedQuestion}
                  clearSearchedQuestion={() => setSearchedQuestion(null)}
                  zenMode={isZenActive}
                />
              </motion.div>
            )}

            {view === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <MemoryMode
                  progress={progress}
                  toggleLearnedStatus={toggleLearnedStatus}
                  allQuestions={CATECHISM_DATA}
                  zenMode={isZenActive}
                />
              </motion.div>
            )}

            {view === 'quiz' && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <QuizMode
                  allQuestions={CATECHISM_DATA}
                  progress={progress}
                  onSaveQuizResult={handleSaveQuizResult}
                  zenMode={isZenActive}
                  overrideQuestions={quickReviewQuestions}
                  onClearOverrideQuestions={() => setQuickReviewQuestions(undefined)}
                />
              </motion.div>
            )}

            {view === 'writing' && (
              <motion.div
                key="writing"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <WritingQuiz
                  allQuestions={CATECHISM_DATA}
                  progress={progress}
                  onSaveQuizResult={handleSaveQuizResult}
                  toggleLearnedStatus={toggleLearnedStatus}
                  zenMode={isZenActive}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {!isZenActive && <Footer onNavigate={setView} currentView={view} />}
        </div>
      </main>

      {/* Floating Zen Mode HUD controller */}
      {view !== 'dashboard' && (
        <div 
          className={`fixed z-50 flex items-center gap-2 transition-all duration-300 ${
            isZenActive 
              ? 'bottom-6 right-4 sm:right-6' 
              : 'bottom-[74px] right-4 lg:bottom-6 lg:right-6'
          }`}
        >
          <button
            onClick={() => setZenMode(prev => !prev)}
            className={`group flex h-10 w-10 sm:h-auto sm:w-auto items-center justify-center gap-2 sm:px-4 sm:py-2.5 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300 active:scale-95 hover:scale-105 ${
              isZenActive
                ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-amber-500/25'
                : 'bg-white/95 dark:bg-slate-900/95 border-gray-150 dark:border-slate-800 text-gray-700 dark:text-slate-200 hover:text-gray-950 dark:hover:text-white'
            }`}
            title={isZenActive ? 'Thoát Chế độ Tập Trung (Hiện thanh công cụ)' : 'Bật Chế độ Tập Trung (Tối đa sâu sắc)'}
            id="zen-hud-floating-btn"
          >
            <Sparkles className={`h-4.5 w-4.5 ${isZenActive ? 'text-slate-950 animate-pulse' : 'text-blue-500 group-hover:rotate-12 transition-transform'}`} />
            <span className="hidden sm:inline text-xs font-bold font-sans tracking-wide">
              {isZenActive ? 'Thoát Tập Trung' : 'CHẾ ĐỘ TẬP TRUNG'}
            </span>
          </button>
        </div>
      )}

      {/* Persistent Bottom Tab bar on mobile to change modes easily */}
      {!isZenActive && (
        <div className="fixed bottom-0 z-40 w-full border-t border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex justify-around py-2.5 sm:py-3.5 lg:hidden">
          <button
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              view === 'dashboard' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setView('browse')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              view === 'browse' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            <span>Danh mục</span>
          </button>
          <button
            onClick={() => setView('memory')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              view === 'memory' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <Layers className="h-5 w-5" />
            <span>Flashcard</span>
          </button>
          <button
            onClick={() => setView('quiz')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              view === 'quiz' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <HelpCircle className="h-5 w-5" />
            <span>Trắc nghiệm</span>
          </button>
          <button
            onClick={() => setView('writing')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
              view === 'writing' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <Brain className={`h-5 w-5 ${view === 'writing' ? 'text-violet-500 animate-pulse' : ''}`} />
            <span>Tự luận AI</span>
          </button>
        </div>
      )}
    </div>
  );
}
