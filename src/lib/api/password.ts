/**
 * 密码管理相关API
 */
import apiClient from './client';

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

// 设置提款密码
export const setDrawingPwd = (params: SetDrawingPwdRequest): Promise<PasswordResponse> => {
  // 根据接口清单：POST /member/drawing_pwd/set
  return apiClient.post('/member/drawing_pwd/set', params);
};

// 修改提款密码
export const modifyDrawingPwd = (params: ModifyDrawingPwdRequest): Promise<PasswordResponse> => {
  // 根据接口清单：POST /member/drawing_pwd/modify
  return apiClient.post('/member/drawing_pwd/modify', params);
};

// 修改登录密码
export const modifyPassword = (params: ModifyPasswordRequest): Promise<PasswordResponse> => {
  // 根据接口清单：POST /member/password/modify
  return apiClient.post('/member/password/modify', params);
};

