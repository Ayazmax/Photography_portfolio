import Cursor from "@/components/Cursor";
import GrainOverlay from "@/components/GrainOverlay";
import Nav from "@/components/Nav";
import Preloader from "@/components/Preloader";
import SmoothScroll from "@/components/SmoothScroll";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";
import HorizontalGallery from "@/components/sections/HorizontalGallery";
import IndexList from "@/components/sections/IndexList";
import Manifesto from "@/components/sections/Manifesto";
import NightSequence from "@/components/sections/NightSequence";
import Studio from "@/components/sections/Studio";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Preloader />
      <Cursor />
      <GrainOverlay />
      <Nav />

      <main>
        <Hero />
        <Manifesto />
        <HorizontalGallery />
        <NightSequence />
        <IndexList />
        <Studio />
        <Contact />
      </main>
    </>
  );
}
