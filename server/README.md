# Personal Bible guidance

Prepared topics work offline. The custom question field uses this separate Node 22+ service; the Expo app stays a static mobile/web client.

1. Set `OPENAI_API_KEY` on the server, never in an `EXPO_PUBLIC_` variable or app bundle.
2. Run `npm run guidance:server`. Optional server variables: `GUIDANCE_PORT` (8787), `OPENAI_GUIDANCE_MODEL` (gpt-4o-mini), and comma-separated `GUIDANCE_ALLOWED_ORIGINS` (http://localhost:8081).
3. Set `EXPO_PUBLIC_GUIDANCE_API_URL` in the Expo app to the deployed HTTPS `/guidance` endpoint. Local native devices need the server computer's reachable LAN address, rather than localhost. Restart Expo after changing environment configuration.

Only the question is transmitted. Journal, reflections, goals, and cycle data are not submitted. Requests use `store: false`; provider retention policies still apply. This implementation does not log questions or responses. Client and server validate exactly five distinct catalog verse IDs; displayed Scripture always comes from bundled KJV text. AI generates the explanation and small step, not Scripture quotations.

The service has CORS allowlisting, input limits, timeouts, per-IP throttling, and an instance-wide request cap. Before public deployment, put it behind your application's authenticated API gateway and persistent shared rate limits; CORS and in-memory limits are not account authentication. Do not place a shared server secret in the mobile bundle. No deployment or live billable model call is performed by this change.

Official implementation reference: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses
