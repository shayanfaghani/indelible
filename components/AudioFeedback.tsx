"use client";

import { useEffect } from "react";

function playTick() {
    try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.04);

        oscillator.onended = () => ctx.close();
    } catch {
        // Audio not available — fail silently
    }
}

function isMobilePWA(): boolean {
    if (typeof window === "undefined") return false;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isTouchDevice = navigator.maxTouchPoints > 0;
    return isStandalone && isTouchDevice;
}

export default function AudioFeedback() {
    useEffect(() => {
        if (!isMobilePWA()) return;

        const handleClick = () => playTick();
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    return null;
}