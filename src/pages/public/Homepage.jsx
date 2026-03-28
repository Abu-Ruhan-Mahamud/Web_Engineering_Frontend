import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import '../../styles/homepage.css';

// ── Static demo data ────────────────────────────────────────────────
// Fallback doctors in case API is unavailable
const fallbackDoctors = [
  { name: 'Dr. Nusrat Jahan', specialty: 'Orthotic Surgeon', location: 'Chattogram, Bangladesh', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop' },
  { name: 'Dr. Tanvir Rahman', specialty: 'Neurologist', location: 'Dhaka, Bangladesh', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop' },
  { name: 'Dr. Shakil Ahmed', specialty: 'Orthopedist and Joint', location: 'Sylhet, Bangladesh', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop' },
  { name: 'Dr. Mahmudul Islam', specialty: 'Cardiologist', location: 'Chattogram, Bangladesh', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop' },
  { name: 'Dr. Md. Arif Hossain', specialty: 'Cardiac Surgeon', location: 'Chattogram, Bangladesh', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop' },
  { name: 'Dr. Shakil Ahmed', specialty: 'Medical Oncologist', location: 'Dhaka, Bangladesh', img: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&h=400&fit=crop' },
];

// Map specialization codes to display names
const specializationMap = {
  general_practice: 'General Practice',
  cardiology: 'Cardiologist',
  dermatology: 'Dermatologist',
  neurology: 'Neurologist',
  orthopedics: 'Orthopedist',
  pediatrics: 'Pediatrician',
  psychiatry: 'Psychiatrist',
  surgery: 'Surgeon',
  ophthalmology: 'Ophthalmologist',
  ent: 'ENT Specialist',
  gynecology: 'Gynecologist',
  urology: 'Urologist',
  oncology: 'Oncologist',
  other: 'Medical Professional',
};

const specialties = [
  { name: 'Heart', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { name: 'Asthma', icon: 'M12 2C8.69 2 6 4.69 6 8c0 1.89.89 3.57 2.26 4.66C5.64 14.24 4 16.81 4 20h2c0-3.31 2.69-6 6-6s6 2.69 6 6h2c0-3.19-1.64-5.76-4.26-7.34C17.11 11.57 18 9.89 18 8c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z' },
  { name: 'Lungs', icon: 'M12 2C8.69 2 6 4.69 6 8c0 1.89.89 3.57 2.26 4.66C5.64 14.24 4 16.81 4 20h2c0-3.31 2.69-6 6-6s6 2.69 6 6h2c0-3.19-1.64-5.76-4.26-7.34C17.11 11.57 18 9.89 18 8c0-3.31-2.69-6-6-6z' },
  { name: 'Oxygen', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4-8c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z' },
  { name: 'Diabetics', icon: 'M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z' },
  { name: 'Prescribe', icon: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z' },
  { name: 'Oxygen', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z' },
  { name: 'Heart', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
  { name: 'Diabetics', icon: 'M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5z' },
  { name: 'Asthma', icon: 'M12 2C8.69 2 6 4.69 6 8c0 1.89.89 3.57 2.26 4.66C5.64 14.24 4 16.81 4 20h2c0-3.31 2.69-6 6-6s6 2.69 6 6h2c0-3.19-1.64-5.76-4.26-7.34z' },
  { name: 'Lungs', icon: 'M12 2C8.69 2 6 4.69 6 8c0 1.89.89 3.57 2.26 4.66C5.64 14.24 4 16.81 4 20h2c0-3.31 2.69-6 6-6s6 2.69 6 6h2c0-3.19-1.64-5.76-4.26-7.34z' },
  { name: 'Heart', icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z' },
];

const testimonials = [
  { name: 'Fatima Noor', quote: 'Curova is a web app designed to help you stay healthy and access medical care easily. It provides 24/7 doctor consultations along with a convenient medicine delivery service.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop' },
  { name: 'Ahmed Rahman', quote: 'The platform has revolutionized how I access healthcare. The doctors are professional, responsive, and the medicine delivery is incredibly fast. Highly recommended!', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' },
  { name: 'Sarah Khan', quote: 'As a busy professional, Curova has been a lifesaver. I can consult with top doctors from the comfort of my home. The service quality is exceptional and truly convenient.', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop' },
];

export default function Homepage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [doctors, setDoctors] = useState(fallbackDoctors);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Fetch real doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/auth/doctors/?page_size=6');
        if (response.data && (response.data.results || response.data)) {
          const doctorList = response.data.results || response.data;
          // Map API response to display format
          const formattedDoctors = doctorList.map(doc => ({
            id: doc.id,
            name: `Dr. ${doc.first_name} ${doc.last_name}`,
            specialty: specializationMap[doc.specialization] || doc.specialization,
            location: 'Bangladesh',  // Could be extended with location field in future
            img: doc.profile_picture || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
          }));
          setDoctors(formattedDoctors);
        }
      } catch (error) {
        // Silently fall back to fallback doctors
        console.log('Using fallback doctors');
        setDoctors(fallbackDoctors);
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const nextSlide = () => setCurrentSlide((p) => (p + 1) % testimonials.length);
  const prevSlide = () => setCurrentSlide((p) => (p - 1 + testimonials.length) % testimonials.length);

  const dashboardMap = {
    patient: '/patient/dashboard',
    doctor: '/doctor/dashboard',
    admin: '/admin/dashboard',
    lab_tech: '/lab/orders',
  };
  const dashboardLink = user
    ? dashboardMap[user.user_type] || '/login'
    : '/login';

  return (
    <div className="homepage">
      {/* Navigation */}
      <nav className="home-nav">
        <div className="logo">CUROVA</div>
        
        {/* Desktop Menu */}
        <div className="nav-links">
          <a href="#doctors">Healthcare</a>
          <a href="#consult">Services</a>
          <a href="#testimonials">About Us</a>
        </div>

        {/* Desktop Right Section */}
        <div className="nav-right">
          <span className="call-text">Call <span className="phone">01764860972</span> or</span>
          {isAuthenticated ? (
            <Link to={dashboardLink} className="btn-nav-primary">Dashboard</Link>
          ) : (
            <button 
              className="btn-nav-primary"
              onClick={() => navigate('/login?redirect=appointments')}
            >
              Consult Online
            </button>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <button 
          className="hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <a href="#doctors" onClick={() => setMobileMenuOpen(false)}>Healthcare</a>
            <a href="#consult" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>About Us</a>
            <hr />
            {isAuthenticated ? (
              <Link to={dashboardLink} className="mobile-btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <button 
                className="mobile-btn-primary"
                onClick={() => {
                  navigate('/login?redirect=appointments');
                  setMobileMenuOpen(false);
                }}
              >
                Consult Online
              </button>
            )}
            <div className="mobile-menu-footer">
              <span className="call-text">Call: <strong>01764860972</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="hero"></div>

      {/* Top Rated Doctors */}
      <section className="home-section" id="doctors">
        <h2 className="section-title">Top Rated <span>Doctors</span> Near You</h2>
        <div className="doctors-container">
          <div className="doctors-grid">
            {doctors.map((doc, i) => (
              <div className="doctor-card" key={i}>
                <img src={doc.img} alt={doc.name} className="doctor-image" />
                <div className="doctor-info">
                  <div className="doctor-name">{doc.name}</div>
                  <div className="doctor-specialty">{doc.specialty}</div>
                  <div className="doctor-location">{doc.location}</div>
                  <Link to={isAuthenticated ? '/patient/appointments' : '/login'} className="btn-consult">Consult Now</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Link to={isAuthenticated ? '/patient/appointments' : '/login'} className="view-all">View All →</Link>
      </section>

      {/* Quick Consult */}
      <section className="home-section" id="consult">
        <h2 className="section-title">Quick <span>Consult For</span></h2>
        <div className="consult-grid">
          {specialties.map((s, i) => (
            <button
              key={i}
              className="consult-card"
              onClick={() => {
                if (isAuthenticated) {
                  navigate(`/patient/appointments?specialty=${encodeURIComponent(s.name)}`);
                } else {
                  navigate(`/login?redirect=appointments&specialty=${encodeURIComponent(s.name)}`);
                }
              }}
              title={`Consult a ${s.name} specialist`}
            >
              <div className="consult-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d={s.icon} /></svg>
              </div>
              <div className="consult-text">{s.name}</div>
            </button>
          ))}
        </div>
        <Link to={isAuthenticated ? '/patient/appointments' : '/login'} className="view-all">View All →</Link>
      </section>

      {/* Testimonials */}
      <div className="testimonial-section" id="testimonials">
        <div className="testimonial-wrapper">
          <h2 className="section-title">Our <span>patients</span> feedback about us</h2>
          <div className="testimonial-container">
            <div
              className="testimonial-slider"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {testimonials.map((t, i) => (
                <div className="testimonial-slide" key={i}>
                  <div className="testimonial-image-wrapper">
                    <img src={t.img} alt={t.name} className="testimonial-image" />
                  </div>
                  <div className="testimonial-text">
                    <p className="quote">"{t.quote}"</p>
                    <div className="customer-name">{t.name}</div>
                    <div className="customer-label">CUROVA Customer</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="testimonial-controls">
              <button className="testimonial-arrow" onClick={prevSlide} aria-label="Previous testimonial">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
              </button>
              <button className="testimonial-arrow" onClick={nextSlide} aria-label="Next testimonial">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div>
            <div className="footer-brand">CUROVA</div>
            <p className="footer-description">
              Health care involves the services and actions taken by medical professionals to maintain,
              protect, and improve physical and mental health. It also encompasses support for emotional
              well-being, provided by individuals and organizations dedicated to patient care.
            </p>
          </div>
          <div className="footer-section">
            <h3>Overview</h3>
            <ul className="footer-links">
              <li><Link to="/#doctors">Top Doctors</Link></li>
              <li><Link to="/#consult">Services</Link></li>
              <li><Link to="/#testimonials">Patient Reviews</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Company</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><a href="#testimonials">About us</a></li>
              <li><a href="#consult">Services</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Explore</h3>
            <ul className="footer-links">
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/cookies">Cookie Policy</Link></li>
              <li><a href="mailto:support@curova.com">Contact Support</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Social Media</h3>
            <div className="social-icons">
              <div className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
              <div className="social-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">Copyright © CUROVA {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}
