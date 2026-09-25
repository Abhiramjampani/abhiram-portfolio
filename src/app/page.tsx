import Nav from "@/components/Nav";
import Intro from "@/components/Intro";
import ThemeTransition from "@/components/ThemeTransition";
import SmoothScroll from "@/components/SmoothScroll";
import Reveal from "@/components/Reveal";
import Ambient from "@/components/Ambient";
import Cursor from "@/components/Cursor";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Education from "@/components/sections/Education";
import OpenSource from "@/components/sections/OpenSource";
import Projects from "@/components/sections/Projects";
import Skills from "@/components/sections/Skills";
import Competitive from "@/components/sections/Competitive";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Intro />
      <ThemeTransition />
      <SmoothScroll />
      <Reveal />
      <Ambient />
      <Cursor />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <About />
        <Experience />
        <Education />
        <OpenSource />
        <Projects />
        <Skills />
        <Competitive />
        <Contact />
      </main>
    </>
  );
}
