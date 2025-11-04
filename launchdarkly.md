## Walking through how to run this app

Prerequisites:
- Node.js (v14 or higher)
- npm or yarn

Assumptions:
- You're on a mac 

1. Clone repository
2. Install dependencies using `npm install`
3. Copy `.env.example` to `env` and set the LD_SDK_KEY value
4. Update API key in app.js on line 10
5. Create `dark-mode` feature flag in LaunchDarkly
6. Create `gmail-users` Segment in LaunchDarkly
7. Start the server using `npm start`
8. Open your browser and navigate to `http://localhost:3000`


Other tidbits:

(1)
Run the following command to flip the `dark-mode` FF.
curl -X PATCH https://app.launchdarkly.com/api/v2/flags/default/dark-mode \
  -H "Authorization: ldApiKey" \
  -H "Content-Type: application/json; domain-model=launchdarkly.semanticpatch" \
  -d '{
        "environmentKey": "test",
        "instructions": [{"kind": "turnFlagOff"}]
    }

(2)
This app uses Datadog RUM and is integrated with DD's LaunchDarkly feature-flag tracking

(3)
There are tests in the `tests/` directory that can be automated through Playwright, but they're mainly used to generate traffic for LD experiments.