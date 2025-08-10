# JIRA Client-Side Feature Extractor

A modern TypeScript React application for extracting and exporting JIRA issues directly from your browser. No server required - all operations happen client-side with your JIRA Server v9.12.

## Features

- ✅ **Client-side only** - No backend server required
- ✅ **TypeScript** - Full type safety and developer experience
- ✅ **Modern UI** - Built with React and Ant Design
- ✅ **Secure** - Credentials stored only in browser session
- ✅ **Multiple export formats** - XML, JSON, CSV
- ✅ **JQL query support** - Full JIRA Query Language support
- ✅ **Real-time progress** - Background processing with progress indicators
- ✅ **Query templates** - Save and reuse common queries
- ✅ **Responsive design** - Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites

- Node.js 18+ and Yarn Berry (v4.9.2+)
- Access to JIRA Server v9.12 with Personal Access Token (PAT)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd jira-client-extractor

# Enable Yarn Berry (if not already enabled globally)
corepack enable

# Install dependencies (Yarn Berry is pre-configured)
yarn install

# Start development server
yarn dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
# Build the application
yarn build

# Preview the build
yarn preview
```

The built files will be in the `dist/` directory and can be served from any web server.

## Usage

### 1. Connect to JIRA

1. Enter your JIRA Server URL (e.g., `https://your-company.atlassian.net`)
2. Enter your email address
3. Enter your Personal Access Token (PAT)
4. Click "Connect to JIRA"

### 2. Create a Personal Access Token

For JIRA Server, you'll need to create a PAT:

1. Go to your JIRA instance
2. Navigate to **Profile** → **Personal Access Tokens**
3. Click **Create Token**
4. Give it a name and set appropriate permissions
5. Copy the generated token (you won't see it again!)

### 3. Query Issues

1. Switch to the "Query & Results" tab
2. Enter a JQL query or select from templates
3. Click "Execute Query" to fetch results
4. Use "Load More" to paginate through large result sets

### 4. Export Data

1. Switch to the "Export" tab
2. Configure export options:
   - Format: XML, JSON, or CSV
   - Include comments, attachments, worklogs
   - Include subtasks and issue links
   - Custom field selection
3. Click "Export" to download the file

## JQL Query Examples

```jql
# All open issues in a project
project = "PROJ" AND status != Done

# Issues assigned to you
assignee = currentUser() AND status != Done

# Recently updated issues
updated >= -7d ORDER BY updated DESC

# High priority bugs
priority = High AND issuetype = Bug

# Epic and its stories
"Epic Link" = PROJ-123 OR key = PROJ-123
```

## Architecture

### Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Ant Design** - UI component library
- **Zustand** - State management
- **Axios** - HTTP client
- **fast-xml-parser** - XML generation
- **PapaParse** - CSV generation

### Project Structure

```
src/
├── components/          # React components
│   ├── ConnectionSetup/ # JIRA connection form
│   ├── QueryBuilder/    # JQL query interface
│   ├── ResultsViewer/   # Data display and pagination
│   └── common/          # Shared UI components
├── services/            # Business logic
│   ├── jira-client.ts   # JIRA API wrapper
│   ├── export-service.ts# Export functionality
│   └── storage.ts       # Local storage management
├── stores/              # Zustand state stores
│   ├── connection-store.ts
│   ├── query-store.ts
│   └── export-store.ts
├── types/               # TypeScript definitions
└── utils/               # Helper functions
```

### Key Features

#### Security
- Credentials stored in sessionStorage only
- No data transmitted to external servers
- CORS-enabled for JIRA Server v9.12
- Input validation and sanitization

#### Performance
- Background processing with Web Workers
- Pagination for large datasets
- Progress indicators for long operations
- Efficient memory management

#### User Experience
- Real-time connection testing
- Query validation and error handling
- Template-based queries with history
- Responsive design for all devices

## Development

### Available Scripts

```bash
yarn dev         # Start development server
yarn build       # Build for production
yarn preview     # Preview production build
yarn lint        # Run ESLint
```

### Environment Variables

Create a `.env` file for local development:

```env
VITE_APP_VERSION=1.0.0
VITE_DEFAULT_JIRA_URL=https://your-default-server.com
```

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Troubleshooting

### Connection Issues

1. **"Connection refused"** - Check the JIRA URL format
2. **"Authentication failed"** - Verify your PAT is correct and has appropriate permissions
3. **"CORS error"** - Ensure your JIRA Server allows cross-origin requests

### Export Issues

1. **"No data to export"** - Execute a query first to fetch data
2. **"Export failed"** - Try a smaller dataset or different format
3. **Large files** - Use pagination or filters to reduce data size

### Performance Issues

1. **Slow queries** - Use more specific JQL filters
2. **Memory issues** - Reduce maxResults or use pagination
3. **Browser freezing** - Enable background processing in settings

## Security Considerations

- Never commit credentials to version control
- Use HTTPS for all JIRA connections
- Regularly rotate your Personal Access Tokens
- Clear browser data when using shared computers

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run linting: `yarn lint`
5. Build to verify: `yarn build`
6. Commit changes: `git commit -am 'Add feature'`
7. Push to branch: `git push origin feature-name`
8. Submit a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Search existing issues on GitHub
3. Create a new issue with detailed information

---

**Note**: This application is designed specifically for JIRA Server v9.12 and may require adjustments for other versions.