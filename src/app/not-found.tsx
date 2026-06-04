import { Footer, Navbar } from "@/components/landing/pages";

export const NotFoundPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <main className="grow flex items-center justify-center relative w-full pt-25 pb-12 px-4 md:px-grid-margin grid-bg">
        <div
          className="absolute top-1/4 left-10 md:left-20 w-4 h-4 bg-acid-green transform rotate-45 opacity-50 blur-[1px]"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/3 right-10 md:right-32 w-2 h-2 bg-stark-white rounded-full opacity-70"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/4 w-px h-32 bg-acid-green opacity-20"
          aria-hidden="true"
        />

        <div className="max-w-4xl w-full flex flex-col items-center text-center z-10 space-y-12 py-section-padding">
          <div className="glitch-wrapper">
            <h1
              className="font-display-2xl text-[100px] md:text-display-2xl tracking-tighter glitch-text text-stark-white leading-none"
              data-text="404"
            >
              404
            </h1>
          </div>

          <div className="space-y-6 max-w-2xl">
            <h2 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-acid-green uppercase">
              STORY LOST IN THE NOISE.
            </h2>
            <p className="font-body-md text-body-md md:font-body-lg md:text-body-lg text-secondary-fixed max-w-lg mx-auto">
              The page you're looking for has been redacted. Let's get you back
              to the main narrative.
            </p>
          </div>

          <div className="pt-8">
            <a
              className="btn-brutal inline-block bg-acid-green text-deep-obsidian font-label-caps text-label-caps uppercase px-12 py-5 border-2 border-transparent focus:border-stark-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-acid-green"
              href="/"
            >
              BACK TO BASE
            </a>
          </div>

          <div className="w-24 h-0.5 bg-muted-gray mt-16" aria-hidden="true" />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default NotFoundPage;
