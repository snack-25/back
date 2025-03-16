// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// eslint.configs.recommended : ESLint의 기본 규칙
// tseslint.configs.recommendedTypeChecked : TypeScript의 타입 검사 규칙
// eslintPluginPrettierRecommended : Prettier와 ESLint의 호환성을 위한 권장 설정

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'ecosystem.config.js',
      '.lintstagedrc.js',
      'commitlint.config.js',
      'dist/**',
      'node_modules/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2022, // 최신 ECMAScript 기능을 지원합니다()
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json', // 명시적으로 프로젝트 파일 지정
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // best practices를 참고하여 추가함
      '@typescript-eslint/no-explicit-any': 'warn', // 완전히 끄기보다 경고로 설정
      '@typescript-eslint/no-floating-promises': 'error', // 비동기 작업 관리를 위해 엄격하게 설정
      '@typescript-eslint/no-unsafe-argument': 'warn', // 안전하지 않은 인수 전달을 경고로 설정
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ], // 함수 반환 타입 명시 권장
      '@typescript-eslint/explicit-member-accessibility': 'warn', // 클래스 멤버 접근 제한자 명시 권장
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ], // 사용하지 않는 변수 관리
      // 여기서부터(no-unsafe-member-access, call, assignment)는 개별적으로 추가함
      '@typescript-eslint/no-unsafe-member-access': 'warn', // 안전하지 않은 멤버 접근을 경고로 설정
      '@typescript-eslint/no-unsafe-call': 'warn', // 안전하지 않은 함수 호출을 경고로 설정
      '@typescript-eslint/no-unsafe-assignment': 'warn', // 안전하지 않은 할당을 경고로 설정
      'no-console': ['warn', { allow: ['warn', 'error'] }], // 로깅은 NestJS 로거 사용 권장
      'import/prefer-default-export': 'off', // NestJS는 named export를 주로 사용
      'class-methods-use-this': 'off', // NestJS 서비스에서는 this를 사용하지 않는 메서드가 흔함
    },
  },
);
