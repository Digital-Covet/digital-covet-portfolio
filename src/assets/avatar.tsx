import * as React from "react";
const SVGComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 256 256"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    preserveAspectRatio="xMidYMid"
    {...props}
  >
    <g strokeWidth={0} />
    <g strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <radialGradient
        cx="26.196%"
        cy="9.36%"
        fx="26.196%"
        fy="9.36%"
        r="105.51%"
        gradientTransform="matrix(.52886 .8454 -.8487 .5268 .203 -.177)"
        id="a"
      >
        <stop stopColor="#51c3f7" offset="0%" />
        <stop stopColor="#046cf4" offset="100%" />
      </radialGradient>
      <radialGradient
        cx="-15.313%"
        cy="-13.633%"
        fx="-15.313%"
        fy="-13.633%"
        r="181.001%"
        gradientTransform="matrix(.9647 .23955 -.26337 .87744 -.041 .02)"
        id="d"
      >
        <stop stopColor="#fff" offset="0%" />
        <stop stopColor="#5cb5ff" offset="100%" />
      </radialGradient>
      <radialGradient
        cx="69.551%"
        cy="-14.976%"
        fx="69.551%"
        fy="-14.976%"
        r="205.05%"
        gradientTransform="matrix(-.45604 .51346 -.88996 -.26311 .88 -.546)"
        id="e"
      >
        <stop stopColor="#fff" offset="0%" />
        <stop stopColor="#7ac2ff" offset="100%" />
      </radialGradient>
      <radialGradient
        cx="40.071%"
        cy="19.981%"
        fx="40.071%"
        fy="19.981%"
        r="98.92%"
        gradientTransform="matrix(.5143 .57232 -.8576 .34322 .366 -.098)"
        id="f"
      >
        <stop stopColor="#fff" offset="0%" />
        <stop stopColor="#cbe7ff" offset="100%" />
      </radialGradient>
      <path
        d="M127.755 256c70.416 0 127.5-57.307 127.5-128 0-70.692-57.084-128-127.5-128C57.338 0 .255 57.308.255 128s57.083 128 127.5 128"
        id="b"
      />
    </defs>
    <path
      d="M127.755 256c70.416 0 127.5-57.307 127.5-128 0-70.692-57.084-128-127.5-128C57.338 0 .255 57.308.255 128s57.083 128 127.5 128"
      fill="url(#a)"
    />
    <mask id="c" fill="#fff">
      <use xlinkHref="#b" />
    </mask>
    <g />
    <path
      fill="#e8f5ff"
      mask="url(#c)"
      d="m136.982 58.764 57.763 61.09-49.756-11.636z"
    />
    <path
      d="m138.379 67.243 14.525 42.993-8.211-2.018z"
      fill="#64a4d8"
      mask="url(#c)"
    />
    <path
      fill="url(#d)"
      mask="url(#c)"
      d="M21.364 140.8-94 13.964 6.172 35.907z"
    />
    <path
      fill="url(#e)"
      mask="url(#c)"
      d="M159.488 196.997 136.503 58.764 79.735 127.88z"
    />
    <path
      d="m89.116 116.735 34.936 43.464-37.688-40.054z"
      fill="#4492d2"
      mask="url(#c)"
    />
    <path
      fill="url(#f)"
      mask="url(#c)"
      d="m56.725 335.585-97.279-226.846L4.621 35.491l155.09 161.683z"
    />
  </svg>
);
export default SVGComponent;
