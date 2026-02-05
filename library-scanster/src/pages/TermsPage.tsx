import { PageLayout } from '@/components/layout/PageLayout';

const TermsPage = () => {
  return (
    <PageLayout>
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 animate-slide-down">Terms of Service</h1>
        <p className="text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using AllMyBooks, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              AllMyBooks is a personal library management service that allows users to catalog,
              organize, and manage their book collections. We provide tools for scanning barcodes,
              searching book databases, and maintaining a digital library.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">To use certain features, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. User Content</h2>
            <p className="text-muted-foreground">
              You retain ownership of content you upload, including book photos and notes.
              By uploading content, you grant us a license to store, display, and process
              that content to provide our service. You agree not to upload content that:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Violates any laws or regulations</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains malicious code or harmful content</li>
              <li>Is inappropriate, offensive, or harmful to others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Scrape or collect data from the service without permission</li>
              <li>Use automated systems to access the service excessively</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The AllMyBooks service, including its design, features, and content (excluding
              user-uploaded content), is protected by intellectual property laws. Book information
              may be sourced from third-party databases like OpenLibrary under their respective licenses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              The service is provided "as is" without warranties of any kind. We do not guarantee
              that the service will be uninterrupted, error-free, or that book information will
              always be accurate or complete.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, we shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of
              or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Account Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate accounts that violate these terms.
              You may delete your account at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these terms at any time. Continued use of the service after changes
              constitutes acceptance of the new terms. We will notify users of significant changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, please contact us through our{' '}
              <a href="/contact" className="text-primary hover:underline">contact form</a>.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default TermsPage;
