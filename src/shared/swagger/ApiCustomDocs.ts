import { applyDecorators, Type } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiCustomDocs = (params: {
  summary?: string;
  description?: {
    title?: string;
    contents?: string[];
  };
  required?: boolean;
  // 원래 any 타입이었으나 api-body.decorator.d.ts에서 Type<unknown> 타입으로 정의되어 있어서 변경
  requestType?: Type<unknown> | [Type<unknown>] | string;
  responseType?: Type<unknown> | [Type<unknown>] | string;
}): MethodDecorator => {
  const apiOperation = ApiOperation({
    summary: params.summary,
    description:
      params?.description?.title +
        (params?.description?.title ? '\n\n' : '') +
        params?.description?.contents?.map(str => ' - ' + str)?.join('\n\n') || '',
  });

  const apiBodyDecorator = params.requestType
    ? ApiBody({
        type: params.requestType,
        required: params.required,
      })
    : undefined;

  const response200 = ApiResponse({
    status: 200,
    type: params.responseType,
  });

  // return applyDecorators(apiOperation, response200, apiBody);
  return applyDecorators(
    ...[
      apiOperation,
      response200,
      apiBodyDecorator, // apiBodyDecorator가 존재할 때만 배열에 포함
    ].filter(Boolean as unknown as <T>(x: T) => x is NonNullable<T>), // null, undefined 값 제거
  );
};
