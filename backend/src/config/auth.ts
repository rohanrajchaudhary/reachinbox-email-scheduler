import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error("Google account email not available")
          );
        }

        return done(null, {
          googleId: profile.id,
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value || null,
        });
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;