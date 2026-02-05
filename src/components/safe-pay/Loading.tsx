'use client'

import { motion } from 'framer-motion'

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <motion.div
      className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  </div>
)

export const LoadingPage = () => (
  <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center"
    >
      <LoadingSpinner />
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-blue-600 mt-4"
      >
        Loading...
      </motion.p>
    </motion.div>
  </div>
)

export const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="bg-white/95 p-8 rounded-2xl border border-blue-200 shadow-xl"
    >
      <LoadingSpinner />
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-blue-600 mt-4"
      >
        Processing...
      </motion.p>
    </motion.div>
  </div>
)