import { isCuid } from '@paralleldrive/cuid2';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * CUID2 형식 검증 클래스
 *
 * @export
 * @class IsCuid2Constraint
 * @implements {ValidatorConstraintInterface}
 */
@ValidatorConstraint({ async: false })
export class IsCuid2Constraint implements ValidatorConstraintInterface {
  public validate(value: string): boolean {
    return typeof value === 'string' && isCuid(value);
  }

  public defaultMessage(): string {
    return `CUID2 형식이 유효하지 않습니다.`;
  }
}

/**
 * CUID2 형식 검증 데코레이터
 *
 * @export
 * @param {ValidationOptions} [validationOptions]
 * @return {*}
 */
export function IsCuid2(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCuid2Constraint,
    });
  };
}
