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

        recognition.onstart = () => { setIsListening(true); setErrorMsg(null); };
        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
        };
        recognition.onerror = (event: any) => {
          setIsListening(false);
          setErrorMsg(event.error === 'not-allowed'
            ? 'Vui lòng cấp quyền micro để thu âm'
            : 'Lỗi thu âm. Vui lòng nhấn lại');
        };
        recognition.onend = () => setIsListening(false);
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
      if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
      onTranscriptComplete(transcript.trim());
      setTranscript('');
      setErrorMsg(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Error banner */}
      {errorMsg && (
        <div
          style={{
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 500,
            textAlign: 'center',
            color: '#FF453A',
            background: 'rgba(255,69,58,0.08)',
            border: '1px solid rgba(255,69,58,0.2)',
            borderRadius: 12,
            padding: '7px 12px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Input bar — Liquid Glass */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.12)',
          borderRadius: 9999,
          padding: '6px 6px 6px 16px',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        {/* Text Input */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
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
            style={{
              flex: 1,
              background: 'transparent',
              color: '#1C1C1E',
              fontSize: 14,
              fontWeight: 500,
              fontFamily: 'inherit',
              outline: 'none',
              border: 'none',
            }}
          />

          {/* Recording pulse indicator */}
          {isListening && (
            <span style={{ position: 'relative', width: 10, height: 10, display: 'flex', flexShrink: 0 }}>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: '#FF453A',
                  opacity: 0.6,
                  animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                }}
              />
              <span
                style={{
                  borderRadius: '50%',
                  width: 10,
                  height: 10,
                  background: '#FF453A',
                  position: 'relative',
                }}
              />
            </span>
          )}
        </div>

        {/* Mic Button */}
        <button
          type="button"
          onClick={toggleListen}
          disabled={isProcessing}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            ...(isListening
              ? {
                  background: '#FF453A',
                  color: '#fff',
                  boxShadow: '0 0 0 4px rgba(255,69,58,0.25)',
                }
              : {
                  background: 'rgba(118,118,128,0.12)',
                  color: '#007AFF',
                }),
          }}
          title={isListening ? 'Dừng thu âm' : 'Nói bằng giọng nói'}
        >
          {isListening ? (
            <MicOff style={{ width: 18, height: 18 }} />
          ) : (
            <Mic style={{ width: 18, height: 18 }} strokeWidth={2.2} />
          )}
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!transcript.trim() || isProcessing}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff',
            background: transcript.trim() && !isProcessing
              ? 'linear-gradient(135deg, #007AFF 0%, #0A84FF 100%)'
              : 'rgba(118,118,128,0.2)',
            boxShadow: transcript.trim() && !isProcessing
              ? '0 4px 14px rgba(0,122,255,0.4)'
              : 'none',
            transition: 'all 0.2s ease',
            opacity: transcript.trim() || isProcessing ? 1 : 0.4,
          }}
          title="Gửi dữ liệu (Enter)"
        >
          {isProcessing ? (
            <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send style={{ width: 16, height: 16 }} />
          )}
        </button>
      </form>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
