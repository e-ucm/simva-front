 # stick with Debian, not Alpine
FROM node:26.8.1-bullseye-slim AS base
WORKDIR /app

# Entrypoint runs scripts with /bin/sh; ensure it's bash (not dash) for -o pipefail support
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates bash && \
    ln -sf /bin/bash /bin/sh && \
    rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY  --chown=node:node package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS dev

RUN npm install -g clinic
RUN chown -R node:node /app/node_modules

USER node
EXPOSE 3050

# Default CMD, can be overridden by docker-compose
CMD [ "npm", "run", "dev" ]

FROM base AS prod

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

USER node

# Make port 3050 available to the world outside this container
EXPOSE 3050

CMD [ "npm", "start" ]
