import supertokens from 'supertokens-node';
import Session from 'supertokens-node/recipe/session';
import ThirdParty from 'supertokens-node/recipe/thirdparty';
import { TypeInput } from 'supertokens-node/types';

const connectionURI = process.env.SUPERTOKENS_CONNECTION_URI || 'http://localhost:3567';
const apiKey = process.env.SUPERTOKENS_API_KEY;

const appInfo = {
  appName: 'BookScan',
  apiDomain: process.env.API_URL || 'http://localhost:4000',
  websiteDomain: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiBasePath: '/auth',
  websiteBasePath: '/auth'
};

export const config: TypeInput = {
  framework: 'express',
  supertokens: {
    connectionURI,
    apiKey
  },
  appInfo,
  recipeList: [
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [{
          config: {
            thirdPartyId: 'google',
            clients: [{
              clientId: process.env.GOOGLE_CLIENT_ID || '',
              clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
            }]
          }
        }, {
          config: {
            thirdPartyId: 'github',
            clients: [{
              clientId: process.env.GITHUB_CLIENT_ID || '',
              clientSecret: process.env.GITHUB_CLIENT_SECRET || ''
            }]
          }
        }, {
          config: {
            thirdPartyId: 'facebook',
            clients: [{
              clientId: process.env.FACEBOOK_CLIENT_ID || '',
              clientSecret: process.env.FACEBOOK_CLIENT_SECRET || ''
            }]
          }
        }]
      }
    }),
    Session.init()
  ],
  isInServerlessEnv: false
};

supertokens.init(config);

export { supertokens };
