import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto mt-24 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-xl bg-ops-card2 flex items-center justify-center">
        <Compass className="h-5 w-5 text-text-tertiary" />
      </div>
      <h1 className="font-serif text-2xl font-medium text-text-primary">Page not found</h1>
      <p className="text-sm text-text-secondary">That address doesn&apos;t match anything in the console.</p>
      <Link to="/" className="inline-block text-sm font-medium text-brand-blue underline">
        Back to the dashboard
      </Link>
    </div>
  );
}
