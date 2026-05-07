package com.group1.career.utils;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Read the current authenticated user's id, populated by AuthInterceptor
 * into the HttpServletRequest's "userId" attribute after JWT validation.
 */
public final class SecurityUtil {

    private SecurityUtil() {}

    /**
     * @return current user's id, or null when called outside an authenticated request.
     */
    public static Long currentUserId() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        HttpServletRequest req = attrs.getRequest();
        Object v = req.getAttribute("userId");
        if (v instanceof Long l) return l;
        if (v instanceof Number n) return n.longValue();
        if (v instanceof String s) {
            try { return Long.parseLong(s); } catch (Exception ignored) {}
        }
        return null;
    }

    public static Long requireCurrentUserId() {
        Long uid = currentUserId();
        if (uid == null) {
            // 使用 UNAUTHORIZED_ERROR (code=401) 而非默认的 PARAM_ERROR (code=400)
            // 前端 request.ts 依赖 data.code === 401 来判断是否跳转登录页
            throw new com.group1.career.exception.BizException(
                    com.group1.career.common.ErrorCode.UNAUTHORIZED_ERROR);
        }
        return uid;
    }
}
