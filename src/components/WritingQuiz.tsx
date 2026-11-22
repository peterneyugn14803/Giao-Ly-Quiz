import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Brain, Sparkles, CheckCircle2, AlertCircle, RefreshCw, 
  Play, BookOpen, Layers, ChevronRight, ChevronDown, HelpCircle, 
  Award, CornerDownLeft, Volume2, Info, ArrowRight, ArrowLeft, Filter,
  Check, Minus, X, Mic, MicOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { QuestionItem, UserProgress } from '../types';
import { getStructuredCatechism } from '../data';

// Standard Vietnamese stop words to filter out when automatically identifying keywords
const VIETNAMESE_STOP_WORDS = new Set([
  'là', 'và', 'của', 'trong', 'cho', 'thì', 'mà', 'để', 'ở', 'với', 'các', 'những', 'một', 'này', 'đó', 'được', 'có', 'không', 'khi', 'từ', 'ra', 'vào', 'lên', 'xuống', 'sự', 'cuộc', 'nỗi', 'niềm', 'cái', 'về', 'như', 'nhưng', 'nên', 'bởi', 'vì', 'sao', 'ai', 'gì', 'nào', 'cơ', 'bản', 'quá', 'rất', 'đã', 'sẽ', 'đang', 'đã', 'cơ', 'bản'
]);

// 1. Text normalization helper
export function cleanAndNormalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ')                             // Strip multiple spaces
    .trim();
}

// 2. Automatically extract significant keywords from Catholic answer text
export function extractKeywords(answer: string): string[] {
  const cleaned = cleanAndNormalize(answer);
  if (!cleaned) return [];
  
  const words = cleaned.split(' ');
  const uniqueKeywords = Array.from(new Set(
    words.filter(word => word.length > 2 && !VIETNAMESE_STOP_WORDS.has(word))
  ));
  
  return uniqueKeywords;
}

// 3. Client-side local keyword-matching scorer helper
export function calculateLocalScore(userAnswer: string, correctAnswer: string): {
  score: number;
  matchedKeywords: string[];
  totalKeywords: string[];
} {
  const normUser = cleanAndNormalize(userAnswer);
  const coreKeywords = extractKeywords(correctAnswer);
  
  if (coreKeywords.length === 0) {
    const rawUser = cleanAndNormalize(userAnswer);
    const rawCorrect = cleanAndNormalize(correctAnswer);
    const matched = rawUser === rawCorrect;
    return { 
      score: matched ? 100 : 0, 
      matchedKeywords: matched ? [rawCorrect] : [], 
      totalKeywords: [rawCorrect] 
    };
  }
  
  const matchedKeywords = coreKeywords.filter(keyword => normUser.includes(keyword));
  const score = Math.round((matchedKeywords.length / coreKeywords.length) * 100);
  
  return {
    score,
    matchedKeywords,
    totalKeywords: coreKeywords
  };
}

// 4. Word-by-word comparison for highlighting
export function compareUserAnswer(userAnswer: string, correctAnswer: string) {
  const userWords = userAnswer.trim().split(/\s+/).filter(w => w.length > 0);

  // Create a set of all normalized words in the correct answer for fast lookup
  const correctWordsSet = new Set(
    correctAnswer
      .split(/\s+/)
      .filter(w => w.length > 0)
      .map(w => cleanAndNormalize(w))
  );

  return userWords.map(word => ({
    word: word,
    isCorrect: correctWordsSet.has(cleanAndNormalize(word))
  }));
}

