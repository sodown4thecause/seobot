FROM node:18-alpine

WORKDIR /app

# Install MCP server globally
RUN npm install -g dataforseo-mcp-server

# Set default environment variables (override via hosting platform)
ENV DATAFORSEO_USERNAME=""
ENV DATAFORSEO_PASSWORD=""
ENV DATAFORSEO_SIMPLE_FILTER="true"
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/mcp', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start HTTP server
CMD ["dataforseo-mcp-server", "http"]

