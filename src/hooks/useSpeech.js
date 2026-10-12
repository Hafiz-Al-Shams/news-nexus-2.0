"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const MAX_CHUNK_LENGTH = 180; // long text is spoken in small pieces, because Chrome stops long utterances after ~15 seconds

// Voice names that usually belong to male voices (matched in lowercase)
const MALE_HINTS = [
  "male", "david", "mark", "guy", "daniel", "alex", "fred",
  "george", "james", "ryan", "thomas", "aaron", "arthur", "oliver", "rishi",
];

// Voice names that must be skipped (note: "female" also contains the word "male", so it is excluded here)
const FEMALE_HINTS = [
  "female", "zira", "samantha", "susan", "hazel", "karen", "victoria", "moira",
  "tessa", "fiona", "catherine", "jenny", "aria", "sonia", "libby", "linda", "heather", "emma",
];

// Splits a long text into sentence groups of at most ~180 characters
function splitIntoChunks(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) || [clean];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHUNK_LENGTH && current) {
      chunks.push(current.trim()); // current group is full, start a new one
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Picks the best male English voice available on this device (or null if none is found)
function pickMaleVoice(voices) {
  const english = voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));
  const pool = english.length ? english : voices;

  const male = pool.find((v) => {
    const name = v.name.toLowerCase();
    return MALE_HINTS.some((h) => name.includes(h)) && !FEMALE_HINTS.some((h) => name.includes(h));
  });

  return male || null;
}

// Hook: gives { isSupported, isSpeaking, speak, stop } to any component
export default function useSpeech() {
  const [isSupported, setIsSupported] = useState(false); // false on the server, set after mount (avoids hydration mismatch)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const tokenRef = useRef(0); // each new speech gets a number, so late events from a cancelled speech are ignored
  const utteranceRef = useRef(null); // keeps the active utterance alive (some browsers garbage-collect it mid-speech)

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setIsSupported(true);
    window.speechSynthesis.getVoices(); // warms up the voice list (some browsers load voices lazily)

    // Cleanup: stop talking when the component disappears (modal closed, page left, view switched)
    return () => {
      tokenRef.current += 1;
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    tokenRef.current += 1; // invalidates any running speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text) => {
    if (!("speechSynthesis" in window) || !text?.trim()) return;

    const synth = window.speechSynthesis;
    synth.cancel(); // stop anything already being spoken
    const token = ++tokenRef.current;

    const chunks = splitIntoChunks(text);
    const voice = pickMaleVoice(synth.getVoices()); // male voice if the device has one
    let index = 0;

    const speakNext = () => {
      if (token !== tokenRef.current) return; // a newer speech or a stop() replaced this one
      if (index >= chunks.length) {
        setIsSpeaking(false); // finished reading everything
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index++]);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "en-US";
      }
      utterance.rate = 0.95; // slightly slower than normal, easier to follow
      utterance.pitch = voice ? 1 : 0.7; // no male voice found: lower the pitch so it sounds deeper

      utterance.onend = speakNext; // when this piece ends, read the next one
      utterance.onerror = () => {
        if (token === tokenRef.current) setIsSpeaking(false); // real error (cancel events are ignored by the token check)
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    };

    setIsSpeaking(true);
    speakNext();
  }, []);

  return { isSupported, isSpeaking, speak, stop };
}