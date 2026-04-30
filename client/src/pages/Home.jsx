import Hero from '../sections/Hero.jsx';
import Categories from '../sections/Categories.jsx';
import Services from '../sections/Services.jsx';
import Products from '../sections/Products.jsx';
import Philosophy from '../sections/Philosophy.jsx';
import WorkerTracking from '../sections/WorkerTracking.jsx';
import BrandingShowcase from '../sections/BrandingShowcase.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Categories />
      <Products />
      <Philosophy />
      <WorkerTracking />
    </>
  );
}
