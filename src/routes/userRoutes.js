const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const {
  validateGetAllUsers,
  validateGetUserById,
  validateUpdateUser,
  validateDeactivateUser
} = require('../middleware/validators/userValidators');

// All routes require authentication and Admin role
router.use(authenticate);
router.use(authorize('Admin'));

/**
 * GET /api/users
 * Get all users with pagination and filtering
 */
router.get(
  '/',
  validateGetAllUsers,
  userController.getAllUsers
);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get(
  '/:id',
  validateGetUserById,
  userController.getUserById
);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put(
  '/:id',
  validateUpdateUser,
  userController.updateUser
);

/**
 * DELETE /api/users/:id
 * Deactivate user
 */
router.delete(
  '/:id',
  validateDeactivateUser,
  userController.deactivateUser
);

module.exports = router;
