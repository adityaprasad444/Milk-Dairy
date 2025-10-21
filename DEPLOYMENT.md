# Choreo Deployment Guide for Milk Dairy Management System

## Prerequisites

1. **WSO2 Choreo Account**: Sign up at [https://choreo.dev/](https://choreo.dev/)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster for production database
4. **Domain (Optional)**: For custom domain setup

## Step-by-Step Deployment Process

### Phase 1: Prepare Your Repository

1. **Push your code to GitHub** with all the configuration files created
2. **Ensure your repository structure looks like this**:
   ```
   milk-dairy-management-system/
   ├── server/
   │   ├── .choreo/
   │   │   ├── component.yaml
   │   │   └── endpoints.yaml
   │   ├── Dockerfile
   │   ├── package.json
   │   ├── server.js
   │   └── ... (other server files)
   ├── client/
   │   ├── .choreo/
   │   │   ├── component.yaml
   │   │   └── endpoints.yaml
   │   ├── Dockerfile
   │   ├── nginx.conf
   │   ├── package.json
   │   └── ... (other client files)
   ├── .choreoignore
   └── DEPLOYMENT.md
   ```

### Phase 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**: Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Create a New Cluster**:
   - Choose a cloud provider (AWS recommended)
   - Select a region close to your users
   - Choose M0 (Free tier) for testing or M2+ for production
3. **Configure Network Access**:
   - Add IP address `0.0.0.0/0` (allow access from anywhere)
   - Or add specific Choreo IP ranges if provided
4. **Create Database User**:
   - Username: `choreo-user` (or your preferred name)
   - Password: Generate a strong password
   - Assign `readWrite` role to your database
5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `milk_dairy`

### Phase 3: Deploy Backend to Choreo

1. **Login to Choreo Console**: [https://console.choreo.dev/](https://console.choreo.dev/)

2. **Create New Project**:
   - Click "Create Project"
   - Name: `milk-dairy-management`
   - Description: `Milk Dairy Management System`

3. **Create Backend Component**:
   - Click "Create Component"
   - Component Type: `Service`
   - Name: `milk-dairy-backend`
   - Description: `Backend API for Milk Dairy Management`
   - GitHub Repository: Select your repository
   - Branch: `main` (or your default branch)
   - Build Path: `/server`
   - Language: `Node.js`

4. **Configure Environment Variables**:
   - Go to "Configs & Secrets" → "Configs"
   - Add the following secrets:
     ```
     MONGO_URI: mongodb+srv://choreo-user:YOUR_PASSWORD@cluster.mongodb.net/milk_dairy?retryWrites=true&w=majority
     JWT_SECRET: your-super-secret-jwt-key-minimum-32-characters-long
     ```

5. **Deploy Backend**:
   - Click "Deploy" → "Deploy to Development"
   - Wait for build and deployment to complete
   - Note the endpoint URL (e.g., `https://xyz-milk-dairy-backend-dev.choreoapis.dev`)

### Phase 4: Deploy Frontend to Choreo

1. **Create Frontend Component**:
   - In the same project, click "Create Component"
   - Component Type: `Web Application`
   - Name: `milk-dairy-frontend`
   - Description: `Frontend for Milk Dairy Management`
   - GitHub Repository: Select your repository
   - Branch: `main`
   - Build Path: `/client`
   - Language: `React`

2. **Configure Frontend Environment Variables**:
   - Go to "Configs & Secrets" → "Configs"
   - Add the following config:
     ```
     VITE_API_URL: https://your-backend-endpoint-from-step-3-5
     ```

3. **Deploy Frontend**:
   - Click "Deploy" → "Deploy to Development"
   - Wait for build and deployment to complete
   - Note the web app URL

### Phase 5: Update CORS Configuration

1. **Update Backend CORS**:
   - Add your frontend URL to the CORS configuration
   - Update the `CLIENT_URL` environment variable in Choreo:
     ```
     CLIENT_URL: https://your-frontend-url-from-step-4-3
     ```

2. **Redeploy Backend**:
   - Go to backend component
   - Click "Deploy" → "Deploy to Development"

### Phase 6: Test Your Deployment

1. **Test Backend**:
   - Visit: `https://your-backend-url/api/health`
   - Should return: `{"message": "Milk Dairy Management API is running!"}`

2. **Test API Documentation**:
   - Visit: `https://your-backend-url/api-docs`
   - Should show Swagger UI with your API documentation

3. **Test Frontend**:
   - Visit your frontend URL
   - Should load the React application
   - Test login/registration functionality

### Phase 7: Production Deployment

1. **Deploy to Production**:
   - For both components, click "Deploy" → "Deploy to Production"
   - Update environment variables for production if needed

2. **Custom Domain (Optional)**:
   - Go to "Settings" → "Domains"
   - Add your custom domain
   - Configure DNS records as instructed

## Environment Variables Reference

### Backend Environment Variables
```bash
# Required
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/milk_dairy
JWT_SECRET=your-jwt-secret-minimum-32-characters

# Optional
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
CLIENT_URL=https://your-frontend-url
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Frontend Environment Variables
```bash
# Required
VITE_API_URL=https://your-backend-url

# Optional
VITE_APP_NAME=Milk Dairy Management System
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

## Troubleshooting

### Common Issues and Solutions

1. **Build Failures**:
   - Check Dockerfile syntax
   - Ensure all dependencies are in package.json
   - Check build logs in Choreo console

2. **CORS Errors**:
   - Verify CLIENT_URL environment variable
   - Check CORS configuration in server.js
   - Ensure frontend URL is correct

3. **Database Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check network access settings in Atlas
   - Ensure database user has correct permissions

4. **Environment Variable Issues**:
   - Check spelling and case sensitivity
   - Ensure secrets are properly configured in Choreo
   - Verify environment variables are being loaded

### Monitoring and Logs

1. **View Logs**:
   - Go to component → "Observability" → "Logs"
   - Filter by time range and log level

2. **Monitor Performance**:
   - Check "Observability" → "Metrics"
   - Monitor CPU, memory, and request metrics

3. **Health Checks**:
   - Backend: `/api/health`
   - Frontend: Root URL should load

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **CORS**: Configure specific origins instead of wildcards in production
3. **JWT Secret**: Use a strong, randomly generated secret
4. **Database**: Use strong passwords and limit network access
5. **HTTPS**: Choreo provides HTTPS by default

## Scaling and Performance

1. **Auto-scaling**: Choreo handles auto-scaling automatically
2. **Caching**: Consider implementing Redis for session management
3. **CDN**: Use Choreo's built-in CDN for static assets
4. **Database**: Consider MongoDB Atlas auto-scaling for high traffic

## Support and Resources

- **Choreo Documentation**: [https://wso2.com/choreo/docs/](https://wso2.com/choreo/docs/)
- **Choreo Community**: [https://discord.gg/wso2](https://discord.gg/wso2)
- **MongoDB Atlas Docs**: [https://docs.atlas.mongodb.com/](https://docs.atlas.mongodb.com/)

## Post-Deployment Checklist

- [ ] Backend health check responds correctly
- [ ] API documentation is accessible
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Database operations work
- [ ] CORS is properly configured
- [ ] Environment variables are set
- [ ] Logs are being generated
- [ ] Performance metrics are normal
- [ ] Custom domain configured (if applicable)