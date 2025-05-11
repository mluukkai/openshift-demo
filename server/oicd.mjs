import * as openidClient from 'openid-client'
import passport from 'passport'

const OIDC_ISSUER        = process.env.OIDC_ISSUER
const OIDC_CLIENT_ID     = process.env.OIDC_CLIENT_ID
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET
const OIDC_REDIRECT_URI  = process.env.OIDC_REDIRECT_URI

const params = {
  scope: 'openid profile email',
  claims: {
    id_token: {
      uid: { essential: true },
      hyPersonSisuId: { essential: true },
      given_name: { essential: true },
      family_name: { essential: true },
      schacDateOfBirth: { essential: true },
      email: { essential: true },
      hyGroupCn: { essential: true },
    },
    userinfo: {
      uid: { essential: true },
      hyPersonSisuId: { essential: true },
      given_name: { essential: true },
      family_name: { essential: true },
      schacDateOfBirth: { essential: true },
      email: { essential: true },
      hyGroupCn: { essential: true },
    },
  },
}

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
    language: 'fi',
  }

  done(null, { ...user})
}

export const setupAuthentication = async () => {
  const client = await getClient()

  passport.serializeUser((user, done) => {
    return done(null, user)
  })

  passport.deserializeUser((obj, done) => {
    return done(null, obj)
  })

  passport.use('oidc', new openidClient.Strategy({ client, params }, verifyLogin))
}
