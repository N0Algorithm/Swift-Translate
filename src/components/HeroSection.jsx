import React from 'react';

const HeroSection = () => {
  return (
    <section className="hero-section animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <h1 className="hero-title font-display-hero">Swift Translate</h1>
      <p className="hero-subtitle font-body-lg">
        Instant translation across world languages. Clean, fast, and secure.
      </p>
    </section>
  );
};

export default HeroSection;
