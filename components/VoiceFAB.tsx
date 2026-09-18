'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Send } from 'lucide-react';

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
    } else {
      if (!recognitionRef.current) {
        setErrorMsg('Trình duyệt chưa hỗ trợ Web Speech API.');
        return;
      }
      try {
        setErrorMsg(null);
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (transcript.trim() && !isProcessing) {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
      onTranscriptComplete(transcript.trim());
      setTranscript('');
      setErrorMsg(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-2 text-xs text-rose-500 font-medium text-center bg-rose-50 border border-rose-200 rounded-xl py-1.5 px-3">
          {errorMsg}
        </div>
      )}

      {/* Parallel Text Input + Voice Mic + Submit Button */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full p-1.5 transition-all focus-within:ring-2 focus-within:ring-[#007AFF]/40"
      >
        {/* Text Input */}
        <div className="relative flex-1 flex items-center pl-3">
          <input
            type="text"
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder={
              isListening
                ? 'Đang lắng nghe giọng nói...'
                : "Gõ hoặc nói: 'Cơm tấm 35k', 'Lương 15tr'..."
            }
            className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none py-1.5 pr-2"
          />

          {isListening && (
            <span className="flex h-2.5 w-2.5 relative mr-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B30] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF3B30]"></span>
            </span>
          )}
        </div>

        {/* Micro Button (song song với ô nhập liệu) */}
        <button
          type="button"
          onClick={toggleListen}
          disabled={isProcessing}
          className={`p-2.5 rounded-full transition-all duration-200 shrink-0 flex items-center justify-center ${
            isListening
              ? 'bg-[#FF3B30] text-white ring-2 ring-[#FF3B30]/40 animate-pulse'
              : 'bg-[#F2F2F7] hover:bg-slate-200 text-[#007AFF] active:scale-95'
          }`}
          title={isListening ? 'Dừng thu âm' : 'Nói bằng giọng nói'}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" strokeWidth={2.2} />
          )}
        </button>

        {/* Submit / Send Button */}
        <button
          type="submit"
          disabled={!transcript.trim() || isProcessing}
          className="bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-30 disabled:hover:bg-[#007AFF] text-white p-2.5 rounded-full transition shadow-md shadow-[#007AFF]/20 shrink-0 flex items-center justify-center active:scale-95"
          title="Gửi dữ liệu (Enter)"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
