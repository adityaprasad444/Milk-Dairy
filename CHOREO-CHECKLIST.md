# Choreo Deployment Checklist

## Pre-Deployment Checklist

### Repository Setup
- [ ] Code is pushed to GitHub repository
- [ ] Repository is public or Choreo has access
- [ ] All deployment files are committed
- [ ] .gitignore excludes sensitive files
- [ ] No .env files are committed

### Backend Configuration
- [ ] `server/.choreo/component.yaml` exists
- [ ] `server/.choreo/endpoints.yaml` exists
- [ ] `server/Dockerfile` exists
- [ ] `server/.env.example` exists
- [ ] Port is set to 5000 in server.js
- [ ] CORS is configured for production
- [ ] Health check endpoint works (`/api/health`)
- [ ] Swagger documentation is accessible (`/api-docs`)

### Frontend Configuration
- [ ] `client/.choreo/component.yaml` exists
- [ ] `client/.choreo/endpoints.yaml` exists
- [ ] `client/Dockerfile` exists
- [ ] `client/nginx.conf` exists
- [ ] `client/.env.example` exists
- [ ] API URL is configurable via environment variable
- [ ] Build process works locally (`npm run build`)

### Database Setup
- [ ] MongoDB Atlas cluster is created
- [ ] Database user is created with readWrite permissions
- [ ] Network access is configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string is ready
- [ ] Database name is set to `milk_dairy`

## Deployment Steps

### Phase 1: Choreo Project Setup
- [ ] Choreo account is created
- [ ] New project is created in Choreo
- [ ] Project name: `milk-dairy-management`

### Phase 2: Backend Deployment
- [ ] Backend component is created
  - [ ] Component type: Service
  - [ ] Name: `milk-dairy-backend`
  - [ ] Repository: Connected to GitHub
  - [ ] Build path: `/server`
  - [ ] Language: Node.js
- [ ] Environment variables are configured:
  - [ ] `MONGO_URI` (secret)
  - [ ] `JWT_SECRET` (secret)
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
- [ ] Backend is deployed to development
- [ ] Backend endpoint URL is noted
- [ ] Health check works: `GET /api/health`
- [ ] API docs work: `GET /api-docs`

### Phase 3: Frontend Deployment
- [ ] Frontend component is created
  - [ ] Component type: Web Application
  - [ ] Name: `milk-dairy-frontend`
  - [ ] Repository: Connected to GitHub
  - [ ] Build path: `/client`
  - [ ] Language: React
- [ ] Environment variables are configured:
  - [ ] `VITE_API_URL` (backend endpoint from Phase 2)
- [ ] Frontend is deployed to development
- [ ] Frontend URL is noted
- [ ] Application loads successfully

### Phase 4: Integration Testing
- [ ] CORS is updated with frontend URL
- [ ] Backend is redeployed with updated CORS
- [ ] Frontend can communicate with backend
- [ ] User registration works
- [ ] User login works
- [ ] API calls work from frontend
- [ ] Authentication flow works end-to-end

### Phase 5: Production Deployment
- [ ] Backend is deployed to production
- [ ] Frontend is deployed to production
- [ ] Production URLs are noted
- [ ] Production environment variables are updated
- [ ] Production testing is completed

## Post-Deployment Verification

### Backend Verification
- [ ] Health check responds: `https://backend-url/api/health`
- [ ] API documentation loads: `https://backend-url/api-docs`
- [ ] Authentication endpoints work
- [ ] Database operations work
- [ ] Logs are being generated
- [ ] No error logs in Choreo console

### Frontend Verification
- [ ] Application loads without errors
- [ ] All pages are accessible
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads for different user roles
- [ ] API calls work correctly
- [ ] No console errors in browser

### Performance Verification
- [ ] Response times are acceptable (< 2 seconds)
- [ ] Memory usage is within limits
- [ ] CPU usage is normal
- [ ] No memory leaks detected
- [ ] Auto-scaling works if needed

## Environment Variables Reference

### Backend Environment Variables (Choreo Secrets)
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/milk_dairy?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```

### Backend Environment Variables (Choreo Configs)
```
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
CLIENT_URL=https://your-frontend-choreo-url
```

### Frontend Environment Variables (Choreo Configs)
```
VITE_API_URL=https://your-backend-choreo-url
NODE_ENV=production
```

## Important URLs Template

Fill in these URLs after deployment:

### Development Environment
- Backend API: `https://___-milk-dairy-backend-dev.choreoapis.dev`
- API Documentation: `https://___-milk-dairy-backend-dev.choreoapis.dev/api-docs`
- Health Check: `https://___-milk-dairy-backend-dev.choreoapis.dev/api/health`
- Frontend App: `https://___-milk-dairy-frontend-dev.choreoapis.dev`

### Production Environment
- Backend API: `https://___-milk-dairy-backend-prod.choreoapis.dev`
- API Documentation: `https://___-milk-dairy-backend-prod.choreoapis.dev/api-docs`
- Health Check: `https://___-milk-dairy-backend-prod.choreoapis.dev/api/health`
- Frontend App: `https://___-milk-dairy-frontend-prod.choreoapis.dev`

## Troubleshooting Common Issues

### Build Failures
- [ ] Check Dockerfile syntax
- [ ] Verify all dependencies in package.json
- [ ] Check build logs in Choreo console
- [ ] Ensure correct Node.js version

### Runtime Errors
- [ ] Check environment variables are set correctly
- [ ] Verify database connection string
- [ ] Check CORS configuration
- [ ] Review application logs

### CORS Issues
- [ ] Verify CLIENT_URL environment variable
- [ ] Check frontend URL is correct
- [ ] Ensure CORS middleware is configured
- [ ] Test with browser developer tools

### Database Connection Issues
- [ ] Verify MongoDB Atlas connection string
- [ ] Check network access settings
- [ ] Ensure database user permissions
- [ ] Test connection from local environment

## Support Resources

- **Choreo Documentation**: https://wso2.com/choreo/docs/
- **Choreo Community**: https://discord.gg/wso2
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **GitHub Repository**: [Your repository URL]

## Completion Sign-off

- [ ] All checklist items completed
- [ ] Application is fully functional
- [ ] Performance is acceptable
- [ ] Security considerations addressed
- [ ] Documentation is updated
- [ ] Team is notified of deployment

**Deployed by**: ________________  
**Date**: ________________  
**Environment**: ________________  
**Version**: ________________