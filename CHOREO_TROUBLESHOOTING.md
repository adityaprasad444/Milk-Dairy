# Choreo Deployment Troubleshooting Guide

## Issue: No Endpoints Showing in Choreo

### **Common Causes and Solutions**

#### 1. **Configuration File Issues**

**Problem**: Incorrect schema version or malformed YAML
**Solution**: Use the correct configuration files

**Use these files if endpoints don't show:**

**Option A: Standard Configuration**
```yaml
# server/.choreo/component.yaml
schemaVersion: 1.0
type: service
name: milk-dairy-backend
description: Milk Dairy Management System Backend API

build:
  dockerfile: Dockerfile

env:
  - name: NODE_ENV
    value: production
  - name: PORT
    value: "5000"
  - name: HOST
    value: "0.0.0.0"
```

```yaml
# server/.choreo/endpoints.yaml
schemaVersion: 1.0
endpoints:
  - name: milk-dairy-api
    type: REST
    port: 5000
    context: /api
    schemaFilePath: swagger.yaml
  - name: api-docs
    type: WEB
    port: 5000
    context: /api-docs
```

**Option B: Minimal Configuration (if Option A fails)**
```yaml
# server/.choreo/component.yaml
schemaVersion: 1.0
type: service
name: milk-dairy-backend
description: Milk Dairy Management System Backend API
```

```yaml
# server/.choreo/endpoints.yaml
schemaVersion: 1.0
endpoints:
  - name: default
    type: REST
    port: 5000
    context: /
```

#### 2. **Build Path Issues**

**Problem**: Choreo can't find the configuration files
**Solution**: Ensure correct build path

1. In Choreo Console → Component Settings
2. Set **Build Path** to: `/server`
3. Ensure files are at: `server/.choreo/`

#### 3. **File Location Issues**

**Problem**: Configuration files in wrong location
**Solution**: Verify file structure

```
your-repo/
├── server/
│   ├── .choreo/
│   │   ├── component.yaml
│   │   └── endpoints.yaml
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── swagger.yaml
```

#### 4. **YAML Syntax Issues**

**Problem**: Invalid YAML syntax
**Solution**: Validate YAML files

- Use online YAML validator
- Check indentation (use spaces, not tabs)
- Ensure proper quotes around string values

#### 5. **Swagger File Issues**

**Problem**: Missing or invalid swagger.yaml
**Solution**: Ensure swagger file exists and is valid

- File must be at: `server/swagger.yaml`
- Must be valid OpenAPI 3.0 format
- Check file permissions

### **Step-by-Step Troubleshooting**

#### **Step 1: Verify File Structure**
```bash
# Check if files exist
ls -la server/.choreo/
# Should show: component.yaml, endpoints.yaml

ls -la server/swagger.yaml
# Should exist
```

#### **Step 2: Validate YAML Files**
```bash
# Install yamllint (optional)
pip install yamllint

# Validate files
yamllint server/.choreo/component.yaml
yamllint server/.choreo/endpoints.yaml
```

#### **Step 3: Try Minimal Configuration**

If standard config doesn't work, try minimal:

1. **Backup current files:**
   ```bash
   mv server/.choreo/component.yaml server/.choreo/component-backup.yaml
   mv server/.choreo/endpoints.yaml server/.choreo/endpoints-backup.yaml
   ```

2. **Use minimal files:**
   ```bash
   mv server/.choreo/component-minimal.yaml server/.choreo/component.yaml
   mv server/.choreo/endpoints-minimal.yaml server/.choreo/endpoints.yaml
   ```

3. **Redeploy in Choreo**

#### **Step 4: Manual Configuration**

If config files still don't work:

1. **Remove .choreo directory temporarily**
2. **Create component in Choreo Console manually:**
   - Component Type: `Service`
   - Build Path: `/server`
   - Port: `5000`
3. **Add endpoints manually in UI:**
   - Name: `milk-dairy-api`
   - Type: `REST`
   - Port: `5000`
   - Context: `/api`

### **Alternative Deployment Methods**

#### **Method 1: Without Configuration Files**

1. Delete `.choreo` directory
2. Create component in Choreo Console
3. Configure manually in UI
4. Deploy

#### **Method 2: Simplified Server Structure**

If issues persist, create a simplified structure:

```javascript
// server/app.js (simplified)
const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ message: 'API is running!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### **Method 3: Use Different Schema Version**

Try different schema versions:

```yaml
# Try schemaVersion: 0.1
schemaVersion: 0.1
endpoints:
  - name: default
    type: REST
    port: 5000
    context: /
```

### **Debugging in Choreo Console**

#### **Check Build Logs**
1. Go to Choreo Console
2. Select your component
3. Go to "Build" → "Logs"
4. Look for configuration errors

#### **Check Deployment Logs**
1. Go to "Deploy" → "Logs"
2. Look for startup errors
3. Check if server is listening on correct port

#### **Test Endpoints**
1. Go to "Test" → "Try It"
2. Test basic endpoints
3. Check if server responds

### **Common Error Messages and Solutions**

#### **"No endpoints found"**
- Check `.choreo/endpoints.yaml` exists
- Verify YAML syntax
- Ensure correct build path

#### **"Invalid configuration"**
- Validate YAML syntax
- Check schema version
- Verify required fields

#### **"Build failed"**
- Check Dockerfile
- Verify package.json
- Check build logs

#### **"Port not accessible"**
- Ensure server listens on `0.0.0.0`
- Check PORT environment variable
- Verify firewall settings

### **Working Configuration Template**

Use this proven configuration:

```yaml
# server/.choreo/component.yaml
schemaVersion: 1.0
type: service
name: milk-dairy-backend
description: Backend API

build:
  dockerfile: Dockerfile
```

```yaml
# server/.choreo/endpoints.yaml
schemaVersion: 1.0
endpoints:
  - name: api
    type: REST
    port: 5000
    context: /
```

```dockerfile
# server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

### **Final Checklist**

- [ ] Files in correct location (`server/.choreo/`)
- [ ] Valid YAML syntax
- [ ] Correct schema version (`1.0`)
- [ ] Build path set to `/server`
- [ ] Server listens on `0.0.0.0:5000`
- [ ] Dockerfile exists and is valid
- [ ] No syntax errors in server.js
- [ ] Environment variables configured

### **Contact Support**

If none of these solutions work:

1. **Choreo Community**: [Discord](https://discord.gg/wso2)
2. **Documentation**: [Choreo Docs](https://wso2.com/choreo/docs/)
3. **GitHub Issues**: Check Choreo samples repository

### **Quick Fix Commands**

```bash
# Reset to minimal config
cp server/.choreo/component-minimal.yaml server/.choreo/component.yaml
cp server/.choreo/endpoints-minimal.yaml server/.choreo/endpoints.yaml

# Validate YAML
python -c "import yaml; yaml.safe_load(open('server/.choreo/component.yaml'))"
python -c "import yaml; yaml.safe_load(open('server/.choreo/endpoints.yaml'))"

# Check server startup
cd server && node server.js
```

This should resolve the "no endpoints showing" issue in Choreo!