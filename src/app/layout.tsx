import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
