import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/api';
const logs = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(30);
const total = ref(0);
const filterType = ref('');
const detailDialog = ref(false);
const selected = ref(null);
const loadLogs = async () => {
    loading.value = true;
    try {
        const params = {
            page: page.value - 1,
            size: pageSize.value,
        };
        if (filterType.value)
            params.targetType = filterType.value;
        const data = await http.get('/api/admin/audit-log', { params });
        logs.value = data.content ?? [];
        total.value = data.totalElements ?? 0;
    }
    catch (e) {
        ElMessage.error(e?.message || '加载失败');
    }
    finally {
        loading.value = false;
    }
};
const viewDetail = (row) => {
    selected.value = row;
    detailDialog.value = true;
};
const actionTagType = (action) => {
    if (action.startsWith('DELETE'))
        return 'danger';
    if (action.startsWith('BAN'))
        return 'warning';
    if (action.startsWith('UNBAN'))
        return 'success';
    if (action.startsWith('CREATE'))
        return 'success';
    return '';
};
const fmtJson = (str) => {
    if (!str)
        return '';
    try {
        return JSON.stringify(JSON.parse(str), null, 2);
    }
    catch {
        return str;
    }
};
onMounted(() => loadLogs());
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toolbar" },
});
const __VLS_0 = {}.ElSelect;
/** @type {[typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, typeof __VLS_components.ElSelect, typeof __VLS_components.elSelect, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.filterType),
    placeholder: "全部类型",
    clearable: true,
    ...{ style: {} },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.filterType),
    placeholder: "全部类型",
    clearable: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onChange: (__VLS_ctx.loadLogs)
};
__VLS_3.slots.default;
const __VLS_8 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    label: "USER",
    value: "USER",
}));
const __VLS_10 = __VLS_9({
    label: "USER",
    value: "USER",
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
const __VLS_12 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    label: "QUESTION",
    value: "QUESTION",
}));
const __VLS_14 = __VLS_13({
    label: "QUESTION",
    value: "QUESTION",
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const __VLS_16 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    label: "HOME_ARTICLE",
    value: "HOME_ARTICLE",
}));
const __VLS_18 = __VLS_17({
    label: "HOME_ARTICLE",
    value: "HOME_ARTICLE",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
const __VLS_20 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    label: "HOME_VIDEO",
    value: "HOME_VIDEO",
}));
const __VLS_22 = __VLS_21({
    label: "HOME_VIDEO",
    value: "HOME_VIDEO",
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
const __VLS_24 = {}.ElOption;
/** @type {[typeof __VLS_components.ElOption, typeof __VLS_components.elOption, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    label: "NOTIFICATION",
    value: "NOTIFICATION",
}));
const __VLS_26 = __VLS_25({
    label: "NOTIFICATION",
    value: "NOTIFICATION",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
var __VLS_3;
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
    onClick: (__VLS_ctx.loadLogs)
};
__VLS_31.slots.default;
var __VLS_31;
const __VLS_36 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
    data: (__VLS_ctx.logs),
    stripe: true,
    border: true,
    ...{ style: {} },
}));
const __VLS_38 = __VLS_37({
    data: (__VLS_ctx.logs),
    stripe: true,
    border: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_37));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_39.slots.default;
const __VLS_40 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    prop: "id",
    label: "ID",
    width: "70",
}));
const __VLS_42 = __VLS_41({
    prop: "id",
    label: "ID",
    width: "70",
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
const __VLS_44 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    prop: "adminId",
    label: "管理员 ID",
    width: "100",
}));
const __VLS_46 = __VLS_45({
    prop: "adminId",
    label: "管理员 ID",
    width: "100",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
const __VLS_48 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    prop: "action",
    label: "操作",
    width: "160",
}));
const __VLS_50 = __VLS_49({
    prop: "action",
    label: "操作",
    width: "160",
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
__VLS_51.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_51.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_52 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        type: (__VLS_ctx.actionTagType(row.action)),
        size: "small",
        effect: "plain",
    }));
    const __VLS_54 = __VLS_53({
        type: (__VLS_ctx.actionTagType(row.action)),
        size: "small",
        effect: "plain",
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    (row.action);
    var __VLS_55;
}
var __VLS_51;
const __VLS_56 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
    prop: "targetType",
    label: "对象类型",
    width: "130",
}));
const __VLS_58 = __VLS_57({
    prop: "targetType",
    label: "对象类型",
    width: "130",
}, ...__VLS_functionalComponentArgsRest(__VLS_57));
const __VLS_60 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    prop: "targetId",
    label: "对象 ID",
    width: "90",
}));
const __VLS_62 = __VLS_61({
    prop: "targetId",
    label: "对象 ID",
    width: "90",
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
const __VLS_64 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
    prop: "ip",
    label: "IP",
    width: "130",
}));
const __VLS_66 = __VLS_65({
    prop: "ip",
    label: "IP",
    width: "130",
}, ...__VLS_functionalComponentArgsRest(__VLS_65));
const __VLS_68 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    prop: "createdAt",
    label: "时间",
    width: "175",
}));
const __VLS_70 = __VLS_69({
    prop: "createdAt",
    label: "时间",
    width: "175",
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
const __VLS_72 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
    label: "详情",
    fixed: "right",
    width: "80",
}));
const __VLS_74 = __VLS_73({
    label: "详情",
    fixed: "right",
    width: "80",
}, ...__VLS_functionalComponentArgsRest(__VLS_73));
__VLS_75.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_75.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_76 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        ...{ 'onClick': {} },
        size: "small",
    }));
    const __VLS_78 = __VLS_77({
        ...{ 'onClick': {} },
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    let __VLS_80;
    let __VLS_81;
    let __VLS_82;
    const __VLS_83 = {
        onClick: (...[$event]) => {
            __VLS_ctx.viewDetail(row);
        }
    };
    __VLS_79.slots.default;
    var __VLS_79;
}
var __VLS_75;
var __VLS_39;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pager" },
});
const __VLS_84 = {}.ElPagination;
/** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.page),
    pageSize: (__VLS_ctx.pageSize),
    total: (__VLS_ctx.total),
    layout: "total, prev, pager, next",
}));
const __VLS_86 = __VLS_85({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.page),
    pageSize: (__VLS_ctx.pageSize),
    total: (__VLS_ctx.total),
    layout: "total, prev, pager, next",
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
let __VLS_88;
let __VLS_89;
let __VLS_90;
const __VLS_91 = {
    onCurrentChange: (__VLS_ctx.loadLogs)
};
var __VLS_87;
const __VLS_92 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    modelValue: (__VLS_ctx.detailDialog),
    title: "操作详情",
    width: "620px",
}));
const __VLS_94 = __VLS_93({
    modelValue: (__VLS_ctx.detailDialog),
    title: "操作详情",
    width: "620px",
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
__VLS_95.slots.default;
if (__VLS_ctx.selected) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    const __VLS_96 = {}.ElDescriptions;
    /** @type {[typeof __VLS_components.ElDescriptions, typeof __VLS_components.elDescriptions, typeof __VLS_components.ElDescriptions, typeof __VLS_components.elDescriptions, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        column: (2),
        border: true,
        size: "small",
    }));
    const __VLS_98 = __VLS_97({
        column: (2),
        border: true,
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    __VLS_99.slots.default;
    const __VLS_100 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        label: "ID",
    }));
    const __VLS_102 = __VLS_101({
        label: "ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    __VLS_103.slots.default;
    (__VLS_ctx.selected.id);
    var __VLS_103;
    const __VLS_104 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        label: "管理员 ID",
    }));
    const __VLS_106 = __VLS_105({
        label: "管理员 ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    __VLS_107.slots.default;
    (__VLS_ctx.selected.adminId);
    var __VLS_107;
    const __VLS_108 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        label: "操作",
    }));
    const __VLS_110 = __VLS_109({
        label: "操作",
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    __VLS_111.slots.default;
    (__VLS_ctx.selected.action);
    var __VLS_111;
    const __VLS_112 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        label: "对象类型",
    }));
    const __VLS_114 = __VLS_113({
        label: "对象类型",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    __VLS_115.slots.default;
    (__VLS_ctx.selected.targetType);
    var __VLS_115;
    const __VLS_116 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        label: "对象 ID",
    }));
    const __VLS_118 = __VLS_117({
        label: "对象 ID",
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    __VLS_119.slots.default;
    (__VLS_ctx.selected.targetId);
    var __VLS_119;
    const __VLS_120 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        label: "IP",
    }));
    const __VLS_122 = __VLS_121({
        label: "IP",
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    __VLS_123.slots.default;
    (__VLS_ctx.selected.ip);
    var __VLS_123;
    const __VLS_124 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        label: "User-Agent",
        span: (2),
    }));
    const __VLS_126 = __VLS_125({
        label: "User-Agent",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    __VLS_127.slots.default;
    (__VLS_ctx.selected.ua);
    var __VLS_127;
    const __VLS_128 = {}.ElDescriptionsItem;
    /** @type {[typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, typeof __VLS_components.ElDescriptionsItem, typeof __VLS_components.elDescriptionsItem, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        label: "时间",
        span: (2),
    }));
    const __VLS_130 = __VLS_129({
        label: "时间",
        span: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    __VLS_131.slots.default;
    (__VLS_ctx.selected.createdAt);
    var __VLS_131;
    var __VLS_99;
    if (__VLS_ctx.selected.beforeJson || __VLS_ctx.selected.afterJson) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_132 = {}.ElTabs;
        /** @type {[typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, typeof __VLS_components.ElTabs, typeof __VLS_components.elTabs, ]} */ ;
        // @ts-ignore
        const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({}));
        const __VLS_134 = __VLS_133({}, ...__VLS_functionalComponentArgsRest(__VLS_133));
        __VLS_135.slots.default;
        if (__VLS_ctx.selected.beforeJson) {
            const __VLS_136 = {}.ElTabPane;
            /** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
            // @ts-ignore
            const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
                label: "变更前",
            }));
            const __VLS_138 = __VLS_137({
                label: "变更前",
            }, ...__VLS_functionalComponentArgsRest(__VLS_137));
            __VLS_139.slots.default;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
                ...{ class: "json-block" },
            });
            (__VLS_ctx.fmtJson(__VLS_ctx.selected.beforeJson));
            var __VLS_139;
        }
        if (__VLS_ctx.selected.afterJson) {
            const __VLS_140 = {}.ElTabPane;
            /** @type {[typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, typeof __VLS_components.ElTabPane, typeof __VLS_components.elTabPane, ]} */ ;
            // @ts-ignore
            const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
                label: "变更后",
            }));
            const __VLS_142 = __VLS_141({
                label: "变更后",
            }, ...__VLS_functionalComponentArgsRest(__VLS_141));
            __VLS_143.slots.default;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
                ...{ class: "json-block" },
            });
            (__VLS_ctx.fmtJson(__VLS_ctx.selected.afterJson));
            var __VLS_143;
        }
        var __VLS_135;
    }
}
var __VLS_95;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['pager']} */ ;
/** @type {__VLS_StyleScopedClasses['json-block']} */ ;
/** @type {__VLS_StyleScopedClasses['json-block']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            logs: logs,
            loading: loading,
            page: page,
            pageSize: pageSize,
            total: total,
            filterType: filterType,
            detailDialog: detailDialog,
            selected: selected,
            loadLogs: loadLogs,
            viewDetail: viewDetail,
            actionTagType: actionTagType,
            fmtJson: fmtJson,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
