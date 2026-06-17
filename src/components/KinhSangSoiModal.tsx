import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

const KinhSangSoiModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const closeModal = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 transform transition-transform animate-in fade-in zoom-in duration-300">
        
        {/* Decorative flair */}
        <div className="flex justify-center mb-6">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                <Sparkles size={32} />
            </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-blue-900 dark:text-amber-200 mb-6 tracking-wide">
          KINH SÁNG SOI
        </h2>

        <p className="text-gray-700 dark:text-slate-300 text-center leading-relaxed italic mb-8">
          "Cúi xin Chúa sáng soi cho chúng con được biết việc phải làm, 
          cùng khi làm xin Chúa giúp đỡ cho mỗi kinh mỗi việc chúng con, 
          từ khởi sự cho đến hoàn thành đều nhờ bởi ơn Chúa. Amen."
        </p>

        <button 
          onClick={closeModal}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition duration-200 shadow-md flex items-center justify-center gap-2"
        >
          Bắt đầu giờ học
        </button>
      </div>
    </div>
  );
};

export default KinhSangSoiModal;
