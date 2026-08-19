import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import WorkflowShowcase from '../components/WorkflowShowcase';
import IntegrationShowcase from '../components/IntegrationShowcase';
import HowItWorks from '../components/HowItWorks';
// FREE_MODE_TEMP: giữ import cũ để sau này mở lại section pricing nhanh
// import Pricing from '../components/Pricing';
import DownloadCTA from '../components/DownloadCTA';
import Footer from '../components/Footer';

export default function LandingPage() {
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.aos-element');

    // When page loads with a #hash, the browser scrolls to the target section.
    // Elements above or within the viewport won't trigger IntersectionObserver,
    // so they stay at opacity:0 (appear black). Fix: immediately mark those as visible.
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('visible');
      }
    });

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-light relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(29,78,216,0.08),transparent_62%)]" />
      <div className="dashboard-stripe left-[6%] top-[8rem] h-28 w-60 rotate-[-12deg]" />
      <div className="dashboard-stripe right-[8%] top-[22rem] h-24 w-72 rotate-[18deg]" />

      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Features />
        <WorkflowShowcase />
        <IntegrationShowcase />
        <HowItWorks />
        {/* FREE_MODE_TEMP: tạm ẩn bảng giá, không xóa để sau này chỉ cần mở comment */}
        {/* <Pricing /> */}
        <DownloadCTA />
      </main>
      <Footer />
    </div>
  );
}

