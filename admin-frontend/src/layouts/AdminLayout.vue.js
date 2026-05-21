import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
const headerTitle = computed(() => {
    const map = {
        dashboard: 'Organization Dashboard',
        students: 'Students',
        users: 'User Management',
        'skill-map': 'Skill Map Editor',
        questions: 'Question Bank Moderation',
        content: 'Content Manager',
        broadcast: 'Broadcast',
        analytics: 'Analytics',
        'audit-log': 'Audit Log',
        'feedback': 'User Feedback',
    };
    return map[route.name] || 'Admin';
});
const logout = () => {
    localStorage.removeItem('admin_token');
    router.push({ name: 'login' });
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['admin-aside']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-aside']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-aside']} */ ;
/** @type {__VLS_StyleScopedClasses['el-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.ElContainer;
/** @type {[typeof __VLS_components.ElContainer, typeof __VLS_components.elContainer, typeof __VLS_components.ElContainer, typeof __VLS_components.elContainer, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "admin-shell" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "admin-shell" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.ElAside;
/** @type {[typeof __VLS_components.ElAside, typeof __VLS_components.elAside, typeof __VLS_components.ElAside, typeof __VLS_components.elAside, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    width: "220px",
    ...{ class: "admin-aside" },
}));
const __VLS_7 = __VLS_6({
    width: "220px",
    ...{ class: "admin-aside" },
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand" },
});
const __VLS_9 = {}.ElMenu;
/** @type {[typeof __VLS_components.ElMenu, typeof __VLS_components.elMenu, typeof __VLS_components.ElMenu, typeof __VLS_components.elMenu, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    defaultActive: __VLS_ctx.$route.name,
    router: true,
}));
const __VLS_11 = __VLS_10({
    defaultActive: __VLS_ctx.$route.name,
    router: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    index: "dashboard",
    route: ({ name: 'dashboard' }),
}));
const __VLS_15 = __VLS_14({
    index: "dashboard",
    route: ({ name: 'dashboard' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
var __VLS_16;
const __VLS_17 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    index: "students",
    route: ({ name: 'students' }),
}));
const __VLS_19 = __VLS_18({
    index: "students",
    route: ({ name: 'students' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_20.slots.default;
var __VLS_20;
const __VLS_21 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
    index: "users",
    route: ({ name: 'users' }),
}));
const __VLS_23 = __VLS_22({
    index: "users",
    route: ({ name: 'users' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_22));
__VLS_24.slots.default;
var __VLS_24;
const __VLS_25 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    index: "skill-map",
    route: ({ name: 'skill-map' }),
}));
const __VLS_27 = __VLS_26({
    index: "skill-map",
    route: ({ name: 'skill-map' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_28.slots.default;
var __VLS_28;
const __VLS_29 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    index: "questions",
    route: ({ name: 'questions' }),
}));
const __VLS_31 = __VLS_30({
    index: "questions",
    route: ({ name: 'questions' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
__VLS_32.slots.default;
var __VLS_32;
const __VLS_33 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    index: "content",
    route: ({ name: 'content' }),
}));
const __VLS_35 = __VLS_34({
    index: "content",
    route: ({ name: 'content' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
__VLS_36.slots.default;
var __VLS_36;
const __VLS_37 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    index: "broadcast",
    route: ({ name: 'broadcast' }),
}));
const __VLS_39 = __VLS_38({
    index: "broadcast",
    route: ({ name: 'broadcast' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
__VLS_40.slots.default;
var __VLS_40;
const __VLS_41 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    index: "analytics",
    route: ({ name: 'analytics' }),
}));
const __VLS_43 = __VLS_42({
    index: "analytics",
    route: ({ name: 'analytics' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
__VLS_44.slots.default;
var __VLS_44;
const __VLS_45 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    index: "audit-log",
    route: ({ name: 'audit-log' }),
}));
const __VLS_47 = __VLS_46({
    index: "audit-log",
    route: ({ name: 'audit-log' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
var __VLS_48;
const __VLS_49 = {}.ElMenuItem;
/** @type {[typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    index: "feedback",
    route: ({ name: 'feedback' }),
}));
const __VLS_51 = __VLS_50({
    index: "feedback",
    route: ({ name: 'feedback' }),
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
__VLS_52.slots.default;
var __VLS_52;
var __VLS_12;
var __VLS_8;
const __VLS_53 = {}.ElContainer;
/** @type {[typeof __VLS_components.ElContainer, typeof __VLS_components.elContainer, typeof __VLS_components.ElContainer, typeof __VLS_components.elContainer, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({}));
const __VLS_55 = __VLS_54({}, ...__VLS_functionalComponentArgsRest(__VLS_54));
__VLS_56.slots.default;
const __VLS_57 = {}.ElHeader;
/** @type {[typeof __VLS_components.ElHeader, typeof __VLS_components.elHeader, typeof __VLS_components.ElHeader, typeof __VLS_components.elHeader, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
    ...{ class: "admin-header" },
}));
const __VLS_59 = __VLS_58({
    ...{ class: "admin-header" },
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
__VLS_60.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "title" },
});
(__VLS_ctx.headerTitle);
const __VLS_61 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    ...{ 'onClick': {} },
    text: true,
}));
const __VLS_63 = __VLS_62({
    ...{ 'onClick': {} },
    text: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
let __VLS_65;
let __VLS_66;
let __VLS_67;
const __VLS_68 = {
    onClick: (__VLS_ctx.logout)
};
__VLS_64.slots.default;
var __VLS_64;
var __VLS_60;
const __VLS_69 = {}.ElMain;
/** @type {[typeof __VLS_components.ElMain, typeof __VLS_components.elMain, typeof __VLS_components.ElMain, typeof __VLS_components.elMain, ]} */ ;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    ...{ class: "admin-main" },
}));
const __VLS_71 = __VLS_70({
    ...{ class: "admin-main" },
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
__VLS_72.slots.default;
const __VLS_73 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, typeof __VLS_components.routerView, ]} */ ;
// @ts-ignore
const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({}));
const __VLS_75 = __VLS_74({}, ...__VLS_functionalComponentArgsRest(__VLS_74));
var __VLS_72;
var __VLS_56;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['admin-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-aside']} */ ;
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-main']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            headerTitle: headerTitle,
            logout: logout,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
