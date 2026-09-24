import PublicHeader from "@/components/public/PublicHeader";
import HeroSection from "@/components/public/HeroSection";
import CategoriesSection from "@/components/public/CategoriesSection";
import FeaturedProductsSection from "@/components/public/FeaturedProductsSection";
import FeaturedSuppliersSection from "@/components/public/FeaturedSuppliersSection";
import HowItWorksSection from "@/components/public/HowItWorksSection";
import TestimonialsSection from "@/components/public/TestimonialsSection";
import PublicFooter from "@/components/public/PublicFooter";

// Public marketplace homepage, served at "/". Section order follows the
// spec: header, hero (search), categories, featured products, featured
// suppliers, how it works, testimonials, footer.
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <PublicHeader />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <FeaturedProductsSection />
        <FeaturedSuppliersSection />
        <HowItWorksSection />
        <TestimonialsSection />
      </main>
      <PublicFooter />
    </div>
  );
}
