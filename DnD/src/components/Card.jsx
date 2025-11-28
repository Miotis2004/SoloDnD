import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => {
  return twMerge(clsx(inputs));
}

const Card = ({ title, children, className, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <>
      <motion.div
        layoutId={`card-container-${title}`}
        className={cn(
          "bg-dnd-card border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col relative group",
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-3 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-sm">
            {title}
          </h3>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-slate-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <Maximize2 size={16} />
          </button>
        </div>
        
        <div className="flex-1 p-4 overflow-auto relative">
          {children}
        </div>
      </motion.div>

      {/* Expanded Modal Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              layoutId={`card-container-${title}`}
              className="bg-dnd-card w-full h-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-600 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-white"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                {children}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Card;
