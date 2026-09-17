import StarSeaHero from "@/components/StarSeaHero";

export default function Home() {
  return (
    <main>
      <StarSeaHero />
      <section id="explore" className="min-h-[55vh] bg-[#05080f] px-6 py-24 text-center text-white/65">
        <p className="text-xs uppercase tracking-[0.28em]">Standalone preview</p>
        <h2 className="mt-5 font-display text-4xl italic text-white">
          The ocean keeps the sky.
        </h2>
      </section>
    </main>
  );
}
