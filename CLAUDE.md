# Claude AI Assistant Guidelines for Sultana Dining Project

## ⚠️ CRITICAL RULES

### NEVER DELETE FILES
**ABSOLUTE RULE: You are NEVER to delete any files in this project.**
- Only make edits to existing files
- Only create new files when necessary
- If a file needs to be replaced, edit it instead
- If you think a file should be removed, ask the user first
- No exceptions to this rule

## Project Overview

Sultana Dining is a mobile-first menu proposal tool for desert resort chefs. It's a monorepo with:
- **API**: Node.js + TypeScript backend (Fastify, Prisma, PostgreSQL)
- **mobile-ios**: iOS SwiftUI app (iOS 17+)
- **Goal**: Clean, sleek UI for quick menu creation with automatic cost calculations

## Tech Stack Reference

### API (Node.js)
- **Runtime**: Node 20.x
- **Package Manager**: pnpm 9.x
- **Framework**: Fastify
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Validation**: Zod
- **Logging**: Pino
- **Auth**: Google OAuth → JWT (access/refresh tokens)
- **Testing**: Vitest

### iOS
- **Platform**: iOS 17+
- **UI**: SwiftUI + MVVM pattern
- **Networking**: URLSession (async/await)
- **Storage**: Keychain (tokens), SwiftData
- **PDF**: PDFKit for proposal export
- **Testing**: XCTest

## Development Workflow

### Before Making Changes
1. **Read the relevant code first** - Always use Read tool to understand context
2. **Check existing patterns** - Follow established code patterns in the project
3. **Verify file locations** - Use Glob/Grep to find related files
4. **Plan multi-step changes** - Use TodoWrite for complex tasks

### API Development
```bash
# Setup
cd api
pnpm install
pnpm prisma migrate dev

# Development
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm lint         # Lint code
```

### iOS Development
- Open `mobile-ios/App.xcodeproj` in Xcode
- Set signing team and configure `GOOGLE_CLIENT_ID`
- Use simulator for testing

### Database Changes
```bash
cd api
pnpm prisma generate              # Generate Prisma client
pnpm prisma migrate dev -n "name" # Create migration
```

## Code Style & Conventions

### TypeScript/Node.js
- Use TypeScript strict mode
- Prefer async/await over promises
- Use Zod for validation schemas
- Follow existing Fastify route patterns
- Use Pino for logging (not console.log)
- Keep environment variables in `.env` (never commit)

### iOS/Swift
- Use SwiftUI (no UIKit unless necessary)
- Follow MVVM architecture
- Use async/await for networking
- Support dark mode
- Add accessibility labels
- Store sensitive data in Keychain only

### Database (Prisma)
- Always create migrations for schema changes
- Use meaningful migration names
- Never modify existing migrations
- Follow existing model patterns
- Use proper relations and indexes

## File Structure Guidelines

### API Structure
```
api/
├─ src/
│  ├─ routes/      # API endpoints
│  ├─ services/    # Business logic
│  ├─ utils/       # Helper functions
│  └─ index.ts     # App entry
├─ prisma/
│  └─ schema.prisma
├─ tests/
└─ .env            # Local only, never commit
```

### iOS Structure
```
mobile-ios/
├─ Views/          # SwiftUI views
├─ ViewModels/     # MVVM view models
├─ Models/         # Data models
├─ Services/       # API client, auth
└─ Utils/          # Helpers
```

## Security Best Practices

### Authentication
- Google OAuth only (passwordless)
- JWT access tokens (15min TTL)
- Refresh tokens (7 day TTL, secure cookies)
- HTTPS only in production
- Store tokens in iOS Keychain

### Sensitive Data
- **Never commit** `.env` files
- **Never commit** API keys or secrets
- **Never commit** `Config.xcconfig` with real values
- Use environment variables for all secrets
- Validate all input with Zod

## API Endpoint Patterns

Follow this structure for new endpoints:
```typescript
// Route handler
app.post('/endpoint', async (request, reply) => {
  // 1. Validate with Zod
  const body = requestSchema.parse(request.body);

  // 2. Authenticate (if needed)
  const userId = await verifyToken(request);

  // 3. Business logic (call service)
  const result = await service.doSomething(body);

  // 4. Return response
  return reply.send(result);
});
```

## Common Tasks

### Adding a New Database Model
1. Edit `api/prisma/schema.prisma`
2. Run `pnpm prisma migrate dev -n "descriptive_name"`
3. Run `pnpm prisma generate`
4. Update TypeScript types if needed

### Adding a New API Endpoint
1. Create/update route file in `api/src/routes/`
2. Create Zod validation schema
3. Implement business logic in service layer
4. Add tests in `api/tests/`
5. Update API documentation if exists

### Adding a New iOS View
1. Create SwiftUI view in `mobile-ios/Views/`
2. Create corresponding ViewModel if needed
3. Follow MVVM pattern
4. Add navigation logic
5. Test on simulator

## Testing Guidelines

### API Tests (Vitest)
- Test all endpoints
- Mock external services (Google OAuth)
- Test validation failures
- Test authentication/authorization

### iOS Tests (XCTest)
- Unit test ViewModels
- Test API client logic
- Test data transformations
- UI tests for critical flows

## Git & Deployment

### Commits
- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Run tests before committing

### Deployment
- **API**: Heroku (runs migrations automatically)
- **iOS**: TestFlight via Xcode Archive

## When to Ask the User

Ask before:
- Making architectural changes
- Adding new dependencies
- Changing database schema significantly
- Modifying authentication flow
- Changing API contracts (breaking changes)
- Creating new configuration files

## Performance Considerations

### API
- Use database indexes for frequent queries
- Implement pagination for list endpoints
- Cache frequently accessed data if needed
- Use connection pooling (Prisma default)

### iOS
- Lazy load data where possible
- Cache API responses appropriately
- Optimize images and assets
- Use SwiftUI performance best practices

## Debugging Tips

### API Issues
- Check Pino logs for errors
- Verify database connections
- Check Prisma queries with logging
- Test endpoints with curl/Postman

### iOS Issues
- Check Xcode console logs
- Verify API_BASE_URL configuration
- Test network requests in isolation
- Check Keychain access

## Project Goals Reminder

### MVP Focus
- Clean, sleek UI (non-technical user-friendly)
- Quick menu creation
- Automatic cost calculations
- PDF proposal generation
- Template saving

### Non-Goals (for now)
- Android client
- Web client
- Complex multi-tenant features

## Best Practices Summary

1. ✅ **Always read before editing**
2. ✅ **Follow existing patterns**
3. ✅ **Use TypeScript strict mode**
4. ✅ **Validate all inputs with Zod**
5. ✅ **Write tests for new features**
6. ✅ **Use proper error handling**
7. ✅ **Keep security in mind**
8. ✅ **Document complex logic**
9. ⚠️ **NEVER delete files**
10. ⚠️ **NEVER commit secrets**

## Questions?

When in doubt:
- Check existing code for patterns
- Read the main README.md
- Ask the user for clarification
- Prefer consistency over personal preferences
