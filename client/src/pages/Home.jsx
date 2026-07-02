import HeroSection from '../sections/hero/HeroSection.jsx';
import SpacesWeSpecialize from '../sections/SpacesWeSpecialize.jsx';
import DiscoverServices from '../sections/DiscoverServices.jsx';
import FeaturedServices from '../sections/FeaturedServices.jsx';
import BestWorkers from '../sections/BestWorkers.jsx';
import ShopCollection from '../sections/ShopCollection.jsx';
import HomeFAQ from '../sections/HomeFAQ.jsx';

export default function Home() {
  return (
    <>
      <HeroSection />
      <SpacesWeSpecialize />
      <DiscoverServices />
      <FeaturedServices />
      <BestWorkers />
      <ShopCollection />
      <HomeFAQ />
    </>
  );
}
