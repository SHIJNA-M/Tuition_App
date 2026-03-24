# Authorization Middleware

This directory contains all authentication and authorization middleware for the Tuition Center Management System REST API.

## Middleware Components

### 1. authenticate.js
**Purpose**: JWT authentication middleware that validates access tokens and attaches user object to request.

**Requirements**: 5.7, 19.3, 19.4, 19.7

**Usage**:
```javascript
const { authenticate } = require('./middleware/auth');

// Apply to protected routes
router.get('/profile', authenticate, userController.getProfile);
```

**Behavior**:
- Extracts JWT from `Authorization: Bearer <token>` header
- Validates token signature and expiry
- Fetches user from database
- Attaches user object to `req.user`
- Returns 401 for invalid/expired tokens

**Response on failure**:
```json
{
  "success": false,
  "message": "Access token expired. Please refresh your token."
}
```

### 2. authorize.js
**Purpose**: Role-based authorization middleware factory that checks if user has required role(s).

**Requirements**: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6

**Usage**:
```javascript
const { authenticate, authorize } = require('./middleware/auth');

// Single role
router.get('/users', authenticate, authorize('Admin'), userController.getAllUsers);

// Multiple roles
router.get('/students', authenticate, authorize('Admin', 'Teacher'), studentController.getStudents);
```

**Behavior**:
- Checks if authenticated user's role matches one of the allowed roles
- Returns 403 for unauthorized access

**Response on failure**:
```json
{
  "success": false,
  "message": "Access denied. You do not have permission to access this resource."
}
```

### 3. checkOwnership.js
**Purpose**: Resource ownership validation middleware that ensures students can only access their own data.

**Requirements**: 5.4, 8.6

**Usage**:
```javascript
const { authenticate, checkOwnership } = require('./middleware/auth');

// Default parameter name is 'studentId'
router.get('/students/:studentId/work', 
  authenticate, 
  checkOwnership('studentId'), 
  workController.getStudentWork
);

// Custom parameter name
router.get('/students/:id/profile', 
  authenticate, 
  checkOwnership('id'), 
  studentController.getProfile
);
```

**Behavior**:
- Admin users bypass this check (can access all resources)
- Student users can only access their own data
- Checks parameter in `req.params`, `req.query`, or `req.body`
- Returns 403 if student tries to access another student's data

**Response on failure**:
```json
{
  "success": false,
  "message": "Access denied. You can only access your own data."
}
```

### 4. checkTeacherAssignment.js
**Purpose**: Teacher assignment validation middleware that ensures teachers can only access assigned students' data.

**Requirements**: 7.1, 7.5

**Usage**:
```javascript
const { authenticate, checkTeacherAssignment } = require('./middleware/auth');

// Validate teacher is assigned to student
router.get('/students/:studentId/work', 
  authenticate, 
  authorize('Teacher', 'Admin'),
  checkTeacherAssignment('studentId'), 
  workController.getStudentWork
);

router.post('/feedback', 
  authenticate, 
  authorize('Teacher'),
  checkTeacherAssignment('studentId'), 
  feedbackController.createFeedback
);
```

**Behavior**:
- Admin users bypass this check
- Queries `TeacherAssignments` collection to validate teacher-student relationship
- Returns 403 if teacher is not assigned to the student

**Response on failure**:
```json
{
  "success": false,
  "message": "Access denied. You are not assigned to this student."
}
```

### 5. checkParentLink.js
**Purpose**: Parent link validation middleware that ensures parents can only access linked students' data.

**Requirements**: 9.1, 9.6

**Usage**:
```javascript
const { authenticate, checkParentLink } = require('./middleware/auth');

// Validate parent is linked to student
router.get('/students/:studentId/progress', 
  authenticate, 
  authorize('Parent', 'Admin'),
  checkParentLink('studentId'), 
  progressController.getStudentProgress
);

router.get('/students/:id/work', 
  authenticate, 
  authorize('Parent'),
  checkParentLink('id'), 
  workController.getStudentWork
);
```

