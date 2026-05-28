import { redirect } from "next/navigation";
import {
  CTASection,
  Footer,
  HeroSection,
  IntroSection,
  ManifestoSection,
  SelectedWorksSection,
  StatsSection,
} from "@/components/landing/pages";
import { getCurrentUser } from "@/lib/auth.server";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-covet-dark text-covet-light">
      <HeroSection />

      <main className="bg-white text-black rounded-t-3xl -mt-10 relative z-20">
        <IntroSection />
        <StatsSection />
        <ManifestoSection />
        <SelectedWorksSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
