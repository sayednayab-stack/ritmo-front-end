import { describe, expect, it } from 'vitest';
import { classifyAuthFailure, isAllowedPath, jwtExpiry, parseCookie } from './lib';

describe('isAllowedPath', () => {
  it.each(['admin/bookings', 'vendors', 'fleet/12', 'auth/me', 'iway/schedulers/status', 'fleet_requests'])('allows %s', (p) => {
    expect(isAllowedPath(p)).toBe(true);
  });

  it.each(['auth/users', 'auth/register', 'ritmo/dispatch', 'ritmo/cm/webhook', 'fleetx', 'admin/../auth/users', '', 'authme'])(
    'blocks %s',
    (p) => {
      expect(isAllowedPath(p)).toBe(false);
    }
  );
});

describe('jwtExpiry', () => {
  const token = (payload: object) => `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

  it('reads exp', () => expect(jwtExpiry(token({ exp: 1792408693 }))).toBe(1792408693));
  it('returns null without exp', () => expect(jwtExpiry(token({ sub: 'a' }))).toBeNull());
  it('returns null for garbage', () => expect(jwtExpiry('not-a-jwt')).toBeNull());
});

describe('parseCookie', () => {
  it('finds a cookie among several', () => {
    expect(parseCookie('a=1; ritmo_token=abc.def; b=2', 'ritmo_token')).toBe('abc.def');
  });
  it('does not match a name suffix', () => expect(parseCookie('x_ritmo_token=1', 'ritmo_token')).toBeUndefined());
  it('handles a missing header', () => expect(parseCookie(undefined, 'ritmo_token')).toBeUndefined());
  it('survives malformed encoding', () => expect(parseCookie('ritmo_token=%E0%A4%A', 'ritmo_token')).toBeUndefined());
});

describe('classifyAuthFailure', () => {
  it('ends the session on an expired/invalid user token', () => {
    expect(classifyAuthFailure(401, { detail: 'Invalid token' })).toMatchObject({ status: 401, endSession: true });
  });

  it('does NOT end the session when the API key is wrong', () => {
    const r = classifyAuthFailure(401, { detail: 'Invalid API key' });
    expect(r).toMatchObject({ status: 502, endSession: false });
    expect(r?.detail).toMatch(/EXTERNAL_API_KEY/);
  });

  it('explains a missing X-Api-Key header instead of a bare 422', () => {
    const body = { detail: [{ type: 'missing', loc: ['header', 'x-api-key'], msg: 'Field required' }] };
    expect(classifyAuthFailure(422, body)).toMatchObject({ status: 502, endSession: false });
  });

  it("recognises this backend's own 422 shape for a missing key", () => {
    const body = { detail: 'Invalid request data.', errors: { 'header.x-api-key': 'This field is required.' } };
    expect(classifyAuthFailure(422, body)).toMatchObject({ status: 502, endSession: false });
  });

  it("leaves the backend's own 422 for other fields alone", () => {
    expect(classifyAuthFailure(422, { detail: 'Invalid request data.', errors: { 'body.name': 'required' } })).toBeNull();
  });

  it('leaves ordinary validation errors alone', () => {
    const body = { detail: [{ type: 'missing', loc: ['body', 'name'], msg: 'Field required' }] };
    expect(classifyAuthFailure(422, body)).toBeNull();
  });

  it('ignores non-credential statuses', () => {
    expect(classifyAuthFailure(404, { detail: 'Not found' })).toBeNull();
    expect(classifyAuthFailure(500, null)).toBeNull();
  });
});
