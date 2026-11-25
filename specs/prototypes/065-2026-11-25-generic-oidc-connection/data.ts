// Fixed data of the Admin 065 prototype: Acme signs people in on its own OpenID Connect
// server, with no Okta, Entra ID, Google Workspace or Keycloak. Invented for the layout only.

export const workspaceLabel = 'Acme / Production';

export const issuer = 'https://login.acme.com';

// What "Read discovery" shows: the fields of /.well-known/openid-configuration that the
// connection uses (OpenID Connect Discovery 1.0).
export const discovery = {
  authorization_endpoint: 'https://login.acme.com/oauth2/authorize',
  token_endpoint: 'https://login.acme.com/oauth2/token',
  jwks_uri: 'https://login.acme.com/.well-known/jwks.json',
  signing: ['RS256', 'ES256'],
  claims: ['sub', 'email', 'email_verified', 'name', 'groups'],
  keys: 2,
};

// A rejected provider: it signs tokens with a shared secret only.
export const rejected = {
  issuer: 'https://auth.legacy-acme.com',
  signing: ['HS256'],
};

export const audiences = ['https://acme.xokepoint.com/mcp'];

export const redirectUri = 'https://acme.xokepoint.com/as/harness/callback';

// People of the connection (People page). Without a directory, a person exists after the first
// harness login or token exchange; identified by issuer and sub, the email shown only when verified.
// seen: only token exchanges so far; approval applies to harness login only.
// revoked: approval taken back; the person can not log in from a harness until approved again.
export type PersonStatus = 'pending' | 'approved' | 'revoked' | 'seen';
export type Person = {
  sub: string; name: string; email?: string; groups: string[]; status: PersonStatus;
  firstSeen: string; via: 'Harness login' | 'Token exchange'; lastSignIn: string;
};
export const people: Person[] = [
  { sub: 'u_7f3a21c9', name: 'Marina Lopes', email: 'marina.lopes@acme.com', groups: ['finance'], status: 'pending', firstSeen: 'Nov 25, 09:12', via: 'Harness login', lastSignIn: 'Nov 25, 09:12' },
  { sub: 'u_19bd04e2', name: 'Rafael Costa', email: 'rafael.costa@acme.com', groups: ['support'], status: 'pending', firstSeen: 'Nov 25, 08:47', via: 'Harness login', lastSignIn: 'Nov 25, 08:47' },
  { sub: 'u_c03e88aa', name: 'Lucas Prado', email: 'lucas.prado@acme.com', groups: ['ops'], status: 'pending', firstSeen: 'Nov 24, 18:30', via: 'Harness login', lastSignIn: 'Nov 24, 18:30' },
  { sub: 'u_5a1f7d30', name: 'Beatriz Nunes', email: 'beatriz.nunes@acme.com', groups: ['finance', 'admins'], status: 'approved', firstSeen: 'Nov 20, 10:05', via: 'Harness login', lastSignIn: 'Nov 25, 07:58' },
  { sub: 'u_2e9c6b14', name: 'Diego Almeida', email: 'diego.almeida@acme.com', groups: ['support'], status: 'approved', firstSeen: 'Nov 21, 14:22', via: 'Harness login', lastSignIn: 'Nov 24, 16:40' },
  { sub: 'u_8d40a7f1', name: 'u_8d40a7f1', groups: ['finance'], status: 'seen', firstSeen: 'Nov 22, 11:03', via: 'Token exchange', lastSignIn: 'Nov 25, 06:15' },
];
