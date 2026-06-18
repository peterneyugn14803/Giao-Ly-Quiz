import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Sparkles, CheckCircle2, AlertCircle, RefreshCw, 
  Play, BookOpen, Layers, ChevronRight, HelpCircle, 
  Award, CornerDownLeft, Volume2, Info, ArrowRight, ArrowLeft, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionItem, UserProgress } from '../types';

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
  // 1. Scope selection states
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [sessionQuestions, setSessionQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  
  // 2. Typing answer state
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  // 3. Scoring modes & response results representation
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<{
    score: number | null;
    feedback: string;
    missingPoints: string[];
    gradeMethod: 'ai' | 'local' | 'manual';
    localScore?: number;
    localMatched?: string[];
    localTotal?: string[];
  } | null>(null);

  // 4. Manual grading input overrides, if preferred
  const [showManualCorrection, setShowManualCorrection] = useState<boolean>(false);

  // 5. Overall Session Metrics
  const [scoresHistory, setScoresHistory] = useState<number[]>([]);
  const [showSummary, setShowSummary] = useState<boolean>(false);

  // Generate unique chapters list for scope dropdown filter
  const chaptersList = Array.from(new Set(allQuestions.map(q => q.chapter || 'Chương phụ')));

  // Focus reference for textareas
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Restart / Init writing quiz sessions
  const startQuizSession = () => {
    let filtered = [...allQuestions];
    if (filterChapter !== 'all') {
      filtered = filtered.filter(q => q.chapter === filterChapter);
    }
    
    // Select up to 10 random questions from the subset for an intense writing workout
    const shuffled = filtered.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    
    setSessionQuestions(selected);
    setCurrentIndex(0);
    setUserAnswer('');
    setScoreResult(null);
    setScoresHistory([]);
    setQuizStarted(true);
    setShowSummary(false);
    setShowManualCorrection(false);
    
    // Auto-focus on start
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 200);
  };

  const currentQuestion = sessionQuestions[currentIndex];

  const handleNextQuestion = () => {
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

  const handleSubmitAndGrade = async (preferredMethod: 'ai' | 'local') => {
    if (!currentQuestion) return;
    setIsGrading(true);

    // Always calculate local score as robust fallback or comparison criteria
    const localGrading = calculateLocalScore(userAnswer, currentQuestion.answer);

    if (preferredMethod === 'local') {
      // Pure client-side grading with Vietnamese NLP matching
      setScoreResult({
        score: localGrading.score,
        gradeMethod: 'local',
        feedback: localGrading.score >= 80 
          ? 'Bài làm xuất sắc!'
          : localGrading.score >= 50
          ? 'Bài làm khá ổn. Bạn đã nắm bắt được ý chính cốt lõi nhưng còn thiếu một số thuật ngữ cụ thể hơn của đáp án gốc.'
          : 'Bài làm chưa đạt yêu cầu. Rất mong bạn xem thêm đáp án gốc và gõ lại lần nữa để tăng phản xạ ghi nhớ.',
        missingPoints: localGrading.totalKeywords.filter(kw => !localGrading.matchedKeywords.includes(kw)),
        localScore: localGrading.score,
        localMatched: localGrading.matchedKeywords,
        localTotal: localGrading.totalKeywords
      });
      setScoresHistory(prev => [...prev, localGrading.score]);
      setIsGrading(false);
      return;
    }

    // Server-Side AI Grade via route
    try {
      const response = await fetch('/api/grade-writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion.question,
          correctAnswer: currentQuestion.answer,
          userAnswer: userAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error('API server failed during evaluation process.');
      }

      const aiResult = await response.json();
      
      setScoreResult({
        score: aiResult.score ?? localGrading.score, // Fallback safely to local if null
        gradeMethod: 'ai',
        feedback: aiResult.feedback || 'Không có nhận xét chi tiết.',
        missingPoints: aiResult.missingPoints || [],
        localScore: localGrading.score,
        localMatched: localGrading.matchedKeywords,
        localTotal: localGrading.totalKeywords
      });

      setScoresHistory(prev => [...prev, aiResult.score ?? localGrading.score]);
    } catch (err) {
      console.error('AI scoring route failed. Defaulting to local keyword evaluation match:', err);
      // Fallback explicitly to local scoring gracefully
      setScoreResult({
        score: localGrading.score,
        gradeMethod: 'local',
        feedback: `[Local Match Check] Chấm điểm cục bộ tự động do mất kết nối AI: ${
          localGrading.score >= 80 ? 'Bạn nắm ý rất tốt.' : 'Bạn nên ôn kỹ thêm đáp án gốc.'
        }`,
        missingPoints: localGrading.totalKeywords.filter(kw => !localGrading.matchedKeywords.includes(kw)),
        localScore: localGrading.score,
        localMatched: localGrading.matchedKeywords,
        localTotal: localGrading.totalKeywords
      });
      setScoresHistory(prev => [...prev, localGrading.score]);
    } finally {
      setIsGrading(false);
    }
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
                  Tập luyện viết câu trả lời trực tiếp. Hệ thống hỗ trợ so khớp <strong>Từ khóa cốt lõi</strong> thông minh cục bộ hoặc sử dụng <strong>Trí Tuệ Nhân Tạo AI Gemini</strong> để chấm điểm theo ý chính, chấp nhận từ đồng nghĩa, khuyến khích sự hiểu biết sâu xa.
                </p>
              </div>
              <div className="bg-orange-50/40 dark:bg-orange-950/20 p-5 rounded-2xl border border-orange-100/30 shrink-0 w-full md:w-auto text-center md:text-left">
                <div className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">MỤC TIÊU PHÒNG THI</div>
                <div className="text-2xl font-black font-mono text-orange-700 dark:text-orange-400">10 / 10</div>
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
            
            {/* Scope selection */}
            <div className="space-y-3.5">
              <label className="text-xs font-bold tracking-wider uppercase text-gray-500 dark:text-slate-400 font-sans block">
                Phạm Vi Câu Hỏi Để Luyện Tự Luận:
              </label>
              <div className="relative">
                <select
                  value={filterChapter}
                  onChange={(e) => setFilterChapter(e.target.value)}
                  className="w-full text-sm font-semibold rounded-2xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-4 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Mọi chương bài trong Giáo trình (Tất cả {allQuestions.length} câu)</option>
                  {chaptersList.map((ch, idx) => (
                    <option key={idx} value={ch}>{ch}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                  <Filter className="h-4 w-4" />
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
                <li>Bạn có thể so sánh bài làm của bản thân trực tiếp với đáp án mẫu, hoặc gõ và bấm gửi chấm điểm.</li>
                <li>Nếu không muốn sử dụng AI, bạn hoàn toàn có thể tự đối chiếu thủ công và tự nhập điểm để cập nhật lịch sử.</li>
              </ul>
            </div>
          </div>

          <button
            onClick={startQuizSession}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-450 text-white font-bold tracking-wide py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            <span>BẮT ĐẦU PHÒNG THI TỰ LUẬN TRỰC TUYẾN</span>
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
                if (window.confirm('Bạn có muốn hủy bỏ bài thi và quay lại không? Tiến trình hiện tại sẽ bị xóa.')) {
                  setQuizStarted(false);
                }
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
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold tracking-wider uppercase text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-orange-500" />
                <span>Nhập câu trả lời tự luận của bạn:</span>
              </label>
              <button
                onClick={() => {
                  // Direct copy or helpful placeholder hint if they are stuck
                  setUserAnswer(currentQuestion.answer.slice(0, 30) + '...');
                  textareaRef.current?.focus();
                }}
                className="text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-colors"
              >
                Gợi ý 30 chữ đầu
              </button>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={userAnswer}
                disabled={isGrading || scoreResult !== null}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={5}
                placeholder="Gõ đầy đủ ý nghĩa hoặc theo trí nhớ của bạn về câu giáo lý này..."
                className="w-full text-sm sm:text-base font-medium rounded-2xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 pr-10 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 leading-relaxed disabled:bg-gray-50/50 dark:disabled:bg-slate-950/80"
              />
              <div className="absolute right-3.5 bottom-3 text-gray-400 dark:text-slate-500 pointer-events-none">
                <CornerDownLeft className="h-4 w-4" />
              </div>
            </div>

            {/* ACTION TRIGGERS BUTTONS */}
            {scoreResult === null ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleSubmitAndGrade('local')}
                  disabled={isGrading || !userAnswer.trim()}
                  className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-800 font-bold py-3.5 px-6 rounded-2xl disabled:opacity-40 disabled:pointer-events-none transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Chấm điểm</span>
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
                
                {/* Score & AI Commentary Box */}
                <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  
                  {/* Score Indicator Badge */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-150 dark:border-slate-850">
                    <div className="flex items-center gap-2.5">
                      <div className="p-3 bg-blue-50 dark:bg-blue-955/20 rounded-2xl text-blue-500 dark:text-blue-400">
                        {scoreResult.gradeMethod === 'ai' ? (
                          <Sparkles className="h-6 w-6 text-indigo-500" />
                        ) : (
                          <Brain className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest font-mono">
                          PHƯƠNG thức chấm: {scoreResult.gradeMethod === 'ai' ? 'Trí tuệ nhân tạo (Gemini)' : scoreResult.gradeMethod === 'manual' ? 'Thiết lập thủ công' : 'So khớp Từ Khóa Cục bộ'}
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

                  <div className="pt-3">
                    <DiffViewer userAnswer={userAnswer} correctAnswer={currentQuestion.answer} />
                  </div>

                  {/* Progressive Bar Chart */}
                  {scoreResult.score !== null && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-gray-400 dark:text-slate-500 font-mono">
                        <span>ĐỘ TRÙNG KHỚP Ý NGHĨA</span>
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

                  {/* AI Feedback Commentary */}
                  <div className="bg-gray-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-gray-150 dark:border-slate-850/60 leading-relaxed text-xs sm:text-sm text-gray-700 dark:text-slate-200 space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500 font-mono">Nhận xét từ Giám khảo AI:</div>
                    <p className="font-medium whitespace-pre-line">{scoreResult.feedback}</p>
                  </div>

                  

                </div>

                {/* Submitting next/previous state selectors and progress */}
                <div className="flex gap-4">
                  
                  {/* Mark as Learned button shortcut */}
                  <button
                    onClick={() => {
                      toggleLearnedStatus(currentQuestion.id, 'learned');
                      alert('Đã đánh dấu thuộc câu hỏi Giáo lý này thành công!');
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
                    {filterChapter === 'all' ? 'Toàn bộ 650 câu Giáo lý' : filterChapter}
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

    </div>
  );
};
