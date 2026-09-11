"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { Rajdhani, Manrope, JetBrains_Mono } from "next/font/google";
import { ArrowRight, ChevronLeft, ChevronRight, Lock, Play } from "lucide-react";
import ReportIssueButton from "@/components/ReportIssueButton";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useLazyScroll } from "@/hooks/useLazyScroll";
import { GAMES } from "@/data/games";
import styles from "./mission-board.module.css";

// Scoped to this page only (see mission-board.module.css) — deliberately not
// the app-wide JetBrains Mono/Share Tech Mono pairing from layout.tsx, since
// this screen's whole point is to look like a different, non-cyberpunk
// product next to the game pages it links out to.
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-rajdhani" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope" });
const jbMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-jbmono" });

const AUTO_ADVANCE_MS = 5000;
const LIVE_COUNT = GAMES.filter((g) => g.status === "live").length;
const DEV_COUNT = GAMES.filter((g) => g.status === "locked").length;

function tileStyle(color: string): CSSProperties {
  return { "--tile-color": color } as CSSProperties;
}

/** Counts up from 0 to `target` once on mount; jumps straight there under reduced motion. */
function useCountUp(target: number, reduced: boolean): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return; // rendered value below just uses `target` directly, no animation
    let raf = 0;
    const start = performance.now();
    const duration = 700;
    function step(ts: number) {
      const p = Math.min(1, (ts - start) / duration);
      setValue(Math.round(p * target));
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);
  return reduced ? target : value;
}

