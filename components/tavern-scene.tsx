import { useId } from "react";

export function TavernScene() {
  const id = useId().replaceAll(":", "");
  return (
    <div className="tavern-scene" aria-hidden="true">
      <svg viewBox="0 0 620 405" fill="none" role="presentation">
        <defs>
          <radialGradient id={`${id}-glow`}>
            <stop stopColor="#d6a64e" stopOpacity=".32" />
            <stop offset="1" stopColor="#d6a64e" stopOpacity="0" />
          </radialGradient>
          <pattern
            id={`${id}-hatch`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-24)"
          >
            <path d="M0 0v8" stroke="#1a1714" strokeWidth="1" opacity=".25" />
          </pattern>
        </defs>
        <ellipse
          cx="377"
          cy="205"
          rx="219"
          ry="183"
          fill={`url(#${id}-glow)`}
        />
        <path
          d="M42 348L78 200l-14-93 26 76 11-72-9 116 33-27-36 49-17 99M558 354l-22-107-43-39 32 10-16-94 31 80 24-48-10 96 43-29-35 49 26 87"
          fill="#121713"
          stroke="#7c7962"
          strokeOpacity=".45"
          strokeWidth="2"
        />
        <path
          d="M137 147l-44-50 22 57M93 98L67 62M546 210l29-87 26-24M574 129l-9-41M486 108l38-53-8-30"
          stroke="#575b48"
          strokeWidth="2"
        />
        <path
          d="M230 121l45-44 8-39 35 53 111 52 17 177-211 17z"
          fill="#8e7a53"
          stroke="#171916"
          strokeWidth="5"
        />
        <path
          d="M222 134l65-62 163 72-21-2-144-45-39 51z"
          fill="#332e23"
          stroke="#111511"
          strokeWidth="5"
        />
        <path
          d="M246 140l54-36 130 48-1 147-186 19z"
          fill={`url(#${id}-hatch)`}
        />
        <path
          d="M261 151l-8 157M292 113l17 195M249 211l182-18M303 115l126 178M250 295l60-80M344 128l78 63M405 144l-97 70"
          stroke="#3a3021"
          strokeWidth="9"
        />
        <path
          d="M338 318l-5-82 38-13 18 13 10 79z"
          fill="#22271f"
          stroke="#1a1914"
          strokeWidth="4"
        />
        <path
          d="M344 248l4 61M358 239l10 69M375 243l10 63"
          stroke="#76623e"
          strokeWidth="2"
        />
        <path
          d="M341 158l44 7 2 40-42-4z"
          fill="#dcab50"
          stroke="#201d16"
          strokeWidth="5"
        />
        <path
          d="M365 163l-1 38M344 181l41 7"
          stroke="#41341d"
          strokeWidth="4"
        />
        <path
          d="M275 158l19 3 1 33-25 1z"
          fill="#9aab74"
          stroke="#24271a"
          strokeWidth="4"
        />
        <path
          d="M262 91l-4-46 29 3 5 40"
          fill="#514737"
          stroke="#171a15"
          strokeWidth="5"
        />
        <path
          d="M252 43l40 3 3 11-46-6z"
          fill="#797052"
          stroke="#171a15"
          strokeWidth="3"
        />
        <path
          d="M274 29c-29-34 36-21 12-51"
          stroke="#919375"
          strokeWidth="2"
          strokeDasharray="4 5"
        />
        <path d="M181 350q129-50 335-10l43 21-406 4z" fill="#171b15" />
        <path
          d="M210 313l28 1-5 27-29 2zM198 345l73-9 8 18-89 7z"
          fill="#7c4c38"
          stroke="#161a13"
          strokeWidth="4"
        />
        <path d="M213 325l21-2M206 348l59-3" stroke="#c4ad77" strokeWidth="6" />
        <path
          d="M404 295q-14 61 31 72h65q37-22 20-79z"
          fill="#272d25"
          stroke="#121810"
          strokeWidth="6"
        />
        <ellipse
          cx="461"
          cy="293"
          rx="61"
          ry="14"
          fill="#48573b"
          stroke="#10170f"
          strokeWidth="5"
        />
        <ellipse cx="461" cy="291" rx="48" ry="7" fill="#9da568" />
        <path
          d="M405 312q-26-21-28 4t30 16M521 313q21-24 26 0t-23 21M426 361l-9 21M498 362l10 17"
          stroke="#181c15"
          strokeWidth="8"
        />
        <path
          d="M423 315q-4 23 10 33M431 320l3 13"
          stroke="#626846"
          strokeWidth="3"
        />
        <g className="cauldron-steam">
          <path
            d="M442 265c-43-40 53-42 4-83M476 274c42-41-25-47 6-94M465 254c-19-38 39-59-5-86"
            stroke="#a4ad7b"
            strokeOpacity=".65"
            strokeWidth="2"
          />
          <path
            d="M454 155c-32-7-30-41 0-42 36-1 46 36 14 46l-8 16M459 189l1 5"
            stroke="#c4c698"
            strokeOpacity=".55"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <path
          d="M284 344l38-8 10 20-40 6z"
          fill="#d9c391"
          stroke="#332a1b"
          strokeWidth="3"
        />
        <path d="M297 346l16-3M300 351l16-3" stroke="#806540" />
        <path
          d="M310 276l-4 64 14-1 5-63z"
          fill="#cbbd89"
          stroke="#25291c"
          strokeWidth="3"
        />
        <path d="M310 296l6-13 4 12" stroke="#f3d695" strokeWidth="3" />
        <path
          d="M316 278c-24-10-5-25 2-40-2 16 24 28-2 40z"
          fill="#d99637"
          stroke="#3f3821"
          strokeWidth="2"
        />
        <path d="M317 274q-8-5 0-20 8 15 0 20" fill="#f0dba0" />
        <path
          d="M126 340q-9-50 25-84l16 32 17-24q34 27 13 78z"
          fill="#1c2119"
          stroke="#6c7251"
          strokeWidth="2"
        />
        <path d="M145 290l11 4-10 6M171 292l9-3-3 9" fill="#e4c370" />
        <path
          d="M512 72q-7-36 14-36 17 0 12 27l20 17-42 8-17-15z"
          fill="#141912"
          stroke="#777857"
          strokeWidth="2"
        />
        <path
          d="M536 49l19 9-16 5"
          fill="#9f9365"
          stroke="#10160f"
          strokeWidth="2"
        />
        <circle cx="532" cy="47" r="2" fill="#ddc68f" />
        <path
          d="M517 78l-6 20M529 80l3 16M500 98l45-3"
          stroke="#95835c"
          strokeWidth="2"
        />
        <path
          d="M162 71l3-8 3 8 8 3-8 3-3 8-3-8-8-3zM391 48l2-5 2 5 5 2-5 2-2 5-2-5-5-2z"
          fill="#a69a6c"
        />
        <path
          d="M124 366q14-23 30 0z"
          fill="#a27652"
          stroke="#191d13"
          strokeWidth="3"
        />
        <path d="M137 365l-2 17" stroke="#ab9d74" strokeWidth="5" />
        <path
          d="M188 375l-9-16M184 373l13-20M536 367l6-23M538 366l17-8M104 335l8-28M109 330l16-13"
          stroke="#7d7f52"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
