import PillButton from '../components/ui/PillButton.jsx';

export default function NotFound() {
  return (
    <section className="container-velora flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="text-xs uppercase tracking-widest text-ink/60">(404)</div>
      <h1 className="heading-display mt-3 text-5xl md:text-7xl">Off the path.</h1>
      <p className="mt-4 max-w-md text-sm text-ink/70 dark:text-paper/60">
        That page is either yet-to-be-shipped or wandered off the lookbook. Let's get you
        home.
      </p>
      <div className="mt-6">
        <PillButton to="/">Back to home</PillButton>
      </div>
    </section>
  );
}
