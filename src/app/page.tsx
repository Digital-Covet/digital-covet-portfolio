import { redirect } from "next/navigation";
import {
  About,
  FinalCTA,
  Hero,
  Methodology,
  Navbar,
  Services,
  SocialProof,
  Footer,
} from "@/components/landing";
import { getCurrentUser } from "@/lib/auth.server";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <Navbar />
      <Hero />
      <SocialProof />
      <Services />
      <Methodology />
      <About />
      <FinalCTA />
      <Footer />
    </>
  );
}
