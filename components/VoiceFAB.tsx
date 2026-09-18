'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Send } from 'lucide-react';

interface VoiceFABProps {
  onTranscriptComplete: (transcript: string) => void;
  isProcessing?: boolean;
}

export const VoiceFAB: React.FC<VoiceFABProps> = ({
  onTranscriptComplete,
  isProcessing = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'vi-VN';

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMsg(null);
          setTranscript('');
        };

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setErrorMsg('Vui lòng cấp quyền micro để thu âm');
          } else {
            setErrorMsg('Lỗi thu âm. Vui lòng nhấn lại');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (transcript.trim()) {
        onTranscriptComplete(transcript);
      }
    } else {
      if (!recognitionRef.current) {
        setErrorMsg('Trình duyệt chưa hỗ trợ Web Speech API.');
        return;
      }
      try {
        setTranscript('');
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim()) {
      if (isListening) {
        recognitionRef.current?.stop();
      }
      onTranscriptComplete(transcript);
    }
  };

  return (
    <div className="relative">
      {/* Real-time iOS Floating Popup Toast */}
      {(isListening || transcript || errorMsg || isProcessing) && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_12px_32px_rgba(0,0,0,0.12)] rounded-[24px] p-4 text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {errorMsg ? (
            <p className="text-xs text-rose-500 font-medium text-center">{errorMsg}</p>
          ) : isProcessing ? (
            <div className="flex items-center justify-center gap-3 text-[#007AFF]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-semibold tracking-wide">Moneyflow AI đang giải mã...</span>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
                  {isListening ? 'Đang lắng nghe tiếng Việt...' : 'Văn bản thu âm'}
                </span>
                {isListening && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF3B30]"></span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Nói hoặc gõ: 'Đi ăn cơm tấm 25k'..."
                  className="flex-1 bg-[#F2F2F7] border border-black/[0.05] rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 transition"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!transcript.trim() || isProcessing}
                  className="bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-40 text-white p-2.5 rounded-xl transition shadow-md shadow-[#007AFF]/20 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Main iOS Floating Action Button */}
      <button
        onClick={toggleListen}
        disabled={isProcessing}
        className={`relative -top-5 p-4 rounded-full shadow-lg shadow-[#007AFF]/30 transition-all duration-300 transform active:scale-95 flex items-center justify-center border-4 border-white ${
          isListening
            ? 'bg-[#FF3B30] text-white ring-4 ring-[#FF3B30]/30 shadow-red-500/40'
            : 'bg-[#007AFF] hover:bg-[#0062CC] text-white hover:scale-105'
        }`}
        title="Bấm để nói thu nhập / chi tiêu"
      >
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-[#FF3B30] opacity-75 animate-ping"></span>
            <span className="absolute -inset-2 rounded-full border-2 border-[#FF3B30]/40 animate-pulse"></span>
          </>
        )}

        <div className="relative z-10 flex items-center justify-center">
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" strokeWidth={2.2} />
          )}
        </div>
      </button>
    </div>
  );
};
