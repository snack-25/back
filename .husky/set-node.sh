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
log_error() { echo "${RED}❌ $1${NC}"; }
log_success() { echo "${GREEN}✅ $1${NC}"; }
log_warning() { echo "${YELLOW}👉 $1${NC}"; }

# 설치 상태 확인 함수
check_installed() {
  command -v "$1" >/dev/null 2>&1 && echo $INSTALLED || echo $NOT_INSTALLED
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
function get_os() {
  local os
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  case "$os" in  # 소문자로 변환하여 비교
    *mingw*|*msys*|*cygwin*)  echo "Windows" ;;
    *darwin*)                 echo "macOS" ;;
    *linux*)                  echo "Linux" ;;
    *)                        echo "운영체제를 확인할 수 없습니다." && exit 1 ;;
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
  echo $(get_lts_version) | sed 's/^v//' | cut -d. -f1
}

# 패키지 매니저 설치
install_package_manager() {
  local os=$1
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
  local os=$1
  local version=$2
  local package_manager=$(get_package_manager)

  log_warning "패키지 매니저 $package_manager 로 Node.js $version 설치/업데이트 중..."

  case "$package_manager" in
    "nvm")
      nvm install "$version"
      ;;
    "fnm")
      fnm install "$version"
      ;;
    "volta")
      volta install node@"$version"
      ;;
    "asdf")
      asdf install nodejs "$version"
      ;;
    "homebrew")
      brew install node@"$(get_lts_major_version)"
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
    exec $SHELL
  fi

  if [[ "$npm_execpath" != *"pnpm"* ]]; then
    rm -rf node_modules package-lock.json pnpm-lock.yaml
    log_error "pnpm 패키지 매니저가 아닙니다!"
    log_warning "pnpm을 사용하세요: > pnpm install <"
    exec $SHELL
    exit 1
  fi
}

