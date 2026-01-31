import SuperTokens from 'supertokens-auth-react';
import ThirdParty, { Google } from 'supertokens-auth-react/recipe/thirdparty';
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword';
import Session from 'supertokens-auth-react/recipe/session';

SuperTokens.init({
  appInfo: {
    appName: 'AllMyBooks',
    apiDomain: 'https://local.allmybooks.com',
    websiteDomain: 'https://local.allmybooks.com',
    apiBasePath: '/auth',
    websiteBasePath: '/auth',
  },
  recipeList: [
    ThirdParty.init({
      signInAndUpFeature: {
        providers: [Google.init()],
      },
    }),
    EmailPassword.init(),
    Session.init(),
  ],
});
