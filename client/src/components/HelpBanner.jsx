import React, { useState, useEffect } from 'react';
import { Mail, Phone, ExternalLink, X, ArrowUpRight, Check, Copy } from 'lucide-react';

export default function HelpBanner() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedType, setCopiedType] = useState(null);

  useEffect(() => {
    const handleOpenHelp = () => {
      setIsModalOpen(true);
    };
    window.addEventListener('open-help-modal', handleOpenHelp);
    return () => window.removeEventListener('open-help-modal', handleOpenHelp);
  }, []);

  const email = '24kb1a0517@nbkrist.org';
  const phone = '96760 43817';
  const rawPhone = '9676043817';
  const formattedPhone = '+91 96760 43817';

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const whatsappUrl = `https://wa.me/91${rawPhone}?text=${encodeURIComponent(
    'Hello Coordinator, I need assistance regarding NBKRIST TeamFinder.'
  )}`;

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(
    'NBKRIST TeamFinder - Student Query'
  )}&body=${encodeURIComponent(
    'Respected Coordinator,\n\nName: \nRoll Number: \nDepartment: \nQuery: \n\nThank you.'
  )}`;

  return (
    <>
      {/* Top Banner: Minimal, Clean, Typographical */}
      {!isDismissed ? (
        <aside aria-label="Support announcement" className="bg-slate-900 text-slate-300 border-b border-slate-800 text-xs py-2 px-4 sm:px-6 relative z-30">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
            
            {/* Left: Calm text statement */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-normal">
                For help or team coordination:
              </span>
              <a
                href={`mailto:${email}`}
                className="font-mono text-slate-100 hover:text-white underline underline-offset-2 decoration-slate-600 hover:decoration-white transition-colors"
                title="Send email"
              >
                {email}
              </a>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <a
                href={`tel:+91${rawPhone}`}
                className="font-mono text-slate-100 hover:text-white underline underline-offset-2 decoration-slate-600 hover:decoration-white transition-colors hidden sm:inline"
                title="Call coordinator"
              >
                {formattedPhone}
              </a>
            </div>

            {/* Right: Text actions */}
            <div className="flex items-center gap-3 text-xs">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors inline-flex items-center gap-1 font-medium"
              >
                <span>WhatsApp</span>
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </a>
              <span className="text-slate-700">|</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-slate-200 hover:text-white font-medium underline underline-offset-2 decoration-slate-500 transition-colors"
              >
                Contact details
              </button>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                title="Dismiss banner"
                className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors ml-1"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </aside>
      ) : (
        /* Minimized subtle pill in bottom corner */
        <aside aria-label="Support Desk" className="fixed bottom-5 left-5 z-40">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-full bg-slate-900 text-slate-200 text-xs font-mono border border-slate-700 shadow-md hover:text-white hover:border-slate-500 transition-all flex items-center gap-2"
            title="Open Help Desk details"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Help: {phone}</span>
          </button>
        </aside>
      )}

      {/* Pop-up Modal: Clean, Typographical, Natural */}
      {isModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="helpdesk-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs overflow-y-auto flex items-center justify-center py-12 sm:py-16 md:py-20 px-4 sm:px-6"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header: Editorial & Typographical with generous top padding */}
            <div className="pt-8 sm:pt-9 pb-5 px-7 sm:px-8 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                    NBKRIST Student Helpdesk
                  </p>
                  <h2 
                    id="helpdesk-modal-title" 
                    className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1"
                  >
                    Coordinator Contact
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Direct communication line for SIH team matching, female member requirements, and account verification queries.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Natural, clean, typographical with generous spacing */}
            <div className="pt-6 pb-8 px-7 sm:px-8 space-y-6">
              
              {/* Row 1: Phone / Helpline */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  Phone & WhatsApp
                </div>
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <span className="font-mono text-lg font-medium text-slate-900 dark:text-white tracking-tight">
                    {formattedPhone}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <a
                      href={`tel:+91${rawPhone}`}
                      className="font-medium text-slate-900 dark:text-slate-100 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 hover:decoration-slate-900 dark:hover:decoration-white transition-colors"
                    >
                      Call
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-900 dark:text-slate-100 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 hover:decoration-slate-900 dark:hover:decoration-white transition-colors inline-flex items-center gap-0.5"
                    >
                      <span>WhatsApp</span>
                      <ArrowUpRight className="w-2.5 h-2.5 text-slate-400" />
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(formattedPhone, 'phone')}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 transition-colors"
                    >
                      {copiedType === 'phone' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Fine hairline divider */}
              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Row 2: Coordinator Email */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  Email Address
                </div>
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                      {email}
                    </span>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Roll Number: 24KB1A0517
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <a
                      href={gmailComposeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-900 dark:text-slate-100 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 hover:decoration-slate-900 dark:hover:decoration-white transition-colors inline-flex items-center gap-0.5"
                    >
                      <span>Gmail</span>
                      <ArrowUpRight className="w-2.5 h-2.5 text-slate-400" />
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <a
                      href={`mailto:${email}`}
                      className="font-medium text-slate-900 dark:text-slate-100 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 hover:decoration-slate-900 dark:hover:decoration-white transition-colors"
                    >
                      Mail App
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(email, 'email')}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700 transition-colors"
                    >
                      {copiedType === 'email' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Fine hairline divider */}
              <div className="border-t border-slate-100 dark:border-slate-800" />

              {/* Row 3: Editorial Guidelines */}
              <div className="border-l border-slate-300 dark:border-slate-700 pl-3.5 py-0.5 space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Team Formation Reminders
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Teams require exactly 6 students and must include at least 1 female teammate. When reaching out, include your Name, Department, and Roll Number so the coordinator can assist you promptly.
                </p>
              </div>

            </div>

            {/* Modal Footer with generous bottom padding and minimal styling */}
            <div className="pt-4 pb-6 sm:pb-7 px-7 sm:px-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/40">
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                NBKRIST · Vidyanagar
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
