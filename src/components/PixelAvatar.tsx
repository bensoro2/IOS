import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAllSubCategories } from "@/constants/activityCategories";

// Build activity map from activityCategories
const allSubs = getAllSubCategories();
const AVATAR_ACTIVITIES: Record<string, { label: string; emoji: string }> = {};
allSubs.forEach((sub) => {
  AVATAR_ACTIVITIES[sub.id] = { label: sub.name, emoji: sub.emoji };
});

const getBodyColor = (activity: string): string => {
  const colors: Record<string, string> = {
    basketball: "#e67e22", football: "#2ecc71", running: "#3498db",
    swimming: "#1abc9c", cycling: "#9b59b6", fitness: "#e74c3c",
    yoga: "#f39c12", guitar: "#8e44ad", dancing: "#e91e63",
    camping: "#795548", cooking: "#ff9800",
    badminton: "#4caf50", singing: "#ff5722",
    golf: "#2ecc71", tennis: "#e74c3c", climbing: "#795548",
    "martial-arts": "#c0392b", chess: "#34495e", piano: "#9b59b6",
    "bass-drums": "#e67e22", "music-production": "#3498db",
    hiking: "#27ae60", "mountain-climbing": "#5d4037", diving: "#0097a7",
    photography: "#607d8b", reading: "#8e44ad", meditation: "#f39c12",
    "merit-making": "#e67e22",
  };
  return colors[activity] || "#3498db";
};

const SKIN = "#f5cba7";
const HAIR = "#2c3e50";
const SHOE = "#2c3e50";

/**
 * Each activity renders a FULL character (head, body, arms, legs)
 * in a pose that matches the activity, animated across 4 frames (f=0,1,2,3).
 * viewBox is 16x16.
 */
