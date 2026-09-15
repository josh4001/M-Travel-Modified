import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-6 text-center">
      <Compass className="h-10 w-10 text-marigold" />
      <h1 className="mt-4 font-display text-3xl font-semibold">Off the map</h1>
      <p className="mt-2 text-bone/60">We couldn't find the page you were looking for.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}
