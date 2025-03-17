#!/bin/sh

# 노드 패키지 매니저 버전 조사 결과
# Windows: nvm 3표, 직접설치 1표
# macOS: nvm 2표, homebrew 1표, asdf 1표

# 1. 노드 설치 유무 확인
# 1-n. 노드가 설치되어 있지 않으면 운영체제별로 node 설치 안내
# 만약 다른 패키지매니저가 설치되어 있다면 해당 패키지매니저를 사용
# 1-n-1. 직접 설치(windows): https://nodejs.org/ko/
# 1-n-2. nvm을 통해 설치: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# 1-n-3. fnm을 통해 설치: curl -fsSL https://fnm.vercel.app/install | bash
# 1-n-4. homebrew(macos)를 통해 설치: brew install node@$(get_lts_major_version)
# 1-n-5. asdf를 통해 설치: asdf plugin add nodejs && asdf install nodejs $(get_lts_version)
# 1-y. 노드가 설치되어 있으면 npm 업데이트 및 셸 재시작
# 2. 노드가 설치되어 있으면 현재 사용중인 노드 버전 확인
# 2-1. 노드 버전이 최신 LTS 버전인지 확인
# 2-1-n. 노드 버전이 최신이 아니면 패키지매니저를 통해 노드 업데이트
# 2-1-y. 노드 버전이 최신이면 pnpm 버전 확인
# 2-1-y-1. pnpm이 설치되어 있지 않으면 pnpm 설치
# 2-1-y-2. pnpm이 설치되어 있으면 pnpm 설정
# 2-1-y-3. pnpm이 설치되어 있으면 pnpm이 최신 버전인지 확인
# 2-1-y-3-n. pnpm이 최신 버전이 아니면 pnpm 업데이트
# 2-1-y-3-y. pnpm이 최신 버전이면 설정 완료

# Node 권장 방식
# 운영체제가 Windows면 fnm을 사용하고, macOS나 Linux면 nvm을 사용
# 만약 volta나 asdf를 사용하고 있다면 해당 패키지 매니저를 사용

# 스크립트 실패 시 즉시 중단
set -e

# 설치 유무를 상수로 정의
readonly INSTALLED=0
readonly NOT_INSTALLED=1

# 프로젝트 루트 디렉토리
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# 컬러 코드 정의
readonly RED='\033[31m'
readonly GREEN='\033[32m'
readonly YELLOW='\033[33m'
readonly NC='\033[0m' # No Color

# 유틸리티 함수
log_error() { printf "${RED}❌ %s${NC}\n" "$1"; }
log_success() { printf "${GREEN}✅ %s${NC}\n" "$1"; }
log_warning() { printf "${YELLOW}👉 %s${NC}\n" "$1"; }

# 설치 상태 확인 함수
check_installed() {
  command -v "$1" >/dev/null 2>&1 && printf "%s" "$INSTALLED" || printf "%s" "$NOT_INSTALLED"
}

# 시스템 체크
readonly IS_NODE_INSTALLED=$(check_installed "node")
readonly IS_WINGET_AVAILABLE=$(check_installed "winget")
readonly IS_HOMEBREW_AVAILABLE=$(check_installed "brew")
readonly IS_NVM_INSTALLED=$(check_installed "nvm")
readonly IS_FNM_INSTALLED=$(check_installed "fnm")
readonly IS_VOLTA_INSTALLED=$(check_installed "volta")
readonly IS_ASDF_INSTALLED=$(check_installed "asdf")
readonly IS_PNPM_INSTALLED=$(check_installed "pnpm")

