"use client";

// Settings page: tabbed UI for managing appearance, profile, notifications,
// and account preferences, backed by local persistence and the auth context.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Image as ImageIcon,
  Laptop,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useAuth } from "@/features/auth/context/AuthContext";
import Breadcrumb from "@/components/shared/Breadcrumb";
import AvatarCropModal from "@/components/ui/avatar-crop-modal";
import { ACCENT_HEX } from "@/features/settings/config";
import { THEME_DESIGNS, isThemeDesignId, type ThemeDesign, type ThemeDesignId } from "@/features/settings/themeDesigns";
import type { Accent } from "@/types";

// Accent keys offered in the Appearance panel.
const ACCENTS: Accent[] = ["gold", "indigo", "crimson", "charcoal"];

// Identifiers for the four settings sections.
type TabKey = "appearance" | "profile" | "notifications" | "account";

// Sidebar navigation entries, each tied to a TabKey and icon.
const TABS: { key: TabKey; label: string; icon: typeof UserIcon }[] = [
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "account", label: "Account", icon: ShieldCheck },
];

// Fallback avatar shown when a user has no uploaded photo.
const avatarSvg =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23E8E7E5'><rect width='100' height='100'/><text x='50%' y='55%' font-family='sans-serif' font-size='32' font-weight='bold' fill='%232F6798' dominant-baseline='middle' text-anchor='middle'>QA</text></svg>";

