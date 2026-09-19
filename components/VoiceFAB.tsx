'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, SendHorizonal } from 'lucide-react';

interface VoiceFABProps {
  onTranscriptComplete: (transcript: string) => void;
  isProcessing?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

const vibrate = (p: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p);
};

export const VoiceFAB: React.FC<VoiceFABProps> = ({
  onTranscriptComplete,
  isProcessing = false,
  onFocusChange,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const r = new SR();
        r.continuous = false;
        r.interimResults = true;
        r.lang = 'vi-VN';
        r.onstart = () => { setIsListening(true); setErrorMsg(null); };
        r.onresult = (e: any) => {
          let t = '';
          for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
          setTranscript(t);
        };
        r.onerror = (e: any) => {
          setIsListening(false);
          setErrorMsg(e.error === 'not-allowed' ? 'Vui lòng cấp quyền micro' : 'Lỗi thu âm, thử lại');
        };
        r.onend = () => setIsListening(false);
        recognitionRef.current = r;
      }
    }
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    if (!transcript) {
      setIsFocused(false);
      onFocusChange?.(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) { setErrorMsg('Trình duyệt chưa hỗ trợ giọng nói.'); return; }
      try {
        setErrorMsg(null);
        inputRef.current?.focus();
        recognitionRef.current.start();
      } catch (e) { console.error(e); }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!transcript.trim() || isProcessing) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    vibrate(8);
    onTranscriptComplete(transcript.trim());
    setTranscript('');
    setErrorMsg(null);
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') {
      setIsFocused(false);
      setTranscript('');
      onFocusChange?.(false);
      inputRef.current?.blur();
    }
  };

  const hasContent = transcript.trim().length > 0;

  return (
    <div style={{ width: '100%' }}>
      {/* Error toast */}
      {errorMsg && (
        <div
          className="toast glass-thin animate-slide-down-in"
          style={{
            marginBottom: 8,
            color: 'var(--red)',
            fontSize: 13,
            borderRadius: 9999,
            alignSelf: 'center',
            width: 'fit-content',
            margin: '0 auto 8px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* FAB input — Liquid Glass star component */}
      <form onSubmit={handleSubmit}>
        <div
          className="glass-regular voice-fab"
          style={{
            borderRadius: isFocused ? 24 : 9999,
            height: isFocused ? 'auto' : 56,
            minHeight: 56,
            alignItems: isFocused ? 'flex-end' : 'center',
          }}
        >
          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder={
              isListening
                ? 'Đang lắng nghe...'
                : "Gõ hoặc nói: 'Cơm tấm 35k', 'Lương 15tr'..."
            }
            aria-label="Nhập giao dịch"
            className="voice-fab-input"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: 17,
              fontWeight: 400,
              letterSpacing: '-0.43px',
              color: 'var(--label)',
              caretColor: 'var(--blue)',
              padding: '14px 0',
            }}
          />

          {/* Mic button */}
          <button
            type="button"
            onClick={toggleListen}
            disabled={isProcessing}
            aria-label={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
            className="fab-btn"
            style={{
              background: isListening
                ? 'var(--red)'
                : 'var(--fill-quaternary)',
              color: isListening ? '#fff' : 'var(--label-secondary)',
              position: 'relative',
            }}
          >
            {/* Ripple rings when recording */}
            {isListening && (
              <>
                <span className="recording-ring" />
                <span className="recording-ring" />
                <span className="recording-ring" />
              </>
            )}
            {isListening
              ? <MicOff style={{ width: 18, height: 18 }} aria-hidden="true" />
              : <Mic style={{ width: 18, height: 18 }} strokeWidth={2} aria-hidden="true" />
            }
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!hasContent || isProcessing}
            aria-label="Gửi giao dịch"
            className="fab-btn press-scale"
            style={{
              background: 'var(--blue)',
              color: '#fff',
              opacity: hasContent && !isProcessing ? 1 : 0.35,
              transform: hasContent && !isProcessing ? 'scale(1)' : 'scale(0.9)',
              transition: 'opacity 280ms cubic-bezier(0.25,1.5,0.5,1), transform 280ms cubic-bezier(0.25,1.5,0.5,1)',
              boxShadow: hasContent ? '0 4px 12px rgba(0,122,255,0.35)' : 'none',
            }}
          >
            {isProcessing
              ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} aria-hidden="true" />
              : <SendHorizonal style={{ width: 16, height: 16 }} aria-hidden="true" />
            }
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
