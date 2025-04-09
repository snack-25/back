// src/users/dto/get-user-list-params.dto.ts

// ✅ 요청 파라미터 타입 (Query로 들어오는 값들)
export type GetUserListParams = {
  page: number;
  limit: number;
  search: string;
};

// ✅ 응답 타입 (회원 리스트 + 전체 개수)
export type GetUserListResponse = {
  totalCount: number;
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
};
