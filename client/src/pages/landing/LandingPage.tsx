import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Hero from './Hero';
import About from './About';
import Features from './Features';

const LandingPage = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <About />
      <Features />
      <Footer />
    </div>
  );
};

export default LandingPage;
