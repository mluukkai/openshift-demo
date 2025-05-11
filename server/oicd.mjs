import * as openidClient from 'openid-client'
import passport from 'passport'

const OIDC_ISSUER        = process.env.OIDC_ISSUER
const OIDC_CLIENT_ID     = process.env.OIDC_CLIENT_ID
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET
const OIDC_REDIRECT_URI  = process.env.OIDC_REDIRECT_URI

const getClient = async () => {
  const issuer = await openidClient.Issuer.discover(OIDC_ISSUER)

  const client = new issuer.Client({
    client_id: OIDC_CLIENT_ID,
    client_secret: OIDC_CLIENT_SECRET,
    redirect_uris: [OIDC_REDIRECT_URI],
    response_types: ['code'],
  })
 
  return client
}

const verifyLogin = async (_tokenSet, userinfo, done) => {
  console.log('userinfo', userinfo)

  const user = {
    id: userinfo.sub,
    username: userinfo.uid,
    name: userinfo.name,
  }

  // save user to db if that is required in your app

  done(null, user)
}

export const setupAuthentication = async () => {
  const client = await getClient()

  passport.serializeUser((user, done) => {
    return done(null, user)
  })

  passport.deserializeUser((obj, done) => {
    return done(null, obj)
  })

  const object = {
    cn: { essential: true },
    name: { essential: true },
    given_name: { essential: true },
    hyGroupCn: { essential: true },
    email: { essential: true },
    family_name: { essential: true },
    uid: { essential: true },
  }
  
  const params = {
    scope: 'openid profile email',
    claims: {
      id_token: object,
      userinfo: object,
    },
  }
  
  passport.use('oidc', new openidClient.Strategy({ client, params }, verifyLogin))
}
