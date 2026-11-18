import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import CollaborationShell from '@/app/components/CollaborationShell';
import { directoryRole } from '@/app/lib/collab-demo-auth';
import { getDatabase } from '@/app/lib/database';
import { portfolioForCasting, reviewedCapHash, reviewedCapImage } from '@/app/lib/casting-portfolio';
import { normalizeGenderValue } from '@/app/lib/normalize-gender';
import { safePortfolioUrl } from '@/app/lib/creator-public';
import { isUsableCustomImageUrl } from '@/app/lib/social-avatar';
import Directory, { type DirectoryProfile } from './Directory';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Alle Creator · famefact', robots: { index: false, follow: false },
  referrer: 'no-referrer', alternates: { canonical: null, languages: {} },
};

export default async function Page() {
  const role = await directoryRole(headers().get('authorization'));
  if (!role) notFound();
  const access = { admin: role === 'admin', directoryOnly: role === 'reader' };
  let profiles: DirectoryProfile[];
  try {
    const rows = await getDatabase().query(`
      SELECT p.public_id, p.display_name, p.status, p.city, p.gender,
        concat_ws(' · ', nullif(p.topics,''), nullif(p.industries,''), nullif(p.special_traits,'')) AS topics,
        p.preferred_content, p.profile_image_url,
        EXISTS (SELECT 1 FROM creator_social_avatars a WHERE a.creator_id = p.id AND a.image IS NOT NULL) AS avatar,
        ${portfolioForCasting} AS works, ${reviewedCapHash} AS cap_hash
      FROM creator_profiles p
      ORDER BY lower(p.display_name), p.public_id
    `);
    profiles = rows.map(row => {
      const customImage = safePortfolioUrl(row.profile_image_url);
      return {
        capAvatar: row.status === 'active' ? reviewedCapImage(row.public_id, row.cap_hash) : undefined,
        id: row.public_id, name: row.display_name, city: row.city || '', status: row.status,
        gender: row.gender || '', normalizedGender: normalizeGenderValue(row.gender),
        topicsText: row.topics, formatsText: row.preferred_content || '', works: row.works,
        image: customImage && isUsableCustomImageUrl(customImage) ? customImage :
          row.avatar && row.status === 'active' ? '/api/avatar/' + encodeURIComponent(row.public_id) : undefined,
      };
    });
  } catch {
    return <CollaborationShell {...access}><h1>Alle Creator</h1><p role="alert" className="demo-lead">Die Creator-Bank konnte nicht geladen werden. Bitte erneut versuchen.</p><a className="demo-button secondary mt-4" href="/admin/creators">Neu laden</a></CollaborationShell>;
  }
  return <CollaborationShell {...access}><Directory profiles={profiles} canEdit={access.admin} /></CollaborationShell>;
}
