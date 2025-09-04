export const mapAuthToUser = (req, res, next) => {
  if (req.auth) {
    // Normalize Auth0 claims to match your app’s "req.user" structure
    req.user = {
      id: req.auth.sub,            // Always unique (Auth0 user ID)
      email: req.auth.email || null,
      name: req.auth.name || null,
      nickname: req.auth.nickname || null,
      picture: req.auth.picture || null,
      sub: req.auth.sub,           // Keep original subject
      ...req.auth                  // Spread remaining claims (roles, permissions, etc.)
    };

    // Helpful debug logging (disable in production!)
    console.log('✅ Mapped Auth0 user:', {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    });
  } else {
    console.warn('⚠️ No auth data found in request');
  }

  next();
};
