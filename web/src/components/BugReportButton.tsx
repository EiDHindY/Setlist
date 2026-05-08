"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, X, ImagePlus, Loader2, CheckCircle2 } from "lucide-react";
import { submitBugReport } from "@/app/actions/bug-report";

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (files.length + selected.length > 5) {
        alert("You can only upload up to 5 screenshots.");
        return;
      }
      setFiles((prev) => [...prev, ...selected].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && files.length === 0) return;

    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];

      // Upload each file through our secure server-side API route
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/bug-report/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.url) {
          imageUrls.push(data.url);
        } else {
          console.warn("Image upload failed:", data.error);
        }
      }

      // Send to our Next.js backend, which pushes to Notion
      await submitBugReport(description, imageUrls);

      
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setDescription("");
        setFiles([]);
      }, 3000);

    } catch (error) {
      console.error(error);
      alert("Failed to submit bug report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full text-left glass rounded-2xl px-5 py-4 flex items-center gap-4 hover:bg-[var(--sol-red)]/10 border border-transparent hover:border-[var(--sol-red)]/30 transition-all cursor-pointer group"
      >
        <div className="bg-[var(--sol-red)]/10 p-2 rounded-xl group-hover:bg-[var(--sol-red)]/20 transition-colors">
          <Bug size={20} className="text-[var(--sol-red)] flex-shrink-0" />
        </div>
        <div>
          <p className="text-[var(--sol-base2)] text-sm font-semibold font-[family-name:var(--font-montserrat)] group-hover:text-[var(--sol-red)] transition-colors">
            Report a Bug
          </p>
          <p className="text-[var(--sol-base01)] text-xs font-[family-name:var(--font-montserrat)]">
            Found an issue? Let us know with screenshots.
          </p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#00151a]/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="w-full max-w-lg bg-[#002b36] border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-5 border-b border-white/5 bg-[#00212b]">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 font-outfit">
                  <Bug className="text-red-400" />
                  Report a Bug
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isSuccess ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="text-emerald-400"
                  >
                    <CheckCircle2 className="w-20 h-20" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white font-outfit">Caught it!</h3>
                  <p className="text-slate-300 font-montserrat">Your bug report has been beamed directly to our Notion database.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 font-montserrat">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      What went wrong?
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explain what you clicked, what happened, and what you expected to happen..."
                      className="w-full h-36 bg-[#00151a] text-white border border-white/10 rounded-xl p-4 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 resize-none transition-all placeholder:text-slate-600"
                      required={files.length === 0}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-slate-300">
                        Screenshots ({files.length}/5)
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors bg-cyan-400/10 px-3 py-1.5 rounded-lg"
                      >
                        <ImagePlus className="w-4 h-4" /> Add Image
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      multiple
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />

                    {files.length > 0 && (
                      <div className="grid grid-cols-5 gap-3">
                        {files.map((file, i) => (
                          <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-square bg-[#00151a]">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute inset-0 bg-red-500/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                            >
                              <X className="w-6 h-6 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || (!description && files.length === 0)}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading to Notion...
                        </>
                      ) : (
                        "Submit Bug Report"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