# 사용자에게 패키지 매니저를 선택하도록 하는 함수
select_package_manager() {
  local available_managers=()
  local count=0

  # 사용 가능한 패키지 매니저 목록 만들기
  if [ "$IS_NVM_INSTALLED" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers+=("$count. nvm")
  fi
  if [ "$IS_FNM_INSTALLED" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers+=("$count. fnm")
  fi
  if [ "$IS_VOLTA_INSTALLED" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers+=("$count. volta")
  fi
  if [ "$IS_ASDF_INSTALLED" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers+=("$count. asdf")
  fi
  if [ "$IS_HOMEBREW_AVAILABLE" -eq "$INSTALLED" ]; then
    count=$((count+1))
    available_managers+=("$count. homebrew")
  fi

  # 패키지 매니저가 하나만 있는 경우 바로 반환
  if [ $count -eq 1 ]; then
    echo "${available_managers[0]#*. }"
    return
  fi

  # 사용자에게 선택권 제공
  log_warning "${YELLOW}여러 패키지 매니저가 설치되어 있습니다. 사용할 패키지 매니저를 선택하세요:${NC}" >&2
  for manager in "${available_managers[@]}"; do
    echo "$manager" >&2
  done

  log_warning "${YELLOW}번호를 입력하세요 (1-$count):${NC} " >&2
  read -r selection < /dev/tty

  # 입력 검증
  if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt $count ]; then
    log_error "잘못된 선택입니다. 기본값으로 첫 번째 패키지 매니저(${available_managers[0]#*. })를 사용합니다."
    return
  fi

  # 선택된 패키지 매니저 반환
  local selected_index=$(($selection - 1))
  if [ $selected_index -ge 0 ] && [ $selected_index -lt $count ]; then
    echo "${available_managers[$selected_index]#*. }"
    return
  fi

  # 기본값 반환
  echo "${available_managers[0]#*. }"
}

# 현재 사용중인 패키지매니저 확인 (수정된 함수)
function get_package_manager() {
  local available_count=0

  # 사용 가능한 패키지 매니저 개수 확인
  [ "$IS_NVM_INSTALLED" -eq "$INSTALLED" ] && available_count=$((available_count+1))
  [ "$IS_FNM_INSTALLED" -eq "$INSTALLED" ] && available_count=$((available_count+1))
  [ "$IS_VOLTA_INSTALLED" -eq "$INSTALLED" ] && available_count=$((available_count+1))
  [ "$IS_ASDF_INSTALLED" -eq "$INSTALLED" ] && available_count=$((available_count+1))
  [ "$IS_HOMEBREW_AVAILABLE" -eq "$INSTALLED" ] && available_count=$((available_count+1))

  # 패키지 매니저가 없는 경우
  if [ $available_count -eq 0 ]; then
    echo "Node 패키지매니저가 설치되어 있지 않습니다. 직접 설치하세요."
    echo "https://nodejs.org/ko/"
    exit 1
  fi

  # 패키지 매니저가 하나인 경우 바로 반환
  if [ $available_count -eq 1 ]; then
    if [ "$IS_NVM_INSTALLED" -eq "$INSTALLED" ]; then
      echo "nvm"
    elif [ "$IS_FNM_INSTALLED" -eq "$INSTALLED" ]; then
      echo "fnm"
    elif [ "$IS_VOLTA_INSTALLED" -eq "$INSTALLED" ]; then
      echo "volta"
    elif [ "$IS_ASDF_INSTALLED" -eq "$INSTALLED" ]; then
      echo "asdf"
    elif [ "$IS_HOMEBREW_AVAILABLE" -eq "$INSTALLED" ]; then
      echo "homebrew"
    fi
  fi
  # 여러 패키지 매니저가 있는 경우 사용자에게 선택권 제공
  select_package_manager
}

check_latest_pnpm_installed() {
  # 버전 비교 함수
  version_compare() {
    echo "$1" "$2" | awk '{
      split($1,a,".");
      split($2,b,".");
      for(i=1;i<=3;i++) {
        if(a[i]<b[i]) {print "-1"; exit}
        if(a[i]>b[i]) {print "1"; exit}
      }
      print "0"
    }'
  }

  # 버전 정렬 함수(curl로 받아온 버전 문자열을 최신순으로 정렬)
  function sort_versions() {
    awk '{
      split($0,v,/[+-]|\./);  # 버전 문자열을 배열로 분리
      # 정렬을 위한 키와 원본 버전을 함께 저장
      printf("%012d%012d%012d %s\n", v[1], v[2], v[3], $0);
    }' |
    sort -r |  # 역순 정렬로 최신 버전이 먼저 오도록 함
    head -n 1 |  # 가장 최신 버전 선택
    awk '{print $2}'  # 원본 버전 문자열 출력
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
    cut -d\" -f4 | \
    sort_versions)

  # 현재 pnpm이 최신 버전인지 확인
  CURRENT_VERSION=$(pnpm -v)

  if [ $(version_compare "$CURRENT_VERSION" "$LATEST_VERSION") -eq -1 ]; then
    rm -rf package-lock.json pnpm-lock.yaml
    echo '\033[31m❌ pnpm이 최신 버전이 아닙니다!\033[0m'
    echo '\033[33m👉 현재 버전: '"$CURRENT_VERSION"'\033[0m'
    echo '\033[33m👉 최신 버전: '"$LATEST_VERSION"'\033[0m'
    echo '\033[33m👉 pnpm을 업데이트합니다: > npm i -g pnpm < \033[0m'

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
    echo '\033[32m✅ pnpm이 최신 버전(v'"$LATEST_VERSION"')으로 업데이트되었습니다!\033[0m'
    exec $SHELL
    exit 1
  fi

}

# 메인 실행
main() {
  echo "\n📦 노드 버전 검사 중..."

  local os=$(get_os)
  local current_version=$(get_current_node_version)
  local lts_version=$(get_lts_version)
  echo "\033[32m✅ Node 최신 LTS 버전: $(get_lts_major_version)"


  # node 명령어가 존재하는지 확인, 없으면 설치로 넘어감
  if [ "$IS_NODE_INSTALLED" -eq "$NOT_INSTALLED" ]; then
    echo '\033[31m❌ node가 설치되어 있지 않습니다! node를 설치하세요\033[0m'
    install_package_manager "$os"
    install_or_update_node "$os" "$lts_version"
    exit 1
  else
    # node 명령어가 존재하는 경우, npm 명령어도 존재할 것이므로 npm 업데이트 후 셸 재시작
    npm up -g --silent
    # exec $SHELL
    # NodeJS 버전과 NPM 버전, 현재 패키지매니저 출력
    echo '\033[32m✅ [NodeJS] '"$(node -v)"' / [NPM] '"$(npm -v)"'\033[0m'
    # package manager가 하나면 바로 반환, 아니면 사용자 입력을 받아 패키지매니저 선택
    PACKAGE_MANAGER=$(get_package_manager)
    echo '\033[32m✅ [패키지매니저] '"$PACKAGE_MANAGER"'을 사용합니다 \033[0m'

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

  # pnpm 설정
  # pnpm이 설치되어 있지 않은 경우 설치
  # 성공적으로 완료
  if [ $? -eq 0 ]; then
    exec $SHELL  # 셸 재시작
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
  echo '\033[31m❌ LTS 버전을 찾을 수 없습니다!\033[0m'
  exit 1
fi

NVM_NODE_VERSION="$(nvm version)"

# 만약 nvm을 사용하고 있다면, nvm을 통해 노드 버전을 업데이트
if command -v nvm >/dev/null 2>&1; then
  # nvm이 설치되어 있고 현재 사용중인 nvm 버전이 있는지 확인한다
  if [ "$NVM_NODE_VERSION" != "$(cat $PROJECT_ROOT/.nvmrc)" ]; then
    echo '\033[31m❌ 프로젝트에 설정된 노드 버전이 아닙니다!\033[0m'
    echo '\033[33m👉 프로젝트 루트 디렉토리에 .nvmrc 파일을 확인하세요. \033[0m'
    echo '\033[33m👉 nvm use $(cat .nvmrc) 명령어를 사용해주세요. \033[0m'
    exit 1
  fi
  nvm use $(cat $PROJECT_ROOT/.nvmrc)
else
  echo '\033[31m❌ nvm이 설치되어 있지 않습니다!\033[0m'
  echo '\033[33m👉 nvm을 설치합니다. \033[0m'
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && \
  exec $SHELL
  exit 1
fi

# 현재 사용 중인 패키지 매니저 확인
if [[ "$npm_execpath" != *"pnpm"* ]]; then
  rm -rf node_modules package-lock.json pnpm-lock.yaml
  echo '\033[31m❌ pnpm 패키지 매니저가 아닙니다!\033[0m'
  echo '\033[33m👉 pnpm을 사용하세요: > pnpm install < \033[0m'
  exec $SHELL
  exit 1
fi
