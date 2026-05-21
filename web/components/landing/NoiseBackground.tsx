export function NoiseBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-[20%] top-[-10%] h-[55vh] w-[55vw] rounded-full bg-[#f4d4c8] opacity-70 blur-[100px]" />
      <div className="absolute right-[-15%] top-[5%] h-[45vh] w-[50vw] rounded-full bg-[#c8e6df] opacity-60 blur-[110px]" />
      <div className="absolute bottom-[-20%] left-[25%] h-[50vh] w-[60vw] rounded-full bg-[#d4e4f7] opacity-50 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px"
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,249,247,0.2)_0%,rgba(250,249,247,0.92)_78%)]" />
    </div>
  );
}
