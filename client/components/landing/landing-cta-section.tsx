import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANDING_LINKS } from "@/components/landing/landing-config";

export function LandingCtaSection() {
  return (
    <section className="py-32 px-6 text-center">
      <div className="max-w-4xl mx-auto bg-primary rounded-[3rem] p-12 md:p-20 text-black relative overflow-hidden group">
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight">Ready to verify<br /> your intensity?</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" asChild className="bg-black text-white hover:bg-black/90 font-black px-10 h-16 text-xl rounded-full w-full sm:w-auto">
            <Link href="/auth/sign-up">Join DevMeter Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-black/20 hover:bg-black/5 font-black px-10 h-16 text-xl rounded-full w-full sm:w-auto">
            <a href={LANDING_LINKS.discordInvite} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-6 w-6" />
              Discord Server
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
