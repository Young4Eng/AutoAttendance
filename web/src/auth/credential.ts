/** GIS credential JWT → Owner. Token stays in memory only. */

import type { Owner } from '../types/models';

export function ownerFromCredentialJwt(credential: string): Owner {
  const payloadPart = credential.split('.')[1];
  if (!payloadPart) {
    throw new Error('invalid_credential');
  }
  const json = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(json) as {
    sub?: string;
    email?: string;
    name?: string;
  };
  if (!payload.sub) {
    throw new Error('missing_sub');
  }
  return {
    ownerSub: payload.sub,
    email: payload.email,
    displayName: payload.name,
  };
}