# 운영체제 출력(Windows, macOS, Linux)
get_os() {
  # GitHub Actions 환경 확인
  if [ -n "$CI" ]; then
    case "$RUNNER_OS" in
      "Windows") printf "Windows" ;;
      "macOS")   printf "macOS" ;;
      "Linux")   printf "Linux" ;;
      *)         printf "Linux" ;; # 기본값으로 Linux 설정
    esac
    return
  fi

  # 로컬 환경 확인
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  case "$os" in
    *mingw*|*msys*|*cygwin*)  printf "Windows" ;;
    *darwin*)                 printf "macOS" ;;
    *linux*)                  printf "Linux" ;;
    *)                        printf "Linux" ;; # 기본값으로 Linux 설정
  esac
}

# 버전 관리
get_current_node_version() {
  if [ "$IS_NODE_INSTALLED" -eq "$INSTALLED" ]; then
    node -v
  else
    log_error "노드가 설치되어 있지 않습니다."
    exit 1
  fi
}

# 최신 LTS 노드 버전 확인
get_lts_version() {
  # 먼저 jq 명령어가 존재하는지 확인 후, LTS 버전 확인
  if command -v jq >/dev/null 2>&1; then
    curl -sL https://nodejs.org/dist/index.json | \
    jq -r '[.[] | select(.lts != false)] | .[0].version'
  else
    curl -sL https://nodejs.org/dist/index.json | \
    grep -o '"version":"[^"]*"[^}]*"lts":[^,}]*[,}]' | \
    grep -v '"lts":false' | head -n 1 | \
    grep -o '"version":"[^"]*"' | cut -d'"' -f4
  fi
}

# LTS SEMVER에서 주버전만 추출(homebrew 등 패키지매니저 설치 시 필요함)
get_lts_major_version() {
  printf "%s" "$(get_lts_version)" | sed 's/^v//' | cut -d. -f1
}

# 패키지 매니저 설치
install_package_manager() {
  local os="$1"
  case "$os" in
    "Windows")
      if [ "$IS_FNM_INSTALLED" -eq "$NOT_INSTALLED" ] && [ "$IS_WINGET_AVAILABLE" -eq "$INSTALLED" ]; then
        winget install Schniz.fnm
      fi
      ;;
    "macOS"|"Linux")
      if [ "$IS_NVM_INSTALLED" -eq "$NOT_INSTALLED" ]; then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
      fi
      ;;
  esac
}

# Node.js 설치/업데이트
install_or_update_node() {
  local os="$1"
  local version="$2"
  local package_manager
  package_manager=$(get_package_manager)

  log_warning "패키지 매니저 $package_manager 로 Node.js $version 설치/업데이트 중..."

  case "$package_manager" in
    "nvm")
      nvm install "$version"
      ;;
    "fnm")
      fnm install "$version"
      ;;
    "volta")
      volta install "node@$version"
      ;;
    "asdf")
      asdf install nodejs "$version"
      ;;
    "homebrew")
      brew install "node@$(get_lts_major_version)"
      ;;
    *)
      log_error "지원하지 않는 패키지 매니저입니다."
      exit 1
      ;;
  esac

  log_success "Node.js $version 설치/업데이트 완료"
}

# PNPM 관련 함수
setup_pnpm() {
  if [ "$IS_PNPM_INSTALLED" -eq "$NOT_INSTALLED" ]; then
    log_warning "pnpm을 설치합니다"
    npm install -g pnpm
    exec "$SHELL"
  fi

  if [ -n "$npm_execpath" ] && ! printf "%s" "$npm_execpath" | grep -q "pnpm"; then
    rm -rf node_modules package-lock.json pnpm-lock.yaml
    log_error "pnpm 패키지 매니저가 아닙니다!"
    log_warning "pnpm을 사용하세요: > pnpm install <"
    exec "$SHELL"
    exit 1
  fi
}

