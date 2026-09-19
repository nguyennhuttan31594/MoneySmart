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
            height: isFocused ? 120 : 56,
            transition: 'height 400ms cubic-bezier(0.32,0.72,0,1), border-radius 400ms cubic-bezier(0.32,0.72,0,1)',
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '0.5px solid rgba(255, 255, 255, 0.65)',
            boxShadow: '0 12px 32px -8px rgba(0, 0, 0, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.85)',
            position: 'relative',
            display: 'flex',
            alignItems: isFocused ? 'flex-start' : 'center',
            padding: isFocused ? '12px 12px 12px 16px' : '8px 8px 8px 16px',
            gap: 8,
          }}
        >
          {/* Specular highlight ::before overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              background: 'linear-gradient(140deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.20) 100%)',
              zIndex: 1,
            }}
            aria-hidden="true"
          />

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
                : "Gõ hoặc nói: 'Cơm tấm 35k'..."
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
              color: '#000000',
              caretColor: '#007AFF',
              padding: isFocused ? '4px 0' : '0',
              zIndex: 2,
              height: isFocused ? '100%' : 'auto',
            }}
          />

          {/* Action buttons wrapper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 2, alignSelf: isFocused ? 'flex-end' : 'center' }}>
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleListen}
              disabled={isProcessing}
              aria-label={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
              className="fab-btn"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: isListening ? '#FF3B30' : 'rgba(118, 118, 128, 0.12)',
                color: isListening ? '#FFFFFF' : 'rgba(60, 60, 67, 0.60)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
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
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#007AFF',
                color: '#FFFFFF',
                opacity: hasContent && !isProcessing ? 1 : 0.35,
                transform: hasContent && !isProcessing ? 'scale(1)' : 'scale(0.92)',
                transition: 'opacity 280ms cubic-bezier(0.32,0.72,0,1), transform 280ms cubic-bezier(0.32,0.72,0,1)',
                boxShadow: hasContent ? '0 4px 12px rgba(0,122,255,0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: hasContent && !isProcessing ? 'pointer' : 'default',
              }}
            >
              {isProcessing
                ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} aria-hidden="true" />
                : <SendHorizonal style={{ width: 18, height: 18 }} aria-hidden="true" />
              }
            </button>
          </div>
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
