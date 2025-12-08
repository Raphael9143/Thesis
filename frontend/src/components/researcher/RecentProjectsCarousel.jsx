import React, { useState, useEffect } from 'react';
import '../../assets/styles/components/researcher/RecentProjectsCarousel.css';

export default function RecentProjectsCarousel({ projects, onJoinClick }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  // Determine how many cards are visible based on window width
  useEffect(() => {
    const calc = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
      if (w <= 760) return 1;
      if (w <= 900) return 2;
      return 3;
    };
    const update = () => setVisibleCount(calc());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (!projects || projects.length === 0) {
    return null;
  }

  // Duplicate projects to create infinite loop effect
  // Need enough copies to always show 3 cards when sliding
  const minCopies = Math.ceil(6 / projects.length); // At least 6 items total
  const extendedProjects = Array(minCopies).fill(projects).flat();

  // Precompute decoded + truncated descriptions to avoid inline functions in JSX
  const MAX_DESC = 150;
  const processedProjects = extendedProjects.map((project) => {
    const raw = project.description || 'No description available.';
    const decoded = raw.replace(/\\n/g, '\n');
    const truncated =
      decoded.length > MAX_DESC ? decoded.slice(0, MAX_DESC).trimEnd() + '…' : decoded;
    return { ...project, _decoded: decoded, _truncated: truncated, _truncateClass: 'truncate' };
  });

  // Max slides so we always have at least `visibleCount` cards visible
  const maxSlideIndex = Math.max(0, extendedProjects.length - visibleCount);

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      if (prev >= maxSlideIndex) {
        return 0; // Loop back to start
      }
      return prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      if (prev === 0) {
        return maxSlideIndex; // Loop to end
      }
      return prev - 1;
    });
  };

  return (
    <section className="recent-projects-section">
      <div className="container">
        <h2 className="section-title">Recently Created Projects</h2>
        <p className="section-subtitle">Explore the latest research projects from our community</p>
        <div className="carousel-container">
          <button className="carousel-nav carousel-nav-prev" onClick={prevSlide}>
            <i className="fa fa-chevron-left"></i>
          </button>
          <div className="carousel-wrapper">
            <div
              className="carousel-track"
              style={{ transform: `translateX(-${currentSlide * (100 / visibleCount)}%)` }}
            >
              {processedProjects.map((project, index) => (
                <div key={`${project.id}-${index}`} className="carousel-slide">
                  <div className="project-card">
                    <div className="project-card-header">
                      <h3 className="project-card-title truncate">
                        {project.title || 'Untitled Project'}
                      </h3>
                      <span
                        className={`project-badge project-badge-${project.status?.toLowerCase()}`}
                      >
                        {project.status || 'Active'}
                      </span>
                    </div>
                    <div className="project-card-meta">
                      <div className="project-meta-item">
                        <i className="fa fa-user"></i>
                        <span className="truncate">{project.owner?.full_name || 'Unknown'}</span>
                      </div>
                      <div className="project-meta-item">
                        <i className="fa fa-calendar"></i>
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onJoinClick(project.id)}
                    >
                      <i className="fa fa-sign-in-alt"></i> Join Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="carousel-nav carousel-nav-next" onClick={nextSlide}>
            <i className="fa fa-chevron-right"></i>
          </button>
        </div>
        <div className="carousel-dots">
          {projects.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentSlide % projects.length ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
