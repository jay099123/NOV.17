import { useId } from "react";

const digits = {
  "2": "M20 100C20 35 48 4 98 4C153 4 180 39 180 96C180 143 158 172 127 203L67 265H174V318H4V274L89 182C114 155 130 136 130 101C130 70 120 56 99 56C79 56 68 71 67 100Z",
  "0": "M92 4C154 4 181 52 181 160C181 268 154 318 92 318C30 318 3 268 3 160C3 52 30 4 92 4ZM92 59C64 59 55 86 55 160C55 234 64 263 92 263C120 263 129 234 129 160C129 86 120 59 92 59Z",
  "5": "M20 5H179V60H69L62 124C76 113 87 108 107 108C155 108 182 144 182 207C182 281 151 318 92 318C33 318 5 282 4 218H56C59 249 69 265 92 265C118 265 130 244 130 208C130 171 118 154 94 154C77 154 65 164 58 181H8Z",
  "6": "M177 83H126C122 64 112 56 96 56C68 56 54 82 52 137C65 122 83 114 104 114C154 114 182 148 182 211C182 280 151 318 92 318C29 318 2 269 2 166C2 58 33 4 96 4C147 4 174 32 177 83ZM92 166C67 166 54 182 54 211C54 247 67 266 92 266C117 266 130 247 130 213C130 182 117 166 92 166Z",
};

function warp(x: number, y: number) {
  return { x: x + Math.sin(y / 100) * 38, y: y + Math.sin(x / 210 + y / 330) * 30 };
}

function tilePath(x: number, y: number) {
  const corners = [[x, y], [x + 96, y], [x + 96, y + 80], [x, y + 80]];
  const first = warp(x, y);
  let path = `M${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  corners.forEach(([fromX, fromY], index) => {
    const [toX, toY] = corners[(index + 1) % corners.length];
    const start = warp(fromX, fromY);
    const end = warp(toX, toY);
    const middle = warp((fromX + toX) / 2, (fromY + toY) / 2);
    const controlX = 2 * middle.x - (start.x + end.x) / 2;
    const controlY = 2 * middle.y - (start.y + end.y) / 2;
    path += `Q${controlX.toFixed(2)} ${controlY.toFixed(2)} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  });
  return `${path}Z`;
}

const checkerTiles = Array.from({ length: 8 }, (_, row) =>
  Array.from({ length: 19 }, (_, column) => (row + column) % 2 === 0
    ? tilePath((column - 1) * 96, (row - 1) * 80)
    : null),
).flat().filter((path): path is string => path !== null);

export default function RewindYears() {
  const clipId = `${useId()}-year-checker`;
  return <svg className="intro-years" viewBox="0 0 1440 340" preserveAspectRatio="none" role="img" aria-label="2025–2026">
    <defs>
      <clipPath id={clipId}>
        <path d="M-100 115C240 35 520 210 920 110S1400 25 1540 90V440H-100Z" />
      </clipPath>
    </defs>
    <g className="years-checker" clipPath={`url(#${clipId})`}>
      {checkerTiles.map((path, index) => <path key={index} d={path} />)}
    </g>
    <g className="years-digits" fillRule="evenodd" strokeLinejoin="round" paintOrder="stroke fill">
      {(["2025", "2026"] as const).map((year, yearIndex) => <g key={year} transform={`translate(${yearIndex === 0 ? 65 : 798} 7) skewX(-10)`}>
        {Array.from(year).map((digit, index) => <path key={index} d={digits[digit as keyof typeof digits]} transform={`translate(${index * 145} 0)`} />)}
      </g>)}
      <path d="M713 156H774L767 195H706Z" />
    </g>
    <g className="years-lines" fill="none">
      <path d="M-90 112C260 295 730 182 1530 42" />
      <path d="M-90 189C330 367 770 205 1530 103" />
      <path d="M-60 333C400 174 1010 430 1510 256" />
    </g>
  </svg>;
}
