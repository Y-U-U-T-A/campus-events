const { validationResult, param } = require("express-validator");
const mongoose = require("mongoose");

// Centralized validation error handler
exports.handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Validate MongoDB ObjectId params
exports.validateObjectId = (paramName = "id") => [
  param(paramName).custom((val) => {
    if (!mongoose.Types.ObjectId.isValid(val)) {
      throw new Error(`Invalid ${paramName} format`);
    }
    return true;
  }),
  exports.handleValidation,
];
