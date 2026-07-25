"use client";
import { useEffect, useRef, useState } from "react";
import { getBetaStatus, formatBetaDate, BETA_START_DATE, BETA_END_DATE } from "@/lib/beta";

const VOID = "#0B0E1F";
const HEART_PATH = "M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.6 c6.5-9.7,16-12.2,16-21.6C32,3.8,28.2,0,23.6,0z";
const COLOR_WHEEL_STEP = 30; // 12 stops around a basic color wheel

// Same heart used on the original welcome screen: blinking eyes + smile
// normally, eyebrows-up + tongue-out the instant it hits a wall.
function DVDHeart({ size, color, tongueOut }: { size: number; color: string; tongueOut: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" style={{ overflow: "visible", display: "block" }}>
      <g transform="translate(16,14) scale(2)"><path d={HEART_PATH} fill={color} /></g>
      {tongueOut ? (
        <>
          <path d="M33,37 Q38,32 43,37" stroke={VOID} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M53,37 Q58,32 63,37" stroke={VOID} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="48" cy="50" r="5.5" fill={VOID} />
          <path d="M44,53 Q48,66 52,53 Z" fill="#FF9DE0" />
        </>
      ) : (
        <>
          <circle cx="38" cy="38" r="2.6" fill={VOID} style={{ transformOrigin: "38px 38px", animation: "pm-blink 4.6s ease-in-out infinite" }} />
          <circle cx="58" cy="38" r="2.6" fill={VOID} style={{ transformOrigin: "58px 38px", animation: "pm-blink 4.6s ease-in-out infinite" }} />
          <path d="M36,48 Q48,56 60,48" stroke={VOID} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      )}
      <style>{`@keyframes pm-blink { 0%, 90%, 100% { transform: scaleY(1); } 94% { transform: scaleY(0.12); } }`}</style>
    </svg>
  );
}

function BouncingHeart({ size = 150 }: { size?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ dx: 1.1, dy: 0.85 });
  const hueRef = useRef(317); // starts on the app's neon magenta
  const [hue, setHue] = useState(317);
  const [tongueOut, setTongueOut] = useState(false);
  const tongueTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const container = containerRef.current;
    const heart = heartRef.current;
    if (!container || !heart) return;

    const initial = container.getBoundingClientRect();
    posRef.current = { x: initial.width / 2 - size / 2, y: initial.height / 2 - size / 2 };
    heart.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;

    let raf: number;
    let frame = 0;
    const stillFrames = 100; // sit still where it starts for ~1.6s before drifting off

    function tick() {
      frame++;
      if (frame > stillFrames) {
        const bounds = container!.getBoundingClientRect();
        const maxX = Math.max(0, bounds.width - size);
        const maxY = Math.max(0, bounds.height - size);
        let { x, y } = posRef.current;
        let { dx, dy } = velRef.current;
        x += dx;
        y += dy;
        let bounced = false;

        if (x <= 0) { x = 0; dx = Math.abs(dx); bounced = true; }
        else if (x >= maxX) { x = maxX; dx = -Math.abs(dx); bounced = true; }
        if (y <= 0) { y = 0; dy = Math.abs(dy); bounced = true; }
        else if (y >= maxY) { y = maxY; dy = -Math.abs(dy); bounced = true; }

        posRef.current = { x, y };
        velRef.current = { dx, dy };
        heart!.style.transform = `translate(${x}px, ${y}px)`;

        if (bounced) {
          hueRef.current = (hueRef.current + COLOR_WHEEL_STEP) % 360;
          setHue(hueRef.current);
          setTongueOut(true);
          clearTimeout(tongueTimeout.current);
          tongueTimeout.current = setTimeout(() => setTongueOut(false), 450);
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(tongueTimeout.current); };
  }, [size]);

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div ref={heartRef} style={{ position: "absolute", width: size, height: size, willChange: "transform" }}>
        <DVDHeart size={size} color={`hsl(${hue}, 85%, 62%)`} tongueOut={tongueOut} />
      </div>
    </div>
  );
}

export default function BetaGate({ children }: { children: React.ReactNode }) {
  const [bypass, setBypass] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ?beta_preview=1 lets you (or a tester) see the real app regardless of
    // the date, e.g. to check things before launch day. Sticks for the
    // browser session once used.
    const params = new URLSearchParams(window.location.search);
    if (params.get("beta_preview") === "1") sessionStorage.setItem("beta_preview", "1");
    setBypass(sessionStorage.getItem("beta_preview") === "1");
    setReady(true);
  }, []);

  if (!ready) return null;
  if (bypass) return <>{children}</>;

  const status = getBetaStatus();

  if (status === "before") {
    return (
      <div className="relative flex flex-col min-h-[90vh]">
        <BouncingHeart size={150} />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
          <div style={{ height: 150 }} />
          <img src="/pm-logo.png" alt="Perfect Match" className="w-60 mt-6 mb-2" />
          <p className="text-cyan text-xs font-mono tracking-widest mb-4">BETA OPENS {formatBetaDate(BETA_START_DATE).toUpperCase()}</p>
          <p className="text-muted text-sm max-w-xs leading-relaxed">
            We&apos;re almost ready. Check back {formatBetaDate(BETA_START_DATE)} to join.
          </p>
        </div>
      </div>
    );
  }

  if (status === "ended") {
    return (
      <div className="relative flex flex-col min-h-[90vh]">
        <BouncingHeart size={150} />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
          <div style={{ height: 150 }} />
          <img src="/pm-logo.png" alt="Perfect Match" className="w-60 mt-6 mb-2" />
          <p className="text-muted text-xs font-mono tracking-widest mb-4">BETA CLOSED {formatBetaDate(BETA_END_DATE).toUpperCase()}</p>
          <p className="text-muted text-sm max-w-xs leading-relaxed">
            Thanks for being part of the beta. This round has wrapped up.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
