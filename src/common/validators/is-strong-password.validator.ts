import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import zxcvbn, { ZXCVBNFeedback } from 'zxcvbn';

@ValidatorConstraint({ name: 'isStrongPasswordWithFeedback', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  private feedback?: ZXCVBNFeedback;

  validate(value: unknown, args: ValidationArguments): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const dto = args.object as Record<string, unknown>;
    const userInputs = [dto.firstName, dto.lastName, dto.email].filter(
      (val): val is string => typeof val === 'string',
    );

    const result = zxcvbn(value, userInputs);
    this.feedback = result.feedback;

    return result.score >= 3;
  }

  defaultMessage(args: ValidationArguments): string {
    const parts: string[] = [`${args.property} is too weak.`];

    if (this.feedback?.warning) {
      parts.push(`Warning: ${this.feedback.warning}.`);
    }

    if (this.feedback?.suggestions?.length) {
      parts.push(`Suggestions: ${this.feedback.suggestions.join(' ')}`);
    }

    return parts.join(' ');
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
