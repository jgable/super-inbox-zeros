# Use Node.js version 10
FROM mhart/alpine-node:10 as builder

# Set the working directory
WORKDIR /usr/src

# Copy package manager files to the working directory and run install
COPY package.json package-lock.json ./
RUN npm install

# Copy all files to the working directory
COPY . .

# Run tests
RUN CI=true npm run test

# Build the app and move the resulting build to the `/public` directory
ENV NODE_ENV=production
RUN npm run build

FROM mhart/alpine-node:10 as runner

WORKDIR /usr/src

COPY package.json package-lock.json ./
ENV NODE_ENV=production
RUN npm install --only=prod

# Copy all files to the working directory
COPY . .
# Copy the built files to the working directory
COPY --from=builder /usr/src/build ./build

EXPOSE 3000

CMD ["npm", "run", "start"]
