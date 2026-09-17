import type { CaseId } from "@/lib/types";
export function CaseArt({ id, hero = false }: { id: CaseId; hero?: boolean }) {
  return (
    <div
      className={`case-art art-${id} ${hero ? "hero-art" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 480 310" role="presentation">
        <defs>
          <radialGradient id={`glow-${id}-${hero}`}>
            <stop
              stopColor={id === "candles" ? "#e6b778" : "#81999c"}
              stopOpacity=".22"
            />
            <stop offset="1" stopColor="#172928" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`paper-${id}-${hero}`} x2="1" y2="1">
            <stop stopColor="#f1e9d9" />
            <stop offset="1" stopColor="#b5ad98" />
          </linearGradient>
        </defs>
        <circle cx="250" cy="155" r="220" fill={`url(#glow-${id}-${hero})`} />
        <g stroke="#b8c6b9" strokeOpacity=".12" fill="none">
          <circle cx="240" cy="156" r="118" />
          <circle cx="240" cy="156" r="100" strokeDasharray="2 10" />
          <path d="M240 20v270M40 156h400" />
        </g>
        {id === "monopoly" && (
          <g>
            <ellipse
              cx="252"
              cy="252"
              rx="128"
              ry="18"
              fill="#0c1818"
              opacity=".4"
            />
            <path
              d="M145 217l93-36 129 35-95 40z"
              fill="#c1b99f"
              opacity=".3"
            />
            <path
              d="M184 134l73-33 67 32v96l-68 27-72-26z"
              fill="#bd745b"
              stroke="#1b302d"
              strokeWidth="3"
            />
            <path d="M256 102v152l68-27v-94z" fill="#935442" />
            <path
              d="M174 135l82-54 81 49-80 28z"
              fill="#de9874"
              stroke="#1b302d"
              strokeWidth="3"
            />
            <path d="M181 134l75-47 75 43-75 22z" fill="#b2664f" />
            <g fill="#253b36">
              <path d="M199 162l13 4v20l-13-4zM224 170l13 4v20l-13-4zM199 198l13 4v20l-13-4zM281 169l15-6v21l-15 6zM303 159l12-5v21l-12 5z" />
              <path d="M235 217l14 5v30l-14-5z" />
            </g>
            <g transform="translate(103 212) rotate(-8)">
              <path
                d="M0 4h15l10-15h29l12 15 14 4v16H0z"
                fill="#d5d5c8"
                stroke="#32463e"
                strokeWidth="3"
              />
              <path d="M30-7h18l9 12H22z" fill="#536b63" />
              <circle cx="16" cy="23" r="9" fill="#233830" />
              <circle cx="64" cy="23" r="9" fill="#233830" />
            </g>
            <path d="M329 59l24 7-7 35-24-7z" fill="#dbc89f" />
            <text
              x="333"
              y="88"
              fill="#596954"
              fontSize="24"
              fontFamily="Georgia"
              transform="rotate(15 333 88)"
            >
              ?
            </text>
          </g>
        )}
        {id === "candles" && (
          <g>
            <ellipse
              cx="244"
              cy="253"
              rx="126"
              ry="18"
              fill="#0c1818"
              opacity=".4"
            />
            <ellipse cx="230" cy="237" rx="96" ry="24" fill="#a6a897" />
            <ellipse cx="230" cy="229" rx="87" ry="24" fill="#d5d1bd" />
            <path d="M157 169v49c0 29 146 29 146 0v-49" fill="#b89172" />
            <path
              d="M157 187q14 20 25 6t26 4 28-1 27 2 27-5 13-6v-18H157z"
              fill="#e0d4b3"
            />
            <ellipse cx="230" cy="169" rx="73" ry="25" fill="#e9dec4" />
            <ellipse
              cx="230"
              cy="168"
              rx="57"
              ry="17"
              fill="none"
              stroke="#cfb28c"
              strokeWidth="2"
              strokeDasharray="2 6"
            />
            <path
              d="M315 165l61 11-13 73-63-12z"
              fill={`url(#paper-${id}-${hero})`}
            />
            <path d="M315 165l20 41 41-30" fill="none" stroke="#8f927d" />
            <circle cx="336" cy="202" r="10" fill="#af6b4d" />
            <path
              d="M233 86v34"
              stroke="#e6d9b4"
              strokeWidth="8"
              strokeDasharray="3 6"
              opacity=".5"
            />
            <path
              d="M229 59q21-17 8-29 5 17-14 27"
              fill="none"
              stroke="#c7b192"
              opacity=".45"
            />
            <text
              x="234"
              y="151"
              textAnchor="middle"
              fontFamily="Georgia"
              fontSize="36"
              fill="#b78056"
            >
              0
            </text>
          </g>
        )}
        {id === "pilot" && (
          <g>
            <path
              d="M115 250Q180 25 355 74"
              fill="none"
              stroke="#c5cdb6"
              strokeDasharray="5 8"
              strokeWidth="2"
              opacity=".6"
            />
            <g transform="translate(236 155) rotate(-23)">
              <path
                d="M-12-93Q0-115 12-93l4 69 91 46v17L16 14l-4 57 32 22v13L0 90l-44 16V93l32-22-4-57-91 25V22l91-46z"
                fill="#d7d9c7"
                stroke="#879889"
                strokeWidth="2"
              />
              <path
                d="M0-95v178M16 14l-16-27-16 27"
                fill="none"
                stroke="#a4b4a2"
                strokeWidth="2"
              />
              <path d="M-9-76l18 0-2 14H-7z" fill="#516a65" />
            </g>
            <g transform="translate(339 232)">
              <circle r="23" fill="none" stroke="#c29a71" strokeWidth="5" />
              <circle
                cx="42"
                r="23"
                fill="none"
                stroke="#c29a71"
                strokeWidth="5"
              />
              <path d="M18-5h7M18 5h7" stroke="#c29a71" strokeWidth="4" />
            </g>
          </g>
        )}
        <text
          x="24"
          y="286"
          fill="#b5c1b2"
          opacity=".55"
          fontSize="9"
          letterSpacing="3"
          fontFamily="monospace"
        >
          EXHIBIT / {id === "monopoly" ? "A" : id === "candles" ? "B" : "C"}
        </text>
        <path
          d="M445 24h12v12M23 24v12M23 24h12M445 286h12v-12"
          stroke="#bbc5af"
          opacity=".3"
          fill="none"
        />
      </svg>
    </div>
  );
}
