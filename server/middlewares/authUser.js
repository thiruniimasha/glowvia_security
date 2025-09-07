import { expressjwt as jwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

console.log('Auth0 Configuration:', {
  domain: process.env.AUTH0_DOMAIN,
  audience: process.env.AUTH0_AUDIENCE,
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});


export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
  requestProperty: 'auth', 
});


export const authMiddleware = (req, res, next) => {
  console.log(' Checking Auth0 token...');
  console.log('Authorization header:', req.headers.authorization);

  checkJwt(req, res, (err) => {
    if (err) {
      console.error(' JWT validation failed:', {
        name: err.name,
        message: err.message,
        code: err.code,
        status: err.status,
      });

      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: err.message,
        errorType: err.name,
      });
    }

    console.log(' JWT valid. Decoded claims:', req.auth);
    next();
  });
};
