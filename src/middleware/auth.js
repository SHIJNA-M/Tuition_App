/**
 * Authorization Middleware Exports
 * Central export file for all authentication and authorization middleware
 */

const authenticate = require('./authenticate');
const authorize = require('./authorize');
const checkOwnership = require('./checkOwnership');
const checkTeacherAssignment = require('./checkTeacherAssignment');
const checkParentLink = require('./checkParentLink');

module.exports = {
  authenticate,
  authorize,
  checkOwnership,
  checkTeacherAssignment,
  checkParentLink
};
