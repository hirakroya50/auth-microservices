# Step 1: Use a Node base image
FROM node:18

# Install PostgreSQL and Redis ( run the postgrads and redis inside the container )
RUN apt-get update && apt-get install -y \
  postgresql \
  redis-server \
  && rm -rf /var/lib/apt/lists/*

# Step 2: Set the working directory
WORKDIR /usr/src/app

# Step 3: Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Step 4: Install all dependencies (both dev and prod)
RUN npm install

# Step 5: Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Step 6: Build the application
RUN npm run build

# Step 7: Remove development dependencies for a slimmer image
RUN npm prune --production

# Step 8: Expose the application port
EXPOSE 3001 5432 6379

# Step 9: Define the command to run the application
CMD ["node", "dist/main"]
