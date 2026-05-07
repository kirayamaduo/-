<template>
  <view class="user-page" :class="[themeClass, fontClass]">
    <view class="status-spacer" :style="{ height: topSafeHeight + 'px' }"></view>

    <view class="page-header">
      <text class="page-title">{{ t('profile.title') }}</text>
      <text class="page-subtitle">{{ t('profile.subtitle') }}</text>
    </view>

    <!-- Header card: logged in -->
    <view class="header-card" v-if="isLoggedIn">
      <view class="header-avatar" @click="handleAvatarClick">
        <image
          class="avatar-img"
          :src="avatarSrc"
          mode="aspectFill"
        />
      </view>
      <view class="header-info">
        <text class="header-name">{{ userInfo.nickname || 'User' }}</text>
        <text class="header-school" v-if="userInfo.school">{{ userInfo.school }}</text>
      </view>
      <view class="header-edit" @click.stop="openProfileEdit">
        <text class="header-edit-text">{{ userInfo.school ? 'Edit' : 'Complete' }}</text>
        <text class="header-edit-arrow">›</text>
      </view>
    </view>

    <!-- Header card: not logged in -->
    <view class="header-card header-guest" v-else>
      <text class="guest-title">{{ t('profile.notSignedIn') }}</text>
      <text class="guest-desc">{{ t('profile.notSignedInDesc') }}</text>
      <button class="btn-login" @click="goLogin">{{ t('profile.signIn') }}</button>
    </view>

    <!-- Stats bar -->
    <view class="stats-bar" v-if="isLoggedIn">
      <view class="stat-item">
        <text class="stat-val">{{ statsInterviews }}</text>
        <text class="stat-label">{{ t('profile.interviews') }}</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-val">{{ statsResumes }}</text>
        <text class="stat-label">{{ t('profile.resumes') }}</text>
      </view>
    </view>

    <!-- Menu group 1: My Assets -->
    <text class="group-label">{{ t('profile.assets') }}</text>
    <view class="menu-card">
      <view class="menu-item" @click="goResumes">
        <text class="menu-icon">📄</text>
        <text class="menu-text">{{ t('profile.resumeHub') }}</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="navTo('/pages/assessment/index')">
        <text class="menu-icon">📝</text>
        <text class="menu-text">{{ t('profile.myAssessments') }}</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="navTo('/pages/interview/history')">
        <text class="menu-icon">💼</text>
        <text class="menu-text">{{ t('profile.interviewRecords') }}</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" v-if="isLoggedIn" @click="navTo('/pages/user/memory')">
        <text class="menu-icon">🧠</text>
        <text class="menu-text">{{ t('profile.aiMemory') }}</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- Menu group 2: Appearance & Accessibility -->
    <text class="group-label">{{ t('profile.appearance') }}</text>
    <view class="menu-card">
      <view class="menu-item">
        <text class="menu-icon">🎨</text>
        <text class="menu-text">{{ t('profile.theme') }}</text>
        <view class="theme-pills">
          <view class="pill" :class="{ 'pill-active': theme === 'light' }" @click="applyTheme('light')">
            <text>☀️</text>
          </view>
          <view class="pill" :class="{ 'pill-active': theme === 'dark' }" @click="applyTheme('dark')">
            <text>🌙</text>
          </view>
          <view class="pill" :class="{ 'pill-active': theme === 'green' }" @click="applyTheme('green')">
            <text>🌿</text>
          </view>
        </view>
      </view>
      <view class="menu-item">
        <text class="menu-icon">🔤</text>
        <text class="menu-text">{{ t('profile.fontSize') }}</text>
        <view class="font-pills">
          <view
            class="pill"
            :class="{ 'pill-active': font === 'compact' }"
            @click="applyFont('compact')"
          ><text>{{ t('profile.fontSmall') }}</text></view>
          <view
            class="pill"
            :class="{ 'pill-active': font === 'standard' }"
            @click="applyFont('standard')"
          ><text>{{ t('profile.fontMedium') }}</text></view>
          <view
            class="pill"
            :class="{ 'pill-active': font === 'large' }"
            @click="applyFont('large')"
          ><text>{{ t('profile.fontLarge') }}</text></view>
        </view>
      </view>
      <view class="menu-item">
        <text class="menu-icon">🌐</text>
        <text class="menu-text">{{ t('profile.language') }}</text>
        <view class="font-pills">
          <view
            class="pill"
            :class="{ 'pill-active': currentLang === 'zh-CN' }"
            @click="applyLang('zh-CN')"
          ><text>中文</text></view>
          <view
            class="pill"
            :class="{ 'pill-active': currentLang === 'en-US' }"
            @click="applyLang('en-US')"
          ><text>EN</text></view>
        </view>
      </view>
    </view>

    <!-- Menu group 3: Legal & Support -->
    <text class="group-label">{{ t('profile.legalAndSupport') }}</text>
    <view class="menu-card">
      <view class="menu-item" @click="navTo('/pages/user/feedback')">
        <text class="menu-icon">💬</text>
        <text class="menu-text">{{ t('profile.feedback') }}</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="openConsent('privacy')">
        <text class="menu-icon">🔒</text>
        <text class="menu-text">{{ t('profile.privacyPolicy') }}</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="openConsent('terms')">
        <text class="menu-icon">📋</text>
        <text class="menu-text">{{ t('profile.termsOfService') }}</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item menu-item-danger" v-if="isLoggedIn" @click="handleDeleteAccount">
        <text class="menu-icon">🗑️</text>
        <text class="menu-text menu-text-danger">{{ t('profile.deleteAccount') }}</text>
        <text class="menu-arrow menu-arrow-danger">›</text>
      </view>
    </view>

    <!-- Spacer to push content to bottom -->
    <view class="flex-spacer"></view>

    <view class="bottom-section">
      <!-- Logout -->
      <button class="btn-logout" v-if="isLoggedIn" @click="handleLogout">{{ t('profile.signOut') }}</button>
      <view class="bottom-safe"></view>
    </view>

    <!-- Profile Edit Modal -->
    <view class="modal-overlay" v-if="showProfileEdit" @click="showProfileEdit = false">
      <view class="modal-content bottom-sheet" @click.stop>
        <view class="sheet-handle"></view>
        <text class="modal-title">Edit Profile</text>
        
        <view class="form-group">
          <text class="field-label">Nickname</text>
          <input class="field-input" v-model="editForm.nickname" placeholder="E.g. Kira" maxlength="64" />
        </view>
        <view class="form-group">
          <text class="field-label">School / University</text>
          <input class="field-input" v-model="editForm.school" placeholder="E.g. Stanford University" />
        </view>
        <view class="form-group">
          <text class="field-label">Major</text>
          <input class="field-input" v-model="editForm.major" placeholder="E.g. Computer Science" />
        </view>
        <view class="form-group">
          <text class="field-label">Graduation Year</text>
          <input class="field-input" v-model="editForm.gradYear" type="number" placeholder="E.g. 2026" />
        </view>

        <view class="modal-actions">
          <button class="btn-secondary" @click="showProfileEdit = false">Cancel</button>
          <button class="btn-primary" @click="saveProfile">Save</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '@/locales';
