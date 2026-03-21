'use client';

import { useEffect, useRef, useState } from 'react';

type VoiceMemoRecorderProps = {
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
  disabled?: boolean;
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function VoiceMemoRecorder({
  onRecordingComplete,
  disabled = false,
}: VoiceMemoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const chunksRef = useRef<BlobPart[]>([]);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStreamTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (disabled || isRecording) {
      return;
    }

    try {
      if (!window.MediaRecorder) {
        setPermissionError('MediaRecorder is not supported in this browser.');
        return;
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setPermissionError(null);
      setRecordedBlob(null);
      setAudioUrl(null);
      setDuration(0);
      durationRef.current = 0;
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stopTimer();
        setIsRecording(false);

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        setRecordedBlob(blob);

        const nextAudioUrl = URL.createObjectURL(blob);
        setAudioUrl(nextAudioUrl);

        onRecordingComplete(blob, durationRef.current);
        stopStreamTracks();
        mediaRecorderRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        setDuration((previous) => {
          const next = previous + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);
    } catch {
      setPermissionError('Microphone permission is required to record voice memos.');
      stopStreamTracks();
      mediaRecorderRef.current = null;
      stopTimer();
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return;
    }

    recorder.stop();
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      stopTimer();

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }

      stopStreamTracks();

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          className={`h-10 w-10 shrink-0 rounded-full bg-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-50 ${
            isRecording ? 'animate-pulse' : 'hover:bg-red-600'
          }`}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-warm-700">
            {isRecording ? 'Recording...' : 'Tap to record'}{' '}
            {(isRecording || duration > 0) && (
              <span className="text-warm-400 font-normal">{formatDuration(duration)}</span>
            )}
          </p>
        </div>
      </div>

      {permissionError && (
        <p className="mt-2 text-xs text-red-600">{permissionError}</p>
      )}

      {recordedBlob && audioUrl && !isRecording && (
        <div className="mt-2 space-y-2">
          <audio controls src={audioUrl} className="w-full h-8" />
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="text-xs font-medium text-warm-700 underline underline-offset-4 py-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}
