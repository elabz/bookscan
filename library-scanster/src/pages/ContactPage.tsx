import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ContactPage = () => {
  const { userEmail } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: userEmail || '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setIsSubmitted(true);
      toast({
        title: 'Message sent!',
        description: 'We\'ll get back to you as soon as possible.',
      });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: 'Failed to send message',
        description: 'Please try again or email us directly.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PageLayout>
        <div className="container py-12 max-w-2xl">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-4 animate-slide-up">Message Sent!</h1>
            <p className="text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Thank you for reaching out. We'll review your message and get back to you as soon as possible.
            </p>
            <Button onClick={() => setIsSubmitted(false)} variant="outline" className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              Send Another Message
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container py-12 max-w-2xl">
        <h1 className="text-4xl font-bold mb-6 animate-slide-down">Contact Us</h1>
        <p className="text-muted-foreground mb-8 animate-slide-down" style={{ animationDelay: '50ms' }}>
          Have a question, feedback, or need help? We'd love to hear from you.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 rounded-lg border bg-card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <Mail className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">General Inquiries</h3>
            <p className="text-sm text-muted-foreground">
              Questions about AllMyBooks or your account
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card animate-slide-up" style={{ animationDelay: '150ms' }}>
            <MessageSquare className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Feedback & Suggestions</h3>
            <p className="text-sm text-muted-foreground">
              Help us improve with your ideas
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="What is this about?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us how we can help..."
              rows={6}
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </div>
    </PageLayout>
  );
};

export default ContactPage;
