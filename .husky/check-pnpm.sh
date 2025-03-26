#!/bin/sh
# pnpm을 사용하는지 확인하고 메시지 출력

# CI 환경 체크
is_ci_environment() {
  [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]
}

# CI 환경에서는 검사 스킵
if is_ci_environment; then
  exit 0
fi

# 공통 함수 불러오기
. "$(dirname "$0")/detect-package-manager.sh"

# 현재 사용 중인 패키지 매니저 감지
PACKAGE_MANAGER=$(detect_package_manager)

# 패키지 매니저에 따른 처리
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
  printf "\033[1;32m🚀 [PNPM] 패키지 설치 완료!\033[0m\n"
  exit 0
else
  printf "\033[1;33m⚠️ 경고:\033[0m 현재 \033[1;31m%s\033[0m 을(를) 사용하고 있습니다. \033[1;32mpnpm\033[0m을 사용하세요.\n" "$PACKAGE_MANAGER"
  # 오류 종료 코드
  exit 1
fi