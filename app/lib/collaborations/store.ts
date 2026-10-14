import crypto from 'node:crypto';
import { getDatabase } from '../database';
import { CONSENT_VERSION, missingDetails, type Campaign, type Member, type Details } from './model';
import { newToken, sha256, encryptToken } from './security';

export type Query = <T = Record<string, any>>(text:string, values?: any[]) => Promise<T[]>;
const memberSelect = `SELECT m.*,p.display_name AS name,c.email,
 (SELECT url FROM creator_social_accounts WHERE creator_id=p.id ORDER BY is_primary DESC,created_at LIMIT 1) AS social_url,
 coalesce(k.published_content,k.content) AS content,k.state AS campaign_state,k.version AS campaign_version
 FROM collab_memberships m JOIN creator_profiles p ON p.id=m.creator_id
 JOIN creator_private_contacts c ON c.creator_id=p.id JOIN collab_campaigns k ON k.slug=m.campaign_slug`;

export class CollabStore {
  constructor(public query:Query = (text,values) => getDatabase().query(text,values) as any) {}
  async campaigns() { return this.query<Campaign>('SELECT * FROM collab_campaigns ORDER BY created_at DESC'); }
  async campaign(slug:string) { return (await this.query<Campaign>('SELECT * FROM collab_campaigns WHERE slug=$1',[slug]))[0] || null; }
  async saveCampaign(input:{slug:string;version:number;state:Campaign['state'];content:Campaign['content'];approvalNote:string}) {
    const rows=await this.query(`INSERT INTO collab_campaigns(slug,content,state,approval_note,approved_at,published_content)
      SELECT $1,$2::jsonb,$3,$4,CASE WHEN $3='live' THEN now() END,CASE WHEN $3='live' THEN $2::jsonb END WHERE $5=0
      ON CONFLICT (slug) DO NOTHING RETURNING *`,[input.slug,JSON.stringify(input.content),input.state,input.approvalNote,input.version]);
    if (rows.length) return rows[0];
    return (await this.query(`UPDATE collab_campaigns SET content=$2::jsonb,state=$3,approval_note=$4,
      approved_at=CASE WHEN $3='live' THEN now() END,published_content=CASE WHEN $3='live' THEN $2::jsonb ELSE published_content END,version=version+1,updated_at=now()
      WHERE slug=$1 AND version=$5 RETURNING *`,[input.slug,JSON.stringify(input.content),input.state,input.approvalNote,input.version]))[0] || null;
  }
  async creators(search:string) {
    return this.query(`SELECT p.public_id,p.display_name,p.topics,c.email FROM creator_profiles p
      JOIN creator_private_contacts c ON c.creator_id=p.id WHERE p.status='active'
      AND c.project_notifications_enabled AND c.notification_paused_at IS NULL
      AND c.email ~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
      AND (p.public_id ILIKE $1 OR p.display_name ILIKE $1 OR coalesce(p.topics,'') ILIKE $1)
      ORDER BY p.display_name LIMIT 30`,['%'+search+'%']);
  }
  async prepare(slug:string, publicId:string, personalNote:string, batchId:string) {
    const [member]=await this.query(`INSERT INTO collab_memberships(campaign_slug,creator_id)
      SELECT k.slug,p.id FROM collab_campaigns k CROSS JOIN creator_profiles p
      JOIN creator_private_contacts c ON c.creator_id=p.id WHERE k.slug=$1 AND p.public_id=$2
      AND p.status='active' AND c.project_notifications_enabled AND c.notification_paused_at IS NULL
      AND c.email ~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'
      ON CONFLICT(campaign_slug,creator_id) DO UPDATE SET updated_at=now()
      WHERE collab_memberships.status='invited' RETURNING id`,[slug,publicId]);
    if(!member) throw new Error('Profil nicht kontaktierbar oder Einladung bereits beantwortet.');
    const token=newToken();
    const [invite]=await this.query(`WITH locked AS (
      SELECT m.id,c.email FROM collab_memberships m JOIN creator_private_contacts c ON c.creator_id=m.creator_id
      WHERE m.id=$1 AND m.status='invited' AND NOT EXISTS(SELECT 1 FROM collab_invitations i
        WHERE i.membership_id=m.id AND i.delivery IN ('sending','unknown')) FOR UPDATE OF m
    ), revoked AS (UPDATE collab_invitations SET revoked_at=now() WHERE membership_id IN (SELECT id FROM locked)
       AND revoked_at IS NULL RETURNING id)
    INSERT INTO collab_invitations(membership_id,token_hash,token_encrypted,recipient,personal_note,batch_id)
    SELECT id,$2,$3,email,$4,$5 FROM locked WHERE (SELECT count(*) FROM revoked)>=0 RETURNING id`,
    [member.id,sha256(token),encryptToken(token),personalNote,batchId]);
    if(!invite) throw new Error('Vorheriger Versand muss zuerst geklärt werden.');
    await this.event(member.id,'invitation_prepared','admin',{batchId});
    return invite.id as string;
  }
  async consume(token:string, slug:string) {
    const session=newToken();
    const [result]=await this.query(`WITH used AS (
      UPDATE collab_invitations i SET used_at=now() FROM collab_memberships m,collab_campaigns k,creator_profiles p
      WHERE i.membership_id=m.id AND k.slug=m.campaign_slug AND p.id=m.creator_id AND p.status='active'
      AND k.slug=$2 AND k.state='live' AND m.status<>'declined' AND i.token_hash=$1
      AND i.expires_at>now() AND i.used_at IS NULL AND i.revoked_at IS NULL AND i.delivery='sent'
      RETURNING i.id,i.membership_id,i.expires_at
    ), sessions AS (
      INSERT INTO collab_sessions(token_hash,invitation_id,expires_at)
      SELECT $3,id,LEAST(expires_at,now()+interval '7 days') FROM used RETURNING invitation_id
    ), event AS (
      INSERT INTO collab_events(membership_id,kind,actor)
      SELECT membership_id,'invitation_opened','creator' FROM used WHERE id IN (SELECT invitation_id FROM sessions)
    ) SELECT membership_id FROM used`,[sha256(token),slug,sha256(session)]);
    return result ? {membershipId:result.membership_id as string,session} : null;
  }
  async member(id:string, creatorId:string|null, session:string|null) {
    return (await this.query<Member>(memberSelect+` WHERE m.id=$1 AND p.status='active' AND (
      ($2::uuid IS NOT NULL AND m.creator_id=$2 AND EXISTS(SELECT 1 FROM collab_invitations i WHERE i.membership_id=m.id AND i.sent_at IS NOT NULL)) OR
      ($2::uuid IS NULL AND EXISTS(SELECT 1 FROM collab_sessions s JOIN collab_invitations i ON i.id=s.invitation_id
        WHERE s.token_hash=$3 AND s.expires_at>now() AND i.revoked_at IS NULL AND i.membership_id=m.id)))`,[id,creatorId,session ? sha256(session):'']))[0]||null;
  }
  async members(creatorId:string|null, session:string|null) {
    return this.query<Member>(memberSelect+` WHERE p.status='active' AND (
      ($1::uuid IS NOT NULL AND m.creator_id=$1 AND EXISTS(SELECT 1 FROM collab_invitations i WHERE i.membership_id=m.id AND i.sent_at IS NOT NULL)) OR
      ($1::uuid IS NULL AND EXISTS(SELECT 1 FROM collab_sessions s JOIN collab_invitations i ON i.id=s.invitation_id
        WHERE s.token_hash=$2 AND s.expires_at>now() AND i.revoked_at IS NULL AND i.membership_id=m.id))) ORDER BY m.created_at DESC`,[creatorId,session?sha256(session):'']);
  }
  async saveDetails(member:Member,details:Details,accept:boolean,version:number,campaignVersion:number) {
    const next=missingDetails(details).length?'accepted':'ready';
    const [saved]=await this.query(`WITH updated AS (
      UPDATE collab_memberships m SET details=$2::jsonb,status=$3,
      accepted_at=coalesce(accepted_at,now()),terms_version=coalesce(terms_version,k.version),
      terms_snapshot=coalesce(terms_snapshot,k.content),consent_version=coalesce(consent_version,$6),
      version=m.version+1,updated_at=now() FROM collab_campaigns k
      WHERE m.id=$1 AND m.version=$4 AND k.slug=m.campaign_slug AND k.state='live'
      AND ((m.status='invited' AND $5 AND k.version=$7) OR (m.status IN ('accepted','ready') AND NOT $5)) RETURNING m.id,m.status
    ), logged AS (INSERT INTO collab_events(membership_id,kind,actor,details)
      SELECT id,CASE WHEN $5 THEN 'invitation_accepted' ELSE 'details_saved' END,'creator',jsonb_build_object('status',status) FROM updated)
    SELECT * FROM updated`,[member.id,JSON.stringify(details),next,version,accept,CONSENT_VERSION,campaignVersion]);
    return saved||null;
  }
  async decline(member:Member,version:number) {
    return (await this.query(`WITH updated AS (UPDATE collab_memberships SET status='declined',version=version+1,updated_at=now()
      WHERE id=$1 AND version=$2 AND status IN ('invited','accepted','ready') RETURNING id),
      logged AS (INSERT INTO collab_events(membership_id,kind,actor) SELECT id,'declined','creator' FROM updated)
      SELECT * FROM updated`,[member.id,version]))[0]||null;
  }
  async event(memberId:string,kind:string,actor:string,details:unknown={}) {
    await this.query('INSERT INTO collab_events(membership_id,kind,actor,details) VALUES($1,$2,$3,$4::jsonb)',[memberId,kind,actor,JSON.stringify(details)]);
  }
  async adminRows(slug:string) {
    return this.query(memberSelect+`, LATERAL (SELECT id AS invite_id,delivery,batch_id,expires_at,provider_event,used_at,sent_at,personal_note,revoked_at FROM collab_invitations WHERE membership_id=m.id ORDER BY created_at DESC LIMIT 1) i
      WHERE m.campaign_slug=$1 ORDER BY m.created_at DESC`,[slug]).then(async members=>{
        // Explicit projection: encrypted credentials never enter the UI payload.
        const invites=await this.query(`SELECT i.membership_id,i.id AS invite_id,i.delivery,i.batch_id,i.expires_at,i.provider_event,i.used_at,i.sent_at,i.personal_note,i.revoked_at
          FROM collab_invitations i JOIN collab_memberships m ON m.id=i.membership_id WHERE m.campaign_slug=$1 ORDER BY i.created_at DESC`,[slug]);
        return members.map(m=>({...m,...invites.find(i=>i.membership_id===m.id)}));
      });
  }
  async history(id:string) { return this.query('SELECT kind,actor,details,occurred_at FROM collab_events WHERE membership_id=$1 ORDER BY occurred_at DESC LIMIT 100',[id]); }
  async handover(id:string,version:number,confirm:boolean,by:string,evidence:string) {
    return (await this.query(`WITH updated AS (UPDATE collab_memberships SET status=$3,version=version+1,updated_at=now(),
      handed_over_at=CASE WHEN $3='handed_over' THEN now() ELSE handed_over_at END,
      confirmed_at=CASE WHEN $3='confirmed' THEN now() END,confirmed_by=CASE WHEN $3='confirmed' THEN $4 END,
      confirmation_evidence=CASE WHEN $3='confirmed' THEN $5 END
      WHERE id=$1 AND version=$2 AND status=$6 RETURNING id), logged AS (
        INSERT INTO collab_events(membership_id,kind,actor,details) SELECT id,$3,'admin',jsonb_build_object('by',$4::text,'evidence',$5::text) FROM updated)
      SELECT * FROM updated`,[id,version,confirm?'confirmed':'handed_over',by,evidence,confirm?'handed_over':'ready']))[0]||null;
  }
  async revoke(inviteId:string) {
    return this.query(`WITH changed AS (UPDATE collab_invitations SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL RETURNING membership_id),
      logged AS (INSERT INTO collab_events(membership_id,kind,actor) SELECT membership_id,'invitation_revoked','admin' FROM changed) SELECT * FROM changed`,[inviteId]);
  }
  async batch(id:string) {
    return this.query(`SELECT i.*,m.campaign_slug,m.status,p.display_name,p.public_id,p.gender,k.content,k.state,k.version AS campaign_version
      FROM collab_invitations i JOIN collab_memberships m ON m.id=i.membership_id
      JOIN creator_profiles p ON p.id=m.creator_id JOIN collab_campaigns k ON k.slug=m.campaign_slug
      WHERE i.batch_id=$1 AND i.revoked_at IS NULL ORDER BY i.created_at`,[id]);
  }
  async claimSend(id:string,expectedCampaignVersion?:number) {
    return (await this.query(`UPDATE collab_invitations i SET delivery='sending',send_started_at=now(),expires_at=now()+interval '14 days'
      FROM collab_memberships m,creator_private_contacts c,creator_profiles p,collab_campaigns k
      WHERE i.id=$1 AND i.delivery='prepared' AND i.revoked_at IS NULL AND m.id=i.membership_id
      AND m.status='invited' AND c.creator_id=m.creator_id AND p.id=m.creator_id AND p.status='active'
      AND lower(c.email)=lower(i.recipient) AND c.project_notifications_enabled AND c.notification_paused_at IS NULL
      AND k.slug=m.campaign_slug AND k.state='live' AND ($2::int IS NULL OR k.version=$2) RETURNING i.*`,[id,expectedCampaignVersion??null]))[0]||null;
  }
  async finishSend(id:string,providerId:string|null) {
    await this.query(`UPDATE collab_invitations SET delivery=$2,provider_id=$3,sent_at=CASE WHEN $3::text IS NOT NULL THEN now() END WHERE id=$1 AND delivery='sending'`,[id,providerId?'sent':'unknown',providerId]);
  }
  async reconcileSend(id:string,providerId:string,sentAt:string) {
    return this.query(`WITH updated AS (UPDATE collab_invitations SET delivery='sent',provider_id=$2,sent_at=$3::timestamptz
      WHERE id=$1 AND delivery IN ('sending','unknown') RETURNING membership_id), logged AS (
      INSERT INTO collab_events(membership_id,kind,actor,details) SELECT membership_id,'send_reconciled','admin',jsonb_build_object('providerId',$2::text) FROM updated)
      SELECT * FROM updated`,[id,providerId,sentAt]);
  }
  async emailEvent(inviteId:string,eventId:string,kind:string,providerId:string,at:string) {
    // Webhooks are authenticated by Resend before this method is called. They may arrive before the send response.
    await this.query(`WITH logged AS (INSERT INTO collab_events(membership_id,kind,actor,idempotency_key,details,occurred_at)
      SELECT membership_id,$3,'resend',$2,jsonb_build_object('providerId',$4::text),$5::timestamptz FROM collab_invitations WHERE id=$1
      ON CONFLICT(idempotency_key) DO NOTHING RETURNING membership_id)
      UPDATE collab_invitations SET provider_event=$3,provider_event_at=$5::timestamptz
      WHERE id=$1 AND membership_id IN(SELECT membership_id FROM logged)
      AND (provider_event_at IS NULL OR provider_event_at<=$5::timestamptz)`,[inviteId,eventId,kind,providerId,at]);
    if(['email.bounced','email.failed','email.suppressed','email.complained'].includes(kind)) {
      await this.query(`WITH stopped AS (UPDATE collab_invitations SET delivery='suppressed',revoked_at=coalesce(revoked_at,now()) WHERE id=$1 RETURNING membership_id)
       UPDATE creator_private_contacts SET notification_paused_at=now() WHERE creator_id IN(SELECT creator_id FROM collab_memberships WHERE id IN(SELECT membership_id FROM stopped))`,[inviteId]);
    }
  }
}
export const newBatchId = () => crypto.randomUUID();
