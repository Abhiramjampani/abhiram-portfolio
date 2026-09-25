import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are self-hosted (variable, Latin subset) so builds never depend on fetching Google Fonts.
const cinzel = localFont({
  variable: "--font-cinzel",
  src: [{ path: "./fonts/cinzel-latin-wght-normal.woff2", weight: "400 900", style: "normal" }],
  display: "swap",
});

const cormorant = localFont({
  variable: "--font-cormorant",
  src: [
    { path: "./fonts/cormorant-garamond-latin-wght-normal.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-wght-italic.woff2", weight: "300 700", style: "italic" },
  ],
  display: "swap",
});

const inter = localFont({
  variable: "--font-inter",
  src: [{ path: "./fonts/inter-latin-wght-normal.woff2", weight: "100 900", style: "normal" }],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Abhiram Jampani — Compiler Engineer at NVIDIA",
  description:
    "Portfolio of Abhiram Jampani, Compiler Engineer at NVIDIA. GPU compiler toolchains, CDC for distributed databases, and high-performance C++.",
  openGraph: {
    title: "Abhiram Jampani — Compiler Engineer at NVIDIA",
    description: "GPU compiler toolchains, distributed databases and high-performance C++.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080b10",
};

// Applies the saved house theme before first paint to avoid a colour flash.
const themeScript = `try{var t=localStorage.getItem('house');if(t==='targaryen'||t==='stark')document.documentElement.dataset.theme=t;}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="stark"
      suppressHydrationWarning
      className={`${cinzel.variable} ${cormorant.variable} ${inter.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="grain">{children}</body>
    </html>
  );
}
