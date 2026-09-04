"use client";

// Settings page: tabbed UI for managing appearance, profile, notifications,
// and account preferences, backed by local persistence and the auth context.

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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
const TABS: {
  key: TabKey;
  label: string;
  description: string;
  icon: typeof UserIcon;
}[] = [
  {
    key: "appearance",
    label: "Appearance",
    description: "Theme, accent, and visual style",
    icon: Palette,
  },
  {
    key: "profile",
    label: "Profile",
    description: "Photo and account details",
    icon: UserIcon,
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Alerts, reminders, and digest",
    icon: Bell,
  },
  {
    key: "account",
    label: "Account",
    description: "Session and sign-out controls",
    icon: ShieldCheck,
  },
];

// Top-level settings view: renders the breadcrumb, header, tab nav, and the
// active panel based on the selected section.
export default function SettingsView() {
  const { user, requestLogout } = useAuth();
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

// Appearance panel: manages theme mode, full theme designs, and accent color,

  // Display name used by the profile panel, falling back to "Operator".
  const name = user.employee_name ?? "Operator";
  const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0];
  const ActiveIcon = activeTab.icon;

  // Page layout: breadcrumb, header, sidebar tabs, and the active panel.
  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="w-full px-6 py-6 md:px-9">
        <Breadcrumb
          backHref="/dashboard"
          segments={[{ label: "Settings" }]}
          accent="indigo"
        />
        <header className="relative mt-4 overflow-hidden rounded-2xl border border-border-default bg-card p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(47,103,152,0.22),transparent_58%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-app-accent-soft text-app-accent ring-1 ring-app-accent/20">
                <ActiveIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="mt-1 text-[28px] font-bold tracking-tight sm:text-[32px]">
                  Settings
                </h1>
                <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-secondary">
                  Manage your appearance, profile, notifications, and account
                  preferences from one place.
                </p>
              </div>
            </div>
            <div className="grid gap-2 text-[12px] sm:grid-cols-2 lg:min-w-[300px]">
              <div className="rounded-xl border border-border-subtle bg-surface-raised/80 px-3 py-2">
                <p className="font-medium text-text-muted">Signed in</p>
                <p className="mt-0.5 truncate font-semibold text-text-primary">
                  {name}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-raised/80 px-3 py-2">
                <p className="font-medium text-text-muted">Current section</p>
                <p className="mt-0.5 font-semibold text-app-accent">
                  {activeTab.label}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <nav
            className="flex gap-2 overflow-x-auto rounded-2xl border border-border-default bg-card p-2 shadow-sm lg:sticky lg:top-20 lg:self-start lg:flex-col lg:overflow-visible"
            aria-label="Settings sections"
          >
            {TABS.map(({ key, label, description, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={tab === key}
                className={`group flex min-w-[190px] shrink-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition lg:min-w-0 ${
                  tab === key
                    ? "border-app-accent bg-app-accent-soft text-app-accent shadow-sm"
                    : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-surface-overlay"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    tab === key
                      ? "bg-app-accent text-white"
                      : "bg-surface-raised text-text-muted group-hover:text-app-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">
                    {label}
                  </span>
                  <span className="mt-0.5 hidden truncate text-[11px] font-medium text-text-muted lg:block">
                    {description}
                  </span>
                </span>
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
                onLogout={() => requestLogout()}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
// persisting selections to localStorage and the document attributes.
function AppearancePanel() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // Persisted accent, read lazily from localStorage so the first client render
  // matches what the inline script already applied (no cascading effect).
  const [accent, setAccent] = useState<Accent>(() =>
    typeof window !== "undefined"
      ? ((localStorage.getItem("app-accent") as Accent) ?? "indigo")
      : "indigo"
  );
  // Active preset design id. Classic is the default when nothing is persisted.
  const [themeDesign, setThemeDesign] = useState<ThemeDesignId>(() =>
    typeof window !== "undefined"
      ? isThemeDesignId(localStorage.getItem("theme-design"))
        ? (localStorage.getItem("theme-design") as ThemeDesignId)
        : "classic"
      : "classic"
  );
  // Tracks client-side hydration so the active-design highlight is applied
  // only after mount (false on the server, true on the client).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Mirror accent selection to the document + localStorage. Mutating external
  // values is only allowed inside an effect, so the side effects live here.
  useEffect(() => {
    document.documentElement.dataset.accent = accent;
    localStorage.setItem("app-accent", accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.dataset.themeDesign = themeDesign;
    localStorage.setItem("theme-design", themeDesign);
  }, [themeDesign]);

  // Applies a full preset design: sets the design, mode, and accent.
  function applyThemeDesign(design: ThemeDesign) {
    setThemeDesign(design.id);
    setTheme(design.mode);
    setAccent(design.accent);
  }

  function reset() {
    setTheme("system");
    setAccent("indigo");
    setThemeDesign("classic");
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
                className={`flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 text-[13px] font-semibold transition ${
                  active
                    ? "border-app-accent bg-app-accent-soft text-app-accent shadow-sm"
                    : "border-border-default bg-surface-raised text-text-secondary hover:bg-surface-overlay"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active ? "bg-app-accent text-white" : "bg-card text-text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {THEME_DESIGNS.map((design) => {
            const active = mounted && activeDesignId === design.id;
            return (
              <button
                key={design.id}
                onClick={() => applyThemeDesign(design)}
                aria-pressed={active}
                className={`flex min-h-[172px] flex-col gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-app-accent bg-app-accent-soft shadow-sm"
                    : "border-border-default bg-surface-raised hover:bg-surface-overlay"
                }`}
              >
                <span
                  className="flex h-16 items-end justify-between rounded-lg border p-2 shadow-inner"
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
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised">
          <div className="h-28 bg-[linear-gradient(135deg,rgba(47,103,152,0.28),rgba(47,103,152,0.08)_45%,rgba(255,255,255,0.18))] dark:bg-[linear-gradient(135deg,rgba(47,103,152,0.38),rgba(47,103,152,0.12)_45%,rgba(255,255,255,0.04))]" />
          <div className="-mt-16 flex flex-col items-center px-5 pb-6 text-center">
            <span className="grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-card bg-surface-raised shadow-lg ring-2 ring-app-accent/25">
              {displayedAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- Stored profile photo
                <img
                  src={displayedAvatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[42px] font-bold text-app-accent">
                  {initials}
                </span>
              )}
            </span>
            <p className="mt-3 max-w-full truncate text-[18px] font-bold text-text-primary">
              {name}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-app-accent px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90"
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
          className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-raised px-4 py-2.5 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay"
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
  // Notification preferences, persisted to localStorage on this device and
  // read lazily so the first render already reflects stored values.
  const [prefs, setPrefs] = useState(() => {
    const defaults = {
      emailAlerts: true,
      desktopAlerts: false,
      weeklyDigest: true,
      evaluationReminders: true,
    };
    if (typeof window === "undefined") return defaults;
    const stored = localStorage.getItem("notification-prefs");
    if (!stored) return defaults;
    try {
      return { ...defaults, ...JSON.parse(stored) };
    } catch {
      return defaults;
    }
  });
  // Tracks client-side hydration so persisted prefs render only after mount.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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
          className="inline-flex items-center gap-2 rounded-lg bg-brand-crimson px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90"
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
    <section className="overflow-hidden rounded-2xl border border-border-default bg-card shadow-sm">
      <div className="border-b border-border-subtle bg-surface-raised/60 px-5 py-4 sm:px-6">
        <h2 className="text-[17px] font-bold text-text-primary">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] leading-5 text-text-secondary">
            {description}
          </p>
        )}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
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
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-text-primary">{label}</p>
        {description && (
          <p className="mt-0.5 text-[12px] leading-5 text-text-muted">
            {description}
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent ${
          checked ? "bg-app-accent" : "bg-border-default"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
