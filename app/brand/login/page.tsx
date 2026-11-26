import { redirect } from 'next/navigation';

export default function BrandLoginRedirectPage() {
  redirect('/brand?tab=login');
}
