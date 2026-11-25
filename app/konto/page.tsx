import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDatabase, isDatabaseConfigured } from '../lib/database';
import { verifySession, CREATOR_SESSION_COOKIE } from '../lib/creator-session';
import { loadCreatorProfile } from '../lib/creator-profile';
import { listCreatorSocialConnections, type CreatorSocialConnection } from '../lib/brand-workspace';
import { getSocialOAuthAvailability } from '../lib/social-oauth';
import { loadCreatorAiProfile, type CreatorAiProfileRecord } from '../lib/creator-social-analyzer';
import KontoClient from './KontoClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Creator-Konto',
  description: 'Sieh dir dein UGC-VZ-Creator-Profil an und bearbeite deine Angaben.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://ugc-vz.de/konto' },
};

export default async function KontoPage({
  searchParams,
}: {
  searchParams?: { invalid?: string; error?: string; login?: string; oauth?: string };
}) {
  const token = cookies().get(CREATOR_SESSION_COOKIE)?.value;
  const creatorId = verifySession(token);

  if (!creatorId || !isDatabaseConfigured()) {
    return <KontoClient profile={null} loginInvalid={searchParams?.invalid === '1'} loginError={searchParams?.error === '1'} loginNoSession={searchParams?.login === '1'} />;
  }

  const sql = getDatabase();
  const profile = await loadCreatorProfile(sql, creatorId);
  let socialConnections: CreatorSocialConnection[] = [];
  let aiProfile: CreatorAiProfileRecord | null = null;
  if (profile) {
    try {
      socialConnections = await listCreatorSocialConnections(sql, creatorId);
    } catch {
      socialConnections = [];
    }
    aiProfile = await loadCreatorAiProfile(sql, creatorId);
  }
  return (
    <KontoClient
      profile={profile}
      aiProfile={aiProfile}
      socialConnections={socialConnections}
      oauthEnabled={getSocialOAuthAvailability()}
      oauthStatus={searchParams?.oauth}
      loginNoSession={!profile && searchParams?.login === '1'}
    />
  );
}
