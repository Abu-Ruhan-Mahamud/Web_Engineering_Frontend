import { Link } from 'react-router-dom';
import '../../styles/legal.css';

export default function PrivacyPolicy() {
  return (
    <div className="legal-page">
      {/* Navigation */}
      <nav className="legal-nav">
        <Link to="/" className="legal-logo">CUROVA</Link>
        <Link to="/" className="legal-back">← Back to Home</Link>
      </nav>

      {/* Content */}
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last Updated: March 27, 2026</p>

        <section>
          <h2>1. Introduction</h2>
          <p>
            CUROVA ("we," "us," "our," or "Company") operates the healthcare platform at www.curova.com. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Services. By accessing and using CUROVA, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
          </p>
        </section>

        <section>
          <h2>2. What Information We Collect</h2>
          <p>We collect information in the following ways:</p>
          
          <h3>2.1 Information You Provide Directly</h3>
          <ul>
            <li><strong>Account Registration:</strong> Name, email address, phone number, password, date of birth, gender, blood type, emergency contact information</li>
            <li><strong>Medical Information:</strong> Medical records, prescription history, allergies, chronic conditions, lab test results</li>
            <li><strong>Payment Information:</strong> Billing address, payment method (processed securely by third-party providers)</li>
            <li><strong>Communication:</strong> Messages sent through our messaging system between patients and doctors</li>
            <li><strong>Profile Data:</strong> Profile picture and personal preferences</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li>Device information (browser type, IP address, operating system)</li>
            <li>Usage data (pages visited, time spent, clicks, search queries)</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Location data (if you permit)</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our healthcare services</li>
            <li>Facilitate appointments between patients and doctors</li>
            <li>Process medical records, prescriptions, and test results</li>
            <li>Send appointment reminders and health updates</li>
            <li>Process payments and billing</li>
            <li>Comply with legal and regulatory requirements (GDPR, HIPAA-equivalent)</li>
            <li>Prevent fraud and enhance security</li>
            <li>Conduct research and analytics to improve our platform</li>
            <li>Respond to your inquiries and provide customer support</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security & Medical Records Retention</h2>
          <p>
            <strong>Data Protection:</strong> We employ industry-standard encryption (SSL/TLS) and security protocols to protect your information. However, no system is completely secure, and we cannot guarantee absolute security.
          </p>
          <p>
            <strong>Medical Records Retention:</strong> In compliance with healthcare regulations (GUIDELINE: GDPR Article 17(3) exceptions for legal claims and public health; HIPAA medical records retention requirements), we <strong>permanently retain your medical records</strong> even if you delete your account:
          </p>
          <ul>
            <li>Medical records, lab results, prescriptions, and diagnostic data are retained indefinitely to support continuity of care</li>
            <li>Personal identifying information (name, email, phone) is pseudonymized or deleted when you delete your account</li>
            <li>This practice aligns with real healthcare systems (NHS, Epic EHR, Cerner) and is legally required to:</li>
            <ul>
              <li>Support treatment continuity if you return to the platform</li>
              <li>Provide medical-legal protection in case of claims</li>
              <li>Enable epidemiological research and public health analysis</li>
            </ul>
          </ul>
        </section>

        <section>
          <h2>5. Your Privacy Rights</h2>
          <p>Depending on your location, you have the following rights:</p>
          
          <h3>5.1 GDPR Rights (if you're in the EU/UK)</h3>
          <ul>
            <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Right to Erasure:</strong> Delete your personal data (with exceptions for medical records and legal obligations)</li>
            <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Right to Object:</strong> Object to certain processing activities</li>
          </ul>

          <h3>5.2 How to Exercise Your Rights</h3>
          <p>
            To exercise any of these rights, contact us at <strong>privacy@curova.com</strong> with your request. We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2>6. Sharing Your Information</h2>
          <p>We share your information in the following limited cases:</p>
          <ul>
            <li><strong>With Healthcare Providers:</strong> Your medical information is shared with doctors you consult with</li>
            <li><strong>With Service Providers:</strong> Payment processors, cloud hosting providers (under confidentiality agreements)</li>
            <li><strong>For Legal Compliance:</strong> When required by law or to protect our rights</li>
            <li><strong>NOT Sold to Third Parties:</strong> We do not sell your personal data</li>
          </ul>
        </section>

        <section>
          <h2>7. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites. We are not responsible for their privacy practices. Please review their privacy policies before providing any information.
          </p>
        </section>

        <section>
          <h2>8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or our privacy practices, contact us at:</p>
          <ul>
            <li><strong>Email:</strong> privacy@curova.com</li>
            <li><strong>Phone:</strong> +880 176 486 0972</li>
            <li><strong>Address:</strong> Dhaka, Bangladesh</li>
          </ul>
        </section>

        <section>
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting the new policy on our website with an updated "Last Updated" date.
          </p>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="legal-footer">
        <Link to="/">← Back to Homepage</Link>
        <Link to="/cookies">Cookies Policy →</Link>
      </div>
    </div>
  );
}
