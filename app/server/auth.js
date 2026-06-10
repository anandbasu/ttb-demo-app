// Shared-password auth (prototype only). Production: SSO / PIV / per-user.

export function requireAuth(req, res, next) {
  if (req.session?.authed) return next();
  return res.status(401).json({ error: 'auth required' });
}

export function login(req, res) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return res.status(500).json({ error: 'APP_PASSWORD not configured on server' });
  }
  const provided = req.body?.password;
  if (typeof provided !== 'string' || provided.length === 0) {
    return res.status(400).json({ error: 'password required' });
  }
  if (provided !== expected) {
    return res.status(401).json({ error: 'invalid password' });
  }
  req.session.authed = true;
  res.json({ ok: true });
}

export function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true }));
}

export function authStatus(req, res) {
  res.json({ authed: Boolean(req.session?.authed) });
}
