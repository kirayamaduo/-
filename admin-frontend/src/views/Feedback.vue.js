import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { api } from '@/api/index';
const rows = ref([]);
const loading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const statusFilter = ref('');
const load = async () => {
    loading.value = true;
    try {
        const res = await api.listFeedbacks({
            page: page.value - 1,
            size: pageSize.value,
            status: statusFilter.value || undefined,
        });
        rows.value = res?.content ?? [];
        total.value = res?.totalElements ?? 0;
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed to load feedbacks');
    }
    finally {
        loading.value = false;
    }
};
const setStatus = async (row, status) => {
    try {
        const updated = await api.updateFeedbackStatus(row.id, status);
        row.status = updated.status;
        row.repliedAt = updated.repliedAt;
        ElMessage.success(`Marked as ${status}`);
    }
    catch (e) {
        ElMessage.error(e?.message || 'Update failed');
    }
};
const categoryLabel = (c) => {
    const map = {
        FUNCTION_BUG: '🐛 Bug',
        SUGGESTION: '💡 Suggestion',
        CONTENT_REPORT: '🚨 Report',
        OTHER: '📝 Other',
    };
    return map[c] ?? c;
};
const categoryType = (c) => {
    if (c === 'FUNCTION_BUG')
        return 'danger';
    if (c === 'SUGGESTION')
        return 'success';
    if (c === 'CONTENT_REPORT')
        return 'warning';
    return 'info';
};
const statusType = (s) => {
    if (s === 'PENDING')
        return 'danger';
    if (s === 'PROCESSING')
        return 'warning';
    if (s === 'REPLIED')
        return 'success';
    return 'info';
};
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
const __VLS_0 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar" },
});
const __VLS_4 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.statusFilter),
    placeholder: "All Status",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_6 = __VLS_5({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.statusFilter),
    placeholder: "All Status",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
let __VLS_8;
let __VLS_9;
let __VLS_10;
const __VLS_11 = {
    onChange: (__VLS_ctx.load)
};
__VLS_7.slots.default;
const __VLS_12 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    label: "Pending",
    value: "PENDING",
}));
const __VLS_14 = __VLS_13({
    label: "Pending",
    value: "PENDING",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const __VLS_16 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    label: "Processing",
    value: "PROCESSING",
}));
const __VLS_18 = __VLS_17({
    label: "Processing",
    value: "PROCESSING",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    label: "Replied",
    value: "REPLIED",
}));
const __VLS_22 = __VLS_21({
    label: "Replied",
    value: "REPLIED",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const __VLS_24 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    label: "Closed",
    value: "CLOSED",
}));
const __VLS_26 = __VLS_25({
    label: "Closed",
    value: "CLOSED",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
var __VLS_7;
const __VLS_28 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_32;
let __VLS_33;
let __VLS_34;
const __VLS_35 = {
    onClick: (__VLS_ctx.load)
};
__VLS_31.slots.default;
var __VLS_31;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "hint" },
});
(__VLS_ctx.total);
var __VLS_3;
const __VLS_36 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({}));
const __VLS_38 = __VLS_37({}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_39.slots.default;
const __VLS_40 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    data: (__VLS_ctx.rows),
    stripe: true,
    border: true,
    ...{ style: {} },
}));
const __VLS_42 = __VLS_41({
    data: (__VLS_ctx.rows),
    stripe: true,
    border: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_43.slots.default;
const __VLS_44 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    prop: "id",
    label: "ID",
    width: "70",
}));
const __VLS_46 = __VLS_45({
    prop: "id",
    label: "ID",
    width: "70",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const __VLS_48 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: "Category",
    width: "140",
}));
const __VLS_50 = __VLS_49({
    label: "Category",
    width: "140",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_51.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_52 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        type: (__VLS_ctx.categoryType(row.category)),
        size: "small",
    }));
    const __VLS_54 = __VLS_53({
        type: (__VLS_ctx.categoryType(row.category)),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    (__VLS_ctx.categoryLabel(row.category));
    var __VLS_55;
}
var __VLS_51;
const __VLS_56 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    prop: "content",
    label: "Content",
    showOverflowTooltip: true,
    minWidth: "260",
}));
const __VLS_58 = __VLS_57({
    prop: "content",
    label: "Content",
    showOverflowTooltip: true,
    minWidth: "260",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const __VLS_60 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    prop: "contact",
    label: "Contact",
    width: "160",
    showOverflowTooltip: true,
}));
const __VLS_62 = __VLS_61({
    prop: "contact",
    label: "Contact",
    width: "160",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const __VLS_64 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    label: "Status",
    width: "120",
}));
const __VLS_66 = __VLS_65({
    label: "Status",
    width: "120",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_67.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_68 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        type: (__VLS_ctx.statusType(row.status)),
        size: "small",
    }));
    const __VLS_70 = __VLS_69({
        type: (__VLS_ctx.statusType(row.status)),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_71.slots.default;
    (row.status);
    var __VLS_71;
}
var __VLS_67;
const __VLS_72 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    prop: "createdAt",
    label: "Submitted",
    width: "175",
}));
const __VLS_74 = __VLS_73({
    prop: "createdAt",
    label: "Submitted",
    width: "175",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
const __VLS_76 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    prop: "repliedAt",
    label: "Replied At",
    width: "175",
}));
const __VLS_78 = __VLS_77({
    prop: "repliedAt",
    label: "Replied At",
    width: "175",
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
const __VLS_80 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    label: "Actions",
    width: "260",
    fixed: "right",
}));
const __VLS_82 = __VLS_81({
    label: "Actions",
    width: "260",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_83.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (row.status === 'PENDING') {
        const __VLS_84 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
            ...{ 'onClick': {} },
            size: "small",
            type: "warning",
        }));
        const __VLS_86 = __VLS_85({
            ...{ 'onClick': {} },
            size: "small",
            type: "warning",
        }, ...__VLS_functionalComponentArgsRest(__VLS_85));
        let __VLS_88;
        let __VLS_89;
        let __VLS_90;
        const __VLS_91 = {
            onClick: (...[$event]) => {
                if (!(row.status === 'PENDING'))
                    return;
                __VLS_ctx.setStatus(row, 'PROCESSING');
            }
        };
        __VLS_87.slots.default;
        var __VLS_87;
    }
    if (row.status !== 'REPLIED' && row.status !== 'CLOSED') {
        const __VLS_92 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }));
        const __VLS_94 = __VLS_93({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_93));
        let __VLS_96;
        let __VLS_97;
        let __VLS_98;
        const __VLS_99 = {
            onClick: (...[$event]) => {
                if (!(row.status !== 'REPLIED' && row.status !== 'CLOSED'))
                    return;
                __VLS_ctx.setStatus(row, 'REPLIED');
            }
        };
        __VLS_95.slots.default;
        var __VLS_95;
    }
    if (row.status !== 'CLOSED') {
        const __VLS_100 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
            ...{ 'onClick': {} },
            size: "small",
            type: "info",
        }));
        const __VLS_102 = __VLS_101({
            ...{ 'onClick': {} },
            size: "small",
            type: "info",
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        let __VLS_104;
        let __VLS_105;
        let __VLS_106;
        const __VLS_107 = {
            onClick: (...[$event]) => {
                if (!(row.status !== 'CLOSED'))
                    return;
                __VLS_ctx.setStatus(row, 'CLOSED');
            }
        };
        __VLS_103.slots.default;
        var __VLS_103;
    }
}
var __VLS_83;
var __VLS_43;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pager" },
});
const __VLS_108 = {}.ElPagination;
/** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.page),
    pageSize: (__VLS_ctx.pageSize),
    total: (__VLS_ctx.total),
    layout: "total, prev, pager, next",
}));
const __VLS_110 = __VLS_109({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.page),
    pageSize: (__VLS_ctx.pageSize),
    total: (__VLS_ctx.total),
    layout: "total, prev, pager, next",
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
let __VLS_112;
let __VLS_113;
let __VLS_114;
const __VLS_115 = {
    onCurrentChange: (__VLS_ctx.load)
};
var __VLS_111;
var __VLS_39;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
/** @type {__VLS_StyleScopedClasses['pager']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            rows: rows,
            loading: loading,
            total: total,
            page: page,
            pageSize: pageSize,
            statusFilter: statusFilter,
            load: load,
            setStatus: setStatus,
            categoryLabel: categoryLabel,
            categoryType: categoryType,
            statusType: statusType,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
