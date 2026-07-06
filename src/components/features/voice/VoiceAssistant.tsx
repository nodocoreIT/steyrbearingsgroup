'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type RecipientRole = 'vendedor' | 'admin_general'

type RecordingState = 'idle' | 'recording' | 'done'
type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

// Web Speech API type stubs (not yet in all TS lib versions)
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function VoiceAssistant() {
  const [open, setOpen] = useState(false)
  const [recipient, setRecipient] = useState<RecipientRole>('vendedor')
  const [transcript, setTranscript] = useState('')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    setHasSpeechSupport(!!getSpeechRecognition())
  }, [])

  const startRecording = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-AR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let full = ''
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript
      }
      setTranscript(full)
    }

    recognition.onerror = () => {
      setRecordingState('done')
    }

    recognition.onend = () => {
      setRecordingState('done')
    }

    recognition.start()
    recognitionRef.current = recognition
    setRecordingState('recording')
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setRecordingState('done')
  }, [])

  function reset() {
    setTranscript('')
    setRecordingState('idle')
    setSubmitState('idle')
  }

  async function submit() {
    if (!transcript.trim()) return

    setSubmitState('submitting')

    try {
      const res = await fetch('/api/voice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, recipientRole: recipient }),
      })

      if (res.ok) {
        setSubmitState('success')
        setTimeout(() => {
          setOpen(false)
          reset()
        }, 2000)
      } else {
        setSubmitState('error')
      }
    } catch {
      setSubmitState('error')
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente de voz"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <MicIcon />
      </button>

      <Dialog open={open} onOpenChange={(v: boolean) => { setOpen(v); if (!v) reset() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Consulta de voz</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Recipient selector */}
            <div className="space-y-2">
              <Label>¿Con quién querés comunicarte?</Label>
              <div className="flex gap-2">
                {(['vendedor', 'admin_general'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setRecipient(role)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                      recipient === role
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-muted'
                    }`}
                  >
                    {role === 'vendedor' ? 'Vendedor' : 'Administrador'}
                  </button>
                ))}
              </div>
            </div>

            {/* Recording controls */}
            {hasSpeechSupport ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  {recordingState === 'idle' && (
                    <Button onClick={startRecording} className="gap-2">
                      <MicIcon className="h-4 w-4" />
                      Iniciar grabación
                    </Button>
                  )}
                  {recordingState === 'recording' && (
                    <Button onClick={stopRecording} variant="destructive" className="gap-2">
                      <StopIcon className="h-4 w-4" />
                      Detener
                    </Button>
                  )}
                  {recordingState === 'done' && (
                    <Button onClick={startRecording} variant="outline" className="gap-2">
                      <MicIcon className="h-4 w-4" />
                      Grabar de nuevo
                    </Button>
                  )}
                </div>
                {recordingState === 'recording' && (
                  <p className="text-center text-xs text-muted-foreground animate-pulse">
                    Escuchando…
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                La grabación de voz no está soportada en este navegador.
              </p>
            )}

            {/* Transcript / fallback textarea */}
            <div className="space-y-2">
              <Label htmlFor="transcript">
                {hasSpeechSupport ? 'Transcripción (editable)' : 'Escribí tu mensaje'}
              </Label>
              <textarea
                id="transcript"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={4}
                placeholder="Tu mensaje aparecerá aquí…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Submit */}
            {submitState === 'success' && (
              <p className="text-sm text-green-600 text-center">
                Mensaje enviado correctamente.
              </p>
            )}
            {submitState === 'error' && (
              <p className="text-sm text-destructive text-center">
                No se pudo enviar el mensaje. Por favor intentá de nuevo.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setOpen(false); reset() }}
                disabled={submitState === 'submitting'}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={submit}
                disabled={!transcript.trim() || submitState === 'submitting' || submitState === 'success'}
              >
                {submitState === 'submitting' ? 'Enviando…' : 'Enviar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? 'h-6 w-6'}
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className ?? 'h-6 w-6'}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}
