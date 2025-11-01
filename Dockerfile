FROM node:18-alpine

WORKDIR /app

# Install MCP server globally
RUN npm install -g dataforseo-mcp-server

# Add npm global bin to PATH explicitly
ENV PATH="/usr/local/lib/node_modules/.bin:/usr/local/bin:${PATH}"

# Set default environment variables (override via hosting platform)
# Note: Railway will provide PORT automatically, but we set a default
ENV DATAFORSEO_USERNAME=""
ENV DATAFORSEO_PASSWORD=""
ENV DATAFORSEO_SIMPLE_FILTER="true"
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check with proper error handling and timeout
# Handles: connection errors, timeouts, DNS failures, and non-200 status codes
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const req=http.get('http://localhost:'+(process.env.PORT||3000)+'/mcp',{timeout:2000},(r)=>{req.destroy();process.exit(r.statusCode===200?0:1)});req.on('error',()=>{req.destroy();process.exit(1)});req.on('timeout',()=>{req.destroy();process.exit(1)});"

# Start HTTP server - use sh -c with explicit PATH resolution
CMD ["sh", "-c", "dataforseo-mcp-server http"]