import { clearAuthState, LOGIN_PAGE } from '@/utils/auth';
import { getTopSafeHeight } from '@/utils/safeArea';
import { getUserInterviewsApi } from '@/api/interview';
import { getUserResumesApi } from '@/api/resume';
import { updateUserApi, getUserInfoApi, requestDeletionApi } from '@/api/user';
import { uploadFileApi } from '@/api/file';
import { useTheme, type ThemeKey, type FontKey } from '@/utils/theme';
import { setLocale, currentLocale, type LangCode } from '@/locales/index';

const { t } = useI18n();
const { theme, font, themeClass, fontClass, setTheme, setFont } = useTheme();
const currentLang = ref<LangCode>(currentLocale());

const applyTheme = (themeKey: ThemeKey) => {
  setTheme(themeKey);
  uni.showToast({ title: themeKey === 'dark' ? '深色模式' : themeKey === 'green' ? '护眼绿主题' : '亮色模式', icon: 'none' });
};

const applyFont = (f: FontKey) => {
  setFont(f);
  uni.showToast({ title: '字号已更新', icon: 'none' });
};

const applyLang = (lang: LangCode) => {
  if (lang === currentLang.value) return;
  setLocale(lang);
  currentLang.value = lang;
  const toastTitle = lang === 'zh-CN' ? '已切换为中文' : 'Switched to English';
  uni.showToast({ title: toastTitle, icon: 'none' });
  // 微信小程序 tabBar 页面常驻内存，切换语言后不会自动重渲染。
  // reLaunch 销毁所有页面栈并重建，确保所有页面以新语言重新加载。
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/home/index' });
  }, 800);
};

