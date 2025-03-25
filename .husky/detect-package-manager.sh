#!/bin/sh
# 현재 사용 중인 패키지 매니저 감지 스크립트

# CI 환경 체크
is_ci_environment() {
  [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ]
}

# 방법 1: npm_execpath 환경 변수 활용 (가장 신뢰성 높음)
detect_by_npm_execpath() {
  if [ -n "$npm_execpath" ]; then
    case "$npm_execpath" in
      *pnpm*)
        printf "pnpm"
        return 0
        ;;
      *yarn*)
        printf "yarn"
        return 0
        ;;
      *npm*)
        printf "npm"
        return 0
        ;;
    esac
  fi
  return 1
}

# 방법 2: npm_config_user_agent 환경 변수 활용
detect_by_user_agent() {
  if [ -n "$npm_config_user_agent" ]; then
    case "$npm_config_user_agent" in
      *pnpm*)
        printf "pnpm"
        return 0
        ;;
      *yarn*)
        printf "yarn"
        return 0
        ;;
      *npm*)
        printf "npm"
        return 0
        ;;
    esac
  fi
  return 1
}

# 방법 3: 락파일 확인
detect_by_lockfile() {
  if [ -f "pnpm-lock.yaml" ]; then
    printf "pnpm"
    return 0
  elif [ -f "yarn.lock" ]; then
    printf "yarn"
    return 0
  elif [ -f "package-lock.json" ]; then
    printf "npm"
    return 0
  fi
  return 1
}

# 방법 4: 현재 프로세스 명령어 검사 (덜 신뢰성 있음)
detect_by_process() {
  # 현재 프로세스의 부모 프로세스 체인을 확인
  ppid=$$
  while [ "$ppid" -ne 1 ] && [ -e "/proc/$ppid" ]; do
    cmd=$(cat "/proc/$ppid/cmdline" 2>/dev/null | tr '\0' ' ' | grep -E 'npm|yarn|pnpm')
    if [ -n "$cmd" ]; then
      case "$cmd" in
        *pnpm*)
          printf "pnpm"
          return 0
          ;;
        *yarn*)
          printf "yarn"
          return 0
          ;;
        *npm*)
          printf "npm"
          return 0
          ;;
      esac
    fi
    ppid=$(ps -o ppid= -p "$ppid" 2>/dev/null | tr -d ' ')
  done
  return 1
}

# 주 함수: 모든 방법 시도
detect_package_manager() {
  # CI 환경에서는 pnpm 반환
  if is_ci_environment; then
    printf "pnpm"
    return 0
  fi

  # 방법 1: npm_execpath 환경 변수 활용 (가장 신뢰성 높음)
  if [ -n "$npm_execpath" ]; then
    case "$npm_execpath" in
      *pnpm*)
        printf "pnpm"
        return 0
        ;;
      *yarn*)
        printf "yarn"
        return 0
        ;;
      *npm*)
        printf "npm"
        return 0
        ;;
    esac
  fi

  # 방법 2: 락파일 확인
  if [ -f "pnpm-lock.yaml" ]; then
    printf "pnpm"
    return 0
  elif [ -f "yarn.lock" ]; then
    printf "yarn"
    return 0
  elif [ -f "package-lock.json" ]; then
    printf "npm"
    return 0
  fi

  # Linux/macOS에서만 작동하고 CI가 아닌 경우에만 프로세스 체크
  if [ -d "/proc" ] && ! is_ci_environment; then
    ppid=$$
    while [ "$ppid" -ne 1 ] && [ -e "/proc/$ppid" ]; do
      cmd=$(cat "/proc/$ppid/cmdline" 2>/dev/null | tr '\0' ' ' | grep -E 'npm|yarn|pnpm')
      if [ -n "$cmd" ]; then
        case "$cmd" in
          *pnpm*)
            printf "pnpm"
            return 0
            ;;
          *yarn*)
            printf "yarn"
            return 0
            ;;
          *npm*)
            printf "npm"
            return 0
            ;;
        esac
      fi
      ppid=$(ps -o ppid= -p "$ppid" 2>/dev/null | tr -d ' ')
    done
  fi

  # 기본값
  printf "unknown"
  return 1
}

# 스크립트를 직접 실행하는 경우에만 결과 출력
if [ "$(basename "$0")" = "detect-package-manager.sh" ] && ! is_ci_environment; then
  pkg_manager=$(detect_package_manager)
  printf "Detected package manager: %s\n" "$pkg_manager"

  # 추가 디버깅 정보 (CI 환경이 아닌 경우에만 출력)
  printf "Debug info:\n"
  printf "npm_execpath: %s\n" "$npm_execpath"
  printf "npm_config_user_agent: %s\n" "$npm_config_user_agent"
fi