# 사용자에게 패키지 매니저를 선택하도록 하는 함수
select_package_manager() {
  local available_managers=""
  local count=0

  # 사용 가능한 패키지 매니저 목록 만들기
  if [ "$IS_NVM_INSTALLED" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers="$available_managers$count. nvm\n"
  fi
  if [ "$IS_FNM_INSTALLED" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers="$available_managers$count. fnm\n"
  fi
  if [ "$IS_VOLTA_INSTALLED" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers="$available_managers$count. volta\n"
  fi
  if [ "$IS_ASDF_INSTALLED" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers="$available_managers$count. asdf\n"
  fi
  if [ "$IS_HOMEBREW_AVAILABLE" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers="$available_managers$count. homebrew\n"
  fi

  # 패키지 매니저가 하나만 있는 경우 바로 반환
  if [ "$count" -eq 1 ]; then
    printf "%s" "$available_managers" | head -n 1 | cut -d. -f2- | tr -d ' '
    return
  fi

  # 사용자에게 선택권 제공
  log_warning "여러 패키지 매니저가 설치되어 있습니다. 사용할 패키지 매니저를 선택하세요:"
  printf "%s" "$available_managers"

  log_warning "번호를 입력하세요 (1-$count): "
  read -r selection

  # 입력 검증
  if ! printf "%s" "$selection" | grep -q '^[0-9]\+$' || [ "$selection" -lt 1 ] || [ "$selection" -gt "$count" ]; then
    log_error "잘못된 선택입니다. 기본값으로 첫 번째 패키지 매니저를 사용합니다."
    printf "%s" "$available_managers" | head -n 1 | cut -d. -f2- | tr -d ' '
    return
  fi

  # 선택된 패키지 매니저 반환
  printf "%s" "$available_managers" | sed -n "${selection}p" | cut -d. -f2- | tr -d ' '
}

# 현재 사용중인 패키지매니저 확인
get_package_manager() {
  local available_count=0

  # 사용 가능한 패키지 매니저 개수 확인
  [ "$IS_NVM_INSTALLED" -eq "$INSTALLED" ] && available_count=$((available_count+1))
  [ "$IS_FNM_INSTALLED" -eq "$INSTALLED" ] && available_count=$((available_count+1))
  [ "$IS_VOLTA_INSTALLED" -eq "$INSTALLED" ] && available_count=$((available_count+1))
  [ "$IS_ASDF_INSTALLED" -eq "$INSTALLED" ] && available_count=$((available_count+1))
  [ "$IS_HOMEBREW_AVAILABLE" -eq "$INSTALLED" ] && available_count=$((available_count+1))

  # 패키지 매니저가 없는 경우
  if [ "$available_count" -eq 0 ]; then
    printf "Node 패키지매니저가 설치되어 있지 않습니다. 직접 설치하세요.\n"
    printf "https://nodejs.org/ko/\n"
    exit 1
  fi

  # 패키지 매니저가 하나인 경우 바로 반환
  if [ "$available_count" -eq 1 ]; then
    if [ "$IS_NVM_INSTALLED" -eq "$INSTALLED" ]; then
      printf "nvm"
    elif [ "$IS_FNM_INSTALLED" -eq "$INSTALLED" ]; then
      printf "fnm"
    elif [ "$IS_VOLTA_INSTALLED" -eq "$INSTALLED" ]; then
      printf "volta"
    elif [ "$IS_ASDF_INSTALLED" -eq "$INSTALLED" ]; then
      printf "asdf"
    elif [ "$IS_HOMEBREW_AVAILABLE" -eq "$INSTALLED" ]; then
      printf "homebrew"
    fi
    return
  fi

  # 여러 패키지 매니저가 있는 경우 사용자에게 선택권 제공
  select_package_manager
}

check_latest_pnpm_installed() {
  # 버전 비교 함수 (POSIX sh 호환)
  version_compare() {
    # $1: 첫 번째 버전
    # $2: 두 번째 버전

    # 각 버전의 메이저, 마이너, 패치 버전을 추출
    v1_major=$(printf "%s" "$1" | cut -d. -f1)
    v1_minor=$(printf "%s" "$1" | cut -d. -f2)
    v1_patch=$(printf "%s" "$1" | cut -d. -f3)

    v2_major=$(printf "%s" "$2" | cut -d. -f1)
    v2_minor=$(printf "%s" "$2" | cut -d. -f2)
    v2_patch=$(printf "%s" "$2" | cut -d. -f3)

    # 값이 없는 경우 0으로 설정
    : "${v1_major:=0}" "${v1_minor:=0}" "${v1_patch:=0}"
    : "${v2_major:=0}" "${v2_minor:=0}" "${v2_patch:=0}"

    # 메이저 버전 비교
    if [ "$v1_major" -lt "$v2_major" ]; then
      printf "-1"
      return
    elif [ "$v1_major" -gt "$v2_major" ]; then
      printf "1"
      return
    fi

    # 마이너 버전 비교
    if [ "$v1_minor" -lt "$v2_minor" ]; then
      printf "-1"
      return
    elif [ "$v1_minor" -gt "$v2_minor" ]; then
      printf "1"
      return
    fi

    # 패치 버전 비교
    if [ "$v1_patch" -lt "$v2_patch" ]; then
      printf "-1"
      return
    elif [ "$v1_patch" -gt "$v2_patch" ]; then
      printf "1"
      return
    fi

    # 버전이 동일한 경우
    printf "0"
  }

  # 최신 버전 확인
  LATEST_VERSION=$(curl \
    --silent \
    --fail \
    --show-error \
    --location \
    --header 'Accept: application/vnd.npm.install-v1+json' \
    https://registry.npmjs.org/pnpm | \
    grep -Eo '"version":"[^"]+"' | \
    cut -d'"' -f4 | \
    sort -V | \
    tail -n 1)

  # 현재 pnpm이 최신 버전인지 확인
  CURRENT_VERSION=$(pnpm -v)

  if [ "$(version_compare "$CURRENT_VERSION" "$LATEST_VERSION")" -eq -1 ]; then
    rm -rf package-lock.json pnpm-lock.yaml
    printf "\033[31m❌ pnpm이 최신 버전이 아닙니다!\033[0m\n"
    printf "\033[33m👉 현재 버전: %s\033[0m\n" "$CURRENT_VERSION"
    printf "\033[33m👉 최신 버전: %s\033[0m\n" "$LATEST_VERSION"
    printf "\033[33m👉 pnpm을 업데이트합니다: > npm i -g pnpm < \033[0m\n"

    # 만약 homebrew를 사용하고 있다면, brew를 통해 업데이트
    if command -v brew >/dev/null 2>&1; then
      brew upgrade pnpm
    # 만약 asdf를 사용하고(command -v asdf) asdf plugin list | grep pnpm이 있다면, asdf를 통해 업데이트
    elif command -v asdf >/dev/null 2>&1 && asdf plugin list | grep -q pnpm; then
      asdf plugin update pnpm
    # 그 외의 경우 npm을 통해 업데이트
    else
      npm i -g pnpm
    fi
    printf "\033[32m✅ pnpm이 최신 버전(v%s)으로 업데이트되었습니다!\033[0m\n" "$LATEST_VERSION"
    exec "$SHELL"
    exit 1
  fi
}

# 메인 실행
main() {
  printf "\n📦 노드 버전 검사 중...\n"

  local os
  local current_version
  local lts_version
  os=$(get_os)
  current_version=$(get_current_node_version)
  lts_version=$(get_lts_version)
  printf "\033[32m✅ Node 최신 LTS 버전: %s\033[0m\n" "$(get_lts_major_version)"

  # node 명령어가 존재하는지 확인, 없으면 설치로 넘어감
  if [ "$IS_NODE_INSTALLED" -eq "$NOT_INSTALLED" ]; then
    printf "\033[31m❌ node가 설치되어 있지 않습니다! node를 설치하세요\033[0m\n"
    install_package_manager "$os"
    install_or_update_node "$os" "$lts_version"
    exit 1
  else
    # node 명령어가 존재하는 경우, npm 명령어도 존재할 것이므로 npm 업데이트 후 셸 재시작
    npm up -g --silent
    # NodeJS 버전과 NPM 버전, 현재 패키지매니저 출력
    printf "\033[32m✅ [NodeJS] %s / [NPM] %s\033[0m\n" "$(node -v)" "$(npm -v)"
    # package manager가 하나면 바로 반환, 아니면 사용자 입력을 받아 패키지매니저 선택
    PACKAGE_MANAGER=$(get_package_manager)
    printf "\033[32m✅ [패키지매니저] %s을 사용합니다 \033[0m\n" "$PACKAGE_MANAGER"
  fi

  # Node.js 버전 체크 및 업데이트
  if [ "$current_version" != "$lts_version" ]; then
    log_warning "현재 Node.js 버전($current_version)이 LTS 최신 버전($lts_version)과 다릅니다."
    install_or_update_node "$os" "$lts_version"
  else
    log_success "현재 Node.js 버전($current_version)이 LTS 최신 버전($lts_version)과 같습니다."
    check_latest_pnpm_installed
    log_success "설정이 완료되었습니다"
  fi

  # PNPM 설정
  setup_pnpm

  # 성공적으로 완료
  if [ $? -eq 0 ]; then
    exec "$SHELL"  # 셸 재시작
    exit 0       # 정상 종료
  else
    exit 1      # 에러 발생 시 종료
  fi
}

main

LTS_VERSION=$(
  # 먼저 jq 명령어가 존재하는지 확인 후, LTS 버전 확인
  if command -v jq >/dev/null 2>&1; then
    curl -sL https://nodejs.org/dist/index.json | \
    jq -r '[.[] | select(.lts != false)] | .[0].version' 2>/dev/null || \
    # jq 실패 시 수동 조회
    get_lts_version
  else
    # jq가 없는 경우 수동 조회
    get_lts_version
  fi
)

# node LTS 버전을 찾지 못한 경우 에러 처리
if [ -z "$LTS_VERSION" ]; then
  printf "\033[31m❌ LTS 버전을 찾을 수 없습니다!\033[0m\n"
  exit 1
fi

NVM_NODE_VERSION="$(nvm version)"

# 만약 nvm을 사용하고 있다면, nvm을 통해 노드 버전을 업데이트
if command -v nvm >/dev/null 2>&1; then
  # nvm이 설치되어 있고 현재 사용중인 nvm 버전이 있는지 확인한다
  if [ "$NVM_NODE_VERSION" != "$(cat "$PROJECT_ROOT/.nvmrc")" ]; then
    printf "\033[31m❌ 프로젝트에 설정된 노드 버전이 아닙니다!\033[0m\n"
    printf "\033[33m👉 프로젝트 루트 디렉토리에 .nvmrc 파일을 확인하세요. \033[0m\n"
    printf "\033[33m👉 nvm use $(cat .nvmrc) 명령어를 사용해주세요. \033[0m\n"
    exit 1
  fi
  nvm use "$(cat "$PROJECT_ROOT/.nvmrc")"
else
  printf "\033[31m❌ nvm이 설치되어 있지 않습니다!\033[0m\n"
  printf "\033[33m👉 nvm을 설치합니다. \033[0m\n"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && \
  exec "$SHELL"
  exit 1
fi

# 현재 사용 중인 패키지 매니저 확인
if [ -n "$npm_execpath" ] && ! printf "%s" "$npm_execpath" | grep -q "pnpm"; then
  rm -rf node_modules package-lock.json pnpm-lock.yaml
  printf "\033[31m❌ pnpm 패키지 매니저가 아닙니다!\033[0m\n"
  printf "\033[33m👉 pnpm을 사용하세요: > pnpm install < \033[0m\n"
  exec "$SHELL"
  exit 1
fi