const userInfo = ref({
  nickname: '',
  /** OSS object key — what we persist. Never feed to <image> directly. */
  avatarUrl: '',
  /** Short-lived signed URL hydrated by backend on every read. */
  avatarViewUrl: '',
  school: '',
  major: '',
  gradYear: '',
});
const userId = ref('');

/**
 * What the <image> actually loads. Priority:
 *   1. presigned avatarViewUrl returned by the backend
 *   2. raw avatarUrl if it's still a legacy https URL (transitional)
 *   3. local default
 */
const avatarSrc = computed(() => {
  if (userInfo.value.avatarViewUrl) return userInfo.value.avatarViewUrl;
  const raw = userInfo.value.avatarUrl;
  if (raw && /^https?:\/\//i.test(raw)) return raw;
  return '/static/default-avatar.png';
});
const topSafeHeight = ref(44);

const statsInterviews = ref(0);
const statsResumes = ref(0);

const showProfileEdit = ref(false);
const editForm = ref({ nickname: '', school: '', major: '', gradYear: '' });

const isLoggedIn = computed(() => !!userId.value);

const goLogin = () => {
  uni.reLaunch({ url: LOGIN_PAGE });
};

const openProfileEdit = () => {
  // Pre-populate the form with whatever we already know so the user is
  // editing, not retyping. (HCI: recognition over recall.)
  editForm.value = {
    nickname: userInfo.value.nickname || '',
    school: userInfo.value.school || '',
    major: userInfo.value.major || '',
    gradYear: userInfo.value.gradYear || '',
  };
  showProfileEdit.value = true;
};

const goResumes = () => {
  uni.switchTab({ url: '/pages/resume/index' });
};

const navTo = (url: string) => {
  uni.navigateTo({ url });
};

const saveProfile = async () => {
  userInfo.value.nickname = editForm.value.nickname.trim() || userInfo.value.nickname;
  userInfo.value.school = editForm.value.school;
  userInfo.value.major = editForm.value.major;
  userInfo.value.gradYear = editForm.value.gradYear;

  // Sync to local storage immediately for snappy UI
  uni.setStorageSync('userInfo', userInfo.value);
  showProfileEdit.value = false;

  // Persist to backend if user is logged in
  const numericId = Number(userId.value);
  if (numericId > 0) {
    try {
      const gradYearNum = editForm.value.gradYear ? Number(editForm.value.gradYear) : undefined;
      const updated = await updateUserApi(numericId, {
        nickname: editForm.value.nickname.trim() || undefined,
        school: editForm.value.school || undefined,
        major: editForm.value.major || undefined,
        graduationYear: gradYearNum && !isNaN(gradYearNum) ? gradYearNum : undefined,
      });
      // Update local storage with server response to stay in sync
      uni.setStorageSync('userInfo', { ...userInfo.value, ...updated });
    } catch { /* localStorage already updated, best-effort backend sync */ }
  }

  uni.showToast({ title: 'Profile saved', icon: 'success' });
};

/**
 * Upload a new avatar:
 *   1. uni.chooseImage → local temp path
 *   2. POST /api/files/upload?folder=avatars → OSS object key
 *   3. PUT /users/{id} { avatarUrl: key } → server stores key, hydrates viewUrl
 *   4. Local cache + global event so home top-bar refreshes too.
 *
 * The previous version stored `tempFilePath` in localStorage which vanished
 * the moment the WeChat app cache was cleared.
 */
const handleAvatarClick = () => {
  if (!isLoggedIn.value) {
    uni.showToast({ title: 'Please sign in first', icon: 'none' });
    return;
  }
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0];
      if (!filePath) return;
      uni.showLoading({ title: 'Uploading...', mask: true });
      try {
        const objectKey = await uploadFileApi(filePath, 'avatars');
        const numericId = Number(userId.value);
        const updated = await updateUserApi(numericId, { avatarUrl: objectKey });

        userInfo.value.avatarUrl = updated.avatarUrl || objectKey;
        userInfo.value.avatarViewUrl = updated.avatarViewUrl || '';
        uni.setStorageSync('userInfo', userInfo.value);
        uni.hideLoading();
        uni.showToast({ title: 'Avatar updated', icon: 'success' });
      } catch (e: any) {
        uni.hideLoading();
        uni.showToast({ title: e?.message || 'Update failed', icon: 'none' });
      }
    },
  });
};

