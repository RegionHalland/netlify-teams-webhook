import axios from "axios";
require("dotenv").config();

export async function handler(event, context) {
  const method = event.httpMethod;
  console.log("event", event);

  // See if the http method is POST
  if (method !== "POST") {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Only POST requests allowed"
      })
    };
  }

  // Check if we get JSON in the body
  try {
    JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Only JSON POST allowed"
      })
    };
  }

  // Parse body as JSON
  const body = JSON.parse(event.body);
  const state = body.state;
  const deploymentId = body.id;
  const deployUrl = body.deploy_ssl_url;
  const logUrl = `https://app.netlify.com/sites/visithalland-beta/deploys/${deploymentId}`;

  //See if we get everything we need
  if (!body || !state || !deploymentId || !deployUrl || !logUrl) {
    // Something is missing
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing JSON values"
      })
    };
  }

  console.log("body", body);

  // Create object with default values
  const originalPayload = {
    "@context": "https://schema.org/extensions",
    "@type": "MessageCard",
    title: "Netlify",
    potentialAction: [
      {
        "@type": "OpenUri",
        name: "Visa på Visit Halland",
        targets: [{ os: "default", uri: deployUrl }]
      },
      {
        "@type": "OpenUri",
        name: "Visa på Netlify",
        targets: [{ os: "default", uri: logUrl }]
      }
    ]
  };
  let payload = {};

  switch (state) {
    case "building":
      payload = {
        ...originalPayload,
        themeColor: "0072C6",
        text: `**started** deployment of [${deploymentId}](${deployUrl})...`
      };

      break;

    case "ready":
      payload = {
        ...originalPayload,
        themeColor: "11ad45",
        text: `**finished** deployment of [${deploymentId}](${deployUrl})`
      };
      break;

    case "error":
      payload = {
        ...originalPayload,
        themeColor: "b01229",
        text: `deployment [${deploymentId}](${deployUrl}) **failed**.`
      };
      break;

    default:
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing correct state"
        })
      };
      break;
  }

  console.log("payload to send to teams", payload);

  // Send payload to Teams Incoming Webhook
  const res = await axios.post(process.env.TEAMS_ENDPOINT, payload);
  console.log("res", res);

  return {
    statusCode: 200,
    body: JSON.stringify(payload)
  };
}
