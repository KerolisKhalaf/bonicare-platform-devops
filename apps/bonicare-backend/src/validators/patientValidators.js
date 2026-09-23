import { body } from 'express-validator';

export const patientProfileValidator = [
  body('name').optional({ nullable: true }).trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional({ nullable: true }).trim().isString().withMessage('Phone must be a string'),
  body('dob').optional({ nullable: true }).isISO8601().withMessage('Date of birth must be a valid date'),
  body('gender')
    .optional({ nullable: true })
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  body('medical_history').optional({ nullable: true }).isObject().withMessage('Medical history must be an object'),
];