export default function LandingPage() {
  const reduced = useReducedMotion();
  useLazyScroll(reduced);
  const liveCount = useCountUp(LIVE_COUNT, reduced);
  const devCount = useCountUp(DEV_COUNT, reduced);

  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = GAMES.length;

  function goTo(i: number) {
    setIndex(((i % count) + count) % count);
  }
  function next() {
    setIndex((i) => (i + 1) % count);
  }
  function prev() {
    setIndex((i) => (i - 1 + count) % count);
  }
  function restart() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = reduced ? null : setInterval(next, AUTO_ADVANCE_MS);
  }

  useEffect(() => {
    restart();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // Cursor-follow tilt on the Games grid tiles, applied directly to the DOM
  // node (not React state) so it tracks the mouse with zero re-render lag.
  // The spring-easing settle back to neutral comes from the CSS transition
  // on .gameCard once we hand the inline transition back to it here.
  function handleTiltMove(e: ReactMouseEvent<HTMLElement>) {
    if (reduced) return;
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.style.transition = "box-shadow .2s ease, border-color .2s ease";
    card.style.transform = `perspective(1200px) rotateX(${(py - 0.5) * -7}deg) rotateY(${(px - 0.5) * 9}deg) translateY(-4px) scale(1.015)`;
  }
  function handleTiltLeave(e: ReactMouseEvent<HTMLElement>) {
    e.currentTarget.style.transition = "";
    e.currentTarget.style.transform = "";
  }

  return (
    <main className={`${styles.page} ${rajdhani.variable} ${manrope.variable} ${jbMono.variable}`}>
      {/* Real glass distortion, not just blur — bends whatever's behind the
          WHOLE panel via feTurbulence + feDisplacementMap (see --glass-blur
          in mission-board.module.css), and the bend intensity itself
          breathes over time via the <animate> below so it reads as a living
          surface, not one frozen warp. Animating scale (not baseFrequency)
          keeps this cheap — the noise field itself is generated once and
          never recomputed, only its strength changes. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="mission-board-glass" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={2} seed={7} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={45} xChannelSelector="R" yChannelSelector="G">
            {!reduced && <animate attributeName="scale" values="28;52;28" dur="9s" repeatCount="indefinite" />}
          </feDisplacementMap>
        </filter>
      </svg>

      <div className={styles.fx} aria-hidden="true">
        <div className={`${styles.blob} ${styles.b1}`} />
        <div className={`${styles.blob} ${styles.b2}`} />
        <div className={`${styles.blob} ${styles.b3}`} />
        <div className={styles.stars} />
      </div>

      <div className={styles.wrap}>
        <div className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>IO</span>
            <span className={styles.brandWord}>Internal Ops</span>
          </div>
        </div>

        <section className={styles.intro}>
          <div>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Mission Select
            </span>
            <h1 className={styles.h1}>
              Pick your <span className={styles.h1Accent}>next game.</span>
            </h1>
            <p className={styles.lede}>
              Grab a squad, pick a game, and the clock starts the second you&apos;re in. One operation is live right
              now — the rest are still cooking backstage.
            </p>
          </div>
          <div className={styles.hud}>
            <div className={`${styles.hudCell} ${styles.hudLive}`}>
              <span className={styles.hudNum}>{liveCount}</span>
              <span className={styles.hudLabel}>Live</span>
            </div>
            <div className={`${styles.hudCell} ${styles.hudDev}`}>
              <span className={styles.hudNum}>{devCount}</span>
              <span className={styles.hudLabel}>In dev</span>
            </div>
          </div>
        </section>

        <div className={styles.sectionLabel}>
          <span>Now Playing</span>
          <div className={styles.sectionLine} />
        </div>

        <div
          className={styles.carousel}
          onMouseEnter={() => {
            if (timerRef.current) clearInterval(timerRef.current);
          }}
          onMouseLeave={restart}
        >
          <div
            className={styles.carouselTrack}
            style={{ width: `${count * 100}%`, transform: `translateX(-${index * (100 / count)}%)` }}
          >
            {GAMES.map((game) => (
              <div key={game.id} className={styles.slide} style={{ width: `${100 / count}%`, ...tileStyle(game.tileColor) }}>
                <div>
                  <span className={styles.statusPill}>
                    <span className={styles.statusDot} />
                    {game.status === "live"
                      ? "Live now"
                      : game.redacted
                        ? "Clearance required"
                        : `In development — ${game.progress}%`}
                  </span>
                  <h2 className={styles.slideTitle}>
                    {game.redacted ? <span className={styles.redact}>{game.title}</span> : game.title}
                  </h2>
                  <div className={styles.chipRow}>
                    {game.meta.map((m) => (
                      <span key={m} className={styles.chip}>
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className={styles.slideDesc}>{game.description}</p>
                  {game.status === "live" && game.href ? (
                    <Link href={game.href} className={styles.playBtn}>
                      Play now
                      <ArrowRight />
                    </Link>
                  ) : (
                    <span className={styles.lockedCta}>{game.redacted ? "Access denied" : "Briefing not yet released"}</span>
                  )}
                </div>
                <div className={game.briefing ? styles.sidePanel : `${styles.sidePanel} ${styles.sideProgress}`}>
                  {game.briefing ? (
                    <>
                      <span className={styles.sidePanelLabel}>How a run starts</span>
                      <ol>
                        {game.briefing.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <>
                      <div className={styles.sideProgressRow}>
                        <span>Build status</span>
                        <b>{game.progress ? `${game.progress}%` : "—"}</b>
                      </div>
                      <div className={styles.bar}>
                        <span className={styles.barFill} style={{ width: `${game.progress ?? 0}%` }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.carControls}>
          <button
            className={styles.carArrow}
            type="button"
            aria-label="Previous game"
            onClick={() => {
              prev();
              restart();
            }}
          >
            <ChevronLeft />
          </button>
          <div className={styles.carDots}>
            {GAMES.map((game, i) => (
              <button
                key={game.id}
                type="button"
                className={i === index ? `${styles.carDot} ${styles.carDotActive}` : styles.carDot}
                aria-label={`Go to ${game.title}`}
                aria-current={i === index}
                onClick={() => {
                  goTo(i);
                  restart();
                }}
              />
            ))}
          </div>
          <button
            className={styles.carArrow}
            type="button"
            aria-label="Next game"
            onClick={() => {
              next();
              restart();
            }}
          >
            <ChevronRight />
          </button>
        </div>

        <div className={styles.sectionLabel}>
          <span>Games</span>
          <div className={styles.sectionLine} />
        </div>

        <div className={`${styles.gamesGrid} ${styles.tiltZone}`}>
          {GAMES.map((game) =>
            game.status === "live" && game.href ? (
              <Link
                key={game.id}
                href={game.href}
                className={`${styles.gameCard} ${styles.gamePlayable}`}
                style={tileStyle(game.tileColor)}
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardIcon}>
                    <Play fill="currentColor" />
                  </span>
                  <span className={styles.cardStatus}>Live</span>
                </div>
                <h3 className={styles.gameTitle}>{game.title}</h3>
                <p className={styles.gameDesc}>{game.cardDescription}</p>
                <span className={styles.cardCta}>
                  Play now <ArrowRight />
                </span>
              </Link>
            ) : (
              <div
                key={game.id}
                className={`${styles.gameCard} ${styles.gameLocked}`}
                style={tileStyle(game.tileColor)}
                onMouseMove={handleTiltMove}
                onMouseLeave={handleTiltLeave}
              >
                <div className={styles.cardTop}>
                  <span className={styles.cardIcon}>
                    <Lock />
                  </span>
                  <span className={styles.cardStatus}>{game.progress ? `${game.progress}%` : "—"}</span>
                </div>
                <h3 className={styles.gameTitle}>
                  {game.redacted ? <span className={styles.redact}>{game.title}</span> : game.title}
                </h3>
                <p className={styles.gameDesc}>{game.cardDescription}</p>
                <div className={styles.cardBar}>
                  <span className={styles.cardBarFill} style={{ width: `${game.progress ?? 0}%` }} />
                </div>
              </div>
            )
          )}
        </div>

        <footer className={styles.footer}>
          <span>New operations come online as they clear testing.</span>
          <span>Internal use only.</span>
        </footer>
      </div>

      <ReportIssueButton />
    </main>
  );
}
