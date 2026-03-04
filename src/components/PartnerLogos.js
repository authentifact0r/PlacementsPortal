import React from 'react';
import { motion } from 'framer-motion';
import './PartnerLogos.css';

const partners = [
  { name: 'BuildTech Solutions', logo: '/assets/images/partners/buildtech.png' },
  { name: 'TechCore Systems', logo: '/assets/images/partners/techcore.png' },
  { name: 'Infrastructure UK', logo: '/assets/images/partners/infrastructure-uk.png' },
  { name: 'Consult Plus', logo: '/assets/images/partners/consultplus.png' },
  { name: 'Engineering First', logo: '/assets/images/partners/engineering-first.png' },
  { name: 'Digital Dynamics', logo: '/assets/images/partners/digital-dynamics.png' },
  { name: 'Project Masters', logo: '/assets/images/partners/project-masters.png' },
  { name: 'Tech Innovate', logo: '/assets/images/partners/tech-innovate.png' },
];

const PartnerLogos = () => {
  return (
    <section className="partner-logos">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Trusted by Leading Employers</h2>
          <p className="section-subtitle">
            We partner with industry-leading organizations to bring you the best opportunities
          </p>
        </motion.div>

        <div className="logos-grid">
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              className="logo-item"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <div className="logo-wrapper">
                <img
                  src={partner.logo}
                  alt={partner.name}
                  onError={(e) => {
                    // Fallback to text-based logo if image fails
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="logo-placeholder" style={{ display: 'none' }}>
                  {partner.name}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="partner-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p>Want to partner with us?</p>
          <a href="/employers" className="btn btn-primary">
            Become a Partner
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default PartnerLogos;
