import Hero from '../sections/Hero.jsx';
import Spotlight from '../sections/Spotlight.jsx';
import FeaturedServices from '../sections/FeaturedServices.jsx';
import Products from '../sections/Products.jsx';
import Philosophy from '../sections/Philosophy.jsx';
import WorkerTracking from '../sections/WorkerTracking.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <Spotlight />
      <FeaturedServices />
      <Products />
      <Philosophy />
      <WorkerTracking />
    </>
  );
}
