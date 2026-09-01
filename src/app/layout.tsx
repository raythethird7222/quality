// Root layout: sets up fonts, theme providers, and the global application shell.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

// Loads the Geist sans-serif font and exposes it as a CSS variable.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Loads the Geist monospace font and exposes it as a CSS variable.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// App-wide metadata used for document title and description.
export const metadata: Metadata = {
  title: "QA-Tool",
  description: "Quality Assurance Management System",
  icons: {
    icon: [
      { url: "/logo.png", media: "(prefers-color-scheme: light)" },
      {
        url: "/logo_dark_mode.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/logo_dark_mode.png",
        media: '(data-accent="charcoal")',
      },
    ],
  },
};

// Defines the HTML document, injects theme scripts, and wraps children in providers.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the persisted theme (dark/light) before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`,
          }}
        />
        {/* Applies the persisted accent color to the document element. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var a=localStorage.getItem("app-accent");if(a!=="gold"&&a!=="indigo"&&a!=="crimson"&&a!=="charcoal"){a="indigo";}document.documentElement.dataset.accent=a}catch(e){document.documentElement.dataset.accent="indigo";}})()`,
          }}
        />
        {/* Applies the persisted theme design variant to the document element. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=localStorage.getItem("theme-design");var ids=["classic","midnight","editorial","sunset","slate","meadow"];if(ids.indexOf(d)===-1){d="classic";}document.documentElement.dataset.themeDesign=d}catch(e){document.documentElement.dataset.themeDesign="classic";}})()`,
          }}
        />
      </head>
      {/* Full-height shell: providers wrap the persistent AppShell and routed children. */}
      <body className="h-screen overflow-hidden flex antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
