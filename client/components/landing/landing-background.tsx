export function LandingBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] motion-safe:animate-pulse motion-reduce:animate-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
    </div>
  );
}
