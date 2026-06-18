import React, { useState, useEffect } from 'react';
import { Sparkles, X, BookOpen, RefreshCw, Heart, Compass, ArrowRight, Quote } from 'lucide-react';
import { loiChuaVerses, LoiChuaVerse } from '../data/loiChuaVerses';

interface KinhSangSoiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KinhSangSoiModal: React.FC<KinhSangSoiModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'kinh' | 'loichua'>('kinh');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [currentVerse, setCurrentVerse] = useState<LoiChuaVerse | null>(null);
  
  // Animation key to re-trigger fade effects when verse changes
  const [fadeKey, setFadeKey] = useState<number>(0);

  // Initialize with a random verse on mount or reset
  useEffect(() => {
    if (loiChuaVerses.length > 0) {
      const randomIndex = Math.floor(Math.random() * loiChuaVerses.length);
      setCurrentVerse(loiChuaVerses[randomIndex]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Categories list derived from unique values
  const categories = ['Tất cả', 'Sự tín thác', 'Can đảm', 'Kiên trì', 'Hy vọng & Bình an', 'Sức mạnh', 'Đau khổ & Thập giá', 'Tình yêu & Lòng thương xót'];

  // Filter verses based on selected category
  const filteredVerses = selectedCategory === 'Tất cả' 
    ? loiChuaVerses 
    : loiChuaVerses.filter(v => v.chu_de === selectedCategory);

  // Pick a random verse from filtered list
  const drawRandomVerse = () => {
    if (filteredVerses.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredVerses.length);
    setCurrentVerse(filteredVerses[randomIndex]);
    setFadeKey(prev => prev + 1);
  };

  // Cycle to next verse in the current filtered list
  const nextVerse = () => {
    if (filteredVerses.length === 0 || !currentVerse) return;
    const currentIndex = filteredVerses.findIndex(v => v.trich_dan === currentVerse.trich_dan);
    const nextIndex = (currentIndex + 1) % filteredVerses.length;
    setCurrentVerse(filteredVerses[nextIndex]);
    setFadeKey(prev => prev + 1);
  };

  // Handle category pill click
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    const verses = cat === 'Tất cả' 
      ? loiChuaVerses 
      : loiChuaVerses.filter(v => v.chu_de === cat);
    if (verses.length > 0) {
      const randomIndex = Math.floor(Math.random() * verses.length);
      setCurrentVerse(verses[randomIndex]);
      setFadeKey(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[30px] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden transform transition-transform animate-in fade-in zoom-in duration-300 border border-gray-100 dark:border-slate-800">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors z-20"
          title="Đóng"
        >
          <X size={18} />
        </button>

        {/* Modal Tabs Header */}
        <div className="pt-6 px-6 sm:px-8 border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="flex gap-2 mb-1">
            <button
              onClick={() => setActiveTab('kinh')}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'kinh'
                  ? 'border-blue-600 text-blue-600 dark:border-amber-400 dark:text-amber-400'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles size={16} />
              Kinh Sáng Soi
            </button>
            <button
              onClick={() => setActiveTab('loichua')}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'loichua'
                  ? 'border-blue-600 text-blue-600 dark:border-amber-400 dark:text-amber-400'
                  : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
              }`}
            >
              <BookOpen size={16} />
              Lời Chúa Khích Lệ
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {activeTab === 'kinh' ? (
            /* TAB 1: KIN SANG SOI */
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 rounded-full text-amber-600 dark:text-amber-400 animate-pulse">
                  <Sparkles size={28} />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1">Cầu nguyện trước khi học</h3>
                <h2 className="text-2xl font-black text-gray-800 dark:text-amber-200 tracking-tight">KINH SÁNG SOI</h2>
              </div>

              <div className="bg-blue-50/35 dark:bg-blue-950/10 p-5 sm:p-6 rounded-2xl border border-blue-500/10 text-center leading-relaxed italic text-gray-700 dark:text-slate-300 text-sm sm:text-base font-medium">
                "Cúi xin Chúa sáng soi cho chúng con được biết việc phải làm, 
                cùng khi làm xin Chúa giúp đỡ cho mỗi kinh mỗi việc chúng con, 
                từ khởi sự cho đến hoàn thành đều nhờ bởi ơn Chúa. Amen."
              </div>

              {/* Connected Preview Card of Daily Verse */}
              {currentVerse && (
                <div className="bg-amber-50/30 dark:bg-amber-950/5 border border-amber-500/10 rounded-2xl p-4.5 space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                      Lời Chúa tiếp sức
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-400 dark:text-slate-500">
                      {currentVerse.tham_chieu}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-650 dark:text-slate-300 italic font-medium leading-relaxed line-clamp-2">
                    {currentVerse.trich_dan}
                  </p>
                  <button 
                    onClick={() => setActiveTab('loichua')}
                    className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1 transition-all"
                  >
                    Xem thêm Lời Chúa truyền động lực <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: LOI CHUA KHICH LE & NGHILUC */
            <div className="space-y-5 animate-fade-in">
              {/* Theme/Category filter pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 block px-0.5">CHỦ ĐỀ LỜI CHÚA</span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleSelectCategory(cat)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
                        selectedCategory === cat
                          ? 'bg-blue-600 border-blue-600 text-white dark:bg-amber-500 dark:border-amber-400 dark:text-slate-950 shadow-sm'
                          : 'bg-gray-50 text-gray-500 border-gray-150 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-750 dark:hover:bg-slate-700/80'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verse Display Area with reload/next actions */}
              {currentVerse && (
                <div key={fadeKey} className="relative bg-gradient-to-br from-amber-50/20 to-orange-50/10 dark:from-slate-900 dark:to-slate-900 border border-amber-500/15 dark:border-amber-500/10 rounded-[24px] p-6 space-y-4 shadow-sm animate-fade-in">
                  {/* Category Card Header */}
                  <div className="flex justify-between items-center border-b border-gray-100/50 dark:border-slate-800/80 pb-3">
                    <div className="flex items-center gap-1.5">
                      <Heart size={14} className="text-red-500 fill-red-500/20" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Chủ đề: {currentVerse.chu_de}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-gray-150 dark:border-slate-700/50">
                      {currentVerse.tham_chieu}
                    </span>
                  </div>

                  {/* scripture citation */}
                  <div className="relative py-2 px-1">
                    <Quote className="absolute -top-1 -left-2 h-8 w-8 text-amber-500/10 dark:text-amber-500/5 -scale-x-100" />
                    <p className="text-sm sm:text-base text-gray-800 dark:text-slate-200 font-bold italic leading-relaxed text-center">
                      {currentVerse.trich_dan}
                    </p>
                  </div>

                  {/* motivational comment */}
                  <div className="bg-white/70 dark:bg-slate-950/40 p-4 rounded-xl border border-gray-100 dark:border-slate-850 shadow-inner">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Compass size={14} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Ý NGHĨA TIẾP SỨC
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed font-semibold">
                      {currentVerse.y_nghia_dong_luc}
                    </p>
                  </div>

                  {/* Deck Drawing Controls inside core Card */}
                  <div className="flex gap-2 pt-1 justify-end">
                    <button
                      onClick={drawRandomVerse}
                      className="text-xs font-bold text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-amber-300 flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-slate-800/40 transition-colors"
                      title="Lấy ngẫu nhiên câu khác"
                    >
                      <RefreshCw size={13} className="animate-spin-once" />
                      Lấy câu khác
                    </button>
                    <button
                      onClick={nextVerse}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-blue-50/50 dark:hover:bg-slate-850/50 transition-colors"
                      title="Xem câu tiếp theo"
                    >
                      Tiếp tục
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3">
          {activeTab === 'kinh' ? (
            <button
              onClick={() => setActiveTab('loichua')}
              className="flex-1 border border-blue-200 dark:border-slate-700 text-blue-600 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-800 font-black py-3 sm:py-3.5 px-5 rounded-2xl transition duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <Heart size={16} />
              Đọc Lời Chúa Nghị Lực
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('kinh')}
              className="flex-1 border border-blue-200 dark:border-slate-700 text-blue-600 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-800 font-black py-3 sm:py-3.5 px-5 rounded-2xl transition duration-200 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Xem Lại Kinh Sáng Soi
            </button>
          )}

          <button 
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 sm:py-3.5 px-6 rounded-2xl transition duration-200 shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98"
          >
            Bắt đầu giờ học
          </button>
        </div>
      </div>
    </div>
  );
};

export default KinhSangSoiModal;
