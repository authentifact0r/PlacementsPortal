import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaQuoteLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './TestimonialsCarousel.css';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Civil Engineering Graduate',
    company: 'BuildTech Solutions',
    image: '/assets/images/testimonials/sarah.jpg',
    quote: 'PlacementsPortal helped me land my dream role in civil engineering. The platform was intuitive, and the support team was incredibly helpful throughout the process.',
    rating: 5
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'IT Graduate',
    company: 'TechCore Systems',
    image: '/assets/images/testimonials/michael.jpg',
    quote: 'Within two weeks of signing up, I had multiple interview offers. The quality of opportunities on this platform is outstanding.',
    rating: 5
  },
  {
    id: 3,
    name: 'Priya Patel',
    role: 'Structural Engineer',
    company: 'Infrastructure UK',
    image: '/assets/images/testimonials/priya.jpg',
    quote: 'As an international student, finding sponsorship opportunities seemed impossible until I found PlacementsPortal. They connected me with employers actively seeking skilled graduates.',
    rating: 5
  },
  {
    id: 4,
    name: 'James Williams',
    role: 'Project Consultant',
    company: 'Consult Plus',
    image: '/assets/images/testimonials/james.jpg',
    quote: 'The career coaching and CV review services were game-changers. I felt confident and prepared for every interview.',
    rating: 5
  }
];

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {
    setDirection(newDirection);
    setCurrentIndex((prevIndex) => {
      if (newDirection === 1) {
        return prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1;
      } else {
        return prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1;
      }
    });
  };

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="testimonials-carousel">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">What Our Students Say</h2>
          <p className="section-subtitle">
            Real success stories from graduates who found their perfect placement
          </p>
        </motion.div>

        <div className="carousel-container">
          <button
            className="carousel-button carousel-button-prev"
            onClick={() => paginate(-1)}
            aria-label="Previous testimonial"
          >
            <FaChevronLeft />
          </button>

          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="testimonial-card"
            >
              <div className="testimonial-quote-icon">
                <FaQuoteLeft />
              </div>

              <div className="testimonial-content">
                <p className="testimonial-quote">
                  {testimonials[currentIndex].quote}
                </p>

                <div className="testimonial-rating">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                </div>

                <div className="testimonial-author">
                  <div className="author-image">
                    <img
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonials[currentIndex].name)}&background=667eea&color=fff&size=80`;
                      }}
                    />
                  </div>
                  <div className="author-info">
                    <h4 className="author-name">{testimonials[currentIndex].name}</h4>
                    <p className="author-role">{testimonials[currentIndex].role}</p>
                    <p className="author-company">{testimonials[currentIndex].company}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            className="carousel-button carousel-button-next"
            onClick={() => paginate(1)}
            aria-label="Next testimonial"
          >
            <FaChevronRight />
          </button>
        </div>

        <div className="carousel-dots">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setDirection(index > currentIndex ? 1 : -1);
                setCurrentIndex(index);
              }}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
