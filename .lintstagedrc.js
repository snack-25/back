export default {
  // TypeScript 및 JavaScript 파일에 대한 처리
  '*.{ts,js}': filenames => [
    // 코드 품질 검사
    `eslint --fix ${filenames.join(' ')}`,
    // 코드 포맷팅
    `prettier --write ${filenames.join(' ')}`,
    // 변경된 파일에 대한 테스트 실행 (관련 테스트만, 필요 시 해제해서 사용하면 됨)
    // filenames.length > 10
    //   ? 'npm run test:affected'
    //   : `jest --bail --findRelatedTests --passWithNoTests ${filenames.join(' ')}`,
  ],

  // JSON, MD, YML 파일 등에 대한 포맷팅
  '*.{json,md,yml,yaml}': ['prettier --write'],

  // 패키지 관련 파일 확인
  'package.json': ['prettier --write'],
};
