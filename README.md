# SNACK25

## 프로젝트 소개

- 스낵25는 원스톱 간식 구매 관리 솔루션입니다.
- 🗓️ 프로젝트 기간 : 2025. 2.18. ~ 4.11.
- 시연영상 및 발표자료(Google Drive) : https://drive.google.com/drive/folders/1H0uMnhrVAW3DFmNITOS5FjszYhhOXASs

## 팀원 구성

| 이름 | 역할 | Github |
|------|------|---------|
| 강수정 | FullStack | [@xcjnzvc](https://github.com/xcjnzvc) |
| 김두봉 | FullStack | [@devkdb](https://github.com/devkdb) |
| 김지연 | FullStack | [@dani784601](https://github.com/dani784601) |
| 박수환 | FullStack | [@soohwanpak](https://github.com/soohwanpak) |
| 배호근 | FullStack | [@BaeHG](https://github.com/BaeHG) |
| 이현우 | FullStack | [@gealot](https://github.com/gealot) |
| 임예지 | FullStack | [@Bluemoon105](https://github.com/Bluemoon105) |
| 정해찬 | FullStack | [@just-codingbaby](https://github.com/just-codingbaby) |
| 하신혜 | FullStack | [@aventurine26](https://github.com/aventurine26) |

## 기술 스택(백엔드)

- NestJS 11
- Typescript
- PostgreSQL 17
- Prisma ORM
- Swagger
- Argon2

## Requirements

- PNPM을 패키지 매니저로 사용할 것이므로 아래 명령어를 통해 전역 설치

```bash
npm i -g pnpm
```

### PNPM 사용방법

- 스크립트 실행 시 `npm run` 자리에 `pnpm`을 사용해주세요.

```bash
npm run dev   -> pnpm dev
npm run start -> pnpm start
npm run build -> pnpm build
npm run lint  -> pnpm lint
...
```

### @prisma/client 설정

- 이 Repository를 처음 내려받고, 바로 실행할 경우 @prisma/client의 데이터베이스 스키마가 없어서 prisma.service.ts에서 에러가 발생합니다.
- 디렉터리 루트에 `.env.local` 파일이 포함되어 있는지 확인해주세요(`.env.* 파일은 저장소에 포함되지 않습니다!`)
- postgresql이 제대로 설치되어 있는지도 확인해주세요.
- `npx prisma migrate dev`를 통해 스키마를 생성해준 후 코드를 실행해주세요.
- 문제가 발생하는 경우 `npx prisma generate`를 다시 실행해주세요.

### Swagger 사용 관련

- (로컬기준) `pnpm dev` 후 localhost:4000/api를 실행하면 Swagger 문서가 생성됩니다.

## VSCode Extensions

- 아래는 팀 프로젝트 협업 시 필요한 VSCode 확장이므로 설치하여 주시기 바랍니다.

- Gitmoji <https://marketplace.visualstudio.com/items?itemName=seatonjiang.gitmoji-vscode>

## References

- npm 각종 scripts 관련 <https://docs.npmjs.com/cli/v11/using-npm/scripts>
- Nest.js 공식문서 번역 <https://doralife12.gitbook.io/nest.js>
- NestJS로 배우는 백엔드 프로그래밍 <https://wikidocs.net/book/7059>
- 쉽게 풀어 쓴 nest.js <https://www.wisewiredbooks.com/nestjs/intro.html>
- Typescript Handbook <https://typescript-kr.github.io/>
Awesome Typescript Korean <https://github.com/typescript-kr/awesome-typescript-korean>
