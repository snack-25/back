#!/bin/sh
# 현재 사용 중인 패키지 매니저 감지 스크립트

# 방법 1: npm_execpath 환경 변수 활용 (가장 신뢰성 높음)
detect_by_npm_execpath() {
  if [ -n "$npm_execpath" ]; then
    case "$npm_execpath" in
      *pnpm*)
        echo "pnpm"
        return 0
        ;;
      *yarn*)
        echo "yarn"
        return 0
        ;;
      *npm*)
        echo "npm"
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
        echo "pnpm"
        return 0
        ;;
      *yarn*)
        echo "yarn"
        return 0
        ;;
      *npm*)
        echo "npm"
        return 0
        ;;
    esac
  fi
  return 1
}

# 방법 3: 락파일 확인
detect_by_lockfile() {
  if [ -f "pnpm-lock.yaml" ]; then
    echo "pnpm"
    return 0
  elif [ -f "yarn.lock" ]; then
    echo "yarn"
    return 0
  elif [ -f "package-lock.json" ]; then
    echo "npm"
    return 0
  fi
  return 1
}

# 방법 4: 현재 프로세스 명령어 검사 (덜 신뢰성 있음)
detect_by_process() {
  # 현재 프로세스의 부모 프로세스 체인을 확인
  ppid=$$
  while [ "$ppid" -ne 1 ] && [ -e "/proc/$ppid" ]; do
    cmd=$(cat /proc/$ppid/cmdline 2>/dev/null | tr '\0' ' ' | grep -E 'npm|yarn|pnpm')
    if [ -n "$cmd" ]; then
      case "$cmd" in
        *pnpm*)
          echo "pnpm"
          return 0
          ;;
        *yarn*)
          echo "yarn"
          return 0
          ;;
        *npm*)
          echo "npm"
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
  # 방법 1-3 시도
  result=$(detect_by_npm_execpath)
  if [ $? -eq 0 ]; then
    echo "$result"
    return 0
  fi

  result=$(detect_by_user_agent)
  if [ $? -eq 0 ]; then
    echo "$result"
    return 0
  fi

  result=$(detect_by_lockfile)
  if [ $? -eq 0 ]; then
    echo "$result"
    return 0
  fi

  # Linux/macOS에서만 작동
  if [ -d "/proc" ]; then
    result=$(detect_by_process)
    if [ $? -eq 0 ]; then
      echo "$result"
      return 0
    fi
  fi

  # 기본값
  echo "unknown"
  return 1
}

# 스크립트를 직접 실행하는 경우에만 결과 출력
if [ "$(basename "$0")" = "detect-package-manager.sh" ]; then
  pkg_manager=$(detect_package_manager)
  echo "Detected package manager: $pkg_manager"

  # 추가 디버깅 정보
  echo "Debug info:"
  echo "npm_execpath: $npm_execpath"
  echo "npm_config_user_agent: $npm_config_user_agent"
fi
