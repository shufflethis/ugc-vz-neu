'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminAuthorized } from '@/app/lib/collaborations/http';
import { getDatabase } from '@/app/lib/database';
import { safePortfolioUrl } from '@/app/lib/creator-public';

const tags = z.object({
  skateboard: z.boolean(),
  capImage: z.string().max(2048).refine(value => safePortfolioUrl(value)?.startsWith('https:')).nullable(),
});

export async function saveWorkTags(input: unknown) {
  if (!await adminAuthorized(headers().get('authorization'))) return 'Interner Zugang erforderlich.';
  const data = z.object({ id: z.uuid(), before: tags, after: tags }).safeParse(input);
  if (!data.success) return 'Bitte eine gültige HTTPS-Bildadresse verwenden.';
  const { id, before, after } = data.data;
  try {
    const saved = await getDatabase().query(`
      UPDATE creator_portfolio_items SET skateboard_verified = $2, cap_image_url = $3
      WHERE id = $1 AND skateboard_verified = $4 AND cap_image_url IS NOT DISTINCT FROM $5
      RETURNING id
    `, [id, after.skateboard, after.capImage, before.skateboard, before.capImage]);
    revalidatePath('/admin/creators');
    return saved.length ? '' : 'Diese Arbeitsprobe wurde inzwischen geändert. Bitte die aktuellen Angaben prüfen.';
  } catch {
    return 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
  }
}
