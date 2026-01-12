const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const prisma = require('../services/database');

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
    passReqToCallback: true // Permet de lire req.query
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Décoder le userType depuis le paramètre 'state'
      let userType = 'user';
      if (req.query.state) {
        try {
          const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
          if (state.userType === 'expert') {
            userType = 'expert';
          }
        } catch (e) {
          console.error("Impossible de parser l'état :", e);
        }
      }
      
      const email = profile.emails[0].value;
      let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

      if (user) {
        return done(null, user);
      }

      user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.id }
        });
        return done(null, user);
      }

      // Utiliser une transaction pour créer l'utilisateur et l'expert si nécessaire
      const newUser = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            googleId: profile.id,
            email: email,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            avatar: profile.photos[0].value,
            isVerified: true,
            userType: userType // Utilisation du userType récupéré
          }
        });

        if (userType === 'expert') {
          await tx.expert.create({
            data: {
              userId: createdUser.id,
              name: `${createdUser.firstName} ${createdUser.lastName}`,
              specialty: 'Non spécifiée',
              category: 'Non classée',
              hourlyRate: 0,
              pricePerMessage: 0,
              tags: '[]',
              languages: '[]',
              description: 'Profil en attente de complétion.',
              verified: false
            }
          });
        }
        return createdUser;
      });

      return done(null, newUser);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'emails', 'name', 'picture.type(large)']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Vérifier si l'utilisateur existe déjà avec Facebook ID
      let user = await prisma.user.findUnique({ where: { facebookId: profile.id } });

      if (user) {
        return done(null, user);
      }
      
      // Vérifier si l'utilisateur existe avec la même adresse email
      if (profile.emails && profile.emails[0] && profile.emails[0].value) {
        user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });

        if (user) {
          // Lier le compte Facebook à l'utilisateur existant
          user = await prisma.user.update({
            where: { id: user.id },
            data: { facebookId: profile.id }
          });
          return done(null, user);
        }
      }

      // Créer un nouvel utilisateur
      const newUser = await prisma.user.create({
        data: {
          facebookId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          avatar: profile.photos[0].value,
          isVerified: true // Les emails de Facebook sont considérés comme vérifiés
        }
      });
      return done(null, newUser);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Serialize et Deserialize ne sont pas nécessaires pour une session JWT
// mais sont requis par Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});