const openConsent = (type: 'privacy' | 'terms') => {
  uni.navigateTo({ url: `/pages/consent/index?view=${type}&readonly=1` });
};

const handleDeleteAccount = () => {
  uni.showModal({
    title: '⚠️ 注销账号',
    content: '注销后账号将进入 30 天冷静期，期间可重新登录恢复。期满后所有数据将被永久删除且不可恢复。',
    confirmText: '继续',
    cancelText: '取消',
    confirmColor: '#ef4444',
    success: (res) => {
      if (!res.confirm) return;
      uni.showModal({
        title: '请输入确认信息',
        content: '在下方输入"确认注销"以继续',
        editable: true,
        placeholderText: '确认注销',
        confirmText: '确认注销',
        cancelText: '取消',
        confirmColor: '#ef4444',
        success: async (res2) => {
          if (!res2.confirm) return;
          if ((res2 as any).content?.trim() !== '确认注销') {
            uni.showToast({ title: '输入内容不正确，注销已取消', icon: 'none', duration: 2500 });
            return;
          }
          try {
            uni.showLoading({ title: '处理中…', mask: true });
            await requestDeletionApi();
            uni.hideLoading();
            clearAuthState();
            uni.showModal({
              title: '注销申请已提交',
              content: '账号已进入 30 天冷静期。如需恢复，请在 30 天内重新登录。',
              showCancel: false,
              success: () => { uni.reLaunch({ url: LOGIN_PAGE }); }
            });
          } catch (e: any) {
            uni.hideLoading();
            uni.showToast({ title: e?.message || '操作失败，请重试', icon: 'none' });
          }
        }
      });
    }
  });
};

const handleLogout = () => {
  uni.showModal({
    title: t('profile.signOutConfirmTitle'),
    content: t('profile.signOutConfirmContent'),
    confirmColor: '#ef4444',
    success: (res) => {
      if (res.confirm) {
        clearAuthState();
        userId.value = '';
        userInfo.value = { nickname: '', avatarUrl: '', avatarViewUrl: '', school: '', major: '', gradYear: '' };
        uni.showToast({ title: t('common.success'), icon: 'success' });
        setTimeout(() => {
          uni.reLaunch({ url: LOGIN_PAGE });
        }, 400);
      }
    },
  });
};

const loadStats = async (uid: number) => {
  try {
    const [interviews, resumes] = await Promise.all([
      getUserInterviewsApi(uid),
      getUserResumesApi(uid),
    ]);
    statsInterviews.value = Array.isArray(interviews) ? interviews.length : 0;
    statsResumes.value = Array.isArray(resumes) ? resumes.length : 0;
  } catch {
    // silently fail, stats will remain 0
  }
};

/**
 * Avatar URLs we store in localStorage are short-lived signed URLs that
 * expire ~30 min after issue. Re-fetch the user from the backend on every
 * mount so the <image> never tries to load a stale signature.
 */
const refreshUserFromBackend = async (numericId: number) => {
  try {
    const fresh = await getUserInfoApi(numericId);
    userInfo.value = { ...userInfo.value, ...fresh };
    uni.setStorageSync('userInfo', userInfo.value);
  } catch { /* offline or token invalid — keep cached values, page still renders */ }
};

onMounted(() => {
  userId.value = uni.getStorageSync('userId') || '';
  const info = uni.getStorageSync('userInfo');
  if (info) {
    userInfo.value = { ...userInfo.value, ...info };
    editForm.value.school = userInfo.value.school || '';
    editForm.value.nickname = userInfo.value.nickname || '';
    editForm.value.major = userInfo.value.major || '';
    editForm.value.gradYear = userInfo.value.gradYear || '';
  }

  topSafeHeight.value = getTopSafeHeight();

  const numericId = Number(userId.value);
  if (userId.value && !isNaN(numericId) && numericId > 0) {
    loadStats(numericId);
    refreshUserFromBackend(numericId);
  }
});
</script>

