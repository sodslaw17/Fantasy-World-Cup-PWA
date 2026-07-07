import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign in — WC26 Pool" };

const KEYART = ["#E4002B","#7C3AED","#A3E635","#FF7A00","#1D4ED8","#14B8A6","#FFC400","#00A859","#EC4899","#22D3EE","#6D28D9","#F97316"];

function KeyArt({ cx = 195, cy = 150, width = 390, height = 560 }: {
  cx?: number; cy?: number; width?: number; height?: number;
}) {
  const rings: { s: number; color: string }[] = [];
  let idx = 0;
  for (let s = 560; s >= 0; s -= 30, idx++) rings.push({ s, color: KEYART[idx % KEYART.length] });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full block">
      <rect width={width} height={height} fill={KEYART[0]} />
      {rings.map((r, i) => (
        <rect key={i} x={cx - r.s} y={cy - r.s} width={r.s * 2} height={r.s * 2} rx={r.s * 0.46} ry={r.s * 0.46} fill={r.color} />
      ))}
      <rect x="0" y={cy - 1} width={width} height="2" fill="rgba(255,255,255,.22)" />
    </svg>
  );
}

function Trophy() {
  return (
    <div className="relative w-[182px] [filter:drop-shadow(0_20px_42px_rgba(0,0,0,.38))]">
      <svg width={182} height={274} viewBox="0 0 200 300" className="block" aria-hidden="true">
        <path d="M14 56 C14 28 48 16 100 16 C152 16 186 28 186 56 C186 110 154 156 100 156 C46 156 14 110 14 56 Z" fill="#fff" />
        <path d="M82 150 C80 182 74 206 66 224 L134 224 C126 206 120 182 118 150 Z" fill="#fff" />
        <path d="M58 218 H142 C150 218 156 224 156 232 L156 240 C156 248 150 254 142 254 H58 C50 254 44 248 44 240 L44 232 C44 224 50 218 58 218 Z" fill="#fff" />
        <path d="M40 250 H160 C166 250 170 254 170 262 L170 272 C170 280 164 286 156 286 H44 C36 286 30 280 30 272 L30 262 C30 254 34 250 40 250 Z" fill="#fff" />
      </svg>
      <div className="absolute inset-x-0 top-[4%] h-[48%] flex flex-col items-center justify-center gap-[3px] font-display font-bold uppercase text-black leading-[1.02]">
        <span className="text-2xl whitespace-nowrap">World Cup</span>
        <span className="text-2xl whitespace-nowrap">2026</span>
        <span className="text-[19px] whitespace-nowrap mt-1 text-[#1a1a1a]">Fantasy League</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 relative overflow-hidden bg-[#0B0C0F] h-dvh flex flex-col">
      <KeyArt cx={195} cy={150} />

      {/* Trophy centered on the color bullseye */}
      <div className="absolute top-[70px] inset-x-0 flex justify-center z-[2]">
        <Trophy />
      </div>

      {/* White form sheet — keeps copy on white for WCAG AA */}
      <div className="absolute inset-x-0 bottom-0 z-[3] bg-surface rounded-t-[30px] [box-shadow:0_-18px_50px_rgba(0,0,0,.22)]">
        <LoginForm />
      </div>
    </div>
  );
}
