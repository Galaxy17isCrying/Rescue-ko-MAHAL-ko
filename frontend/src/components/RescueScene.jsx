export default function RescueScene({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 760 460"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="scene-sky" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f8ddd2" />
          <stop offset="1" stopColor="#e9b5a7" />
        </linearGradient>
        <linearGradient id="scene-road" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#59615c" />
          <stop offset="1" stopColor="#343e3b" />
        </linearGradient>
      </defs>
      <rect width="760" height="460" fill="url(#scene-sky)" />
      <circle className="scene-sun" cx="615" cy="88" r="44" fill="#fff3db" opacity=".8" />
      <path d="M0 235 105 165l90 63 111-95 110 102 125-82 92 64 127-47v290H0Z" fill="#9cad8c" />
      <path d="m0 279 119-76 103 58 112-88 121 100 115-73 91 61 99-26v225H0Z" fill="#6f876d" />
      <path d="M0 314c110-24 185-13 282 4 120 22 222-31 478-24v166H0Z" fill="#74866b" />
      <g fill="#eac4a9" stroke="#fff1df" strokeWidth="5" strokeLinejoin="round">
        <path d="m65 253 74-56 77 56v91H65Z" />
        <path d="m228 242 80-62 82 62v105H228Z" />
        <path d="m418 251 69-52 72 52v86H418Z" />
        <path d="m556 239 70-52 73 52v87H556Z" />
      </g>
      <g fill="#b75848">
        <path d="m52 255 87-68 89 68-9 12-80-60-78 60Z" />
        <path d="m214 244 94-72 96 72-9 12-87-65-84 65Z" />
        <path d="m405 252 82-64 85 64-9 12-76-57-73 57Z" />
        <path d="m543 241 83-63 87 63-9 12-78-57-75 57Z" />
      </g>
      <g fill="#54704f">
        <path d="M34 322c0-17 13-31 29-31s29 14 29 31v42H34Z" />
        <path d="M111 305c0-21 16-38 35-38s35 17 35 38v54h-70Z" />
        <path d="M653 316c0-19 15-35 33-35s33 16 33 35v46h-66Z" />
      </g>
      <g fill="#c6a47e">
        <rect x="57" y="291" width="12" height="20" rx="2" />
        <rect x="135" y="271" width="14" height="24" rx="2" />
        <rect x="675" y="280" width="14" height="23" rx="2" />
      </g>
      <path d="M0 372c160-37 233-25 342 10 126 41 218 30 418-29v107H0Z" fill="url(#scene-road)" />
      <path className="scene-road-markings" d="M0 406c170-34 235-17 340 14 119 35 237 29 420-20" fill="none" stroke="#f8e9c9" strokeWidth="5" strokeDasharray="32 28" opacity=".85" />
      <g transform="translate(458 328)">
        <path d="M0 24h112l26 25v40H0Z" fill="#fff8ef" />
        <path d="M99 24h13l26 25H99Z" fill="#e8e2d7" />
        <path d="M13 38h34v24H13Z" rx="3" fill="#adc4ca" />
        <path d="M57 38h30v24H57Z" rx="3" fill="#adc4ca" />
        <path d="M59 66h42v8H59Z" fill="#e14138" />
        <path d="M7 64h12v8H7ZM116 64h14v8h-14Z" fill="#eb5948" />
        <rect className="scene-siren-light" x="52" y="9" width="28" height="8" rx="4" fill="#e14138" />
        <circle cx="26" cy="89" r="12" fill="#303a38" />
        <circle cx="111" cy="89" r="12" fill="#303a38" />
        <circle cx="26" cy="89" r="5" fill="#e9e2d4" />
        <circle cx="111" cy="89" r="5" fill="#e9e2d4" />
        <path d="M58 44v15m-7-8h14" stroke="#e14138" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g className="scene-person scene-person-resident">
        <ellipse cx="318" cy="386" rx="22" ry="3" fill="#303a38" opacity=".18" />
        <path d="M309 329c6 4 15 4 23 0l3 22 8 28-5 5h-13l-9-24-8 24h-13l-4-4 9-30 3-17Z" fill="#18243c" />
        <path d="m295 379 13 1-1 5h-17q-3-2 0-4Zm30 1 13-2 8 5q2 3-2 4h-18Z" fill="#b8463d" />
        <path d="M310 300c5-3 14-3 20 1l6 8-2 23c-9 5-22 5-31 0l-2-23Z" fill="#dc4a3e" stroke="#ad3b34" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m316 298 1 9 5 4 5-5-1-8Z" fill="#f3c6a8" />
        <path d="m311 304-5 5-4 15-6 8m34-27 5 7 3 14" fill="none" stroke="#f3c6a8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m296 331-4 3m51-5 3 4" fill="none" stroke="#f3c6a8" strokeWidth="3" strokeLinecap="round" />
        <path d="M310 281c0-7 4-11 10-11 7 0 11 4 11 11v4c0 6-5 10-11 10s-10-4-10-10Z" fill="#f3c6a8" />
        <path d="M309 281c-1-8 4-13 12-13 7 0 11 4 12 10l-4 1-5-4-6 2-4 5Z" fill="#26332e" />
        <path d="m315 297 5 5 5-5" fill="none" stroke="#f7dfcf" strokeWidth="2" strokeLinecap="round" />
        <circle cx="328" cy="282" r="1.2" fill="#26332e" />
      </g>
      <g className="scene-person scene-person-volunteer">
        <ellipse cx="379" cy="386" rx="20" ry="3" fill="#303a38" opacity=".18" />
        <path d="M371 334c6 3 14 3 21 0l2 20 7 26-4 5h-12l-8-22-8 22h-12l-3-4 8-29 2-16Z" fill="#344252" />
        <path d="m357 380 12 1-1 5h-15q-3-2 0-4Zm30 1 12-2 7 5q2 3-2 4h-16Z" fill="#4a554c" />
        <path d="M371 305c5-3 13-3 19 1l5 8-1 21c-8 5-20 5-29 0l-1-21Z" fill="#75937d" stroke="#526f5b" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="m376 302 1 8 5 4 5-5-1-8Z" fill="#c88865" />
        <path d="m372 309-5 5-3 13-5 7m31-25 5 6 2 14" fill="none" stroke="#c88865" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m359 334-3 3m43-4 3 3" fill="none" stroke="#c88865" strokeWidth="3" strokeLinecap="round" />
        <path d="M372 286c0-7 4-11 10-11 7 0 11 5 11 11v4c0 6-5 10-11 10s-10-4-10-10Z" fill="#c88865" />
        <path d="M371 286c-1-8 4-13 12-13 7 0 11 4 12 10l-4 1-5-4-6 2-4 5Z" fill="#26332e" />
        <path d="m377 300 5 4 4-4" fill="none" stroke="#f0d7c6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="389" cy="287" r="1.2" fill="#26332e" />
      </g>
      <path d="M0 0h760v460H0Z" fill="none" stroke="#fffaf4" strokeWidth="12" opacity=".42" />
    </svg>
  );
}
