FROM node:18-alpine

# Install Tesseract and its dependencies
RUN apk add --no-cache tesseract-ocr

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create directory for temporary image storage
RUN mkdir -p temp-images

# Start the worker
CMD ["npm", "start"]