const renderActivityFrame = (activity: string, f: number, rawFrame: number): JSX.Element => {
  const body = getBodyColor(activity);

  // Helper: standard head at position
  const head = (x: number, y: number) => (
    <>
      <rect x={x} y={y} width="4" height="3" fill={SKIN} rx="0.5" />
      <rect x={x + 0.5} y={y + 1} width="1" height="0.8" fill="#1a1a2e" />
      <rect x={x + 2.5} y={y + 1} width="1" height="0.8" fill="#1a1a2e" />
      <rect x={x} y={y - 0.5} width="4" height="1.2" fill={HAIR} rx="0.3" />
    </>
  );

  switch (activity) {
    // ==================== SPORTS ====================

    case "basketball": {
      // 16-frame cycle: 0-5 dribble, 6 wind up, 7-13 ball flies (rendered outside SVG), 14-15 score
      const f16 = rawFrame % 16;
      const isDribble = f16 <= 5;
      const isWindUp = f16 === 6;

      const ballBounceY = f16 % 2 === 0 ? 9 : 12;
      const dribbleHandY = f16 % 2 === 0 ? 6.5 : 8;

      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          <rect x="4" y="5" width="2" height="1" fill={SKIN} />
          <rect x="10" y={isDribble ? dribbleHandY : isWindUp ? 5 : 3} width="2" height="1" fill={SKIN} />
          <rect x="6" y="8" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="8" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          {/* Basketball - only during dribble & wind up */}
          {isDribble && (
            <>
              <circle cx="11.5" cy={ballBounceY} r="1.3" fill="#f39c12" />
              <line x1="10.2" y1={ballBounceY} x2="12.8" y2={ballBounceY} stroke="#e67e22" strokeWidth="0.25" />
            </>
          )}
          {isWindUp && (
            <circle cx="11" cy="4.5" r="1.2" fill="#f39c12" />
          )}
        </>
      );
    }

    case "football": {
      // Kicking a ball: one leg swings
      const kickLegAngle = [0, 1, 2, 1][f];
      const ballX = f === 2 ? 13 : f === 3 ? 14 : 10;
      const ballY = f === 2 ? 11 : f === 3 ? 10 : 12.5;
      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          <rect x="4" y="5" width="2" height="1" fill={SKIN} />
          <rect x="10" y="5" width="2" height="1" fill={SKIN} />
          {/* Standing leg */}
          <rect x="6" y="8" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          {/* Kicking leg */}
          <rect x={8 + kickLegAngle} y={8 + (kickLegAngle > 0 ? -1 : 0)} width="2" height={4 - kickLegAngle} fill={SKIN} />
          <rect x={8 + kickLegAngle} y={11 - kickLegAngle} width="2.5" height="1" fill={SHOE} rx="0.3" />
          {/* Ball */}
          <circle cx={ballX} cy={ballY} r="1.3" fill="#ecf0f1" />
          <path d={`M${ballX - 0.5},${ballY - 0.5} L${ballX + 0.5},${ballY + 0.5}`} stroke="#2c3e50" strokeWidth="0.3" />
        </>
      );
    }

    case "running": {
      // Running with arms and legs alternating
      const legOffset = [0, 2, 0, -2][f];
      const armOffset = [-1, 1, 1, -1][f];
      return (
        <>
          {head(6, 0.5 + (f % 2 === 0 ? 0 : -0.3))}
          <rect x="6" y="3.5" width="4" height="4" fill={body} rx="0.3" />
          {/* Arms swinging */}
          <rect x={3 + armOffset} y="4.5" width="3" height="1" fill={SKIN} />
          <rect x={10 - armOffset} y="4.5" width="3" height="1" fill={SKIN} />
          {/* Left leg */}
          <rect x={5 + legOffset * 0.5} y="7.5" width="2" height="4" fill={SKIN} />
          <rect x={4.5 + legOffset * 0.5} y="11.5" width="3" height="1" fill={SHOE} rx="0.3" />
          {/* Right leg */}
          <rect x={9 - legOffset * 0.5} y="7.5" width="2" height="4" fill={SKIN} />
          <rect x={8.5 - legOffset * 0.5} y="11.5" width="3" height="1" fill={SHOE} rx="0.3" />
          {/* Speed lines */}
          {f % 2 === 0 && <line x1="1" y1="5" x2="3" y2="5" stroke="#bdc3c7" strokeWidth="0.3" opacity="0.5" />}
          {f % 2 !== 0 && <line x1="0" y1="7" x2="2.5" y2="7" stroke="#bdc3c7" strokeWidth="0.3" opacity="0.5" />}
        </>
      );
    }

    case "swimming": {
      // Swimming: body horizontal, arms rotating, water below
      const armPhase = f % 4;
      const bodyY = 6 + (f % 2 === 0 ? 0 : 0.5);
      return (
        <>
          {/* Water - full width */}
          <rect x="-50" y="9" width="116" height="7" fill="#3498db" opacity="0.35" />
          <rect x="-50" y="9" width="116" height="2" fill="#2980b9" opacity="0.15" />
          <rect x={f * 2} y="9" width="3" height="0.5" fill="#ecf0f1" opacity="0.3" />
          <rect x={f * 3 + 5} y="9.5" width="2" height="0.5" fill="#ecf0f1" opacity="0.2" />
          <rect x={f * 2 - 8} y="9.3" width="2.5" height="0.4" fill="#ecf0f1" opacity="0.25" />
          <rect x={f * 4 + 10} y="9.2" width="2" height="0.4" fill="#ecf0f1" opacity="0.2" />
          {/* Body horizontal */}
          <rect x="4" y={bodyY + 1} width="8" height="3" fill={body} rx="0.3" />
          {/* Head */}
          <rect x="11" y={bodyY - 1} width="3" height="2.5" fill={SKIN} rx="0.5" />
          <rect x="12.5" y={bodyY - 0.3} width="0.7" height="0.5" fill="#1a1a2e" />
          <rect x="11" y={bodyY - 1.3} width="3" height="1" fill={HAIR} rx="0.3" />
          {/* Arms - crawl stroke */}
          {armPhase < 2 ? (
            <rect x="12" y={bodyY - 2} width="1" height="2.5" fill={SKIN} />
          ) : (
            <rect x="13" y={bodyY + 1} width="2" height="1" fill={SKIN} />
          )}
          {armPhase >= 2 ? (
            <rect x="4" y={bodyY - 1} width="1" height="2" fill={SKIN} />
          ) : (
            <rect x="3" y={bodyY + 2} width="2" height="1" fill={SKIN} />
          )}
          {/* Legs - flutter kick */}
          <rect x="2" y={bodyY + (f % 2 === 0 ? 1 : 2.5)} width="3" height="1" fill={SKIN} />
          <rect x="2" y={bodyY + (f % 2 === 0 ? 2.5 : 1)} width="3" height="1" fill={SKIN} />
          {/* Splash */}
          {f % 2 === 0 && <circle cx="2" cy="9" r="0.5" fill="#ecf0f1" opacity="0.5" />}
        </>
      );
    }

    case "cycling": {
      // Sitting on bike, legs pedaling
      const pedalAngle = f % 4;
      const leftPedalY = pedalAngle < 2 ? 10 : 12;
      const rightPedalY = pedalAngle < 2 ? 12 : 10;
      return (
        <>
          {/* Wheels */}
          <circle cx="3.5" cy="12" r="2.5" fill="none" stroke="#7f8c8d" strokeWidth="0.6" />
          <circle cx="12.5" cy="12" r="2.5" fill="none" stroke="#7f8c8d" strokeWidth="0.6" />
          <circle cx="3.5" cy="12" r="0.5" fill="#7f8c8d" />
          <circle cx="12.5" cy="12" r="0.5" fill="#7f8c8d" />
          {/* Frame */}
          <line x1="3.5" y1="12" x2="8" y2="9" stroke="#e74c3c" strokeWidth="0.5" />
          <line x1="12.5" y1="12" x2="8" y2="9" stroke="#e74c3c" strokeWidth="0.5" />
          <line x1="8" y1="9" x2="10" y2="6" stroke="#e74c3c" strokeWidth="0.5" />
          <line x1="12.5" y1="12" x2="10" y2="6" stroke="#e74c3c" strokeWidth="0.5" />
          {/* Handlebars */}
          <rect x="9" y="5.5" width="3" height="0.5" fill="#7f8c8d" />
          {/* Body sitting */}
          <rect x="6" y="3" width="3" height="3" fill={body} rx="0.3" />
          {head(5.5, 0)}
          {/* Arms reaching to handlebar */}
          <rect x="9" y="4" width="2" height="1" fill={SKIN} />
          {/* Legs pedaling */}
          <rect x="6" y="6" width="1.5" height={leftPedalY - 6} fill={SKIN} />
          <rect x="8" y="6" width="1.5" height={rightPedalY - 6} fill={SKIN} />
          <rect x="5.5" y={leftPedalY} width="2" height="0.8" fill={SHOE} rx="0.2" />
          <rect x="7.5" y={rightPedalY} width="2" height="0.8" fill={SHOE} rx="0.2" />
        </>
      );
    }

    case "badminton": {
      // Rendered via badminton overlay
      return <></>;
    }

    case "tennis": {
      // Forehand/backhand swing
      const swingPhase = f % 4;
      const racketX = [13, 14, 12, 11][swingPhase];
      const racketY = [4, 3, 5, 6][swingPhase];
      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          <rect x="4" y="5" width="2" height="1" fill={SKIN} />
          {/* Racket arm */}
          <rect x="10" y={racketY - 1} width="2" height="1" fill={SKIN} />
          {/* Racket */}
          <line x1="11.5" y1={racketY - 1} x2={racketX} y2={racketY - 2} stroke="#8B4513" strokeWidth="0.5" />
          <ellipse cx={racketX + 0.5} cy={racketY - 3} rx="1" ry="1.5" fill="none" stroke="#27ae60" strokeWidth="0.5" />
          {/* Ball */}
          {swingPhase < 2 && <circle cx={14} cy={2} r="0.8" fill="#c8e600" />}
          {swingPhase >= 2 && <circle cx={2} cy={3} r="0.8" fill="#c8e600" />}
          {/* Legs - slight lunge */}
          <rect x={5 + (swingPhase % 2)} y="8" width="2" height="4" fill={SKIN} />
          <rect x="9" y="8" width="2" height="4" fill={SKIN} />
          <rect x={4.5 + (swingPhase % 2)} y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
        </>
      );
    }

    case "golf": {
      // Stationary golfer, swings club, ball flies toward flag
      // Use rawFrame for 16-frame cycle like basketball
      const f16 = rawFrame % 16;
      // Phases: 0-3 address, 4-5 backswing, 6 downswing, 7 impact, 8-15 follow through + ball flies
      const isAddress = f16 <= 3;
      const isBackswing = f16 === 4 || f16 === 5;
      const isDownswing = f16 === 6;
      const isImpact = f16 === 7;

      // Club angle based on phase
      let clubEndX: number, clubEndY: number;
      if (isAddress) { clubEndX = 11; clubEndY = 11; }
      else if (isBackswing) { clubEndX = f16 === 4 ? 4 : 2; clubEndY = f16 === 4 ? 3 : 1; }
      else if (isDownswing) { clubEndX = 8; clubEndY = 8; }
      else if (isImpact) { clubEndX = 12; clubEndY = 11; }
      else { clubEndX = 14; clubEndY = 3; } // follow through up

      // Arms follow club
      const armRY = isBackswing ? 3 : isDownswing ? 5 : 5;
      const armLY = isBackswing ? 4 : 5;

      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          {/* Arms */}
          <rect x="4" y={armLY} width="2" height="1" fill={SKIN} />
          <rect x="10" y={armRY} width="2" height="1" fill={SKIN} />
          {/* Club - connected from hands */}
          <line x1="8" y1="5.5" x2={clubEndX} y2={clubEndY} stroke="#8B4513" strokeWidth="0.6" />
          <rect x={clubEndX - 0.5} y={clubEndY - 0.5} width="1.5" height="1" fill="#7f8c8d" rx="0.2" />
          {/* Ball on ground (before impact) */}
          {f16 <= 7 && <circle cx="11" cy="12.5" r="0.6" fill="#ecf0f1" />}
          {/* Legs */}
          <rect x="6" y="8" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="8" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          {/* Green ground */}
          <rect x="0" y="13" width="16" height="0.5" fill="#27ae60" opacity="0.3" />
        </>
      );
    }

    case "fitness": {
      // Lifting barbell overhead
      const liftPhase = f % 4;
      const barbellY = [6, 3, 1, 3][liftPhase];
      const armEndY = [6, 3, 1, 3][liftPhase];
      const bodySquat = liftPhase === 0 ? 1 : 0;
      return (
        <>
          {head(6, 0.5 + bodySquat)}
          <rect x="6" y={3.5 + bodySquat} width="4" height="4" fill={body} rx="0.3" />
          {/* Arms going up with barbell */}
          <rect x="4" y={armEndY + bodySquat} width="2" height="1" fill={SKIN} />
          <rect x="10" y={armEndY + bodySquat} width="2" height="1" fill={SKIN} />
          {/* Barbell */}
          <rect x="2" y={barbellY + bodySquat - 0.3} width="12" height="0.6" fill="#bdc3c7" />
          <rect x="1" y={barbellY + bodySquat - 1} width="2" height="2" rx="0.3" fill="#e74c3c" />
          <rect x="13" y={barbellY + bodySquat - 1} width="2" height="2" rx="0.3" fill="#e74c3c" />
          {/* Legs - slight squat */}
          <rect x="6" y={7.5 + bodySquat} width="2" height={4 - bodySquat} fill={SKIN} />
          <rect x="8.5" y={7.5 + bodySquat} width="2" height={4 - bodySquat} fill={SKIN} />
          <rect x="5.5" y="11.5" width="2.5" height="1.5" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="11.5" width="2.5" height="1.5" fill={SHOE} rx="0.3" />
        </>
      );
    }

    case "yoga":
    case "meditation": {
      // Sitting cross-legged, arms up in meditation, aura glow
      const breathe = f % 2 === 0 ? 0 : 0.3;
      const auraR = 5 + (f % 3) * 0.5;
      return (
        <>
          {/* Aura glow */}
          <circle cx="8" cy="7" r={auraR} fill="#f1c40f" opacity={0.08 + (f % 2) * 0.04} />
          {head(6, 1 - breathe)}
          <rect x="6" y={4 - breathe} width="4" height="4" fill={body} rx="0.3" />
          {/* Arms up in namaste / meditation */}
          {activity === "yoga" ? (
            <>
              <rect x="3" y={2 - breathe} width="3" height="1" fill={SKIN} />
              <rect x="10" y={2 - breathe} width="3" height="1" fill={SKIN} />
            </>
          ) : (
            <>
              <rect x="4" y={5 - breathe} width="2" height="1" fill={SKIN} />
              <rect x="10" y={5 - breathe} width="2" height="1" fill={SKIN} />
            </>
          )}
          {/* Crossed legs */}
          <rect x="4" y="8" width="4" height="2" fill={SKIN} />
          <rect x="8" y="8" width="4" height="2" fill={SKIN} />
          <rect x="3" y="9" width="2" height="1.5" fill={SHOE} rx="0.3" />
          <rect x="11" y="9" width="2" height="1.5" fill={SHOE} rx="0.3" />
          {/* Sparkles */}
          {f === 0 && <circle cx="2" cy="2" r="0.4" fill="#f1c40f" opacity="0.6" />}
          {f === 2 && <circle cx="14" cy="1" r="0.4" fill="#f1c40f" opacity="0.6" />}
        </>
      );
    }

    case "climbing": {
      // Rendered via climbing overlay, return empty
      return <></>;
    }

    case "martial-arts": {
      // Punching combo: left-right alternating
      const phase = f % 4;
      const leftPunchX = [4, 2, 4, 4][phase]; // left jab
      const rightPunchX = [10, 10, 12, 10][phase]; // right cross
      const leftPunchY = [5, 4.5, 5, 5][phase];
      const rightPunchY = [5, 5, 4.5, 5][phase];
      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          {/* Arms punching */}
          <rect x={leftPunchX} y={leftPunchY} width={6 - leftPunchX} height="1" fill={SKIN} />
          <rect x="10" y={rightPunchY} width={rightPunchX - 10 + 2} height="1" fill={SKIN} />
          {/* Boxing gloves */}
          <rect x={leftPunchX - 1} y={leftPunchY - 0.3} width="1.5" height="1.5" rx="0.5" fill="#e74c3c" />
          <rect x={rightPunchX + 1} y={rightPunchY - 0.3} width="1.5" height="1.5" rx="0.5" fill="#e74c3c" />
          {/* Impact effect */}
          {phase === 1 && <text x="0" y="5" fontSize="2" fill="#f39c12" opacity="0.7">💥</text>}
          {phase === 2 && <text x="14" y="5" fontSize="2" fill="#f39c12" opacity="0.7">💥</text>}
          {/* Legs in stance */}
          <rect x="5" y="8" width="2" height="4" fill={SKIN} />
          <rect x="9" y="8" width="2" height="4" fill={SKIN} />
          <rect x="4" y="12" width="3" height="1" fill={SHOE} rx="0.3" />
          <rect x="9" y="12" width="3" height="1" fill={SHOE} rx="0.3" />
        </>
      );
    }

    case "chess": {
      // Sitting at table, moving piece, thinking
      const thinkingHand = f % 2 === 0;
      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="3.5" fill={body} rx="0.3" />
          {/* Table */}
          <rect x="0" y="7.5" width="16" height="0.5" fill="#8B4513" />
          <rect x="1" y="8" width="1" height="5" fill="#8B4513" />
          <rect x="14" y="8" width="1" height="5" fill="#8B4513" />
          {/* Chessboard on table */}
          <rect x="2" y="6" width="5" height="1.5" fill="#d4ac0d" opacity="0.4" />
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={2 + i} y={i % 2 === 0 ? 6 : 6.75} width="1" height="0.75" fill="#2c3e50" opacity="0.5" />
          ))}
          {/* Arms on table */}
          <rect x="4" y={thinkingHand ? 5 : 6} width="2" height="1.5" fill={SKIN} />
          <rect x="10" y="6" width="2" height="1.5" fill={SKIN} />
          {/* Chess piece in hand */}
          {thinkingHand && <rect x="3.5" y="4" width="1" height="1.5" fill="#2c3e50" />}
          {/* Legs under table */}
          <rect x="6" y="7.5" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="7.5" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="11.5" width="2.5" height="1.5" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="11.5" width="2.5" height="1.5" fill={SHOE} rx="0.3" />
        </>
      );
    }

    // ==================== ARTS & MUSIC ====================

    case "dancing": {
      // Disco dance: arms and legs change position each frame
      const poses = [
        { la: { x: 2, y: 2 }, ra: { x: 12, y: 5 }, ll: { x: 5, y: 8 }, rl: { x: 10, y: 8 } },
        { la: { x: 3, y: 5 }, ra: { x: 13, y: 2 }, ll: { x: 6, y: 8 }, rl: { x: 9, y: 8 } },
        { la: { x: 1, y: 3 }, ra: { x: 13, y: 3 }, ll: { x: 4, y: 8 }, rl: { x: 11, y: 8 } },
        { la: { x: 3, y: 5 }, ra: { x: 12, y: 2 }, ll: { x: 7, y: 8 }, rl: { x: 8, y: 8 } },
      ];
      const p = poses[f];
      return (
        <>
          {/* Disco sparkles */}
          {f === 0 && <circle cx="1" cy="1" r="0.5" fill="#f1c40f" opacity="0.7" />}
          {f === 1 && <circle cx="14" cy="2" r="0.5" fill="#e91e63" opacity="0.7" />}
          {f === 2 && <circle cx="3" cy="0" r="0.4" fill="#3498db" opacity="0.7" />}
          {f === 3 && <circle cx="13" cy="1" r="0.4" fill="#2ecc71" opacity="0.7" />}
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          {/* Arms */}
          <rect x={p.la.x} y={p.la.y} width={6 - p.la.x} height="1" fill={SKIN} />
          <rect x="10" y={p.ra.y} width={p.ra.x - 10 + 2} height="1" fill={SKIN} />
          {/* Legs */}
          <rect x={p.ll.x} y={p.ll.y} width="2" height="4" fill={SKIN} />
          <rect x={p.rl.x} y={p.rl.y} width="2" height="4" fill={SKIN} />
          <rect x={p.ll.x - 0.5} y="12" width="2.5" height="1" fill="#e91e63" rx="0.3" />
          <rect x={p.rl.x - 0.5} y="12" width="2.5" height="1" fill="#e91e63" rx="0.3" />
        </>
      );
    }

    case "guitar": {
      // Strumming guitar
      const strumY = f % 2 === 0 ? 6 : 7;
      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          {/* Guitar body */}
          <ellipse cx="5" cy="7.5" rx="2.5" ry="2" fill="#8B4513" />
          <ellipse cx="5" cy="7.5" rx="0.8" ry="0.6" fill="#1a1a2e" />
          {/* Guitar neck */}
          <rect x="0" y="4" width="5" height="1" fill="#D2691E" rx="0.2" />
          <rect x="-0.5" y="3.5" width="1.5" height="2" fill="#D2691E" rx="0.3" />
          {/* Left arm on neck */}
          <rect x="2" y="4.5" width="4" height="1" fill={SKIN} />
          {/* Right arm strumming */}
          <rect x="6" y={strumY} width="2" height="1" fill={SKIN} />
          {/* Music notes */}
          {f === 0 && <text x="12" y="3" fontSize="2.5" fill="#8e44ad">♪</text>}
          {f === 2 && <text x="13" y="2" fontSize="2" fill="#8e44ad">♫</text>}
          {/* Legs */}
          <rect x="6" y="8" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="8" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
        </>
      );
    }

    case "piano": {
      // Sitting at piano, fingers moving
      const fingerL = f % 2 === 0 ? 3 : 4;
      const fingerR = f % 2 === 0 ? 9 : 8;
      return (
        <>
          {head(6, 0.5)}
          <rect x="6" y="3.5" width="4" height="3.5" fill={body} rx="0.3" />
          {/* Piano */}
          <rect x="1" y="7" width="14" height="2.5" fill="#2c3e50" rx="0.3" />
          {/* White keys */}
          {[1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5].map((x, i) => (
            <rect key={i} x={x} y="7.2" width="1.2" height="2" fill="#ecf0f1" rx="0.1" />
          ))}
          {/* Black keys */}
          {[2.5, 4, 7, 8.5, 11.5].map((x, i) => (
            <rect key={i} x={x} y="7.2" width="0.8" height="1.2" fill="#1a1a2e" rx="0.1" />
          ))}
          {/* Fingers */}
          <rect x={fingerL} y="6.5" width="2" height="1" fill={SKIN} />
          <rect x={fingerR} y="6.5" width="2" height="1" fill={SKIN} />
          {/* Pressed key highlight */}
          <rect x={fingerL + 0.5} y="7.2" width="1" height="2" fill="#d5dbdb" rx="0.1" />
          {/* Music notes */}
          {f % 2 === 0 && <text x="13" y="3" fontSize="2" fill="#9b59b6">♪</text>}
          {/* Legs */}
          <rect x="6" y="9.5" width="2" height="3" fill={SKIN} />
          <rect x="8.5" y="9.5" width="2" height="3" fill={SKIN} />
          <rect x="5.5" y="12.5" width="2.5" height="0.5" fill={SHOE} rx="0.2" />
          <rect x="8.5" y="12.5" width="2.5" height="0.5" fill={SHOE} rx="0.2" />
        </>
      );
    }

    case "bass-drums": {
      // Hitting drum with sticks
      const leftStickY = [3, 5, 3, 4][f];
      const rightStickY = [4, 3, 5, 3][f];
      return (
        <>
          {head(6, 0.5)}
          <rect x="6" y="3.5" width="4" height="4" fill={body} rx="0.3" />
          {/* Drum */}
          <ellipse cx="8" cy="10" rx="4" ry="1.5" fill="#e74c3c" />
          <rect x="4" y="10" width="8" height="3" fill="#c0392b" />
          <ellipse cx="8" cy="13" rx="4" ry="1.5" fill="#e74c3c" />
          {/* Drum skin */}
          <ellipse cx="8" cy="10" rx="3.5" ry="1" fill="#f5cba7" opacity="0.3" />
          {/* Arms with sticks */}
          <rect x="3" y={leftStickY + 1} width="3" height="0.8" fill={SKIN} />
          <rect x="10" y={rightStickY + 1} width="3" height="0.8" fill={SKIN} />
          {/* Sticks */}
          <line x1="3" y1={leftStickY + 1.5} x2="6" y2={leftStickY === 5 ? 10 : 8} stroke="#D2B48C" strokeWidth="0.4" />
          <line x1="13" y1={rightStickY + 1.5} x2="10" y2={rightStickY === 5 ? 10 : 8} stroke="#D2B48C" strokeWidth="0.4" />
          {/* Hit effect */}
          {leftStickY === 5 && <circle cx="6" cy="9.5" r="0.5" fill="#f1c40f" opacity="0.6" />}
          {rightStickY === 5 && <circle cx="10" cy="9.5" r="0.5" fill="#f1c40f" opacity="0.6" />}
        </>
      );
    }

    case "singing": {
      // Holding microphone, mouth open, music notes
      const mouthOpen = f % 2 === 0;
      return (
        <>
          {/* Head with open mouth */}
          <rect x="6" y="1" width="4" height="3" fill={SKIN} rx="0.5" />
          <rect x="6.5" y="1.8" width="1" height="0.8" fill="#1a1a2e" />
          <rect x="8.5" y="1.8" width="1" height="0.8" fill="#1a1a2e" />
          {/* Mouth - open when singing */}
          <ellipse cx="8" cy="3.2" rx={mouthOpen ? 0.8 : 0.5} ry={mouthOpen ? 0.6 : 0.3} fill="#e74c3c" />
          <rect x="6" y="0.5" width="4" height="1.2" fill={HAIR} rx="0.3" />
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          {/* Left arm */}
          <rect x="4" y="5" width="2" height="1" fill={SKIN} />
          {/* Right arm holding mic to mouth */}
          <rect x="10" y="3" width="1.5" height="1" fill={SKIN} />
          {/* Microphone */}
          <circle cx="11.8" cy="2.5" r="0.8" fill="#7f8c8d" />
          <rect x="11.3" y="2.5" width="1" height="1.5" fill="#7f8c8d" />
          {/* Music notes floating */}
          {f === 0 && <text x="13" y="2" fontSize="2" fill="#ff5722">♪</text>}
          {f === 1 && <text x="1" y="3" fontSize="2.5" fill="#ff5722">♫</text>}
          {f === 2 && <text x="14" y="1" fontSize="1.5" fill="#ff5722">♪</text>}
          {f === 3 && <text x="0" y="2" fontSize="2" fill="#ff5722">♬</text>}
          {/* Legs */}
          <rect x="6" y="8" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="8" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
        </>
      );
    }

    case "music-production": {
      // At laptop with headphones, tapping
      const tapFinger = f % 2 === 0 ? 4 : 5;
      return (
        <>
          {head(6, 0.5)}
          {/* Headphones */}
          <rect x="5.5" y="0" width="5" height="0.8" fill="#2c3e50" rx="0.3" />
          <rect x="5" y="0.5" width="1" height="2" fill="#2c3e50" />
          <rect x="10" y="0.5" width="1" height="2" fill="#2c3e50" />
          <rect x="6" y="3.5" width="4" height="4" fill={body} rx="0.3" />
          {/* Laptop */}
          <rect x="1" y="7" width="7" height="0.5" fill="#7f8c8d" />
          <rect x="1" y="4.5" width="7" height="2.5" fill="#2c3e50" rx="0.3" />
          <rect x="1.5" y="5" width="6" height="1.8" fill="#3498db" opacity="0.5" />
          {/* Waveform on screen */}
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={2 + i * 1.2} y={5.5 - (f + i) % 3 * 0.3} width="0.5" height={0.4 + (f + i) % 3 * 0.3} fill="#2ecc71" />
          ))}
          {/* Arms on laptop */}
          <rect x={tapFinger} y="6.5" width="2" height="1" fill={SKIN} />
          <rect x="10" y="6" width="2" height="1" fill={SKIN} />
          {/* Legs */}
          <rect x="6" y="7.5" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="7.5" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="11.5" width="2.5" height="1.5" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="11.5" width="2.5" height="1.5" fill={SHOE} rx="0.3" />
        </>
      );
    }

    // ==================== OUTDOOR ====================

    case "hiking": {
      // Walking with hiking stick
      const stepPhase = f % 2 === 0;
      return (
        <>
          {head(6, stepPhase ? 1 : 0.7)}
          <rect x="6" y={stepPhase ? 4 : 3.7} width="4" height="4" fill={body} rx="0.3" />
          {/* Backpack */}
          <rect x="10" y="4" width="2" height="3" fill="#e67e22" rx="0.3" />
          {/* Left arm with walking stick */}
          <rect x="4" y={stepPhase ? 5 : 4.5} width="2" height="1" fill={SKIN} />
          <line x1="4" y1={stepPhase ? 5.5 : 5} x2="3" y2="13" stroke="#8B4513" strokeWidth="0.5" />
          {/* Right arm */}
          <rect x="10" y={stepPhase ? 5.5 : 5} width="2" height="1" fill={SKIN} />
          {/* Legs walking */}
          <rect x={stepPhase ? 5 : 7} y="8" width="2" height="4" fill={SKIN} />
          <rect x={stepPhase ? 9 : 7} y="8" width="2" height="4" fill={SKIN} />
          <rect x={stepPhase ? 4.5 : 6.5} y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x={stepPhase ? 8.5 : 6.5} y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          {/* Hat */}
          <rect x="5" y="0.5" width="6" height="0.8" fill="#27ae60" rx="0.3" />
        </>
      );
    }

    case "camping": {
      // Sitting by campfire, tent behind
      const fireFlicker = f % 3;
      return (
        <>
          {/* Tent */}
          <polygon points="11,3 8,10 14,10" fill="#e74c3c" opacity="0.6" />
          <polygon points="11,3 10,10 12,10" fill="#c0392b" opacity="0.5" />
          {/* Stars */}
          <circle cx="2" cy="1" r="0.3" fill="#f1c40f" opacity="0.6" />
          <circle cx="15" cy="2" r="0.3" fill="#f1c40f" opacity="0.5" />
          {head(3, 4)}
          <rect x="3" y="7" width="4" height="3" fill={body} rx="0.3" />
          {/* Arms toward fire */}
          <rect x="6" y="7.5" width="2" height="1" fill={SKIN} />
          <rect x="1" y="8" width="2" height="1" fill={SKIN} />
          {/* Campfire */}
          <rect x="8" y="11.5" width="0.5" height="1.5" fill="#8B4513" />
          <rect x="9.5" y="11.5" width="0.5" height="1.5" fill="#8B4513" />
          {/* Fire */}
          <ellipse cx="9" cy={11 - fireFlicker * 0.3} rx="1.5" ry={1.5 + fireFlicker * 0.3} fill="#f39c12" opacity="0.8" />
          <ellipse cx="9" cy={10.5 - fireFlicker * 0.3} rx="0.8" ry={1 + fireFlicker * 0.2} fill="#e74c3c" opacity="0.6" />
          {/* Legs */}
          <rect x="3" y="10" width="4" height="2" fill={SKIN} />
          <rect x="2" y="11.5" width="2.5" height="1" fill={SHOE} rx="0.3" />
          {/* Ground */}
          <rect x="0" y="13" width="16" height="0.3" fill="#27ae60" opacity="0.3" />
        </>
      );
    }

    case "mountain-climbing": {
      // Rendered via climbing overlay, return empty
      return <></>;
    }

    case "diving": {
      // Swimming underwater with bubbles, fish
      const swimPhase = f % 4;
      const bodyY = 5 + (swimPhase % 2 === 0 ? 0 : 0.5);
      return (
        <>
          {/* Body horizontal */}
          <rect x="4" y={bodyY} width="7" height="3" fill={body} rx="0.3" />
          {/* Goggles + Head */}
          <rect x="10" y={bodyY - 1} width="3" height="2.5" fill={SKIN} rx="0.5" />
          <rect x="11" y={bodyY - 0.5} width="2" height="1" fill="#3498db" opacity="0.5" rx="0.3" />
          <rect x="10" y={bodyY - 1.3} width="3" height="1" fill={HAIR} rx="0.3" />
          {/* Arms */}
          {swimPhase < 2 ? (
            <rect x="12" y={bodyY - 2.5} width="1" height="2" fill={SKIN} />
          ) : (
            <rect x="12" y={bodyY + 2} width="2" height="1" fill={SKIN} />
          )}
          {/* Flippers / legs */}
          <rect x="2" y={bodyY + (swimPhase % 2 === 0 ? 0 : 1.5)} width="3" height="1" fill="#f39c12" />
          <rect x="2" y={bodyY + (swimPhase % 2 === 0 ? 1.5 : 0)} width="3" height="1" fill="#f39c12" />
        </>
      );
    }

    // ==================== HOBBIES ====================

    case "cooking": {
      // Cooking at a kitchen counter with pot
      const stirX = f % 2 === 0 ? 0 : 1;
      const steamY = 3 - f * 0.3;
      return (
        <>
          {/* Kitchen counter/table */}
          <rect x="0" y="9" width="16" height="1.2" fill="#8B6914" rx="0.3" />
          <rect x="0.5" y="10.2" width="1" height="3.8" fill="#6B4F12" />
          <rect x="14.5" y="10.2" width="1" height="3.8" fill="#6B4F12" />
          {/* Pot on table */}
          <rect x="1.5" y="6" width="5" height="3.5" fill="#7f8c8d" rx="0.5" />
          <rect x="1" y="5.5" width="6" height="1" fill="#95a5a6" rx="0.3" />
          {/* Pot handles */}
          <rect x="0" y="7" width="1.5" height="0.8" fill="#95a5a6" rx="0.3" />
          <rect x="6.5" y="7" width="1.5" height="0.8" fill="#95a5a6" rx="0.3" />
          {/* Food in pot */}
          <rect x="2" y="6.5" width="4" height="1.2" fill="#e67e22" opacity="0.5" rx="0.3" />
          {/* Steam */}
          <line x1="3" y1={steamY + 3} x2="3" y2={steamY + 1} stroke="#bdc3c7" strokeWidth="0.3" opacity="0.5" />
          <line x1="4.5" y1={steamY + 2.5} x2="4.5" y2={steamY + 0.5} stroke="#bdc3c7" strokeWidth="0.3" opacity="0.4" />
          <line x1="5.5" y1={steamY + 3.2} x2="5.5" y2={steamY + 1.2} stroke="#bdc3c7" strokeWidth="0.3" opacity="0.35" />
          {/* Character */}
          {head(9, 1)}
          {/* Chef hat */}
          <rect x="9" y="-0.5" width="4" height="1.5" fill="#ecf0f1" rx="0.5" />
          <rect x="8.5" y="0.5" width="5" height="0.8" fill="#ecf0f1" />
          <rect x="9" y="4" width="4" height="4" fill={body} rx="0.3" />
          {/* Left arm stirring into pot */}
          <rect x="7" y="5.5" width="2.5" height="1" fill={SKIN} />
          {/* Spoon */}
          <line x1="7.5" y1="5.5" x2={4 + stirX} y2="7.5" stroke="#D2B48C" strokeWidth="0.5" />
          {/* Right arm */}
          <rect x="13" y="6" width="2" height="1" fill={SKIN} />
          {/* Legs */}
          <rect x="9" y="8" width="2" height="4" fill={SKIN} />
          <rect x="11.5" y="8" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="11.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
        </>
      );
    }

    case "photography": {
      // Holding camera up to eye, flash
      const flash = f === 2;
      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          {/* Camera */}
          <rect x="2" y="2.5" width="4" height="2.5" rx="0.5" fill="#2c3e50" />
          <circle cx="4" cy="3.8" r="1" fill="#607d8b" />
          <circle cx="4" cy="3.8" r="0.5" fill="#3498db" opacity="0.5" />
          <rect x="3" y="2.5" width="1" height="0.5" fill="#7f8c8d" />
          {/* Arms holding camera */}
          <rect x="4" y="4.5" width="2" height="1" fill={SKIN} />
          <rect x="10" y="5" width="2" height="1" fill={SKIN} />
          {/* Flash */}
          {flash && <circle cx="2" cy="2" r="2" fill="#f1c40f" opacity="0.3" />}
          {flash && <circle cx="2" cy="2" r="1" fill="#ecf0f1" opacity="0.5" />}
          {/* Legs */}
          <rect x="6" y="8" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="8" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
        </>
      );
    }

    case "reading": {
      // Sitting at desk reading a book
      const pageFlip = f % 2 === 0;
      return (
        <>
          {/* Desk */}
          <rect x="1" y="8.5" width="14" height="1" fill="#8B6914" rx="0.3" />
          <rect x="1.5" y="9.5" width="1" height="4" fill="#6B4F12" />
          <rect x="13.5" y="9.5" width="1" height="4" fill="#6B4F12" />
          {/* Chair back */}
          <rect x="8.5" y="3" width="1" height="6" fill="#5D4037" rx="0.2" />
          <rect x="12" y="3" width="1" height="6" fill="#5D4037" rx="0.2" />
          <rect x="8.5" y="3" width="4.5" height="1" fill="#5D4037" rx="0.3" />
          {/* Chair seat */}
          <rect x="8" y="8" width="5" height="0.8" fill="#6D4C41" rx="0.2" />
          {/* Character sitting */}
          {head(7.5, 1.5)}
          <rect x="7.5" y="4.5" width="4" height="3.5" fill={body} rx="0.3" />
          {/* Arms on desk */}
          <rect x="5.5" y="7" width="2.5" height="1" fill={SKIN} />
          <rect x="11" y="7" width="2" height="1" fill={SKIN} />
          {/* Book on desk */}
          <rect x="3" y="6.5" width="4" height="2.5" rx="0.3" fill="#8e44ad" />
          <rect x="5" y="6.5" width="0.3" height="2.5" fill="#6c3483" />
          {/* Pages */}
          <rect x="3.5" y="7" width="1.5" height="0.25" fill="#ecf0f1" />
          <rect x="3.5" y="7.5" width="1.5" height="0.25" fill="#ecf0f1" />
          {pageFlip && <rect x="3.5" y="8" width="1" height="0.25" fill="#ecf0f1" />}
          {/* Legs under desk */}
          <rect x="8" y="8.5" width="2" height="3.5" fill={SKIN} />
          <rect x="10.5" y="8.5" width="2" height="3.5" fill={SKIN} />
          <rect x="7.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="10.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          {/* Lamp on desk */}
          <rect x="13" y="5" width="0.5" height="2" fill="#7f8c8d" />
          <rect x="12" y="4.5" width="2.5" height="0.8" fill="#f1c40f" rx="0.3" />
          {pageFlip && <circle cx="13.2" cy="4.5" r="1.5" fill="#f1c40f" opacity="0.08" />}
        </>
      );
    }

    case "merit-making": {
      // Wai (Thai greeting) pose with golden aura
      const auraGlow = f % 2 === 0;
      return (
        <>
          {/* Golden aura */}
          <circle cx="8" cy="6" r={auraGlow ? 6 : 5.5} fill="#f39c12" opacity={auraGlow ? 0.08 : 0.05} />
          {head(6, 1.5)}
          <rect x="6" y="4.5" width="4" height="4" fill="#f39c12" rx="0.3" />
          {/* Arms in Wai position (palms together) */}
          <rect x="5" y="4" width="1.5" height="2.5" fill={SKIN} />
          <rect x="9.5" y="4" width="1.5" height="2.5" fill={SKIN} />
          {/* Hands together */}
          <rect x="7" y="3.5" width="2" height="1.5" fill={SKIN} />
          {/* Legs */}
          <rect x="6" y="8.5" width="2" height="4" fill={SKIN} />
          <rect x="8.5" y="8.5" width="2" height="4" fill={SKIN} />
          <rect x="5.5" y="12.5" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x="8.5" y="12.5" width="2.5" height="1" fill={SHOE} rx="0.3" />
          {/* Sparkles */}
          {f === 0 && <circle cx="2" cy="2" r="0.4" fill="#f1c40f" opacity="0.6" />}
          {f === 1 && <circle cx="14" cy="3" r="0.3" fill="#f1c40f" opacity="0.5" />}
          {f === 2 && <circle cx="3" cy="5" r="0.3" fill="#f1c40f" opacity="0.5" />}
          {f === 3 && <circle cx="13" cy="1" r="0.4" fill="#f1c40f" opacity="0.6" />}
        </>
      );
    }

    // ==================== DEFAULT (generic walking) ====================
    default: {
      const stepPhase = f % 2 === 0;
      return (
        <>
          {head(6, 1)}
          <rect x="6" y="4" width="4" height="4" fill={body} rx="0.3" />
          <rect x="4" y={stepPhase ? 5 : 5.5} width="2" height="1" fill={SKIN} />
          <rect x="10" y={stepPhase ? 5.5 : 5} width="2" height="1" fill={SKIN} />
          <rect x={stepPhase ? 5 : 7} y="8" width="2" height="4" fill={SKIN} />
          <rect x={stepPhase ? 9 : 7} y="8" width="2" height="4" fill={SKIN} />
          <rect x={stepPhase ? 4.5 : 6.5} y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
          <rect x={stepPhase ? 8.5 : 6.5} y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
        </>
      );
    }
  }
};

