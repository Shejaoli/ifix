// IFIX — Admin push notification service worker
// Only handles push events and notification clicks. Does not intercept
// fetch requests or provide offline caching — scope is intentionally narrow.

self.addEventListener("push", (event) => {
  let data = { title: "IFIX", body: "You have a new notification.", url: "/admin" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    // If the payload isn't JSON, fall back to defaults above.
  }

  const options = {
    body: data.body,
    icon: "/favicon.png",
    badge: "/favicon.png",
    data: { url: data.url || "/admin" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
