import { BadRequestException, ValidationError } from '@nestjs/common';
import { labelFor } from '../utils/field-label';

const WHITELIST_CONSTRAINT = 'whitelistValidation';

// When one field breaks several rules at once (a missing value fails the type,
// format and length checks together) only the most fundamental one is useful.
// Lower index wins.
const CONSTRAINT_PRIORITY = [
  WHITELIST_CONSTRAINT,
  'isDefined',
  'isNotEmpty',
  'isString',
  'isBoolean',
  'isInt',
  'isNumber',
  'isArray',
  'isEnum',
  'isIn',
  'isEmail',
  'isUrl',
  'matches',
  'length',
  'minLength',
  'maxLength',
  'min',
  'max',
];

function rank(constraint: string): number {
  const index = CONSTRAINT_PRIORITY.indexOf(constraint);
  return index === -1 ? CONSTRAINT_PRIORITY.length : index;
}

function collectFieldErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string> {
  return errors.reduce<Record<string, string>>((acc, error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      const [[constraint, message]] = Object.entries(error.constraints).sort(
        ([a], [b]) => rank(a) - rank(b),
      );
      // Nest's own wording ("property x should not exist") reads differently
      // from the DTO messages, so it gets reworded to match.
      acc[path] =
        constraint === WHITELIST_CONSTRAINT
          ? `${labelFor(error.property)} is not an allowed field`
          : message;
    }

    if (error.children?.length) {
      Object.assign(acc, collectFieldErrors(error.children, path));
    }

    return acc;
  }, {});
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    message: 'Validation failed',
    errors: collectFieldErrors(errors),
  });
}
