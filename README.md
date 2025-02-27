# aw-assignment
## 워크 포털 웹 애플리케이션
</br>실행해보기 편하시도록 .env에 대한 example파일을 작성했고, docker-compose를 통해 한 번에 실행 가능합니다.

------------------------
링크 공유 시 username을 user의 id로 변환하여 db설계 원칙과 성능을 고려.

### 회원 가입 및 인증 시스템

사용자는 아이디와 비밀번호를 입력하여 회원 가입할 수 있으며, 로그인과과 로그아웃이 가능합니다.

- **아이디 중복 검사**
  - FastAPI의 **SQLAlchemy ORM**을 사용하여 `User` 테이블에서 기존 아이디 중복 여부를 확인
  - 회원 가입 시 `username`이 이미 존재하는 경우 400 Bad Request 응답 반환

- **비밀번호 보안 저장**
  - `bcrypt`를 사용하여 비밀번호를 해싱 및 저장
  - 로그인 시 입력한 비밀번호를 `bcrypt.checkpw()`를 이용하여 비교

- **JWT 기반 인증 및 세션 관리**
  - `pyjwt`를 사용하여 **JWT(JSON Web Token)** 기반의 인증 구현
   - **JWT를 쿠키(HTTP-Only, Secure) 방식으로 저장**
  - 프론트엔드에서 `fetch` 요청 시 `credentials: "include"` 설정을 통해 쿠키 자동 전송
  - `redis`를 활용하여 로그아웃 시 블랙리스트 처리 (로그아웃된 토큰 차단)

---

### 로그인 후 웹 링크 관리 기능

사용자는 로그인을 해야 아래의 기능을 사용할 수 있습니다.

#### **웹 링크 등록**
- 사용자는 새로운 웹 링크를 추가할 수 있습니다.
- **구현 방식**:
  - FastAPI 엔드포인트(`/links/`)에서 `POST` 요청을 받아 SQLAlchemy를 통해 `Link` 테이블에 저장

#### **웹 링크 수정**
- 사용자는 자신이 등록했거나 **쓰기 권한을 부여받은 웹 링크를 수정**할 수 있습니다.
- **구현 방식**:
  - `PUT /links/{link_id}` 엔드포인트에서 `Link.created_by == current_user.id` 또는 **공유 권한이 `write`인 경우**만 수정 가능

#### **웹 링크 삭제**
- 사용자는 자신이 등록한 웹 링크만 삭제할 수 있습니다. 만약 공유받은 링크일 경우 자신의 웹 링크 목록에서만 삭제됩니다.
- **구현 방식**:
  - `DELETE /links/{link_id}`에서 `Link.created_by == current_user.id`를 검사 후 삭제
  - `@router.post("/{link_id}/unshare")`를 통해 권한을 지워 공유받은 링크를 삭제

#### **웹 링크 공유**
- 사용자는 자신의 웹 링크, 쓰기 권한으로 공유받은 링크를 특정 사용자와 공유할 수 있으며, **읽기/쓰기 권한을 설정**할 수 있습니다.
- **구현 방식**:
  - `LinkPermission` 테이블을 생성하여 링크 공유 관계 관리
  - `POST /links/{link_id}/share` 엔드포인트에서 공유할 사용자와 `permission`(`read`, `write`) 저장

#### **검색 및 필터링**
- 사용자는 **이름 또는 카테고리로 웹 링크를 검색**할 수 있습니다.
- **구현 방식**:
  - `GET /links/search` 엔드포인트에서 `LIKE` 검색 지원 (`ilike('%query%')`)
  - `UNION`을 활용하여 **사용자가 만든 링크 + 공유받은 링크**를 함께 검색

---

### 보안 요구사항

1. **로그인하지 않은 사용자는 웹 링크 API에 접근할 수 없음**
   - FastAPI의 `Depends(get_current_user)`를 활용하여 비인증 사용자 차단
   - JWT 토큰을 검증하여 유효하지 않은 경우 401 Unauthorized 응답

2. **모든 API는 인증 및 인가를 처리해야 함**
   - HTTP-Only 쿠키를 사용하여 인증 관리
   -  프론트엔드에서 API 호출 시 `credentials: "include"` 설정
   - `get_current_user()`에서 Redis 블랙리스트 체크 → 로그아웃된 토큰 차단
   - 웹 링크 수정 및 삭제 시 `created_by == current_user.id` 또는 공유된 권한을 확인하여 인가 처리

---

### 기술 스택

- **백엔드**: FastAPI, SQLAlchemy, PostgreSQL, Redis, PyJWT, Bcrypt
- **프론트엔드**: Next.js, TypeScript, Zustand
- **인증/보안**: JWT 인증, Redis 블랙리스트 활용한 로그아웃 관리
- **패키징**: Docker, Docker Compose (PostgreSQL + Redis + FastAPI + Next.js 컨테이너 구성)