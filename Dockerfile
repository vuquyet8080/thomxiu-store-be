FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN yarn build

# Expose port
EXPOSE 9000

# Start the server
CMD ["yarn", "start"] 