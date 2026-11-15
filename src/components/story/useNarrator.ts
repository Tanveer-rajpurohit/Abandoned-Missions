"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const VOICE_KEY = "am-narrator-voice";
const RATE_KEY = "am-narrator-speed";
/** Slow for young listeners, quick for people who know the story. */
export const RATES = [
  { value: 0.85, label: "Slow" },
  { value: 0.95, label: "Calm" },
  { value: 1.1, label: "Quick" },
] as const;
const DEFAULT_RATE = RATES[1].value;
/** Browsers play speech at full device volume by default; 0.8 leaves headroom for long listening. */
const VOLUME = 0.8;
/** Rough speaking speed, only used to move the progress bar when a voice sends no word events. */
const CHARS_PER_SECOND = 14;
const START_DELAY_MS = 150;
/** A voice that has not begun after this long is not going to; stop instead of waiting forever. */
const START_TIMEOUT_MS = 8000;

/** Google's browser voices stream from a server, cut out mid-card and sound different on every machine. */
const isUsable = (voice: SpeechSynthesisVoice) => !/google/i.test(voice.name);

const readStored = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is blocked (private window): the choice lasts until the page closes.
  }
};

// The voice list loads late and changes, so it lives in one cached snapshot for useSyncExternalStore.
const NO_VOICES: SpeechSynthesisVoice[] = [];
let voiceSnapshot = NO_VOICES;
let hasLoaded = false;

const refreshVoices = () => {
  const next = window.speechSynthesis.getVoices().filter(isUsable);
  const isSame = next.length === voiceSnapshot.length && next.every((voice, i) => voice.voiceURI === voiceSnapshot[i].voiceURI);
  if (!isSame) voiceSnapshot = next;
  hasLoaded = true;
};

const subscribeVoices = (onChange: () => void) => {
  const synth = window.speechSynthesis;
  const handle = () => {
    refreshVoices();
    onChange();
  };
  synth.addEventListener("voiceschanged", handle);
  // The event may have fired before this subscribed; read the list once more now.
  handle();
  return () => synth.removeEventListener("voiceschanged", handle);
};

const getVoices = () => {
  if (!hasLoaded) refreshVoices();
  return voiceSnapshot;
};

const subscribeNothing = () => () => {};
const getSupport = () => "speechSynthesis" in window;

/** The voices offered when this device has them; the default and the saved choice are always listed too. */
const SHORTLIST = /(george|david|hazel)/i;

/** Prefers the neural voices (Edge "Natural", Apple Premium and Enhanced), then warm English ones. */
const voiceScore = (voice: SpeechSynthesisVoice): number => {
  let score = 0;
  if (/natural|neural/i.test(voice.name)) score += 100;
  if (/premium|enhanced/i.test(voice.name)) score += 60;
  if (/\b(aria|jenny|ava|samantha|allison|zoe|libby|sonia|zira)\b/i.test(voice.name)) score += 30;
  if (voice.lang.toLowerCase().startsWith("en")) score += 20;
  if (voice.lang === "en-US") score += 10;
  if (voice.localService) score += 5;
  return score;
};

/** The voice a first-time visitor hears: George where the device has him, else its best-sounding English voice. */
const pickDefault = (voices: SpeechSynthesisVoice[]) => voices.find((voice) => /george/i.test(voice.name)) ?? voices.reduce<SpeechSynthesisVoice | undefined>((best, voice) => (!best || voiceScore(voice) > voiceScore(best) ? voice : best), undefined);

interface SpeakOptions {
  /** 0 to 1 through the card. */
  onProgress: (fraction: number) => void;
  onEnd: () => void;
  onFail: () => void;
}

/**
 * Reads cards aloud with the browser's own speech engine: free, no files to ship, and every
 * voice the device has (minus Google's) is on offer. Pausing stops the card and listening
 * again starts it from the top; browsers cannot resume speech reliably across devices.
 */
export function useNarrator() {
  const isSupported = useSyncExternalStore(subscribeNothing, getSupport, () => false);
  const voices = useSyncExternalStore(subscribeVoices, getVoices, () => NO_VOICES);
  const [savedUri, setSavedUri] = useState<string | null>(() => readStored(VOICE_KEY));
  const [rate, setRateState] = useState<number>(() => RATES.find((option) => option.value === Number(readStored(RATE_KEY)))?.value ?? DEFAULT_RATE);

  const voice = voices.find((option) => option.voiceURI === savedUri) ?? pickDefault(voices);
  const choices = useMemo(() => {
    const shortlisted = voices.filter((option) => option === voice || SHORTLIST.test(option.name));
    // A phone or Mac has none of these names, so it lists everything it has.
    return shortlisted.length > 1 ? shortlisted : voices;
  }, [voices, voice]);
  const timers = useRef<{ start?: number; watch?: number }>({});
  // Bumped by stop(), so a card that was cancelled can never report that it finished.
  const generation = useRef(0);

  const stop = useCallback(() => {
    generation.current += 1;
    window.clearTimeout(timers.current.start);
    window.clearInterval(timers.current.watch);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // Leaving the page must not leave a voice talking.
  useEffect(() => stop, [stop]);

  const speak = useCallback(
    (text: string, { onProgress, onEnd, onFail }: SpeakOptions) => {
      stop();
      const mine = generation.current;
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      utterance.rate = rate;
      utterance.volume = VOLUME;

      let spoken = 0;
      let hasStarted = false;
      let isDone = false;
      const startedAt = performance.now();
      const expectedMs = (text.length / (CHARS_PER_SECOND * rate)) * 1000;

      const finish = (callback: () => void) => {
        if (isDone || mine !== generation.current) return;
        isDone = true;
        window.clearInterval(timers.current.watch);
        callback();
      };

      utterance.onstart = () => {
        hasStarted = true;
      };
      utterance.onboundary = (event) => {
        spoken = Math.max(spoken, event.charIndex / text.length);
      };
      utterance.onend = () => finish(onEnd);
      utterance.onerror = (event) => {
        // cancel() raises "canceled" or "interrupted"; only a real failure should stop the story.
        if (event.error !== "canceled" && event.error !== "interrupted") finish(onFail);
      };

      // Some engines never send "end", which left the bar waiting on a card that was already
      // read. The engine's own speaking flag is the backstop: once it started and went quiet, the card is done.
      timers.current.watch = window.setInterval(() => {
        const elapsed = performance.now() - startedAt;
        if (hasStarted && !synth.speaking && !synth.pending) return finish(onEnd);
        if (!hasStarted && elapsed > START_TIMEOUT_MS) return finish(onFail);
        onProgress(Math.max(spoken, Math.min(0.95, elapsed / expectedMs)));
      }, 120);

      // Chrome drops a speak() issued in the same tick as cancel(), so give the engine a moment.
      timers.current.start = window.setTimeout(() => synth.speak(utterance), START_DELAY_MS);
    },
    [stop, voice, rate],
  );

  const setVoice = useCallback((voiceURI: string) => {
    setSavedUri(voiceURI);
    writeStored(VOICE_KEY, voiceURI);
  }, []);

  const setRate = useCallback((value: number) => {
    setRateState(value);
    writeStored(RATE_KEY, String(value));
  }, []);

  return { isSupported, voices: choices, voice, setVoice, rate, setRate, speak, stop };
}
