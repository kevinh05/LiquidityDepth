import WebSocket from "ws";

const GRAPHQL_WS_ENDPOINT = "wss://graph.defined.fi/graphql";
const AUTH_TOKEN = ""; 

// Define the subscription payload
const subscriptionPayload = {
  type: "start",
  id: "1", // Unique ID for this subscription
  payload: {
    query: `
      subscription OnPairMetadataUpdated($id: String) {
        onPairMetadataUpdated(id: $id) {
          
        }
      }
    `,
    variables: {
      id: "0x11b815efB8f581194ae79006d24E0d814B7697F6:1" // Replace with your pair ID
    }
  }
};

// Create a WebSocket connection
const ws = new WebSocket(GRAPHQL_WS_ENDPOINT, {
  headers: {
    Authorization: AUTH_TOKEN
  }
});

// Event: WebSocket connection opened
ws.on("open", () => {
  console.log("WebSocket connection opened.");

  // Send connection initialization
  ws.send(
    JSON.stringify({
      type: "connection_init",
      payload: {
        Authorization: AUTH_TOKEN
      }
    })
  );

  // Send the subscription payload after initialization
  setTimeout(() => {
    ws.send(JSON.stringify(subscriptionPayload));
    console.log("Subscription started.");
  }, 500); // Small delay to ensure the connection is ready
});

// Event: Receiving a message
ws.on("message", (message) => {
  const data = JSON.parse(message);

  switch (data.type) {
    case "data":
      console.log("Received subscription data:", data.payload);
      break;

    case "error":
      console.error("Subscription error:", data.payload);
      break;

    case "complete":
      console.log("Subscription complete.");
      break;

    default:
      console.log("Other message type:", data);
  }
});

// Event: WebSocket connection closed
ws.on("close", () => {
  console.log("WebSocket connection closed.");
});

// Event: WebSocket error
ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});
