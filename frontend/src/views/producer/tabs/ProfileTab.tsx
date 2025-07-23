import { HeroSection } from '../../../components/cards/producer/HeroSection';
import { ServiceCardRow } from '../../../components/cards/producer/ServiceCardRow';

export function ProfileTab() {
  return (
    <>
      <HeroSection />
      <div className="mt-8">
        <ServiceCardRow />
      </div>
    </>
  );
} 