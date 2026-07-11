# syntax=docker/dockerfile:1

# ---- Build stage: install deps and build the client ----
FROM node:20-slim AS build
WORKDIR /app

# Install dependencies against the lockfile for reproducible builds.
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the source and build the client bundle into /app/dist.
COPY . .
RUN npm run build

# Remove dev dependencies to slim the runtime image.
RUN npm prune --omit=dev

# ---- Runtime stage: minimal image running the server ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy only what the server needs at runtime.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/package.json ./package.json

# Cloud Run injects PORT; default to 8080 for local runs.
ENV PORT=8080
EXPOSE 8080

# Run as the built-in non-root user for a smaller attack surface.
USER node

CMD ["npm", "run", "start"]
