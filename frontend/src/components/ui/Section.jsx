import React from 'react';
import '../../assets/styles/components/ui/Section.css'

export default function Section({ title, subtitle, children }) {
  return (
    <section className="section">
      {(title || subtitle) && (
        <header className="section__head">
          {title && <h2>{title}</h2>}
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}
      <div className="section__body">{children}</div>
    </section>
  );
}
