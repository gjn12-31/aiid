import { useId } from "react";
import type { CaseId } from "@/lib/types";
export function CaseArt({ id, hero = false }: { id: CaseId; hero?: boolean }) {
  const uid = useId().replaceAll(":", "");
  return (
    <div
      className={`case-art woodcut-art art-${id} ${hero ? "hero-art" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 480 290" role="presentation">
        <defs>
          <pattern
            id={`${uid}-hatch`}
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(27)"
          >
            <path d="M0 0v7" stroke="#30281f" strokeWidth="1" opacity=".24" />
          </pattern>
          <filter
            id={`${uid}-rough`}
            x="-5%"
            y="-5%"
            width="110%"
            height="110%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".03"
              numOctaves="2"
              seed="4"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <path
          d="M25 253q190-38 427-3M46 261q152-30 374-1M34 270l70-3M380 263l65 8"
          fill="none"
          stroke="#60573a"
          strokeWidth="1.5"
          opacity=".4"
        />
        <g
          filter={`url(#${uid}-rough)`}
          stroke="#2b291d"
          strokeWidth="3"
          strokeLinejoin="round"
        >
          {id === "monopoly" ? (
            <>
              <path d="M155 237l7-99 78-65 105 66-5 106z" fill="#a48b5b" />
              <path
                d="M143 139l96-89 122 94-27-2-95-67-77 73z"
                fill="#58503a"
              />
              <path
                d="M177 242l10-96M234 90l7 151M305 132l11 111M163 177l177 11M185 153l130 81M174 233l151-70"
                fill="none"
                stroke="#4e422c"
                strokeWidth="6"
              />
              <path d="M254 242v-44l27-5 14 46" fill="#383b28" />
              <path d="M252 129l42 5-4 35-33-3z" fill="#d8bd77" />
              <path d="M273 133v35M254 149l37 3" strokeWidth="3" />
              <path d="M171 122l29-22-1 38-30 4z" fill="#585e39" />
              <path d="M310 106l-3-60 27 8-3 63" fill="#716045" />
              <path d="M302 43l39 5-4 14-36-9z" fill="#4b412e" />
              <path
                d="M160 232l9-85 67-58 98 61 1 87z"
                fill={`url(#${uid}-hatch)`}
                stroke="none"
              />
              <path
                d="M76 230l13-31 54-8 24 30 9 8-3 16-107 6 1-19z"
                fill="#b5b48b"
              />
              <path d="M95 201l40-6 16 28-64 8z" fill="#596345" />
              <circle cx="89" cy="246" r="13" fill="#353c2a" />
              <circle cx="155" cy="239" r="13" fill="#353c2a" />
              <path d="M100 197l8 28M71 237l88-7" strokeWidth="2" />
            </>
          ) : id === "candles" ? (
            <>
              <ellipse cx="230" cy="246" rx="121" ry="18" fill="#8b8060" />
              <path d="M134 161l-1 62c0 37 196 33 192-6l-1-67" fill="#ab7852" />
              <path
                d="M136 179q14 36 29 13t25 11 23-4 26 8 22-15 24 0 39-13v-24l-188 4z"
                fill="#daca98"
              />
              <ellipse cx="229" cy="157" rx="95" ry="30" fill="#ddd0a4" />
              <ellipse
                cx="229"
                cy="157"
                rx="74"
                ry="20"
                fill="none"
                strokeDasharray="2 7"
                strokeWidth="1.5"
              />
              <path
                d="M228 76l3 35M224 72l12 0"
                strokeDasharray="3 7"
                stroke="#79754f"
                strokeWidth="4"
              />
              <path
                d="M224 49q27-22 7-36 12 20-13 38"
                fill="none"
                stroke="#8a835f"
                strokeWidth="1.5"
              />
              <path d="M333 147l62 13-4 94-65-20z" fill="#e3d5ac" />
              <path d="M333 147l21 57 41-44" fill="none" strokeWidth="2" />
              <path d="M351 208l-12 16 12-3 7 8 8-25" fill="#9d4533" />
              <circle cx="357" cy="201" r="13" fill="#a9513b" />
              <path
                d="M151 204l8 24M173 221l6 15M192 226l2 16M212 225l4 19M269 221l-2 18M291 213l-3 23"
                stroke="#80573f"
                strokeWidth="2"
              />
            </>
          ) : id === "pilot" ? (
            <>
              <path
                d="M70 208q77-176 296-151"
                fill="none"
                strokeDasharray="5 9"
                stroke="#837d59"
                strokeWidth="2"
              />
              <g transform="translate(243 145) rotate(-24)">
                <path
                  d="M-11-93Q1-114 14-90l2 66 97 48-1 19-97-29-3 57 32 22-1 14L0 91l-41 17-2-14 30-23-3-56-91 27-1-19 94-47z"
                  fill="#b8b78e"
                />
                <path
                  d="M0-91v178M-11-26l-84 54M16-26l82 53M12 70l23 23M-13 70l-24 21"
                  fill="none"
                  strokeWidth="1.5"
                />
                <path d="M-8-73l19 0-2 17h-15z" fill="#4a5739" />
                <path
                  d="M-11-93Q1-114 14-90l2 66 97 48-1 19-97-29-3 57 32 22-1 14L0 91l-41 17-2-14 30-23-3-56-91 27-1-19 94-47z"
                  fill={`url(#${uid}-hatch)`}
                />
              </g>
              <g transform="translate(345 235) rotate(-12)">
                <circle r="21" fill="none" strokeWidth="6" />
                <circle cx="48" r="21" fill="none" strokeWidth="6" />
                <path d="M18-6l12 0M17 5l13 0" strokeWidth="4" />
              </g>
            </>
          ) : (
            <>
              <path
                d="M131 88q60-15 110 14 47-29 111-12l-7 149q-63-16-105 5-51-20-116-5z"
                fill="#988253"
              />
              <path
                d="M139 77q53-13 102 20 51-31 102-18l-7 142q-49-19-96 13-53-29-105-10z"
                fill="#d7c69b"
              />
              <path
                d="M242 102l-2 125M151 104l-3 90M328 106l-6 99M153 115q42-5 70 13M150 137q46-1 74 13M151 159q40 0 70 12M150 181q42-4 73 12"
                fill="none"
                stroke="#867149"
                strokeWidth="2"
              />
              <path
                d="M281 120q-22 7-10 23 10 10 22-1 14-13 4-24-9-11-17 1M284 148l-7 44 11-2-2-9 9-1-2-9"
                fill="none"
                stroke="#8d5432"
                strokeWidth="4"
              />
              <path d="M112 151l-10 78 16 3 9-79z" fill="#dccb9a" />
              <path
                d="M120 149q-28-10-1-45 0 16 9 24 8 15-8 21"
                fill="#bb823b"
              />
              <path d="M107 234l-28 4-2 9 62 3-1-13z" fill="#6b6845" />
            </>
          )}
          <path
            d="M43 49l7 10-2 9 13-13-11 4M403 76l3-8 3 8 8 3-8 3-3 8-3-8-8-3z"
            fill="#968657"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}
