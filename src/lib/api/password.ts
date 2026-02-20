/**
 * 密码管理相关API
 * 统一走 houduan /api/v1/auth/* 路由
 */
import apiClient from './client';
import phpGameClient from './php-game-client';

export interface SetDrawingPwdRequest {
  qk_pwd: string;
  qk_pwd_confirmation: string;
}

export interface ModifyDrawingPwdRequest {
  old_qk_pwd: string;
  qk_pwd: string;
  qk_pwd_confirmation: string;
}

export interface ModifyPasswordRequest {
  oldpassword: string;
  password: string;
  password_confirmation: string;
}

export interface PasswordResponse {
  code: number;
  message: string;
  data?: any;
}

// 设置提款密码 → POST /api/v1/auth/set-fund-password
export const setDrawingPwd = (params: SetDrawingPwdRequest): Promise<PasswordResponse> => {
  return phpGameClient.post('auth/set-fund-password', {
    fund_password: params.qk_pwd,
    fund_password_confirmation: params.qk_pwd_confirmation,
  }).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  }));
};

// 修改提款密码 → POST /api/v1/auth/change-fund-password
export const modifyDrawingPwd = (params: ModifyDrawingPwdRequest): Promise<PasswordResponse> => {
  return phpGameClient.post('auth/change-fund-password', {
    old_fund_password: params.old_qk_pwd,
    fund_password: params.qk_pwd,
    fund_password_confirmation: params.qk_pwd_confirmation,
  }).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  }));
};

// 修改登录密码 → POST /api/v1/auth/change-password
export const modifyPassword = (params: ModifyPasswordRequest): Promise<PasswordResponse> => {
  return phpGameClient.post('auth/change-password', {
    old_password: params.oldpassword,
    password: params.password,
    password_confirmation: params.password_confirmation,
  }).then((res: any) => ({
    code: res?.code === 0 ? 200 : (res?.code ?? 200),
    message: res?.message ?? '',
    data: res?.data
  }));
};