<style scoped>
.user-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--page-ios-gray);
  padding: 0 20px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 28px);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
  box-sizing: border-box;
}

.bottom-section {
  margin-top: auto;
}

.status-spacer { width: 100%; }

.page-header {
  padding: 8px 0 6px;
}

.page-title {
  display: block;
  font-size: var(--font-hero);
  font-weight: 800;
  color: var(--text-primary);
}

.page-subtitle {
  display: block;
  margin-top: 8px;
  font-size: var(--font-body);
  line-height: 1.5;
  color: var(--text-secondary);
}

/* Edit/Complete chip on the header card — affords tappability with both
   a label and a chevron (HCI: signifiers, recognition over recall) */
.header-edit {
  margin-left: auto;
  display: flex; align-items: center; gap: 2px;
  background: rgba(255, 255, 255, 0.18);
  padding: 8px 6px 8px 12px;
  border-radius: 999px;
  min-height: 32px;
}
.header-edit:active { background: rgba(255, 255, 255, 0.28); }
.header-edit-text { color: #ffffff; font-size: 13px; font-weight: 600; }
.header-edit-arrow { color: #ffffff; font-size: 16px; line-height: 1; padding-right: 6px; }

/* Header card */
.header-card {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%);
  border-radius: 20px; padding: 24px 20px; margin: 12px 0 16px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: 0 10px 28px rgba(37,99,235,0.38), 0 4px 10px rgba(37,99,235,0.22);
}

.header-guest {
  flex-direction: column; align-items: flex-start; gap: 8px;
}

.guest-title { font-size: 20px; font-weight: 700; color: #ffffff; }

.guest-desc { font-size: 13px; color: rgba(255, 255, 255, 0.7); margin-bottom: 4px; }

.btn-login {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 14px; font-weight: 600; border-radius: 12px;
  padding: 0 20px; height: 36px; line-height: 36px;
}

.header-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.18);
}

.avatar-img {
  display: block;
  width: 56px; height: 56px; border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-sizing: border-box;
}

.header-info { flex: 1; }

.header-name {
  font-size: var(--font-title); font-weight: 700; color: #ffffff;
  display: block; margin-bottom: 4px;
}

.header-school { font-size: var(--font-caption); color: rgba(255, 255, 255, 0.9); }

.edit-btn { background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 8px; display: inline-block; margin-top: 4px; }

/* Stats */
.stats-bar {
  display: flex; align-items: center;
  background: #ffffff; border-radius: 16px;
  padding: 16px 0; margin-bottom: 24px;
  border: 1px solid #b8c8d8;
  box-shadow: 0 3px 12px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07);
}

.stat-item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 4px;
}