// 5. DiffViewer Component
const DiffViewer: React.FC<{ userAnswer: string; correctAnswer: string }> = ({ userAnswer, correctAnswer }) => {
  const userWords = compareUserAnswer(userAnswer, correctAnswer);
  const correctWords = correctAnswer.split(/\s+/).filter(w => w.length > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-150 dark:border-slate-850 space-y-2">
        <div className="text-[9px] text-gray-450 dark:text-slate-500 font-black tracking-wider uppercase font-mono">BÀI LÀM CỦA BẠN</div>
        <div className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 font-semibold leading-relaxed whitespace-pre-wrap">
          {userWords.map((item, i) => (
            <span key={i} className={item.isCorrect ? "text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/30 px-0.5 rounded" : "text-rose-700 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-950/30 px-0.5 rounded"}>
              {item.word}{' '}
            </span>
          ))}
        </div>
      </div>
      <div className="p-4 bg-blue-50/10 dark:bg-blue-950/10 rounded-2xl border border-blue-100/10 space-y-2">
        <div className="text-[9px] text-blue-500 dark:text-blue-400 font-black tracking-wider uppercase font-mono">ĐÁP ÁN GỐC MẪU</div>
        <div className="text-xs sm:text-sm text-gray-700 dark:text-slate-350 font-semibold leading-relaxed whitespace-pre-wrap">
          {correctWords.map((word, i) => (
            <span key={i} className="text-gray-700 dark:text-slate-350">{word}{' '}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

interface WritingQuizProps {
  allQuestions: QuestionItem[];
  progress: UserProgress;
  onSaveQuizResult?: (correct: number, total: number) => void;
  toggleLearnedStatus: (id: string, forceState?: 'learned' | 'needsReview') => void;
  zenMode?: boolean;
}

export const WritingQuiz: React.FC<WritingQuizProps> = ({
  allQuestions,
  progress,
  onSaveQuizResult,
  toggleLearnedStatus,
  zenMode = false
}) => {
  // 1. Scope selection states (multi-select across Parts, Chapters, and Lessons)
  const structuredParts = useMemo(() => getStructuredCatechism(), []);
  const allStructuredLessonIds = useMemo(
    () =>
      structuredParts.flatMap((part) =>
        part.sections.flatMap((sec) => [
          ...sec.chapters.flatMap((chap) => chap.lessons.map((les) => les.lessonId)),
          ...sec.lessonsWithoutChapter.map((les) => les.lessonId),
        ])
      ),
    [structuredParts]
  );
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>(() => allStructuredLessonIds);
  const [isScopeDropdownOpen, setIsScopeDropdownOpen] = useState<boolean>(false);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const scopePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scopePickerRef.current && !scopePickerRef.current.contains(event.target as Node)) {
        setIsScopeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Custom non-blocking Dialog & Toast states to prevent sandbox iframe crashes
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  const [sessionQuestions, setSessionQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [questionCount, setQuestionCount] = useState<number | 'all'>(10);
  const [customCountInput, setCustomCountInput] = useState<string>('10');
  
  // 2. Typing & Voice answer state
  const [userAnswer, setUserAnswer] = useState<string>('');
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    browserSupportsContinuousListening,
    isMicrophoneAvailable,
  } = useSpeechRecognition();
  const voiceBaseTextRef = useRef<string>('');
  const isVoiceActiveRef = useRef<boolean>(false);
  
  // 3. Scoring modes & response results representation
  const [scoreResult, setScoreResult] = useState<{
    score: number | null;
    feedback: string;
    gradeMethod: 'local' | 'manual';
  } | null>(null);

  // 4. Manual grading input overrides, if preferred
  const [showManualCorrection, setShowManualCorrection] = useState<boolean>(false);

  // 5. Overall Session Metrics
  const [scoresHistory, setScoresHistory] = useState<number[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  const selectedLessonSet = useMemo(() => new Set(selectedLessonIds), [selectedLessonIds]);

  const isAllSelected =
    allStructuredLessonIds.length > 0 &&
    selectedLessonIds.length === allStructuredLessonIds.length;

  const filteredQuestions = useMemo(() => {
    if (isAllSelected) {
      return allQuestions;
    }
    if (selectedLessonIds.length === 0) {
      return [];
    }
    return allQuestions.filter((q) => {
      const match = q.lesson.match(/BÀI\s+(\d+)/i);
      const lessonNum = match ? parseInt(match[1], 10) : 0;
      return selectedLessonSet.has(lessonNum);
    });
  }, [allQuestions, isAllSelected, selectedLessonIds.length, selectedLessonSet]);

  const effectiveQuestionCount = useMemo(() => {
    if (filteredQuestions.length === 0) return 0;
    if (questionCount === 'all') return filteredQuestions.length;
    if (questionCount < 1) return 0;
    return Math.min(questionCount, filteredQuestions.length);
  }, [filteredQuestions.length, questionCount]);

  const toggleAllScopes = () => {
    if (isAllSelected) {
      setSelectedLessonIds([]);
    } else {
      setSelectedLessonIds(allStructuredLessonIds);
    }
  };

  const toggleGroupLessonIds = (groupIds: number[]) => {
    const allInGroupSelected = groupIds.length > 0 && groupIds.every((id) => selectedLessonSet.has(id));
    if (allInGroupSelected) {
      const removeSet = new Set(groupIds);
      setSelectedLessonIds((prev) => prev.filter((id) => !removeSet.has(id)));
    } else {
      setSelectedLessonIds((prev) => {
        const nextSet = new Set(prev);
        groupIds.forEach((id) => nextSet.add(id));
        return Array.from(nextSet);
      });
    }
  };

  const toggleChapterExpand = (chapterKey: string) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterKey) ? prev.filter((k) => k !== chapterKey) : [...prev, chapterKey]
    );
  };

  const selectedScopeChips = useMemo(() => {
    if (isAllSelected || selectedLessonIds.length === 0) return [];
    const chips: { key: string; label: string; lessonIds: number[] }[] = [];

    structuredParts.forEach((part) => {
      const partLessonIds = part.sections.flatMap((sec) => [
        ...sec.chapters.flatMap((chap) => chap.lessons.map((les) => les.lessonId)),
        ...sec.lessonsWithoutChapter.map((les) => les.lessonId),
      ]);
      const allPartSelected =
        partLessonIds.length > 0 && partLessonIds.every((id) => selectedLessonSet.has(id));

      if (allPartSelected) {
        chips.push({
          key: `part:${part.short}`,
          label: `${part.short}: ${part.title}`,
          lessonIds: partLessonIds,
        });
        return;
      }

      part.sections.forEach((sec) => {
        sec.chapters.forEach((chap) => {
          const chapIds = chap.lessons.map((les) => les.lessonId);
          const allChapSelected = chapIds.length > 0 && chapIds.every((id) => selectedLessonSet.has(id));
          if (allChapSelected) {
            chips.push({
              key: `chapter:${chap.name}`,
              label: chap.name,
              lessonIds: chapIds,
            });
          } else {
            chap.lessons.forEach((les) => {
              if (selectedLessonSet.has(les.lessonId)) {
                chips.push({
                  key: `lesson:${les.lessonId}`,
                  label: les.name,
                  lessonIds: [les.lessonId],
                });
              }
            });
          }
        });

        sec.lessonsWithoutChapter.forEach((les) => {
          if (selectedLessonSet.has(les.lessonId)) {
            chips.push({
              key: `lesson:${les.lessonId}`,
              label: les.name,
              lessonIds: [les.lessonId],
            });
          }
        });
      });
    });

    return chips;
  }, [isAllSelected, selectedLessonIds.length, selectedLessonSet, structuredParts]);

  const selectedScopeSummaryText = useMemo(() => {
    if (isAllSelected) {
      return `Mọi chương bài trong Giáo trình (Tất cả ${allQuestions.length} câu)`;
    }
    if (selectedLessonIds.length === 0) {
      return 'Chưa chọn chương hoặc bài nào';
    }
    if (selectedScopeChips.length === 1) {
      return `${selectedScopeChips[0].label} (${filteredQuestions.length} câu)`;
    }
    return `Đã chọn ${selectedScopeChips.length} mục (${filteredQuestions.length} câu)`;
  }, [allQuestions.length, filteredQuestions.length, isAllSelected, selectedLessonIds.length, selectedScopeChips]);

  // Focus reference for textareas
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stopVoiceInput = useCallback(() => {
    isVoiceActiveRef.current = false;
    if (listening) {
      SpeechRecognition.stopListening().catch(() => {});
    }
  }, [listening]);

  const toggleVoiceInput = async () => {
    if (scoreResult !== null) return;

    if (listening) {
      stopVoiceInput();
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setToastMessage('Nhập bằng giọng nói cần kết nối mạng. Khi ngoại tuyến, bạn vẫn có thể gõ và chấm điểm tự luận bình thường.');
      return;
    }

    if (!browserSupportsSpeechRecognition) {
      setToastMessage('Trình duyệt của bạn chưa hỗ trợ nhập liệu bằng giọng nói. Vui lòng thử Chrome, Edge hoặc Safari.');
      return;
    }

    if (!isMicrophoneAvailable) {
      setToastMessage('Không thể truy cập Micro. Vui lòng kiểm tra và cấp quyền Micro cho trình duyệt.');
      return;
    }

    try {
      voiceBaseTextRef.current = userAnswer;
      isVoiceActiveRef.current = true;
      resetTranscript();
      await SpeechRecognition.startListening({
        continuous: browserSupportsContinuousListening,
        interimResults: true,
        language: 'vi-VN',
      });
    } catch {
      isVoiceActiveRef.current = false;
      setToastMessage('Không thể bật nhận diện giọng nói. Vui lòng kiểm tra quyền Micro.');
    }
  };

  useEffect(() => {
    if (!isVoiceActiveRef.current || scoreResult !== null) return;

    if (transcript) {
      const base = voiceBaseTextRef.current;
      const separator = base && !/\s$/.test(base) ? ' ' : '';
      setUserAnswer(`${base}${separator}${transcript}`);
    }

    if (!listening) {
      isVoiceActiveRef.current = false;
    }
  }, [transcript, listening, scoreResult]);

  useEffect(() => {
    return () => {
      SpeechRecognition.abortListening().catch(() => {});
    };
  }, []);

  // Restart / Init writing quiz sessions
  const startQuizSession = () => {
    if (filteredQuestions.length === 0) {
      setToastMessage('Vui lòng chọn ít nhất 1 chương hoặc bài học để bắt đầu!');
      return;
    }

    stopVoiceInput();
    resetTranscript();

    // Fisher-Yates shuffle on a shallow copy, then take the user-selected number of questions
    const shuffled = [...filteredQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, effectiveQuestionCount);

    setSessionQuestions(selected);
    setCurrentIndex(0);
    setUserAnswer('');
    setScoreResult(null);
    setScoresHistory([]);
    setQuizStarted(true);
    setShowSummary(false);
    setShowManualCorrection(false);
    setIsScopeDropdownOpen(false);

    // Auto-focus on start
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 200);
  };

  const currentQuestion = sessionQuestions[currentIndex];

  const handleNextQuestion = () => {
    stopVoiceInput();
    resetTranscript();

    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setScoreResult(null);
      setShowManualCorrection(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    } else {
      // Finished all writing exercises in this session
      setShowSummary(true);
      // Persist results through callback
      if (onSaveQuizResult) {
        const passCount = scoresHistory.filter(s => s >= 50).length;
        onSaveQuizResult(passCount, sessionQuestions.length);
      }
    }
  };

  const handleSubmitAndGrade = () => {
    if (!currentQuestion) return;
    stopVoiceInput();

    const localGrading = calculateLocalScore(userAnswer, currentQuestion.answer);

    setScoreResult({
      score: localGrading.score,
      gradeMethod: 'local',
      feedback: localGrading.score >= 80
        ? 'Bài làm xuất sắc! Bạn đã nắm vững các từ khóa cốt lõi của câu giáo lý.'
        : localGrading.score >= 50
        ? 'Bài làm khá ổn. Bạn đã nắm bắt được ý chính cốt lõi nhưng còn thiếu một số thuật ngữ cụ thể hơn của đáp án gốc.'
        : 'Bài làm chưa đạt yêu cầu. Bạn hãy xem thêm đáp án gốc và gõ lại lần nữa để tăng phản xạ ghi nhớ.',
    });
    setScoresHistory(prev => [...prev, localGrading.score]);
  };

  const handleManualScoreSelect = (overrideScore: number) => {
    if (!scoreResult) return;
    
    // Update the history last item with chosen score
    setScoresHistory(prev => {
      const copy = [...prev];
      if (copy.length > 0) {
        copy[copy.length - 1] = overrideScore;
      }
      return copy;
    });

    setScoreResult(prev => prev ? {
      ...prev,
      score: overrideScore,
      gradeMethod: 'manual',
    } : null);

    setShowManualCorrection(false);
  };

  // Helper function to color score badges dynamically
  const getScoreColorClass = (score: number | null) => {
    if (score === null) return 'text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30';
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/20 dark:border-amber-900/30';
    return 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-950/20 dark:border-rose-900/30';
  };

  const getScoreBgClass = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in" id="writing-exam-root">
      
      {/* 2. QUIZ SETTING HEADER VIEW (Before clicking Start) */}
      {!quizStarted && (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          {!zenMode ? (
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Brain className="h-4 w-4" />
                  <span>Năng lực thi gõ Tự Luận thông minh</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">
                  Chế Độ Thi Tự Luận & Gõ Câu Trả Lời
                </h2>
                <p className="text-gray-550 dark:text-slate-405 text-xs sm:text-sm leading-relaxed">
                  Tập luyện viết câu trả lời trực tiếp. Hệ thống tự động so khớp <strong>Từ khóa cốt lõi</strong> cục bộ và đối chiếu từng từ ngữ với đáp án gốc, giúp bạn kiểm tra độ chính xác và ghi nhớ sâu sắc nội dung giáo lý.
                </p>
              </div>
              <div className="bg-orange-50/40 dark:bg-orange-950/20 p-5 rounded-2xl border border-orange-100/30 shrink-0 w-full md:w-auto text-center md:text-left">
                <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">MỤC TIÊU PHÒNG THI</div>
                <div className="text-2xl font-black font-mono text-orange-700 dark:text-orange-400">
                  {effectiveQuestionCount} <span className="text-sm font-bold text-orange-500/70">/ {filteredQuestions.length}</span>
                </div>
                <div className="text-[10px] text-gray-400 dark:text-slate-500 font-bold tracking-widest font-mono uppercase">Câu tự luận ngẫu nhiên</div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-1 py-1.5">
              <div className="inline-flex items-center justify-center gap-2 text-yellow-500">
                <Sparkles className="h-5 w-5 animate-pulse" />
                <h2 className="text-base font-black text-gray-800 dark:text-slate-150 uppercase tracking-widest">
                  LUYỆN THI TỰ LUẬN TẬP TRUNG
                </h2>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">CHẾ ĐỘ TẬP TRUNG ĐANG BẬT</p>
            </div>
          )}

          <hr className="border-gray-150 dark:border-slate-850" />

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Scope selection (Multi-select Parts, Chapters & Lessons) */}
            <div className="space-y-3" ref={scopePickerRef}>
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold tracking-wider uppercase text-gray-500 dark:text-slate-400 font-sans block">
                  Phạm Vi Câu Hỏi Để Luyện Tự Luận:
                </label>
                <span className="text-[11px] font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg">
                  {filteredQuestions.length} câu
                </span>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsScopeDropdownOpen((prev) => !prev)}
                  className="w-full text-left text-sm font-semibold rounded-2xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 pr-10 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{selectedScopeSummaryText}</span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    <ChevronDown className={`h-4 w-4 transition-transform ${isScopeDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isScopeDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-2 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                    {/* Quick actions header */}
                    <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-slate-850">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleAllScopes}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                        {!isAllSelected && selectedLessonIds.length > 0 && (
                          <>
                            <span className="text-gray-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={() => setSelectedLessonIds([])}
                              className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-rose-500"
                            >
                              Xóa lựa chọn
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsScopeDropdownOpen(false)}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                      >
                        Xong
                      </button>
                    </div>

                    {/* Multi-level checklist */}
                    <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                      {structuredParts.map((part) => {
                        const partLessonIds = part.sections.flatMap((sec) => [
                          ...sec.chapters.flatMap((chap) => chap.lessons.map((les) => les.lessonId)),
                          ...sec.lessonsWithoutChapter.map((les) => les.lessonId),
                        ]);
                        const partQuestionCount = part.sections.reduce(
                          (acc, sec) =>
                            acc +
                            sec.chapters.reduce(
                              (cAcc, chap) =>
                                cAcc + chap.lessons.reduce((lAcc, les) => lAcc + les.questions.length, 0),
                              0
                            ) +
                            sec.lessonsWithoutChapter.reduce((lAcc, les) => lAcc + les.questions.length, 0),
                          0
                        );
                        const selectedInPartCount = partLessonIds.filter((id) =>
                          selectedLessonSet.has(id)
                        ).length;
                        const isPartChecked =
                          partLessonIds.length > 0 && selectedInPartCount === partLessonIds.length;
                        const isPartPartial =
                          selectedInPartCount > 0 && selectedInPartCount < partLessonIds.length;

                        return (
                          <div
                            key={part.name}
                            className="rounded-xl border border-gray-150 dark:border-slate-850 overflow-hidden"
                          >
                            {/* Part row */}
                            <button
                              type="button"
                              onClick={() => toggleGroupLessonIds(partLessonIds)}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-gray-50/80 dark:bg-slate-950/60 hover:bg-gray-100/80 dark:hover:bg-slate-850 transition-colors text-left"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                    isPartChecked || isPartPartial
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                                  }`}
                                >
                                  {isPartChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                  {isPartPartial && <Minus className="h-3 w-3 stroke-[3]" />}
                                </span>
                                <span className="text-xs font-black text-gray-800 dark:text-slate-100 truncate">
                                  {part.short}: {part.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-slate-500 shrink-0">
                                {partQuestionCount} câu
                              </span>
                            </button>

                            {/* Chapters & Lessons under Part */}
                            <div className="divide-y divide-gray-100 dark:divide-slate-850/70 bg-white dark:bg-slate-900">
                              {part.sections.flatMap((sec) => [
                                ...sec.chapters.map((chap) => {
                                  const chapIds = chap.lessons.map((les) => les.lessonId);
                                  const chapKey = `${part.short}::${chap.name}`;
                                  const isExpanded = expandedChapters.includes(chapKey);
                                  const chapQuestionCount = chap.lessons.reduce(
                                    (acc, l) => acc + l.questions.length,
                                    0
                                  );
                                  const selectedInChap = chapIds.filter((id) =>
                                    selectedLessonSet.has(id)
                                  ).length;
                                  const isChapChecked =
                                    chapIds.length > 0 && selectedInChap === chapIds.length;
                                  const isChapPartial =
                                    selectedInChap > 0 && selectedInChap < chapIds.length;

                                  return (
                                    <div key={chapKey}>
                                      <div className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-blue-50/40 dark:hover:bg-slate-850/50 transition-colors">
                                        <button
                                          type="button"
                                          onClick={() => toggleGroupLessonIds(chapIds)}
                                          className="flex-1 flex items-center gap-2.5 text-left min-w-0"
                                        >
                                          <span
                                            className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                              isChapChecked || isChapPartial
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                                            }`}
                                          >
                                            {isChapChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                            {isChapPartial && <Minus className="h-3 w-3 stroke-[3]" />}
                                          </span>
                                          <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 line-clamp-2 leading-snug">
                                            {chap.name}
                                          </span>
                                        </button>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">
                                            {chapQuestionCount} câu
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => toggleChapterExpand(chapKey)}
                                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-500 transition-colors"
                                            title={isExpanded ? 'Thu gọn danh sách bài' : 'Chọn từng bài trong chương'}
                                          >
                                            <ChevronRight
                                              className={`h-3.5 w-3.5 transition-transform ${
                                                isExpanded ? 'rotate-90 text-blue-500' : ''
                                              }`}
                                            />
                                          </button>
                                        </div>
                                      </div>

                                      {isExpanded && (
                                        <div className="pl-8 pr-3 pb-2 pt-1 space-y-1 bg-slate-50/60 dark:bg-slate-950/30 border-t border-gray-100 dark:border-slate-850/50">
                                          {chap.lessons.map((les) => {
                                            const isLesChecked = selectedLessonSet.has(les.lessonId);
                                            return (
                                              <button
                                                key={les.lessonId}
                                                type="button"
                                                onClick={() => toggleGroupLessonIds([les.lessonId])}
                                                className="w-full flex items-center justify-between gap-2 py-1 px-2 rounded-lg hover:bg-white dark:hover:bg-slate-900 transition-colors text-left"
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <span
                                                    className={`h-3.5 w-3.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                                      isLesChecked
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                                                    }`}
                                                  >
                                                    {isLesChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                                  </span>
                                                  <span className="text-[11px] font-medium text-gray-600 dark:text-slate-300 truncate">
                                                    {les.name}
                                                  </span>
                                                </div>
                                                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 shrink-0">
                                                  {les.questions.length}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }),
                                ...sec.lessonsWithoutChapter.map((les) => {
                                  const isLesChecked = selectedLessonSet.has(les.lessonId);
                                  return (
                                    <button
                                      key={`lesson:${les.lessonId}`}
                                      type="button"
                                      onClick={() => toggleGroupLessonIds([les.lessonId])}
                                      className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-blue-50/40 dark:hover:bg-slate-850/50 transition-colors text-left"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                          className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                            isLesChecked
                                              ? 'bg-blue-600 border-blue-600 text-white'
                                              : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                                          }`}
                                        >
                                          {isLesChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-200 line-clamp-2 leading-snug">
                                          {les.name}
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 shrink-0">
                                        {les.questions.length} câu
                                      </span>
                                    </button>
                                  );
                                }),
                              ])}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected chips preview */}
              {!isAllSelected && selectedScopeChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedScopeChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 max-w-full"
                    >
                      <span className="truncate max-w-[210px]">{chip.label}</span>
                      <button
                        type="button"
                        onClick={() => toggleGroupLessonIds(chip.lessonIds)}
                        className="p-0.5 rounded-full hover:bg-blue-200/60 dark:hover:bg-blue-800/60 transition-colors shrink-0"
                        title="Bỏ chọn mục này"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {selectedLessonIds.length === 0 && (
                <p className="text-[11px] font-medium text-rose-500">
                  Hãy chọn ít nhất một Phần, Chương hoặc Bài để bắt đầu luyện tập.
                </p>
              )}

              {/* Question Count Selector */}
              <div className="pt-2 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="writing-question-count-input"
                    className="text-xs font-bold tracking-wider uppercase text-gray-500 dark:text-slate-400 font-sans block"
                  >
                    Số Lượng Câu Tự Luận:
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-gray-400 dark:text-slate-500">
                    Tối đa {filteredQuestions.length} câu
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[5, 10, 15, 20].map((preset) => {
                    const isActive = questionCount === preset;
                    const isDisabled = filteredQuestions.length > 0 && preset > filteredQuestions.length;
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          setQuestionCount(preset);
                          setCustomCountInput(String(preset));
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold font-mono border transition-all disabled:opacity-35 disabled:pointer-events-none ${
                          isActive
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-white dark:bg-slate-900 border-gray-250 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-400'
                        }`}
                      >
                        {preset} câu
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={filteredQuestions.length === 0}
                    onClick={() => {
                      setQuestionCount('all');
                      setCustomCountInput(String(filteredQuestions.length));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-35 disabled:pointer-events-none ${
                      questionCount === 'all'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-white dark:bg-slate-900 border-gray-250 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:border-blue-400'
                    }`}
                  >
                    Tất cả
                  </button>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">Tùy chỉnh:</span>
                    <input
                      id="writing-question-count-input"
                      type="number"
                      min={1}
                      max={Math.max(1, filteredQuestions.length)}
                      disabled={filteredQuestions.length === 0}
                      value={questionCount === 'all' ? String(filteredQuestions.length) : customCountInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setCustomCountInput(raw);
                        if (raw === '') {
                          setQuestionCount(0);
                          return;
                        }
                        const parsed = parseInt(raw, 10);
                        if (!Number.isNaN(parsed) && parsed >= 1) {
                          setQuestionCount(parsed);
                        }
                      }}
                      onBlur={() => {
                        if (questionCount === 'all') return;
                        const parsed = parseInt(customCountInput, 10);
                        const maxAllowed = Math.max(1, filteredQuestions.length);
                        const safeVal = Number.isNaN(parsed) || parsed < 1 ? Math.min(10, maxAllowed) : Math.min(parsed, maxAllowed);
                        setQuestionCount(safeVal);
                        setCustomCountInput(String(safeVal));
                      }}
                      className="w-16 text-center text-xs font-bold font-mono rounded-xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-2 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Panel */}
            <div className="bg-gray-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-gray-150 dark:border-slate-850 text-xs text-gray-500 dark:text-slate-405 space-y-2">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-gray-700 dark:text-slate-350">
                <Info className="h-4 w-4 text-blue-500" />
                <span>Quy tắc chấm thi & Gợi ý tự luận</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 leading-relaxed pl-1">
                <li>Hệ thống <strong>Chế độ Tự luận</strong> tự động trích lọc các thực thể từ khóa quan trọng trong đáp án mẫu.</li>
                <li>Bạn có thể chọn nhiều Phần, nhiều Chương hoặc từng Bài cùng lúc để tổng hợp đề thi tự luận.</li>
                <li>Bạn hoàn toàn có thể tự đối chiếu thủ công với đáp án gốc và tự nhập điểm để cập nhật lịch sử.</li>
              </ul>
            </div>
          </div>

          <button
            onClick={startQuizSession}
            disabled={effectiveQuestionCount === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-450 text-white font-bold tracking-wide py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Play className="h-4 w-4" />
            <span>BẮT ĐẦU PHÒNG THI TỰ LUẬN ({effectiveQuestionCount} CÂU)</span>
          </button>
        </div>
      )}

      {/* 2. QUIZ SESSION SCREEN */}
      {quizStarted && !showSummary && currentQuestion && (
        <div className="space-y-6">
          
          {/* Header Indicators */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 px-5 py-3 rounded-2xl shadow-sm">
            <button
              onClick={() => {
                setShowExitConfirm(true);
              }}
              className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Hủy thi</span>
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-gray-400 dark:text-slate-550 font-mono text-right">
                CÂU TỰ LUẬN: {currentIndex + 1} / {sessionQuestions.length}
              </span>
              <div className="w-20 bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question Card Box */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded leading-none bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/10 shrink-0">
                Câu Hỏi #{currentQuestion.id}
              </span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded font-medium max-w-[200px] truncate">
                {currentQuestion.lesson}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 max-w-[200px] truncate hidden sm:inline">
                [{currentQuestion.referenceCode}]
              </span>
            </div>

            <p className="text-base sm:text-lg font-black text-gray-850 dark:text-slate-100 leading-relaxed font-sans">
              {currentQuestion.question}
            </p>
          </div>

          {/* Interactive Writing Arena */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <label className="text-xs font-bold tracking-wider uppercase text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-orange-500" />
                <span>Nhập câu trả lời tự luận của bạn:</span>
              </label>
              <div className="flex items-center gap-3">
                {userAnswer && scoreResult === null && (
                  <button
                    type="button"
                    onClick={() => {
                      stopVoiceInput();
                      resetTranscript();
                      voiceBaseTextRef.current = '';
                      setUserAnswer('');
                      textareaRef.current?.focus();
                    }}
                    className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    Xóa bài làm
                  </button>
                )}
                <button
                  type="button"
                  disabled={scoreResult !== null}
                  onClick={() => {
                    stopVoiceInput();
                    resetTranscript();
                    setUserAnswer(currentQuestion.answer.slice(0, 30) + '...');
                    textareaRef.current?.focus();
                  }}
                  className="text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Gợi ý 30 chữ đầu
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={userAnswer}
                disabled={scoreResult !== null}
                onChange={(e) => {
                  if (listening) {
                    stopVoiceInput();
                  }
                  setUserAnswer(e.target.value);
                }}
                rows={5}
                placeholder="Gõ hoặc nhấn micro để nói câu trả lời giáo lý của bạn..."
                className={`w-full text-sm sm:text-base font-medium rounded-2xl border bg-white dark:bg-slate-950 p-4 pb-14 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 leading-relaxed disabled:bg-gray-50/50 dark:disabled:bg-slate-950/80 ${
                  listening
                    ? 'border-rose-400 dark:border-rose-500/70 ring-2 ring-rose-500/15 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-gray-250 dark:border-slate-800 focus:ring-blue-500/20 focus:border-blue-500'
                }`}
              />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 pointer-events-none">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={scoreResult !== null}
                  className={`pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:pointer-events-none ${
                    listening
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
                      : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/50'
                  }`}
                  title={listening ? 'Dừng nhập bằng giọng nói' : 'Nhập đáp án bằng giọng nói (Tiếng Việt)'}
                >
                  {listening ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      <MicOff className="h-3.5 w-3.5" />
                      <span>Đang nghe... (Nhấn để dừng)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5" />
                      <span>Nhập bằng giọng nói</span>
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-gray-400 dark:text-slate-500 pr-1">
                  <span>{userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0} từ</span>
                  <CornerDownLeft className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* ACTION TRIGGERS BUTTONS */}
            {scoreResult === null ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubmitAndGrade}
                  disabled={!userAnswer.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-450 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:translate-y-0.5 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                  title="Chấm điểm so khớp từ khóa cục bộ không cần kết nối mạng"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Chấm điểm (So khớp từ khóa cục bộ)</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-950/20 px-4 py-3 rounded-2xl border border-gray-150 dark:border-slate-850">
                <div className="text-xs text-gray-400 dark:text-slate-500 font-medium">
                  Muốn thay đổi kết quả? Bạn có thể chỉnh lại điểm số thủ công.
                </div>
                <button
                  onClick={() => setShowManualCorrection(!showManualCorrection)}
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-all flex items-center gap-1"
                >
                  <span>Chỉnh điểm bằng tay</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Manual correction buttons */}
            {scoreResult && showManualCorrection && (
              <div className="bg-blue-50/15 dark:bg-blue-950/10 p-4 rounded-2xl border border-blue-100/10 space-y-3.5 animate-slide-up">
                <div className="text-xs font-bold text-gray-650 dark:text-slate-350 flex items-center gap-1">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span>Chọn mức điểm mong muốn cho câu này:</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 100, txt: 'Gần như hoàn hảo (100đ)' },
                    { val: 80, txt: 'Thiếu ý nhỏ (80đ)' },
                    { val: 50, txt: 'Vừa đạt ý chính (50đ)' },
                    { val: 20, txt: 'Chưa đạt / Sai lạc (20đ)' }
                  ].map((lvl) => (
                    <button
                      key={lvl.val}
                      onClick={() => handleManualScoreSelect(lvl.val)}
                      className="px-2.5 py-3 rounded-xl border text-center text-xs font-bold bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-850 hover:border-blue-400 transition-all"
                    >
                      <div>{lvl.val}đ</div>
                      <div className="text-[9px] text-gray-450 dark:text-slate-500 font-medium mt-0.5">{lvl.txt.split(' ')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RESULTS DISPLAY PANEL */}
          <AnimatePresence>
            {scoreResult !== null && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                
                {/* Score & Commentary Box */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  
                  {/* Score Indicator Badge */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-150 dark:border-slate-850">
                    <div className="flex items-center gap-2.5">
                      <div className="p-3 bg-blue-50 dark:bg-blue-955/20 rounded-2xl text-blue-500 dark:text-blue-400">
                        <Brain className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest font-mono">
                          PHƯƠNG thức chấm: {scoreResult.gradeMethod === 'manual' ? 'Thiết lập thủ công' : 'So khớp Từ Khóa Cục bộ'}
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200 mt-0.5">
                          Đánh giá kết quả của học viên
                        </h4>
                      </div>
                    </div>

                    {/* Circular Score Badge or Number */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className={`px-4 py-2 rounded-2xl border text-xl font-black font-mono ${getScoreColorClass(scoreResult.score)}`}>
                        {scoreResult.score !== null ? `${scoreResult.score} / 100` : '---'}
                      </div>
                    </div>
                  </div>

                  {/* Progressive Bar Chart */}
                  {scoreResult.score !== null && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-gray-400 dark:text-slate-500 font-mono">
                        <span>ĐỘ TRÙNG KHỚP Ý NGHĨA & THẦN HỌC</span>
                        <span>{scoreResult.score}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-slate-850 h-3 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getScoreBgClass(scoreResult.score)}`}
                          style={{ width: `${scoreResult.score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Feedback Commentary */}
                  <div className="bg-gray-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-gray-150 dark:border-slate-850/60 leading-relaxed text-xs sm:text-sm text-gray-700 dark:text-slate-200 space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 font-mono">Nhận xét & Đánh giá chi tiết:</div>
                    <p className="font-medium whitespace-pre-line leading-relaxed">{scoreResult.feedback}</p>
                  </div>

                  {/* Text word-by-word diff comparison */}
                  <div className="pt-2 border-t border-gray-150 dark:border-slate-850">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 font-mono mb-3">So sánh từ ngữ trực quan:</div>
                    <DiffViewer userAnswer={userAnswer} correctAnswer={currentQuestion.answer} />
                  </div>

                </div>

                {/* Submitting next/previous state selectors and progress */}
                <div className="flex gap-4">
                  
                  {/* Mark as Learned button shortcut */}
                  <button
                    onClick={() => {
                      toggleLearnedStatus(currentQuestion.id, 'learned');
                      setToastMessage('Đã đánh dấu thuộc câu hỏi Giáo lý này thành công!');
                    }}
                    className="px-5 py-4 bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    <span className="hidden sm:inline">Đánh dấu đã thuộc</span>
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-550 hover:to-teal-550 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:translate-y-0.5 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <span>CÂU TIẾP THEO</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                  
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* 3. FINAL SUMMARY SESSION STATS REPORT */}
      {showSummary && (
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 animate-fade-in">
          
          <div className="text-center space-y-3 max-w-lg mx-auto">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 shadow-inner">
              <Award className="h-8 w-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-slate-100 tracking-tight">
              Hoàn Thành Kỳ Thi Tự Luận Giáo Lý!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
              Xin chúc mừng bạn đã kiên nhẫn luyện tập gõ và suy tư sâu sắc {sessionQuestions.length} câu hỏi tự luận. Đây là bước quan trọng nhất để thấm nhuần tư tưởng sâu xa.
            </p>
          </div>

          <hr className="border-gray-150 dark:border-slate-850" />

          {/* Average result stats grids */}
          {(() => {
            const avgScore = Math.round(scoresHistory.reduce((a, b) => a + b, 0) / (scoresHistory.length || 1));
            const passedCount = scoresHistory.filter(s => s >= 50).length;

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score panel */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-gray-150 dark:border-slate-850/80 text-center space-y-1">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider block">ĐIỂM SỐ TRUNG BÌNH</span>
                  <span className={`text-4xl font-extrabold font-mono inline-block ${avgScore >= 80 ? 'text-emerald-500' : avgScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{avgScore}đ</span>
                  <p className="text-[11px] text-gray-400 font-medium">Mục tiêu qua tài: &gt;= 50đ</p>
                </div>

                {/* Accuracy index */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-gray-150 dark:border-slate-850/80 text-center space-y-1">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider block">SỐ CÂU ĐẠT CHUẨN</span>
                  <span className="text-4xl font-extrabold font-mono text-gray-800 dark:text-slate-100 inline-block">{passedCount} / {sessionQuestions.length}</span>
                  <p className="text-[11px] text-gray-400 font-medium">Đạt yêu cầu thần học ý chính</p>
                </div>

                {/* Chapter range feedback */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-gray-150 dark:border-slate-850/80 text-center space-y-1 flex flex-col justify-center">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider block">PHẠM VI ĐÃ THI GÕ</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-slate-350 line-clamp-2 leading-snug mt-1 inline-block">
                    {selectedScopeSummaryText}
                  </span>
                </div>

              </div>
            );
          })()}

          {/* Table history breakdowns list */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-550 font-mono">BẢNG PHÂN TÍCH TIẾN ĐỘ THI GÕ TỪNG CÂU</h4>
            <div className="border border-gray-150 dark:border-slate-850 rounded-2xl overflow-hidden divide-y divide-gray-150 dark:divide-slate-850">
              {sessionQuestions.map((q, idx) => {
                const score = scoresHistory[idx] ?? 0;
                return (
                  <div key={q.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-white dark:bg-slate-900 text-xs">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-[9px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-1 py-0.5 rounded leading-none">CÂU #{idx + 1}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">ID: {q.id}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-[150px]">{q.lesson}</span>
                      </div>
                      <p className="font-semibold text-gray-700 dark:text-slate-300 line-clamp-1">{q.question}</p>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <span className={`px-2.5 py-1 rounded-xl font-bold font-mono border ${
                        score >= 80 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20' 
                          : score >= 50 
                          ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20' 
                          : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20'
                      }`}>
                        {score} điểm
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Button actions footer */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={startQuizSession}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>LUYỆN TẬP LẠI PHÒNG NÀY</span>
            </button>
            <button
              onClick={() => {
                setQuizStarted(false);
                setShowSummary(false);
              }}
              className="px-8 py-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 font-bold rounded-2xl text-xs sm:text-sm transition-all border border-transparent hover:border-gray-300/40"
            >
              Quay lại chế độ cài đặt
            </button>
          </div>

        </div>
      )}

      {/* Confirmation Exit Modal Dialog Overlay */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitConfirm(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-center z-10"
            >
              <div className="mx-auto w-12 h-12 bg-rose-50 dark:bg-rose-950/35 rounded-2xl flex items-center justify-center text-rose-500 mb-2">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white font-display">Xác thực rời phòng thi?</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Bạn có thực sự muốn hủy bỏ bài thi và quay lại đầu không? Toàn bộ tiến trình làm bài ở lượt này sẽ không được lưu giữ.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-350 text-xs font-bold rounded-xl transition-all"
                >
                  Quay lại thi tiếp
                </button>
                <button
                  onClick={() => {
                    stopVoiceInput();
                    resetTranscript();
                    setShowExitConfirm(false);
                    setQuizStarted(false);
                  }}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/10 transition-all"
                >
                  Xác nhận hủy thi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Success Feedback Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 15, opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3 bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 border border-slate-800/80 p-4 rounded-2xl shadow-xl shadow-slate-950/30"
            >
              <div className="w-7 h-7 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4.5 w-4.5 font-bold" />
              </div>
              <p className="text-xs font-bold leading-normal flex-1 text-slate-200">
                {toastMessage}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
