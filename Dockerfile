# Stage 1: Build the application
FROM node:20-alpine AS builder

# Install build dependencies for native modules (like sharp)
RUN apk add --no-cache python3 make g++ libc6-compat

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Set memory limit for Node.js build process to prevent OOM
# Use 4GB (will use swap if physical RAM is lower)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy configuration files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (ignore scripts initially to avoid missing config errors)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy the rest of the application code
COPY . .

# Generate the .svelte-kit directory (fixes tsconfig and sync warnings)
RUN pnpm svelte-kit sync

# Build the SvelteKit application
RUN pnpm run build

# Stage 2: Run the application
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm for production dependency management
RUN npm install -g pnpm

# Copy only necessary files from the builder stage
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/static ./static

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Start the SvelteKit application
CMD ["node", "build/index.js"]
