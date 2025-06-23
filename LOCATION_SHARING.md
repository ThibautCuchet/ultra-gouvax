# Partage de localisation avec Supabase

Cette application utilise l'API **Realtime** de Supabase pour permettre aux utilisateurs connectés de partager leur position et de voir celles des autres.

## Fonctionnement

- Chaque navigateur obtient un identifiant unique stocké dans `localStorage`.
- Les positions sont envoyées via un canal `realtime` nommé `user_locations`.
- Un hook React (`useShareLocation`) maintient la connexion au canal et suit la position grâce à `navigator.geolocation.watchPosition`.
- Les positions reçues sont affichées sur la carte par le composant `SharedLocationsLayer`.

## Tâches en arrière‑plan

`watchPosition` continue de s'exécuter tant que l'onglet reste ouvert, même en arrière‑plan. Pour un partage fiable lorsque l'application est complètement fermée, il faudrait implémenter une application mobile ou une PWA utilisant un **service worker** avec des permissions spécifiques. Ce dépôt n'inclut pas cette partie.

## Mise en place

1. Vérifiez que les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont correctement renseignées.
2. Lancez le serveur de développement avec `pnpm dev` puis ouvrez l'application.
3. Autorisez la géolocalisation dans votre navigateur pour commencer à partager votre position.

La carte affiche alors les marqueurs correspondant aux autres utilisateurs connectés.

## Intégration LiveTrack

Un script `pnpm update:livetrack` peut être lancé régulièrement (par exemple via un cron) pour récupérer la dernière position depuis Garmin LiveTrack et la diffuser sur le canal `user_locations` sous l'identifiant `charles`.
