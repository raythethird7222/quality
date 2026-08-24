import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import GlobalHeader from "@/components/layout/Header";
import GlobalChatbot from "@/components/layout/GlobalChatbot";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QA-REY",
  description: "Quality Assurance Management System",
};

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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var a=localStorage.getItem("app-accent");if(a!=="gold"&&a!=="indigo"&&a!=="crimson"&&a!=="charcoal"){a="indigo";}document.documentElement.dataset.accent=a}catch(e){document.documentElement.dataset.accent="indigo";}})()`,
          }}
        />
      </head>
      <body className="h-screen overflow-hidden flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <GlobalHeader />
            <main className="flex-1 overflow-y-auto">{children}</main>
            <GlobalChatbot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