.stat-val { font-size: var(--font-title); font-weight: 800; color: #0f172a; }

.stat-label { font-size: var(--font-micro); color: #94a3b8; font-weight: 500; }

.stat-divider { width: 1px; height: 24px; background: var(--border-color); }

/* Menu */
.group-label {
  font-size: var(--font-caption);
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 8px;
  padding-left: 4px;
}

.menu-card {
  background: #ffffff; border-radius: 16px;
  overflow: hidden; margin-bottom: 24px;
  border: 1px solid #b8c8d8;
  box-shadow: 0 3px 12px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07);
}

.menu-item {
  display: flex; align-items: center; padding: 15px 16px;
  position: relative;
}

.menu-item:not(:last-child)::after {
  content: ''; position: absolute;
  bottom: 0; left: 48px; right: 0;
  height: 1px; background: var(--border-color);
}

.menu-icon { font-size: 20px; margin-right: 14px; }

.menu-text {
  flex: 1;
  font-size: var(--font-body);
  color: #1e293b;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-arrow { font-size: 20px; color: #c7c7cc; flex-shrink: 0; }

.dark-switch { transform: scale(0.85); }

.font-pills { display: flex; gap: 6px; }
.theme-pills { display: flex; gap: 6px; }

/* Each pill needs >=44pt for thumb access (HCI: Apple HIG / WCAG 2.5.5).
   Inner <text> stays small for visual rhythm. */
.pill {
  min-width: 44px; min-height: 44px;
  padding: 6px 14px; border-radius: 10px;
  font-size: var(--font-caption); font-weight: 600; color: #64748b;
  background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.pill-active { background: #2563eb; color: #ffffff; }

/* Logout */
.btn-logout {
  width: 100%; height: 48px; background: #ffffff;
  color: #ef4444; font-size: var(--font-body); font-weight: 600;
  border-radius: 16px; line-height: 48px; border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xs);
}

.btn-logout:active { background: #fef2f2; }

.bottom-safe {
  height: calc(var(--tab-bar-height, 50px) + 16px);
  flex-shrink: 0;
}

/* Modals */
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4); z-index: 1000;
  display: flex; align-items: flex-end;
}

.modal-content.bottom-sheet {
  width: 100%; background: #ffffff;
  border-radius: 24px 24px 0 0; padding: 16px 20px 32px;
  box-sizing: border-box;
  border-top: 1px solid var(--border-color);
}

.sheet-handle {
  width: 36px; height: 5px; border-radius: 3px; background: #e2e8f0;
  margin: 0 auto 16px;
}

.modal-title { font-size: var(--font-title); font-weight: 700; color: #0f172a; display: block; margin-bottom: 24px; text-align: center; }

.form-group { margin-bottom: 16px; }
.field-label { font-size: var(--font-caption); font-weight: 600; color: #334155; margin-bottom: 8px; display: block; }
.field-input { width: 100%; height: 48px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0 16px; font-size: var(--font-body); box-sizing: border-box; background: #f8fafc; }

.modal-actions { display: flex; gap: 12px; margin-top: 32px; }
.btn-secondary { flex: 1; height: 48px; background: #f1f5f9; color: #475569; font-weight: 600; border-radius: 12px; border: none; line-height: 48px; }
.btn-primary { flex: 2; height: 48px; background: #2563eb; color: #fff; font-weight: 600; border-radius: 12px; border: none; line-height: 48px; }

/* Danger row (Delete Account) */
.menu-item-danger { }
.menu-text-danger { color: #ef4444 !important; }
.menu-arrow-danger { color: #ef4444 !important; }
.menu-item-danger:active { background: #fff1f2; }

/* Dark mode */
.is-dark { background: #0f172a; }

.is-dark .stats-bar,
.is-dark .menu-card,
.is-dark .btn-logout { background: #1e293b; box-shadow: none; }

.is-dark .stat-val,
.is-dark .menu-text { color: #f8fafc; }

.is-dark .group-label,
.is-dark .stat-label { color: #64748b; }

.is-dark .btn-logout { color: #f87171; }

.is-dark .pill { background: #334155; color: #94a3b8; }

.is-dark .pill-active { background: #2563eb; color: #ffffff; }

.is-dark .modal-content { background: #1e293b; }
.is-dark .sheet-handle { background: #334155; }
.is-dark .modal-title { color: #f8fafc; }
.is-dark .field-label { color: #e2e8f0; }
.is-dark .field-input { background: #0f172a; border-color: #334155; color: #f8fafc; }
.is-dark .btn-secondary { background: #334155; color: #e2e8f0; }

/* ================================================================
 *  MP-WEIXIN parity overrides — HARDCODED values, no CSS vars.
 * ================================================================ */
/* #ifdef MP-WEIXIN */

.user-page {
  background-color: #eaeff5;
}

.header-card {
  overflow: visible;
  box-shadow: 0 10px 30px rgba(37,99,235,0.40),
              0 4px 12px  rgba(37,99,235,0.24);
}

.stats-bar {
  overflow: visible;
  border: 1.5px solid #b0bfd0;
  box-shadow: 0 3px 14px rgba(0,0,0,0.18),
              0 1px 5px  rgba(0,0,0,0.10);
}

.menu-card {
  overflow: hidden;
  box-shadow: none;
  filter: drop-shadow(0 4px 14px rgba(0,0,0,0.18));
}

.menu-item:not(:last-child)::after {
  background: #c0ccd8;
}

.is-dark.user-page {
  background-color: #0f172a;
}

.is-dark .stats-bar,
.is-dark .menu-card,
.is-dark .btn-logout,
.is-dark .modal-content.bottom-sheet {
  background: #1e293b;
  border-color: #334155;
  filter: none;
}

.is-dark .menu-item:not(:last-child)::after {
  background: #334155;
}

/* #endif */
</style>
