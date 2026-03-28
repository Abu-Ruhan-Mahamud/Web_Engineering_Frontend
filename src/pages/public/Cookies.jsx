import { Link } from 'react-router-dom';
import '../../styles/legal.css';

export default function Cookies() {
  return (
    <div className="legal-page">
      {/* Navigation */}
      <nav className="legal-nav">
        <Link to="/" className="legal-logo">CUROVA</Link>
        <Link to="/" className="legal-back">← Back to Home</Link>
      </nav>

      {/* Content */}
      <div className="legal-container">
        <h1>Cookie Policy</h1>
        <p className="last-updated">Last Updated: March 27, 2026</p>

        <section>
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit our website. They help us remember your preferences, log you in, and improve your experience on CUROVA.
          </p>
        </section>

        <section>
          <h2>2. Types of Cookies We Use</h2>

          <h3>2.1 Essential Cookies</h3>
          <p>These cookies are necessary for the website to function properly:</p>
          <ul>
            <li><strong>Authentication Cookies:</strong> Keep you logged in securely</li>
            <li><strong>CSRF Protection:</strong> Prevent cross-site request forgery attacks</li>
            <li><strong>Session Cookies:</strong> Maintain your session across pages</li>
          </ul>

          <h3>2.2 Preference Cookies</h3>
          <p>These remember your choices to personalize your experience:</p>
          <ul>
            <li>Language preferences</li>
            <li>Theme settings (light/dark mode)</li>
            <li>Sidebar state (expanded/collapsed)</li>
          </ul>

          <h3>2.3 Analytics Cookies</h3>
          <p>These help us understand how you use CUROVA:</p>
          <ul>
            <li>Pages visited and time spent</li>
            <li>Click patterns and user flows</li>
            <li>Device type and browser information</li>
          </ul>

          <h3>2.4 Third-Party Cookies</h3>
          <p>
            We may use third-party services that set their own cookies (e.g., payment processors, analytics tools). Review their privacy policies for details.
          </p>
        </section>

        <section>
          <h2>3. How Long Do Cookies Last?</h2>
          <ul>
            <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
            <li><strong>Persistent Cookies:</strong> Remain for up to 1 year (unless you clear them)</li>
          </ul>
        </section>

        <section>
          <h2>4. Control Your Cookie Settings</h2>
          <p>
            Most browsers allow you to control cookies through settings. You can:
          </p>
          <ul>
            <li>Allow all cookies</li>
            <li>Block all cookies</li>
            <li>Delete existing cookies</li>
            <li>Accept only essential cookies</li>
          </ul>
          <p>
            <strong>Note:</strong> Disabling essential cookies may prevent the website from working properly.
          </p>
        </section>

        <section>
          <h2>5. Do We Use Tracking Technologies?</h2>
          <p>
            Beyond cookies, we may use:
          </p>
          <ul>
            <li><strong>Local Storage:</strong> To store user preferences locally</li>
            <li><strong>Analytics Tools:</strong> To understand platform usage (anonymized)</li>
            <li><strong>Pixel Tags:</strong> To track page visits and conversions</li>
          </ul>
          <p>All tracking is performed in compliance with GDPR and privacy regulations.</p>
        </section>

        <section>
          <h2>6. Your Rights Regarding Cookies</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Know what cookies we use and why</li>
            <li>Refuse or delete cookies at any time</li>
            <li>Request information about our cookie practices</li>
            <li>Access your data collected through cookies</li>
          </ul>
        </section>

        <section>
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy periodically. Significant changes will be communicated via email or by posting the updated policy here with a new "Last Updated" date.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>For questions about our cookie practices, contact:</p>
          <ul>
            <li><strong>Email:</strong> privacy@curova.com</li>
            <li><strong>Phone:</strong> +880 176 486 0972</li>
          </ul>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="legal-footer">
        <Link to="/privacy-policy">← Privacy Policy</Link>
        <Link to="/">Back to Homepage →</Link>
      </div>
    </div>
  );
}
