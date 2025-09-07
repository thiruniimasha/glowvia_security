export const mapAuthToUser = (req, res, next) => {
  if (req.auth) {
    
    req.user = {
      id: req.auth.sub,            
      email: req.auth.email || null,
      name: req.auth.name || null,
      nickname: req.auth.nickname || null,
      picture: req.auth.picture || null,
      sub: req.auth.sub,          
      ...req.auth                  
    };

   
    console.log(' Mapped Auth0 user:', {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    });
  } else {
    console.warn(' No auth data found in request');
  }

  next();
};