const renderPixelFrame = (activity: string, frameIndex: number, _skinColor: string) => {
  const f = frameIndex % 4;
  return (
    <svg viewBox="0 0 16 16" className="w-full h-full" style={{ imageRendering: "pixelated" as const }}>
      {renderActivityFrame(activity, f, frameIndex)}
    </svg>
  );
};

// PixelAvatar Display Component with random wandering
interface PixelAvatarProps {
  activity: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  wander?: boolean;
}

export const PixelAvatar = ({ activity, size = "sm", className = "", wander = true }: PixelAvatarProps) => {
  const [frame, setFrame] = useState(0);
  const [posX, setPosX] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation frames
  useEffect(() => {
    if (!activity || !AVATAR_ACTIVITIES[activity]) return;
    // Basketball uses 8 frames, others use 4
    const totalFrames = (activity === "basketball" || activity === "golf") ? 16 : activity === "badminton" ? 8 : 4;
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % totalFrames);
    }, 300);
    return () => clearInterval(interval);
  }, [activity]);

  // Activities that should stay in place (not wander)
  const STATIONARY_ACTIVITIES = new Set([
    "basketball", "fitness", "yoga", "martial-arts", "chess",
    "guitar", "piano", "bass-drums", "singing",
    "music-production", "camping", "cooking",
    "reading", "meditation", "merit-making", "climbing", "mountain-climbing",
    "badminton", "golf",
  ]);

  const shouldWander = wander && activity ? !STATIONARY_ACTIVITIES.has(activity) : false;

  // One-direction running (left to right, loop)
  const ONE_DIR_ACTIVITIES = new Set(["running"]);
  const isOneDir = activity ? ONE_DIR_ACTIVITIES.has(activity) : false;

  useEffect(() => {
    if (!activity || !AVATAR_ACTIVITIES[activity] || !shouldWander || isOneDir) return;
    const moveInterval = setInterval(() => {
      setPosX((prev) => {
        const maxX = 40;
        const step = 1 + Math.random() * 2;
        let next = prev + step * direction;
        if (Math.random() < 0.08) {
          setDirection((d) => (d === 1 ? -1 : 1));
        }
        if (next > maxX) { setDirection(-1); next = maxX; }
        else if (next < -maxX) { setDirection(1); next = -maxX; }
        return next;
      });
    }, 80);
    return () => clearInterval(moveInterval);
  }, [activity, wander, direction, isOneDir]);

  // Running: bounce left-right
  useEffect(() => {
    if (!isOneDir || !shouldWander) return;
    const moveInterval = setInterval(() => {
      setPosX((prev) => {
        const next = prev + 2 * direction;
        if (next > 50) { setDirection(-1); return 50; }
        if (next < -50) { setDirection(1); return -50; }
        return next;
      });
    }, 60);
    return () => clearInterval(moveInterval);
  }, [isOneDir, shouldWander, direction]);

  if (!activity || !AVATAR_ACTIVITIES[activity]) return null;

  const sizeClasses = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-14 h-14" };
  const activityData = AVATAR_ACTIVITIES[activity];

  // Basketball hoop + flying ball as one unified overlay
  const renderBasketballOverlay = () => {
    if (activity !== "basketball") return null;
    const f16 = frame % 16;
    const sizeMap = { sm: 32, md: 40, lg: 56 };
    const avatarPx = sizeMap[size];
    
    // Hoop position: to the right of the character
    const hoopRight = -avatarPx * 2.5;
    const hoopW = avatarPx * 2;
    const hoopH = avatarPx * 2;

    // Ball arc: pixel offsets from character center to hoop rim
    // Character is at left ~20%, ball starts near hand, arcs high, drops into rim
    const isFlying = f16 >= 7 && f16 <= 13;
    
    // Arc points as pixel offsets from character's top-left
    // x goes right toward hoop, y goes up (negative) then back down
    const totalDist = avatarPx * 3; // horizontal distance to hoop
    const arcHeight = avatarPx * 2.5; // how high the ball goes
    
    const getArcPos = (t: number) => {
      // t goes from 0 to 1
      const x = t * totalDist;
      // Parabolic arc: y = -4h*t*(t-1) where h is max height
      const y = -4 * arcHeight * t * (t - 1);
      return { x, y };
    };

    // 7 frames: t from 0 to 1
    const tValues = [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1.0];
    
    const ballSize = Math.max(6, avatarPx * 0.22);

    return (
      <>
        {/* Hoop */}
        <div
          className="absolute bottom-0 pointer-events-none"
          style={{ right: hoopRight, width: hoopW, height: hoopH }}
        >
          <svg viewBox="0 0 16 16" className="w-full h-full" style={{ imageRendering: "pixelated" as const }}>
            {/* Backboard */}
            <rect x="12" y="0" width="2.5" height="5.5" fill="#ecf0f1" />
            <rect x="12.3" y="0.3" width="1.9" height="1" fill="#e74c3c" opacity="0.15" />
            {/* Rim */}
            <rect x="9.5" y="5.2" width="3" height="0.5" fill="#e74c3c" />
            {/* Net */}
            <line x1="9.7" y1="5.7" x2="10.3" y2="8" stroke="#bdc3c7" strokeWidth="0.25" />
            <line x1="11" y1="5.7" x2="11" y2="8" stroke="#bdc3c7" strokeWidth="0.25" />
            <line x1="12.3" y1="5.7" x2="11.7" y2="8" stroke="#bdc3c7" strokeWidth="0.25" />
            <line x1="10.2" y1="6.5" x2="11.8" y2="6.5" stroke="#bdc3c7" strokeWidth="0.15" />
            <line x1="10.3" y1="7.3" x2="11.7" y2="7.3" stroke="#bdc3c7" strokeWidth="0.15" />
            {/* Pole */}
            <rect x="13" y="5.5" width="0.5" height="10.5" fill="#95a5a6" />
            {/* Score effect */}
            {f16 >= 14 && (
              <>
                <circle cx="11" cy="6" r="2.5" fill="#f1c40f" opacity="0.3" />
                <circle cx="11" cy="6" r="1.2" fill="#f1c40f" opacity="0.2" />
              </>
            )}
          </svg>
        </div>
        {/* Flying ball */}
        {isFlying && (() => {
          const t = tValues[f16 - 7];
          const pos = getArcPos(t);
          // Ball starts from character's right hand area
          const startX = avatarPx * 0.7; // right side of character
          const startY = avatarPx * 0.2; // near top (hand height)
          return (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: startX + pos.x,
                bottom: startY + pos.y,
                width: ballSize,
                height: ballSize,
                transform: "translate(-50%, 50%)",
                transition: "none",
              }}
            >
              <svg viewBox="0 0 8 8" className="w-full h-full">
                <circle cx="4" cy="4" r="3.5" fill="#f39c12" />
                <line x1="1" y1="4" x2="7" y2="4" stroke="#e67e22" strokeWidth="0.5" />
                <line x1="4" y1="0.5" x2="4" y2="7.5" stroke="#e67e22" strokeWidth="0.5" />
              </svg>
            </div>
          );
        })()}
      </>
    );
  };

  // Climbing overlay: two separate climbers at pole positions
  const renderClimbingOverlay = () => {
    if (activity !== "mountain-climbing" && activity !== "climbing") return null;
    const f4 = frame % 4;
    const climbBody = getBodyColor(activity);
    const climberSize = size === "sm" ? 32 : size === "md" ? 40 : 56;
    
    // Vertical offset for climbing animation (pixels)
    const climbUpOffset = [0, -4, -8, -4][f4]; // left climber goes up
    const climbDownOffset = [0, 4, 8, 4][f4]; // right climber goes down
    const reachUp = f4 < 2;

    const renderClimber = (goingUp: boolean) => {
      const r = goingUp ? reachUp : !reachUp;
      return (
        <svg viewBox="0 0 16 16" width={climberSize} height={climberSize} style={{ imageRendering: "pixelated" as const }}>
          <rect x="6" y={r ? 0.5 : -0.5} width="4" height="1.2" fill={HAIR} rx="0.3" />
          <rect x="6" y={r ? 1 : 2} width="4" height="3" fill={SKIN} rx="0.5" />
          <rect x="6.5" y={r ? 2 : 3} width="1" height="0.8" fill="#1a1a2e" />
          <rect x="8.5" y={r ? 2 : 3} width="1" height="0.8" fill="#1a1a2e" />
          <rect x="6" y={r ? 4 : 5} width="4" height="4" fill={climbBody} rx="0.3" />
          <rect x="4" y={r ? 2 : 4} width="2.5" height="1" fill={SKIN} />
          <rect x="9.5" y={r ? 3 : 2} width="2.5" height="1" fill={SKIN} />
          <rect x="6" y={r ? 8 : 9} width="2" height="3" fill={SKIN} />
          <rect x="8.5" y={r ? 9 : 8} width="2" height="3" fill={SKIN} />
          <rect x="5.5" y={r ? 11 : 12} width="2.5" height="1" fill={SHOE} rx="0.2" />
          <rect x="8.5" y={r ? 12 : 11} width="2.5" height="1" fill={SHOE} rx="0.2" />
        </svg>
      );
    };

    return (
      <>
        {/* Left climber - climbing up */}
        <div className="absolute pointer-events-none z-10" style={{ 
          left: "12%", 
          bottom: 4,
          transform: `translateX(-50%) translateY(${climbUpOffset}px)`,
          transition: "transform 0.25s ease-in-out",
        }}>
          {renderClimber(true)}
        </div>
        {/* Right climber - climbing down */}
        <div className="absolute pointer-events-none z-10" style={{ 
          right: "12%", 
          bottom: 4,
          transform: `translateX(50%) translateY(${climbDownOffset}px)`,
          transition: "transform 0.25s ease-in-out",
        }}>
          {renderClimber(false)}
        </div>
      </>
    );
  };

  // Badminton overlay: two players facing each other with shuttlecock
  const renderBadmintonOverlay = () => {
    if (activity !== "badminton") return null;
    const f8 = frame % 8;
    const leftHitting = f8 < 4;
    const localF = f8 % 4;
    const badBody = getBodyColor("badminton");
    const playerSize = size === "sm" ? 32 : size === "md" ? 40 : 56;

    // Left player arm/racket (swings when hitting)
    const lArmY = leftHitting ? [3, 2, 4, 5][localF] : 5;
    const lRacketTipX = leftHitting ? [11, 11.5, 12, 11.5][localF] : 10.5;
    const lRacketTipY = leftHitting ? [1, 0, 2, 3][localF] : 4;

    // Right player uses same arm structure (mirrored by scaleX(-1))
    const rArmY = !leftHitting ? [3, 2, 4, 5][localF] : 5;
    const rRacketTipX = !leftHitting ? [11, 11.5, 12, 11.5][localF] : 10.5;
    const rRacketTipY = !leftHitting ? [1, 0, 2, 3][localF] : 4;

    const renderPlayer = (armY: number, racketTipX: number, racketTipY: number) => (
      <svg viewBox="0 0 16 16" width={playerSize} height={playerSize} style={{ imageRendering: "pixelated" as const }}>
        <rect x="6" y="0.5" width="4" height="1.2" fill={HAIR} rx="0.3" />
        <rect x="6" y="1" width="4" height="3" fill={SKIN} rx="0.5" />
        <rect x="6.5" y="2" width="0.8" height="0.7" fill="#1a1a2e" />
        <rect x="8.5" y="2" width="0.8" height="0.7" fill="#1a1a2e" />
        <rect x="6" y="4" width="4" height="4" fill={badBody} rx="0.3" />
        <rect x="4" y="5.5" width="2" height="1" fill={SKIN} />
        <rect x="9.5" y={armY} width="2" height="1" fill={SKIN} />
        <line x1="11" y1={armY + 0.5} x2={racketTipX} y2={racketTipY} stroke="#D2B48C" strokeWidth="0.5" />
        <ellipse cx={racketTipX + 0.5} cy={racketTipY - 1} rx="1" ry="1.3" fill="none" stroke="#D2B48C" strokeWidth="0.4" />
        <rect x="6" y="8" width="2" height="4" fill={SKIN} />
        <rect x="8.5" y="8" width="2" height="4" fill={SKIN} />
        <rect x="5.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
        <rect x="8.5" y="12" width="2.5" height="1" fill={SHOE} rx="0.3" />
      </svg>
    );

    return (
      <>
        {/* Left player */}
        <div className="absolute pointer-events-none z-10" style={{ left: "12%", bottom: 4, transform: "translateX(-50%)" }}>
          {renderPlayer(lArmY, lRacketTipX, lRacketTipY)}
        </div>
        {/* Right player (mirrored) */}
        <div className="absolute pointer-events-none z-10" style={{ right: "12%", bottom: 4, transform: "translateX(50%) scaleX(-1)" }}>
          {renderPlayer(rArmY, rRacketTipX, rRacketTipY)}
        </div>
        {/* Net in the middle */}
        <div className="absolute pointer-events-none z-10" style={{ left: "50%", bottom: 4, transform: "translateX(-50%)", width: 2, height: playerSize * 0.7, borderLeft: "1px dashed #bdc3c7" }} />
      </>
    );
  };

  // Golf flag overlay + flying ball
  const renderGolfOverlay = () => {
    if (activity !== "golf") return null;
    const f16 = frame % 16;
    const sizeMap = { sm: 32, md: 40, lg: 56 };
    const avatarPx = sizeMap[size];
    const flagW = avatarPx * 1.5;
    const flagH = avatarPx * 1.8;
    const hoopRight = -avatarPx * 2.5;

    // Ball flies after impact (frame 8-14)
    const isFlying = f16 >= 8 && f16 <= 14;
    const totalDist = avatarPx * 3;
    const arcHeight = avatarPx * 2;

    const getArcPos = (t: number) => ({
      x: t * totalDist,
      y: -4 * arcHeight * t * (t - 1),
    });

    const tValues = [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1.0];
    const ballSize = Math.max(5, avatarPx * 0.18);

    return (
      <>
        {/* Flag + hole */}
        <div
          className="absolute bottom-0 pointer-events-none"
          style={{ right: hoopRight, width: flagW, height: flagH }}
        >
          <svg viewBox="0 0 16 16" className="w-full h-full" style={{ imageRendering: "pixelated" as const }}>
            {/* Pole */}
            <line x1="8" y1="2" x2="8" y2="14" stroke="#bdc3c7" strokeWidth="0.5" />
            {/* Flag */}
            <polygon points="8,2 8,5 12,3.5" fill="#e74c3c" />
            {/* Hole */}
            <ellipse cx="8" cy="14" rx="3" ry="0.8" fill="#2c3e50" opacity="0.5" />
            {/* Green */}
            <ellipse cx="8" cy="14.5" rx="5" ry="1.2" fill="#27ae60" opacity="0.25" />
          </svg>
        </div>
        {/* Flying ball */}
        {isFlying && (() => {
          const t = tValues[f16 - 8];
          const pos = getArcPos(t);
          const startX = avatarPx * 0.7;
          const startY = avatarPx * 0.2;
          return (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: startX + pos.x,
                bottom: startY + pos.y,
                width: ballSize,
                height: ballSize,
                transform: "translate(-50%, 50%)",
              }}
            >
              <svg viewBox="0 0 8 8" className="w-full h-full">
                <circle cx="4" cy="4" r="3" fill="#ecf0f1" />
                <circle cx="4" cy="4" r="3" fill="none" stroke="#bdc3c7" strokeWidth="0.5" />
              </svg>
            </div>
          );
        })()}
      </>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ minHeight: size === "sm" ? 48 : size === "md" ? 56 : 72, overflow: "visible" }}>
      {renderBasketballOverlay()}
      {renderClimbingOverlay()}
      {renderBadmintonOverlay()}
      {renderGolfOverlay()}
      {/* Full-width water background for swimming & diving */}
      {(activity === "swimming" || activity === "diving") && (
        <div
          className="absolute pointer-events-none left-0 right-0"
          style={{
            bottom: 0,
            height: activity === "diving" ? "100%" : "55%",
            background: activity === "diving"
              ? "linear-gradient(180deg, rgba(0,151,167,0.15) 0%, rgba(0,151,167,0.4) 100%)"
              : "linear-gradient(180deg, rgba(52,152,219,0.2) 0%, rgba(41,128,185,0.45) 100%)",
            overflow: "hidden",
          }}
        >
          {/* Animated wave layers */}
          <div className="absolute inset-0" style={{
            background: "repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 10px)",
            animation: "swim-waves 2s linear infinite",
          }} />
          <div className="absolute inset-0" style={{
            background: "repeating-linear-gradient(90deg, transparent, transparent 12px, rgba(255,255,255,0.08) 12px, rgba(255,255,255,0.08) 14px)",
            animation: "swim-waves 3s linear infinite reverse",
          }} />
          {/* Surface shimmer for swimming */}
          {activity === "swimming" && (
            <div className="absolute left-0 right-0 top-0 h-[3px]" style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 20%, transparent 40%, rgba(255,255,255,0.3) 60%, transparent 80%, rgba(255,255,255,0.35) 100%)",
              animation: "swim-shimmer 1.5s ease-in-out infinite",
            }} />
          )}
          {/* Diving decorations: fish, coral, bubbles */}
          {activity === "diving" && (
            <>
              {/* Bubbles */}
              <div className="absolute" style={{ right: "15%", top: "10%", width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.4)", animation: "dive-bubble1 2.5s ease-in-out infinite" }} />
              <div className="absolute" style={{ right: "25%", top: "20%", width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.3)", animation: "dive-bubble2 3s ease-in-out infinite 0.5s" }} />
              <div className="absolute" style={{ right: "10%", top: "30%", width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.35)", animation: "dive-bubble1 2s ease-in-out infinite 1s" }} />
              {/* Fish */}
              <svg className="absolute" style={{ bottom: "20%", width: 16, height: 10, animation: "dive-fish 4s linear infinite" }} viewBox="0 0 16 10">
                <polygon points="0,5 6,2 6,8" fill="#f39c12" opacity="0.6" />
                <polygon points="6,3 10,5 6,7" fill="#e67e22" opacity="0.6" />
                <circle cx="3" cy="4.5" r="0.7" fill="#2c3e50" opacity="0.5" />
              </svg>
              <svg className="absolute" style={{ bottom: "45%", width: 12, height: 8, animation: "dive-fish 5s linear infinite 2s" }} viewBox="0 0 16 10">
                <polygon points="0,5 6,2 6,8" fill="#3498db" opacity="0.5" />
                <polygon points="6,3 10,5 6,7" fill="#2980b9" opacity="0.5" />
                <circle cx="3" cy="4.5" r="0.7" fill="#2c3e50" opacity="0.4" />
              </svg>
              {/* Coral at bottom */}
              <div className="absolute bottom-0 left-[5%] w-[6px] h-[12px] rounded-t-full" style={{ background: "rgba(231,76,60,0.35)" }} />
              <div className="absolute bottom-0 left-[8%] w-[4px] h-[8px] rounded-t-full" style={{ background: "rgba(46,204,113,0.35)" }} />
              <div className="absolute bottom-0 right-[10%] w-[5px] h-[10px] rounded-t-full" style={{ background: "rgba(231,76,60,0.3)" }} />
              <div className="absolute bottom-0 right-[15%] w-[4px] h-[14px] rounded-t-full" style={{ background: "rgba(46,204,113,0.3)" }} />
              <div className="absolute bottom-0 right-[7%] w-[3px] h-[7px] rounded-t-full" style={{ background: "rgba(155,89,182,0.3)" }} />
            </>
          )}
        </div>
      )}
      {/* Hiking forest background */}
      {activity === "hiking" && (
        <div
          className="absolute pointer-events-none left-0 right-0 bottom-0 top-0 overflow-hidden rounded-[inherit]"
          style={{
            background: "linear-gradient(180deg, rgba(200,240,200,0.4) 0%, rgba(100,200,120,0.5) 50%, rgba(34,139,34,0.6) 100%)",
          }}
        >
          {/* Trees */}
          <div className="absolute" style={{ left: "3%", bottom: "18%", width: 10, height: 18, opacity: 0.6 }}>
            <div style={{ width: 10, height: 12, background: "#27ae60", borderRadius: "50% 50% 20% 20%" }} />
            <div style={{ width: 3, height: 8, background: "#8B4513", margin: "0 auto" }} />
          </div>
          <div className="absolute" style={{ right: "5%", bottom: "22%", width: 12, height: 20, opacity: 0.5 }}>
            <div style={{ width: 12, height: 14, background: "#2ecc71", borderRadius: "50% 50% 20% 20%" }} />
            <div style={{ width: 4, height: 8, background: "#8B4513", margin: "0 auto" }} />
          </div>
          <div className="absolute" style={{ left: "35%", bottom: "15%", width: 8, height: 14, opacity: 0.35 }}>
            <div style={{ width: 8, height: 9, background: "#2ecc71", borderRadius: "50% 50% 20% 20%" }} />
            <div style={{ width: 3, height: 6, background: "#6d4c41", margin: "0 auto" }} />
          </div>
          {/* Bushes */}
          <div className="absolute rounded-full" style={{ left: "15%", bottom: "8%", width: 14, height: 7, background: "#27ae60", opacity: 0.5 }} />
          <div className="absolute rounded-full" style={{ right: "20%", bottom: "5%", width: 10, height: 6, background: "#2ecc71", opacity: 0.45 }} />
          <div className="absolute rounded-full" style={{ left: "55%", bottom: "10%", width: 8, height: 5, background: "#27ae60", opacity: 0.4 }} />
          {/* Grass strip at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[6px]" style={{ background: "linear-gradient(0deg, rgba(39,174,96,0.7), transparent)" }} />
          {/* Floating leaves */}
          <div className="absolute" style={{ left: "25%", top: "12%", width: 5, height: 3, borderRadius: "50%", background: "#27ae60", opacity: 0.4, animation: "dive-bubble1 3s ease-in-out infinite" }} />
          <div className="absolute" style={{ right: "15%", top: "20%", width: 4, height: 3, borderRadius: "50%", background: "#2ecc71", opacity: 0.35, animation: "dive-bubble2 4s ease-in-out infinite 1s" }} />
          <div className="absolute" style={{ left: "60%", top: "8%", width: 3, height: 2, borderRadius: "50%", background: "#27ae60", opacity: 0.3, animation: "dive-bubble1 3.5s ease-in-out infinite 0.5s" }} />
        </div>
      )}
      {/* Camping night sky background */}
      {activity === "camping" && (
        <div
          className="absolute pointer-events-none left-0 right-0 bottom-0 top-0 overflow-hidden rounded-[inherit]"
          style={{
            background: "linear-gradient(180deg, #0a0e27 0%, #1a1a3e 40%, #2d1b4e 70%, #1a2a1a 90%, #0d1a0d 100%)",
          }}
        >
          <div className="absolute" style={{ left: "10%", top: "8%", width: 3, height: 3, borderRadius: "50%", background: "#fff", opacity: 0.8 }} />
          <div className="absolute" style={{ left: "30%", top: "5%", width: 2, height: 2, borderRadius: "50%", background: "#fff", opacity: 0.6 }} />
          <div className="absolute" style={{ left: "70%", top: "12%", width: 2, height: 2, borderRadius: "50%", background: "#fff", opacity: 0.7 }} />
          <div className="absolute" style={{ left: "85%", top: "6%", width: 3, height: 3, borderRadius: "50%", background: "#fff", opacity: 0.5 }} />
          <div className="absolute" style={{ left: "50%", top: "3%", width: 2, height: 2, borderRadius: "50%", background: "#ffeaa7", opacity: 0.6 }} />
          <div className="absolute" style={{ left: "20%", top: "18%", width: 2, height: 2, borderRadius: "50%", background: "#fff", opacity: 0.4 }} />
          <div className="absolute" style={{ left: "60%", top: "15%", width: 2, height: 2, borderRadius: "50%", background: "#ffeaa7", opacity: 0.5 }} />
          <div className="absolute" style={{ right: "15%", top: "5%", width: 10, height: 10, borderRadius: "50%", background: "radial-gradient(circle, #ffeaa7 0%, #fdcb6e 60%, transparent 100%)", opacity: 0.7 }} />
        </div>
      )}
      {/* Climbing wall background with two poles */}
      {(activity === "climbing" || activity === "mountain-climbing") && (
        <div
          className="absolute pointer-events-none left-0 right-0 bottom-0 top-0 overflow-hidden"
        >
          {/* Left pole */}
          <div className="absolute" style={{ left: "12%", top: 0, bottom: 0, width: 8, background: "linear-gradient(90deg, #8d6e63, #a1887f, #8d6e63)", borderRadius: 2, opacity: 0.6 }}>
            {/* Grips on left pole */}
            <div className="absolute rounded-sm" style={{ left: -3, top: "15%", width: 6, height: 4, background: "#e74c3c", opacity: 0.7 }} />
            <div className="absolute rounded-sm" style={{ right: -3, top: "35%", width: 6, height: 4, background: "#3498db", opacity: 0.7 }} />
            <div className="absolute rounded-sm" style={{ left: -3, top: "55%", width: 6, height: 4, background: "#2ecc71", opacity: 0.7 }} />
            <div className="absolute rounded-sm" style={{ right: -3, top: "75%", width: 6, height: 4, background: "#f39c12", opacity: 0.7 }} />
          </div>
          {/* Right pole */}
          <div className="absolute" style={{ right: "12%", top: 0, bottom: 0, width: 8, background: "linear-gradient(90deg, #8d6e63, #a1887f, #8d6e63)", borderRadius: 2, opacity: 0.6 }}>
            {/* Grips on right pole */}
            <div className="absolute rounded-sm" style={{ right: -3, top: "20%", width: 6, height: 4, background: "#2ecc71", opacity: 0.7 }} />
            <div className="absolute rounded-sm" style={{ left: -3, top: "40%", width: 6, height: 4, background: "#e74c3c", opacity: 0.7 }} />
            <div className="absolute rounded-sm" style={{ right: -3, top: "60%", width: 6, height: 4, background: "#f39c12", opacity: 0.7 }} />
            <div className="absolute rounded-sm" style={{ left: -3, top: "80%", width: 6, height: 4, background: "#3498db", opacity: 0.7 }} />
          </div>
        </div>
      )}
      <div
        className={`${sizeClasses[size]} absolute bottom-0`}
        style={{
          transform: `translateX(${posX}px) scaleX(${direction})`,
          transition: "transform 0.08s linear",
          left: activity === "basketball" ? "-10%" : activity === "golf" ? "5%" : "50%",
          marginLeft: size === "sm" ? "-16px" : size === "md" ? "-20px" : "-28px",
        }}
      >
        {renderPixelFrame(activity, frame, SKIN)}
      </div>
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-[8px] bg-card/90 backdrop-blur-sm px-1 py-0.5 rounded-full text-muted-foreground border border-border shadow-sm">
          {activityData.emoji} {activityData.label}
        </span>
      </div>
    </div>
  );
};

// Avatar Activity Selector Component
interface AvatarActivitySelectorProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
}

export const AvatarActivitySelector = ({ value, onValueChange }: AvatarActivitySelectorProps) => {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto">
      <button
        onClick={() => onValueChange(null)}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
          value === null ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"
        }`}
      >
        <div className="w-8 h-8 flex items-center justify-center text-muted-foreground text-sm">✕</div>
        <span className="text-[10px] text-muted-foreground">{t("common.none")}</span>
      </button>
      {Object.entries(AVATAR_ACTIVITIES).map(([key, data]) => (
        <button
          key={key}
          onClick={() => onValueChange(key)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
            value === key ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"
          }`}
        >
          <div className="w-8 h-8">
            {renderPixelFrame(key, 0, SKIN)}
          </div>
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{data.emoji}</span>
        </button>
      ))}
    </div>
  );
};

export { AVATAR_ACTIVITIES };
