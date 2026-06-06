/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

export default function App() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full bg-white rounded-3xl shadow-sm p-12 text-center"
      >
        <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-4">
          欢迎使用
        </h1>
        <p className="text-gray-500 font-light">
          这是一个全新的中文空白应用。
        </p>
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400 tracking-widest uppercase">
            准备就绪
          </p>
        </div>
      </motion.div>
    </div>
  );
}
