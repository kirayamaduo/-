import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/api';
const targetMode = ref('all');
const form = ref({ userId: '', title: '', content: '', link: '' });
const sending = ref(false);
const history = ref([]);
const loadingHistory = ref(false);
const histPage = ref(1);
const histPageSize = ref(20);
const histTotal = ref(0);
const sendBroadcast = async () => {
    if (!form.value.title.trim() || !form.value.content.trim()) {
        ElMessage.warning('标题和内容不能为空');
        return;
    }
    sending.value = true;
    try {
        const body = {
            title: form.value.title,
            content: form.value.content,
            link: form.value.link || null,
            userId: targetMode.value === 'single' && form.value.userId ? Number(form.value.userId) : null,
        };
        const count = await http.post('/api/admin/broadcast', body);
        ElMessage.success(`公告已发送给 ${count} 位用户`);
        form.value = { userId: '', title: '', content: '', link: '' };
        loadHistory();
    }
    catch (e) {
        ElMessage.error(e?.message || '发送失败');
    }
    finally {
        sending.value = false;
    }
};
const loadHistory = async () => {
    loadingHistory.value = true;
    try {
        const data = await http.get('/api/admin/notifications', {
            params: { page: histPage.value - 1, size: histPageSize.value }
        });
        history.value = data.content ?? [];
        histTotal.value = data.totalElements ?? 0;
    }
    catch {
        history.value = [];
    }
    finally {
        loadingHistory.value = false;
    }
};
onMounted(() => loadHistory());
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
    gutter: (24),
}));
const __VLS_2 = __VLS_1({
    gutter: (24),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    span: (10),
}));
const __VLS_6 = __VLS_5({
    span: (10),
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
const __VLS_8 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    shadow: "never",
}));
const __VLS_10 = __VLS_9({
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_11.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
}
const __VLS_12 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    model: (__VLS_ctx.form),
    labelPosition: "top",
}));
const __VLS_14 = __VLS_13({
    model: (__VLS_ctx.form),
    labelPosition: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
__VLS_15.slots.default;
const __VLS_16 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    label: "目标用户",
}));
const __VLS_18 = __VLS_17({
    label: "目标用户",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
const __VLS_20 = {}.ElRadioGroup;
/** @type {[typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, typeof __VLS_components.ElRadioGroup, typeof __VLS_components.elRadioGroup, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    modelValue: (__VLS_ctx.targetMode),
}));
const __VLS_22 = __VLS_21({
    modelValue: (__VLS_ctx.targetMode),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
const __VLS_24 = {}.ElRadio;
/** @type {[typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    value: "all",
}));
const __VLS_26 = __VLS_25({
    value: "all",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
__VLS_27.slots.default;
var __VLS_27;
const __VLS_28 = {}.ElRadio;
/** @type {[typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, typeof __VLS_components.ElRadio, typeof __VLS_components.elRadio, ]} */ ;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
    value: "single",
}));
const __VLS_30 = __VLS_29({
    value: "single",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
__VLS_31.slots.default;
var __VLS_31;
var __VLS_23;
var __VLS_19;
if (__VLS_ctx.targetMode === 'single') {
    const __VLS_32 = {}.ElFormItem;
    /** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        label: "用户 ID",
    }));
    const __VLS_34 = __VLS_33({
        label: "用户 ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    const __VLS_36 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        modelValue: (__VLS_ctx.form.userId),
        placeholder: "输入用户 ID",
        type: "number",
    }));
    const __VLS_38 = __VLS_37({
        modelValue: (__VLS_ctx.form.userId),
        placeholder: "输入用户 ID",
        type: "number",
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    var __VLS_35;
}
const __VLS_40 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    label: "标题 *",
}));
const __VLS_42 = __VLS_41({
    label: "标题 *",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
__VLS_43.slots.default;
const __VLS_44 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    modelValue: (__VLS_ctx.form.title),
    placeholder: "通知标题",
    maxlength: "80",
    showWordLimit: true,
}));
const __VLS_46 = __VLS_45({
    modelValue: (__VLS_ctx.form.title),
    placeholder: "通知标题",
    maxlength: "80",
    showWordLimit: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
var __VLS_43;
const __VLS_48 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    label: "内容 *",
}));
const __VLS_50 = __VLS_49({
    label: "内容 *",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
const __VLS_52 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    modelValue: (__VLS_ctx.form.content),
    type: "textarea",
    rows: (5),
    placeholder: "通知正文",
    maxlength: "500",
    showWordLimit: true,
}));
const __VLS_54 = __VLS_53({
    modelValue: (__VLS_ctx.form.content),
    type: "textarea",
    rows: (5),
    placeholder: "通知正文",
    maxlength: "500",
    showWordLimit: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
var __VLS_51;
const __VLS_56 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    label: "跳转链接（可选）",
}));
const __VLS_58 = __VLS_57({
    label: "跳转链接（可选）",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
__VLS_59.slots.default;
const __VLS_60 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    modelValue: (__VLS_ctx.form.link),
    placeholder: "/pages/…",
}));
const __VLS_62 = __VLS_61({
    modelValue: (__VLS_ctx.form.link),
    placeholder: "/pages/…",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
var __VLS_59;
const __VLS_64 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({}));
const __VLS_66 = __VLS_65({}, ...__VLS_functionalComponentArgsRest(__VLS_65));
__VLS_67.slots.default;
const __VLS_68 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.sending),
    ...{ style: {} },
}));
const __VLS_70 = __VLS_69({
    ...{ 'onClick': {} },
    type: "primary",
    loading: (__VLS_ctx.sending),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
let __VLS_72;
let __VLS_73;
let __VLS_74;
const __VLS_75 = {
    onClick: (__VLS_ctx.sendBroadcast)
};
__VLS_71.slots.default;
var __VLS_71;
var __VLS_67;
var __VLS_15;
var __VLS_11;
var __VLS_7;
const __VLS_76 = {}.ElCol;
/** @type {[typeof __VLS_components.ElCol, typeof __VLS_components.elCol, typeof __VLS_components.ElCol, typeof __VLS_components.elCol, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    span: (14),
}));
const __VLS_78 = __VLS_77({
    span: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
__VLS_79.slots.default;
const __VLS_80 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
    shadow: "never",
}));
const __VLS_82 = __VLS_81({
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_81));
__VLS_83.slots.default;
{
    const { header: __VLS_thisSlot } = __VLS_83.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    const __VLS_84 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        ...{ 'onClick': {} },
        size: "small",
    }));
    const __VLS_86 = __VLS_85({
        ...{ 'onClick': {} },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    let __VLS_88;
    let __VLS_89;
    let __VLS_90;
    const __VLS_91 = {
        onClick: (__VLS_ctx.loadHistory)
    };
    __VLS_87.slots.default;
    var __VLS_87;
}
const __VLS_92 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    data: (__VLS_ctx.history),
    stripe: true,
    ...{ style: {} },
    maxHeight: "520",
}));
const __VLS_94 = __VLS_93({
    data: (__VLS_ctx.history),
    stripe: true,
    ...{ style: {} },
    maxHeight: "520",
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loadingHistory) }, null, null);
__VLS_95.slots.default;
const __VLS_96 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    prop: "notificationId",
    label: "ID",
    width: "70",
}));
const __VLS_98 = __VLS_97({
    prop: "notificationId",
    label: "ID",
    width: "70",
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
const __VLS_100 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
    prop: "type",
    label: "类型",
    width: "130",
}));
const __VLS_102 = __VLS_101({
    prop: "type",
    label: "类型",
    width: "130",
}, ...__VLS_functionalComponentArgsRest(__VLS_101));
__VLS_103.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_103.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_104 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        type: (row.type === 'ADMIN_BROADCAST' ? 'warning' : 'info'),
        size: "small",
    }));
    const __VLS_106 = __VLS_105({
        type: (row.type === 'ADMIN_BROADCAST' ? 'warning' : 'info'),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    __VLS_107.slots.default;
    (row.type);
    var __VLS_107;
}
var __VLS_103;
const __VLS_108 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
    prop: "title",
    label: "标题",
    showOverflowTooltip: true,
}));
const __VLS_110 = __VLS_109({
    prop: "title",
    label: "标题",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_109));
const __VLS_112 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    prop: "createdAt",
    label: "发送时间",
    width: "175",
}));
const __VLS_114 = __VLS_113({
    prop: "createdAt",
    label: "发送时间",
    width: "175",
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
var __VLS_95;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pager" },
});
const __VLS_116 = {}.ElPagination;
/** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
// @ts-ignore
const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.histPage),
    pageSize: (__VLS_ctx.histPageSize),
    total: (__VLS_ctx.histTotal),
    layout: "total, prev, pager, next",
}));
const __VLS_118 = __VLS_117({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.histPage),
    pageSize: (__VLS_ctx.histPageSize),
    total: (__VLS_ctx.histTotal),
    layout: "total, prev, pager, next",
}, ...__VLS_functionalComponentArgsRest(__VLS_117));
let __VLS_120;
let __VLS_121;
let __VLS_122;
const __VLS_123 = {
    onCurrentChange: (__VLS_ctx.loadHistory)
};
var __VLS_119;
var __VLS_83;
var __VLS_79;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['pager']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            targetMode: targetMode,
            form: form,
            sending: sending,
            history: history,
            loadingHistory: loadingHistory,
            histPage: histPage,
            histPageSize: histPageSize,
            histTotal: histTotal,
            sendBroadcast: sendBroadcast,
            loadHistory: loadHistory,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
