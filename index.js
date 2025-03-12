const activeChannels = new Map();
const channelOffers = new Map();

const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    const channelID = new URL(req.url).searchParams.get("channelid");
    if (
      server.upgrade(req, {
        data: {
          createdAt: Date.now(),
          channelID,
        },
      })
    ) {
      return;
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    publishToSelf: false,
    open(ws) {
      const channelID = ws.data.channelID;
      ws.subscribe(channelID);
      if (activeChannels.has(channelID)) {
        console.log('sending create answer');
        activeChannels.set(channelID, activeChannels.get(channelID) + 1);
        const offer = channelOffers.get(channelID);
        if (offer) {
          ws.send(offer);
        }
      } else {
        console.log('sending create offer');
        activeChannels.set(channelID, 1);
        ws.send(JSON.stringify({ type: "create-offer" }));
      }
    },
    message(ws, message) {
      const channelID = ws.data.channelID;
      const data = JSON.parse(message);
      console.log('received data', data);
      if (data.type === "offer") {
        channelOffers.set(channelID, message);
      }
      ws.publish(channelID, message);
    },
    close(ws) {
      const channelID = ws.data.channelID;

      if (activeChannels.has(channelID)) {
        const userCount = activeChannels.get(channelID) - 1;

        if (userCount > 0) {
          activeChannels.set(channelID, userCount);
        } else {
          activeChannels.delete(channelID);
          channelOffers.delete(channelID); // Remove the offer if the channel is empty
        }
      }

      ws.unsubscribe(channelID);
    },
  },
});

console.log(`Server running on ws://${server.hostname}:${server.port}`);
