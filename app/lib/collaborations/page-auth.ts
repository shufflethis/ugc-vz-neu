import { cookies } from 'next/headers';
import { CREATOR_SESSION_COOKIE,verifySession } from '../creator-session';
import { COLLAB_SESSION_COOKIE } from './model';
export function pageIdentity() {return {creatorId:verifySession(cookies().get(CREATOR_SESSION_COOKIE)?.value),session:cookies().get(COLLAB_SESSION_COOKIE)?.value||null};}
