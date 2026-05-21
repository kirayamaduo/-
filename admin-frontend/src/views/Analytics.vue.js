import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import http from '@/api';
const summary = ref(null);
const loading = ref(false);
const EVENT_LABELS = {
    AI_PROACTIVE_SENT: 'AI 主动推送任务',
    INTERVIEW_STARTED: '开始面试',
    INTERVIEW_COMPLETED: '完成面试',
    ASSESSMENT_STARTED: '开始测评',
    ASSESSMENT_COMPLETED: '完成测评',
    RESUME_UPLOADED: '上传简历',
    RESUME_DIAGNOSED: '简历诊断',
    CHECKIN: '每日打卡',
    TASK_COMPLETED: '完成任务',
    LOGIN: '登录',
    ONBOARDING_DONE: '完成引导',
    MEMORY_VIEWED: '查看 AI 记忆',
    AGENT_VIEWED: '查看 Agent',
};
const eventEntries = computed(() => {
    if (!summary.value?.eventBreakdown30d)
        return [];
    return Object.entries(summary.value.eventBreakdown30d).sort((a, b) => b[1] - a[1]);
});
const eventLabel = (type) => EVENT_LABELS[type] ?? type;
const maxEventCount = computed(() => {
    if (!eventEntries.value.length)
        return 1;
    return eventEntries.value[0][1];
});
const loadSummary = async () => {
    loading.value = true;
    try {
        summary.value = await http.get('/api/admin/analytics/summary');
    }
    catch (e) {
        ElMessage.error(e?.message || '加载统计失败');
    }
    finally {
        loading.value = false;
    }
};
onMounted(() => loadSummary());
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
const __VLS_0 = {}.ElRow;
/** @type {[typeof __VLS_components.ElRow, typeof __VLS_components.elRow, typeof __VLS_components.ElRow, typeof __VLS_components.elRow, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    gutter: (16),
    ...{ class: "stat-row" },
}));
const __VLS_2 = __VLS_1({
    gutter: (16),
    ...{ class: "stat-row" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    span: (6),
}));
const __VLS_6 = __VLS_5({
    span: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    shadow: "never",
    ...{ class: "stat-card" },
}));
const __VLS_10 = __VLS_9({
    shadow: "never",
    ...{ class: "stat-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.summary?.totalUsers ?? '—');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-label" },
});
var __VLS_11;
var __VLS_7;
const __VLS_12 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    span: (6),
}));
const __VLS_14 = __VLS_13({
    span: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    shadow: "never",
    ...{ class: "stat-card" },
}));
const __VLS_18 = __VLS_17({
    shadow: "never",
    ...{ class: "stat-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.summary?.totalInterviews ?? '—');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-label" },
});
var __VLS_19;
var __VLS_15;
const __VLS_20 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    span: (6),
}));
const __VLS_22 = __VLS_21({
    span: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    shadow: "never",
    ...{ class: "stat-card" },
}));
const __VLS_26 = __VLS_25({
    shadow: "never",
    ...{ class: "stat-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.summary?.totalAssessments ?? '—');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-label" },
});
var __VLS_27;
var __VLS_23;
const __VLS_28 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    span: (6),
}));
const __VLS_30 = __VLS_29({
    span: (6),
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
const __VLS_32 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    shadow: "never",
    ...{ class: "stat-card" },
}));
const __VLS_34 = __VLS_33({
    shadow: "never",
    ...{ class: "stat-card" },
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
__VLS_35.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.summary?.totalCheckIns ?? '—');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat-label" },
});
var __VLS_35;
var __VLS_31;
var __VLS_3;
const __VLS_36 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    shadow: "never",
    ...{ style: {} },
}));
const __VLS_38 = __VLS_37({
    shadow: "never",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_39.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_40 = {}.ElIcon;
    /** @type {[typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, typeof __VLS_components.ElIcon, typeof __VLS_components.elIcon, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        ...{ class: "is-loading" },
        size: (32),
    }));
    const __VLS_42 = __VLS_41({
        ...{ class: "is-loading" },
        size: (32),
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_43.slots.default;
    const __VLS_44 = {}.Loading;
    /** @type {[typeof __VLS_components.Loading, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({}));
    const __VLS_46 = __VLS_45({}, ...__VLS_functionalComponentArgsRest(__VLS_45));
    var __VLS_43;
}
else if (__VLS_ctx.eventEntries.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-tip" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    for (const [[type, count]] of __VLS_getVForSourceType((__VLS_ctx.eventEntries))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (type),
            ...{ class: "event-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "event-type" },
        });
        (__VLS_ctx.eventLabel(type));
        const __VLS_48 = {}.ElProgress;
        /** @type {[typeof __VLS_components.ElProgress, typeof __VLS_components.elProgress, ]} */ ;
        // @ts-ignore
        const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
            percentage: (Math.round((count / __VLS_ctx.maxEventCount) * 100)),
            format: (() => String(count)),
            strokeWidth: (18),
            ...{ style: {} },
        }));
        const __VLS_50 = __VLS_49({
            percentage: (Math.round((count / __VLS_ctx.maxEventCount) * 100)),
            format: (() => String(count)),
            strokeWidth: (18),
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_49));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "event-count" },
        });
        (count.toLocaleString());
    }
}
var __VLS_39;
const __VLS_52 = {}.ElCollapse;
/** @type {[typeof __VLS_components.ElCollapse, typeof __VLS_components.elCollapse, typeof __VLS_components.ElCollapse, typeof __VLS_components.elCollapse, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ style: {} },
}));
const __VLS_54 = __VLS_53({
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
__VLS_55.slots.default;
const __VLS_56 = {}.ElCollapseItem;
/** @type {[typeof __VLS_components.ElCollapseItem, typeof __VLS_components.elCollapseItem, typeof __VLS_components.ElCollapseItem, typeof __VLS_components.elCollapseItem, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    title: "原始数据 JSON",
    name: "raw",
}));
const __VLS_58 = __VLS_57({
    title: "原始数据 JSON",
    name: "raw",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
    ...{ class: "raw-json" },
});
(JSON.stringify(__VLS_ctx.summary, null, 2));
var __VLS_59;
var __VLS_55;
/** @type {__VLS_StyleScopedClasses['stat-row']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['is-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['event-row']} */ ;
/** @type {__VLS_StyleScopedClasses['event-type']} */ ;
/** @type {__VLS_StyleScopedClasses['event-count']} */ ;
/** @type {__VLS_StyleScopedClasses['raw-json']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Loading: Loading,
            summary: summary,
            loading: loading,
            eventEntries: eventEntries,
            eventLabel: eventLabel,
            maxEventCount: maxEventCount,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
