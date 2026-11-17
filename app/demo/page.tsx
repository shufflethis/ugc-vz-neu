import { demoMetadata, renderDemoSection } from './_v2/render-demo-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = demoMetadata;

export default async function DemoHomePage() {
  return renderDemoSection('home');
}