**Behavior**:
- Admin users bypass this check
- Queries `ParentStudentLinks` collection to validate parent-student relationship
- Returns 403 if parent is not linked to the student

**Response on failure**:
```json
{
  "success": false,
  "message": "Access denied. You are not linked to this student."
}
```

## Complete Usage Examples

### Example 1: Student accessing their own work
```javascript
const { authenticate, authorize, checkOwnership } = require('./middleware/auth');

router.get('/students/:studentId/work', 
  authenticate,                    // Validate JWT token
  authorize('Student', 'Admin'),   // Only Student or Admin roles
  checkOwnership('studentId'),     // Student can only access own data
  workController.getStudentWork
);
```

### Example 2: Teacher accessing assigned student's work
```javascript
const { authenticate, authorize, checkTeacherAssignment } = require('./middleware/auth');

router.get('/students/:studentId/work', 
  authenticate,                        // Validate JWT token
  authorize('Teacher', 'Admin'),       // Only Teacher or Admin roles
  checkTeacherAssignment('studentId'), // Teacher must be assigned to student
  workController.getStudentWork
);
```

### Example 3: Parent accessing linked student's progress
```javascript
const { authenticate, authorize, checkParentLink } = require('./middleware/auth');

router.get('/students/:studentId/progress', 
  authenticate,                   // Validate JWT token
  authorize('Parent', 'Admin'),   // Only Parent or Admin roles
  checkParentLink('studentId'),   // Parent must be linked to student
  progressController.getProgress
);
```

### Example 4: Combined middleware for multi-role access
```javascript
const { authenticate, authorize, checkOwnership, checkTeacherAssignment, checkParentLink } = require('./middleware/auth');

// Route accessible by Student (own data), Teacher (assigned), Parent (linked), or Admin
router.get('/students/:studentId/work', 
  authenticate,
  authorize('Student', 'Teacher', 'Parent', 'Admin'),
  checkOwnership('studentId'),           // Validates for Student role
  checkTeacherAssignment('studentId'),   // Validates for Teacher role
  checkParentLink('studentId'),          // Validates for Parent role
  workController.getStudentWork
);
```

### Example 5: Admin-only route
```javascript
const { authenticate, authorize } = require('./middleware/auth');

router.post('/links/teacher-student', 
  authenticate,
  authorize('Admin'),  // Only Admin can create teacher assignments
  linkController.createTeacherAssignment
);
```

## Middleware Chain Order

Always apply middleware in this order:

1. **authenticate** - First, validate the JWT token
2. **authorize** - Then, check if user has required role
3. **checkOwnership / checkTeacherAssignment / checkParentLink** - Finally, validate specific access rights

```javascript
// Correct order
router.get('/path', authenticate, authorize('Role'), checkOwnership(), controller.method);

// Incorrect order (will fail)
router.get('/path', authorize('Role'), authenticate, controller.method);
```

## Error Responses

All middleware return consistent JSON error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required. No authorization header provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. You do not have permission to access this resource."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error during authentication"
}
```

## Request Object Enhancement

After successful authentication, the `req.user` object contains:

```javascript
{
  id: ObjectId,           // User's MongoDB _id
  userId: ObjectId,       // Alias for id
  role: String,           // 'Admin', 'Teacher', 'Student', or 'Parent'
  email: String,          // User's email
  mobile: String,         // User's mobile number
  first_name: String,     // User's first name
  last_name: String,      // User's last name
  verified: Boolean       // Verification status
}
```

## Testing

To test the middleware, ensure:

1. Valid JWT tokens are generated using `src/utils/jwtUtils.js`
2. User exists in the database with correct role
3. For teacher/parent checks, appropriate links exist in `TeacherAssignments` or `ParentStudentLinks` collections
4. Authorization header format: `Authorization: Bearer <token>`

## Dependencies

- `src/utils/jwtUtils.js` - JWT token validation
- `src/models/User.js` - User model
- `src/models/TeacherAssignment.js` - Teacher-student assignments
- `src/models/ParentStudentLink.js` - Parent-student links
- `src/utils/logger.js` - Logging utility
