#!/bin/sh
# pnpm을 사용하는지 확인하고 메시지 출력

# 공통 함수 불러오기
. "$(dirname "$0")/detect-package-manager.sh"

# 현재 사용 중인 패키지 매니저 감지
PACKAGE_MANAGER=$(detect_package_manager)

# 패키지 매니저에 따른 처리
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
  echo "\033[1;32m🚀 [PNPM] 패키지 설치 완료!\033[0m"
  exit 0
else
  echo "\033[1;33m⚠️ 경고:\033[0m 현재 \\033[1;31m$PACKAGE_MANAGER\\033[0m 을(를) 사용하고 있습니다. \033[1;32mpnpm\033[0m을 사용하세요."
  # 오류 종료 코드
  exit 1
fi
