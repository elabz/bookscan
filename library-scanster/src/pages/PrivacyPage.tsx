import { PageLayout } from '@/components/layout/PageLayout';

const PrivacyPage = () => {
  return (
    <PageLayout>
      <div className="container py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 animate-slide-down">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground">
              AllMyBooks ("we", "our", or "us") respects your privacy and is committed to protecting
              your personal data. This privacy policy explains how we collect, use, and safeguard
              your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
            <p className="text-muted-foreground mb-4">We collect the following types of information:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and profile picture when you create an account or sign in with a social provider.</li>
              <li><strong>Library Data:</strong> Books you add to your library, including ISBNs, titles, authors, and any notes or photos you upload.</li>
              <li><strong>Usage Data:</strong> Information about how you use our service, including pages visited and features used.</li>
              <li><strong>Device Information:</strong> Browser type, device type, and IP address for security and analytics purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide and maintain our service</li>
              <li>Store and manage your book library</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about your account or our service</li>
              <li>Ensure the security of our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely on servers with industry-standard encryption.
              We implement appropriate technical and organizational measures to protect your
              personal data against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
            <p className="text-muted-foreground">
              We use third-party services for authentication (social login providers) and may
              fetch book information from external APIs like OpenLibrary. These services have
              their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your library data</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground">
              We use essential cookies to maintain your session and remember your preferences.
              We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of any
              significant changes by posting the new policy on this page and updating the
              "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this privacy policy or our data practices,
              please contact us through our <a href="/contact" className="text-primary hover:underline">contact form</a>.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
};

export default PrivacyPage;
