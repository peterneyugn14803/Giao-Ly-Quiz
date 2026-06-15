import React, { useState, useEffect } from 'react';
import { HelpCircle, Award, CheckCircle2, XCircle, Sparkles, RefreshCw, ArrowRight, BookOpen } from 'lucide-react';
import { QuestionItem, UserProgress } from '../types';
import { getGroupedCatechismByPart } from '../data';

interface QuizModeProps {
  allQuestions: QuestionItem[];
  progress: UserProgress;
  onSaveQuizResult: (correct: number, total: number) => void;
}

interface QuizQuestion {
  questionItem: QuestionItem;
  options: string[];
  correctOptionIndex: number;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  allQuestions,
  progress,
  onSaveQuizResult
}) => {
  const [filterChapter, setFilterChapter] = useState<string>('all');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const chapters = Array.from(new Set(allQuestions.map(q => q.chapter)));

  // Generate 10-questions dynamic quiz
  const generateQuiz = () => {
    let sourcePool = [...allQuestions];
    if (filterChapter !== 'all') {
      sourcePool = sourcePool.filter(q => q.chapter === filterChapter);
    }

    // Try to get 10 random questions
    const shuffledPool = [...sourcePool].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledPool.slice(0, Math.min(10, shuffledPool.length));

    const generated: QuizQuestion[] = selectedQuestions.map((q) => {
      // Find distractors of the same chapter
      let sameChapterPool = sourcePool.filter(item => item.chapter === q.chapter && item.id !== q.id);
      
      // Fallback to any other questions if same chapter is too small
      if (sameChapterPool.length < 3) {
        sameChapterPool = allQuestions.filter(item => item.id !== q.id);
      }

      // Select 3 random distractors
      const shuffledDistractors = sameChapterPool.sort(() => Math.random() - 0.5);
      const distractors = shuffledDistractors.slice(0, 3).map(item => item.answer);

      // Mix and shuffle options
      const options = [q.answer, ...distractors].sort(() => Math.random() - 0.5);
      const correctOptionIndex = options.indexOf(q.answer);

      return {
        questionItem: q,
        options,
        correctOptionIndex
      };
    });

    setQuizQuestions(generated);
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  useEffect(() => {
    generateQuiz();
  }, [filterChapter]);

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleNext = () => {
    // Check correctness
    const currentQ = quizQuestions[currentQuizIndex];
    if (selectedOption === currentQ.correctOptionIndex) {
      setScore(prev => prev + 1);
    }

    setIsAnswered(true);

    setTimeout(() => {
      if (currentQuizIndex < quizQuestions.length - 1) {
        setCurrentQuizIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        // Complete Quiz
        setIsFinished(true);
        // Calculate final score
        const correctCount = score + (selectedOption === currentQ.correctOptionIndex ? 1 : 0);
        onSaveQuizResult(correctCount, quizQuestions.length);
      }
    }, 1200);
  };

  const currentQuizItem = quizQuestions[currentQuizIndex];

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      {/* Intro and Filters */}
      <div className="flex flex-col gap-4 border-b border-gray-150 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-emerald-500" />
            Trực Quan Trắc Nghiệm Có Điểm
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">Các đáp án gây nhiễu được tự động lọc tinh tế trong tầm cùng chương.</p>
        </div>

        {/* Filters */}
        {!isFinished && quizQuestions.length > 0 && currentQuizIndex === 0 && !isAnswered && (
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="text-xs font-semibold text-gray-400 dark:text-slate-500 self-center shrink-0 font-mono uppercase">Phạm Vi Thi:</label>
            <select
              value={filterChapter}
              onChange={(e) => setFilterChapter(e.target.value)}
              className="w-full rounded-2xl border border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none focus:border-emerald-300 dark:focus:border-emerald-700/80 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950/20 max-w-md"
            >
              <option value="all">Ngẫu nhiên toàn bộ giáo trình</option>
              {Object.entries(getGroupedCatechismByPart()).map(([partKey, partVal]) => {
                const partLabel = partKey.startsWith('PHẦN THÚ') ? 'Phần I: Tuyên Xưng Đức Tin' :
                                  partKey.includes('NHIỆM CỤC BÍ TÍCH') ? 'Phần II: Cử Hành Mầu Nhiệm Phụng Vụ' :
                                  partKey.includes('ƠN GỌI CỦA CON NGƯỜI') ? 'Phần III: Đời Sống Đức Kitô' :
                                  'Phần IV: Kinh Nguyện Kitô Giáo';
                return (
                  <optgroup label={partLabel} key={partKey} className="font-bold text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 mt-2">
                    {Object.keys(partVal.chapters).map((chapKey) => (
                      <option key={chapKey} value={chapKey} className="font-normal text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900">
                        {chapKey}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {isFinished ? (
        /* Completion Dashboard */
        <div className="text-center py-10 px-6 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rouded-3xl space-y-6 shadow-sm dark:shadow-none rounded-3xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400">
            <Award className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">Hoàn Thành Bài Thi!</h3>
            <p className="text-xs text-gray-400 dark:text-slate-400">Xem kết quả đánh giá năng lực của bạn dưới đây:</p>
          </div>

          {/* Results Score */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl max-w-xs mx-auto border border-gray-100 dark:border-slate-850/80">
            <span className="block text-4xl font-extrabold font-mono text-emerald-500">{score} / {quizQuestions.length}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold block mt-1">Câu trả lời chính xác</span>
            <span className="text-xs font-bold text-gray-400 dark:text-slate-550 font-mono block mt-2">({Math.round((score / quizQuestions.length) * 100)}%)</span>
          </div>

          {/* Comment */}
          <p className="text-sm text-gray-600 dark:text-slate-350 px-4 leading-relaxed">
            {score >= 8 
              ? "Tuyệt hảo! Trình độ thuộc lòng Giáo Lý của bạn cực kỳ vững vàng và sâu sắc!" 
              : score >= 5 
                ? "Khá tốt! Hãy cố gắng học lại Flashcard Spaced Repetition để lấp đầy những câu chưa nhớ nét chính xác." 
                : "Hãy luyện tập thêm trong Danh Mục Bài Học và Spaced Repetition Flashcard để nâng tầm thuộc lòng nhé!"}
          </p>

          <button
            onClick={generateQuiz}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 text-white font-bold text-sm px-6 py-3.5 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/10"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Thi Lại Đề Mới</span>
          </button>
        </div>
      ) : currentQuizItem ? (
        /* Quiz Gameplay Cards */
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 dark:text-slate-500 font-mono">
            <span>CÂU HỎI {currentQuizIndex + 1} / {quizQuestions.length}</span>
            <span className="text-emerald-500 dark:text-emerald-400">ĐIỂM HIỆN TẠI: {score}</span>
          </div>

          {/* Question block */}
          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rouded-3xl rounded-3xl p-6 sm:p-8 shadow-sm dark:shadow-none">
            <span className="font-mono text-[10px] font-bold text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded uppercase tracking-wider block w-max mb-3">Mã câu: {currentQuizItem.questionItem.id}</span>
            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100 leading-relaxed font-sans">
              {currentQuizItem.questionItem.question}
            </h3>
          </div>

          {/* Options block */}
          <div className="space-y-3">
            {currentQuizItem.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQuizItem.correctOptionIndex;

              let style = "bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/10 dark:hover:bg-slate-850/50";
              if (isAnswered) {
                if (isCorrect) style = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-400 font-semibold shadow-inner";
                else if (isSelected) style = "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800/80 text-red-700 dark:text-red-400";
                else style = "bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800/80 text-gray-400 dark:text-slate-600 opacity-60";
              } else if (isSelected) {
                style = "bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-md font-semibold";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-2xl border text-sm transition-all focus:outline-none flex items-start gap-4 ${style}`}
                >
                  <span className="font-mono text-xs font-black bg-gray-100 dark:bg-slate-800 rounded px-2 py-0.5 border border-gray-150 dark:border-slate-750 shrink-0 text-gray-500 dark:text-slate-400">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Confirm select buttons */}
          <div className="flex justify-end pt-3">
            <button
              onClick={handleNext}
              disabled={selectedOption === null || isAnswered}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all shadow-md ${
                selectedOption === null || isAnswered
                  ? 'bg-gray-150 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed shadow-none border border-transparent'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/10 active:scale-95'
              }`}
            >
              <span>{currentQuizIndex === quizQuestions.length - 1 ? "Xem Kết Quả" : "Tiếp Theo"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 dark:text-slate-500">
          <p>Không có câu hỏi nào để khởi tạo đề thi trắc nghiệm.</p>
        </div>
      )}
    </div>
  );
};
