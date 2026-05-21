import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/api';
const loading = ref(false);
const users = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const searchQ = ref('');
const banDialog = ref(false);
const banTarget = ref(null);
const banReason = ref('');
const banLoading = ref(false);
const broadcastDialog = ref(false);
const broadcastLoading = ref(false);
const broadcast = ref({ userId: '', title: '', content: '', link: '' });
const loadUsers = async () => {
    loading.value = true;
    try {
        const params = { page: page.value - 1, size: pageSize.value };
        if (searchQ.value.trim())
            params.q = searchQ.value.trim();
        const data = await http.get('/api/admin/users', { params }).then((r) => r);
        users.value = data.content;
        total.value = data.totalElements;
    }
    catch (e) {
        ElMessage.error(e?.message || 'Failed to load users');
    }
    finally {
        loading.value = false;
    }
};
const openBan = (row) => {
    banTarget.value = row;
    banReason.value = '';
    banDialog.value = true;
};
const doConfirmBan = async () => {
    if (!banTarget.value)
        return;
    banLoading.value = true;
    try {
        await http.post(`/api/admin/users/${banTarget.value.userId}/ban`, { reason: banReason.value });
        ElMessage.success(`User #${banTarget.value.userId} banned`);
        banDialog.value = false;
        loadUsers();
    }
    catch (e) {
        ElMessage.error(e?.message || 'Ban failed');
    }
    finally {
        banLoading.value = false;
    }
};
const doUnban = async (row) => {
    try {
        await http.post(`/api/admin/users/${row.userId}/unban`);
        ElMessage.success(`User #${row.userId} unbanned`);
        loadUsers();
    }
    catch (e) {
        ElMessage.error(e?.message || 'Unban failed');
    }
};
const openBroadcast = () => {
    broadcast.value = { userId: '', title: '', content: '', link: '' };
    broadcastDialog.value = true;
};
const doSendBroadcast = async () => {
    if (!broadcast.value.title || !broadcast.value.content) {
        ElMessage.warning('Title and content are required');
        return;
    }
    broadcastLoading.value = true;
    try {
        const body = {
            title: broadcast.value.title,
            content: broadcast.value.content,
            link: broadcast.value.link || null,
            userId: broadcast.value.userId ? Number(broadcast.value.userId) : null,
        };
        const count = await http.post('/api/admin/broadcast', body).then((r) => r);
        ElMessage.success(`Broadcast sent to ${count} user(s)`);
        broadcastDialog.value = false;
    }
    catch (e) {
        ElMessage.error(e?.message || 'Broadcast failed');
    }
    finally {
        broadcastLoading.value = false;
    }
};
onMounted(() => loadUsers());
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
const __VLS_0 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onKeyup': {} },
    ...{ 'onClear': {} },
    modelValue: (__VLS_ctx.searchQ),
    placeholder: "Search by nickname…",
    ...{ style: {} },
    clearable: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onKeyup': {} },
    ...{ 'onClear': {} },
    modelValue: (__VLS_ctx.searchQ),
    placeholder: "Search by nickname…",
    ...{ style: {} },
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onKeyup: (__VLS_ctx.loadUsers)
};
const __VLS_8 = {
    onClear: (__VLS_ctx.loadUsers)
};
var __VLS_3;
const __VLS_9 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ 'onClick': {} },
    type: "primary",
}));
const __VLS_11 = __VLS_10({
    ...{ 'onClick': {} },
    type: "primary",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_13;
let __VLS_14;
let __VLS_15;
const __VLS_16 = {
    onClick: (__VLS_ctx.loadUsers)
};
__VLS_12.slots.default;
var __VLS_12;
const __VLS_17 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
    ...{ 'onClick': {} },
}));
const __VLS_19 = __VLS_18({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_18));
let __VLS_21;
let __VLS_22;
let __VLS_23;
const __VLS_24 = {
    onClick: (__VLS_ctx.openBroadcast)
};
__VLS_20.slots.default;
var __VLS_20;
const __VLS_25 = {}.ElTable;
/** @type {[typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    data: (__VLS_ctx.users),
    stripe: true,
    border: true,
    ...{ style: {} },
}));
const __VLS_27 = __VLS_26({
    data: (__VLS_ctx.users),
    stripe: true,
    border: true,
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_asFunctionalDirective(__VLS_directives.vLoading)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.loading) }, null, null);
__VLS_28.slots.default;
const __VLS_29 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({
    prop: "userId",
    label: "ID",
    width: "80",
}));
const __VLS_31 = __VLS_30({
    prop: "userId",
    label: "ID",
    width: "80",
}, ...__VLS_functionalComponentArgsRest(__VLS_30));
const __VLS_33 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    prop: "nickname",
    label: "Nickname",
}));
const __VLS_35 = __VLS_34({
    prop: "nickname",
    label: "Nickname",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
const __VLS_37 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_38 = __VLS_asFunctionalComponent(__VLS_37, new __VLS_37({
    prop: "school",
    label: "School",
}));
const __VLS_39 = __VLS_38({
    prop: "school",
    label: "School",
}, ...__VLS_functionalComponentArgsRest(__VLS_38));
const __VLS_41 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    prop: "major",
    label: "Major",
}));
const __VLS_43 = __VLS_42({
    prop: "major",
    label: "Major",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
const __VLS_45 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    label: "Status",
    width: "110",
}));
const __VLS_47 = __VLS_46({
    label: "Status",
    width: "110",
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_48.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    const __VLS_49 = {}.ElTag;
    /** @type {[typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        type: (row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'),
    }));
    const __VLS_51 = __VLS_50({
        type: (row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    __VLS_52.slots.default;
    (row.status === 1 ? 'Active' : row.status === 2 ? 'Banned' : 'Inactive');
    var __VLS_52;
}
var __VLS_48;
const __VLS_53 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    prop: "bannedReason",
    label: "Ban Reason",
    showOverflowTooltip: true,
}));
const __VLS_55 = __VLS_54({
    prop: "bannedReason",
    label: "Ban Reason",
    showOverflowTooltip: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
const __VLS_57 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({
    prop: "createdAt",
    label: "Registered",
    width: "170",
}));
const __VLS_59 = __VLS_58({
    prop: "createdAt",
    label: "Registered",
    width: "170",
}, ...__VLS_functionalComponentArgsRest(__VLS_58));
const __VLS_61 = {}.ElTableColumn;
/** @type {[typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    label: "Actions",
    width: "180",
    fixed: "right",
}));
const __VLS_63 = __VLS_62({
    label: "Actions",
    width: "180",
    fixed: "right",
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
__VLS_64.slots.default;
{
    const { default: __VLS_thisSlot } = __VLS_64.slots;
    const [{ row }] = __VLS_getSlotParams(__VLS_thisSlot);
    if (row.status !== 2) {
        const __VLS_65 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }));
        const __VLS_67 = __VLS_66({
            ...{ 'onClick': {} },
            size: "small",
            type: "danger",
        }, ...__VLS_functionalComponentArgsRest(__VLS_66));
        let __VLS_69;
        let __VLS_70;
        let __VLS_71;
        const __VLS_72 = {
            onClick: (...[$event]) => {
                if (!(row.status !== 2))
                    return;
                __VLS_ctx.openBan(row);
            }
        };
        __VLS_68.slots.default;
        var __VLS_68;
    }
    else {
        const __VLS_73 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }));
        const __VLS_75 = __VLS_74({
            ...{ 'onClick': {} },
            size: "small",
            type: "success",
        }, ...__VLS_functionalComponentArgsRest(__VLS_74));
        let __VLS_77;
        let __VLS_78;
        let __VLS_79;
        const __VLS_80 = {
            onClick: (...[$event]) => {
                if (!!(row.status !== 2))
                    return;
                __VLS_ctx.doUnban(row);
            }
        };
        __VLS_76.slots.default;
        var __VLS_76;
    }
}
var __VLS_64;
var __VLS_28;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pager" },
});
const __VLS_81 = {}.ElPagination;
/** @type {[typeof __VLS_components.ElPagination, typeof __VLS_components.elPagination, ]} */ ;
// @ts-ignore
const __VLS_82 = __VLS_asFunctionalComponent(__VLS_81, new __VLS_81({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.page),
    pageSize: (__VLS_ctx.pageSize),
    total: (__VLS_ctx.total),
    layout: "total, prev, pager, next",
}));
const __VLS_83 = __VLS_82({
    ...{ 'onCurrentChange': {} },
    currentPage: (__VLS_ctx.page),
    pageSize: (__VLS_ctx.pageSize),
    total: (__VLS_ctx.total),
    layout: "total, prev, pager, next",
}, ...__VLS_functionalComponentArgsRest(__VLS_82));
let __VLS_85;
let __VLS_86;
let __VLS_87;
const __VLS_88 = {
    onCurrentChange: (__VLS_ctx.loadUsers)
};
var __VLS_84;
const __VLS_89 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_90 = __VLS_asFunctionalComponent(__VLS_89, new __VLS_89({
    modelValue: (__VLS_ctx.banDialog),
    title: "Ban User",
    width: "420px",
}));
const __VLS_91 = __VLS_90({
    modelValue: (__VLS_ctx.banDialog),
    title: "Ban User",
    width: "420px",
}, ...__VLS_functionalComponentArgsRest(__VLS_90));
__VLS_92.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.banTarget?.nickname);
(__VLS_ctx.banTarget?.userId);
const __VLS_93 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
    modelValue: (__VLS_ctx.banReason),
    placeholder: "Enter ban reason…",
    type: "textarea",
    rows: (3),
}));
const __VLS_95 = __VLS_94({
    modelValue: (__VLS_ctx.banReason),
    placeholder: "Enter ban reason…",
    type: "textarea",
    rows: (3),
}, ...__VLS_functionalComponentArgsRest(__VLS_94));
{
    const { footer: __VLS_thisSlot } = __VLS_92.slots;
    const __VLS_97 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_98 = __VLS_asFunctionalComponent(__VLS_97, new __VLS_97({
        ...{ 'onClick': {} },
    }));
    const __VLS_99 = __VLS_98({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_98));
    let __VLS_101;
    let __VLS_102;
    let __VLS_103;
    const __VLS_104 = {
        onClick: (...[$event]) => {
            __VLS_ctx.banDialog = false;
        }
    };
    __VLS_100.slots.default;
    var __VLS_100;
    const __VLS_105 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_106 = __VLS_asFunctionalComponent(__VLS_105, new __VLS_105({
        ...{ 'onClick': {} },
        type: "danger",
        loading: (__VLS_ctx.banLoading),
    }));
    const __VLS_107 = __VLS_106({
        ...{ 'onClick': {} },
        type: "danger",
        loading: (__VLS_ctx.banLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_106));
    let __VLS_109;
    let __VLS_110;
    let __VLS_111;
    const __VLS_112 = {
        onClick: (__VLS_ctx.doConfirmBan)
    };
    __VLS_108.slots.default;
    var __VLS_108;
}
var __VLS_92;
const __VLS_113 = {}.ElDialog;
/** @type {[typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ]} */ ;
// @ts-ignore
const __VLS_114 = __VLS_asFunctionalComponent(__VLS_113, new __VLS_113({
    modelValue: (__VLS_ctx.broadcastDialog),
    title: "Admin Broadcast",
    width: "480px",
}));
const __VLS_115 = __VLS_114({
    modelValue: (__VLS_ctx.broadcastDialog),
    title: "Admin Broadcast",
    width: "480px",
}, ...__VLS_functionalComponentArgsRest(__VLS_114));
__VLS_116.slots.default;
const __VLS_117 = {}.ElForm;
/** @type {[typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ]} */ ;
// @ts-ignore
const __VLS_118 = __VLS_asFunctionalComponent(__VLS_117, new __VLS_117({
    labelPosition: "top",
}));
const __VLS_119 = __VLS_118({
    labelPosition: "top",
}, ...__VLS_functionalComponentArgsRest(__VLS_118));
__VLS_120.slots.default;
const __VLS_121 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_122 = __VLS_asFunctionalComponent(__VLS_121, new __VLS_121({
    label: "Target",
}));
const __VLS_123 = __VLS_122({
    label: "Target",
}, ...__VLS_functionalComponentArgsRest(__VLS_122));
__VLS_124.slots.default;
const __VLS_125 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_126 = __VLS_asFunctionalComponent(__VLS_125, new __VLS_125({
    modelValue: (__VLS_ctx.broadcast.userId),
    placeholder: "User ID (leave blank to send to all active users)",
}));
const __VLS_127 = __VLS_126({
    modelValue: (__VLS_ctx.broadcast.userId),
    placeholder: "User ID (leave blank to send to all active users)",
}, ...__VLS_functionalComponentArgsRest(__VLS_126));
var __VLS_124;
const __VLS_129 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_130 = __VLS_asFunctionalComponent(__VLS_129, new __VLS_129({
    label: "Title",
}));
const __VLS_131 = __VLS_130({
    label: "Title",
}, ...__VLS_functionalComponentArgsRest(__VLS_130));
__VLS_132.slots.default;
const __VLS_133 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_134 = __VLS_asFunctionalComponent(__VLS_133, new __VLS_133({
    modelValue: (__VLS_ctx.broadcast.title),
    placeholder: "Notification title",
}));
const __VLS_135 = __VLS_134({
    modelValue: (__VLS_ctx.broadcast.title),
    placeholder: "Notification title",
}, ...__VLS_functionalComponentArgsRest(__VLS_134));
var __VLS_132;
const __VLS_137 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_138 = __VLS_asFunctionalComponent(__VLS_137, new __VLS_137({
    label: "Content",
}));
const __VLS_139 = __VLS_138({
    label: "Content",
}, ...__VLS_functionalComponentArgsRest(__VLS_138));
__VLS_140.slots.default;
const __VLS_141 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_142 = __VLS_asFunctionalComponent(__VLS_141, new __VLS_141({
    modelValue: (__VLS_ctx.broadcast.content),
    type: "textarea",
    rows: (3),
    placeholder: "Notification content",
}));
const __VLS_143 = __VLS_142({
    modelValue: (__VLS_ctx.broadcast.content),
    type: "textarea",
    rows: (3),
    placeholder: "Notification content",
}, ...__VLS_functionalComponentArgsRest(__VLS_142));
var __VLS_140;
const __VLS_145 = {}.ElFormItem;
/** @type {[typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ]} */ ;
// @ts-ignore
const __VLS_146 = __VLS_asFunctionalComponent(__VLS_145, new __VLS_145({
    label: "Link (optional)",
}));
const __VLS_147 = __VLS_146({
    label: "Link (optional)",
}, ...__VLS_functionalComponentArgsRest(__VLS_146));
__VLS_148.slots.default;
const __VLS_149 = {}.ElInput;
/** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
// @ts-ignore
const __VLS_150 = __VLS_asFunctionalComponent(__VLS_149, new __VLS_149({
    modelValue: (__VLS_ctx.broadcast.link),
    placeholder: "/pages/…",
}));
const __VLS_151 = __VLS_150({
    modelValue: (__VLS_ctx.broadcast.link),
    placeholder: "/pages/…",
}, ...__VLS_functionalComponentArgsRest(__VLS_150));
var __VLS_148;
var __VLS_120;
{
    const { footer: __VLS_thisSlot } = __VLS_116.slots;
    const __VLS_153 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_154 = __VLS_asFunctionalComponent(__VLS_153, new __VLS_153({
        ...{ 'onClick': {} },
    }));
    const __VLS_155 = __VLS_154({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_154));
    let __VLS_157;
    let __VLS_158;
    let __VLS_159;
    const __VLS_160 = {
        onClick: (...[$event]) => {
            __VLS_ctx.broadcastDialog = false;
        }
    };
    __VLS_156.slots.default;
    var __VLS_156;
    const __VLS_161 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_162 = __VLS_asFunctionalComponent(__VLS_161, new __VLS_161({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.broadcastLoading),
    }));
    const __VLS_163 = __VLS_162({
        ...{ 'onClick': {} },
        type: "primary",
        loading: (__VLS_ctx.broadcastLoading),
    }, ...__VLS_functionalComponentArgsRest(__VLS_162));
    let __VLS_165;
    let __VLS_166;
    let __VLS_167;
    const __VLS_168 = {
        onClick: (__VLS_ctx.doSendBroadcast)
    };
    __VLS_164.slots.default;
    var __VLS_164;
}
var __VLS_116;
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['pager']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loading: loading,
            users: users,
            total: total,
            page: page,
            pageSize: pageSize,
            searchQ: searchQ,
            banDialog: banDialog,
            banTarget: banTarget,
            banReason: banReason,
            banLoading: banLoading,
            broadcastDialog: broadcastDialog,
            broadcastLoading: broadcastLoading,
            broadcast: broadcast,
            loadUsers: loadUsers,
            openBan: openBan,
            doConfirmBan: doConfirmBan,
            doUnban: doUnban,
            openBroadcast: openBroadcast,
            doSendBroadcast: doSendBroadcast,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
