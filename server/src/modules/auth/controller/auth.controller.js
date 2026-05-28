import { AuthService } from "../service/auth.service.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { authConfig } from "../../../configs/auth.config.js";

const authService = new AuthService();

export class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.cookie("refreshToken", result.refreshToken, authConfig.cookie);
    return ApiResponse.created(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Registration successful",
    );
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.cookie("refreshToken", result.refreshToken, authConfig.cookie);
    return ApiResponse.success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Login successful",
    );
  });

  refresh = asyncHandler(async (req, res) => {
    // Accept refresh token from cookie OR body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      return ApiResponse.error(
        res,
        "Refresh token required",
        401,
        "UNAUTHORIZED",
      );
    }
    const tokens = await authService.refresh({ refreshToken });
    res.cookie("refreshToken", tokens.refreshToken, authConfig.cookie);
    return ApiResponse.success(
      res,
      { accessToken: tokens.accessToken },
      "Token refreshed",
    );
  });

  logout = asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
    return ApiResponse.success(res, null, "Logged out successfully");
  });

  me = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user.id);
    return ApiResponse.success(res, { user });
  });

  changePassword = asyncHandler(async (req, res) => {
    await authService.changePassword(req.user.id, req.body);
    return ApiResponse.success(res, null, "Password changed successfully");
  });
}
