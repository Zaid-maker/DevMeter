import Link from "next/link";
import { Button } from "@/components/ui/button";

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
            <a href="https://discord.com/invite/TRKa2PSBcS" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" className="mr-2 h-6 w-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
              </svg>
              Discord Server
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
