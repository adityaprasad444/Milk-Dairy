# Test Suite Documentation

## Overview

This test suite provides comprehensive unit and integration tests for the Milk Dairy Management System backend API.

## Test Structure

```
tests/
├── setup.js                 # Test environment setup
├── utils/
│   └── testHelpers.js       # Test utility functions
├── models/
│   ├── User.test.js         # User model tests
│   └── Product.test.js      # Product model tests
├── middleware/
│   └── auth.test.js         # Authentication middleware tests
├── routes/
│   ├── auth.test.js         # Authentication route tests
│   └── address.test.js      # Address management route tests
└── README.md               # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI/CD Tests
```bash
npm run test:ci
```

## Test Categories

### 1. Model Tests
- **User Model**: Password hashing, validation, address management
- **Product Model**: CRUD operations, soft delete, validation
- **Address Model**: Validation, default address handling

### 2. Middleware Tests
- **Authentication**: JWT token validation, user verification
- **Authorization**: Role-based access control

### 3. Route Tests
- **Authentication Routes**: Register, login, profile management
- **Address Routes**: CRUD operations, ownership validation
- **Admin Routes**: User management, role assignments

## Test Database

Tests use MongoDB Memory Server for isolated testing:
- Each test suite gets a fresh database
- No external database dependencies
- Fast test execution
- Automatic cleanup

## Test Utilities

### Helper Functions
- `createTestUser()`: Create test users with different roles
- `generateToken()`: Generate JWT tokens for authentication
- `mockRequest()`, `mockResponse()`: Mock Express req/res objects

### Test Data
- Predefined user roles (Admin, Distributor, Delivery Boy, Consumer)
- Sample products and addresses
- Valid and invalid test data for validation testing

## Coverage Goals

- **Models**: 90%+ coverage
- **Middleware**: 95%+ coverage
- **Routes**: 85%+ coverage
- **Overall**: 85%+ coverage

## Writing New Tests

### Model Tests
```javascript
describe('ModelName', () => {
  test('should create valid model', async () => {
    const model = new ModelName(validData);
    const saved = await model.save();
    expect(saved).toBeDefined();
  });
});
```

### Route Tests
```javascript
describe('Route Description', () => {
  test('should handle valid request', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send(validData)
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

### Middleware Tests
```javascript
describe('Middleware Name', () => {
  test('should allow valid request', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext;
    
    await middleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `afterEach` to clean test data
3. **Descriptive Names**: Test names should describe the expected behavior
4. **Edge Cases**: Test both success and failure scenarios
5. **Mocking**: Mock external dependencies
6. **Assertions**: Use specific assertions, avoid generic ones

## Common Test Patterns

### Authentication Testing
```javascript
let user, token;

beforeEach(async () => {
  user = await createTestUser();
  token = generateToken(user._id);
});

test('should require authentication', async () => {
  const response = await request(app)
    .get('/protected-route')
    .expect(401);
});
```

### Validation Testing
```javascript
test('should validate required fields', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({}) // Empty data
    .expect(400);
    
  expect(response.body.errors).toBeDefined();
});
```

### Database Testing
```javascript
test('should save to database', async () => {
  const model = new Model(validData);
  await model.save();
  
  const found = await Model.findById(model._id);
  expect(found).toBeDefined();
});
```

## Debugging Tests

### View Test Output
```bash
npm test -- --verbose
```

### Run Specific Test File
```bash
npm test -- tests/models/User.test.js
```

### Run Specific Test
```bash
npm test -- --testNamePattern="should create valid user"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

Tests are configured to run in CI environments:
- No external dependencies
- Deterministic results
- Coverage reporting
- Fast execution

## Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure MongoDB Memory Server is properly configured
2. **Async/Await**: Use proper async/await in test functions
3. **Test Isolation**: Clean up data between tests
4. **Timeouts**: Increase timeout for slow tests

### Performance Tips

1. Use `--runInBand` for debugging
2. Limit test parallelism if needed
3. Use `--detectOpenHandles` to find memory leaks
4. Profile tests with `--logHeapUsage`