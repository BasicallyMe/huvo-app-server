Bun.serve({
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
    open(ws) {
      console.log(`Connection received for channel ${ws.data.channelID}`);
      ws.subscribe(ws.data.channelID);
      ws.publish(ws.data.channelID, "A user has joined the channel");
    },
    message(ws, message) {
      console.log("Message received", message);
    },
    close(ws) {
        ws.unsubscribe(ws.data.channelID)
    }
  },
});