// Top-level settings view: renders the breadcrumb, header, tab nav, and the
// active panel based on the selected section.
export default function SettingsView() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  // Tracks the currently selected settings section.
  const [tab, setTab] = useState<TabKey>("appearance");

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[14px] text-text-secondary">
          Please sign in to view settings.
        </p>
      </div>
    );
  }

  // Display name used by the profile panel, falling back to "Operator".
  const name = user.employee_name ?? "Operator";

  // Page layout: breadcrumb, header, sidebar tabs, and the active panel.
  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-6 md:px-9">
        <Breadcrumb
          backHref="/dashboard"
          segments={[{ label: "Settings" }]}
          accent="indigo"
        />
        <header className="mt-4 border-b border-border-subtle pb-4">
          <h1 className="text-[28px] font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Manage your appearance, profile, and account preferences.
          </p>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <nav
            className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible"
            aria-label="Settings sections"
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[13px] font-semibold transition ${
                  tab === key
                    ? "border-app-accent bg-app-accent-soft text-app-accent"
                    : "border-border-default bg-card text-text-secondary hover:bg-surface-overlay"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>

          <section className="min-w-0">
            {/* Render the panel for the selected tab. */}
            {tab === "appearance" && <AppearancePanel />}
            {tab === "profile" && <ProfilePanel name={name} />}
            {tab === "notifications" && <NotificationsPanel />}
            {tab === "account" && (
              <AccountPanel
                onLogout={() => {
                  logout();
                  router.push("/login");
                }}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// Appearance panel: manages theme mode, full theme designs, and accent color,
// persisting selections to localStorage and the document attributes.
function AppearancePanel() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // Currently selected accent, mirrored from localStorage on mount.
  const [accent, setAccentState] = useState<Accent>("indigo");
  // Active preset design id, or null when no preset is applied.
  const [themeDesign, setThemeDesignState] = useState<ThemeDesignId | null>(null);
  // Tracks client-side mount so persisted prefs are read after hydration.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedAccent = (localStorage.getItem("app-accent") as Accent) ?? "indigo";
    const storedDesign = localStorage.getItem("theme-design");
    setAccentState(storedAccent);
    setThemeDesignState(isThemeDesignId(storedDesign) ? storedDesign : null);
    document.documentElement.dataset.accent = storedAccent;
    if (isThemeDesignId(storedDesign)) {
      document.documentElement.dataset.themeDesign = storedDesign;
    }
    setMounted(true);
  }, []);

  function setAccent(next: Accent) {
    setAccentState(next);
    localStorage.setItem("app-accent", next);
    document.documentElement.dataset.accent = next;
  }

  function setThemeDesign(design: ThemeDesign) {
    setThemeDesignState(design.id);
    localStorage.setItem("theme-design", design.id);
    document.documentElement.dataset.themeDesign = design.id;
    setTheme(design.mode);
    setAccent(design.accent);
  }

  function reset() {
    setTheme("system");
    setAccent("indigo");
    setThemeDesignState(null);
    localStorage.removeItem("theme-design");
    delete document.documentElement.dataset.themeDesign;
  }

  // Available theme modes with their display labels and icons.
  const themeOptions: { value: typeof theme; label: string; icon: typeof Sun }[] =
    [
      { value: "light", label: "Light", icon: Sun },
      { value: "dark", label: "Dark", icon: Moon },
      { value: "system", label: "System", icon: Monitor },
    ];

  // Resolves the active design id only while it still matches mode + accent.
  const activeDesignId =
    themeDesign &&
    THEME_DESIGNS.find(
      (d) => d.id === themeDesign && d.mode === resolvedTheme && d.accent === accent
    )
      ? themeDesign
      : null;

  return (
    <div className="space-y-6">
      {/* Theme mode selection (light / dark / system). */}
      <Card
        title="Theme"
        description="Choose how QA-REY looks. System follows your device setting."
      >
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(({ value, label, icon: Icon }) => {
            const active = theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-[13px] font-semibold transition ${
                  active
                    ? "border-app-accent bg-app-accent-soft text-app-accent"
                    : "border-border-default bg-card text-text-secondary hover:bg-surface-overlay"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] text-text-muted">
          Active appearance: {resolvedTheme} mode
        </p>
      </Card>

      {/* One-tap complete theme designs. */}
      <Card
        title="Themes Design"
        description="Apply a complete look in one tap — it sets the mode, accent, and surface palette together. Fine-tune with the options below."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEME_DESIGNS.map((design) => {
            const active = mounted && activeDesignId === design.id;
            return (
              <button
                key={design.id}
                onClick={() => setThemeDesign(design)}
                aria-pressed={active}
                className={`flex flex-col gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-app-accent bg-app-accent-soft"
                    : "border-border-default bg-card hover:bg-surface-overlay"
                }`}
              >
                <span
                  className="flex h-14 items-end justify-between rounded-lg border p-2"
                  style={{
                    backgroundColor: design.preview,
                    borderColor: active ? ACCENT_HEX[design.accent] : "transparent",
                  }}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: ACCENT_HEX[design.accent] }}
                  />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color: design.mode === "dark" ? "#E4E7EC" : "#1C1D20",
                    }}
                  >
                    {design.mode}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-text-primary">
                    {design.name}
                  </span>
                  {active && (
                    <Check className="h-4 w-4 shrink-0 text-app-accent" />
                  )}
                </span>
                <span className="text-[11px] leading-snug text-text-muted">
                  {design.description}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Accent color picker. */}
      <Card
        title="Accent color"
        description="Personalize highlights, buttons, and active states across the app."
      >
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => {
            const active = mounted && accent === a;
            return (
              <button
                key={a}
                onClick={() => setAccent(a)}
                aria-label={`Use ${a} accent`}
                aria-pressed={active}
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                  active ? "border-text-primary" : "border-transparent"
                }`}
                style={{ backgroundColor: ACCENT_HEX[a] }}
              >
                {active && <Check className="h-5 w-5 text-white" />}
              </button>
            );
          })}
        </div>
      </Card>

      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-card px-4 py-2.5 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay"
      >
        <RotateCcw className="h-4 w-4" />
        Reset appearance
      </button>
    </div>
  );
}

// Profile panel: lets the user update their photo and review account details.
function ProfilePanel({ name }: { name: string }) {
  const { user, updateUser } = useAuth();
  // Hidden file input that opens the OS photo picker.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Preview of the newly chosen avatar before it is saved.
  const [avatarImage, setAvatarImage] = useState<string | null>(
    user?.avatar_url ?? null
  );
  // Source image handed to the crop modal, or null when the modal is closed.
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  // True while the avatar upload request is in flight.
  const [avatarSaving, setAvatarSaving] = useState(false);
  // Error message returned from the avatar save request, if any.
  const [avatarError, setAvatarError] = useState<string | null>(null);

  if (!user) return null;

  // Up-to-two-letter initials used for the fallback avatar.
  const initials = name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Avatar to render: new upload first, then saved URL, then none.
  const displayedAvatar = avatarImage ?? user?.avatar_url ?? null;

  // Reads the picked file as a data URL and opens the crop modal.
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  // Uploads the cropped avatar to the API and updates the session user.
  async function handleAvatarSave(dataUrl: string) {
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to save avatar");
      }
      setAvatarImage(data.avatarUrl);
      updateUser({ avatar_url: data.avatarUrl });
      setCropImageSrc(null);
    } catch (error) {
      setAvatarError(
        error instanceof Error ? error.message : "Failed to save avatar"
      );
    } finally {
      setAvatarSaving(false);
    }
  }

  // Assigned accounts rendered as chips in the profile details list.
  const accounts = user.accounts ?? [];

  return (
    <div className="space-y-6">
      <Card title="Profile photo" description="Update the photo shown on your account.">
        <div className="flex items-center gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-app-accent bg-surface-raised">
            {displayedAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- Stored profile photo
              <img
                src={displayedAvatar}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[28px] font-bold text-app-accent">
                {initials}
              </span>
            )}
          </span>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-app-accent px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
            >
              <ImageIcon className="h-4 w-4" />
              Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="mt-2 text-[12px] text-text-muted">
              JPG, PNG or GIF. Square images work best.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Details" description="Your account information.">
        <dl className="divide-y divide-border-subtle">
          <Field label="Full name" value={user.employee_name} />
          <Field label="Email" value={user.employee_email} />
          <Field label="Employee code" value={user.employee_code} />
          <Field label="Role" value={user.role_name || user.role} />
          <Field label="Primary account" value={user.account} />
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[13px] font-medium text-text-secondary">
              Assigned accounts
            </dt>
            <dd className="text-right text-[13px] font-semibold text-text-primary">
              {accounts.length === 0 ? (
                <span className="text-text-muted">None</span>
              ) : (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {accounts.map((a) => (
                    <span
                      key={a.account}
                      className="rounded-full bg-surface-overlay px-2.5 py-0.5 text-[12px] font-medium text-text-primary"
                    >
                      {a.account}
                    </span>
                  ))}
                </div>
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <Card title="Sessions" description="Quick access to your workspace.">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-card px-4 py-2.5 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay"
        >
          <Laptop className="h-4 w-4" />
          Go to dashboard
        </Link>
      </Card>

      {cropImageSrc && (
        <AvatarCropModal
          open
          imageSrc={cropImageSrc}
          saving={avatarSaving}
          error={avatarError}
          onCancel={() => {
            setCropImageSrc(null);
            setAvatarError(null);
          }}
          onSave={handleAvatarSave}
        />
      )}
    </div>
  );
}

// Notifications panel: toggles for email, desktop, digest, and reminder prefs.
function NotificationsPanel() {
  // Notification preferences, persisted to localStorage on this device.
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    desktopAlerts: false,
    weeklyDigest: true,
    evaluationReminders: true,
  });
  // Tracks client mount so stored prefs are applied after hydration.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("notification-prefs");
    if (stored) {
      try {
        setPrefs({ ...prefs, ...JSON.parse(stored) });
      } catch {
        /* ignore malformed */
      }
    }
    setMounted(true);
  }, []);

  function update(key: keyof typeof prefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem("notification-prefs", JSON.stringify(next));
  }

  return (
    <Card
      title="Notifications"
      description="Choose what updates you want to receive. Preferences are saved on this device."
    >
      <div className="divide-y divide-border-subtle">
        <ToggleRow
          label="Email alerts"
          description="Receive QA evaluation and account alerts by email."
          checked={mounted && prefs.emailAlerts}
          onChange={(v) => update("emailAlerts", v)}
        />
        <ToggleRow
          label="Desktop notifications"
          description="Show browser notifications for new activity."
          checked={mounted && prefs.desktopAlerts}
          onChange={(v) => update("desktopAlerts", v)}
        />
        <ToggleRow
          label="Weekly digest"
          description="A summary of team performance every week."
          checked={mounted && prefs.weeklyDigest}
          onChange={(v) => update("weeklyDigest", v)}
        />
        <ToggleRow
          label="Evaluation reminders"
          description="Remind me about pending evaluations and follow-ups."
          checked={mounted && prefs.evaluationReminders}
          onChange={(v) => update("evaluationReminders", v)}
        />
      </div>
    </Card>
  );
}

// Account panel: shows session details and the sign-out action.
function AccountPanel({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card title="Account" description="Your signed-in session details.">
        <dl className="divide-y divide-border-subtle">
          <Field label="Signed in as" value={user.employee_name} />
          <Field label="Email" value={user.employee_email} />
          <Field label="Role" value={user.role_name || user.role} />
        </dl>
      </Card>

      <Card title="Sign out" description="End your session on this device.">
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-crimson px-4 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </Card>
    </div>
  );
}

// Reusable card wrapper used to group each settings section.
function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border-default bg-card p-6 shadow-sm">
      <h2 className="text-[17px] font-bold text-text-primary">{title}</h2>
      {description && (
        <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Key/value row used inside the profile and account detail lists.
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-[13px] font-medium text-text-secondary">{label}</dt>
      <dd className="text-right text-[13px] font-semibold text-text-primary">
        {value || <span className="text-text-muted">Not provided</span>}
      </dd>
    </div>
  );
}

// Switch row used for each notification preference.
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="text-[14px] font-semibold text-text-primary">{label}</p>
        {description && (
          <p className="mt-0.5 text-[12px] text-text-muted">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-app-accent" : "bg-border-default"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
