import { BugOff } from "lucide-react";

const avatarSvg =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23E8E7E5'><rect width='100' height='100'/><text x='50%' y='55%' font-family='sans-serif' font-size='32' font-weight='bold' fill='%232F6798' dominant-baseline='middle' text-anchor='middle'>QA</text></svg>";

export default function Header() {
  return (
    <header className="border-b border-border bg-surface-base/80 backdrop-blur">
      <nav className="navbar mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 md:px-10">
        <div className="nav_branding flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-text-primary">
            OP RAY <span className="text-brand-indigo">ANALYTICS</span>
          </span>
        </div>
        <div id="nav-user-identity" className="user-badge">
          <div className="nav-profile-combo flex items-center gap-3">
            <span className="nav-username text-sm font-medium text-text-primary">
              QAS RAY
            </span>
            <img
              className="nav-avatar h-10 w-10 rounded-full"
              src={avatarSvg}
              alt="QA Avatar Element"
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
