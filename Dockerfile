# This Dockerfile builds SPA and PWA artifacts and starts an Nginx if you run it in standalone mode
# The Nginx is supposed to serve the following static assets:
# /var/www for SPA and PWA
# /storage at example.com/media/stream and example.com/media/download (if offload is enabled)
# /covers for cover images (if offload is enabled)
# Nginx should also be configured to reverse proxy to the backend at /api
# Please refer to docs/nginx for examples

# Build SPA and PWA
FROM node:14 as build-stage
WORKDIR /frontend
COPY package*.json ./
RUN npm install -g @quasar/cli && npm install
COPY . .
RUN quasar build && quasar build -m pwa

# We only need the build artifact
FROM nginx:mainline-alpine

# FRONTEND_TYPE can be spa or pwa
ARG FRONTEND_TYPE=pwa
WORKDIR /var/www
COPY --from=build-stage /frontend/dist/${FRONTEND_TYPE} /var/www

# Mount your own Nginx config
RUN rm -rf /etc/nginx/conf.d/*
VOLUME [ "/etc/nginx/conf.d" ]
EXPOSE 80

# If you are using Let's Encrypt
VOLUME [ "/etc/letsencrypt" ]
EXPOSE 443

# Mount offload paths for media files and covers
VOLUME [ "/storage", "/covers" ]

# Note: ENTRYPOINT and CMD is provided by the nginx base image
